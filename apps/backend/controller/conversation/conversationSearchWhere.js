/**
 * conversationSearchWhere.js
 * Pure helper module for conversation search where-clause generation
 * and content token extraction.
 */

/**
 * Hard server-side deadline for the message-content search (the SPA aborts at 30s;
 * we fail faster with a clear message instead of letting the request hang).
 * Must stay at or below the 5s acceptance target for message search.
 */
const SEARCH_STATEMENT_TIMEOUT_MS = 5000;

/**
 * Hard ceiling on how many distinct conversations a message-content search may
 * feed back into the conversation query. It is a memory/parameter guard only
 * (Postgres allows 65535 bind params) — NOT a result cap: a merchant whose term
 * matches fewer conversations always gets every match. The old 1000-message-row
 * cap inside the CTE silently dropped ~90% of a busy merchant's matches.
 */
const SEARCH_MAX_CONVERSATIONS = 5000;

/**
 * Extracts tokens eligible for trigram-indexed message content search (length >= 3).
 * @param {string|unknown} rawTerm
 * @returns {string[]}
 */
function extractContentTokens(rawTerm) {
    const term = String(rawTerm ?? '').trim();
    if (!term) {
        return [];
    }
    return term.split(/\s+/).filter(t => t.length >= 3);
}

/**
 * Builds Prisma where fragment for conversation search across preview, name, and phone.
 * @param {string|unknown} rawTerm
 * @returns {object|null}
 */
function buildConversationSearchWhere(rawTerm) {
    if (rawTerm === null || rawTerm === undefined) {
        return null;
    }
    const term = String(rawTerm).trim();
    if (!term) {
        return null;
    }

    let tokens = term.split(/\s+/).filter(t => t.length >= 2);
    if (tokens.length === 0) {
        tokens = [term];
    }

    const andGroups = tokens.map(token => ({
        OR: [
            { lastMessagePreview: { contains: token, mode: 'insensitive' } },
            { customer: { firstName: { contains: token, mode: 'insensitive' } } },
            { customer: { lastName: { contains: token, mode: 'insensitive' } } },
            { customer: { phone: { contains: token } } },
        ]
    }));

    return { AND: andGroups };
}

/**
 * Searches messages for matching content tokens using the PostgreSQL GIN trigram
 * index `idx_messages_content_trgm` (created by scripts/ensure_trgm_indexes.sql).
 * The tenant filter (`companyId`, and `channel` when given) is applied INSIDE the
 * CTE, and the CTE aggregates one row per conversation instead of capping raw
 * message rows — so another tenant's messages can never crowd out the caller's
 * matches and a conversation whose only hit is old is not dropped.
 * Conversations are ordered by their most recent matching message.
 *
 * Database failures are propagated to the caller (no silent empty result): the
 * controller turns them into HTTP 422 (`MESSAGE_SEARCH_TIMEOUT`/`MESSAGE_SEARCH_UNAVAILABLE`)
 * so the user never sees "no results" for a query that actually failed.
 *
 * @param {object} prisma - PrismaClient instance
 * @param {object} params
 * @param {string} params.companyId
 * @param {string} [params.channel]
 * @param {string} params.search - raw search term
 * @param {number|string} [params.days=180] - time limit in days (default: 180 days)
 * @param {number|string} [params.limit] - maximum distinct conversation IDs
 *        (default and ceiling: SEARCH_MAX_CONVERSATIONS)
 * @returns {Promise<string[]>} array of conversation IDs
 * @throws {Error} when the underlying query fails (timeout, missing index, connection)
 */
async function searchMessageConversationIds(prisma, { companyId, channel, search, days = 180, limit = SEARCH_MAX_CONVERSATIONS }) {
    if (!prisma || !search || !companyId) {
        return [];
    }
    const term = String(search).trim().slice(0, 150);
    const contentTokens = extractContentTokens(term).slice(0, 5);
    if (!contentTokens.length) {
        return [];
    }

    const cutoffDays = Math.max(1, Math.min(parseInt(days, 10) || 180, 730));
    const cutoffDate = new Date(Date.now() - cutoffDays * 86400000);
    const maxLimit = Math.max(1, Math.min(parseInt(limit, 10) || SEARCH_MAX_CONVERSATIONS, SEARCH_MAX_CONVERSATIONS));

    // Build parameterized CTE query with escaped wildcards
    const conditions = contentTokens.map((_, i) => `m.content ILIKE $${i + 1}`).join(' AND ');
    const params = contentTokens.map(t => `%${t.replace(/([%_\\])/g, '\\$1')}%`);

    params.push(cutoffDate);
    const dateParamIdx = params.length;

    params.push(companyId);
    const companyParamIdx = params.length;

    let channelClause = '';
    let cteChannelClause = '';
    if (channel) {
        params.push(channel);
        const channelParamIdx = params.length;
        channelClause = `AND c.channel = $${channelParamIdx}`;
        cteChannelClause = `AND c2.channel = $${channelParamIdx}`;
    }

    params.push(maxLimit);
    const limitParamIdx = params.length;

    const query = `
        WITH matched_messages AS (
            SELECT m."conversationId" AS "conversationId", MAX(m."createdAt") AS "lastHitAt"
            FROM messages m
            JOIN conversations c2 ON c2.id = m."conversationId"
            WHERE ${conditions}
              AND m."createdAt" >= $${dateParamIdx}
              AND c2."companyId" = $${companyParamIdx}
              ${cteChannelClause}
            GROUP BY m."conversationId"
            ORDER BY "lastHitAt" DESC
            LIMIT $${limitParamIdx}
        )
        SELECT c.id
        FROM conversations c
        JOIN matched_messages mm ON c.id = mm."conversationId"
        WHERE c."companyId" = $${companyParamIdx}
          ${channelClause}
        ORDER BY mm."lastHitAt" DESC
        LIMIT $${limitParamIdx};
    `;

    const rows = await runWithStatementTimeout(prisma, query, params);
    return rows.map(r => r.id);
}

/**
 * Errors that mean "this pooler refuses the transaction wrapper", not "the query
 * itself failed". Only those are retried on the plain path; a deadline/cancel
 * error must never be retried (gate-4 BLOCKER, 2026-11-25).
 */
const TX_WRAPPER_ERROR = /transaction|pooler|pool|prepared statement|connection|closed|P2024|P2028/i;
/** Cancel/timeout errors: the query already burned its budget — surface them. */
const DEADLINE_ERROR = /timeout|timed out|cancel|P2034/i;

/**
 * Runs the raw search with a hard deadline instead of relying on the pooler/role
 * default (the SPA gives up at 30s).
 *
 * Preferred path: a single pipelined (array-form) transaction — BEGIN + SET LOCAL +
 * query are sent as one batch to the pooler, so the pooled server connection is
 * held only for that round trip. The callback form (`$transaction(async tx => ...)`)
 * is avoided on purpose: this repo's PgBouncer hardening removed interactive
 * transactions because they held pool connections and produced 30s
 * `query_wait_timeout` errors.
 *
 * Production fallback (2026-11-25): on a transaction-pooling PgBouncer the array
 * transaction is rejected outright (every content search answered 422
 * MESSAGE_SEARCH_UNAVAILABLE in <1s after 9d7bfd922 shipped, while the plain path
 * worked before it). A rejected *wrapper* is retried as a plain `$queryRawUnsafe`
 * that keeps the same hard deadline through a client-side race, so a slow query
 * still fails as MESSAGE_SEARCH_TIMEOUT at ~5s instead of hanging to the SPA's 30s.
 * Timeout/cancel errors are never retried, and a broken query still throws.
 * Simple/mock clients without `$transaction` use the plain call directly.
 */
async function runWithStatementTimeout(prisma, query, params, timeoutMs = SEARCH_STATEMENT_TIMEOUT_MS) {
    if (typeof prisma.$transaction === 'function' && typeof prisma.$executeRawUnsafe === 'function') {
        try {
            const [, rows] = await prisma.$transaction([
                prisma.$executeRawUnsafe(`SET LOCAL statement_timeout = ${Number(timeoutMs)}`),
                prisma.$queryRawUnsafe(query, ...params),
            ], { timeout: timeoutMs + 2000 });
            return rows;
        } catch (txErr) {
            const fingerprint = `${(txErr && txErr.message) || ''} ${(txErr && txErr.code) || ''}`;
            if (DEADLINE_ERROR.test(fingerprint) || !TX_WRAPPER_ERROR.test(fingerprint)) {
                throw txErr;
            }
            // Log the driver error CODE only — never raw driver text (PII/statement fragments).
            if (typeof process !== 'undefined' && process.env.DEBUG_CONV_SEARCH === 'true') {
                console.warn('⚠️ [CONV-SEARCH] transaction wrapper rejected (code=%s); retrying with a client deadline',
                    (txErr && txErr.code) || 'unknown');
            }
            return runWithClientDeadline(prisma, query, params, timeoutMs);
        }
    }
    return prisma.$queryRawUnsafe(query, ...params);
}

/**
 * Plain `$queryRawUnsafe` bounded by a client-side deadline. The server query is
 * not cancellable from here, so a late rejection is swallowed to avoid an
 * unhandled-rejection crash; the caller receives a timeout error at `timeoutMs`.
 */
function runWithClientDeadline(prisma, query, params, timeoutMs = SEARCH_STATEMENT_TIMEOUT_MS) {
    const pending = prisma.$queryRawUnsafe(query, ...params);
    if (!pending || typeof pending.then !== 'function') {
        return pending;
    }
    let timer;
    const deadline = new Promise((_, reject) => {
        timer = setTimeout(() => {
            const err = new Error('statement timeout: message content search exceeded its deadline');
            err.code = 'MESSAGE_SEARCH_TIMEOUT';
            reject(err);
        }, Number(timeoutMs));
        if (timer && typeof timer.unref === 'function') {
            timer.unref();
        }
    });
    // Keep the late outcome of the server query from becoming an unhandled rejection.
    pending.catch(() => {});
    return Promise.race([pending, deadline]).finally(() => clearTimeout(timer));
}

module.exports = {
    extractContentTokens,
    buildConversationSearchWhere,
    searchMessageConversationIds,
    SEARCH_STATEMENT_TIMEOUT_MS,
    SEARCH_MAX_CONVERSATIONS,
};

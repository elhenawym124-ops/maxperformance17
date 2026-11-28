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
 * CTE, before the 1000-row cap, so another tenant's messages can never crowd out
 * the caller's matches. Rows are capped to the most recent 1000 hits.
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
 * @param {number|string} [params.limit=200] - maximum distinct conversation IDs (default: 200)
 * @returns {Promise<string[]>} array of conversation IDs
 * @throws {Error} when the underlying query fails (timeout, missing index, connection)
 */
async function searchMessageConversationIds(prisma, { companyId, channel, search, days = 180, limit = 200 }) {
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
    const maxLimit = Math.max(1, Math.min(parseInt(limit, 10) || 200, 500));

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

    // LIMIT is inlined as a clamped integer on purpose: it is validated above,
    // and a literal lets the planner fold it instead of treating the cap as an
    // opaque parameter.
    const query = `
        WITH matched_messages AS (
            SELECT m."conversationId"
            FROM messages m
            JOIN conversations c2 ON c2.id = m."conversationId"
            WHERE ${conditions}
              AND m."createdAt" >= $${dateParamIdx}
              AND c2."companyId" = $${companyParamIdx}
              ${cteChannelClause}
            ORDER BY m."createdAt" DESC
            LIMIT 1000
        )
        SELECT DISTINCT c.id
        FROM conversations c
        JOIN matched_messages mm ON c.id = mm."conversationId"
        WHERE c."companyId" = $${companyParamIdx}
          ${channelClause}
        LIMIT ${maxLimit};
    `;

    const rows = await runWithStatementTimeout(prisma, query, params);
    return rows.map(r => r.id);
}

/**
 * Runs the raw search with a client-side deadline instead of relying on the
 * pooler/role default (the SPA gives up at 30s).
 *
 * IMPORTANT: this deliberately does NOT use `prisma.$transaction`. The shared
 * client returned by getSharedPrismaClient() is a deferred Proxy whose
 * `$`-methods return plain Promises; Prisma rejects plain promises passed to
 * `$transaction` with a client-side validation error that carries no `code`,
 * which surfaced in production as an instant 422 MESSAGE_SEARCH_UNAVAILABLE on
 * every content search. A plain `$queryRawUnsafe` works through the proxy.
 *
 * The deadline is enforced client-side; the server keeps running the indexed,
 * LIMITed query, and the DB role/pooler still applies its own statement_timeout.
 * Simple/mock clients without `$transaction` behave identically.
 */
async function runWithStatementTimeout(prisma, query, params, timeoutMs = SEARCH_STATEMENT_TIMEOUT_MS) {
    const queryPromise = prisma.$queryRawUnsafe(query, ...params);
    let timer;
    try {
        return await Promise.race([
            queryPromise,
            new Promise((_, reject) => {
                timer = setTimeout(
                    () => reject(new Error(`statement timeout: message content search exceeded ${timeoutMs}ms`)),
                    timeoutMs
                );
                if (typeof timer.unref === 'function') timer.unref();
            }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
        // If the deadline won, the DB query may still settle later; swallow its
        // rejection so a late error never becomes an unhandled rejection.
        Promise.resolve(queryPromise).catch(() => {});
    }
}

module.exports = {
    extractContentTokens,
    buildConversationSearchWhere,
    searchMessageConversationIds,
    runWithStatementTimeout,
    SEARCH_STATEMENT_TIMEOUT_MS,
};

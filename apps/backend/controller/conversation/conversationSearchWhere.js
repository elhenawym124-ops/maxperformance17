/**
 * conversationSearchWhere.js
 * Pure helper module for conversation search where-clause generation
 * and content token extraction.
 */

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
 * Searches messages for matching content tokens using PostgreSQL GIN trigram index,
 * bounded by a time cutoff (default: 180 days) and a max distinct conversation ceiling.
 * Uses a CTE to ensure the optimizer leverages idx_messages_content_trgm directly.
 *
 * @param {object} prisma - PrismaClient instance
 * @param {object} params
 * @param {string} params.companyId
 * @param {string} [params.channel]
 * @param {string} params.search - raw search term
 * @param {number|string} [params.days=180] - time limit in days (default: 180 days)
 * @param {number|string} [params.limit=200] - maximum distinct conversation IDs (default: 200)
 * @returns {Promise<string[]>} array of conversation IDs
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
    if (channel) {
        params.push(channel);
        const channelParamIdx = params.length;
        channelClause = `AND c.channel = $${channelParamIdx}`;
    }

    params.push(maxLimit);
    const limitParamIdx = params.length;

    const query = `
        WITH matched_messages AS (
            SELECT m."conversationId"
            FROM messages m
            WHERE ${conditions}
              AND m."createdAt" >= $${dateParamIdx}
            LIMIT 1000
        )
        SELECT DISTINCT c.id
        FROM conversations c
        JOIN matched_messages mm ON c.id = mm."conversationId"
        WHERE c."companyId" = $${companyParamIdx}
          ${channelClause}
        LIMIT $${limitParamIdx};
    `;

    try {
        const rows = await prisma.$queryRawUnsafe(query, ...params);
        return rows.map(r => r.id);
    } catch (err) {
        console.error('⚠️ [searchMessageConversationIds] Raw GIN search error:', err.message);
        return [];
    }
}

module.exports = {
    extractContentTokens,
    buildConversationSearchWhere,
    searchMessageConversationIds,
};

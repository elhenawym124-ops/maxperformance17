#!/usr/bin/env node
/**
 * benchmark-inbox-search.js
 * ---------------------------------------------------------------------------
 * Proof harness for the inbox search fix (task eea5c862).
 *
 * Read-only: SELECT / EXPLAIN only. No writes, no DDL.
 *
 * It runs the query shapes used by
 * `controller/conversation/conversationCrudController.js`:
 *
 *   1. pg_trgm index presence + validity + size (idx_messages_content_trgm, ...)
 *   2. dataset sizes for the acceptance company (conversations / messages)
 *   3. name path : findMany (EXISTS on customers + lastMessagePreview ILIKE)
 *                   + the count(*) that runs beside it (parallel ⇒ max, not sum)
 *   4. content path: the same statement as searchMessageConversationIds()
 *                   (tenant filter inside the CTE, newest-first, LIMIT 1000)
 *   5. "no index" comparison for the content path (enable_indexscan /
 *                   enable_bitmapscan = off) — what the query costs without
 *                   idx_messages_content_trgm, measured on the same data
 *   6. EXPLAIN (ANALYZE, BUFFERS) for each statement + p50/p95 over N runs
 *
 * The content SQL is mirrored here because the controller builds it inline; a
 * drift guard compares the mirrored SQL with the shipped module source and
 * fails loudly if they ever diverge.
 *
 * Usage (on the server, from /var/www/backend2):
 *   node scripts/benchmark-inbox-search.js --company "سوان"
 *   node scripts/benchmark-inbox-search.js --company-id <cuid> --term "سناء" --runs 10
 *   node scripts/benchmark-inbox-search.js --company "سوان" --out /tmp/inbox-search-evidence.md
 *
 * Options:
 *   --company <name>      resolve company by name (ILIKE)
 *   --company-id <cuid>   skip name resolution
 *   --channel <CHANNEL>   default FACEBOOK
 *   --term <text>         repeatable; default: سناء + المقاسات + zzzqqqxxx
 *   --days <n>            content search recency window (default 180)
 *   --runs <n>            timing runs per query (default 5)
 *   --out <file>          also write the report as markdown
 */

const fs = require('fs');
const path = require('path');

const CONTENT_INNER_CAP = 1000;
const CONTENT_LIMIT = 200;
const CONTENT_DEFAULT_DAYS = 180;

function readEnvValue(key) {
    if (process.env[key]) return process.env[key];
    const candidates = [
        path.join(process.cwd(), '.env'),
        path.join(__dirname, '..', '.env'),
        '/var/www/backend2/.env',
    ];
    for (const file of candidates) {
        try {
            if (!fs.existsSync(file)) continue;
            const line = fs
                .readFileSync(file, 'utf8')
                .split(/\r?\n/)
                .find((l) => l.trim().startsWith(`${key}=`));
            if (!line) continue;
            const raw = line.slice(line.indexOf('=') + 1).trim();
            return raw.replace(/^["']|["']$/g, '');
        } catch (_) {
            /* ignore */
        }
    }
    return '';
}

function resolveDatabaseUrl() {
    const url = readEnvValue('DATABASE_URL') || readEnvValue('POSTGRES_URL') || readEnvValue('DIRECT_URL');
    if (!url) {
        console.error('❌ No DATABASE_URL / POSTGRES_URL / DIRECT_URL found.');
        process.exit(2);
    }
    return url;
}

function parseArgs(argv) {
    const out = { terms: [], channel: 'FACEBOOK', days: CONTENT_DEFAULT_DAYS, runs: 5, out: null };
    for (let i = 2; i < argv.length; i += 1) {
        const key = argv[i];
        const val = argv[i + 1];
        if (key === '--company') { out.company = val; i += 1; }
        else if (key === '--company-id') { out.companyId = val; i += 1; }
        else if (key === '--channel') { out.channel = val; i += 1; }
        else if (key === '--days') { out.days = parseInt(val, 10) || CONTENT_DEFAULT_DAYS; i += 1; }
        else if (key === '--runs') { out.runs = parseInt(val, 10) || 5; i += 1; }
        else if (key === '--term') { out.terms.push(val); i += 1; }
        else if (key === '--out') { out.out = val; i += 1; }
    }
    if (!out.terms.length) out.terms = ['سناء', 'المقاسات', 'zzzqqqxxx'];
    return out;
}

/**
 * Mirrors searchMessageConversationIds() from
 * controller/conversation/conversationSearchWhere.js (keep in sync; the drift
 * guard below fails the run if the shipped source changes).
 */
function contentSql(tokens, days = CONTENT_DEFAULT_DAYS) {
    const conditions = tokens.map((_, i) => `m.content ILIKE $${i + 1}`).join(' AND ');
    const cutoffIdx = tokens.length + 1;
    const companyIdx = tokens.length + 2;
    const channelIdx = tokens.length + 3;
    return {
        sql: `
        WITH matched_messages AS (
            SELECT m."conversationId"
            FROM messages m
            JOIN conversations c2 ON c2.id = m."conversationId"
            WHERE ${conditions}
              AND m."createdAt" >= $${cutoffIdx}
              AND c2."companyId" = $${companyIdx}
              AND c2.channel = $${channelIdx}
            ORDER BY m."createdAt" DESC
            LIMIT ${CONTENT_INNER_CAP}
        )
        SELECT DISTINCT c.id
        FROM conversations c
        JOIN matched_messages mm ON c.id = mm."conversationId"
        WHERE c."companyId" = $${companyIdx}
          AND c.channel = $${channelIdx}
        LIMIT ${CONTENT_LIMIT};
    `,
        params: [
            ...tokens.map((t) => `%${t.replace(/([%_\\])/g, '\\$&')}%`),
            new Date(Date.now() - days * 86400000),
            null, // companyId placeholder, filled by the caller
            null, // channel placeholder
        ],
    };
}

// Mirrors what Prisma emits for buildConversationSearchWhere('term'):
// one AND group per token, each group an OR over preview / firstName / lastName / phone.
const NAME_SQL = `
SELECT c.id
FROM conversations c
WHERE c."companyId" = $1
  AND c.channel = $2
  AND (
        c."lastMessagePreview" ILIKE $3
     OR EXISTS (SELECT 1 FROM customers cu WHERE cu.id = c."customerId" AND cu."firstName" ILIKE $3)
     OR EXISTS (SELECT 1 FROM customers cu WHERE cu.id = c."customerId" AND cu."lastName" ILIKE $3)
     OR EXISTS (SELECT 1 FROM customers cu WHERE cu.id = c."customerId" AND cu.phone LIKE $4)
  )
ORDER BY c."lastMessageAt" DESC NULLS LAST
LIMIT 20`;

// The count(*) that runs in parallel with the findMany above.
const NAME_COUNT_SQL = `
SELECT count(*)::int AS total
FROM conversations c
WHERE c."companyId" = $1
  AND c.channel = $2
  AND (
        c."lastMessagePreview" ILIKE $3
     OR EXISTS (SELECT 1 FROM customers cu WHERE cu.id = c."customerId" AND cu."firstName" ILIKE $3)
     OR EXISTS (SELECT 1 FROM customers cu WHERE cu.id = c."customerId" AND cu."lastName" ILIKE $3)
     OR EXISTS (SELECT 1 FROM customers cu WHERE cu.id = c."customerId" AND cu.phone LIKE $4)
  )`;

const INDEX_NAMES = [
    'idx_messages_content_trgm',
    'idx_customers_first_name_trgm',
    'idx_customers_last_name_trgm',
    'idx_customers_phone_trgm',
    'idx_conversations_last_message_preview_trgm',
];

/** Fails the run when the shipped module no longer matches the mirrored SQL. */
function assertContentSqlInSync() {
    const modulePath = path.join(__dirname, '..', 'controller', 'conversation', 'conversationSearchWhere.js');
    const src = fs.readFileSync(modulePath, 'utf8');
    const markers = [
        'WITH matched_messages AS',
        'JOIN conversations c2 ON c2.id = m."conversationId"',
        'AND c2."companyId" =',
        'ORDER BY m."createdAt" DESC',
        `LIMIT ${CONTENT_INNER_CAP}`,
        'SELECT DISTINCT c.id',
    ];
    const missing = markers.filter((m) => !src.includes(m));
    if (missing.length) {
        throw new Error(`content SQL drift: conversationSearchWhere.js no longer contains ${JSON.stringify(missing)}`);
    }
}

const percentile = (values, p) => {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
    return sorted[Math.max(0, idx)];
};

const extractPlanLines = (rows) => rows.map((r) => r['QUERY PLAN']).filter(Boolean);

async function timed(pool, sql, params, runs, { sessionGucs = [] } = {}) {
    const timings = [];
    for (let i = 0; i < runs; i += 1) {
        const client = await pool.connect();
        try {
            for (const guc of sessionGucs) await client.query(guc);
            const t0 = process.hrtime.bigint();
            await client.query(sql, params);
            timings.push(Number(process.hrtime.bigint() - t0) / 1e6);
        } finally {
            client.release();
        }
    }
    return timings;
}

async function explain(pool, sql, params, { sessionGucs = [] } = {}) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const guc of sessionGucs) await client.query(guc);
        const res = await client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${sql}`, params);
        return extractPlanLines(res.rows);
    } finally {
        await client.query('ROLLBACK').catch(() => {});
        client.release();
    }
}

(async () => {
    assertContentSqlInSync();

    const args = parseArgs(process.argv);
    const databaseUrl = resolveDatabaseUrl();
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: databaseUrl, max: 4, statement_timeout: 60000 });

    const md = [];
    const say = (line = '') => {
        console.log(line);
        md.push(line);
    };

    try {
        say(`# Inbox search evidence — ${new Date().toISOString()}`);
        say('');
        say(`channel=\`${args.channel}\` · content window=\`${args.days}d\` · runs=\`${args.runs}\``);
        say('');

        let companyId = args.companyId;
        if (!companyId) {
            if (!args.company) {
                throw new Error('Pass --company "<name>" or --company-id <cuid>');
            }
            const { rows } = await pool.query(
                'SELECT id, name FROM companies WHERE name ILIKE $1 ORDER BY id LIMIT 5',
                [`%${args.company}%`]
            );
            if (!rows.length) throw new Error(`Company not found: ${args.company}`);
            companyId = rows[0].id;
            say(`🏢 Company: ${rows[0].name} (${rows[0].id})`);
        } else {
            say(`🏢 Company id: ${companyId}`);
        }

        // ---- dataset sizes ----
        const counts = await pool.query(
            `SELECT
                (SELECT count(*)::int FROM conversations WHERE "companyId" = $1 AND channel = $2) AS conversations,
                (SELECT count(*)::int FROM messages m JOIN conversations c ON c.id = m."conversationId"
                  WHERE c."companyId" = $1 AND c.channel = $2) AS messages`,
            [companyId, args.channel]
        );
        say(`📊 conversations=${counts.rows[0].conversations} · messages=${counts.rows[0].messages}`);
        say('');

        // ---- index status ----
        say('## 1) pg_trgm index status');
        say('```');
        const indexRows = await pool.query(
            `SELECT i.relname AS index_name, t.relname AS table_name, ix.indisvalid AS is_valid, pg_size_pretty(pg_relation_size(i.oid)) AS size
             FROM pg_class i
             JOIN pg_index ix ON ix.indexrelid = i.oid
             JOIN pg_class t ON t.oid = ix.indrelid
             WHERE i.relname = ANY($1::text[])
             ORDER BY i.relname`,
            [INDEX_NAMES]
        );
        const found = new Set(indexRows.rows.map((r) => r.index_name));
        for (const r of indexRows.rows) {
            say(`  ${r.is_valid ? '✅' : '❌ INVALID'} ${r.index_name} on ${r.table_name} (${r.size})`);
        }
        for (const name of INDEX_NAMES) {
            if (!found.has(name)) say(`  ⛔ MISSING ${name}`);
        }
        say('```');
        say('');

        const escapeLike = (term) => `%${term.replace(/[%_\\]/g, '\\$&')}%`;

        for (const term of args.terms) {
            const pattern = escapeLike(term);
            say(`## 2) TERM: ${term}`);
            say('');

            // ---------- name / phone / preview path ----------
            const nameParams = [companyId, args.channel, pattern, pattern];

            const nameStarted = Date.now();
            const nameRows = await pool.query(NAME_SQL, nameParams);
            say('### name/phone/preview path');
            say('```');
            say(`rows=${nameRows.rowCount} firstRun=${Date.now() - nameStarted}ms`);
            say(`target cmwfeltfp04cojuzz1iu2nac9 present: ${nameRows.rows.some((r) => r.id === 'cmwfeltfp04cojuzz1iu2nac9') ? 'YES' : 'no'}`);
            say('```');

            const countStarted = Date.now();
            const totalRow = await pool.query(NAME_COUNT_SQL, nameParams);
            say(`count(*) for pagination.total: ${totalRow.rows[0].total} in ${Date.now() - countStarted}ms`);
            say('');

            say('<details><summary>EXPLAIN (ANALYZE, BUFFERS) — name path</summary>');
            say('');
            say('```');
            for (const line of await explain(pool, NAME_SQL, nameParams)) say(line);
            say('```');
            say('</details>');
            say('');

            const nameTimings = await timed(pool, NAME_SQL, nameParams, args.runs);
            const countTimings = await timed(pool, NAME_COUNT_SQL, nameParams, args.runs);
            say(`- findMany  : p50=${percentile(nameTimings, 50).toFixed(0)}ms p95=${percentile(nameTimings, 95).toFixed(0)}ms (n=${args.runs})`);
            say(`- count(*)  : p50=${percentile(countTimings, 50).toFixed(0)}ms p95=${percentile(countTimings, 95).toFixed(0)}ms (n=${args.runs})`);
            say(`- parallel wall clock (what the API pays, max of the two) p95≈${Math.max(percentile(nameTimings, 95), percentile(countTimings, 95)).toFixed(0)}ms`);
            say('');

            // ---------- message content path ----------
            // pg_trgm needs >= 3 chars; the controller then skips the DB entirely.
            const tokens = term.split(/\s+/).filter((t) => t.length >= 3).slice(0, 5);
            if (!tokens.length) {
                say('### message-content path');
                say('skipped: no token with length >= 3 (pg_trgm needs >= 3 chars) — zero results, no DB work.');
                say('');
                continue;
            }

            const built = contentSql(tokens, args.days);
            built.params[built.params.length - 2] = companyId;
            built.params[built.params.length - 1] = args.channel;
            const contentParams = built.params;
            const contentSqlText = built.sql;

            const contentStarted = Date.now();
            const contentRows = await pool.query(contentSqlText, contentParams);
            say('### message-content path (same SQL as searchMessageConversationIds)');
            say('```');
            say(`conversation ids=${contentRows.rowCount} firstRun=${Date.now() - contentStarted}ms (outer limit ${CONTENT_LIMIT}, inner cap ${CONTENT_INNER_CAP})`);
            say('```');

            const contentPlan = await explain(pool, contentSqlText, contentParams);
            say('<details><summary>EXPLAIN (ANALYZE, BUFFERS) — content path</summary>');
            say('');
            say('```');
            for (const line of contentPlan) say(line);
            say('```');
            say('</details>');
            say('');
            const usesTrgm = contentPlan.join('\n').includes('idx_messages_content_trgm');
            say(`- ${usesTrgm ? '✅' : '⛔'} idx_messages_content_trgm ${usesTrgm ? 'used by the planner' : 'NOT used (planner prefers the createdAt/newest-first path for this term)'}`);

            const contentTimings = await timed(pool, contentSqlText, contentParams, args.runs);
            say(`- content p50=${percentile(contentTimings, 50).toFixed(0)}ms p95=${percentile(contentTimings, 95).toFixed(0)}ms (n=${args.runs})`);

            // Before-the-index comparison: same SQL, index scans disabled.
            const noIndexGucs = ['SET LOCAL enable_indexscan = off', 'SET LOCAL enable_bitmapscan = off'];
            const noIndexPlan = await explain(pool, contentSqlText, contentParams, { sessionGucs: noIndexGucs });
            const noIndexTimings = await timed(pool, contentSqlText, contentParams, Math.min(args.runs, 3), { sessionGucs: noIndexGucs });
            const noIndexNode = noIndexPlan.find((l) => /Seq Scan on messages/.test(l));
            say(`- without index scans (pre-idx_messages_content_trgm cost on the same data): p50=${percentile(noIndexTimings, 50).toFixed(0)}ms`);
            if (noIndexNode) say(`  plan node: ${noIndexNode.trim()}`);
            say('');
        }

        say('---');
        say('');
        say('Acceptance mapping:');
        say('- «سناء» must contain cmwfeltfp04cojuzz1iu2nac9 and stay under 3000ms (~= parallel wall clock above).');
        say('- «المقاسات» must return conversation ids under 5000ms.');
        say('- «zzzqqqxxx» must return 0 rows fast.');

        if (args.out) {
            fs.writeFileSync(args.out, `${md.join('\n')}\n`, 'utf8');
            console.log(`\n📝 markdown evidence written to ${args.out}`);
        }
    } finally {
        await pool.end();
    }
})().catch((err) => {
    console.error('❌ benchmark failed:', err.message);
    process.exit(1);
});

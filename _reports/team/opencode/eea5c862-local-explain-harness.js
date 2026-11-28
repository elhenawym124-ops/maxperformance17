/**
 * EVIDENCE ARTIFACT (task eea5c862) — not part of the backend runtime.
 *
 * Reproduces the inbox search plans on a synthetic dataset shaped like the Swan
 * numbers (28,000 Facebook conversations / 400,000 messages / ~6.7k messages
 * containing «المقاسات» / 133 conversations with that preview / 9 customers
 * named «سناء») and prints EXPLAIN (ANALYZE, BUFFERS) for:
 *   A) before: btree only, no pg_trgm
 *   B) after : pg_trgm + the shipped CTE shape (tenant filter inside the CTE)
 *   C) after : pg_trgm + an alternative messages-only CTE (kept for comparison)
 *
 * It runs on PGlite (Postgres 17 WASM) because this workstation has no access
 * to the production DB. Numbers are LOCAL; see the report for the caveat.
 *
 *   mkdir /tmp/pgbench && cd /tmp/pgbench && npm init -y
 *   npm install @electric-sql/pglite@0.2
 *   cp <repo>/_reports/team/opencode/eea5c862-local-explain-harness.js .
 *   node eea5c862-local-explain-harness.js
 */
const fs = require('fs');
const path = require('path');
const { PGlite } = require('@electric-sql/pglite');
const { pg_trgm } = require('@electric-sql/pglite/contrib/pg_trgm');

const CONVERSATIONS = 28000;
const MESSAGES = 400000;
const CHANNEL = 'FACEBOOK';
const COMPANY = 'swan';
const DAYS = 180;

// Mirrors conversationSearchWhere.js (searchMessageConversationIds) exactly.
const contentTypeB = (tokens, limit = 200, innerCap = 1000) => {
  const params = tokens.map((t) => `%${t.replace(/([%_\\])/g, '\\$1')}%`);
  params.push(new Date(Date.now() - DAYS * 86400000));
  const dateIdx = params.length;
  params.push(COMPANY);
  const companyIdx = params.length;
  params.push(CHANNEL);
  const channelIdx = params.length;
  return {
    params,
    sql: `
        WITH matched_messages AS (
            SELECT m."conversationId"
            FROM messages m
            JOIN conversations c2 ON c2.id = m."conversationId"
            WHERE ${tokens.map((_, i) => `m.content ILIKE $${i + 1}`).join(' AND ')}
              AND m."createdAt" >= $${dateIdx}
              AND c2."companyId" = $${companyIdx}
              AND c2.channel = $${channelIdx}
            ORDER BY m."createdAt" DESC
            LIMIT ${innerCap}
        )
        SELECT DISTINCT c.id
        FROM conversations c
        JOIN matched_messages mm ON c.id = mm."conversationId"
        WHERE c."companyId" = $${companyIdx}
          AND c.channel = $${channelIdx}
        LIMIT ${limit};`,
  };
};

// Messages-only CTE (company filter applied after the cap) — the alternative shape.
const contentTypeC = (tokens, limit = 200, innerCap = 1000) => {
  const params = tokens.map((t) => `%${t.replace(/([%_\\])/g, '\\$1')}%`);
  params.push(new Date(Date.now() - DAYS * 86400000));
  const dateIdx = params.length;
  params.push(COMPANY);
  const companyIdx = params.length;
  params.push(CHANNEL);
  const channelIdx = params.length;
  return {
    params,
    sql: `
        WITH matched_messages AS (
            SELECT m."conversationId" AS cid, MAX(m."createdAt") AS matched_at
            FROM messages m
            WHERE ${tokens.map((_, i) => `m.content ILIKE $${i + 1}`).join(' AND ')}
              AND m."createdAt" >= $${dateIdx}
            GROUP BY m."conversationId"
            ORDER BY matched_at DESC
            LIMIT ${innerCap}
        )
        SELECT c.id
        FROM conversations c
        JOIN matched_messages mm ON c.id = mm.cid
        WHERE c."companyId" = $${companyIdx}
          AND c.channel = $${channelIdx}
        ORDER BY c."lastMessageAt" DESC NULLS LAST, c.id
        LIMIT ${limit};`,
  };
};

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

const plan = async (db, sql, params) => {
  const res = await db.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${sql}`, params);
  return res.rows.map((r) => r['QUERY PLAN']);
};

const time = async (db, sql, params, runs = 5) => {
  const ms = [];
  for (let i = 0; i < runs; i += 1) {
    const t = process.hrtime.bigint();
    await db.query(sql, params);
    ms.push(Number(process.hrtime.bigint() - t) / 1e6);
  }
  ms.sort((a, b) => a - b);
  return { p50: ms[Math.floor(ms.length / 2)], best: ms[0] };
};

const pct = (n) => `${Math.round(n)}ms`;
const lines = [];
const say = (s = '') => { console.log(s); lines.push(s); };

(async () => {
  const db = await PGlite.create({ extensions: { pg_trgm } });

  const t0 = Date.now();
  await db.exec(`
    CREATE TABLE companies (id text primary key, name text);
    CREATE TABLE customers (id text primary key, "firstName" text, "lastName" text, phone text);
    CREATE TABLE conversations (
      id text primary key, "companyId" text, "customerId" text, channel text, status text,
      priority int, "lastMessageAt" timestamptz, "lastMessagePreview" text,
      "lastMessageIsFromCustomer" boolean
    );
    CREATE TABLE messages (
      id text primary key, "conversationId" text, content text, "createdAt" timestamptz,
      "isFromCustomer" boolean
    );
  `);

  await db.exec(`
    INSERT INTO companies VALUES ('swan', 'سوان');
    INSERT INTO customers
      SELECT 'cust' || i,
             CASE WHEN i % 3000 = 0 THEN 'سناء' ELSE (ARRAY['محمد','سارة','أحمد','منى','هالة'])[1 + (i % 5)] END,
             (ARRAY['البصيري','علي','حسن','محمود'])[1 + (i % 4)],
             '010' || lpad(i::text, 8, '0')
      FROM generate_series(1, ${CONVERSATIONS}) i;
    INSERT INTO conversations
      SELECT 'conv' || i, 'swan', 'cust' || i, '${CHANNEL}',
             (ARRAY['ACTIVE','PENDING','RESOLVED'])[1 + (i % 3)],
             1 + (i % 3 = 0)::int,
             now() - (i % 540) * interval '1 hour',
             CASE WHEN i % 209 = 0 THEN 'عايزة أعرف المقاسات المتاحة' ELSE 'رسالة أخيرة عادية ' || i END,
             (i % 2 = 0)
      FROM generate_series(1, ${CONVERSATIONS}) i;
    INSERT INTO messages
      SELECT 'msg' || i, 'conv' || (1 + (i % ${CONVERSATIONS})),
             CASE WHEN i % 60 = 0 THEN 'ممكن أعرف المقاسات والتفاصيل ' || i ELSE 'كلام عادي في المحادثة ' || i END,
             now() - ((i % 540) * interval '1 hour'),
             (i % 2 = 0)
      FROM generate_series(1, ${MESSAGES}) i;
  `);

  await db.exec(`
    CREATE INDEX conv_company_last ON conversations ("companyId", "lastMessageAt");
    CREATE INDEX conv_company_status ON conversations ("companyId", status, "lastMessageAt");
    CREATE INDEX conv_customer ON conversations ("customerId");
    CREATE INDEX conv_last ON conversations ("lastMessageAt");
    CREATE INDEX msg_conv_cust_created ON messages ("conversationId", "isFromCustomer", "createdAt");
    CREATE INDEX msg_conv ON messages ("conversationId");
    CREATE INDEX msg_conv_created ON messages ("conversationId", "createdAt");
    CREATE INDEX msg_created ON messages ("createdAt");
  `);
  await db.exec('ANALYZE');
  say(`dataset built in ${Date.now() - t0}ms: ${CONVERSATIONS} conversations, ${MESSAGES} messages`);

  const stats = await db.query(`
    SELECT (SELECT count(*)::int FROM messages WHERE content ILIKE '%المقاسات%') AS msgs_with_word,
           (SELECT count(*)::int FROM conversations WHERE "lastMessagePreview" ILIKE '%المقاسات%') AS convs_with_preview,
           (SELECT count(*)::int FROM customers WHERE "firstName" ILIKE '%سناء%') AS customers_sanaa`);
  say(`data: messages with «المقاسات»=${stats.rows[0].msgs_with_word}, conversations with «المقاسات» preview=${stats.rows[0].convs_with_preview}, customers «سناء»=${stats.rows[0].customers_sanaa}`);

  const nameParams = ['swan', CHANNEL, '%سناء%', '%سناء%'];
  const target = (await db.query(
    'SELECT c.id FROM conversations c JOIN customers cu ON cu.id = c."customerId" WHERE cu."firstName" ILIKE $1 ORDER BY c."lastMessageAt" DESC LIMIT 1',
    ['%سناء%']
  )).rows[0].id;

  const b = contentTypeB(['المقاسات']);
  const c = contentTypeC(['المقاسات']);
  const zzzB = contentTypeB(['zzzqqqxxx']);

  say('');
  say('=========== A) BEFORE — btree only, no pg_trgm ===========');
  for (const l of await plan(db, NAME_SQL, nameParams)) say(l);
  for (const l of await plan(db, NAME_COUNT_SQL, nameParams)) say(l);
  for (const l of await plan(db, b.sql, b.params)) say(l);
  const aName = await time(db, NAME_SQL, nameParams, 3);
  const aCount = await time(db, NAME_COUNT_SQL, nameParams, 3);
  const aContent = await time(db, b.sql, b.params, 3);
  say(`A: name p50=${pct(aName.p50)} count p50=${pct(aCount.p50)} content(shipped SQL) p50=${pct(aContent.p50)}`);

  say('');
  say('=========== AFTER — pg_trgm GIN indexes (production DDL) ===========');
  const idxStart = Date.now();
  await db.exec('CREATE EXTENSION IF NOT EXISTS pg_trgm');
  await db.exec(`
    CREATE INDEX idx_customers_first_name_trgm ON customers USING gin ("firstName" gin_trgm_ops);
    CREATE INDEX idx_customers_last_name_trgm ON customers USING gin ("lastName" gin_trgm_ops);
    CREATE INDEX idx_customers_phone_trgm ON customers USING gin (phone gin_trgm_ops);
    CREATE INDEX idx_conversations_last_message_preview_trgm ON conversations USING gin ("lastMessagePreview" gin_trgm_ops);
    CREATE INDEX idx_messages_content_trgm ON messages USING gin (content gin_trgm_ops);
  `);
  await db.exec('ANALYZE');
  say(`index build (plain CREATE INDEX locally; production uses CONCURRENTLY): ${Date.now() - idxStart}ms`);

  say('');
  say('--- B) SHIPPED shape: tenant filter INSIDE the CTE ---');
  const planB = await plan(db, b.sql, b.params);
  for (const l of planB) say(l);
  const bName = await time(db, NAME_SQL, nameParams, 5);
  const bCount = await time(db, NAME_COUNT_SQL, nameParams, 5);
  const bContent = await time(db, b.sql, b.params, 5);
  const bZzz = await time(db, zzzB.sql, zzzB.params, 5);
  say(`B: name p50=${pct(bName.p50)} count p50=${pct(bCount.p50)} content p50=${pct(bContent.p50)} zzz p50=${pct(bZzz.p50)}`);

  say('');
  say('--- C) ALTERNATIVE shape: messages-only CTE + GROUP BY per conversation ---');
  const planC = await plan(db, c.sql, c.params);
  for (const l of planC) say(l);
  const cContent = await time(db, c.sql, c.params, 5);
  say(`C: content p50=${pct(cContent.p50)}`);

  const nameRows = await db.query(NAME_SQL, nameParams);
  const bRows = await db.query(b.sql, b.params);
  say('');
  say(`target conversation ${target} present in name results: ${nameRows.rows.some((r) => r.id === target) ? 'YES' : 'no'}`);
  say(`«المقاسات» ids: B=${bRows.rows.length} (limit 200)`);
  say(`«zzzqqqxxx» ids: B=${(await db.query(zzzB.sql, zzzB.params)).rows.length}`);
  say(`B uses idx_messages_content_trgm: ${planB.join('\n').includes('idx_messages_content_trgm') ? 'YES' : 'no'}`);
  say(`B plan drives from: ${planB.find((l) => /Scan/.test(l)) ? planB.find((l) => /Scan/.test(l)).trim() : 'n/a'}`);
  say(`C uses idx_messages_content_trgm: ${planC.join('\n').includes('idx_messages_content_trgm') ? 'YES' : 'no'}`);
  say('');
  say(`delta content (A -> B): ${pct(aContent.p50)} -> ${pct(bContent.p50)}`);
  say(`delta content (A -> C): ${pct(aContent.p50)} -> ${pct(cContent.p50)}`);
  say(`delta name (A -> B): ${pct(aName.p50)} -> ${pct(bName.p50)}`);

  fs.writeFileSync(path.join(__dirname, 'local-explain.txt'), lines.join('\n'), 'utf8');
  await db.close();
})().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});

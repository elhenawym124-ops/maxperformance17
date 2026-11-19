#!/usr/bin/env node
/**
 * One-off DDL: create the agent_data_conflicts table (task 488ae2bc).
 *
 * Idempotent — safe to re-run. The Prisma model lives at
 * apps/backend/prisma/schema/agent_data_conflicts.prisma; production deploys only
 * run `prisma generate`, never `db push`, so the table has to be created explicitly.
 *
 * Usage: node scripts/one-off/create-agent-data-conflicts.js [--dry-run]
 */
'use strict';

const DRY_RUN = process.argv.includes('--dry-run');

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS agent_data_conflicts (
     id TEXT PRIMARY KEY,
     "companyId" TEXT NOT NULL,
     surface TEXT NOT NULL,
     "sourceRowId" TEXT,
     "conflictKey" TEXT NOT NULL,
     "writtenValue" TEXT NOT NULL,
     "liveValue" TEXT NOT NULL,
     "liveSource" TEXT NOT NULL,
     "conversationId" TEXT,
     status TEXT NOT NULL DEFAULT 'OPEN',
     "resolvedBy" TEXT,
     "resolvedAt" TIMESTAMP(3),
     "resolutionNotes" TEXT,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_open_conflict_per_source_key
     ON agent_data_conflicts ("companyId", surface, "sourceRowId", "conflictKey", status)`,
  `CREATE INDEX IF NOT EXISTS agent_data_conflicts_companyId_status_idx
     ON agent_data_conflicts ("companyId", status)`,
];

async function main() {
  if (DRY_RUN) {
    console.log('[DRY-RUN] would execute:');
    STATEMENTS.forEach((s) => console.log('  -', s.replace(/\s+/g, ' ').slice(0, 120)));
    return;
  }

  // On the server the connection string lives in /var/www/backend2/.env — Prisma
  // does not read it by itself for a bare node script.
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    try {
      require('dotenv').config({ path: require('path').join(process.cwd(), '.env') });
    } catch (e) {
      console.log('dotenv load skipped:', e.message);
    }
  }

  let PrismaClient;
  try {
    ({ PrismaClient } = require('../../prisma/generated/postgresql_v2'));
  } catch (e) {
    ({ PrismaClient } = require('@prisma/client'));
  }
  const prisma = new PrismaClient();
  try {
    for (const stmt of STATEMENTS) {
      await prisma.$executeRawUnsafe(stmt);
      console.log('OK:', stmt.replace(/\s+/g, ' ').slice(0, 90));
    }
    const t = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS tbl_exists FROM information_schema.tables WHERE table_name = 'agent_data_conflicts'`
    );
    const r = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS row_count FROM agent_data_conflicts`);
    console.log(`VERIFY: table_exists=${t[0].tbl_exists === 1} rows=${r[0].row_count}`);
    const cols = await prisma.$queryRawUnsafe(
      `SELECT column_name FROM information_schema.columns WHERE table_name='agent_data_conflicts' ORDER BY ordinal_position`
    );
    console.log('COLUMNS:', cols.map((c) => c.column_name).join(', '));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

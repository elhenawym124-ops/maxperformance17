#!/usr/bin/env node
/**
 * CLI: backfill the education payment ledger from historical balances.
 *
 *   node scripts/backfill_education_payments.js            # dry run (default)
 *   node scripts/backfill_education_payments.js --apply    # write ledger rows
 *   node scripts/backfill_education_payments.js --company <companyId> --apply
 */

const { getSharedPrismaClient } = require('../services/sharedDatabase');
const { runBackfill } = require('../services/educationPaymentsBackfill');

const parseArgs = (argv) => {
  const args = { apply: false, companyId: null, limit: 5000 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--apply') args.apply = true;
    else if (arg === '--company') args.companyId = argv[i + 1] || null;
    else if (arg === '--limit') args.limit = Math.max(1, parseInt(argv[i + 1], 10) || 5000);
  }
  return args;
};

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const prisma = getSharedPrismaClient();

  console.log(`[EducationBackfill] mode=${args.apply ? 'APPLY' : 'DRY-RUN'} company=${args.companyId || 'ALL'} limit=${args.limit}`);
  const summary = await runBackfill(prisma, args);

  console.log(JSON.stringify(summary, null, 2));
  if (!args.apply && summary.planned > 0) {
    console.log('[EducationBackfill] dry run only — re-run with --apply to write the ledger rows.');
  }

  const exitCode = summary.failures.length > 0 ? 2 : 0;
  process.exit(exitCode);
})().catch((error) => {
  console.error('[EducationBackfill] fatal:', error);
  process.exit(1);
});

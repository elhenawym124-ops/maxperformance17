#!/usr/bin/env node
/**
 * CLI: archive PDF receipts for existing education payments.
 *
 *   node scripts/backfill_education_receipt_pdfs.js            # dry run
 *   node scripts/backfill_education_receipt_pdfs.js --apply
 *   node scripts/backfill_education_receipt_pdfs.js --company <companyId> --apply --limit 500
 *   node scripts/backfill_education_receipt_pdfs.js --force --apply
 */

const { getSharedPrismaClient } = require('../services/sharedDatabase');
const { runReceiptBackfill } = require('../services/educationReceiptsBackfill');

const parseArgs = (argv) => {
  const args = { apply: false, force: false, companyId: null, limit: 1000 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--apply') args.apply = true;
    else if (arg === '--force') args.force = true;
    else if (arg === '--company') args.companyId = argv[i + 1] || null;
    else if (arg === '--limit') args.limit = Math.max(1, parseInt(argv[i + 1], 10) || 1000);
  }
  return args;
};

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const prisma = getSharedPrismaClient();

  console.log(`[ReceiptsBackfill] mode=${args.apply ? 'APPLY' : 'DRY-RUN'} company=${args.companyId || 'ALL'} force=${args.force} limit=${args.limit}`);
  const summary = await runReceiptBackfill(prisma, args);
  console.log(JSON.stringify(summary, null, 2));

  if (!args.apply && summary.candidates > 0) {
    console.log('[ReceiptsBackfill] dry run only — re-run with --apply to generate the PDFs.');
  }

  process.exit(summary.failures.length > 0 ? 2 : 0);
})().catch((error) => {
  console.error('[ReceiptsBackfill] fatal:', error);
  process.exit(1);
});

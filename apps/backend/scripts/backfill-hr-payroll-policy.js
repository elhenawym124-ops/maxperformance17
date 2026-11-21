/**
 * Backfill HR payroll policy for EXISTING companies.
 *
 * الهدف: قبل تغيير الافتراضي إلى `treatMissingAsAbsent=false` (للشركات الجديدة)،
 * نثبّت السلوك القديم (true) صراحةً لكل شركة قائمة — فلا يتغير حساب رواتبها.
 *
 * التشغيل:
 *   node scripts/backfill-hr-payroll-policy.js           # معاينة فقط
 *   node scripts/backfill-hr-payroll-policy.js --apply   # تنفيذ
 */
const path = require('path');
const { PrismaClient } = require('../prisma/generated/postgresql_v2');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.production'), quiet: true });
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.POSTGRES_URL || process.env.DATABASE_URL } },
  log: ['error'],
});

const APPLY = process.argv.includes('--apply');

const parseSettings = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return {}; }
};

(async () => {
  const companies = await prisma.company.findMany({ select: { id: true, name: true, settings: true } });
  let toUpdate = 0;
  let skipped = 0;

  for (const company of companies) {
    const settings = parseSettings(company.settings);
    if (settings.hrPayrollPolicy && typeof settings.hrPayrollPolicy.treatMissingAsAbsent === 'boolean') {
      skipped += 1;
      continue;
    }
    toUpdate += 1;
    console.log(`${APPLY ? '[SET]' : '[DRY]'} ${company.id} — ${company.name}`);

    if (APPLY) {
      settings.hrPayrollPolicy = {
        ...(settings.hrPayrollPolicy || {}),
        treatMissingAsAbsent: true,
        latePenaltyMode: settings.hrPayrollPolicy?.latePenaltyMode || 'DEFICIT',
      };
      await prisma.company.update({
        where: { id: company.id },
        data: { settings: JSON.stringify(settings) },
      });
    }
  }

  console.log(JSON.stringify({ total: companies.length, updated: toUpdate, alreadyExplicit: skipped, applied: APPLY }));
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error('BACKFILL FAILED:', e.message);
  await prisma.$disconnect();
  process.exitCode = 1;
});

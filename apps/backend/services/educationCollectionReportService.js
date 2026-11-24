/**
 * Collection-rate reporting (billed vs collected) for the education module.
 *
 * Definitions (explicit, so numbers are auditable):
 * - billed: enrollment value (`finalAmount`, falling back to the package price)
 *   for enrollments created inside the period — the charge event we can date.
 * - collected: COMPLETED payments with `paidAt` inside the period.
 * - rate: collected / billed (may exceed 100% when collecting older dues).
 * - openDues: current unpaid balance (packages + group cycles) as a live snapshot.
 */

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

const monthKey = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const rate = (collected, billed) => {
  if (!billed || billed <= 0) return null;
  return Math.round((collected / billed) * 1000) / 10;
};

async function buildCollectionReport(prisma, companyId, { months = 6 } = {}) {
  const safeMonths = Math.min(24, Math.max(1, Number(months) || 6));
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (safeMonths - 1), 1);

  const [payments, enrollments, branchRows, groupDues] = await Promise.all([
    prisma.educationPayment.findMany({
      where: { companyId, status: 'COMPLETED', paidAt: { gte: rangeStart } },
      select: { amount: true, branchId: true, paidAt: true },
      take: 20000,
    }).catch(() => []),
    prisma.educationEnrollment.findMany({
      where: { companyId, enrollmentDate: { gte: rangeStart } },
      select: {
        finalAmount: true, amountPaid: true, branchId: true, enrollmentDate: true, isActive: true,
        package: { select: { price: true } },
      },
      take: 10000,
    }).catch(() => []),
    prisma.$queryRawUnsafe(
      `SELECT id, name FROM "branches" WHERE "companyId" = $1`,
      companyId
    ).catch(() => []),
    prisma.$queryRawUnsafe(`
      SELECT COALESCE(SUM(GREATEST(
               g."feeAmount" - COALESCE(m."discountAmount", 0) - COALESCE(m."amountPaid", 0), 0)), 0) AS "openDue"
      FROM "education_group_members" m
      JOIN "education_groups" g ON g."id" = m."groupId" AND g."companyId" = m."companyId"
      WHERE m."companyId" = $1 AND m."status" = 'ACTIVE'
    `, companyId).catch(() => []),
  ]);

  const branchNames = new Map((branchRows || []).map((row) => [row.id, row.name]));

  const byMonthMap = new Map();
  const byBranchMap = new Map();
  let billed = 0;
  let collected = 0;
  let openPackageDues = 0;

  for (const enrollment of enrollments || []) {
    const value = money(enrollment.finalAmount || enrollment.package?.price || 0);
    billed = money(billed + value);

    const key = monthKey(enrollment.enrollmentDate);
    if (key) {
      const month = byMonthMap.get(key) || { month: key, billed: 0, collected: 0 };
      month.billed = money(month.billed + value);
      byMonthMap.set(key, month);
    }

    if (enrollment.branchId) {
      const row = byBranchMap.get(enrollment.branchId) || { id: enrollment.branchId, billed: 0, collected: 0 };
      row.billed = money(row.billed + value);
      byBranchMap.set(enrollment.branchId, row);
    }

    if (enrollment.isActive) {
      openPackageDues = money(openPackageDues + Math.max(0, money(value - money(enrollment.amountPaid))));
    }
  }

  for (const payment of payments || []) {
    const amount = money(payment.amount);
    collected = money(collected + amount);

    const key = monthKey(payment.paidAt);
    if (key) {
      const month = byMonthMap.get(key) || { month: key, billed: 0, collected: 0 };
      month.collected = money(month.collected + amount);
      byMonthMap.set(key, month);
    }

    if (payment.branchId) {
      const row = byBranchMap.get(payment.branchId) || { id: payment.branchId, billed: 0, collected: 0 };
      row.collected = money(row.collected + amount);
      byBranchMap.set(payment.branchId, row);
    }
  }

  const openGroupDues = money(groupDues?.[0]?.openDue || 0);
  const openDues = money(openPackageDues + openGroupDues);

  return {
    period: { from: rangeStart, to: now, months: safeMonths },
    summary: {
      billed,
      collected,
      gap: money(billed - collected),
      rate: rate(collected, billed),
      openDues,
      openPackageDues,
      openGroupDues,
      payments: (payments || []).length,
      enrollments: (enrollments || []).length,
    },
    byMonth: [...byMonthMap.values()]
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((row) => ({ ...row, rate: rate(row.collected, row.billed) })),
    byBranch: [...byBranchMap.values()]
      .map((row) => ({
        ...row,
        name: branchNames.get(row.id) || row.id,
        rate: rate(row.collected, row.billed),
      }))
      .sort((a, b) => b.billed - a.billed),
  };
}

module.exports = { buildCollectionReport };

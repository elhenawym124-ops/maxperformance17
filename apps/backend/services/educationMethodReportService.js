/**
 * Collected-money split: by payment method, by branch and by treasury account.
 *
 * - Net collected per payment = amount − reversedAmount (fully reversed rows drop out).
 * - Treasury side reads `treasury_transactions` for education reference types so the
 *   reported cash matches what actually entered each treasury, including refunds.
 */

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

const METHOD_LABELS = {
  CASH: 'نقدي',
  TRANSFER: 'تحويل بنكي',
  WALLET: 'محفظة',
  CARD: 'بطاقة',
  ONLINE: 'أونلاين',
  INSTAPAY: 'إنستاباي',
  OTHER: 'أخرى',
};

const educationReferenceTypes = [
  'EDUCATION_PAYMENT',
  'EDUCATION_GROUP_PAYMENT',
  'EDUCATION_REFUND',
  'EDUCATION_WALLET_TOPUP',
];

async function buildMethodReport(prisma, companyId, { months = 6 } = {}) {
  const safeMonths = Math.min(24, Math.max(1, Number(months) || 6));
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (safeMonths - 1), 1);

  const [payments, branchRows, treasuryRows] = await Promise.all([
    prisma.educationPayment.findMany({
      where: { companyId, paidAt: { gte: rangeStart } },
      select: {
        id: true, amount: true, reversedAmount: true, status: true,
        method: true, branchId: true, source: true, paidAt: true,
      },
      take: 20000,
    }).catch(() => []),
    prisma.$queryRawUnsafe(
      `SELECT id, name FROM "branches" WHERE "companyId" = $1`,
      companyId
    ).catch(() => []),
    prisma.$queryRawUnsafe(`
      SELECT t."treasuryAccountId" AS id, a."name",
             COALESCE(SUM(CASE WHEN t."type" IN ('DEPOSIT','TRANSFER_IN') THEN t."amount" ELSE 0 END), 0)
               AS "inflow",
             COALESCE(SUM(CASE WHEN t."type" IN ('WITHDRAWAL','EXPENSE','TRANSFER_OUT') THEN t."amount" ELSE 0 END), 0)
               AS "outflow",
             COUNT(*)::int AS "entries"
      FROM "treasury_transactions" t
      JOIN "treasury_accounts" a ON a."id" = t."treasuryAccountId"
      WHERE t."companyId" = $1
        AND t."createdAt" >= $2
        AND t."referenceType" = ANY($3::text[])
      GROUP BY t."treasuryAccountId", a."name"
      ORDER BY 3 DESC
    `, companyId, rangeStart, educationReferenceTypes).catch(() => []),
  ]);

  const branchNames = new Map((branchRows || []).map((row) => [row.id, row.name]));

  const byMethodMap = new Map();
  const byBranchMap = new Map();
  let gross = 0;
  let refunded = 0;
  let net = 0;
  let count = 0;

  for (const payment of payments || []) {
    const status = String(payment.status || '').toUpperCase();
    if (status === 'CANCELLED' || status === 'FAILED') continue;

    const amount = money(payment.amount);
    const reversed = money(payment.reversedAmount);
    const netAmount = money(amount - reversed);

    gross = money(gross + amount);
    refunded = money(refunded + reversed);
    net = money(net + netAmount);

    if (status === 'REVERSED' || netAmount <= 0.009) continue;

    count += 1;

    const method = String(payment.method || 'OTHER').toUpperCase();
    const methodRow = byMethodMap.get(method) || { method, label: METHOD_LABELS[method] || method, amount: 0, count: 0 };
    methodRow.amount = money(methodRow.amount + netAmount);
    methodRow.count += 1;
    byMethodMap.set(method, methodRow);

    const branchId = payment.branchId || 'unassigned';
    const branchRow = byBranchMap.get(branchId) || { id: branchId, amount: 0, count: 0 };
    branchRow.amount = money(branchRow.amount + netAmount);
    branchRow.count += 1;
    byBranchMap.set(branchId, branchRow);
  }

  const byMethod = [...byMethodMap.values()]
    .map((row) => ({
      ...row,
      share: net > 0 ? Math.round((row.amount / net) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const byBranch = [...byBranchMap.values()]
    .map((row) => ({
      ...row,
      name: row.id === 'unassigned' ? 'بدون فرع' : (branchNames.get(row.id) || row.id),
    }))
    .sort((a, b) => b.amount - a.amount);

  const byTreasury = (treasuryRows || []).map((row) => ({
    id: row.id,
    name: row.name,
    inflow: money(row.inflow),
    outflow: money(row.outflow),
    net: money(money(row.inflow) - money(row.outflow)),
    entries: Number(row.entries) || 0,
  }));

  return {
    period: { from: rangeStart, to: now, months: safeMonths },
    summary: {
      gross,
      refunded,
      net,
      payments: count,
      methods: byMethod.length,
    },
    byMethod,
    byBranch,
    byTreasury,
    treasuryNet: money(byTreasury.reduce((sum, row) => sum + row.net, 0)),
  };
}

module.exports = { buildMethodReport, METHOD_LABELS };

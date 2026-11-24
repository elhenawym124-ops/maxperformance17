/**
 * Group P&L: what each group collects, what it owes, what the teacher takes
 * and how full it runs.
 *
 * Teacher cost:
 * - PERCENTAGE → rate% of the group's collected revenue.
 * - FIXED      → the fixed amount per cycle, taken once for the window.
 * - PER_SESSION→ rate × completed group sessions in the window.
 */

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;
const pct = (part, total) => (total > 0 ? Math.round((part / total) * 1000) / 10 : null);

const teacherCostOf = (group, { revenue, sessions }) => {
  const rateValue = Number(group.teacherRateValue) || 0;
  const type = String(group.teacherRateType || 'PERCENTAGE').toUpperCase();
  if (type === 'FIXED') return money(rateValue);
  if (type === 'PER_SESSION') return money(rateValue * sessions);
  return money((revenue * rateValue) / 100);
};

async function buildGroupPnl(prisma, companyId, { months = 3 } = {}) {
  const safeMonths = Math.min(24, Math.max(1, Number(months) || 3));
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (safeMonths - 1), 1);

  const [groupRows, paymentRows, sessionRows] = await Promise.all([
    prisma.$queryRawUnsafe(`
      SELECT g."id", g."name", g."capacity", g."feeAmount", g."feeType",
             g."teacherId", g."teacherRateType", g."teacherRateValue", g."branchId",
             COALESCE(SUM(CASE WHEN m."status" = 'ACTIVE' THEN 1 ELSE 0 END), 0)::int AS "activeMembers",
             COALESCE(SUM(CASE WHEN m."status" = 'ACTIVE'
                  THEN GREATEST(g."feeAmount" - COALESCE(m."discountAmount", 0) - COALESCE(m."amountPaid", 0), 0)
                  ELSE 0 END), 0) AS "dues"
      FROM "education_groups" g
      LEFT JOIN "education_group_members" m ON m."groupId" = g."id" AND m."companyId" = g."companyId"
      WHERE g."companyId" = $1
      GROUP BY g."id", g."name", g."capacity", g."feeAmount", g."feeType",
               g."teacherId", g."teacherRateType", g."teacherRateValue", g."branchId"
    `, companyId).catch(() => []),
    prisma.educationPayment.findMany({
      where: {
        companyId,
        groupId: { not: null },
        status: { in: ['COMPLETED', 'PARTIALLY_REVERSED'] },
        paidAt: { gte: rangeStart },
      },
      select: { groupId: true, amount: true, reversedAmount: true },
      take: 20000,
    }).catch(() => []),
    prisma.$queryRawUnsafe(`
      SELECT gs."groupId", COUNT(*)::int AS sessions
      FROM "education_group_sessions" gs
      WHERE gs."companyId" = $1 AND gs."sessionDate" >= $2 AND gs."status" = 'COMPLETED'
      GROUP BY gs."groupId"
    `, companyId, rangeStart).catch(() => []),
  ]);

  const teacherRows = await prisma.$queryRawUnsafe(
    `SELECT id, name FROM "education_teachers" WHERE "companyId" = $1`,
    companyId
  ).catch(() => []);
  const teacherNames = new Map((teacherRows || []).map((row) => [row.id, row.name]));

  const revenueMap = new Map();
  for (const payment of paymentRows || []) {
    const net = money(money(payment.amount) - money(payment.reversedAmount));
    if (net <= 0) continue;
    revenueMap.set(payment.groupId, money((revenueMap.get(payment.groupId) || 0) + net));
  }
  const sessionMap = new Map((sessionRows || []).map((row) => [row.groupId, Number(row.sessions) || 0]));

  const groups = (groupRows || []).map((row) => {
    const revenue = money(revenueMap.get(row.id) || 0);
    const sessions = sessionMap.get(row.id) || 0;
    const dues = money(row.dues);
    const members = Number(row.activeMembers) || 0;
    const capacity = Number(row.capacity) || 0;
    const teacherCost = teacherCostOf(
      { teacherRateType: row.teacherRateType, teacherRateValue: row.teacherRateValue },
      { revenue, sessions }
    );

    return {
      groupId: row.id,
      name: row.name,
      teacherId: row.teacherId || null,
      teacherName: row.teacherId ? (teacherNames.get(row.teacherId) || null) : null,
      feeAmount: money(row.feeAmount),
      feeType: row.feeType,
      members,
      capacity,
      occupancy: capacity > 0 ? Math.round((members / capacity) * 1000) / 10 : null,
      sessions,
      revenue,
      dues,
      collectedTotal: money(revenue + dues),
      teacherCost,
      net: money(revenue - teacherCost),
      margin: pct(money(revenue - teacherCost), revenue),
    };
  });

  const summary = groups.reduce((acc, row) => ({
    groups: acc.groups + 1,
    revenue: money(acc.revenue + row.revenue),
    dues: money(acc.dues + row.dues),
    teacherCost: money(acc.teacherCost + row.teacherCost),
    net: money(acc.net + row.net),
    members: acc.members + row.members,
    capacity: acc.capacity + row.capacity,
    lossMaking: acc.lossMaking + (row.net < 0 ? 1 : 0),
  }), { groups: 0, revenue: 0, dues: 0, teacherCost: 0, net: 0, members: 0, capacity: 0, lossMaking: 0 });

  summary.occupancy = summary.capacity > 0
    ? Math.round((summary.members / summary.capacity) * 1000) / 10
    : null;
  summary.margin = pct(summary.net, summary.revenue);

  return {
    period: { from: rangeStart, to: now, months: safeMonths },
    summary,
    groups: groups.sort((a, b) => a.net - b.net),
  };
}

module.exports = { buildGroupPnl, teacherCostOf };

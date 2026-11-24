/**
 * Education finance cockpit: one payload for the owner.
 *
 * Composes the existing reports (collections, discounts, variances) plus a
 * lightweight revenue pulse, and derives the alerts that actually need action.
 * Each source degrades to null instead of failing the whole cockpit.
 */

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

const pctChange = (current, previous) => {
  if (!previous || previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

const monthRange = (now, offset) => ({
  from: new Date(now.getFullYear(), now.getMonth() + offset, 1),
  to: new Date(now.getFullYear(), now.getMonth() + offset + 1, 1),
});

async function buildCockpit(prisma, companyId, { months = 6 } = {}, deps = {}) {
  const safeMonths = Math.min(24, Math.max(1, Number(months) || 6));
  const now = new Date();

  const collectionReport = deps.buildCollectionReport
    || require('./educationCollectionReportService').buildCollectionReport;
  const discountReport = deps.buildDiscountReport
    || require('./educationDiscountReportService').buildDiscountReport;
  const varianceReport = deps.buildVarianceReport
    || require('./educationVarianceReportService').buildVarianceReport;

  const safe = async (fn) => {
    try {
      return await fn();
    } catch (_) {
      return null;
    }
  };

  const current = monthRange(now, 0);
  const previous = monthRange(now, -1);

  const [collections, discounts, variances, currentPayments, previousPayments, openDuesRows] = await Promise.all([
    safe(() => collectionReport(prisma, companyId, { months: safeMonths })),
    safe(() => discountReport(prisma, companyId, { months: safeMonths })),
    safe(() => varianceReport(prisma, companyId, { months: safeMonths })),
    safe(() => prisma.educationPayment.aggregate({
      where: { companyId, status: 'COMPLETED', paidAt: { gte: current.from, lt: current.to } },
      _sum: { amount: true },
      _count: true,
    })),
    safe(() => prisma.educationPayment.aggregate({
      where: { companyId, status: 'COMPLETED', paidAt: { gte: previous.from, lt: previous.to } },
      _sum: { amount: true },
      _count: true,
    })),
    safe(() => prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int AS "members"
      FROM "education_group_members" m
      JOIN "education_groups" g ON g."id" = m."groupId" AND g."companyId" = m."companyId"
      WHERE m."companyId" = $1 AND m."status" = 'ACTIVE'
        AND GREATEST(g."feeAmount" - COALESCE(m."discountAmount", 0) - COALESCE(m."amountPaid", 0), 0) > 0
    `, companyId)),
  ]);

  const monthCollected = money(currentPayments?._sum?.amount || 0);
  const prevCollected = money(previousPayments?._sum?.amount || 0);

  const summary = {
    monthCollected,
    prevMonthCollected: prevCollected,
    monthGrowth: pctChange(monthCollected, prevCollected),
    monthPayments: Number(currentPayments?._count || 0),
    collected: money(collections?.summary?.collected || 0),
    billed: money(collections?.summary?.billed || 0),
    collectionRate: collections?.summary?.rate ?? null,
    openDues: money(collections?.summary?.openDues || 0),
    openDuesMembers: Number(openDuesRows?.[0]?.members || 0),
    discountImpact: money(discounts?.summary?.totalImpact || 0),
    couponDiscounts: money(discounts?.summary?.couponDiscounts || 0),
    waiversValue: money(discounts?.summary?.waiversValue || 0),
    varianceNet: money(variances?.summary?.netVariance || 0),
    varianceAbs: money(variances?.summary?.absVariance || 0),
    shortCloses: Number(variances?.summary?.short || 0),
  };

  const alerts = [];
  if (summary.shortCloses > 0) {
    alerts.push({
      severity: 'HIGH',
      code: 'CASH_SHORT',
      message: `${summary.shortCloses} ${summary.shortCloses === 1 ? 'إغلاق' : 'إغلاق'} بعجز نقدي — صافي الفروق ${summary.varianceNet} ج.م`,
    });
  }
  if (summary.openDues > 0) {
    alerts.push({
      severity: 'MEDIUM',
      code: 'OPEN_DUES',
      message: `مستحقات مفتوحة ${summary.openDues} ج.م على ${summary.openDuesMembers} عضو/تسجيل`,
    });
  }
  if (summary.collectionRate !== null && summary.collectionRate < 70) {
    alerts.push({
      severity: 'MEDIUM',
      code: 'LOW_COLLECTION',
      message: `نسبة التحصيل ${summary.collectionRate}% — أقل من 70%`,
    });
  }
  if (summary.discountImpact > 0) {
    alerts.push({
      severity: 'LOW',
      code: 'DISCOUNT_IMPACT',
      message: `أثر الخصومات ${summary.discountImpact} ج.م (كوبونات ${summary.couponDiscounts} + إعفاءات ${summary.waiversValue})`,
    });
  }
  if (summary.monthGrowth !== null && summary.monthGrowth < -10) {
    alerts.push({
      severity: 'MEDIUM',
      code: 'REVENUE_DROP',
      message: `إيراد الشهر أقل من الشهر السابق بنسبة ${Math.abs(summary.monthGrowth)}%`,
    });
  }

  return {
    period: { from: current.from, to: now, months: safeMonths },
    summary,
    alerts,
    readiness: {
      collections: Boolean(collections),
      discounts: Boolean(discounts),
      variances: Boolean(variances),
    },
  };
}

module.exports = { buildCockpit };

/**
 * Discount & waiver reporting for the education module.
 *
 * Sources (never double counted):
 * - Coupon discounts come from `education_coupon_redemptions` (one row per use).
 * - Standing waivers come from the current `education_group_members.discountAmount`.
 * - Manual waivers history comes from `activityLog` (EDUCATION / MANUAL_DISCOUNT).
 */

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

const monthKey = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const parseMeta = (value) => {
  try {
    if (!value) return {};
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch (_) {
    return {};
  }
};

async function buildDiscountReport(prisma, companyId, { months = 6 } = {}) {
  const safeMonths = Math.min(24, Math.max(1, Number(months) || 6));
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (safeMonths - 1), 1);

  const [redemptions, coupons, waiverRows, staffLogs] = await Promise.all([
    prisma.educationCouponRedemption.findMany({
      where: { companyId, createdAt: { gte: rangeStart } },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    }).catch(() => []),
    prisma.educationCoupon.findMany({
      where: { companyId },
      select: { id: true, code: true, type: true, value: true, isActive: true },
    }).catch(() => []),
    prisma.$queryRawUnsafe(`
      SELECT m."id" AS "memberId", m."discountAmount", m."discountReason", m."updatedAt",
             g."name" AS "groupName", s."firstName", s."lastName"
      FROM "education_group_members" m
      JOIN "education_groups" g ON g."id" = m."groupId" AND g."companyId" = m."companyId"
      JOIN "education_students" s ON s."id" = m."studentId" AND s."companyId" = m."companyId"
      WHERE m."companyId" = $1
        AND m."status" = 'ACTIVE'
        AND COALESCE(m."discountAmount", 0) > 0
      ORDER BY m."discountAmount" DESC
      LIMIT 500
    `, companyId).catch(() => []),
    prisma.activityLog.findMany({
      where: {
        companyId,
        category: 'EDUCATION',
        action: 'MANUAL_DISCOUNT',
        createdAt: { gte: rangeStart },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: { id: true, userId: true, description: true, metadata: true, createdAt: true },
    }).catch(() => []),
  ]);

  const couponMap = new Map((coupons || []).map((coupon) => [coupon.id, coupon]));
  const studentIds = [...new Set((redemptions || []).map((row) => row.studentId).filter(Boolean))];
  const students = studentIds.length
    ? await prisma.educationStudent.findMany({
        where: { companyId, id: { in: studentIds } },
        select: { id: true, firstName: true, lastName: true },
      }).catch(() => [])
    : [];
  const studentMap = new Map((students || []).map((student) => [student.id, student]));

  let couponTotal = 0;
  const byCodeMap = new Map();
  const byMonthMap = new Map();
  const items = [];

  for (const row of redemptions || []) {
    const amount = money(row.discount);
    couponTotal = money(couponTotal + amount);

    const coupon = couponMap.get(row.couponId);
    const code = coupon?.code || '—';
    const entry = byCodeMap.get(code) || { code, uses: 0, amount: 0 };
    entry.uses += 1;
    entry.amount = money(entry.amount + amount);
    byCodeMap.set(code, entry);

    const key = monthKey(row.createdAt);
    if (key) {
      const month = byMonthMap.get(key) || { month: key, uses: 0, amount: 0 };
      month.uses += 1;
      month.amount = money(month.amount + amount);
      byMonthMap.set(key, month);
    }

    const student = studentMap.get(row.studentId);
    items.push({
      kind: 'COUPON',
      id: row.id,
      code,
      discount: amount,
      studentId: row.studentId || null,
      studentName: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : null,
      paymentId: row.paymentId || null,
      date: row.createdAt,
    });
  }

  let waiverTotal = 0;
  for (const row of waiverRows || []) {
    waiverTotal = money(waiverTotal + money(row.discountAmount));
    items.push({
      kind: 'WAIVER',
      id: row.memberId,
      code: null,
      discount: money(row.discountAmount),
      studentId: null,
      studentName: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
      groupName: row.groupName || null,
      reason: row.discountReason || null,
      date: row.updatedAt,
    });
  }

  const staffMap = new Map();
  for (const log of staffLogs || []) {
    const meta = parseMeta(log.metadata);
    const amount = money(meta.discountAmount);
    const entry = staffMap.get(log.userId || 'system') || {
      userId: log.userId || null,
      count: 0,
      amount: 0,
    };
    entry.count += 1;
    entry.amount = money(entry.amount + amount);
    staffMap.set(log.userId || 'system', entry);
  }

  items.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  return {
    period: { from: rangeStart, to: now, months: safeMonths },
    summary: {
      couponDiscounts: couponTotal,
      couponUses: (redemptions || []).length,
      activeWaivers: (waiverRows || []).length,
      waiversValue: waiverTotal,
      totalImpact: money(couponTotal + waiverTotal),
      manualWaivers: (staffLogs || []).length,
    },
    byCode: [...byCodeMap.values()].sort((a, b) => b.amount - a.amount),
    byMonth: [...byMonthMap.values()].sort((a, b) => a.month.localeCompare(b.month)),
    byStaff: [...staffMap.values()].sort((a, b) => b.amount - a.amount),
    items: items.slice(0, 200),
  };
}

module.exports = { buildDiscountReport };

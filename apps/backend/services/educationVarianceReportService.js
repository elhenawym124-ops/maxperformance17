/**
 * Cash variance reporting across cashier shifts and daily closings.
 *
 * variance = actual − expected (negative = short, positive = over).
 * Both sources are read so a day can be reconciled even when the desk
 * closed the day without a shift, and vice versa.
 */

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

const monthKey = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const classify = (difference) => {
  if (Math.abs(difference) < 0.01) return 'BALANCED';
  return difference < 0 ? 'SHORT' : 'OVER';
};

async function buildVarianceReport(prisma, companyId, { months = 6 } = {}) {
  const safeMonths = Math.min(24, Math.max(1, Number(months) || 6));
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (safeMonths - 1), 1);

  const [shifts, closings] = await Promise.all([
    prisma.educationCashierShift.findMany({
      where: {
        companyId,
        status: 'CLOSED',
        closedAt: { gte: rangeStart },
        difference: { not: null },
      },
      orderBy: { closedAt: 'desc' },
      take: 2000,
      select: {
        id: true, cashierId: true, cashierName: true, openedAt: true, closedAt: true,
        expectedCash: true, closingBalance: true, difference: true, notes: true,
      },
    }).catch(() => []),
    prisma.educationDailyClosing.findMany({
      where: { companyId, date: { gte: rangeStart } },
      orderBy: { date: 'desc' },
      take: 2000,
      select: {
        id: true, date: true, status: true, closedByName: true,
        cashierExpected: true, cashierActual: true, cashierDifference: true,
      },
    }).catch(() => []),
  ]);

  const items = [];
  const byStaffMap = new Map();
  const byMonthMap = new Map();
  let short = 0;
  let over = 0;
  let balanced = 0;
  let netVariance = 0;
  let absVariance = 0;

  const register = ({ kind, id, label, staffId, staffName, date, expected, actual, difference }) => {
    const variance = money(difference);
    const state = classify(variance);
    if (state === 'SHORT') short += 1;
    else if (state === 'OVER') over += 1;
    else balanced += 1;
    netVariance = money(netVariance + variance);
    absVariance = money(absVariance + Math.abs(variance));

    const staffKey = staffId || staffName || 'system';
    const staffRow = byStaffMap.get(staffKey) || {
      staffId: staffId || null,
      staffName: staffName || 'غير محدد',
      shifts: 0,
      short: 0,
      over: 0,
      net: 0,
      abs: 0,
    };
    staffRow.shifts += 1;
    if (state === 'SHORT') staffRow.short += 1;
    if (state === 'OVER') staffRow.over += 1;
    staffRow.net = money(staffRow.net + variance);
    staffRow.abs = money(staffRow.abs + Math.abs(variance));
    byStaffMap.set(staffKey, staffRow);

    const key = monthKey(date);
    if (key) {
      const month = byMonthMap.get(key) || { month: key, net: 0, abs: 0, short: 0, over: 0 };
      month.net = money(month.net + variance);
      month.abs = money(month.abs + Math.abs(variance));
      if (state === 'SHORT') month.short += 1;
      if (state === 'OVER') month.over += 1;
      byMonthMap.set(key, month);
    }

    items.push({
      kind,
      id,
      label,
      staffName: staffName || null,
      date,
      expected: money(expected),
      actual: money(actual),
      difference: variance,
      state,
    });
  };

  for (const shift of shifts || []) {
    register({
      kind: 'SHIFT',
      id: shift.id,
      label: shift.cashierName || 'شيفت كاشير',
      staffId: shift.cashierId,
      staffName: shift.cashierName,
      date: shift.closedAt || shift.openedAt,
      expected: shift.expectedCash || 0,
      actual: shift.closingBalance || 0,
      difference: shift.difference || 0,
    });
  }

  for (const closing of closings || []) {
    const expected = money(closing.cashierExpected);
    const actual = money(closing.cashierActual);
    if (expected === 0 && actual === 0) continue;
    register({
      kind: 'CLOSING',
      id: closing.id,
      label: `${closing.status === 'REOPENED' ? 'إغلاق مُعاد فتحه' : 'إغلاق يومي'} — ${new Date(closing.date).toISOString().slice(0, 10)}`,
      staffId: null,
      staffName: closing.closedByName,
      date: closing.date,
      expected,
      actual,
      difference: closing.cashierDifference || money(actual - expected),
    });
  }

  items.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  return {
    period: { from: rangeStart, to: now, months: safeMonths },
    summary: {
      incidents: items.length,
      short,
      over,
      balanced,
      netVariance,
      absVariance,
      shifts: (shifts || []).length,
      closings: (closings || []).length,
    },
    byStaff: [...byStaffMap.values()].sort((a, b) => b.abs - a.abs),
    byMonth: [...byMonthMap.values()].sort((a, b) => a.month.localeCompare(b.month)),
    items: items.slice(0, 200),
  };
}

module.exports = { buildVarianceReport };

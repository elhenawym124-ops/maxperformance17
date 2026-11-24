/**
 * Follow-up performance: did the win-back worklist actually convert?
 *
 * - Closed cases come from actions with handledAt; the handler name is stored on
 *   the action, so no extra join is needed.
 * - "Reactivated" = the student made a payment after the action was created,
 *   which is the only proof that the follow-up produced money.
 */

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;
const pct = (part, total) => (total > 0 ? Math.round((part / total) * 1000) / 10 : null);

const HOUR_MS = 3600 * 1000;

async function buildWinbackPerformance(prisma, companyId, { months = 3 } = {}) {
  const safeMonths = Math.min(24, Math.max(1, Number(months) || 3));
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (safeMonths - 1), 1);

  const actions = await prisma.educationWinbackAction.findMany({
    where: { companyId, createdAt: { gte: rangeStart } },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  }).catch(() => []);

  if (!actions || actions.length === 0) {
    return {
      period: { from: rangeStart, to: now, months: safeMonths },
      summary: {
        created: 0, closed: 0, open: 0, closedRate: null,
        avgCloseHours: null, reactivated: 0, reactivationRate: null, revenueRecovered: 0,
      },
      byStaff: [],
      byReason: [],
    };
  }

  const studentIds = [...new Set(actions.map((action) => action.studentId).filter(Boolean))];
  const payments = studentIds.length
    ? await prisma.educationPayment.findMany({
      where: {
        companyId,
        studentId: { in: studentIds },
        status: 'COMPLETED',
        paidAt: { gte: rangeStart },
      },
      select: { studentId: true, amount: true, paidAt: true },
      take: 10000,
    }).catch(() => [])
    : [];

  const paymentsByStudent = new Map();
  for (const payment of payments || []) {
    const list = paymentsByStudent.get(payment.studentId) || [];
    list.push(payment);
    paymentsByStudent.set(payment.studentId, list);
  }

  const staffMap = new Map();
  const reasonMap = new Map();
  let closed = 0;
  let open = 0;
  let reactivated = 0;
  let revenueRecovered = 0;
  let hoursSum = 0;
  let hoursCount = 0;

  for (const action of actions) {
    const status = String(action.status || 'OPEN').toUpperCase();
    const createdAt = action.createdAt ? new Date(action.createdAt) : null;
    const handledAt = action.handledAt ? new Date(action.handledAt) : null;

    const studentPayments = (paymentsByStudent.get(action.studentId) || [])
      .filter((payment) => createdAt && payment.paidAt && new Date(payment.paidAt).getTime() >= createdAt.getTime());
    const recovered = money(studentPayments.reduce((sum, payment) => sum + money(payment.amount), 0));
    const didConvert = studentPayments.length > 0 && recovered > 0;

    if (didConvert) {
      reactivated += 1;
      revenueRecovered = money(revenueRecovered + recovered);
    }

    const staffKey = action.handledBy || 'غير محدد';
    const staff = staffMap.get(staffKey) || {
      staff: staffKey, closed: 0, done: 0, ignored: 0, hours: 0, hoursCount: 0, reactivated: 0, revenue: 0,
    };

    if (status === 'OPEN') {
      open += 1;
    } else {
      closed += 1;
      staff.closed += 1;
      if (status === 'DONE') staff.done += 1;
      if (status === 'IGNORED') staff.ignored += 1;
      if (createdAt && handledAt) {
        const hours = Math.max(0, (handledAt.getTime() - createdAt.getTime()) / HOUR_MS);
        hoursSum += hours;
        hoursCount += 1;
        staff.hours += hours;
        staff.hoursCount += 1;
      }
    }

    if (didConvert) {
      staff.reactivated += 1;
      staff.revenue = money(staff.revenue + recovered);
    }
    staffMap.set(staffKey, staff);

    for (const reason of Array.isArray(action.reasons) ? action.reasons : []) {
      const bucket = reasonMap.get(reason) || { reason, total: 0, reactivated: 0, revenue: 0 };
      bucket.total += 1;
      if (didConvert) {
        bucket.reactivated += 1;
        bucket.revenue = money(bucket.revenue + recovered);
      }
      reasonMap.set(reason, bucket);
    }
  }

  const byStaff = [...staffMap.values()]
    .map((row) => ({
      staff: row.staff,
      closed: row.closed,
      done: row.done,
      ignored: row.ignored,
      avgCloseHours: row.hoursCount ? Math.round((row.hours / row.hoursCount) * 10) / 10 : null,
      reactivated: row.reactivated,
      revenue: money(row.revenue),
      conversionRate: pct(row.reactivated, row.closed),
    }))
    .sort((a, b) => b.revenue - a.revenue || b.closed - a.closed);

  const byReason = [...reasonMap.values()]
    .map((row) => ({
      ...row,
      revenue: money(row.revenue),
      conversionRate: pct(row.reactivated, row.total),
    }))
    .sort((a, b) => b.total - a.total);

  return {
    period: { from: rangeStart, to: now, months: safeMonths },
    summary: {
      created: actions.length,
      closed,
      open,
      closedRate: pct(closed, actions.length),
      avgCloseHours: hoursCount ? Math.round((hoursSum / hoursCount) * 10) / 10 : null,
      reactivated,
      reactivationRate: pct(reactivated, actions.length),
      revenueRecovered,
    },
    byStaff,
    byReason,
  };
}

module.exports = { buildWinbackPerformance };

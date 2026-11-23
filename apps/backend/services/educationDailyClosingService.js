/**
 * Education daily closing (Z-report): one report per company/day that ties the
 * payment ledger, cashier drawer, wallet top-ups and treasury together.
 */

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

const parseDay = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const raw = String(value || '').slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const dayBounds = (value) => {
  const start = parseDay(value);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  return { start, end };
};

const dateKey = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const computeLiveShift = async (prisma, companyId, shift, until) => {
  const [collectedRows, reversedRows] = await Promise.all([
    prisma.educationPayment.findMany({
      where: { companyId, method: 'CASH', paidAt: { gte: shift.openedAt, lte: until } },
      select: { amount: true },
    }),
    prisma.educationPayment.findMany({
      where: { companyId, reversedAmount: { gt: 0 }, reversedAt: { gte: shift.openedAt, lte: until } },
      select: { reversedAmount: true },
    }),
  ]);
  const collected = money(collectedRows.reduce((sum, row) => sum + money(row.amount), 0));
  const reversed = money(reversedRows.reduce((sum, row) => sum + money(row.reversedAmount), 0));
  return {
    collected,
    reversed,
    expected: money(money(shift.openingBalance) + collected - reversed),
  };
};

async function buildDailyReport(prisma, companyId, dateValue, now = new Date()) {
  const { start, end } = dayBounds(dateValue);
  const key = dateKey(start);

  const [payments, reversals, walletTopups, treasuryRows, shifts, closing] = await Promise.all([
    prisma.educationPayment.findMany({
      where: { companyId, paidAt: { gte: start, lt: end } },
      select: { amount: true, method: true, source: true },
    }),
    prisma.educationPayment.findMany({
      where: { companyId, reversedAmount: { gt: 0 }, reversedAt: { gte: start, lt: end } },
      select: { reversedAmount: true },
    }),
    prisma.walletTransaction.findMany({
      where: {
        type: 'CREDIT',
        status: 'RELEASED',
        releasedAt: { gte: start, lt: end },
        wallet: { companyId },
      },
      select: { amount: true },
    }),
    prisma.treasuryTransaction.findMany({
      where: { companyId, date: { gte: start, lt: end }, referenceType: { startsWith: 'EDUCATION_' } },
      select: { amount: true, type: true, referenceType: true },
    }),
    prisma.educationCashierShift.findMany({
      where: { companyId, openedAt: { gte: start, lt: end } },
      orderBy: { openedAt: 'asc' },
    }),
    prisma.educationDailyClosing.findFirst({ where: { companyId, date: start } }),
  ]);

  const byMethod = {};
  const bySource = {};
  let gross = 0;
  for (const payment of payments) {
    const amount = money(payment.amount);
    gross = money(gross + amount);
    const method = payment.method || 'OTHER';
    byMethod[method] = byMethod[method] || { amount: 0, count: 0 };
    byMethod[method].amount = money(byMethod[method].amount + amount);
    byMethod[method].count += 1;
    const source = payment.source || 'ADMIN';
    bySource[source] = bySource[source] || { amount: 0, count: 0 };
    bySource[source].amount = money(bySource[source].amount + amount);
    bySource[source].count += 1;
  }

  const reversed = money(reversals.reduce((sum, row) => sum + money(row.reversedAmount), 0));
  const walletTopupsTotal = money(walletTopups.reduce((sum, row) => sum + money(row.amount), 0));

  let treasuryDeposits = 0;
  let treasuryExpenses = 0;
  for (const row of treasuryRows) {
    if (String(row.type || '').toUpperCase() === 'DEPOSIT') {
      treasuryDeposits = money(treasuryDeposits + money(row.amount));
    } else if (String(row.type || '').toUpperCase() === 'EXPENSE') {
      treasuryExpenses = money(treasuryExpenses + money(row.amount));
    }
  }

  const shiftRows = [];
  let cashierExpected = 0;
  let cashierActual = 0;
  let cashierDifference = 0;
  let openShifts = 0;

  for (const shift of shifts) {
    if (shift.status === 'CLOSED') {
      const expected = money(shift.expectedCash);
      const actual = money(shift.closingBalance);
      const difference = money(shift.difference);
      cashierExpected = money(cashierExpected + expected);
      cashierActual = money(cashierActual + actual);
      cashierDifference = money(cashierDifference + difference);
      shiftRows.push({
        id: shift.id,
        cashierName: shift.cashierName,
        status: shift.status,
        openedAt: shift.openedAt,
        closedAt: shift.closedAt,
        openingBalance: money(shift.openingBalance),
        collected: money(shift.cashCollected),
        reversed: money(shift.cashReversed),
        expected,
        actual,
        difference,
      });
    } else {
      openShifts += 1;
      const live = await computeLiveShift(prisma, companyId, shift, now);
      shiftRows.push({
        id: shift.id,
        cashierName: shift.cashierName,
        status: shift.status,
        openedAt: shift.openedAt,
        closedAt: null,
        openingBalance: money(shift.openingBalance),
        collected: live.collected,
        reversed: live.reversed,
        expected: live.expected,
        actual: null,
        difference: null,
      });
    }
  }

  const warnings = [];
  if (openShifts > 0) warnings.push(`${openShifts} شيفت كاشير مفتوح لم يُغلق`);
  if (Math.abs(cashierDifference) > 0.009) warnings.push(`فرق في درج الكاشير: ${cashierDifference} ج.م`);

  return {
    date: key,
    status: closing?.status || 'OPEN',
    closing: closing
      ? {
          id: closing.id,
          status: closing.status,
          closedAt: closing.closedAt,
          closedByName: closing.closedByName,
          notes: closing.notes,
          reopenedAt: closing.reopenedAt,
          reopenReason: closing.reopenReason,
        }
      : null,
    payments: {
      count: payments.length,
      gross,
      net: money(gross - reversed),
      reversed,
      byMethod,
      bySource,
    },
    walletTopups: { count: walletTopups.length, total: walletTopupsTotal },
    treasury: {
      deposits: treasuryDeposits,
      expenses: treasuryExpenses,
      net: money(treasuryDeposits - treasuryExpenses),
    },
    cashier: {
      shifts: shiftRows,
      expected: cashierExpected,
      actual: cashierActual,
      difference: cashierDifference,
      openShifts,
    },
    walletPurchases: money(bySource.PARENT_WALLET?.amount || 0),
    warnings,
  };
}

async function assertDayOpen(prisma, companyId, dateValue) {
  if (!prisma.educationDailyClosing || typeof prisma.educationDailyClosing.findFirst !== 'function') {
    return true;
  }
  const { start } = dayBounds(dateValue);
  const closed = await prisma.educationDailyClosing.findFirst({
    where: { companyId, date: start, status: 'CLOSED' },
    select: { id: true, date: true },
  });
  if (closed) {
    const error = new Error(`تم إغلاق يوم ${dateKey(start)} — أعد فتحه قبل تسجيل أي حركة مالية`);
    error.statusCode = 409;
    throw error;
  }
  return true;
}

module.exports = {
  buildDailyReport,
  assertDayOpen,
  parseDay,
  dayBounds,
  dateKey,
};

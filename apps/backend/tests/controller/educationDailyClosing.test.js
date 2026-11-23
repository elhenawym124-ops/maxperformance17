const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const state = {
  payments: [],
  walletTx: [],
  treasuryTx: [],
  shifts: [],
  closings: [],
  audits: [],
};

const inRange = (value, range) => {
  if (!range) return true;
  const time = new Date(value).getTime();
  if (range.gte && time < new Date(range.gte).getTime()) return false;
  if (range.lt && time >= new Date(range.lt).getTime()) return false;
  return true;
};

const mockPrisma = {
  educationPayment: {
    findMany: async ({ where = {} }) => state.payments.filter((payment) => {
      if (where.paidAt && !inRange(payment.paidAt, where.paidAt)) return false;
      if (where.reversedAmount?.gt !== undefined && !(Number(payment.reversedAmount || 0) > where.reversedAmount.gt)) return false;
      if (where.reversedAt && !(payment.reversedAt && inRange(payment.reversedAt, where.reversedAt))) return false;
      return true;
    }),
  },
  walletTransaction: {
    findMany: async ({ where = {} }) => state.walletTx.filter((tx) =>
      (!where.type || tx.type === where.type) &&
      (!where.status || tx.status === where.status) &&
      (!where.releasedAt || (tx.releasedAt && inRange(tx.releasedAt, where.releasedAt))) &&
      (!where.wallet?.companyId || tx.companyId === where.wallet.companyId)
    ),
  },
  treasuryTransaction: {
    findMany: async ({ where = {} }) => state.treasuryTx.filter((tx) =>
      (!where.date || inRange(tx.date, where.date)) &&
      (!where.referenceType?.startsWith || String(tx.referenceType || '').startsWith(where.referenceType.startsWith))
    ),
  },
  educationCashierShift: {
    findMany: async ({ where = {} }) => state.shifts.filter((shift) =>
      (!where.openedAt || inRange(shift.openedAt, where.openedAt))
    ),
  },
  educationDailyClosing: {
    findFirst: async ({ where }) => state.closings.find((closing) =>
      (!where.id || closing.id === where.id) &&
      (!where.companyId || closing.companyId === where.companyId) &&
      (!where.status || closing.status === where.status) &&
      (!where.date || new Date(closing.date).getTime() === new Date(where.date).getTime())
    ) || null,
    create: async ({ data }) => {
      const closing = { id: `close-${state.closings.length + 1}`, ...data };
      state.closings.push(closing);
      return closing;
    },
    update: async ({ where, data }) => {
      const closing = state.closings.find((item) => item.id === where.id);
      Object.assign(closing, data);
      return closing;
    },
    findMany: async ({ where = {}, take = 14 }) =>
      state.closings.filter((closing) => !where.companyId || closing.companyId === where.companyId).slice(0, take),
  },
};

const sharedDbPath = require.resolve('../../services/sharedDatabase');
require.cache[sharedDbPath] = {
  id: sharedDbPath, filename: sharedDbPath, loaded: true,
  exports: { getSharedPrismaClient: () => mockPrisma },
};

const auditPath = require.resolve('../../services/educationAuditService');
require.cache[auditPath] = {
  id: auditPath, filename: auditPath, loaded: true,
  exports: { logEducationEvent: async (event) => { state.audits.push(event); return null; } },
};

const controller = require('../../controller/educationDailyClosingController');
const service = require('../../services/educationDailyClosingService');

const makeRes = () => ({
  statusCode: 200,
  payload: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.payload = body; return this; },
});

const makeReq = (body = {}, query = {}, params = {}, user = { id: 'u-1', companyId: 'comp-1', name: 'مدير' }) => ({
  body, query, params, user, headers: {},
});

const today = new Date();
const at = (hour) => new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, 0, 0).toISOString();
const todayKey = service.dateKey(today);

beforeEach(() => {
  state.payments = [
    { amount: 300, method: 'CASH', source: 'ADMIN', paidAt: at(10), reversedAmount: 0, reversedAt: null },
    { amount: 500, method: 'CARD', source: 'ONLINE', paidAt: at(11), reversedAmount: 0, reversedAt: null },
    { amount: 200, method: 'CASH', source: 'GROUP', paidAt: at(12), reversedAmount: 50, reversedAt: at(13) },
    { amount: 400, method: 'WALLET', source: 'PARENT_WALLET', paidAt: at(14), reversedAmount: 0, reversedAt: null },
    { amount: 999, method: 'CASH', source: 'ADMIN', paidAt: new Date(today.getTime() - 5 * 86400000).toISOString(), reversedAmount: 0, reversedAt: null },
  ];
  state.walletTx = [
    { type: 'CREDIT', status: 'RELEASED', amount: 700, releasedAt: at(9), companyId: 'comp-1' },
    { type: 'CREDIT', status: 'RELEASED', amount: 100, releasedAt: at(9), companyId: 'comp-2' },
  ];
  state.treasuryTx = [
    { amount: 300, type: 'DEPOSIT', referenceType: 'EDUCATION_PAYMENT', date: at(10) },
    { amount: 500, type: 'DEPOSIT', referenceType: 'EDUCATION_INSTALLMENT_ONLINE', date: at(11) },
    { amount: 700, type: 'DEPOSIT', referenceType: 'EDUCATION_WALLET_TOPUP', date: at(9) },
    { amount: 50, type: 'EXPENSE', referenceType: 'EDUCATION_PAYMENT_REVERSAL', date: at(13) },
    { amount: 999, type: 'DEPOSIT', referenceType: 'OTHER', date: at(15) },
  ];
  state.shifts = [
    { id: 's1', cashierName: 'منى', status: 'CLOSED', openedAt: at(8), closedAt: at(20), openingBalance: 100, expectedCash: 500, closingBalance: 480, difference: -20, cashCollected: 400, cashReversed: 0 },
    { id: 's2', cashierName: 'أحمد', status: 'OPEN', openedAt: at(9), openingBalance: 0, cashCollected: 0, cashReversed: 0 },
  ];
  state.closings = [];
  state.audits = [];
});

describe('education daily closing', () => {
  it('builds the Z-report totals, cashier reconciliation and warnings', async () => {
    const report = await service.buildDailyReport(mockPrisma, 'comp-1', todayKey);

    assert.strictEqual(report.payments.gross, 1400);
    assert.strictEqual(report.payments.reversed, 50);
    assert.strictEqual(report.payments.net, 1350);
    assert.strictEqual(report.payments.byMethod.CASH.amount, 500);
    assert.strictEqual(report.payments.byMethod.CARD.amount, 500);
    assert.strictEqual(report.walletTopups.total, 700);
    assert.strictEqual(report.treasury.deposits, 1500);
    assert.strictEqual(report.treasury.expenses, 50);
    assert.strictEqual(report.treasury.net, 1450);
    assert.strictEqual(report.cashier.expected, 500);
    assert.strictEqual(report.cashier.actual, 480);
    assert.strictEqual(report.cashier.difference, -20);
    assert.strictEqual(report.cashier.openShifts, 1);
    assert.strictEqual(report.walletPurchases, 400);
    assert.strictEqual(report.warnings.length, 2);
  });

  it('closes the day, stores the snapshot and blocks duplicate closing', async () => {
    let res = makeRes();
    await controller.closeDay(makeReq({ date: todayKey, notes: 'إغلاق تجريبي' }), res);

    assert.strictEqual(res.statusCode, 200, JSON.stringify(res.payload));
    assert.strictEqual(res.payload.data.status, 'CLOSED');
    assert.strictEqual(state.closings.length, 1);
    assert.strictEqual(state.closings[0].totalGross, 1400);
    assert.strictEqual(state.closings[0].cashierDifference, -20);
    assert.strictEqual(state.closings[0].closedByName, 'مدير');
    assert.strictEqual(state.audits[0].action, 'CLOSE_DAILY');

    res = makeRes();
    await controller.closeDay(makeReq({ date: todayKey }), res);
    assert.strictEqual(res.statusCode, 409);
  });

  it('rejects closing a future day', async () => {
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const res = makeRes();
    await controller.closeDay(makeReq({ date: service.dateKey(tomorrow) }), res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(state.closings.length, 0);
  });

  it('returns the stored snapshot for a closed day instead of live data', async () => {
    let res = makeRes();
    await controller.closeDay(makeReq({ date: todayKey }), res);

    state.payments.push({ amount: 9999, method: 'CASH', source: 'ADMIN', paidAt: at(21), reversedAmount: 0, reversedAt: null });
    res = makeRes();
    await controller.getDailyClosing(makeReq({}, { date: todayKey }), res);

    assert.strictEqual(res.payload.data.status, 'CLOSED');
    assert.strictEqual(res.payload.data.payments.gross, 1400);
  });

  it('reopens a closed day with a reason', async () => {
    let res = makeRes();
    await controller.closeDay(makeReq({ date: todayKey }), res);
    const id = state.closings[0].id;

    res = makeRes();
    await controller.reopenDay(makeReq({ reason: 'فرق غير مبرر' }, {}, { id }), res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.closings[0].status, 'REOPENED');
    assert.strictEqual(state.closings[0].reopenReason, 'فرق غير مبرر');
    assert.ok(state.audits.some((event) => event.action === 'REOPEN_DAILY'));

    res = makeRes();
    await controller.reopenDay(makeReq({}, {}, { id }), res);
    assert.strictEqual(res.statusCode, 409);
  });

  it('blocks money movement on a closed day', async () => {
    await controller.closeDay(makeReq({ date: todayKey }), makeRes());
    await assert.rejects(
      () => service.assertDayOpen(mockPrisma, 'comp-1', new Date()),
      /إغلاق/
    );
    // another tenant/day stays open
    await service.assertDayOpen(mockPrisma, 'comp-2', new Date());
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    await service.assertDayOpen(mockPrisma, 'comp-1', yesterday);
  });

  it('lists closing history', async () => {
    await controller.closeDay(makeReq({ date: todayKey }), makeRes());
    const res = makeRes();
    await controller.listClosings(makeReq({}, { limit: 7 }), res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload.data.length, 1);
    assert.strictEqual(res.payload.data[0].totalGross, 1400);
  });
});

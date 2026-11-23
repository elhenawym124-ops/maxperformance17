const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const state = {
  shifts: [],
  payments: [],
  audits: [],
};

const inRange = (value, range) => {
  if (!range) return true;
  const time = new Date(value).getTime();
  if (range.gte && time < new Date(range.gte).getTime()) return false;
  if (range.lte && time > new Date(range.lte).getTime()) return false;
  return true;
};

const mockPrisma = {
  educationCashierShift: {
    findFirst: async ({ where }) =>
      state.shifts.find(
        (shift) =>
          (!where.id || shift.id === where.id) &&
          (!where.companyId || shift.companyId === where.companyId) &&
          (!where.cashierId || shift.cashierId === where.cashierId) &&
          (!where.status || shift.status === where.status)
      ) || null,
    create: async ({ data }) => {
      const shift = {
        id: `shift-${state.shifts.length + 1}`,
        openedAt: new Date().toISOString(),
        closedAt: null,
        ...data,
      };
      state.shifts.push(shift);
      return shift;
    },
    update: async ({ where, data }) => {
      const shift = state.shifts.find((item) => item.id === where.id);
      if (!shift) throw new Error('shift not found');
      Object.assign(shift, data);
      return shift;
    },
    findMany: async ({ where = {}, skip = 0, take = 20 }) => {
      let rows = state.shifts.filter((shift) => !where.companyId || shift.companyId === where.companyId);
      if (where.status) rows = rows.filter((shift) => shift.status === where.status);
      return rows.slice(skip, skip + take);
    },
    count: async ({ where = {} }) =>
      state.shifts.filter((shift) => !where.companyId || shift.companyId === where.companyId).length,
  },
  educationPayment: {
    findMany: async ({ where = {}, take = 200 }) => {
      let rows = state.payments.filter((payment) => !where.companyId || payment.companyId === where.companyId);
      if (where.method) rows = rows.filter((payment) => payment.method === where.method);
      if (where.paidAt) rows = rows.filter((payment) => inRange(payment.paidAt, where.paidAt));
      if (where.reversedAmount?.gt !== undefined) {
        rows = rows.filter((payment) => Number(payment.reversedAmount || 0) > where.reversedAmount.gt);
      }
      if (where.reversedAt) rows = rows.filter((payment) => payment.reversedAt && inRange(payment.reversedAt, where.reversedAt));
      return rows.slice(0, take);
    },
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

const controller = require('../../controller/educationCashierShiftsController');

const makeRes = () => ({
  statusCode: 200,
  payload: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.payload = body; return this; },
});

const makeReq = (body = {}, query = {}, params = {}, user = { id: 'user-1', companyId: 'comp-1', name: 'منى' }) => ({
  body, query, params, user, headers: {},
});

const addCashPayment = (amount, paidAt, overrides = {}) => {
  state.payments.push({
    id: `p-${state.payments.length + 1}`,
    companyId: 'comp-1',
    method: 'CASH',
    amount,
    reversedAmount: 0,
    reversedAt: null,
    status: 'COMPLETED',
    paidAt,
    studentName: 'سارة',
    paymentNumber: `EDU-PAY-${state.payments.length + 1}`,
    ...overrides,
  });
};

beforeEach(() => {
  state.shifts = [];
  state.payments = [];
  state.audits = [];
});

describe('education cashier shifts', () => {
  it('opens a shift and rejects a duplicate open shift for the same cashier', async () => {
    let res = makeRes();
    await controller.openShift(makeReq({ openingBalance: 200 }), res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload.data.status, 'OPEN');
    assert.strictEqual(res.payload.data.openingBalance, 200);
    assert.strictEqual(res.payload.data.cashierName, 'منى');
    assert.strictEqual(state.audits[0].action, 'OPEN_CASHIER_SHIFT');

    res = makeRes();
    await controller.openShift(makeReq({ openingBalance: 50 }), res);
    assert.strictEqual(res.statusCode, 409);
  });

  it('rejects a negative opening balance', async () => {
    const res = makeRes();
    await controller.openShift(makeReq({ openingBalance: -1 }), res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(state.shifts.length, 0);
  });

  it('computes live expected cash from cash collections minus reversals', async () => {
    const openedAt = new Date(Date.now() - 3600 * 1000).toISOString();
    state.shifts.push({
      id: 'shift-1', companyId: 'comp-1', cashierId: 'user-1', cashierName: 'منى',
      openedAt, status: 'OPEN', openingBalance: 100,
    });
    addCashPayment(300, new Date(Date.now() - 1000).toISOString());
    addCashPayment(200, new Date(Date.now() - 500).toISOString(), {
      status: 'PARTIALLY_REVERSED', reversedAmount: 50, reversedAt: new Date(Date.now() - 200).toISOString(),
    });
    // non-cash and payments outside the shift must be ignored
    addCashPayment(999, new Date(Date.now() - 1000).toISOString(), { method: 'TRANSFER' });
    addCashPayment(777, new Date(Date.now() - 5 * 3600 * 1000).toISOString());

    const res = makeRes();
    await controller.getCurrentShift(makeReq({}, {}, {}, { id: 'user-1', companyId: 'comp-1' }), res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload.data.live.collected, 500);
    assert.strictEqual(res.payload.data.live.reversed, 50);
    assert.strictEqual(res.payload.data.live.net, 450);
    assert.strictEqual(res.payload.data.live.expected, 550);
  });

  it('closes a shift with expected, actual and difference', async () => {
    const openedAt = new Date(Date.now() - 3600 * 1000).toISOString();
    state.shifts.push({
      id: 'shift-1', companyId: 'comp-1', cashierId: 'user-1', cashierName: 'منى',
      openedAt, status: 'OPEN', openingBalance: 100,
    });
    addCashPayment(400, new Date(Date.now() - 1000).toISOString());

    const req = makeReq({ closingBalance: 480, notes: 'نقص 20' }, {}, { id: 'shift-1' });
    const res = makeRes();
    await controller.closeShift(req, res);

    assert.strictEqual(res.statusCode, 200);
    const shift = res.payload.data;
    assert.strictEqual(shift.status, 'CLOSED');
    assert.strictEqual(shift.cashCollected, 400);
    assert.strictEqual(shift.expectedCash, 500);
    assert.strictEqual(shift.closingBalance, 480);
    assert.strictEqual(shift.difference, -20);
    assert.strictEqual(shift.notes, 'نقص 20');
    assert.strictEqual(state.audits[0].action, 'CLOSE_CASHIER_SHIFT');
  });

  it('treats a missing closing balance as expected (zero difference)', async () => {
    state.shifts.push({
      id: 'shift-1', companyId: 'comp-1', cashierId: 'user-1', cashierName: 'منى',
      openedAt: new Date(Date.now() - 1000).toISOString(), status: 'OPEN', openingBalance: 0,
    });
    addCashPayment(150, new Date().toISOString());

    const res = makeRes();
    await controller.closeShift(makeReq({}, {}, { id: 'shift-1' }), res);
    assert.strictEqual(res.payload.data.closingBalance, 150);
    assert.strictEqual(res.payload.data.difference, 0);
  });

  it('refuses to close twice or across tenants', async () => {
    state.shifts.push({
      id: 'shift-1', companyId: 'comp-1', cashierId: 'user-1', cashierName: 'منى',
      openedAt: new Date().toISOString(), status: 'CLOSED', openingBalance: 0,
    });
    let res = makeRes();
    await controller.closeShift(makeReq({}, {}, { id: 'shift-1' }), res);
    assert.strictEqual(res.statusCode, 409);

    state.shifts[0].status = 'OPEN';
    res = makeRes();
    await controller.closeShift(
      makeReq({}, {}, { id: 'shift-1' }, { id: 'u', companyId: 'other' }),
      res
    );
    assert.strictEqual(res.statusCode, 404);
  });

  it('lists shifts with pagination metadata', async () => {
    state.shifts.push(
      { id: 's1', companyId: 'comp-1', status: 'CLOSED', openedAt: new Date().toISOString() },
      { id: 's2', companyId: 'comp-1', status: 'OPEN', openedAt: new Date().toISOString() },
      { id: 's3', companyId: 'other', status: 'OPEN', openedAt: new Date().toISOString() }
    );
    const res = makeRes();
    await controller.listShifts(makeReq({}, { page: '1', limit: '1' }), res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload.data.length, 1);
    assert.strictEqual(res.payload.pagination.total, 2);
    assert.strictEqual(res.payload.pagination.totalPages, 2);
  });

  it('returns a shift with its cash payments', async () => {
    state.shifts.push({
      id: 'shift-1', companyId: 'comp-1', status: 'OPEN',
      openedAt: new Date(Date.now() - 3600 * 1000).toISOString(), openingBalance: 50,
    });
    addCashPayment(120, new Date().toISOString());

    const res = makeRes();
    await controller.getShiftById(makeReq({}, {}, { id: 'shift-1' }), res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload.data.payments.length, 1);
    assert.strictEqual(res.payload.data.live.expected, 170);
  });
});

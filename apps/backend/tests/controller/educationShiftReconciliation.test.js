const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const state = {
  shift: null,
  payments: [],
  reversals: [],
  update: null,
  audits: [],
};

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

const mockPrisma = {
  educationCashierShift: {
    findFirst: async ({ where }) => (state.shift && state.shift.id === where.id ? clone(state.shift) : null),
    update: async ({ where, data }) => {
      state.update = { where, data: clone(data) };
      Object.assign(state.shift, clone(data));
      return clone(state.shift);
    },
  },
  educationPayment: {
    findMany: async ({ where }) => {
      if (where.reversedAmount?.gt !== undefined) return clone(state.reversals);
      const excluded = where.status?.notIn || [];
      return clone(state.payments.filter((row) =>
        (!where.method || row.method === where.method) && !excluded.includes(row.status)
      ));
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

const makeReq = (body = {}, params = {}, user = { id: 'u-1', companyId: 'comp-1', name: 'كاشير' }) => ({
  body, params, query: {}, user, headers: {},
});

beforeEach(() => {
  state.shift = {
    id: 'shift-1',
    companyId: 'comp-1',
    cashierId: 'u-1',
    cashierName: 'كاشير',
    status: 'OPEN',
    openedAt: new Date('2026-11-24T08:00:00Z'),
    closedAt: null,
    openingBalance: 200,
    closingBalance: null,
    cashCollected: 0,
    cashReversed: 0,
    expectedCash: 0,
    difference: null,
    declaredByMethod: null,
    notes: null,
  };
  state.payments = [
    { amount: 500, method: 'CASH', status: 'COMPLETED', reversedAmount: 0 },
    { amount: 300, method: 'TRANSFER', status: 'COMPLETED', reversedAmount: 0 },
    { amount: 400, method: 'WALLET', status: 'COMPLETED', reversedAmount: 0 },
    { amount: 100, method: 'CASH', status: 'CANCELLED', reversedAmount: 0 },
  ];
  state.reversals = [{ reversedAmount: 50, method: 'CASH' }];
  state.update = null;
  state.audits = [];
});

describe('cashier shift reconciliation', () => {
  it('builds per-method expected totals net of reversals', async () => {
    const res = makeRes();
    await controller.getShiftReconciliation(makeReq({}, { id: 'shift-1' }), res);

    assert.strictEqual(res.statusCode, 200);
    const data = res.payload.data;

    const cash = data.byMethod.find((row) => row.method === 'CASH');
    assert.strictEqual(cash.collected, 500);
    assert.strictEqual(cash.reversed, 50);
    assert.strictEqual(cash.net, 450);
    assert.strictEqual(cash.declared, null);
    assert.strictEqual(cash.difference, null);

    const transfer = data.byMethod.find((row) => row.method === 'TRANSFER');
    assert.strictEqual(transfer.net, 300);

    // cancelled payments never count
    assert.strictEqual(data.totals.collected, 1200);
    assert.strictEqual(data.totals.reversed, 50);
    assert.strictEqual(data.totals.net, 1150);
    assert.strictEqual(data.expectedCash, 650); // 200 opening + 450 cash
  });

  it('compares declared amounts against expected per method', async () => {
    state.shift.declaredByMethod = { CASH: 640, TRANSFER: 300, WALLET: 380 };

    const res = makeRes();
    await controller.getShiftReconciliation(makeReq({}, { id: 'shift-1' }), res);
    const data = res.payload.data;

    assert.strictEqual(data.byMethod.find((row) => row.method === 'CASH').difference, -10);
    assert.strictEqual(data.byMethod.find((row) => row.method === 'TRANSFER').difference, 0);
    assert.strictEqual(data.byMethod.find((row) => row.method === 'WALLET').difference, -20);
    assert.strictEqual(data.totals.declared, 1320);
    assert.strictEqual(data.totals.difference, -30);
  });

  it('stores the declared split on close and returns the reconciliation', async () => {
    const res = makeRes();
    await controller.closeShift(
      makeReq({ closingBalance: 640, declaredByMethod: { TRANSFER: 300, WALLET: 380 } }, { id: 'shift-1' }),
      res
    );

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.update.data.status, 'CLOSED');
    assert.strictEqual(state.update.data.expectedCash, 650);
    assert.strictEqual(state.update.data.difference, -10);
    assert.deepStrictEqual(state.update.data.declaredByMethod, { TRANSFER: 300, WALLET: 380, CASH: 640 });
    assert.strictEqual(res.payload.reconciliation.totals.difference, -30);
  });

  it('defaults the declared split to cash only when none is provided', async () => {
    const res = makeRes();
    await controller.closeShift(makeReq({ closingBalance: 655 }, { id: 'shift-1' }), res);

    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(state.update.data.declaredByMethod, { CASH: 655 });
    assert.strictEqual(state.update.data.difference, 5);
  });

  it('rejects an invalid declared amount and leaves the shift open', async () => {
    const res = makeRes();
    await controller.closeShift(
      makeReq({ closingBalance: 640, declaredByMethod: { TRANSFER: -5 } }, { id: 'shift-1' }),
      res
    );

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(state.update, null);
    assert.strictEqual(state.shift.status, 'OPEN');
  });
});

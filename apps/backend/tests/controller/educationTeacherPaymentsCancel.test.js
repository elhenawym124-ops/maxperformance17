const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const state = {
  payment: null,
  treasury: { id: 'tr-1', balance: 500 },
  treasuryTx: [],
  expenseUpdates: [],
  audits: [],
  reversalExists: false,
};

const mockPrisma = {
  $transaction: async (fn) => fn(mockPrisma),
  educationTeacherPayment: {
    findFirst: async ({ where }) =>
      state.payment && state.payment.id === where.id && state.payment.companyId === where.companyId
        ? state.payment
        : null,
    update: async ({ data }) => {
      Object.assign(state.payment, data);
      return { ...state.payment, teacher: { id: 't-1', name: 'أحمد' } };
    },
  },
  treasuryTransaction: {
    findFirst: async () => (state.reversalExists ? { id: 'existing' } : null),
    create: async ({ data }) => {
      state.treasuryTx.push(data);
      return { id: 'ttx-1', ...data };
    },
  },
  treasuryAccount: {
    update: async ({ data }) => {
      state.treasury.balance += Number(data?.balance?.increment || 0);
      return { ...state.treasury };
    },
  },
  companyExpense: {
    updateMany: async ({ where, data }) => {
      state.expenseUpdates.push({ where, data });
      return { count: 1 };
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

const financialPath = require.resolve('../../services/educationFinancialIntegrationService');
require.cache[financialPath] = {
  id: financialPath, filename: financialPath, loaded: true,
  exports: {
    getOrCreateDefaultTreasury: async () => state.treasury,
    recordTeacherSalaryPayout: async () => ({}),
  },
};

const controller = require('../../controller/educationTeacherPaymentsController');

const makeRes = () => ({
  statusCode: 200,
  payload: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.payload = body; return this; },
});

const makeReq = (body = {}, params = {}, user = { id: 'u-1', companyId: 'comp-1', name: 'مدير' }) => ({
  body, params, user, headers: {},
});

beforeEach(() => {
  state.payment = {
    id: 'pay-1', companyId: 'comp-1', teacherId: 't-1', netAmount: 1000,
    status: 'PAID', paidAt: new Date().toISOString(), notes: 'دفعة أكتوبر',
    teacher: { id: 't-1', name: 'أحمد' },
  };
  state.treasury = { id: 'tr-1', balance: 500 };
  state.treasuryTx = [];
  state.expenseUpdates = [];
  state.audits = [];
  state.reversalExists = false;
});

describe('education teacher payments — cancel', () => {
  it('cancels a paid payroll and reverses the treasury + linked expense', async () => {
    const res = makeRes();
    await controller.cancelPayment(makeReq({ reason: 'خطأ في الحساب' }, { id: 'pay-1' }), res);

    assert.strictEqual(res.statusCode, 200, JSON.stringify(res.payload));
    assert.strictEqual(res.payload.data.status, 'CANCELLED');
    assert.strictEqual(state.payment.status, 'CANCELLED');
    assert.strictEqual(state.payment.paidAt, null);
    assert.match(state.payment.notes, /إلغاء/);
    assert.strictEqual(state.treasury.balance, 1500);
    assert.strictEqual(state.treasuryTx.length, 1);
    assert.strictEqual(state.treasuryTx[0].type, 'DEPOSIT');
    assert.strictEqual(state.treasuryTx[0].amount, 1000);
    assert.strictEqual(state.treasuryTx[0].referenceType, 'EDUCATION_TEACHER_PAYMENT_REVERSAL');
    assert.strictEqual(state.expenseUpdates.length, 1);
    assert.strictEqual(state.expenseUpdates[0].data.status, 'CANCELLED');
    assert.strictEqual(state.audits[0].action, 'CANCEL_PAYMENT');
  });

  it('does not touch the treasury for a pending payroll', async () => {
    state.payment.status = 'PENDING';
    state.payment.paidAt = null;
    const res = makeRes();
    await controller.cancelPayment(makeReq({}, { id: 'pay-1' }), res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.payment.status, 'CANCELLED');
    assert.strictEqual(state.treasury.balance, 500);
    assert.strictEqual(state.treasuryTx.length, 0);
  });

  it('does not double-post if the treasury reversal already exists', async () => {
    state.reversalExists = true;
    const res = makeRes();
    await controller.cancelPayment(makeReq({}, { id: 'pay-1' }), res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.treasury.balance, 500);
    assert.strictEqual(state.treasuryTx.length, 0);
  });

  it('rejects an already cancelled payroll', async () => {
    state.payment.status = 'CANCELLED';
    const res = makeRes();
    await controller.cancelPayment(makeReq({}, { id: 'pay-1' }), res);
    assert.strictEqual(res.statusCode, 409);
  });

  it('rejects cross-tenant payroll ids', async () => {
    const res = makeRes();
    await controller.cancelPayment(makeReq({}, { id: 'pay-1' }, { id: 'u', companyId: 'other' }), res);
    assert.strictEqual(res.statusCode, 404);
  });
});

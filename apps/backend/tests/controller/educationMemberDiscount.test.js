const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const state = {
  member: null,
  updates: [],
  audits: [],
};

const mockPrisma = {
  $queryRawUnsafe: async () => (state.member ? [{ ...state.member }] : []),
  $executeRawUnsafe: async (sql, ...params) => {
    state.updates.push(params);
    return 1;
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

const controller = require('../../controller/educationPaymentsController');

const makeRes = () => ({
  statusCode: 200,
  payload: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.payload = body; return this; },
});

const makeReq = (body = {}, params = {}) => ({
  body, params, query: {}, headers: {},
  user: { id: 'u-1', companyId: 'comp-1', name: 'مدير' },
});

beforeEach(() => {
  state.member = {
    id: 'gm-1', paymentStatus: 'PENDING', amountPaid: 0, groupId: 'grp-1',
    feeAmount: 400, firstName: 'ليلى', lastName: 'حسن',
  };
  state.updates = [];
  state.audits = [];
});

describe('group member standing discount', () => {
  it('marks the member paid when the discount covers the fee', async () => {
    const res = makeRes();
    await controller.setMemberDiscount(makeReq({ amount: 400, reason: 'ابن موظف' }, { id: 'gm-1' }), res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload.data.discountAmount, 400);
    assert.strictEqual(res.payload.data.effectiveFee, 0);
    assert.strictEqual(res.payload.data.paymentStatus, 'PAID');
    assert.deepStrictEqual(state.updates[0], [400, 'ابن موظف', 'PAID', 'gm-1', 'comp-1']);
    assert.strictEqual(state.audits[0].action, 'MANUAL_DISCOUNT');
  });

  it('keeps a partially settled member as PARTIAL', async () => {
    state.member.amountPaid = 100;
    const res = makeRes();
    await controller.setMemberDiscount(makeReq({ amount: 100 }, { id: 'gm-1' }), res);

    assert.strictEqual(res.statusCode, 200);
    // 100 paid + 100 discount = 200 < 400
    assert.strictEqual(res.payload.data.paymentStatus, 'PARTIAL');
    assert.strictEqual(res.payload.data.effectiveFee, 300);
  });

  it('rejects a discount larger than the fee or negative', async () => {
    let res = makeRes();
    await controller.setMemberDiscount(makeReq({ amount: 500 }, { id: 'gm-1' }), res);
    assert.strictEqual(res.statusCode, 400);

    res = makeRes();
    await controller.setMemberDiscount(makeReq({ amount: -20 }, { id: 'gm-1' }), res);
    assert.strictEqual(res.statusCode, 400);

    res = makeRes();
    await controller.setMemberDiscount(makeReq({ amount: 'abc' }, { id: 'gm-1' }), res);
    assert.strictEqual(res.statusCode, 400);

    assert.strictEqual(state.updates.length, 0);
  });

  it('returns 404 for a member outside the company', async () => {
    state.member = null;
    const res = makeRes();
    await controller.setMemberDiscount(makeReq({ amount: 100 }, { id: 'gm-404' }), res);
    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(state.updates.length, 0);
  });
});

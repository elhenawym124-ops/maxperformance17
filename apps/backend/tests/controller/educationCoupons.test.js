const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const state = {
  coupons: [],
  audits: [],
};

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

const mockPrisma = {
  educationCoupon: {
    findMany: async () => state.coupons,
    findFirst: async ({ where }) => state.coupons.find((row) =>
      (!where.id || row.id === where.id) &&
      (!where.companyId || row.companyId === where.companyId) &&
      (!where.code || row.code === where.code)
    ) || null,
    create: async ({ data }) => {
      const row = { id: `coupon-${state.coupons.length + 1}`, usedCount: 0, ...clone(data) };
      state.coupons.push(row);
      return clone(row);
    },
    update: async ({ where, data }) => {
      const row = state.coupons.find((item) => item.id === where.id);
      Object.assign(row, clone(data));
      return clone(row);
    },
    delete: async ({ where }) => {
      state.coupons = state.coupons.filter((item) => item.id !== where.id);
      return { id: where.id };
    },
  },
};

const sharedDbPath = require.resolve('../../services/sharedDatabase');
require.cache[sharedDbPath] = { id: sharedDbPath, filename: sharedDbPath, loaded: true, exports: { getSharedPrismaClient: () => mockPrisma } };

const auditPath = require.resolve('../../services/educationAuditService');
require.cache[auditPath] = {
  id: auditPath, filename: auditPath, loaded: true,
  exports: { logEducationEvent: async (event) => { state.audits.push(event); return null; } },
};

const controller = require('../../controller/educationCouponsController');

const makeRes = () => ({
  statusCode: 200,
  payload: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.payload = body; return this; },
});

const makeReq = (body = {}, params = {}, query = {}, user = { id: 'u-1', companyId: 'comp-1' }) => ({
  body, params, query, user, headers: {},
});

beforeEach(() => {
  state.coupons = [];
  state.audits = [];
});

describe('education coupons controller', () => {
  it('creates a coupon with an uppercase code and rejects duplicates', async () => {
    let res = makeRes();
    await controller.createCoupon(makeReq({ code: ' eid25 ', type: 'percent', value: 25, maxUses: 100 }), res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.coupons[0].code, 'EID25');
    assert.strictEqual(state.coupons[0].type, 'PERCENT');
    assert.strictEqual(state.audits.length, 1);

    res = makeRes();
    await controller.createCoupon(makeReq({ code: 'EID25', value: 10 }), res);
    assert.strictEqual(res.statusCode, 409);
    assert.strictEqual(state.coupons.length, 1);
  });

  it('validates percent and amount bounds', async () => {
    let res = makeRes();
    await controller.createCoupon(makeReq({ code: 'BAD', value: 150, type: 'PERCENT' }), res);
    assert.strictEqual(res.statusCode, 400);

    res = makeRes();
    await controller.createCoupon(makeReq({ code: 'BAD2', value: 0 }), res);
    assert.strictEqual(res.statusCode, 400);

    res = makeRes();
    await controller.createCoupon(makeReq({ code: 'OK150', value: 150, type: 'AMOUNT' }), res);
    assert.strictEqual(res.statusCode, 200);
  });

  it('updates, toggles and blocks deleting a used coupon', async () => {
    state.coupons.push({
      id: 'coupon-1', companyId: 'comp-1', code: 'EID25', type: 'PERCENT',
      value: 25, usedCount: 3, isActive: true, scope: 'ALL',
    });

    let res = makeRes();
    await controller.updateCoupon(makeReq({ value: 30, maxUses: 50 }, { id: 'coupon-1' }), res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.coupons[0].value, 30);

    res = makeRes();
    await controller.toggleCoupon(makeReq({}, { id: 'coupon-1' }), res);
    assert.strictEqual(state.coupons[0].isActive, false);

    res = makeRes();
    await controller.deleteCoupon(makeReq({}, { id: 'coupon-1' }), res);
    assert.strictEqual(res.statusCode, 409);

    state.coupons[0].usedCount = 0;
    res = makeRes();
    await controller.deleteCoupon(makeReq({}, { id: 'coupon-1' }), res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.coupons.length, 0);
  });

  it('previews a discount and maps coupon errors to their codes', async () => {
    state.coupons.push({
      id: 'coupon-1', companyId: 'comp-1', code: 'EID25', type: 'PERCENT',
      value: 25, usedCount: 0, isActive: true, scope: 'ALL',
      perStudentLimit: null, minAmount: null, maxDiscount: null, maxUses: null,
    });

    let res = makeRes();
    await controller.validateCouponPreview(makeReq({ code: 'eid25', amount: 400 }), res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload.data.discountAmount, 100);
    assert.strictEqual(res.payload.data.finalAmount, 300);

    res = makeRes();
    await controller.validateCouponPreview(makeReq({ code: 'NOPE', amount: 400 }), res);
    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.payload.code, 'COUPON_NOT_FOUND');
  });
});

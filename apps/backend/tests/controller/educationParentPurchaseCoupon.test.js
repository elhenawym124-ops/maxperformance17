const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const state = {
  wallet: null,
  enrollments: [],
  payments: [],
  redemptions: [],
  couponUpdates: [],
  coupon: null,
  audits: [],
  notifications: [],
};

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

const mockPrisma = {
  educationStudent: {
    findFirst: async () => ({
      id: 'stu-1', companyId: 'comp-1', customerId: 'cust-1',
      firstName: 'سارة', lastName: 'محمد', currentLevel: 1,
    }),
    count: async () => 1,
    updateMany: async () => ({ count: 1 }),
  },
  educationPackage: {
    findFirst: async () => ({
      id: 'pkg-1', companyId: 'comp-1', name: 'باقة 10 ساعات',
      price: 1000, hoursCount: 10, levelNumber: 1, isActive: true,
    }),
  },
  customerWallet: {
    findFirst: async () => state.wallet,
    updateMany: async ({ data }) => {
      const debit = Number(data.balance?.decrement || 0);
      if (state.wallet.balance < debit) return { count: 0 };
      state.wallet.balance -= debit;
      state.wallet.totalSpent = (state.wallet.totalSpent || 0) + debit;
      return { count: 1 };
    },
  },
  walletTransaction: { create: async () => ({ id: 'wt-1' }) },
  educationEnrollment: {
    create: async ({ data }) => {
      const row = { id: `enr-${state.enrollments.length + 1}`, ...clone(data) };
      state.enrollments.push(row);
      return row;
    },
  },
  educationPayment: {
    findFirst: async () => null,
    create: async ({ data }) => {
      const row = { id: `pay-${state.payments.length + 1}`, ...clone(data) };
      state.payments.push(row);
      return row;
    },
  },
  educationCoupon: {
    findFirst: async () => state.coupon,
    updateMany: async (args) => {
      state.couponUpdates.push(args);
      if (!state.coupon) return { count: 0 };
      if (state.coupon.maxUses !== null && state.coupon.usedCount >= state.coupon.maxUses) return { count: 0 };
      state.coupon.usedCount += 1;
      return { count: 1 };
    },
  },
  educationCouponRedemption: {
    count: async () => 0,
    create: async ({ data }) => {
      const row = { id: `red-${state.redemptions.length + 1}`, ...clone(data) };
      state.redemptions.push(row);
      return row;
    },
  },
  $transaction: async (fn) => fn(mockPrisma),
};

const sharedDbPath = require.resolve('../../services/sharedDatabase');
require.cache[sharedDbPath] = { id: sharedDbPath, filename: sharedDbPath, loaded: true, exports: { getSharedPrismaClient: () => mockPrisma } };

const auditPath = require.resolve('../../services/educationAuditService');
require.cache[auditPath] = {
  id: auditPath, filename: auditPath, loaded: true,
  exports: { logEducationEvent: async (event) => { state.audits.push(event); return null; } },
};

const notificationPath = require.resolve('../../services/educationNotificationService');
require.cache[notificationPath] = {
  id: notificationPath, filename: notificationPath, loaded: true,
  exports: { notifyEnrollmentCreated: async (payload) => { state.notifications.push(payload); return null; } },
};

const controller = require('../../controller/educationParentPortalController');

const makeRes = () => ({
  statusCode: 200,
  payload: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.payload = body; return this; },
});

const makeReq = (body = {}) => ({
  body,
  parent: { id: 'cust-1', companyId: 'comp-1' },
  headers: {},
});

beforeEach(() => {
  state.wallet = { id: 'wallet-1', customerId: 'cust-1', companyId: 'comp-1', balance: 1000, totalSpent: 0 };
  state.enrollments = [];
  state.payments = [];
  state.redemptions = [];
  state.couponUpdates = [];
  state.audits = [];
  state.notifications = [];
  state.coupon = {
    id: 'coupon-1', companyId: 'comp-1', code: 'EID25', type: 'PERCENT', value: 25,
    minAmount: null, maxDiscount: null, scope: 'ALL', packageId: null, groupId: null,
    maxUses: 10, usedCount: 0, perStudentLimit: 1, validFrom: null, validUntil: null, isActive: true,
  };
});

describe('parent package purchase with coupon', () => {
  it('charges the discounted amount and records the redemption', async () => {
    const res = makeRes();
    await controller.purchasePackage(makeReq({ studentId: 'stu-1', packageId: 'pkg-1', couponCode: 'eid25' }), res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.wallet.balance, 250);
    assert.strictEqual(state.enrollments[0].amountPaid, 750);
    assert.strictEqual(state.enrollments[0].discountType, 'COUPON');
    assert.strictEqual(state.enrollments[0].discountAmount, 250);
    assert.strictEqual(state.payments[0].amount, 750);
    assert.match(state.payments[0].notes, /EID25/);
    assert.strictEqual(state.redemptions.length, 1);
    assert.strictEqual(state.redemptions[0].discount, 250);
    assert.strictEqual(state.redemptions[0].paymentId, 'pay-1');
    assert.strictEqual(state.coupon.usedCount, 1);
  });

  it('charges the full price when no coupon is passed', async () => {
    const res = makeRes();
    await controller.purchasePackage(makeReq({ studentId: 'stu-1', packageId: 'pkg-1' }), res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.wallet.balance, 0);
    assert.strictEqual(state.payments[0].amount, 1000);
    assert.strictEqual(state.redemptions.length, 0);
  });

  it('rejects an invalid coupon before touching the wallet', async () => {
    state.coupon = null;
    const res = makeRes();
    await controller.purchasePackage(makeReq({ studentId: 'stu-1', packageId: 'pkg-1', couponCode: 'FAKE' }), res);

    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.payload.code, 'COUPON_NOT_FOUND');
    assert.strictEqual(state.wallet.balance, 1000);
    assert.strictEqual(state.enrollments.length, 0);
  });

  it('rejects when the discounted price still exceeds the wallet balance', async () => {
    state.wallet.balance = 500;
    const res = makeRes();
    await controller.purchasePackage(makeReq({ studentId: 'stu-1', packageId: 'pkg-1', couponCode: 'EID25' }), res);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(state.wallet.balance, 500);
    assert.strictEqual(state.enrollments.length, 0);
  });
});

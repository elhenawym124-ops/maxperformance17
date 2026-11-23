const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const state = {
  enrollments: [],
  payments: [],
  redemptions: [],
  treasury: { balance: 1000 },
  treasuryTx: [],
  audits: [],
  coupon: null,
  guardPasses: true,
};

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

const mockPrisma = {
  $transaction: async (fn) => {
    const snapshot = clone({
      enrollments: state.enrollments,
      payments: state.payments,
      redemptions: state.redemptions,
      treasury: state.treasury,
      treasuryTx: state.treasuryTx,
      coupon: state.coupon,
    });
    try {
      return await fn(mockPrisma);
    } catch (error) {
      state.enrollments = snapshot.enrollments;
      state.payments = snapshot.payments;
      state.redemptions = snapshot.redemptions;
      state.treasury = snapshot.treasury;
      state.treasuryTx = snapshot.treasuryTx;
      state.coupon = snapshot.coupon;
      throw error;
    }
  },
  $queryRawUnsafe: async () => [],
  $executeRawUnsafe: async () => 1,
  educationPayment: {
    findFirst: async () => null,
    create: async ({ data }) => {
      const row = { id: `pay-${state.payments.length + 1}`, ...clone(data) };
      state.payments.push(row);
      return clone(row);
    },
  },
  educationEnrollment: {
    findFirst: async ({ where }) => clone(
      state.enrollments.find((item) => item.id === where.id && item.companyId === where.companyId) || null
    ),
    update: async ({ where, data }) => {
      const enrollment = state.enrollments.find((item) => item.id === where.id);
      Object.assign(enrollment, clone(data));
      return clone(enrollment);
    },
  },
  educationCoupon: {
    findFirst: async () => (state.coupon ? clone(state.coupon) : null),
    updateMany: async () => {
      if (!state.guardPasses) return { count: 0 };
      if (state.coupon) state.coupon.usedCount = Number(state.coupon.usedCount || 0) + 1;
      return { count: 1 };
    },
  },
  educationCouponRedemption: {
    count: async () => 0,
    create: async ({ data }) => {
      state.redemptions.push(clone(data));
      return { id: `red-${state.redemptions.length}`, ...clone(data) };
    },
  },
  treasuryAccount: {
    findFirst: async () => ({ id: 'treasury-1', companyId: 'comp-1', balance: state.treasury.balance }),
    create: async () => ({ id: 'treasury-1', companyId: 'comp-1', balance: 0 }),
    update: async ({ data }) => {
      state.treasury.balance += Number(data.balance?.increment || 0);
      return { id: 'treasury-1', balance: state.treasury.balance };
    },
  },
  treasuryTransaction: {
    create: async ({ data }) => {
      state.treasuryTx.push(clone(data));
      return { id: `tx-${state.treasuryTx.length}`, ...clone(data) };
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

const controller = require('../../controller/educationPaymentsController');

const makeRes = () => ({
  statusCode: 200,
  payload: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.payload = body; return this; },
});

const makeReq = (body = {}) => ({
  body, query: {}, params: {}, headers: {},
  user: { id: 'user-1', companyId: 'comp-1', name: 'مدير' },
});

const coupon = (overrides = {}) => ({
  id: 'coupon-1', companyId: 'comp-1', code: 'EID25', type: 'PERCENT', value: 25,
  minAmount: null, maxDiscount: null, scope: 'ALL', packageId: null, groupId: null,
  maxUses: 10, usedCount: 0, perStudentLimit: 5,
  validFrom: null, validUntil: null, isActive: true,
  ...overrides,
});

beforeEach(() => {
  state.enrollments = [{
    id: 'enr-1', companyId: 'comp-1', studentId: 'stu-1', branchId: 'branch-1', packageId: 'pkg-1',
    isActive: true, amountPaid: 0, finalAmount: 1000, discountAmount: 0, paymentStatus: 'PENDING',
    student: { id: 'stu-1', firstName: 'سارة', lastName: 'محمد' },
    package: { id: 'pkg-1', name: 'باقة 10 ساعات', price: 1000 },
  }];
  state.payments = [];
  state.redemptions = [];
  state.treasury = { balance: 1000 };
  state.treasuryTx = [];
  state.audits = [];
  state.coupon = coupon();
  state.guardPasses = true;
});

describe('recordPayment with a discount code', () => {
  it('collects the discounted amount and keeps dues consistent', async () => {
    const res = makeRes();
    await controller.recordPayment(
      makeReq({ enrollmentId: 'enr-1', amount: 400, method: 'CASH', couponCode: 'eid25' }),
      res
    );

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload.data.amount, 300);
    assert.strictEqual(state.enrollments[0].amountPaid, 300);
    // charge reduced by the discount so remaining = 1000 - 100 - 300 = 600
    assert.strictEqual(state.enrollments[0].finalAmount, 900);
    assert.strictEqual(state.enrollments[0].discountAmount, 100);
    assert.strictEqual(state.enrollments[0].discountType, 'COUPON');
    assert.strictEqual(state.redemptions.length, 1);
    assert.strictEqual(state.redemptions[0].discount, 100);
    assert.strictEqual(state.redemptions[0].paymentId, res.payload.data.id);
    assert.strictEqual(state.coupon.usedCount, 1);
  });

  it('rejects an unknown code without moving money', async () => {
    state.coupon = null;
    const res = makeRes();
    await controller.recordPayment(
      makeReq({ enrollmentId: 'enr-1', amount: 400, couponCode: 'FAKE' }),
      res
    );

    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(state.enrollments[0].amountPaid, 0);
  });

  it('applies a code to a group member fee and settles the cycle', async () => {
    const executions = [];
    mockPrisma.$queryRawUnsafe = async (sql, ...params) => {
      if (/FROM "education_group_members"/i.test(sql)) {
        assert.deepStrictEqual(params, ['gm-1', 'comp-1']);
        return [{
          id: 'gm-1', companyId: 'comp-1', groupId: 'grp-1', studentId: 'stu-1',
          status: 'ACTIVE', paymentStatus: 'PENDING', amountPaid: 0, discountAmount: 0,
          nextRenewalDate: null, groupName: 'مجموعة أ', feeAmount: 400, feeType: 'MONTHLY',
          groupBranchId: null, firstName: 'ليلى', lastName: 'حسن',
        }];
      }
      return [];
    };
    mockPrisma.$executeRawUnsafe = async (sql, ...params) => {
      executions.push(params);
      return 1;
    };

    const res = makeRes();
    await controller.recordPayment(
      makeReq({ groupMemberId: 'gm-1', amount: 400, method: 'CASH', couponCode: 'EID25' }),
      res
    );

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload.data.amount, 300);
    // amountPaid = cash, discountAmount = 100 → cycle settled (400)
    assert.strictEqual(executions[0][0], 300);
    assert.strictEqual(executions[0][1], 100);
    assert.strictEqual(executions[0][2], 'PAID');
    assert.ok(executions[0][3]);
    assert.strictEqual(state.redemptions.length, 1);
    assert.strictEqual(state.redemptions[0].discount, 100);
  });

  it('rejects a group fee payment above the discounted remainder', async () => {
    mockPrisma.$queryRawUnsafe = async () => ([{
      id: 'gm-1', companyId: 'comp-1', groupId: 'grp-1', studentId: 'stu-1',
      status: 'ACTIVE', paymentStatus: 'PENDING', amountPaid: 0, discountAmount: 100,
      nextRenewalDate: null, groupName: 'مجموعة أ', feeAmount: 400, feeType: 'MONTHLY',
      groupBranchId: null, firstName: 'ليلى', lastName: 'حسن',
    }]);
    mockPrisma.$executeRawUnsafe = async () => 1;

    const res = makeRes();
    await controller.recordPayment(makeReq({ groupMemberId: 'gm-1', amount: 350 }), res);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(state.payments.length, 0);
  });

  it('rolls back when the usage guard fails', async () => {
    state.guardPasses = false;
    const res = makeRes();
    await controller.recordPayment(
      makeReq({ enrollmentId: 'enr-1', amount: 400, couponCode: 'EID25' }),
      res
    );

    assert.strictEqual(res.statusCode, 409);
    assert.strictEqual(state.enrollments[0].amountPaid, 0);
    assert.strictEqual(state.redemptions.length, 0);
  });
});

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

/* ------------------------------------------------------------------ */
/* Shared mutable state                                               */
/* ------------------------------------------------------------------ */

const state = {
  enrollments: [],
  students: [],
  packages: [],
  groups: [],
  members: [],
  payments: [],
  wallets: [],
  walletTx: [],
  audits: [],
  revenueCalls: [],
  enrollmentCreateData: null,
  enrollmentUpdateData: null,
};

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

const mockPrisma = {
  $transaction: async (fn) => fn(mockPrisma),
  $queryRawUnsafe: async (sql, ...params) => {
    if (/FROM "education_groups"/i.test(sql) && /active_count/i.test(sql)) {
      const group = state.groups.find((item) => item.id === params[0] && item.companyId === params[1]);
      if (!group) return [];
      return [{
        id: group.id, name: group.name, feeType: group.feeType, feeAmount: group.feeAmount,
        capacity: group.capacity, active_count: state.members.filter((m) => m.groupId === group.id && m.status === 'ACTIVE').length,
      }];
    }
    if (/SELECT id, status FROM "education_group_members"/i.test(sql)) return [];
    if (/SELECT id FROM "education_group_members"/i.test(sql)) return [];
    if (/FROM "education_group_members" m/i.test(sql)) {
      const member = state.members.find((item) => item.id === params[0]);
      const group = member && state.groups.find((g) => g.id === member.groupId);
      return member ? [{
        ...member, groupName: group?.name, feeAmount: group?.feeAmount, feeType: group?.feeType,
        firstName: 'سارة', lastName: 'محمد',
      }] : [];
    }
    return [];
  },
  $executeRawUnsafe: async (sql, ...params) => {
    if (/INSERT INTO "education_group_members"/i.test(sql)) {
      const [id, companyId, groupId, studentId, status, paymentStatus, amountPaid, nextRenewalDate] = params;
      state.members.push({ id, companyId, groupId, studentId, status, paymentStatus, amountPaid, nextRenewalDate });
    }
    if (/UPDATE "education_groups" SET "status" = 'FULL'/i.test(sql)) {
      const group = state.groups.find((g) => g.id === params[0]);
      if (group) group.status = 'FULL';
    }
    return 1;
  },
  educationEnrollment: {
    findFirst: async ({ where }) =>
      clone(state.enrollments.find((item) => item.id === where.id && (!where.companyId || item.companyId === where.companyId)) || null),
    create: async ({ data }) => {
      state.enrollmentCreateData = data;
      const created = { id: 'enr-created', ...clone(data) };
      state.enrollments.push(created);
      return created;
    },
    update: async ({ where, data }) => {
      state.enrollmentUpdateData = data;
      const enrollment = state.enrollments.find((item) => item.id === where.id);
      Object.assign(enrollment, data);
      return clone(enrollment);
    },
  },
  educationStudent: {
    findFirst: async ({ where }) =>
      clone(state.students.find((item) => item.id === where.id && (!where.companyId || item.companyId === where.companyId)) || null),
    findUnique: async ({ where }) => clone(state.students.find((item) => item.id === where.id) || null),
    count: async () => state.students.length,
    updateMany: async () => ({ count: 1 }),
  },
  educationPackage: {
    findFirst: async ({ where }) =>
      clone(state.packages.find((item) => item.id === where.id && (!where.companyId || item.companyId === where.companyId)) || null),
  },
  educationTeacher: { findFirst: async () => null },
  educationSession: { updateMany: async () => ({ count: 2 }) },
  educationPayment: {
    findFirst: async ({ where }) => {
      if (where.id) return clone(state.payments.find((p) => p.id === where.id) || null);
      if (where.enrollmentId) {
        return clone(
          state.payments.find(
            (p) => p.enrollmentId === where.enrollmentId &&
              (!where.source || p.source === where.source) &&
              (!where.status || p.status === where.status)
          ) || null
        );
      }
      if (where.paymentNumber?.startsWith) {
        const matches = state.payments
          .filter((p) => String(p.paymentNumber || '').startsWith(where.paymentNumber.startsWith))
          .sort((a, b) => String(b.paymentNumber).localeCompare(String(a.paymentNumber)));
        return clone(matches[0] || null);
      }
      return null;
    },
    create: async ({ data }) => {
      const created = { id: `pay-${state.payments.length + 1}`, ...clone(data) };
      state.payments.push(created);
      return created;
    },
  },
  customerWallet: {
    findFirst: async ({ where }) => clone(state.wallets.find((w) => w.customerId === where.customerId) || null),
    update: async ({ where, data }) => {
      const wallet = state.wallets.find((w) => w.id === where.id);
      if (!wallet) throw new Error('wallet not found');
      wallet.balance += Number(data.balance?.increment || 0);
      return clone(wallet);
    },
    updateMany: async ({ where, data }) => {
      const wallet = state.wallets.find((w) => w.id === where.id);
      if (!wallet) return { count: 0 };
      if (wallet.balance < (where.balance?.gte ?? 0)) return { count: 0 };
      wallet.balance -= Number(data.balance?.decrement || 0);
      wallet.totalSpent = (wallet.totalSpent || 0) + Number(data.totalSpent?.increment || 0);
      return { count: 1 };
    },
  },
  walletTransaction: {
    create: async ({ data }) => {
      const created = { id: `wtx-${state.walletTx.length + 1}`, ...clone(data) };
      state.walletTx.push(created);
      return created;
    },
  },
};

/* ------------------------------------------------------------------ */
/* Module wiring                                                       */
/* ------------------------------------------------------------------ */

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

const notifyPath = require.resolve('../../services/educationNotificationService');
require.cache[notifyPath] = {
  id: notifyPath, filename: notifyPath, loaded: true,
  exports: { notifyEnrollmentCreated: async () => true },
};

const financialPath = require.resolve('../../services/educationFinancialIntegrationService');
require.cache[financialPath] = {
  id: financialPath, filename: financialPath, loaded: true,
  exports: {
    recordEducationRevenue: async (payload) => { state.revenueCalls.push(payload); return { ok: true }; },
    recordEducationRefund: async () => ({ ok: true }),
    recordTeacherSalaryPayout: async () => ({ ok: true }),
  },
};

const enrollments = require('../../controller/educationEnrollmentsController');
const parentPortal = require('../../controller/educationParentPortalController');
const groups = require('../../controller/educationGroupsController');

const makeRes = () => ({
  statusCode: 200,
  payload: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.payload = body; return this; },
});

const makeReq = (body = {}, query = {}, user = { id: 'u-1', companyId: 'comp-1', name: 'مدير', role: 'COMPANY_ADMIN' }) => ({
  body, query, params: {}, user, headers: {},
});

beforeEach(() => {
  state.enrollments = [];
  state.students = [];
  state.packages = [];
  state.groups = [];
  state.members = [];
  state.payments = [];
  state.wallets = [];
  state.walletTx = [];
  state.audits = [];
  state.revenueCalls = [];
  state.enrollmentCreateData = null;
  state.enrollmentUpdateData = null;
});

/* ------------------------------------------------------------------ */
/* Enrollment ledger integrity                                        */
/* ------------------------------------------------------------------ */

describe('enrollment ledger integrity', () => {
  const seedEnrollmentBasics = () => {
    state.students.push({ id: 'stu-1', companyId: 'comp-1', firstName: 'سارة', lastName: 'محمد' });
    state.packages.push({ id: 'pkg-1', companyId: 'comp-1', name: 'باقة', hoursCount: 10, price: 500 });
  };

  it('aligns a PENDING request with a paid amount to PARTIALLY_PAID and posts revenue', async () => {
    seedEnrollmentBasics();
    const res = makeRes();
    await enrollments.create(makeReq({
      studentId: 'stu-1', packageId: 'pkg-1', amountPaid: 100,
      paymentStatus: 'PENDING', finalAmount: 500,
    }), res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.enrollmentCreateData.paymentStatus, 'PARTIALLY_PAID');
    assert.strictEqual(state.revenueCalls.length, 1);
    assert.strictEqual(state.revenueCalls[0].amount, 100);
    assert.strictEqual(state.revenueCalls[0].sourceType, 'EDUCATION_PACKAGE_REVENUE');
  });

  it('posts revenue at creation even when the status is PENDING but money was received', async () => {
    seedEnrollmentBasics();
    const res = makeRes();
    await enrollments.create(makeReq({
      studentId: 'stu-1', packageId: 'pkg-1', amountPaid: 100,
      paymentStatus: 'PENDING', finalAmount: 500,
    }), res);
    assert.strictEqual(state.revenueCalls[0].amount, 100);
  });

  it('rejects editing amountPaid from the update endpoint', async () => {
    state.enrollments.push({
      id: 'enr-1', companyId: 'comp-1', amountPaid: 100, finalAmount: 500,
      paymentStatus: 'PARTIALLY_PAID', student: {}, package: {}, teacher: null,
    });
    const req = makeReq({ amountPaid: 250 });
    req.params = { id: 'enr-1' };
    const res = makeRes();
    await enrollments.update(req, res);

    assert.strictEqual(res.statusCode, 400);
    assert.match(res.payload.error, /صفحة المدفوعات/);
    assert.strictEqual(state.enrollmentUpdateData, null);
  });

  it('rejects a manual status that does not match the paid amount', async () => {
    state.enrollments.push({
      id: 'enr-1', companyId: 'comp-1', amountPaid: 100, finalAmount: 500,
      paymentStatus: 'PARTIALLY_PAID', student: {}, package: {}, teacher: null,
    });
    const req = makeReq({ paymentStatus: 'COMPLETED' });
    req.params = { id: 'enr-1' };
    const res = makeRes();
    await enrollments.update(req, res);

    assert.strictEqual(res.statusCode, 400);
    assert.match(res.payload.error, /لا تطابق/);
  });

  it("allows a non-financial edit without touching the ledger", async () => {
    state.enrollments.push({
      id: 'enr-1', companyId: 'comp-1', amountPaid: 100, finalAmount: 500,
      paymentStatus: 'PARTIALLY_PAID', remainingHours: 5, student: {}, package: {}, teacher: null,
    });
    const req = makeReq({ remainingHours: 3 });
    req.params = { id: 'enr-1' };
    const res = makeRes();
    await enrollments.update(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.enrollmentUpdateData.remainingHours, 3);
    assert.strictEqual('amountPaid' in state.enrollmentUpdateData, false);
  });

  it('refuses to collect an installment that was already paid', async () => {
    state.enrollments.push({
      id: 'enr-1', companyId: 'comp-1', studentId: 'stu-1', amountPaid: 200, finalAmount: 500,
      paymentStatus: 'PARTIALLY_PAID', installmentCount: 3,
      installments: [{ installmentNumber: 1, amount: 200, status: 'PAID', dueDate: '2026-11-01' }],
      student: { id: 'stu-1', firstName: 'سارة', lastName: 'محمد' },
      package: { name: 'باقة', price: 500 },
    });
    const req = makeReq();
    req.params = { id: 'enr-1', installmentNumber: '1' };
    const res = makeRes();
    await enrollments.payInstallment(req, res);

    assert.strictEqual(res.statusCode, 409);
    assert.match(res.payload.error, /مسدد بالفعل/);
    assert.strictEqual(state.payments.length, 0);
    assert.strictEqual(state.revenueCalls.length, 0);
  });

  it('refunds a parent-wallet enrollment back into the same wallet', async () => {
    state.students.push({ id: 'stu-1', companyId: 'comp-1', customerId: 'cust-1', firstName: 'سارة', lastName: 'محمد' });
    state.enrollments.push({
      id: 'enr-1', companyId: 'comp-1', studentId: 'stu-1', isActive: true,
      amountPaid: 1000, finalAmount: 1000, paymentStatus: 'COMPLETED', remainingHours: 6,
      student: { id: 'stu-1', firstName: 'سارة', lastName: 'محمد' },
      package: { id: 'pkg-1', name: 'باقة 10', price: 1000 },
    });
    state.payments.push({
      id: 'pay-1', companyId: 'comp-1', enrollmentId: 'enr-1', source: 'PARENT_WALLET',
      status: 'COMPLETED', amount: 1000, paymentNumber: 'EDU-PAY-202611-0001',
    });
    state.wallets.push({ id: 'w-1', customerId: 'cust-1', companyId: 'comp-1', balance: 200 });

    const req = makeReq({ refundAmount: 400, reason: 'انسحاب' });
    req.params = { id: 'enr-1' };
    const res = makeRes();
    await enrollments.cancelEnrollment(req, res);

    assert.strictEqual(res.statusCode, 200, JSON.stringify(res.payload));
    assert.strictEqual(state.wallets[0].balance, 600);
    assert.strictEqual(state.walletTx.length, 1);
    assert.strictEqual(state.walletTx[0].type, 'CREDIT');
    assert.strictEqual(state.walletTx[0].amount, 400);
    assert.strictEqual(state.walletTx[0].status, 'RELEASED');
    assert.strictEqual(res.payload.data.enrollment.isActive, false);
  });

  it('does not credit a wallet for a cash enrollment refund', async () => {
    state.students.push({ id: 'stu-1', companyId: 'comp-1', customerId: 'cust-1', firstName: 'سارة', lastName: 'محمد' });
    state.enrollments.push({
      id: 'enr-1', companyId: 'comp-1', studentId: 'stu-1', isActive: true,
      amountPaid: 500, finalAmount: 500, paymentStatus: 'COMPLETED',
      student: { firstName: 'سارة', lastName: 'محمد' },
      package: { name: 'باقة 10', price: 500 },
    });
    state.payments.push({
      id: 'pay-1', companyId: 'comp-1', enrollmentId: 'enr-1', source: 'ADMIN',
      status: 'COMPLETED', amount: 500, paymentNumber: 'EDU-PAY-202611-0001',
    });
    state.wallets.push({ id: 'w-1', customerId: 'cust-1', companyId: 'comp-1', balance: 200 });

    const req = makeReq({ refundAmount: 200 });
    req.params = { id: 'enr-1' };
    const res = makeRes();
    await enrollments.cancelEnrollment(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.wallets[0].balance, 200);
    assert.strictEqual(state.walletTx.length, 0);
  });
});

/* ------------------------------------------------------------------ */
/* Parent wallet purchase -> treasury                                  */
/* ------------------------------------------------------------------ */

describe('parent portal purchase integration', () => {
  it('posts treasury revenue with the correct source contract and writes a ledger row', async () => {
    state.students.push({
      id: 'stu-1', companyId: 'comp-1', customerId: 'cust-1',
      firstName: 'سارة', lastName: 'محمد', isActive: true,
    });
    state.packages.push({ id: 'pkg-1', companyId: 'comp-1', name: 'باقة 10', hoursCount: 10, price: 1000, isActive: true });
    state.wallets.push({ id: 'w-1', customerId: 'cust-1', companyId: 'comp-1', balance: 2000, totalSpent: 0 });

    const req = {
      parent: { id: 'cust-1', companyId: 'comp-1' },
      body: { studentId: 'stu-1', packageId: 'pkg-1' },
      headers: {},
    };
    const res = makeRes();
    await parentPortal.purchasePackage(req, res);

    assert.strictEqual(res.statusCode, 200, JSON.stringify(res.payload));
    assert.strictEqual(state.revenueCalls.length, 1);
    const call = state.revenueCalls[0];
    assert.strictEqual(call.sourceType, 'EDUCATION_PARENT_PACKAGE');
    assert.strictEqual(call.sourceId, 'enr-created');
    assert.strictEqual(call.amount, 1000);
    assert.strictEqual(call.type, undefined);
    assert.strictEqual(call.packageName, undefined);
    assert.ok(call.title);

    assert.strictEqual(state.payments.length, 1);
    assert.strictEqual(state.payments[0].method, 'WALLET');
    assert.strictEqual(state.payments[0].source, 'PARENT_WALLET');
    assert.strictEqual(state.payments[0].amount, 1000);
    assert.strictEqual(state.payments[0].status, 'COMPLETED');
  });
});

/* ------------------------------------------------------------------ */
/* Group member add -> renewal + ledger                                */
/* ------------------------------------------------------------------ */

describe('group member collection', () => {
  it('sets the next renewal date for a monthly group and records the ledger entry', async () => {
    state.students.push({ id: 'stu-1', companyId: 'comp-1', firstName: 'سارة', lastName: 'محمد' });
    state.groups.push({
      id: 'grp-1', companyId: 'comp-1', name: 'مجموعة أ', capacity: 10,
      feeType: 'MONTHLY', feeAmount: 400, status: 'OPEN',
    });

    const req = makeReq({ studentId: 'stu-1', paymentStatus: 'PAID', amountPaid: 400 });
    req.params = { id: 'grp-1' };
    const res = makeRes();
    await groups.addMember(req, res);

    assert.strictEqual(res.statusCode, 200, JSON.stringify(res.payload));
    assert.strictEqual(state.members.length, 1);
    assert.ok(state.members[0].nextRenewalDate, 'nextRenewalDate should be set');
    assert.ok(new Date(state.members[0].nextRenewalDate).getTime() > Date.now());
    assert.strictEqual(state.revenueCalls.length, 1);
    assert.strictEqual(state.revenueCalls[0].sourceType, 'EDUCATION_GROUP_FEE');
    assert.strictEqual(state.payments.length, 1);
    assert.strictEqual(state.payments[0].source, 'GROUP');
    assert.strictEqual(state.payments[0].groupId, 'grp-1');
  });

  it('does not set a renewal date for one-time groups', async () => {
    state.students.push({ id: 'stu-1', companyId: 'comp-1', firstName: 'سارة', lastName: 'محمد' });
    state.groups.push({
      id: 'grp-1', companyId: 'comp-1', name: 'ورشة', capacity: 10,
      feeType: 'ONE_TIME', feeAmount: 900, status: 'OPEN',
    });

    const req = makeReq({ studentId: 'stu-1', paymentStatus: 'PAID', amountPaid: 900 });
    req.params = { id: 'grp-1' };
    const res = makeRes();
    await groups.addMember(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.members[0].nextRenewalDate, null);
  });
});

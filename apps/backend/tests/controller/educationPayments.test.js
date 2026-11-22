const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

/* ------------------------------------------------------------------ */
/* Mocks                                                              */
/* ------------------------------------------------------------------ */

const state = {
  enrollments: [],
  groupMembers: [],
  payments: [],
  walletTransactions: [],
  wallets: [],
  treasury: null,
  treasuryTx: [],
  audits: [],
  nextEnrollmentUpdate: null,
  rawHandler: null,
};

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

const mockPrisma = {
  $transaction: async (fn) => fn(mockPrisma),
  $queryRawUnsafe: async (sql, ...params) => {
    if (state.rawHandler) return state.rawHandler(sql, params);
    if (/FROM "education_group_members"/i.test(sql)) {
      const id = params[0];
      const found = state.groupMembers.find((member) => member.id === id);
      return found ? [clone(found)] : [];
    }
    return [];
  },
  $executeRawUnsafe: async (sql, ...params) => {
    if (/UPDATE "education_group_members"/i.test(sql)) {
      const [amountPaid, paymentStatus, nextRenewalDate, id] = params;
      const member = state.groupMembers.find((item) => item.id === id);
      if (member) {
        member.amountPaid = amountPaid;
        member.paymentStatus = paymentStatus;
        member.nextRenewalDate = nextRenewalDate;
      }
    }
    return 1;
  },
  educationPayment: {
    findFirst: async ({ where }) => {
      if (where.id) {
        return clone(
          state.payments.find(
            (p) => p.id === where.id && (!where.companyId || p.companyId === where.companyId)
          ) || null
        );
      }
      if (where.paymentNumber?.startsWith) {
        const prefix = where.paymentNumber.startsWith;
        const matches = state.payments
          .filter((p) => String(p.paymentNumber || '').startsWith(prefix))
          .sort((a, b) => String(b.paymentNumber).localeCompare(String(a.paymentNumber)));
        return clone(matches[0] || null);
      }
      return null;
    },
    findMany: async ({ where = {}, skip = 0, take = 25 }) => {
      let rows = state.payments.filter((p) => !where.companyId || p.companyId === where.companyId);
      if (where.status) rows = rows.filter((p) => p.status === where.status);
      if (where.method) rows = rows.filter((p) => p.method === where.method);
      return clone(rows.slice(skip, skip + take));
    },
    count: async ({ where = {} }) =>
      state.payments.filter((p) => (!where.companyId || p.companyId === where.companyId) && (!where.status || p.status === where.status)).length,
    aggregate: async ({ where = {} }) => {
      const rows = state.payments.filter((p) => {
        if (where.companyId && p.companyId !== where.companyId) return false;
        if (where.status && p.status !== where.status) return false;
        if (where.paidAt?.gte && new Date(p.paidAt) < new Date(where.paidAt.gte)) return false;
        if (where.paidAt?.lte && new Date(p.paidAt) > new Date(where.paidAt.lte)) return false;
        return true;
      });
      return {
        _sum: { amount: rows.reduce((sum, row) => sum + Number(row.amount || 0), 0) },
        _count: rows.length,
      };
    },
    groupBy: async ({ where = {} } = {}) => {
      const map = new Map();
      for (const row of state.payments.filter((p) => {
        if (p.status !== 'COMPLETED') return false;
        if (where.paidAt?.gte && new Date(p.paidAt) < new Date(where.paidAt.gte)) return false;
        if (where.paidAt?.lte && new Date(p.paidAt) > new Date(where.paidAt.lte)) return false;
        return true;
      })) {
        const entry = map.get(row.method) || { amount: 0, count: 0 };
        entry.amount += Number(row.amount || 0);
        entry.count += 1;
        map.set(row.method, entry);
      }
      return Array.from(map.entries()).map(([method, entry]) => ({
        method,
        _sum: { amount: entry.amount },
        _count: entry.count,
      }));
    },
    create: async ({ data }) => {
      const created = { id: `pay-${state.payments.length + 1}`, ...copy(data) };
      state.payments.push(created);
      return clone(created);
    },
    update: async ({ where, data }) => {
      const payment = state.payments.find((p) => p.id === where.id);
      if (!payment) throw new Error('payment not found');
      Object.assign(payment, copy(data));
      return clone(payment);
    },
  },
  educationEnrollment: {
    findFirst: async ({ where }) => {
      const enrollment = state.enrollments.find(
        (item) => item.id === where.id && (!where.companyId || item.companyId === where.companyId)
      );
      return clone(enrollment || null);
    },
    findMany: async ({ where = {} }) =>
      clone(state.enrollments.filter((item) => !where.companyId || item.companyId === where.companyId)),
    update: async ({ where, data }) => {
      const enrollment = state.enrollments.find((item) => item.id === where.id);
      if (!enrollment) throw new Error('enrollment not found');
      Object.assign(enrollment, copy(data));
      state.nextEnrollmentUpdate = { id: where.id, data: copy(data) };
      return clone(enrollment);
    },
  },
  customerWallet: {
    update: async ({ where, data }) => {
      const wallet = state.wallets.find((item) => item.id === where.id);
      if (!wallet) throw new Error('wallet not found');
      wallet.balance += Number(data.balance?.increment || 0);
      wallet.totalDeposited = (wallet.totalDeposited || 0) + Number(data.totalDeposited?.increment || 0);
      return clone(wallet);
    },
  },
  walletTransaction: {
    findFirst: async ({ where }) => {
      const tx = state.walletTransactions.find((item) => item.id === where.id);
      return clone(tx || null);
    },
    findMany: async ({ where = {} } = {}) =>
      clone(
        state.walletTransactions.filter(
          (item) =>
            (!where.status || item.status === where.status) &&
            (!where.wallet?.companyId || item.wallet?.companyId === where.wallet.companyId)
        )
      ),
    count: async ({ where = {} }) =>
      state.walletTransactions.filter(
        (item) => (!where.status || item.status === where.status) &&
          (!where.wallet?.companyId || item.wallet?.companyId === where.wallet.companyId)
      ).length,    update: async ({ where, data }) => {
      const tx = state.walletTransactions.find((item) => item.id === where.id);
      if (!tx) throw new Error('wallet transaction not found');
      Object.assign(tx, copy(data));
      return clone(tx);
    },
  },
  treasuryAccount: {
    findFirst: async () => clone(state.treasury),
    create: async ({ data }) => {
      state.treasury = { id: 'treasury-1', ...copy(data) };
      return clone(state.treasury);
    },
    update: async ({ where, data }) => {
      if (!state.treasury || state.treasury.id !== where.id) throw new Error('treasury not found');
      if (data.balance?.increment) state.treasury.balance += Number(data.balance.increment);
      if (data.balance?.decrement) state.treasury.balance -= Number(data.balance.decrement);
      return clone(state.treasury);
    },
  },
  treasuryTransaction: {
    create: async ({ data }) => {
      const tx = { id: `ttx-${state.treasuryTx.length + 1}`, ...copy(data) };
      state.treasuryTx.push(tx);
      return clone(tx);
    },
  },
  company: {
    findUnique: async ({ where }) =>
      where.id === 'comp-1' ? { name: 'مركز ماكس', phone: '0100', email: 'a@b.c', address: 'القاهرة' } : null,
  },
  educationStudent: {
    findFirst: async ({ where }) =>
      where.id === 'stu-1' && where.companyId === 'comp-1'
        ? { id: 'stu-1', code: 'S-1', firstName: 'سارة', lastName: 'محمد', phone: '0111' }
        : null,
  },
};

function copy(data) {
  if (!data) return data;
  return JSON.parse(JSON.stringify(data, (key, value) => (typeof value === 'bigint' ? Number(value) : value)));
}

/* ------------------------------------------------------------------ */
/* Module wiring                                                       */
/* ------------------------------------------------------------------ */

const sharedDbPath = require.resolve('../../services/sharedDatabase');
require.cache[sharedDbPath] = {
  id: sharedDbPath,
  filename: sharedDbPath,
  loaded: true,
  exports: { getSharedPrismaClient: () => mockPrisma },
};

const auditPath = require.resolve('../../services/educationAuditService');
require.cache[auditPath] = {
  id: auditPath,
  filename: auditPath,
  loaded: true,
  exports: {
    logEducationEvent: async (event) => {
      state.audits.push(event);
      return null;
    },
  },
};

const controller = require('../../controller/educationPaymentsController');

const makeRes = () => {
  const res = {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
  };
  return res;
};

const makeReq = (body = {}, query = {}, user = { id: 'user-1', companyId: 'comp-1', name: 'كاشير' }) => ({
  body,
  query,
  params: {},
  user,
  headers: {},
});

beforeEach(() => {
  state.enrollments = [];
  state.groupMembers = [];
  state.payments = [];
  state.walletTransactions = [];
  state.wallets = [];
  state.treasury = { id: 'treasury-1', companyId: 'comp-1', name: 'الخزينة', isDefault: true, isActive: true, balance: 1000 };
  state.treasuryTx = [];
  state.audits = [];
  state.rawHandler = null;
  state.nextEnrollmentUpdate = null;
});

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

describe('educationPaymentsController.recordPayment', () => {
  it('collects an enrollment payment, updates the balance and posts a treasury deposit', async () => {
    state.enrollments.push({
      id: 'enr-1',
      companyId: 'comp-1',
      studentId: 'stu-1',
      isActive: true,
      amountPaid: 100,
      finalAmount: 500,
      paymentStatus: 'PARTIALLY_PAID',
      student: { id: 'stu-1', firstName: 'سارة', lastName: 'محمد' },
      package: { id: 'pkg-1', name: 'باقة 10 ساعات', price: 500 },
    });

    const req = makeReq({ enrollmentId: 'enr-1', amount: 200, method: 'cash', reference: 'TRX-9' });
    const res = makeRes();
    await controller.recordPayment(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload.success, true);
    assert.match(res.payload.data.paymentNumber, /^EDU-PAY-\d{6}-0001$/);
    assert.strictEqual(res.payload.data.method, 'CASH');
    assert.strictEqual(state.enrollments[0].amountPaid, 300);
    assert.strictEqual(state.enrollments[0].paymentStatus, 'PARTIALLY_PAID');
    assert.strictEqual(state.treasury.balance, 1200);
    assert.strictEqual(state.treasuryTx.length, 1);
    assert.strictEqual(state.treasuryTx[0].type, 'DEPOSIT');
    assert.strictEqual(state.treasuryTx[0].referenceType, 'EDUCATION_PAYMENT');
    assert.strictEqual(state.treasuryTx[0].referenceId, res.payload.data.id);
    assert.strictEqual(state.audits.length, 1);
    assert.strictEqual(state.audits[0].action, 'RECORD_PAYMENT');
  });

  it('marks the enrollment completed when the payment settles the full amount', async () => {
    state.enrollments.push({
      id: 'enr-1',
      companyId: 'comp-1',
      studentId: 'stu-1',
      isActive: true,
      amountPaid: 100,
      finalAmount: 500,
      student: { id: 'stu-1', firstName: 'سارة', lastName: 'محمد' },
      package: { id: 'pkg-1', name: 'باقة', price: 500 },
    });

    const res = makeRes();
    await controller.recordPayment(makeReq({ enrollmentId: 'enr-1', amount: 400, method: 'TRANSFER' }), res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.enrollments[0].paymentStatus, 'COMPLETED');
    assert.strictEqual(state.enrollments[0].amountPaid, 500);
  });

  it('rejects overpayment and does not move money', async () => {
    state.enrollments.push({
      id: 'enr-1',
      companyId: 'comp-1',
      studentId: 'stu-1',
      isActive: true,
      amountPaid: 450,
      finalAmount: 500,
      student: { firstName: 'سارة', lastName: 'محمد' },
      package: { name: 'باقة', price: 500 },
    });

    const res = makeRes();
    await controller.recordPayment(makeReq({ enrollmentId: 'enr-1', amount: 100 }), res);

    assert.strictEqual(res.statusCode, 400);
    assert.match(res.payload.error, /أكبر من المتبقي/);
    assert.strictEqual(state.enrollments[0].amountPaid, 450);
    assert.strictEqual(state.treasuryTx.length, 0);
  });

  it('rejects a fully paid enrollment', async () => {
    state.enrollments.push({
      id: 'enr-1', companyId: 'comp-1', studentId: 'stu-1', isActive: true,
      amountPaid: 500, finalAmount: 500, student: {}, package: {},
    });
    const res = makeRes();
    await controller.recordPayment(makeReq({ enrollmentId: 'enr-1', amount: 50 }), res);
    assert.strictEqual(res.statusCode, 409);
  });

  it('rejects cross-tenant enrollment ids', async () => {
    state.enrollments.push({
      id: 'enr-1', companyId: 'other-company', studentId: 'stu-1', isActive: true,
      amountPaid: 0, finalAmount: 500, student: {}, package: {},
    });
    const res = makeRes();
    await controller.recordPayment(makeReq({ enrollmentId: 'enr-1', amount: 50 }), res);
    assert.strictEqual(res.statusCode, 404);
  });

  it('blocks a duplicate group payment for the same cycle', async () => {
    const future = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();
    state.groupMembers.push({
      id: 'gm-1', companyId: 'comp-1', groupId: 'grp-1', studentId: 'stu-1',
      paymentStatus: 'PAID', amountPaid: 400, nextRenewalDate: future,
      firstName: 'سارة', lastName: 'محمد', groupName: 'مجموعة أ', feeAmount: 400, feeType: 'MONTHLY',
    });
    const res = makeRes();
    await controller.recordPayment(makeReq({ groupMemberId: 'gm-1', amount: 400 }), res);
    assert.strictEqual(res.statusCode, 409);
    assert.match(res.payload.error, /مسدد للدورة الحالية/);
  });

  it('renews a monthly group member and moves nextRenewalDate one month ahead', async () => {
    state.groupMembers.push({
      id: 'gm-1', companyId: 'comp-1', groupId: 'grp-1', studentId: 'stu-1',
      paymentStatus: 'PAID', amountPaid: 400, nextRenewalDate: new Date(Date.now() - 86400000).toISOString(),
      firstName: 'سارة', lastName: 'محمد', groupName: 'مجموعة أ', feeAmount: 400, feeType: 'MONTHLY',
    });
    const res = makeRes();
    await controller.recordPayment(makeReq({ groupMemberId: 'gm-1', amount: 400 }), res);

    assert.strictEqual(res.statusCode, 200);
    const member = state.groupMembers[0];
    assert.strictEqual(member.paymentStatus, 'PAID');
    assert.strictEqual(member.amountPaid, 400);
    assert.ok(new Date(member.nextRenewalDate).getTime() > Date.now());
    assert.strictEqual(state.treasuryTx[0].referenceType, 'EDUCATION_GROUP_PAYMENT');
    assert.strictEqual(res.payload.data.source, 'GROUP');
  });

  it('accumulates a partial group payment without renewing', async () => {
    state.groupMembers.push({
      id: 'gm-1', companyId: 'comp-1', groupId: 'grp-1', studentId: 'stu-1',
      paymentStatus: 'PENDING', amountPaid: 100, nextRenewalDate: null,
      firstName: 'سارة', lastName: 'محمد', groupName: 'مجموعة أ', feeAmount: 400, feeType: 'MONTHLY',
    });
    const res = makeRes();
    await controller.recordPayment(makeReq({ groupMemberId: 'gm-1', amount: 150 }), res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.groupMembers[0].amountPaid, 250);
    assert.strictEqual(state.groupMembers[0].paymentStatus, 'PARTIAL');
    assert.strictEqual(state.groupMembers[0].nextRenewalDate, null);
  });

  it('rejects unsupported methods and ambiguous targets', async () => {
    let res = makeRes();
    await controller.recordPayment(makeReq({ enrollmentId: 'enr-1', amount: 10, method: 'BITCOIN' }), res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.payload.error, /طريقة الدفع/);

    res = makeRes();
    await controller.recordPayment(makeReq({ enrollmentId: 'enr-1', groupMemberId: 'gm-1', amount: 10 }), res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.payload.error, /واحد فقط/);
  });

  it('rejects zero/negative amounts', async () => {
    const res = makeRes();
    await controller.recordPayment(makeReq({ enrollmentId: 'enr-1', amount: 0 }), res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.payload.error, /المبلغ غير صحيح/);
  });
});

describe('educationPaymentsController.reversePayment', () => {
  it('reverses a payment, restores the enrollment balance and posts a treasury expense', async () => {
    state.treasury.balance = 1500;
    state.enrollments.push({
      id: 'enr-1', companyId: 'comp-1', studentId: 'stu-1', isActive: true,
      amountPaid: 300, finalAmount: 500, paymentStatus: 'PARTIALLY_PAID',
    });
    state.payments.push({
      id: 'pay-1', companyId: 'comp-1', paymentNumber: 'EDU-PAY-202611-0001',
      enrollmentId: 'enr-1', studentId: 'stu-1', studentName: 'سارة محمد',
      amount: 200, method: 'CASH', status: 'COMPLETED',
    });

    const req = makeReq({ reason: 'خصم مكرر' }, {}, { id: 'user-2', companyId: 'comp-1', name: 'مدير' });
    req.params = { id: 'pay-1' };
    const res = makeRes();
    await controller.reversePayment(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload.data.status, 'REVERSED');
    assert.strictEqual(state.enrollments[0].amountPaid, 100);
    assert.strictEqual(state.enrollments[0].paymentStatus, 'PARTIALLY_PAID');
    assert.strictEqual(state.treasury.balance, 1300);
    assert.strictEqual(state.treasuryTx[0].type, 'EXPENSE');
    assert.strictEqual(state.treasuryTx[0].referenceType, 'EDUCATION_PAYMENT_REVERSAL');
    assert.strictEqual(state.audits[0].action, 'REVERSE_PAYMENT');
  });

  it('refuses double reversal', async () => {
    state.payments.push({ id: 'pay-1', companyId: 'comp-1', status: 'REVERSED', amount: 100, paymentNumber: 'X' });
    const req = makeReq({}, {}, { companyId: 'comp-1' });
    req.params = { id: 'pay-1' };
    const res = makeRes();
    await controller.reversePayment(req, res);
    assert.strictEqual(res.statusCode, 409);
  });

  it('refuses cross-tenant reversal', async () => {
    state.payments.push({ id: 'pay-1', companyId: 'other', status: 'COMPLETED', amount: 100, paymentNumber: 'X' });
    const req = makeReq({}, {}, { companyId: 'comp-1' });
    req.params = { id: 'pay-1' };
    const res = makeRes();
    await controller.reversePayment(req, res);
    assert.strictEqual(res.statusCode, 404);
  });
});

describe('educationPaymentsController wallet top-ups', () => {
  const seedTopup = (overrides = {}) => {
    state.wallets.push({ id: 'w-1', customerId: 'cust-1', companyId: 'comp-1', balance: 100, totalDeposited: 0 });
    state.walletTransactions.push({
      id: 'tx-1',
      walletId: 'w-1',
      type: 'CREDIT',
      amount: 500,
      status: 'PENDING_RELEASE',
      balanceBefore: 100,
      balanceAfter: 100,
      description: 'طلب شحن',
      wallet: {
        id: 'w-1',
        companyId: 'comp-1',
        customerId: 'cust-1',
        customer: { id: 'cust-1', firstName: 'أحمد', lastName: 'علي', phone: '0100' },
      },
      ...overrides,
    });
  };

  it('releases a pending top-up into the wallet and the treasury', async () => {
    seedTopup();
    const req = makeReq({}, {}, { id: 'user-1', companyId: 'comp-1', name: 'مدير' });
    req.params = { id: 'tx-1' };
    const res = makeRes();
    await controller.releaseTopup(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.wallets[0].balance, 600);
    assert.strictEqual(state.wallets[0].totalDeposited, 500);
    assert.strictEqual(state.walletTransactions[0].status, 'RELEASED');
    assert.ok(state.walletTransactions[0].releasedAt);
    assert.strictEqual(state.walletTransactions[0].balanceAfter, 600);
    assert.strictEqual(state.treasury.balance, 1500);
    assert.strictEqual(state.treasuryTx[0].referenceType, 'EDUCATION_WALLET_TOPUP');
    assert.strictEqual(state.audits[0].action, 'RELEASE_WALLET_TOPUP');
  });

  it('refuses to release twice', async () => {
    seedTopup({ status: 'RELEASED' });
    const req = makeReq({}, {}, { companyId: 'comp-1' });
    req.params = { id: 'tx-1' };
    const res = makeRes();
    await controller.releaseTopup(req, res);
    assert.strictEqual(res.statusCode, 409);
    assert.strictEqual(state.wallets[0].balance, 100);
  });

  it('rejects a pending top-up without moving money', async () => {
    seedTopup();
    const req = makeReq({ reason: 'إيصال غير واضح' }, {}, { companyId: 'comp-1' });
    req.params = { id: 'tx-1' };
    const res = makeRes();
    await controller.rejectTopup(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.walletTransactions[0].status, 'CANCELLED');
    assert.strictEqual(state.wallets[0].balance, 100);
    assert.strictEqual(state.treasuryTx.length, 0);
    assert.strictEqual(state.audits[0].action, 'REJECT_WALLET_TOPUP');
  });

  it('lists pending top-ups only', async () => {
    seedTopup();
    state.walletTransactions.push({ id: 'tx-2', status: 'RELEASED', amount: 10, wallet: { companyId: 'comp-1' } });
    const res = makeRes();
    await controller.listPendingTopups(makeReq({}, { status: 'PENDING_RELEASE' }), res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload.data.length, 1);
    assert.strictEqual(res.payload.data[0].id, 'tx-1');
  });
});

describe('educationPaymentsController summary & dues', () => {
  it('computes today/month totals, outstanding and overdue installments', async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 30 * 86400000).toISOString();
    state.payments.push(
      { id: 'p1', companyId: 'comp-1', amount: 100, method: 'CASH', status: 'COMPLETED', paidAt: now.toISOString() },
      { id: 'p2', companyId: 'comp-1', amount: 250, method: 'TRANSFER', status: 'COMPLETED', paidAt: now.toISOString() },
      { id: 'p3', companyId: 'comp-1', amount: 50, method: 'CASH', status: 'COMPLETED', paidAt: yesterday },
      { id: 'p4', companyId: 'comp-1', amount: 999, method: 'CASH', status: 'REVERSED', paidAt: now.toISOString() }
    );
    state.enrollments.push(
      {
        id: 'e1', companyId: 'comp-1', isActive: true, amountPaid: 100, finalAmount: 500,
        installments: [
          { installmentNumber: 1, amount: 100, status: 'PAID', dueDate: yesterday },
          { installmentNumber: 2, amount: 200, status: 'PENDING', dueDate: yesterday },
          { installmentNumber: 3, amount: 200, status: 'PENDING', dueDate: new Date(now.getTime() + 86400000).toISOString() },
        ],
      },
      { id: 'e2', companyId: 'comp-1', isActive: true, amountPaid: 300, finalAmount: 300, installments: [] }
    );
    state.walletTransactions.push({ id: 't1', status: 'PENDING_RELEASE', amount: 500, wallet: { companyId: 'comp-1' } });

    const res = makeRes();
    await controller.getSummary(makeReq(), res);

    assert.strictEqual(res.statusCode, 200);
    const data = res.payload.data;
    assert.strictEqual(data.today.amount, 350);
    assert.strictEqual(data.today.count, 2);
    assert.strictEqual(data.range.amount, 350);
    assert.strictEqual(data.outstanding.amount, 400);
    assert.strictEqual(data.outstanding.count, 1);
    assert.strictEqual(data.overdueInstallments.count, 1);
    assert.strictEqual(data.overdueInstallments.amount, 200);
    assert.strictEqual(data.pendingTopups, 1);
    assert.strictEqual(data.byMethod.CASH.amount, 100);
  });

  it('returns dues sorted with overdue details and tenant isolation', async () => {
    const past = new Date(Date.now() - 3 * 86400000).toISOString();
    state.enrollments.push(
      {
        id: 'e1', companyId: 'comp-1', isActive: true, studentId: 'stu-1',
        amountPaid: 100, finalAmount: 500, paymentMethod: 'INSTALLMENTS', installmentCount: 3,
        installments: [
          { installmentNumber: 1, amount: 100, status: 'PAID', dueDate: past },
          { installmentNumber: 2, amount: 200, status: 'PENDING', dueDate: past },
          { installmentNumber: 3, amount: 200, status: 'PENDING', dueDate: new Date(Date.now() + 2 * 86400000).toISOString() },
        ],
        student: { id: 'stu-1', code: 'S-1', firstName: 'سارة', lastName: 'محمد', phone: '0111' },
        package: { id: 'pkg-1', name: 'باقة 10', subject: { name: 'رياضيات' } },
      },
      {
        id: 'e2', companyId: 'other-company', isActive: true, amountPaid: 0, finalAmount: 100,
        student: {}, package: {},
      }
    );

    const res = makeRes();
    await controller.getDues(makeReq(), res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload.data.enrollments.length, 1);
    const due = res.payload.data.enrollments[0];
    assert.strictEqual(due.remaining, 400);
    assert.strictEqual(due.overdueCount, 1);
    assert.strictEqual(due.overdueAmount, 200);
    assert.strictEqual(due.studentName, 'سارة محمد');
    assert.strictEqual(res.payload.data.totals.enrollmentsRemaining, 400);
  });

  it('treats a paid monthly member with a passed renewal date as a full new cycle due', async () => {
    state.rawHandler = (sql) => {
      if (/FROM "education_group_members" m/i.test(sql)) {
        return [{
          id: 'gm-1', groupId: 'grp-1', studentId: 'stu-1', paymentStatus: 'PAID',
          amountPaid: 400, nextRenewalDate: new Date(Date.now() - 86400000).toISOString(),
          groupName: 'مجموعة أ', feeAmount: 400, feeType: 'MONTHLY',
          firstName: 'سارة', lastName: 'محمد', phone: '0111',
        }];
      }
      return [];
    };

    const res = makeRes();
    await controller.getDues(makeReq(), res);

    assert.strictEqual(res.statusCode, 200);
    const renewal = res.payload.data.groupRenewals[0];
    assert.strictEqual(renewal.paid, 400);
    assert.strictEqual(renewal.remaining, 400);
    assert.strictEqual(res.payload.data.totals.groupRenewalsRemaining, 400);
  });

  it('lists payments scoped to the tenant with pagination metadata', async () => {
    state.payments.push(
      { id: 'p1', companyId: 'comp-1', amount: 100, status: 'COMPLETED', method: 'CASH', paymentNumber: 'EDU-PAY-202611-0001' },
      { id: 'p2', companyId: 'other', amount: 200, status: 'COMPLETED', method: 'CASH', paymentNumber: 'EDU-PAY-202611-0002' },
      { id: 'p3', companyId: 'comp-1', amount: 300, status: 'COMPLETED', method: 'CASH', paymentNumber: 'EDU-PAY-202611-0003' }
    );
    const res = makeRes();
    await controller.listPayments(makeReq({}, { page: '1', limit: '1' }), res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload.data.length, 1);
    assert.strictEqual(res.payload.pagination.total, 2);
    assert.strictEqual(res.payload.pagination.totalPages, 2);
  });

  it('returns a printable receipt payload', async () => {
    state.payments.push({
      id: 'pay-1', companyId: 'comp-1', paymentNumber: 'EDU-PAY-202611-0001', receiptNumber: 'RCP-202611-0001',
      studentId: 'stu-1', enrollmentId: 'enr-1', studentName: 'سارة محمد',
      amount: 250, method: 'CASH', status: 'COMPLETED', paidAt: new Date().toISOString(),
    });
    state.enrollments.push({
      id: 'enr-1', companyId: 'comp-1', package: { name: 'باقة 10 ساعات', hoursCount: 10 },
    });

    const req = makeReq({}, {}, { companyId: 'comp-1' });
    req.params = { id: 'pay-1' };
    const res = makeRes();
    await controller.getReceipt(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload.data.company.name, 'مركز ماكس');
    assert.strictEqual(res.payload.data.student.firstName, 'سارة');
    assert.strictEqual(res.payload.data.package.name, 'باقة 10 ساعات');
    assert.strictEqual(res.payload.data.payment.receiptNumber, 'RCP-202611-0001');
  });

  it('denies access without company context', async () => {
    const res = makeRes();
    await controller.getSummary(makeReq({}, {}, { id: 'u' }), res);
    assert.strictEqual(res.statusCode, 403);
  });
});

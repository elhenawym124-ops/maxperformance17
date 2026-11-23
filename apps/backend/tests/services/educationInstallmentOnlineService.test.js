const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const state = {
  enrollment: null,
  intents: [],
  payments: [],
  revenueCalls: [],
  audits: [],
  receipts: [],
  sessionResponse: { success: true, sessionUrl: 'https://pay.kashier.io/session/inst', sessionId: 'sess-inst' },
  statusResponse: { success: true, status: 'SUCCESS', capturedAmount: 500 },
  createArgs: null,
};

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

const mockPrisma = {
  educationEnrollment: {
    findFirst: async ({ where }) => {
      if (!state.enrollment || state.enrollment.id !== where.id) return null;
      if (where.companyId && state.enrollment.companyId !== where.companyId) return null;
      return clone(state.enrollment);
    },
    update: async ({ where, data }) => {
      Object.assign(state.enrollment, clone(data));
      return clone(state.enrollment);
    },
  },
  educationPaymentIntent: {
    create: async ({ data }) => {
      const intent = { id: `intent-${state.intents.length + 1}`, status: 'PENDING', ...clone(data) };
      state.intents.push(intent);
      return clone(intent);
    },
    findFirst: async ({ where }) => {
      const found = state.intents.find(
        (intent) =>
          (!where.id || intent.id === where.id) &&
          (!where.referenceId || intent.referenceId === where.referenceId) &&
          (!where.companyId || intent.companyId === where.companyId) &&
          (!where.customerId || intent.customerId === where.customerId) &&
          (!where.status || intent.status === where.status)
      );
      return found ? clone(found) : null;
    },
    update: async ({ where, data }) => {
      const intent = state.intents.find((item) => item.id === where.id);
      Object.assign(intent, clone(data));
      return clone(intent);
    },
    deleteMany: async ({ where }) => {
      state.intents = state.intents.filter((item) => item.id !== where.id);
      return { count: 1 };
    },
  },
  educationPayment: {
    findFirst: async () => null,
    create: async ({ data }) => {
      const payment = { id: `payment-${state.payments.length + 1}`, ...clone(data) };
      state.payments.push(payment);
      return clone(payment);
    },
  },
  $transaction: async (fn) => fn(mockPrisma),
};

const sharedDbPath = require.resolve('../../services/sharedDatabase');
require.cache[sharedDbPath] = {
  id: sharedDbPath, filename: sharedDbPath, loaded: true,
  exports: { getSharedPrismaClient: () => mockPrisma },
};

const kashierPath = require.resolve('../../services/kashierService');
require.cache[kashierPath] = {
  id: kashierPath, filename: kashierPath, loaded: true,
  exports: {
    createPaymentSession: async (args, companyId, override) => {
      state.createArgs = { ...args, metaData: override?.metaData, companyIdArg: companyId };
      return state.sessionResponse;
    },
    getSessionStatus: async () => state.statusResponse,
  },
};

const financialPath = require.resolve('../../services/educationFinancialIntegrationService');
require.cache[financialPath] = {
  id: financialPath, filename: financialPath, loaded: true,
  exports: {
    recordEducationRevenueInTx: async (_tx, args) => { state.revenueCalls.push(args); return {}; },
  },
};

const auditPath = require.resolve('../../services/educationAuditService');
require.cache[auditPath] = {
  id: auditPath, filename: auditPath, loaded: true,
  exports: { logEducationEvent: async (event) => { state.audits.push(event); return null; } },
};

const notificationPath = require.resolve('../../services/educationNotificationService');
require.cache[notificationPath] = {
  id: notificationPath, filename: notificationPath, loaded: true,
  exports: { notifyPaymentReceipt: async (payload) => { state.receipts.push(payload); return { success: true }; } },
};

const service = require('../../services/educationInstallmentOnlineService');

const baseSession = () => ({
  companyId: 'comp-1',
  customerId: 'cust-1',
  enrollmentId: 'enr-1',
  installmentNumber: 2,
  baseUrl: 'https://maxp.online',
  webhookUrl: 'https://maxp.online/api/v1/payment/kashier/webhook',
});

beforeEach(() => {
  state.enrollment = {
    id: 'enr-1',
    companyId: 'comp-1',
    studentId: 'stu-1',
    packageId: 'pkg-1',
    branchId: 'branch-1',
    isActive: true,
    amountPaid: 500,
    finalAmount: 1000,
    paymentStatus: 'PARTIALLY_PAID',
    installments: [
      { installmentNumber: 1, amount: 500, status: 'PAID', dueDate: '2026-11-01', paidAt: '2026-11-01T10:00:00.000Z' },
      { installmentNumber: 2, amount: 500, status: 'PENDING', dueDate: '2026-11-20' },
    ],
    student: { id: 'stu-1', customerId: 'cust-1', firstName: 'سارة', lastName: 'محمد', customer: { phone: '01001234567' } },
    package: { name: 'باقة 10 ساعات', price: 1000 },
  };
  state.intents = [];
  state.payments = [];
  state.revenueCalls = [];
  state.audits = [];
  state.receipts = [];
  state.createArgs = null;
  state.sessionResponse = { success: true, sessionUrl: 'https://pay.kashier.io/session/inst', sessionId: 'sess-inst' };
  state.statusResponse = { success: true, status: 'SUCCESS', capturedAmount: 500 };
});

describe('educationInstallmentOnlineService.createInstallmentSession', () => {
  it('creates a pending intent and a Kashier session for the unpaid installment', async () => {
    const result = await service.createInstallmentSession(baseSession());

    assert.strictEqual(result.amount, 500);
    assert.strictEqual(result.sessionUrl, 'https://pay.kashier.io/session/inst');
    assert.strictEqual(state.intents.length, 1);
    assert.strictEqual(state.intents[0].status, 'PENDING');
    assert.strictEqual(state.intents[0].installmentNumber, 2);
    assert.match(state.intents[0].referenceId, /^EDUINST-comp-1-enr-1-2-\d+$/);
    assert.strictEqual(state.createArgs.metaData.type, 'EDUCATION_INSTALLMENT');
    assert.strictEqual(state.createArgs.customer.reference, 'eduinst:comp-1:cust-1:enr-1:2');
  });

  it('rejects a paid installment, a foreign family, and an inactive enrollment', async () => {
    await assert.rejects(
      () => service.createInstallmentSession({ ...baseSession(), installmentNumber: 1 }),
      /مسدد بالفعل/
    );
    await assert.rejects(
      () => service.createInstallmentSession({ ...baseSession(), customerId: 'cust-other' }),
      /غير موجود/
    );
    state.enrollment.isActive = false;
    await assert.rejects(() => service.createInstallmentSession(baseSession()), /غير نشط/);
    assert.strictEqual(state.intents.length, 0);
  });

  it('cleans the intent when the gateway session fails', async () => {
    state.sessionResponse = { success: false, error: 'gateway down' };
    await assert.rejects(() => service.createInstallmentSession(baseSession()), /gateway down/);
    assert.strictEqual(state.intents.length, 0);
  });
});

describe('educationInstallmentOnlineService.verifyInstallmentPayment', () => {
  const seedPending = () => {
    state.intents.push({
      id: 'intent-1', companyId: 'comp-1', customerId: 'cust-1', enrollmentId: 'enr-1',
      installmentNumber: 2, amount: 500, purpose: 'INSTALLMENT',
      referenceId: 'EDUINST-comp-1-enr-1-2-1', sessionId: 'sess-inst', status: 'PENDING',
    });
  };

  it('marks the installment paid, writes the ledger and posts revenue after verification', async () => {
    seedPending();
    const result = await service.verifyInstallmentPayment({
      companyId: 'comp-1', orderId: 'EDUINST-comp-1-enr-1-2-1', customerId: 'cust-1',
    });

    assert.strictEqual(result.paid, true);
    assert.strictEqual(result.amount, 500);
    assert.strictEqual(state.enrollment.installments[1].status, 'PAID');
    assert.strictEqual(state.enrollment.amountPaid, 1000);
    assert.strictEqual(state.enrollment.paymentStatus, 'COMPLETED');
    assert.strictEqual(state.payments.length, 1);
    assert.strictEqual(state.payments[0].method, 'CARD');
    assert.strictEqual(state.payments[0].source, 'ONLINE');
    assert.strictEqual(state.payments[0].branchId, 'branch-1');
    assert.strictEqual(state.payments[0].packageId, 'pkg-1');
    assert.strictEqual(state.revenueCalls.length, 1);
    assert.strictEqual(state.revenueCalls[0].sourceType, 'EDUCATION_INSTALLMENT_ONLINE');
    assert.strictEqual(state.intents[0].status, 'COMPLETED');
    assert.strictEqual(state.intents[0].paymentId, state.payments[0].id);
    assert.strictEqual(state.audits[0].action, 'RECORD_PAYMENT');
    assert.strictEqual(state.receipts.length, 1);
  });

  it('is idempotent for an already completed intent', async () => {
    seedPending();
    await service.verifyInstallmentPayment({ companyId: 'comp-1', orderId: 'EDUINST-comp-1-enr-1-2-1', customerId: 'cust-1' });
    state.statusResponse = { success: true, status: 'FAILED', capturedAmount: 0 };
    const second = await service.verifyInstallmentPayment({
      companyId: 'comp-1', orderId: 'EDUINST-comp-1-enr-1-2-1', customerId: 'cust-1',
    });

    assert.strictEqual(second.already, true);
    assert.strictEqual(state.payments.length, 1);
    assert.strictEqual(state.revenueCalls.length, 1);
  });

  it('does not change anything when the gateway says the payment is pending', async () => {
    seedPending();
    state.statusResponse = { success: true, status: 'PENDING', capturedAmount: 0 };
    const result = await service.verifyInstallmentPayment({
      companyId: 'comp-1', orderId: 'EDUINST-comp-1-enr-1-2-1', customerId: 'cust-1',
    });

    assert.strictEqual(result.paid, false);
    assert.strictEqual(state.enrollment.installments[1].status, 'PENDING');
    assert.strictEqual(state.payments.length, 0);
  });

  it('rejects a partial capture below the installment amount', async () => {
    seedPending();
    state.statusResponse = { success: true, status: 'SUCCESS', capturedAmount: 200 };
    await assert.rejects(
      () => service.verifyInstallmentPayment({ companyId: 'comp-1', orderId: 'EDUINST-comp-1-enr-1-2-1', customerId: 'cust-1' }),
      /أقل من قيمة القسط/
    );
    assert.strictEqual(state.enrollment.amountPaid, 500);
  });

  it('scopes intents to the parent and tenant', async () => {
    seedPending();
    await assert.rejects(
      () => service.verifyInstallmentPayment({ companyId: 'comp-1', orderId: 'EDUINST-comp-1-enr-1-2-1', customerId: 'other' }),
      /غير موجودة/
    );
    await assert.rejects(
      () => service.verifyInstallmentPayment({ companyId: 'comp-2', orderId: 'EDUINST-comp-1-enr-1-2-1' }),
      /غير موجودة/
    );
  });
});

describe('educationInstallmentOnlineService.handleWebhook', () => {
  it('ignores unrelated webhooks', async () => {
    const result = await service.handleWebhook({ orderNumber: 'ORD-1' });
    assert.strictEqual(result.handled, false);
  });

  it('re-verifies installment webhooks before crediting', async () => {
    state.intents.push({
      id: 'intent-1', companyId: 'comp-1', customerId: 'cust-1', enrollmentId: 'enr-1',
      installmentNumber: 2, amount: 500, referenceId: 'EDUINST-comp-1-enr-1-2-1',
      sessionId: 'sess-inst', status: 'PENDING',
    });
    const result = await service.handleWebhook({
      orderNumber: 'EDUINST-comp-1-enr-1-2-1',
      sessionId: 'sess-inst',
      metaData: { type: 'EDUCATION_INSTALLMENT', companyId: 'comp-1' },
    });
    assert.strictEqual(result.handled, true);
    assert.strictEqual(result.credited, true);
    assert.strictEqual(state.payments.length, 1);
  });
});

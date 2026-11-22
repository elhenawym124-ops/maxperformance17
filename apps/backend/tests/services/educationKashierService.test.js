const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const state = {
  wallets: [],
  transactions: [],
  treasury: { id: 'tr-1', balance: 0 },
  treasuryTx: [],
  notifications: [],
  audits: [],
  sessionResponse: { success: true, sessionUrl: 'https://pay.kashier.io/session/abc', sessionId: 'sess-1' },
  statusResponse: { success: true, status: 'SUCCESS', capturedAmount: 500, amount: 500 },
  createSessionArgs: null,
};

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

const mockPrisma = {
  customerWallet: {
    findFirst: async ({ where }) =>
      state.wallets.find((w) => w.customerId === where.customerId && w.companyId === where.companyId) || null,
    create: async ({ data }) => {
      const wallet = { id: `w-${state.wallets.length + 1}`, balance: 0, totalDeposited: 0, ...data };
      state.wallets.push(wallet);
      return clone(wallet);
    },
    update: async ({ where, data }) => {
      const wallet = state.wallets.find((w) => w.id === where.id);
      if (!wallet) throw new Error('wallet not found');
      wallet.balance += Number(data.balance?.increment || 0);
      wallet.totalDeposited = (wallet.totalDeposited || 0) + Number(data.totalDeposited?.increment || 0);
      return clone(wallet);
    },
  },
  walletTransaction: {
    create: async ({ data }) => {
      const tx = { id: `tx-${state.transactions.length + 1}`, ...clone(data) };
      state.transactions.push(tx);
      return clone(tx);
    },
    findFirst: async ({ where }) => {
      let rows = state.transactions;
      if (where.id) rows = rows.filter((t) => t.id === where.id);
      if (where.referenceId) rows = rows.filter((t) => t.referenceId === where.referenceId);
      if (where.status) rows = rows.filter((t) => t.status === where.status);
      if (where.type) rows = rows.filter((t) => t.type === where.type);
      if (where.wallet?.companyId || where.wallet?.customerId) {
        rows = rows.filter((t) => {
          const wallet = state.wallets.find((w) => w.id === t.walletId);
          if (!wallet) return false;
          if (where.wallet.companyId && wallet.companyId !== where.wallet.companyId) return false;
          if (where.wallet.customerId && wallet.customerId !== where.wallet.customerId) return false;
          return true;
        });
      }
      const found = rows[0] || null;
      if (!found) return null;
      const wallet = state.wallets.find((w) => w.id === found.walletId);
      return clone({ ...found, wallet });
    },
    update: async ({ where, data }) => {
      const tx = state.transactions.find((t) => t.id === where.id);
      if (!tx) throw new Error('tx not found');
      Object.assign(tx, clone(data));
      return clone(tx);
    },
    deleteMany: async ({ where }) => {
      state.transactions = state.transactions.filter((t) => t.id !== where.id);
      return { count: 1 };
    },
  },
  treasuryAccount: {
    findFirst: async () => state.treasury,
    create: async ({ data }) => {
      state.treasury = { id: 'tr-1', ...clone(data) };
      return clone(state.treasury);
    },
    update: async ({ where, data }) => {
      state.treasury.balance += Number(data.balance?.increment || 0);
      return clone(state.treasury);
    },
  },
  treasuryTransaction: {
    create: async ({ data }) => {
      state.treasuryTx.push(clone(data));
      return { id: `ttx-${state.treasuryTx.length}`, ...clone(data) };
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
    createPaymentSession: async (args) => {
      state.createSessionArgs = args;
      return state.sessionResponse;
    },
    getSessionStatus: async () => state.statusResponse,
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
  exports: { notifyWalletTopupDecision: async (payload) => { state.notifications.push(payload); return { success: true }; } },
};

const service = require('../../services/educationKashierService');

const baseArgs = () => ({
  companyId: 'comp-1',
  customerId: 'cust-1',
  parentName: 'أحمد علي',
  parentPhone: '01001234567',
  amount: 500,
  baseUrl: 'https://maxp.online',
  webhookUrl: 'https://maxp.online/api/v1/payment/kashier/webhook',
});

beforeEach(() => {
  state.wallets = [{ id: 'w-1', customerId: 'cust-1', companyId: 'comp-1', balance: 100, totalDeposited: 0 }];
  state.transactions = [];
  state.treasury = { id: 'tr-1', companyId: 'comp-1', balance: 0, isDefault: true, isActive: true };
  state.treasuryTx = [];
  state.notifications = [];
  state.audits = [];
  state.createSessionArgs = null;
  state.sessionResponse = { success: true, sessionUrl: 'https://pay.kashier.io/session/abc', sessionId: 'sess-1' };
  state.statusResponse = { success: true, status: 'SUCCESS', capturedAmount: 500, amount: 500 };
});

describe('educationKashierService.createTopupSession', () => {
  it('creates a pending top-up and a Kashier session with education metadata', async () => {
    const result = await service.createTopupSession(baseArgs());

    assert.strictEqual(result.amount, 500);
    assert.strictEqual(result.sessionUrl, 'https://pay.kashier.io/session/abc');
    assert.strictEqual(state.transactions.length, 1);
    assert.strictEqual(state.transactions[0].status, 'PENDING_RELEASE');
    assert.strictEqual(state.transactions[0].type, 'CREDIT');
    assert.strictEqual(state.transactions[0].amount, 500);
    assert.match(state.transactions[0].referenceId, /^EDUTOP-comp-1-\d+$/);
    assert.match(state.transactions[0].description, /session:sess-1/);
    assert.strictEqual(state.createSessionArgs.customer.reference, 'edu:comp-1:cust-1');
    assert.match(state.createSessionArgs.redirectUrl, /topupOrder=/);
  });

  it('rejects invalid and out-of-range amounts', async () => {
    await assert.rejects(() => service.createTopupSession({ ...baseArgs(), amount: 0 }), /أقل مبلغ/);
    await assert.rejects(() => service.createTopupSession({ ...baseArgs(), amount: 5 }), /أقل مبلغ/);
    await assert.rejects(() => service.createTopupSession({ ...baseArgs(), amount: 50001 }), /أقصى مبلغ/);
    assert.strictEqual(state.transactions.length, 0);
  });

  it('removes the pending top-up when the gateway session fails', async () => {
    state.sessionResponse = { success: false, error: 'gateway down' };
    await assert.rejects(() => service.createTopupSession(baseArgs()), /gateway down/);
    assert.strictEqual(state.transactions.length, 0);
  });
});

describe('educationKashierService.verifyTopup', () => {
  const seedPending = () => {
    state.transactions.push({
      id: 'tx-1', walletId: 'w-1', type: 'CREDIT', amount: 500,
      status: 'PENDING_RELEASE', balanceBefore: 100, balanceAfter: 100,
      referenceId: 'EDUTOP-comp-1-1', description: 'شحن | session:sess-1',
    });
  };

  it('credits the wallet and treasury only after a successful server-side check', async () => {
    seedPending();
    const result = await service.verifyTopup({ companyId: 'comp-1', orderId: 'EDUTOP-comp-1-1', customerId: 'cust-1' });

    assert.strictEqual(result.paid, true);
    assert.strictEqual(result.amount, 500);
    assert.strictEqual(state.wallets[0].balance, 600);
    assert.strictEqual(state.transactions[0].status, 'RELEASED');
    assert.strictEqual(state.treasury.balance, 500);
    assert.strictEqual(state.treasuryTx[0].referenceType, 'EDUCATION_WALLET_TOPUP');
    assert.strictEqual(state.treasuryTx[0].amount, 500);
    assert.strictEqual(state.notifications.length, 1);
    assert.strictEqual(state.notifications[0].approved, true);
    assert.strictEqual(state.audits[0].action, 'RELEASE_WALLET_TOPUP');
  });

  it('is idempotent for an already released top-up', async () => {
    seedPending();
    await service.verifyTopup({ companyId: 'comp-1', orderId: 'EDUTOP-comp-1-1', customerId: 'cust-1' });
    const second = await service.verifyTopup({ companyId: 'comp-1', orderId: 'EDUTOP-comp-1-1', customerId: 'cust-1' });

    assert.strictEqual(second.already, true);
    assert.strictEqual(state.wallets[0].balance, 600);
    assert.strictEqual(state.treasuryTx.length, 1);
  });

  it('does not credit when the gateway says the payment is not successful', async () => {
    seedPending();
    state.statusResponse = { success: true, status: 'PENDING', capturedAmount: 0 };
    const result = await service.verifyTopup({ companyId: 'comp-1', orderId: 'EDUTOP-comp-1-1', customerId: 'cust-1' });

    assert.strictEqual(result.paid, false);
    assert.strictEqual(state.wallets[0].balance, 100);
    assert.strictEqual(state.transactions[0].status, 'PENDING_RELEASE');
  });

  it('refuses a partial capture below the requested amount', async () => {
    seedPending();
    state.statusResponse = { success: true, status: 'SUCCESS', capturedAmount: 200 };
    await assert.rejects(
      () => service.verifyTopup({ companyId: 'comp-1', orderId: 'EDUTOP-comp-1-1', customerId: 'cust-1' }),
      /أقل من المطلوب/
    );
    assert.strictEqual(state.wallets[0].balance, 100);
  });

  it('scopes the top-up to the parent and tenant', async () => {
    seedPending();
    await assert.rejects(
      () => service.verifyTopup({ companyId: 'comp-1', orderId: 'EDUTOP-comp-1-1', customerId: 'cust-other' }),
      /غير موجودة/
    );
    await assert.rejects(
      () => service.verifyTopup({ companyId: 'comp-2', orderId: 'EDUTOP-comp-1-1' }),
      /غير موجودة/
    );
  });
});

describe('educationKashierService.handleEducationTopupWebhook', () => {
  it('ignores non-education webhooks', async () => {
    const result = await service.handleEducationTopupWebhook({ orderNumber: 'ORD-1' });
    assert.strictEqual(result.handled, false);
  });

  it('verifies and credits an education record, ignoring forged failure states', async () => {
    state.transactions.push({
      id: 'tx-1', walletId: 'w-1', type: 'CREDIT', amount: 500,
      status: 'PENDING_RELEASE', referenceId: 'EDUTOP-comp-1-1', description: 'شحن | session:sess-1',
    });

    const ok = await service.handleEducationTopupWebhook({
      orderNumber: 'EDUTOP-comp-1-1',
      sessionId: 'sess-1',
      metaData: { type: 'EDUCATION_TOPUP', companyId: 'comp-1' },
    });
    assert.strictEqual(ok.handled, true);
    assert.strictEqual(ok.credited, true);

    // gateway says failed for a second record -> no credit
    state.transactions.push({
      id: 'tx-2', walletId: 'w-1', type: 'CREDIT', amount: 700,
      status: 'PENDING_RELEASE', referenceId: 'EDUTOP-comp-1-2', description: 'شحن | session:sess-2',
    });
    state.statusResponse = { success: true, status: 'FAILED', capturedAmount: 0 };
    const failed = await service.handleEducationTopupWebhook({
      orderNumber: 'EDUTOP-comp-1-2',
      sessionId: 'sess-2',
      metaData: { type: 'EDUCATION_TOPUP', companyId: 'comp-1' },
    });
    assert.strictEqual(failed.handled, true);
    assert.strictEqual(failed.credited, false);
    assert.strictEqual(state.wallets[0].balance, 600);
  });
});

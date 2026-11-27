const request = require('supertest');
const express = require('express');

const mockAiServiceAdminClient = {
  spawnAgent: jest.fn(),
  listAgents: jest.fn().mockResolvedValue([]),
  listTools: jest.fn().mockResolvedValue([]),
  listAgentTemplates: jest.fn().mockResolvedValue([]),
};

jest.mock('../../services/aiServiceAdminClient', () => mockAiServiceAdminClient);

let currentUserRole = 'COMPANY_ADMIN';
let mockSystemSettingRow = null;
let mockWalletBalance = 1000;
let walletUpdateShouldSucceed = true;

const mockPrisma = {
  aiAgentTask: {
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockResolvedValue({ id: 'task-1' }),
  },
  companyApp: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  systemSettings: {
    findUnique: jest.fn(async () => mockSystemSettingRow),
    upsert: jest.fn(async ({ create, update }) => {
      mockSystemSettingRow = {
        systemName: create.systemName,
        config: update.config,
      };
      return mockSystemSettingRow;
    }),
  },
  companyWallet: {
    findUnique: jest.fn(async () => ({ id: 'w-1', companyId: 'cmopgxu3a07i4jujj6f1oh32h', balance: mockWalletBalance })),
    updateMany: jest.fn(async ({ data }) => {
      if (!walletUpdateShouldSucceed) return { count: 0 };
      mockWalletBalance -= Number(data.balance.decrement || 0);
      return { count: 1 };
    }),
    update: jest.fn(async ({ data }) => {
      if (data?.balance?.increment) {
        mockWalletBalance += Number(data.balance.increment);
      }
      return { id: 'w-1', balance: mockWalletBalance };
    }),
  },
  transaction: {
    create: jest.fn().mockResolvedValue({ id: 'tx-1' }),
  },
  companyWalletTransaction: {
    create: jest.fn().mockResolvedValue({ id: 'cwtx-1' }),
  },
  $transaction: jest.fn(async (cb) => cb(mockPrisma)),
};

jest.mock('../../services/sharedDatabase', () => ({
  getSharedPrismaClient: () => mockPrisma,
  getSharedPrismaClientAsync: async () => mockPrisma,
}));

jest.mock('../../utils/verifyToken', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: 'user-1', companyId: 'cmopgxu3a07i4jujj6f1oh32h', role: currentUserRole };
    next();
  },
}));

const agentManagerRoutes = require('../../routes/agentManagerRoutes');
const catalogService = require('../../services/agentMarketplaceCatalogService');

describe('Agent Manager Catalog & Hire Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    currentUserRole = 'COMPANY_ADMIN';
    mockSystemSettingRow = null;
    mockWalletBalance = 1000;
    walletUpdateShouldSucceed = true;
    catalogService.invalidateCache();
    app = express();
    app.use(express.json());
    app.use(agentManagerRoutes);
  });

  it('auto-discovers all disk agents and hides internal agents from non-admin catalog', async () => {
    const res = await request(app).get('/catalog?includeHidden=true');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.isSuperAdmin).toBe(false);
    expect(res.body.stats.totalDiscovered).toBeGreaterThanOrEqual(40);
    // blank & customer-ceo are internal hidden agents
    const slugs = res.body.agents.map((a) => a.slug);
    expect(slugs).not.toContain('blank');
    expect(slugs).not.toContain('customer-ceo');
    expect(slugs).toContain('executive-assistant-agent');
    expect(slugs).toContain('aov-specialist-agent');
  });

  it('allows SUPER_ADMIN to view hidden agents and toggle visibility', async () => {
    currentUserRole = 'SUPER_ADMIN';
    const initial = await request(app).get('/catalog?includeHidden=true');
    expect(initial.status).toBe(200);
    expect(initial.body.agents.some((a) => a.slug === 'blank')).toBe(true);

    const hideRes = await request(app)
      .patch('/catalog/competitor-analysis')
      .send({ visible: false, priceMonthly: 450 });
    expect(hideRes.status).toBe(200);
    expect(hideRes.body.agent.visible).toBe(false);
    expect(hideRes.body.agent.priceMonthly).toBe(450);

    // Non-admin should no longer see or be able to hire hidden agent
    currentUserRole = 'COMPANY_ADMIN';
    const merchantCatalog = await request(app).get('/catalog');
    expect(merchantCatalog.body.agents.some((a) => a.slug === 'competitor-analysis')).toBe(false);

    const blockedHire = await request(app)
      .post('/hire')
      .send({ templateSlug: 'competitor-analysis' });
    expect(blockedHire.status).toBe(403);
    expect(blockedHire.body.code).toBe('AGENT_NOT_AVAILABLE');
  });

  it('blocks non-admin from patching catalog overrides', async () => {
    const res = await request(app).patch('/catalog/competitor-analysis').send({ visible: false });
    expect(res.status).toBe(403);
  });

  it('successfully hires Pro agent, deducts wallet atomically, and maps descriptive Arabic role to description', async () => {
    mockAiServiceAdminClient.spawnAgent.mockResolvedValue({
      id: 'agent_123',
      name: 'زياد رادار',
      role: 'COMPETITOR',
      status: 'ACTIVE',
      template_slug: 'competitor-analysis',
    });

    const payload = {
      templateSlug: 'competitor-analysis',
      name: 'زياد رادار',
      role: 'محلل استخبارات السوق والحملات التنافسية (Market Intelligence Specialist)',
      department: 'executive',
      safetyMode: 'draft',
    };

    const res = await request(app).post('/hire').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('agent_123');
    expect(res.body.chargedAmount).toBe(390);
    expect(mockWalletBalance).toBe(610);

    expect(mockAiServiceAdminClient.spawnAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'cmopgxu3a07i4jujj6f1oh32h',
        templateSlug: 'competitor-analysis',
        name: 'زياد رادار',
        description: 'محلل استخبارات السوق والحملات التنافسية (Market Intelligence Specialist)',
        department: 'executive',
        safetyMode: 'draft',
      })
    );
    const calledPayload = mockAiServiceAdminClient.spawnAgent.mock.calls[0][0];
    expect(calledPayload.role).toBeUndefined();
  });

  it('rejects Pro agent hire with 402 when company wallet balance is insufficient', async () => {
    mockWalletBalance = 100;
    const res = await request(app).post('/hire').send({
      templateSlug: 'competitor-analysis',
    });
    expect(res.status).toBe(402);
    expect(res.body.code).toBe('INSUFFICIENT_WALLET_BALANCE');
    expect(res.body.requiredAmount).toBe(390);
    expect(res.body.currentBalance).toBe(100);
    expect(mockAiServiceAdminClient.spawnAgent).not.toHaveBeenCalled();
  });

  it('refunds company wallet automatically if spawnAgent fails after debit', async () => {
    mockAiServiceAdminClient.spawnAgent.mockRejectedValue(new Error('Agent with name already exists'));

    const res = await request(app).post('/hire').send({
      templateSlug: 'competitor-analysis',
      name: 'زياد رادار',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Agent with name already exists');
    // Balance refunded back to original 1000
    expect(mockWalletBalance).toBe(1000);
  });

  it('hires Free agent without charging wallet', async () => {
    mockWalletBalance = 0;
    mockAiServiceAdminClient.spawnAgent.mockResolvedValue({
      id: 'agent_free',
      name: 'سارة',
      role: 'FACEBOOK_SALES_SUPPORT',
      status: 'ACTIVE',
      template_slug: 'facebook-sales-support-agent',
    });

    const res = await request(app).post('/hire').send({
      templateSlug: 'facebook-sales-support-agent',
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('agent_free');
    expect(mockPrisma.companyWallet.updateMany).not.toHaveBeenCalled();
  });
});

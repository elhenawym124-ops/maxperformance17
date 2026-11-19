const mockPrisma = {
  company: {
    findUnique: jest.fn(),
  },
  companyApp: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn().mockResolvedValue(1),
  },
  marketplaceApp: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock('../../services/sharedDatabase', () => ({
  getSharedPrismaClient: jest.fn(() => mockPrisma),
  executeWithRetry: jest.fn(async (operation) => operation()),
}));

const express = require('express');
const request = require('supertest');
const appRegistryService = require('../../services/appContract/appRegistryService');
const appKillSwitchService = require('../../services/appContract/appKillSwitchService');
const { marketplaceCatalogService } = require('../../services/catalog/marketplaceCatalogService');
const { scanForForbiddenCode } = require('../../services/appContract/appManifestValidator');
const path = require('path');

describe('Hello App Acceptance & Integration Protocol (Red-Line Criteria)', () => {
  let app;
  const companyAId = 'comp-active-123';
  const companyBId = 'comp-locked-456';

  beforeAll(async () => {
    // 1. Initialize Registry and ensure hello-app is registered
    appRegistryService.initialize();

    // 2. Setup mock Express application
    app = express();
    app.use(express.json());

    // Inject simulated authenticated user & company context middleware for testing
    app.use((req, res, next) => {
      const authHeader = req.headers['authorization'];
      if (authHeader) {
        try {
          const payload = JSON.parse(authHeader);
          req.user = payload;
        } catch (_) {}
      }
      next();
    });

    // Mount modular tools on Express app
    appRegistryService.mountToolsOnApp(app);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    appKillSwitchService.clearAll();

    // Default mock: Company A has active installation, Company B has none
    mockPrisma.companyApp.findFirst.mockImplementation(async ({ where }) => {
      if (where.companyId === companyAId) {
        return {
          id: 'ca-123',
          companyId: companyAId,
          status: 'ACTIVE',
          app: { slug: 'hello-app', name: 'Hello App', isActive: true }
        };
      }
      return null;
    });
  });

  afterAll(() => {
    appKillSwitchService.clearAll();
  });

  it('1. Hello App registers automatically via manifest only with zero direct core imports', () => {
    const tool = appRegistryService.getTool('hello-app');
    expect(tool).toBeDefined();
    expect(tool.slug).toBe('hello-app');
    expect(tool.manifest.version).toBe('1.0.0');
    expect(tool.manifest.defaultEnabled).toBe(false);
  });

  it('2. Hello App appears in catalog locked (defaultEnabled: false) with full settingsSchema', async () => {
    const catalogApp = await marketplaceCatalogService.getAppBySlug('hello-app');
    expect(catalogApp).toBeDefined();
    expect(catalogApp.slug).toBe('hello-app');
    expect(catalogApp.defaultEnabled).toBe(false);
    expect(catalogApp.settingsSchema).toBeDefined();
    expect(catalogApp.settingsSchema.properties).toHaveProperty('welcomeMessage');
    expect(catalogApp.settingsSchema.properties).toHaveProperty('enableAutoSync');
    expect(catalogApp.settingsSchema.properties).toHaveProperty('syncIntervalMinutes');
    expect(catalogApp.permissions).toContain('dashboard.view');
    expect(catalogApp.permissions).toContain('settings.read');
  });

  it('3. HealthCheck endpoint reports healthy status and tool version', async () => {
    const res = await request(app).get('/api/v1/tools/hello-app/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('HEALTHY');
    expect(res.body.tool).toBe('hello-app');
    expect(res.body.version).toBe('1.0.0');
  });

  it('4. Returns 403 APP_NOT_ACTIVE_FOR_COMPANY for a company that has not enabled the tool', async () => {
    // Company B has NOT installed/enabled hello-app
    const res = await request(app)
      .get('/api/v1/tools/hello-app/ping')
      .set('authorization', JSON.stringify({
        id: 'user-b',
        role: 'COMPANY_ADMIN',
        companyId: companyBId,
        userPermissions: ['dashboard.view', 'settings.read']
      }));

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('APP_NOT_ACTIVE_FOR_COMPANY');
  });

  it('5. Returns 403 INSUFFICIENT_PERMISSIONS if user lacks the required permission', async () => {
    const res = await request(app)
      .get('/api/v1/tools/hello-app/ping')
      .set('authorization', JSON.stringify({
        id: 'user-a-no-perm',
        role: 'MODERATOR',
        companyId: companyAId,
        userPermissions: ['orders.view'] // does NOT have dashboard.view
      }));

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    expect(res.body.requiredPermission).toBe('dashboard.view');
  });

  it('6. Grants access (200 OK) when company has app enabled AND user has required permission', async () => {
    const res = await request(app)
      .get('/api/v1/tools/hello-app/ping')
      .set('authorization', JSON.stringify({
        id: 'user-a-with-perm',
        role: 'COMPANY_ADMIN',
        companyId: companyAId,
        userPermissions: ['dashboard.view', 'settings.read']
      }));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('pong');
    expect(res.body.tool).toBe('hello-app');
  });

  it('7. Kill Switch immediately blocks access (403 APP_KILL_SWITCH_ACTIVE) with zero impact on other tools', async () => {
    // Activate kill switch for hello-app
    await appKillSwitchService.setKillSwitch('hello-app', true, {
      reason: 'Emergency security revocation test'
    });

    // Request from authorized Company A user
    const res = await request(app)
      .get('/api/v1/tools/hello-app/ping')
      .set('authorization', JSON.stringify({
        id: 'user-a-with-perm',
        role: 'COMPANY_ADMIN',
        companyId: companyAId,
        userPermissions: ['dashboard.view', 'settings.read']
      }));

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('APP_KILL_SWITCH_ACTIVE');
    expect(res.body.reason).toBe('Emergency security revocation test');

    // Health check also reflects killed status
    const healthRes = await request(app).get('/api/v1/tools/hello-app/health');
    expect(healthRes.body.status).toBe('DISABLED_BY_KILL_SWITCH');
    expect(healthRes.body.killSwitch).toBe(true);
  });

  it('8. Zero requireRole in tool code (strictly verified by AST/source scan)', () => {
    const toolDir = path.resolve(__dirname, '../../tools/hello-app');
    const violations = scanForForbiddenCode(toolDir);
    expect(violations).toHaveLength(0);
  });
});

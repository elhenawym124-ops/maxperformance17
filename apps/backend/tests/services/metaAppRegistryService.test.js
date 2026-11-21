const metaAppRegistry = require('../../services/metaAppRegistryService');
const sharedDatabase = require('../../services/sharedDatabase');

describe('metaAppRegistryService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('resolveSecretFromRef and resolveVerifyTokenFromRef read env vars safely', () => {
    process.env.TEST_SECRET_REF = 'secret_val_123';
    process.env.TEST_TOKEN_REF = 'token_val_456';

    expect(metaAppRegistry.resolveSecretFromRef('TEST_SECRET_REF')).toBe('secret_val_123');
    expect(metaAppRegistry.resolveSecretFromRef('NON_EXISTENT_REF')).toBe('');
    expect(metaAppRegistry.resolveSecretFromRef(null)).toBe('');

    expect(metaAppRegistry.resolveVerifyTokenFromRef('TEST_TOKEN_REF')).toBe('token_val_456');
    expect(metaAppRegistry.resolveVerifyTokenFromRef(undefined)).toBe('');
  });

  test('getAllApps returns primary and growth apps with references and resolved credentials', async () => {
    process.env.FACEBOOK_GROWTH_APP_ID = 'growth_app_999';
    process.env.FACEBOOK_GROWTH_APP_SECRET = 'growth_secret_888';
    process.env.FACEBOOK_GROWTH_WEBHOOK_VERIFY_TOKEN = 'growth_token_777';

    // Mock prisma to return empty list so it falls back to default env definitions
    const mockPrisma = {
      facebookApp: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    jest.spyOn(sharedDatabase, 'getSharedPrismaClient').mockReturnValue(mockPrisma);

    const apps = await metaAppRegistry.getAllApps();
    expect(apps).toHaveLength(2);

    const primary = apps.find((a) => a.key === 'primary');
    const growth = apps.find((a) => a.key === 'growth');

    expect(primary).toBeDefined();
    expect(primary.appSecretRef).toBe('FACEBOOK_APP_SECRET');

    expect(growth).toBeDefined();
    expect(growth.appId).toBe('growth_app_999');
    expect(growth.appSecret).toBe('growth_secret_888');
    expect(growth.webhookVerifyToken).toBe('growth_token_777');
  });

  test('getAppByKey falls back to primary when growth is inactive', async () => {
    process.env.META_GROWTH_ACTIVE = 'false';

    const mockPrisma = {
      facebookApp: {
        findMany: jest.fn().mockResolvedValue([
          {
            key: 'primary',
            appId: 'primary_123',
            appSecretRef: 'FACEBOOK_APP_SECRET',
            isActive: true,
          },
          {
            key: 'growth',
            appId: 'growth_456',
            appSecretRef: 'FACEBOOK_GROWTH_APP_SECRET',
            isActive: false, // Disabled
          },
        ]),
      },
    };
    jest.spyOn(sharedDatabase, 'getSharedPrismaClient').mockReturnValue(mockPrisma);

    const app = await metaAppRegistry.getAppByKey('growth');
    expect(app.key).toBe('primary');
  });

  test('getSafeAppsList hides raw secrets and reports configuration flags', async () => {
    process.env.FACEBOOK_GROWTH_APP_SECRET = 'real_secret_token';

    const mockPrisma = {
      facebookApp: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'app-primary',
            key: 'primary',
            appId: '762328696481583',
            appSecretRef: 'FACEBOOK_APP_SECRET',
            webhookVerifyTokenRef: 'FACEBOOK_WEBHOOK_VERIFY_TOKEN',
            isActive: true,
          },
          {
            id: 'app-growth',
            key: 'growth',
            appId: 'growth_123',
            appSecretRef: 'FACEBOOK_GROWTH_APP_SECRET',
            webhookVerifyTokenRef: 'FACEBOOK_GROWTH_WEBHOOK_VERIFY_TOKEN',
            isActive: true,
          },
        ]),
      },
    };
    jest.spyOn(sharedDatabase, 'getSharedPrismaClient').mockReturnValue(mockPrisma);

    const safeList = await metaAppRegistry.getSafeAppsList();
    expect(safeList).toHaveLength(2);

    for (const item of safeList) {
      // Must not expose appSecret
      expect(item.appSecret).toBeUndefined();
      expect(item.appSecretRef).toBeDefined();
      expect(typeof item.hasSecretConfigured).toBe('boolean');
    }

    const growthItem = safeList.find((s) => s.key === 'growth');
    expect(growthItem.hasSecretConfigured).toBe(true);
  });

  test('upsertApp and toggleAppStatus interact with Prisma correctly for complete app', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ key: 'growth', appId: 'new_app_id' });
    const mockUpdate = jest.fn().mockResolvedValue({ key: 'growth', isActive: false });

    const mockPrisma = {
      facebookApp: {
        findUnique: jest.fn().mockResolvedValue({
          key: 'growth',
          appId: 'new_app_id',
          appSecretRef: 'FACEBOOK_GROWTH_APP_SECRET',
          configId: '2158986791329815',
          webhookVerifyTokenRef: 'FACEBOOK_GROWTH_WEBHOOK_VERIFY_TOKEN',
          isActive: false
        }),
        upsert: mockUpsert,
        update: mockUpdate,
      },
    };
    jest.spyOn(sharedDatabase, 'getSharedPrismaClient').mockReturnValue(mockPrisma);

    const upserted = await metaAppRegistry.upsertApp({
      key: 'growth',
      appId: 'new_app_id',
      appSecretRef: 'FACEBOOK_GROWTH_APP_SECRET',
      configId: '2158986791329815',
      webhookVerifyTokenRef: 'FACEBOOK_GROWTH_WEBHOOK_VERIFY_TOKEN',
      isActive: true,
    });
    expect(upserted.key).toBe('growth');
    expect(mockUpsert).toHaveBeenCalled();

    const toggled = await metaAppRegistry.toggleAppStatus('growth', false);
    expect(toggled.isActive).toBe(false);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { key: 'growth' },
      data: { isActive: false },
    });
  });

  test('Case 1 (صف ناقص configId): validateAppConfig flags missing fields and blocks activation', async () => {
    const incompleteApp = {
      key: 'growth',
      appId: 'growth_123',
      appSecretRef: 'FB_GROWTH_APP_SECRET',
      configId: '', // EMPTY configId
      webhookVerifyTokenRef: 'FB_GROWTH_VERIFY_TOKEN'
    };

    const validation = metaAppRegistry.validateAppConfig(incompleteApp);
    expect(validation.isValid).toBe(false);
    expect(validation.missingFields).toContain('configId');

    // upsertApp with isActive=true must throw INCOMPLETE_CONFIG
    await expect(
      metaAppRegistry.upsertApp({
        ...incompleteApp,
        isActive: true
      })
    ).rejects.toMatchObject({
      code: 'INCOMPLETE_CONFIG',
      missingFields: expect.arrayContaining(['configId'])
    });

    // toggleAppStatus to true must be rejected
    const mockPrisma = {
      facebookApp: {
        findUnique: jest.fn().mockResolvedValue(incompleteApp),
        update: jest.fn()
      }
    };
    jest.spyOn(sharedDatabase, 'getSharedPrismaClient').mockReturnValue(mockPrisma);

    await expect(
      metaAppRegistry.toggleAppStatus('growth', true)
    ).rejects.toMatchObject({
      code: 'INCOMPLETE_CONFIG',
      missingFields: expect.arrayContaining(['configId'])
    });
  });

  test('Case 1 (صف ناقص configId): testAppConnection returns INCOMPLETE_CONFIG and zero fake Granted', async () => {
    const incompleteApp = {
      key: 'growth',
      appId: 'growth_123',
      appSecretRef: 'FB_GROWTH_APP_SECRET',
      configId: null, // null configId
      webhookVerifyTokenRef: 'FB_GROWTH_VERIFY_TOKEN',
      isActive: false
    };

    const mockPrisma = {
      facebookApp: {
        findMany: jest.fn().mockResolvedValue([incompleteApp])
      }
    };
    jest.spyOn(sharedDatabase, 'getSharedPrismaClient').mockReturnValue(mockPrisma);

    const result = await metaAppRegistry.testAppConnection('growth');
    expect(result.connected).toBe(false);
    expect(result.status).toBe('INCOMPLETE_CONFIG');
    expect(result.code).toBe('INCOMPLETE_CONFIG');
    expect(result.missingFields).toContain('configId');
    expect(result.message).toContain('غير مكتملة');

    // Crucial: ALL permissions must be ungranted (not_requested / none), NOT fake Granted/approved
    expect(result.permissions.length).toBe(22);
    for (const p of result.permissions) {
      expect(p.status).toBe('not_requested');
      expect(p.accessLevel).toBe('none');
    }
  });

  test('Case 2 (صف كامل): validateAppConfig passes and allows activation and real connection test', async () => {
    const completeApp = {
      key: 'growth',
      appId: 'growth_999999999',
      appSecretRef: 'FB_GROWTH_APP_SECRET',
      configId: '381257910000000',
      webhookVerifyTokenRef: 'FB_GROWTH_VERIFY_TOKEN',
      isActive: false
    };

    const validation = metaAppRegistry.validateAppConfig(completeApp);
    expect(validation.isValid).toBe(true);
    expect(validation.missingFields).toHaveLength(0);

    const mockUpdate = jest.fn().mockResolvedValue({ ...completeApp, isActive: true });
    const mockPrisma = {
      facebookApp: {
        findUnique: jest.fn().mockResolvedValue(completeApp),
        update: mockUpdate,
        findMany: jest.fn().mockResolvedValue([completeApp])
      }
    };
    jest.spyOn(sharedDatabase, 'getSharedPrismaClient').mockReturnValue(mockPrisma);

    // toggleAppStatus to true succeeds
    const activated = await metaAppRegistry.toggleAppStatus('growth', true);
    expect(activated.isActive).toBe(true);

    // testAppConnection does NOT return INCOMPLETE_CONFIG
    process.env.FB_GROWTH_APP_SECRET = 'valid_secret_hash_value_mock_32';
    const testRes = await metaAppRegistry.testAppConnection('growth');
    expect(testRes.status).not.toBe('INCOMPLETE_CONFIG');
    expect(testRes.missingFields).toBeUndefined();
  });

  test('getKnownScopesCatalog returns all 22 permissions with name, category, and bilingual descriptions', () => {
    const catalog = metaAppRegistry.getKnownScopesCatalog();
    expect(catalog).toHaveLength(22);

    const required22Scopes = [
      'public_profile', 'email', 'pages_show_list', 'pages_messaging', 'pages_manage_metadata',
      'pages_read_engagement', 'pages_manage_engagement', 'pages_read_user_content', 'pages_manage_posts',
      'ads_read', 'ads_management', 'pages_manage_ads', 'business_management', 'read_insights',
      'leads_retrieval', 'catalog_management', 'instagram_basic', 'instagram_manage_messages',
      'instagram_manage_comments', 'instagram_content_publish', 'whatsapp_business_messaging', 'whatsapp_business_management'
    ];

    for (const scope of required22Scopes) {
      const item = catalog.find((c) => c.permission === scope);
      expect(item).toBeDefined();
      expect(item.name).toBe(scope);
      expect(item.category).toBeTruthy();
      expect(item.descriptionAr).toBeTruthy();
      expect(item.descriptionEn).toBeTruthy();
    }
  });

  test('featureRequiresGrowth gates features with Arabic message and REAUTH_REQUIRED', () => {
    const gated = metaAppRegistry.featureRequiresGrowth('growth_ad_management', 'primary');
    expect(gated.allowed).toBe(false);
    expect(gated.code).toBe('REAUTH_REQUIRED');
    expect(gated.message).toBe('اربط الصفحة تاني لتفعيل الميزة');

    const allowedOnGrowth = metaAppRegistry.featureRequiresGrowth('growth_ad_management', 'growth');
    expect(allowedOnGrowth.allowed).toBe(true);

    const normalFeature = metaAppRegistry.featureRequiresGrowth('standard_messaging', 'primary');
    expect(normalFeature.allowed).toBe(true);
  });
});

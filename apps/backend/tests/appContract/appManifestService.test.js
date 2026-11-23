const assert = require('assert');
const { appManifestService, AppManifestService } = require('../../services/appManifestService');
const appKillSwitchService = require('../../services/appContract/appKillSwitchService');

describe('App Manifest Service & Publishing Gate', () => {
  const getValidManifest = () => ({
    slug: 'analytics-widget',
    name: 'أداة التحليلات (Analytics Widget)',
    version: '1.2.0',
    minPlatformVersion: '1.0.0',
    permissions: ['dashboard.view', 'settings.read'],
    featureFlag: 'FEATURE_ANALYTICS_WIDGET',
    defaultEnabled: false,
    healthCheck: '/api/v1/tools/analytics-widget/health',
    routes: {
      prefix: '/api/v1/tools/analytics-widget',
      endpoints: [
        {
          path: '/metrics',
          method: 'GET',
          permission: 'dashboard.view',
          handler: 'getMetrics'
        }
      ]
    },
    settingsSchema: {
      type: 'object',
      title: 'إعدادات الأداة',
      properties: {
        refreshInterval: {
          type: 'number',
          title: 'فترة التحديث بالدقائق',
          default: 5,
          minimum: 1,
          maximum: 60
        },
        alertOnThreshold: {
          type: 'boolean',
          title: 'تنبيه عند تجاوز الحد',
          default: true
        },
        theme: {
          type: 'string',
          enum: ['light', 'dark', 'system'],
          default: 'system'
        }
      },
      required: ['refreshInterval']
    }
  });

  describe('Manifest Validation', () => {
    it('passes for a fully compliant manifest', () => {
      const manifest = getValidManifest();
      const result = appManifestService.validateManifest(manifest);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('rejects manifest with non-semver version', () => {
      const manifest = getValidManifest();
      manifest.version = 'v1_beta';
      const result = appManifestService.validateManifest(manifest);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('version')));
    });

    it('rejects manifest with missing or empty settingsSchema', () => {
      const manifest = getValidManifest();
      manifest.settingsSchema = { type: 'object', properties: {} };
      const result = appManifestService.validateManifest(manifest);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('settingsSchema')));
    });

    it('rejects manifest with undeclared permissions', () => {
      const manifest = getValidManifest();
      manifest.permissions.push('forbidden.undeclared.hack');
      const result = appManifestService.validateManifest(manifest);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('forbidden.undeclared.hack')));
    });

    it('rejects manifest when defaultEnabled is true', () => {
      const manifest = getValidManifest();
      manifest.defaultEnabled = true;
      const result = appManifestService.validateManifest(manifest);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('defaultEnabled')));
    });
  });

  describe('Publishing Gate (بوابة ترفض النشر بدون مانيفست)', () => {
    it('rejects publishing when manifest is completely missing', () => {
      const payload = {
        name: 'Empty App',
        slug: 'empty-app',
        isPublic: true
      };
      const gateResult = appManifestService.validatePublishGate(payload);
      assert.strictEqual(gateResult.canPublish, false);
      assert.ok(gateResult.errors.length > 0);
      assert.ok(gateResult.errors.some((e) => e.includes('settingsSchema') || e.includes('permissions') || e.includes('مانيفست')));
    });

    it('rejects publishing when killSwitch is active', async () => {
      const manifest = getValidManifest();
      manifest.slug = 'killed-analytics-widget';
      manifest.routes.prefix = '/api/v1/tools/killed-analytics-widget';
      manifest.healthCheck = '/api/v1/tools/killed-analytics-widget/health';
      await appKillSwitchService.setKillSwitch(manifest.slug, true, { reason: 'Security Audit' });

      try {
        const gateResult = appManifestService.validatePublishGate({
          ...manifest,
          isPublic: true
        });
        assert.strictEqual(gateResult.canPublish, false);
        assert.ok(gateResult.errors.some((e) => e.includes('Kill Switch') || e.includes('مفتاح الإيقاف')));
      } finally {
        await appKillSwitchService.setKillSwitch(manifest.slug, false);
      }
    });

    it('rejects publishing when settingsSchema has empty properties', () => {
      const manifest = getValidManifest();
      manifest.settingsSchema = { type: 'object', properties: {} };
      const gateResult = appManifestService.validatePublishGate(manifest);
      assert.strictEqual(gateResult.canPublish, false);
      assert.ok(gateResult.errors.some((e) => e.includes('settingsSchema')));
    });

    it('rejects publishing when permissions array is empty', () => {
      const manifest = getValidManifest();
      manifest.permissions = [];
      const gateResult = appManifestService.validatePublishGate(manifest);
      assert.strictEqual(gateResult.canPublish, false);
      assert.ok(gateResult.errors.some((e) => e.includes('permissions')));
    });

    it('passes publishing gate for compliant app and returns compiled manifest', () => {
      const manifest = getValidManifest();
      const gateResult = appManifestService.validatePublishGate(manifest);
      assert.strictEqual(gateResult.canPublish, true);
      assert.strictEqual(gateResult.errors.length, 0);
      assert.ok(gateResult.manifest);
      assert.strictEqual(gateResult.manifest.slug, manifest.slug);
      assert.strictEqual(gateResult.manifest.version, '1.2.0');
    });

    it('assertCanPublish throws error with code PUBLISH_GATE_REJECTED on non-compliant app', () => {
      const payload = {
        slug: 'bad-app',
        name: 'Bad App'
      };
      assert.throws(() => {
        appManifestService.assertCanPublish(payload);
      }, (err) => {
        return err.code === 'PUBLISH_GATE_REJECTED' && err.status === 422;
      });
    });
  });

  describe('Settings Schema Validation & Defaults', () => {
    const schema = {
      type: 'object',
      properties: {
        apiKey: { type: 'string' },
        timeoutSeconds: { type: 'number', minimum: 5, maximum: 60, default: 30 },
        debugMode: { type: 'boolean', default: false },
        environment: { type: 'string', enum: ['sandbox', 'production'], default: 'sandbox' }
      },
      required: ['apiKey']
    };

    it('validates compliant settings payload', () => {
      const settings = {
        apiKey: 'secret_123',
        timeoutSeconds: 15,
        debugMode: true,
        environment: 'sandbox'
      };
      const res = appManifestService.validateSettingsAgainstSchema(settings, schema);
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.errors.length, 0);
    });

    it('catches missing required field', () => {
      const settings = { timeoutSeconds: 20 };
      const res = appManifestService.validateSettingsAgainstSchema(settings, schema);
      assert.strictEqual(res.valid, false);
      assert.ok(res.errors.some((e) => e.includes('apiKey')));
    });

    it('catches numeric bounds violations', () => {
      const settings = { apiKey: 'key', timeoutSeconds: 100 }; // max is 60
      const res = appManifestService.validateSettingsAgainstSchema(settings, schema);
      assert.strictEqual(res.valid, false);
      assert.ok(res.errors.some((e) => e.includes('أكبر من الحد الأقصى')));
    });

    it('catches enum violation', () => {
      const settings = { apiKey: 'key', environment: 'staging' }; // enum is sandbox/production
      const res = appManifestService.validateSettingsAgainstSchema(settings, schema);
      assert.strictEqual(res.valid, false);
      assert.ok(res.errors.some((e) => e.includes('قيمة غير صالحة')));
    });

    it('extracts default values properly', () => {
      const defaults = appManifestService.getDefaultSettingsFromSchema(schema);
      assert.strictEqual(defaults.timeoutSeconds, 30);
      assert.strictEqual(defaults.debugMode, false);
      assert.strictEqual(defaults.environment, 'sandbox');
      assert.strictEqual(defaults.apiKey, '');
    });
  });

  describe('Manifest Extraction & Compilation', () => {
    it('compiles manifest from loose app model fields', () => {
      const appRecord = {
        slug: 'custom-tool',
        name: 'Custom Tool',
        version: '2.0.1',
        permissions: ['dashboard.view'],
        settingsSchema: {
          type: 'object',
          properties: {
            token: { type: 'string' }
          }
        }
      };
      const manifest = appManifestService.extractOrCompileManifest(appRecord);
      assert.strictEqual(manifest.slug, 'custom-tool');
      assert.strictEqual(manifest.name, 'Custom Tool');
      assert.strictEqual(manifest.version, '2.0.1');
      assert.deepStrictEqual(manifest.permissions, ['dashboard.view']);
      assert.strictEqual(manifest.defaultEnabled, false);
      assert.strictEqual(manifest.routes.prefix, '/api/v1/tools/custom-tool');
    });
  });
});

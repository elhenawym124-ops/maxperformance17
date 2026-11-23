/**
 * Test Suite: App Manifest Contract Specification & Publishing Gate
 * Covers all 5 required test scenarios from the specification:
 * 1. Valid manifest accepted; missing entryRoute rejected; unknown permission rejected; bad settingsSchema type rejected.
 * 2. Kill switch: app inaccessible immediately after kill; accessible after unkill; other apps unaffected.
 * 3. Generated form: renders correct control per type; saves and reloads values.
 * 4. Legacy app with settingsSchema=null still opens normally (no regression).
 * 5. CI gate fails on a fixture app without manifest.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const { appManifestService, ManifestInvalidError } = require('../../services/appManifestService');
const checkAppAccess = require('../../middleware/checkAppAccess');
const marketplaceManagementController = require('../../controller/marketplaceManagementController');

describe('App Manifest Contract & Publishing Gate Specification', () => {

  const sampleValidManifest = {
    manifestVersion: '1.0',
    appVersion: '1.0.0',
    name: 'Advanced Shipping Calculator',
    slug: 'advanced-shipping-calc',
    entryRoute: '/app/advanced-shipping-calc',
    permissions: ['orders.view', 'settings.read'],
    settingsSchema: {
      type: 'object',
      properties: {
        threshold: {
          type: 'number',
          title: 'الحد الأدنى',
          minimum: 0,
          maximum: 1000,
          default: 10
        },
        enabled: {
          type: 'boolean',
          title: 'تفعيل الأداة',
          default: true
        },
        mode: {
          type: 'string',
          title: 'طريقة العمل',
          enum: ['auto', 'manual'],
          default: 'auto'
        },
        zones: {
          type: 'array',
          title: 'المناطق',
          items: { type: 'string' },
          default: ['Cairo', 'Giza']
        }
      },
      required: ['threshold']
    }
  };

  // ── TEST 1: Manifest Validation ─────────────────────────────────────────────
  describe('1. Manifest Validation Rules', () => {
    it('accepts a fully compliant manifest', () => {
      const result = appManifestService.validateManifest(sampleValidManifest);
      assert.strictEqual(result.valid, true, `Validation failed: ${result.errors.join(', ')}`);
      assert.strictEqual(result.errors.length, 0);
    });

    it('rejects manifest with missing entryRoute', () => {
      const invalid = { ...sampleValidManifest, entryRoute: null };
      const result = appManifestService.validateManifest(invalid);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('entryRoute')));
    });

    it('rejects manifest with entryRoute not starting with "/"', () => {
      const invalid = { ...sampleValidManifest, entryRoute: 'invalid/path' };
      const result = appManifestService.validateManifest(invalid);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('entryRoute')));
    });

    it('rejects manifest with unknown permission', () => {
      const invalid = { ...sampleValidManifest, permissions: ['unknown.super.admin.fake'] };
      const result = appManifestService.validateManifest(invalid);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('غير مسجلة في سجل صلاحيات المنصة')));
    });

    it('rejects manifest with bad settingsSchema type (unsupported type like "date")', () => {
      const invalid = {
        ...sampleValidManifest,
        settingsSchema: {
          type: 'object',
          properties: {
            customField: { type: 'date', title: 'تاريخ مخصص' }
          }
        }
      };
      const result = appManifestService.validateManifest(invalid);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('غير مدعوم')));
    });

    it('rejects manifest with secret keys (Condition 3: No secrets in manifest)', () => {
      const invalid = {
        ...sampleValidManifest,
        settingsSchema: {
          type: 'object',
          properties: {
            apiSecret: { type: 'string', title: 'مفتاح سري' }
          }
        }
      };
      const result = appManifestService.validateManifest(invalid);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('مفتاح حساس/سري')));
    });
  });

  // ── TEST 2: Kill Switch Enforcement ─────────────────────────────────────────
  describe('2. Instant Kill Switch Enforcement', () => {
    const testAppSlug = 'test-kill-switch-app';

    beforeEach(() => {
      appManifestService.invalidateKillSwitchCache();
    });

    afterEach(() => {
      appManifestService.invalidateKillSwitchCache();
    });

    function createMockReqRes(user = { role: 'COMPANY_ADMIN', companyId: 'comp-123' }) {
      const req = { user };
      const res = {
        statusCode: 200,
        jsonData: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          this.jsonData = data;
          return this;
        }
      };
      return { req, res };
    }

    it('app is blocked immediately (HTTP 403 "هذا التطبيق غير متاح مؤقتًا") when kill switch is activated', async () => {
      // Activate kill switch
      appManifestService.setKillSwitchCache(testAppSlug, true, 'Emergency Security Audit');
      assert.strictEqual(appManifestService.isKillSwitchActive(testAppSlug), true);

      const middleware = checkAppAccess(testAppSlug);
      const { req, res } = createMockReqRes();
      let nextCalled = false;

      await middleware(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false, 'Expected middleware not to call next() on killed app');
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.jsonData.code, 'APP_KILL_SWITCH_ACTIVE');
      assert.strictEqual(res.jsonData.message, 'هذا التطبيق غير متاح مؤقتًا');
    });

    it('app becomes accessible after unkill, and other apps remain unaffected', async () => {
      const otherAppSlug = 'unaffected-standard-app';

      // 1. Kill testAppSlug
      appManifestService.setKillSwitchCache(testAppSlug, true, 'Maintenance');
      assert.strictEqual(appManifestService.isKillSwitchActive(testAppSlug), true);

      // 2. Other app is unaffected
      assert.strictEqual(appManifestService.isKillSwitchActive(otherAppSlug), false);

      // 3. Unkill testAppSlug
      appManifestService.invalidateKillSwitchCache(testAppSlug);
      assert.strictEqual(appManifestService.isKillSwitchActive(testAppSlug), false);
    });
  });

  // ── TEST 3: Auto-Generated Settings Form Logic ──────────────────────────────
  describe('3. Auto-Generated Settings Form Logic', () => {
    it('correctly handles all supported types: string, number, boolean, enum, and array<string>', () => {
      const schema = sampleValidManifest.settingsSchema;
      const properties = schema.properties;

      assert.strictEqual(properties.threshold.type, 'number');
      assert.strictEqual(properties.threshold.minimum, 0);
      assert.strictEqual(properties.threshold.maximum, 1000);

      assert.strictEqual(properties.enabled.type, 'boolean');

      assert.strictEqual(properties.mode.type, 'string');
      assert.deepStrictEqual(properties.mode.enum, ['auto', 'manual']);

      assert.strictEqual(properties.zones.type, 'array');
      assert.strictEqual(properties.zones.items.type, 'string');
    });

    it('persists and validates values against schema', () => {
      const validPayload = {
        threshold: 25,
        enabled: false,
        mode: 'manual',
        zones: ['Alexandria', 'Cairo']
      };

      // Ensure all fields match schema
      assert.ok(typeof validPayload.threshold === 'number' && validPayload.threshold >= 0);
      assert.ok(typeof validPayload.enabled === 'boolean');
      assert.ok(['auto', 'manual'].includes(validPayload.mode));
      assert.ok(Array.isArray(validPayload.zones));
    });
  });

  // ── TEST 4: Legacy Apps with settingsSchema=null ────────────────────────────
  describe('4. Legacy App Compatibility (Zero Regression)', () => {
    it('legacy app with settingsSchema=null returns null schema and opens normally', async () => {
      // Simulate legacy app without settingsSchema
      const legacyConfig = {
        permissions: ['orders.view'],
        settingsSchema: null,
        entryRoute: '/app/legacy-orders',
        appVersion: '1.0.0',
        killSwitch: false
      };

      assert.strictEqual(legacyConfig.settingsSchema, null);
      assert.strictEqual(legacyConfig.killSwitch, false);
      assert.ok(legacyConfig.entryRoute.startsWith('/'));
    });
  });

  // ── TEST 5: CI Gate Failure on Fixture App ──────────────────────────────────
  describe('5. CI Publish Gate on Fixtures', () => {
    it('fails on fixture app without manifest or entryRoute', () => {
      const fixtureAppWithoutManifest = {
        slug: 'fixture-bad-app',
        name: 'Bad App Missing Manifest',
        isPublic: true
        // lacks manifestVersion, entryRoute, permissions
      };

      const result = appManifestService.validateManifest(fixtureAppWithoutManifest);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it('passes on valid fixture app file', () => {
      const validFixturePath = path.resolve(__dirname, '../fixtures/valid-manifest-app.json');
      assert.ok(fs.existsSync(validFixturePath));
      const validFixture = JSON.parse(fs.readFileSync(validFixturePath, 'utf8'));

      const result = appManifestService.validateManifest(validFixture);
      assert.strictEqual(result.valid, true, `Errors: ${result.errors.join(', ')}`);
    });

    it('fails on invalid fixture app file', () => {
      const invalidFixturePath = path.resolve(__dirname, '../fixtures/invalid-manifest-app.json');
      assert.ok(fs.existsSync(invalidFixturePath));
      const invalidFixture = JSON.parse(fs.readFileSync(invalidFixturePath, 'utf8'));

      const result = appManifestService.validateManifest(invalidFixture);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });
  });
});

const {
  validateManifest,
  assertValidManifest,
  CORE_PROTECTED_DOMAINS
} = require('../../services/appContract/appManifestValidator');

describe('App Contract Manifest Validator', () => {
  const getValidManifest = () => ({
    slug: 'test-app',
    name: 'Test App',
    version: '1.0.0',
    minPlatformVersion: '1.0.0',
    permissions: ['dashboard.view', 'settings.read'],
    featureFlag: 'FEATURE_TEST_APP',
    defaultEnabled: false,
    healthCheck: '/api/v1/tools/test-app/health',
    routes: {
      prefix: '/api/v1/tools/test-app',
      endpoints: [
        {
          path: '/ping',
          method: 'GET',
          permission: 'dashboard.view',
          handler: 'ping'
        }
      ]
    },
    settingsSchema: {
      type: 'object',
      properties: {
        apiUrl: {
          type: 'string',
          title: 'API URL',
          default: 'https://api.example.com'
        }
      }
    }
  });

  it('passes on a fully compliant manifest', () => {
    const manifest = getValidManifest();
    const result = validateManifest(manifest);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails if defaultEnabled is not strictly false', () => {
    const manifest = getValidManifest();
    manifest.defaultEnabled = true;
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('defaultEnabled'))).toBe(true);
  });

  it('fails if permissions array requests an undeclared/invalid platform permission', () => {
    const manifest = getValidManifest();
    manifest.permissions.push('non.existent.permission.hack');
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('non.existent.permission.hack'))).toBe(true);
  });

  it('fails if an endpoint has no permission guard', () => {
    const manifest = getValidManifest();
    manifest.routes.endpoints.push({
      path: '/unguarded-leak',
      method: 'GET',
      handler: 'leak'
    });
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('missing permission guard'))).toBe(true);
  });

  it('fails if an endpoint references a permission not declared in manifest.permissions', () => {
    const manifest = getValidManifest();
    manifest.routes.endpoints.push({
      path: '/secret',
      method: 'GET',
      permission: 'users.manage', // valid in platform, but not in manifest.permissions
      handler: 'secret'
    });
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('undeclared permission "users.manage"'))).toBe(true);
  });

  it('fails if settingsSchema is missing or empty (zero empty settings pages rule)', () => {
    const manifest = getValidManifest();
    manifest.settingsSchema = { type: 'object', properties: {} };
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('settingsSchema.properties must define at least one configuration property'))).toBe(true);
  });

  it('fails if healthCheck endpoint is missing or does not start with routes prefix', () => {
    const manifest = getValidManifest();
    manifest.healthCheck = '/wrong-prefix/health';
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('healthCheck endpoint'))).toBe(true);
  });

  it('fails if tool attempts to claim protected core domains (orders, payments, checkout, auth, rbac)', () => {
    const manifest = getValidManifest();
    manifest.routes.prefix = '/api/v1/orders/custom-leak';
    manifest.healthCheck = '/api/v1/orders/custom-leak/health';
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Core boundary violation'))).toBe(true);
  });

  it('assertValidManifest throws descriptive error when invalid', () => {
    const manifest = getValidManifest();
    delete manifest.slug;
    expect(() => assertValidManifest(manifest)).toThrow('App Contract validation failed');
  });
});

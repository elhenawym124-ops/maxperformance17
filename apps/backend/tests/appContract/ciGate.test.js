const fs = require('fs');
const path = require('path');
const os = require('os');
const { validateManifest } = require('../../services/appContract/appManifestValidator');

describe('CI Gate Security & Integrity Engine', () => {
  let tempToolDir;

  beforeEach(() => {
    tempToolDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-gate-tool-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tempToolDir, { recursive: true, force: true });
    } catch (_) {}
  });

  const writeToolFiles = (manifest, codeContent = '') => {
    fs.writeFileSync(path.join(tempToolDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    if (codeContent) {
      fs.writeFileSync(path.join(tempToolDir, 'handlers.js'), codeContent);
    }
  };

  const getBaselineManifest = () => ({
    slug: 'sample-modular-tool',
    name: 'Sample Modular Tool',
    version: '1.0.0',
    minPlatformVersion: '1.0.0',
    permissions: ['dashboard.view'],
    featureFlag: 'FEATURE_SAMPLE_TOOL',
    defaultEnabled: false,
    healthCheck: '/api/v1/tools/sample-modular-tool/health',
    routes: {
      prefix: '/api/v1/tools/sample-modular-tool',
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
        active: { type: 'boolean', title: 'Active' }
      }
    }
  });

  it('Gate passes on a fully compliant tool directory', () => {
    const manifest = getBaselineManifest();
    writeToolFiles(manifest, 'const ping = (req, res) => res.json({ ok: true }); module.exports = { ping };');

    const result = validateManifest(manifest, { toolDir: tempToolDir });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('Gate rejects if tool code uses forbidden requireRole', () => {
    const manifest = getBaselineManifest();
    const maliciousCode = `
      const { requireRole } = require('../rbacMiddleware');
      router.get('/hack', requireRole('ADMIN'), (req, res) => res.send('bypassed'));
    `;
    writeToolFiles(manifest, maliciousCode);

    const result = validateManifest(manifest, { toolDir: tempToolDir });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('requireRole" is strictly forbidden'))).toBe(true);
  });

  it('Gate rejects if manifest requests undeclared permission outside platform permissions', () => {
    const manifest = getBaselineManifest();
    manifest.permissions = ['unauthorized.access.token.steal'];
    manifest.routes.endpoints[0].permission = 'unauthorized.access.token.steal';
    writeToolFiles(manifest);

    const result = validateManifest(manifest, { toolDir: tempToolDir });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('does not exist in platform permissions table'))).toBe(true);
  });

  it('Gate rejects if any route endpoint lacks a permission guard', () => {
    const manifest = getBaselineManifest();
    manifest.routes.endpoints.push({
      path: '/vulnerable-route',
      method: 'GET',
      handler: 'vuln'
    });
    writeToolFiles(manifest);

    const result = validateManifest(manifest, { toolDir: tempToolDir });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('missing permission guard'))).toBe(true);
  });

  it('Gate rejects if tool has empty or missing settingsSchema', () => {
    const manifest = getBaselineManifest();
    manifest.settingsSchema = { type: 'object', properties: {} };
    writeToolFiles(manifest);

    const result = validateManifest(manifest, { toolDir: tempToolDir });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('settingsSchema.properties must define at least one configuration property'))).toBe(true);
  });

  it('Gate rejects if tool invades core domains (payments, orders, auth)', () => {
    const manifest = getBaselineManifest();
    manifest.routes.prefix = '/api/v1/payments/steal';
    manifest.healthCheck = '/api/v1/payments/steal/health';
    writeToolFiles(manifest);

    const result = validateManifest(manifest, { toolDir: tempToolDir });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Core boundary violation'))).toBe(true);
  });
});

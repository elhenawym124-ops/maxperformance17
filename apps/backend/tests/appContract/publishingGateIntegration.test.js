const assert = require('assert');
const marketplaceManagementController = require('../../controller/marketplaceManagementController');

describe('Publishing Gate Controller Integration', () => {
  function createMockRes() {
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
    return res;
  }

  it('createApp rejects isPublic: true when app has no manifest/settingsSchema/permissions', async () => {
    const req = {
      body: {
        name: 'Incomplete Public Tool',
        slug: 'incomplete-public-tool',
        description: 'Test tool with no manifest',
        isPublic: true,
        monthlyPrice: 10
      }
    };
    const res = createMockRes();

    await marketplaceManagementController.createApp(req, res);

    assert.strictEqual(res.statusCode, 422);
    assert.strictEqual(res.jsonData.success, false);
    assert.strictEqual(res.jsonData.code, 'PUBLISH_GATE_REJECTED');
    assert.ok(res.jsonData.errors.length > 0);
  });

  it('updateApp rejects isPublic: true when app has empty settingsSchema', async () => {
    const req = {
      params: { id: 'test-app-id' },
      body: {
        name: 'Empty Schema Tool',
        slug: 'empty-schema-tool',
        isPublic: true,
        settingsSchema: { type: 'object', properties: {} }
      }
    };
    const res = createMockRes();

    await marketplaceManagementController.updateApp(req, res);

    assert.strictEqual(res.statusCode, 422);
    assert.strictEqual(res.jsonData.code, 'PUBLISH_GATE_REJECTED');
  });

  it('validateAppManifest endpoint detects invalid manifests accurately', async () => {
    const req = {
      body: {
        slug: 'invalid-manifest-tool',
        name: 'Invalid Tool',
        version: 'bad_version',
        defaultEnabled: true,
        permissions: []
      }
    };
    const res = createMockRes();

    await marketplaceManagementController.validateAppManifest(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.data.valid, false);
    assert.strictEqual(res.jsonData.data.canPublish, false);
    assert.ok(res.jsonData.data.errors.length > 0);
  });

  it('validateAppManifest endpoint passes valid manifest and greenlights publishing', async () => {
    const req = {
      body: {
        slug: 'valid-manifest-tool',
        name: 'Valid Tool',
        version: '1.0.0',
        minPlatformVersion: '1.0.0',
        defaultEnabled: false,
        featureFlag: 'FEATURE_VALID_TOOL',
        permissions: ['dashboard.view'],
        routes: {
          prefix: '/api/v1/tools/valid-manifest-tool',
          endpoints: [
            { path: '/status', method: 'GET', permission: 'dashboard.view', handler: 'status' }
          ]
        },
        healthCheck: '/api/v1/tools/valid-manifest-tool/status',
        settingsSchema: {
          type: 'object',
          properties: {
            apiKey: { type: 'string', title: 'API Key' }
          }
        }
      }
    };
    const res = createMockRes();

    await marketplaceManagementController.validateAppManifest(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.data.valid, true);
    assert.strictEqual(res.jsonData.data.canPublish, true);
    assert.strictEqual(res.jsonData.data.errors.length, 0);
  });

  it('updateApp uses id fallback for slug when checking publishing gate without slug in body', async () => {
    const req = {
      params: { id: 'cat-app-widget' },
      body: {
        name: 'No Slug Body Tool',
        isPublic: true,
        permissions: ['invalid.perm']
      }
    };
    const res = createMockRes();

    await marketplaceManagementController.updateApp(req, res);

    assert.strictEqual(res.statusCode, 422);
    assert.strictEqual(res.jsonData.code, 'PUBLISH_GATE_REJECTED');
  });
});

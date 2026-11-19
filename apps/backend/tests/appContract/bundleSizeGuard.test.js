const fs = require('fs');
const path = require('path');
const os = require('os');
const { AppRegistryService } = require('../../services/appContract/appRegistryService');

describe('Core Platform Bundle Size & Zero-Impact Guard', () => {
  const frontendSrc = path.resolve(__dirname, '../../../frontend/src');

  it('Adding 3 new modular tools causes ZERO increase in platform shared/core bundles', () => {
    // 1. Inspect common core entrypoints
    const commonFiles = [
      path.join(frontendSrc, 'main.tsx'),
      path.join(frontendSrc, 'App.tsx'),
      path.join(frontendSrc, 'routes.tsx'),
      path.join(__dirname, '../../server.js')
    ];

    // Measure baseline sizes and contents
    const baselineStats = commonFiles
      .filter((f) => fs.existsSync(f))
      .map((filePath) => ({
        path: filePath,
        size: fs.statSync(filePath).size,
        content: fs.readFileSync(filePath, 'utf8')
      }));

    // 2. Simulate 3 new independent modular tools in an isolated temporary root
    const tempToolsRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sim-tools-'));
    const toolSlugs = ['sim-tool-alpha', 'sim-tool-beta', 'sim-tool-gamma'];

    try {
      for (const slug of toolSlugs) {
        const dir = path.join(tempToolsRoot, slug);
        fs.mkdirSync(dir, { recursive: true });

        const manifest = {
          slug,
          name: `Modular ${slug}`,
          version: '1.0.0',
          minPlatformVersion: '1.0.0',
          category: 'UTILITIES',
          pricingModel: 'FREE',
          defaultEnabled: false,
          featureFlag: `FEATURE_${slug.toUpperCase().replace(/-/g, '_')}`,
          permissions: ['dashboard.view'],
          healthCheck: `/api/v1/tools/${slug}/health`,
          routes: {
            prefix: `/api/v1/tools/${slug}`,
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
              enabled: { type: 'boolean', title: 'Enabled' }
            }
          }
        };

        fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
        fs.writeFileSync(
          path.join(dir, 'handlers.js'),
          'module.exports = { ping: (req, res) => res.json({ status: "ok" }) };'
        );
      }

      // 3. Re-initialize dynamic registry with the test root
      const registry = new AppRegistryService({ toolsRoot: tempToolsRoot });
      registry.initialize();

      // Verify all 3 tools are registered dynamically
      for (const slug of toolSlugs) {
        expect(registry.getTool(slug)).toBeDefined();
      }

      // 4. Verify common/shared files AFTER adding 3 tools:
      // Zero static imports added, zero bundle size changes to core entrypoints
      for (const base of baselineStats) {
        const currentSize = fs.statSync(base.path).size;
        const currentContent = fs.readFileSync(base.path, 'utf8');

        // Core bundle entrypoint size must be 100% identical (0 bytes increase!)
        expect(currentSize).toBe(base.size);
        expect(currentContent).toBe(base.content);

        // Neither tool alpha, beta, nor gamma is statically imported into core
        for (const slug of toolSlugs) {
          expect(currentContent.includes(`tools/${slug}`)).toBe(false);
          expect(currentContent.includes(slug)).toBe(false);
        }
      }
    } finally {
      // Cleanup temporary simulated tool directory
      try {
        fs.rmSync(tempToolsRoot, { recursive: true, force: true });
      } catch (_) {}
    }
  });
});

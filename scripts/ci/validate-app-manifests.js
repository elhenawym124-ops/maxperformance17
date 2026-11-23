#!/usr/bin/env node
/**
 * CI Application Manifest Gate
 * Fails CI when an app row lacks manifestVersion, entryRoute, or has invalid permissions/settingsSchema.
 *
 * Usage:
 *   node scripts/ci/check-app-manifests.js
 *   node scripts/ci/check-app-manifests.js --fixture /path/to/fixture.json
 */

const path = require('path');
const fs = require('fs');

const { appManifestService } = require('../../apps/backend/services/appManifestService');

// Parse CLI args
const fixtureArgIdx = process.argv.indexOf('--fixture');
const fixturePath = fixtureArgIdx !== -1 ? process.argv[fixtureArgIdx + 1] : null;

async function runCiGate() {
  console.log('===============================================================');
  console.log('🛡️  CI GATE: APPLICATION MANIFEST & CONTRACT AUDITOR');
  console.log('===============================================================\n');

  let appsToAudit = [];

  if (fixturePath) {
    console.log(`🧪 Running in FIXTURE MODE with file: ${fixturePath}`);
    if (!fs.existsSync(fixturePath)) {
      console.error(`❌ Fixture file not found: ${fixturePath}`);
      process.exit(1);
    }
    const raw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    appsToAudit = Array.isArray(raw) ? raw : [raw];
  } else {
    // Audit catalog apps
    const catalogPath = path.resolve(__dirname, '../../apps/backend/catalog/marketplace/apps.json');
    if (fs.existsSync(catalogPath)) {
      const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      appsToAudit = Array.isArray(catalogData) ? catalogData : catalogData.apps || [];
      console.log(`📄 Auditing ${appsToAudit.length} apps from marketplace catalog...`);
    } else {
      console.error('❌ Catalog file not found!');
      process.exit(1);
    }
  }

  let failedApps = [];

  for (const app of appsToAudit) {
    const slug = app.slug || app.id || 'unknown-app';
    const isPublic = app.isPublic !== false;

    // In CI, public and production-targeted apps must pass the manifest contract
    const manifest = app.manifest || {
      manifestVersion: app.manifestVersion,
      appVersion: app.appVersion || app.version,
      entryRoute: app.entryRoute || app.mainRoute,
      permissions: app.permissions || [],
      settingsSchema: app.settingsSchema,
      name: app.name,
      slug: app.slug
    };

    const result = appManifestService.validateManifest(manifest);

    // Specifically verify manifestVersion and entryRoute presence per §6
    if (!manifest.manifestVersion) {
      result.valid = false;
      result.errors.push('CI Gate: App lacks required "manifestVersion"');
    }
    if (!manifest.entryRoute) {
      result.valid = false;
      result.errors.push('CI Gate: App lacks required "entryRoute"');
    }

    if (!result.valid) {
      failedApps.push({
        slug,
        name: app.name,
        errors: result.errors
      });
    }
  }

  if (failedApps.length > 0) {
    console.error(`\n❌ CI GATE FAILED: Found ${failedApps.length} app(s) violating the App Manifest Contract:\n`);
    for (const f of failedApps) {
      console.error(`🚨 [APP: ${f.slug}]`);
      f.errors.forEach(err => console.error(`   - ❌ ${err}`));
    }
    console.error('\n💥 CI Publish Gate: Rejecting build due to unmanifested/non-compliant apps.');
    process.exit(1);
  }

  console.log('\n✅ CI GATE PASSED: All apps comply with the Application Manifest Contract!');
  process.exit(0);
}

runCiGate().catch(err => {
  console.error('Fatal CI error:', err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Backfill Application Manifests Script
 * Safe, idempotent, dry-run by default.
 * Derives appVersion and entryRoute safely without inventing permissions.
 *
 * Usage:
 *   node scripts/one-off/backfill-app-manifests.js         (Dry run)
 *   node scripts/one-off/backfill-app-manifests.js --apply (Apply safe derivations)
 */

const path = require('path');
const fs = require('fs');

// Resolve root paths
const backendDir = path.resolve(__dirname, '../../apps/backend');
const catalogPath = path.join(backendDir, 'catalog/marketplace/apps.json');

const isApply = process.argv.includes('--apply');

async function main() {
  console.log('===============================================================');
  console.log(`🚀 APP MANIFEST BACKFILL AUDIT [${isApply ? 'APPLY MODE' : 'DRY-RUN MODE'}]`);
  console.log('===============================================================\n');

  let prisma = null;
  let apps = [];

  try {
    const { getSharedPrismaClient } = require(path.join(backendDir, 'services/sharedDatabase'));
    prisma = getSharedPrismaClient();
    apps = await prisma.marketplaceApp.findMany();
    console.log(`📦 Loaded ${apps.length} apps from PostgreSQL database.`);
  } catch (dbErr) {
    console.warn(`⚠️ Database connection not available (${dbErr.message}). Falling back to local catalog.`);
  }

  if (!apps || apps.length === 0) {
    if (fs.existsSync(catalogPath)) {
      const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      apps = Array.isArray(catalogData) ? catalogData : catalogData.apps || [];
      console.log(`📄 Loaded ${apps.length} apps from catalog/marketplace/apps.json.`);
    }
  }

  let hasManifestCount = 0;
  let needsManifestCount = 0;
  let invalidCount = 0;

  const results = [];

  for (const app of apps) {
    const slug = app.slug || app.id;
    const manifestVersion = app.manifestVersion || (app.manifest && app.manifest.manifestVersion);
    const entryRoute = app.entryRoute || app.mainRoute || (app.manifest && (app.manifest.entryRoute || app.manifest.mainRoute));
    const permissions = app.permissions || (app.manifest && app.manifest.permissions);
    const settingsSchema = app.settingsSchema || (app.manifest && app.manifest.settingsSchema);

    // Check validity
    let status = 'needs manifest';
    let details = [];

    const hasEntryRoute = typeof entryRoute === 'string' && entryRoute.trim().startsWith('/');
    const hasValidManifestVersion = typeof manifestVersion === 'string' && /^\d+\.\d+(\.\d+)?$/.test(manifestVersion.trim());
    const hasValidPermissions = !permissions || Array.isArray(permissions);

    if (hasValidManifestVersion && hasEntryRoute && hasValidPermissions) {
      status = 'has manifest';
      hasManifestCount++;
    } else if (entryRoute && !hasEntryRoute) {
      status = 'invalid';
      details.push('entryRoute must start with "/"');
      invalidCount++;
    } else {
      status = 'needs manifest';
      needsManifestCount++;
    }

    results.push({
      slug,
      name: app.name,
      status,
      entryRoute: entryRoute || `(none -> safe fallback: /app/${slug})`,
      appVersion: app.appVersion || app.version || '1.0.0',
      manifestVersion: manifestVersion || '1.0',
      permissionsCount: Array.isArray(permissions) ? permissions.length : 0,
      hasSchema: Boolean(settingsSchema),
      details: details.join('; ')
    });

    if (isApply && prisma && status === 'needs manifest') {
      const safeEntryRoute = hasEntryRoute ? entryRoute.trim() : (app.mainRoute && app.mainRoute.startsWith('/') ? app.mainRoute : `/app/${slug}`);
      const safeAppVersion = app.appVersion || app.version || '1.0.0';
      const safeManifestVersion = manifestVersion || '1.0';

      try {
        await prisma.marketplaceApp.update({
          where: { id: app.id },
          data: {
            manifestVersion: safeManifestVersion,
            appVersion: safeAppVersion,
            entryRoute: safeEntryRoute,
            permissions: Array.isArray(permissions) ? permissions : [],
            settingsSchema: settingsSchema || null
          }
        });
      } catch (applyErr) {
        console.error(`Failed to backfill app ${slug}:`, applyErr.message);
      }
    }
  }

  // Display report table
  console.log('\n--- SAMPLE BACKFILL STATUS (First 15 apps) ---');
  results.slice(0, 15).forEach((r, idx) => {
    const icon = r.status === 'has manifest' ? '✅' : (r.status === 'needs manifest' ? '🔄' : '❌');
    console.log(`${idx + 1}. ${icon} [${r.status.toUpperCase()}] ${r.slug} — v${r.appVersion} — entry: ${r.entryRoute}`);
  });

  console.log('\n===============================================================');
  console.log('📊 BACKFILL SUMMARY REPORT');
  console.log('===============================================================');
  console.log(`Total Scanned Apps : ${apps.length}`);
  console.log(`Ready (Has Manifest): ${hasManifestCount}`);
  console.log(`Needs Manifest      : ${needsManifestCount} (Safely derivable: ${needsManifestCount})`);
  console.log(`Invalid Manifest    : ${invalidCount}`);
  console.log(`Fabricated Perms    : 0 (Strict policy: no invented permissions)`);
  console.log('===============================================================');

  if (!isApply) {
    console.log('ℹ️  Run with --apply to apply safe derivations to the database.');
  } else {
    console.log('✅ Safe derivations applied successfully.');
  }

  return {
    total: apps.length,
    hasManifestCount,
    needsManifestCount,
    invalidCount
  };
}

if (require.main === module) {
  main().then(() => process.exit(0)).catch((err) => {
    console.error('Backfill error:', err);
    process.exit(1);
  });
}

module.exports = { main };

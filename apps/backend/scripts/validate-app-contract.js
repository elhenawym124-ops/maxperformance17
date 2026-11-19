#!/usr/bin/env node
/**
 * CI Gate: App Contract & Modular Tools Validation Gate
 * 
 * Enforces platform red-lines before build or deployment:
 * 1. Valid manifest.json presence with all mandatory keys
 * 2. defaultEnabled must be explicitly false
 * 3. All requested permissions exist in platform permissions table
 * 4. All route endpoints possess a declared permission guard
 * 5. settingsSchema exists, is valid JSON Schema, and defines non-empty properties
 * 6. healthCheck endpoint exists and matches route prefix
 * 7. Core boundary isolation (zero intrusion into orders, checkout, payments, billing, auth, rbac)
 * 8. Zero usage of requireRole in tool code (strictly forbidden)
 * 9. Core bundle size guard: Zero static imports of tools into shared core bundles
 */

const fs = require('fs');
const path = require('path');
const {
  validateManifest,
  CORE_PROTECTED_DOMAINS,
  scanForForbiddenCode
} = require('../services/appContract/appManifestValidator');

const TOOLS_DIR = path.resolve(__dirname, '../tools');
const FRONTEND_SRC = path.resolve(__dirname, '../../frontend/src');

function runCiGate() {
  console.log('=================================================================');
  console.log('🛡️  MAXPERFORMANCE CI GATE — APP CONTRACT & MODULAR TOOL AUDITOR');
  console.log('=================================================================\n');

  let hasErrors = false;
  const toolResults = [];

  if (!fs.existsSync(TOOLS_DIR)) {
    console.warn(`⚠️ [CI-GATE] Tools directory does not exist at ${TOOLS_DIR}. Skipping.`);
    process.exit(0);
  }

  const entries = fs.readdirSync(TOOLS_DIR, { withFileTypes: true });
  const toolFolders = entries.filter((e) => e.isDirectory());

  if (toolFolders.length === 0) {
    console.log('ℹ️ [CI-GATE] No modular tools found in tools directory.');
    process.exit(0);
  }

  console.log(`🔍 [CI-GATE] Found ${toolFolders.length} tool(s) to audit...\n`);

  for (const folder of toolFolders) {
    const toolDir = path.join(TOOLS_DIR, folder.name);
    const manifestPath = path.join(toolDir, 'manifest.json');
    console.log(`-----------------------------------------------------------------`);
    console.log(`📦 Auditing Tool: "${folder.name}" (${manifestPath})`);

    // Check 1: manifest.json existence
    if (!fs.existsSync(manifestPath)) {
      console.error(`❌ [ERROR] Missing manifest.json in "${folder.name}"`);
      hasErrors = true;
      toolResults.push({ name: folder.name, valid: false, errors: ['Missing manifest.json'] });
      continue;
    }

    let manifest;
    try {
      const raw = fs.readFileSync(manifestPath, 'utf8');
      manifest = JSON.parse(raw);
    } catch (parseErr) {
      console.error(`❌ [ERROR] JSON Parse Error in "${manifestPath}": ${parseErr.message}`);
      hasErrors = true;
      toolResults.push({ name: folder.name, valid: false, errors: [`JSON Parse error: ${parseErr.message}`] });
      continue;
    }

    // Check 2 to 8: Manifest validation, permissions, guards, settingsSchema, healthCheck, core boundary, requireRole
    const validation = validateManifest(manifest, { toolDir });

    if (!validation.valid) {
      console.error(`❌ [FAIL] Tool "${manifest.slug || folder.name}" violated App Contract:`);
      validation.errors.forEach((err) => console.error(`   • ${err}`));
      hasErrors = true;
      toolResults.push({ name: folder.name, slug: manifest.slug, valid: false, errors: validation.errors });
    } else {
      console.log(`✅ [PASS] Tool "${manifest.slug}" conforms to all App Contract rules:`);
      console.log(`   • Version: ${manifest.version} (Min Platform: ${manifest.minPlatformVersion})`);
      console.log(`   • Default Enabled: ${manifest.defaultEnabled} (Locked by default)`);
      console.log(`   • Declared Permissions: [${manifest.permissions.join(', ')}]`);
      console.log(`   • Routes Prefix: ${manifest.routes.prefix} (${manifest.routes.endpoints.length} guarded endpoints)`);
      console.log(`   • Health Check: ${manifest.healthCheck}`);
      console.log(`   • Settings Schema: Configured (${Object.keys(manifest.settingsSchema.properties).length} properties)`);
      console.log(`   • Code Quality: 0 requireRole invocations (Permission-based)`);
      toolResults.push({ name: folder.name, slug: manifest.slug, valid: true, errors: [] });
    }
  }

  // Check 9: Core bundle contamination guard
  console.log(`\n-----------------------------------------------------------------`);
  console.log(`📦 Auditing Core Bundle Isolation (Zero static imports of tools)`);

  const coreEntryFiles = [
    path.join(FRONTEND_SRC, 'App.tsx'),
    path.join(FRONTEND_SRC, 'main.tsx'),
    path.join(FRONTEND_SRC, 'routes.tsx'),
    path.join(__dirname, '../server.js')
  ];

  for (const toolResult of toolResults) {
    if (!toolResult.slug) continue;
    const slug = toolResult.slug;

    for (const coreFile of coreEntryFiles) {
      if (fs.existsSync(coreFile)) {
        try {
          const content = fs.readFileSync(coreFile, 'utf8');
          // Match static imports or requires of the tool
          const importPattern = new RegExp(`['"](?:\\.\\./)*tools/${slug}(?:/[^'"]*)?['"]`, 'i');
          if (importPattern.test(content)) {
            const rel = path.relative(path.resolve(__dirname, '../../..'), coreFile);
            console.error(`❌ [FAIL] Core Bundle Contamination: "${rel}" statically imports tool "${slug}". Tools must register dynamically without shared bundle imports!`);
            hasErrors = true;
          }
        } catch (_) {}
      }
    }
  }

  console.log('=================================================================');
  if (hasErrors) {
    console.error('\n🚨 [CI-GATE BLOCKED] One or more tools failed App Contract verification.');
    console.error('All new tools must satisfy the contract before merging or deployment.');
    process.exit(1);
  } else {
    console.log('\n🎉 [CI-GATE PASSED] All modular tools passed App Contract & security verification.');
    process.exit(0);
  }
}

if (require.main === module) {
  runCiGate();
}

module.exports = {
  runCiGate
};

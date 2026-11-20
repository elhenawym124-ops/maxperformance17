#!/usr/bin/env node
/**
 * provision-company-all-features.mjs
 * ---------------------------------------------------------------------------
 * Provisions ONE MaxP company (tenant) with ALL platform features/apps enabled.
 *
 * Sources of truth (read-only, never modified):
 *   - companies / marketplace_apps / company_apps tables
 *       apps/backend/prisma/schema/core.prisma        (Company  -> @@map("companies"))
 *       apps/backend/prisma/schema/marketplace.prisma (MarketplaceApp -> @@map("marketplace_apps"),
 *                                                      CompanyApp     -> @@map("company_apps"))
 *   - company creation INSERT used by the backend:
 *       apps/backend/controller/authController.js:396 (register) and
 *       apps/backend/controller/adminCompnayController.js:1420 (super-admin create)
 *   - app install logic:
 *       apps/backend/utils/initializeCompanyDefaults.js:194 (companyApp.upsert)
 *       apps/backend/services/businessSpecialtyService.js:622 (marketplaceApp.upsert by slug)
 *   - feature ids: apps/frontend/src/config/appRegistry.ts (APP_REGISTRY[].id)
 *   - real marketplace apps: apps/backend/catalog/marketplace/apps.json
 *
 * Usage:
 *   node scripts/provision-company-all-features.mjs
 *   node scripts/provision-company-all-features.mjs --name "MaxP Demo Co" \
 *        --slug maxp-demo-all --email demo@maxp.online
 *   node scripts/provision-company-all-features.mjs --dry-run     # print SQL only
 *
 * DATABASE_URL is read from the environment ONLY. It is never printed, never
 * written to disk, and no other secret is touched. When DATABASE_URL is absent
 * (or --dry-run is passed) the script prints the idempotent SQL and exits 0.
 * When DATABASE_URL is set but the `pg` driver is not installed the script also
 * falls back to printing the SQL.
 *
 * Idempotency keys:
 *   companies.email UNIQUE          -> ON CONFLICT (email) DO NOTHING
 *   marketplace_apps.slug UNIQUE    -> ON CONFLICT (slug) DO NOTHING
 *   company_apps UNIQUE (companyId, appId) -> ON CONFLICT DO NOTHING
 *
 * NOTE: ids are generated inside PostgreSQL with gen_random_uuid() so the same
 * SQL text is both printed (dry-run) and executed. Requires PostgreSQL >= 13.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const SCRIPT_ID = 'scripts/provision-company-all-features.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');
const REGISTRY_PATH = path.join(REPO_ROOT, 'apps/frontend/src/config/appRegistry.ts');
const CATALOG_PATH = path.join(REPO_ROOT, 'apps/backend/catalog/marketplace/apps.json');

const DEFAULTS = {
  name: 'MaxP Demo Co',
  slug: 'maxp-demo-all',
  email: 'demo@maxp.online',
};

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const opts = { ...DEFAULTS, dryRun: false, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const eq = arg.indexOf('=');
    const key = eq === -1 ? arg : arg.slice(0, eq);
    const inlineValue = eq === -1 ? null : arg.slice(eq + 1);
    const takeValue = () => {
      if (inlineValue !== null) return inlineValue;
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) throw new Error(`Missing value for ${key}`);
      i += 1;
      return next;
    };
    switch (key) {
      case '--name': opts.name = takeValue(); break;
      case '--slug': opts.slug = takeValue(); break;
      case '--email': opts.email = takeValue(); break;
      case '--dry-run': opts.dryRun = true; break;
      case '--help':
      case '-h': opts.help = true; break;
      default: throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return opts;
}

function printHelp() {
  console.log(`Usage: node ${SCRIPT_ID} [options]

Options:
  --name  <text>   Company display name        (default: "${DEFAULTS.name}")
  --slug  <text>   Unique company slug         (default: "${DEFAULTS.slug}")
  --email <email>  Unique company email        (default: "${DEFAULTS.email}")
  --dry-run        Print the idempotent SQL without executing it
  --help, -h       Show this help

Env:
  DATABASE_URL     PostgreSQL connection string (optional; absent => dry-run)

The script creates the tenant (if missing) and activates:
  - every app id in apps/frontend/src/config/appRegistry.ts
  - every active/public app in apps/backend/catalog/marketplace/apps.json`);
}

function validate(opts) {
  if (!opts.name || !String(opts.name).trim()) throw new Error('--name must not be empty');
  if (!opts.slug || !/^[a-z0-9][a-z0-9-]{1,62}$/.test(String(opts.slug).trim())) {
    throw new Error('--slug must be lowercase letters/digits/dashes (2-63 chars)');
  }
  if (!opts.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(opts.email).trim())) {
    throw new Error('--email must be a valid e-mail address');
  }
}

// ---------------------------------------------------------------------------
// Registry / catalog discovery
// ---------------------------------------------------------------------------
/**
 * Extracts `id:` values from APP_REGISTRY[] in appRegistry.ts plus each entry's
 * optional `displayName` / `isHidden` (used only for nicer row names).
 */
function readRegistryApps() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    throw new Error(`appRegistry.ts not found at ${REGISTRY_PATH}`);
  }
  const src = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const matches = [...src.matchAll(/^ {4}id:\s*'([^']+)'/gm)];
  if (matches.length === 0) {
    throw new Error(`No "id: '...'" entries matched in ${REGISTRY_PATH}`);
  }
  const apps = [];
  const seen = new Set();
  for (let i = 0; i < matches.length; i += 1) {
    const id = matches[i][1];
    if (seen.has(id)) continue;
    seen.add(id);
    const blockEnd = i + 1 < matches.length ? matches[i + 1].index : src.length;
    const block = src.slice(matches[i].index, blockEnd);
    const displayName = (block.match(/displayName:\s*'([^']+)'/) || [])[1] || null;
    const isHidden = /\bisHidden:\s*true\b/.test(block);
    apps.push({ id, displayName, isHidden });
  }
  return apps;
}

/** Active + public marketplace catalog apps (THEME/TEMPLATE excluded, like the backend does). */
function readCatalogApps() {
  if (!fs.existsSync(CATALOG_PATH)) return null;
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  return parsed.filter((app) => (
    app
    && typeof app.slug === 'string'
    && app.slug.trim().length > 0
    && app.isActive !== false
    && app.isPublic !== false
    && !['THEME', 'TEMPLATE'].includes(String(app.category || '').toUpperCase())
  ));
}

function buildTargets(registryApps, catalogApps) {
  const catalogBySlug = new Map((catalogApps || []).map((app) => [app.slug, app]));
  const bySlug = new Map();

  // 1) Registry feature ids get the strongest guarantee: always present + installed.
  for (const reg of registryApps) {
    const catalogApp = catalogBySlug.get(reg.id) || null;
    bySlug.set(reg.id, {
      slug: reg.id,
      name: catalogApp?.name || reg.displayName || reg.id,
      description: catalogApp?.description
        || `MaxP platform feature app: ${reg.id}`,
      category: catalogApp?.category || 'FEATURE',
      pricingModel: catalogApp?.pricingModel || 'FREE',
      monthlyPrice: Number(catalogApp?.monthlyPrice || 0),
      yearlyPrice: Number(catalogApp?.yearlyPrice || 0),
      trialDays: Number(catalogApp?.trialDays || 0),
      isPopular: Boolean(catalogApp?.isPopular),
      isPublic: catalogApp ? true : false,
      source: 'registry',
      hidden: reg.isHidden,
    });
  }

  // 2) Real marketplace apps (so the tenant really has every sellable app active).
  for (const app of catalogApps || []) {
    if (bySlug.has(app.slug)) continue;
    bySlug.set(app.slug, {
      slug: app.slug,
      name: app.name || app.slug,
      description: String(app.description || ''),
      category: app.category || 'general',
      pricingModel: app.pricingModel || 'FREE',
      monthlyPrice: Number(app.monthlyPrice || 0),
      yearlyPrice: Number(app.yearlyPrice || 0),
      trialDays: Number(app.trialDays || 0),
      isPopular: Boolean(app.isPopular),
      isPublic: true,
      source: 'catalog',
      hidden: false,
    });
  }

  return [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

// ---------------------------------------------------------------------------
// SQL builders
// ---------------------------------------------------------------------------
const sqlString = (value) => `'${String(value).replace(/'/g, "''")}'`;
const sqlNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : '0';
};
const sqlBool = (value) => (value ? 'true' : 'false');
const sqlJsonb = (value) => `${sqlString(JSON.stringify(value))}::jsonb`;
const newIdExpr = () => `('c' || replace(gen_random_uuid()::text, '-', ''))`;

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // same alphabet as apps/backend/utils/companyPublicCode.js

function buildPublicCodePrefix(opts) {
  const sanitize = (str) => String(str || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .replace(/[OIL]/g, '');
  let letters = sanitize(opts.name);
  if (letters.length < 3) letters += sanitize(opts.slug);
  if (letters.length < 3) letters += sanitize(String(opts.email).split('@')[0]);
  while (letters.length < 3) letters += 'X';
  return letters.length === 3 ? letters : letters.slice(0, 4);
}

function generatePublicCode(opts) {
  const prefix = buildPublicCodePrefix(opts);
  let body = '';
  for (let i = 0; i < 6; i += 1) body += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return `${prefix}-${body}`;
}

const COMPANY_SETTINGS = (opts) => JSON.stringify({
  lastSystemChange: new Date().toISOString(),
  systemChangeBy: SCRIPT_ID,
  provisioning: {
    script: SCRIPT_ID,
    allFeatures: true,
    requestedName: opts.name,
    requestedSlug: opts.slug,
    provisionedAt: new Date().toISOString(),
  },
  sidebarSettings: {},
});

const INSTALL_SETTINGS = (opts) => JSON.stringify({
  provisioning: {
    script: SCRIPT_ID,
    allFeatures: true,
    slug: opts.slug,
    at: new Date().toISOString(),
  },
  // Deliberate for an ALL-FEATURES tenant: never lock an installed app because of
  // a subscription/trial date (see apps/backend/middleware/checkAppAccess.js:143-149).
  bypassExpiry: true,
});

function buildSql(opts, features, publicCode) {
  const lines = [];
  lines.push('-- ===========================================================================');
  lines.push(`-- MaxP provisioning: 1 tenant + ALL platform features/apps (${features.length} app slugs)`);
  lines.push(`-- generated by ${SCRIPT_ID} at ${new Date().toISOString()}`);
  lines.push('-- idempotent: companies(email) / marketplace_apps(slug) / company_apps(companyId,appId)');
  lines.push('-- requires PostgreSQL >= 13 (gen_random_uuid()), uses only built-in functions');
  lines.push('-- ===========================================================================');
  lines.push('BEGIN;');
  lines.push('');
  lines.push('-- 1) Company (tenant). Same required columns the backend writes.');
  lines.push('--    ref: apps/backend/controller/authController.js:396-413');
  lines.push('INSERT INTO companies (');
  lines.push('  id, name, email, slug, "publicCode", currency, timezone, "isActive", "sidebarLayout",');
  lines.push('  settings, "businessSpecialtyId", "createdAt", "updatedAt"');
  lines.push(') VALUES (');
  lines.push(`  ${newIdExpr()}, ${sqlString(opts.name)}, ${sqlString(opts.email)}, ${sqlString(opts.slug)},`);
  lines.push(`  ${sqlString(publicCode)}, 'EGP', 'Africa/Cairo', true, 'classic',`);
  lines.push(`  ${sqlString(COMPANY_SETTINGS(opts))},`);
  lines.push(`  (SELECT id FROM business_specialties WHERE slug = 'ecommerce-retail' AND "isActive" = true LIMIT 1),`);
  lines.push('  now(), now()');
  lines.push(')');
  lines.push('ON CONFLICT (email) DO NOTHING;');
  lines.push('');
  lines.push('-- 2) Marketplace app rows (real catalog apps keep their own data; registry-only');
  lines.push('--    feature ids are inserted as internal, non-public FREE apps).');
  lines.push('--    ref: apps/backend/services/businessSpecialtyService.js:622-647');
  lines.push('INSERT INTO marketplace_apps (');
  lines.push('  id, slug, name, description, "monthlyPrice", "yearlyPrice", "pricingModel", features,');
  lines.push('  "isActive", "isPublic", "trialDays", category, "createdAt", "updatedAt"');
  lines.push(') VALUES');
  const appRows = features.map((app) => (
    `  (${newIdExpr()}, ${sqlString(app.slug)}, ${sqlString(app.name)}, ${sqlString(app.description)}, `
    + `${sqlNumber(app.monthlyPrice)}, ${sqlNumber(app.yearlyPrice)}, ${sqlString(app.pricingModel)}, `
    + `${sqlJsonb({})}, true, ${sqlBool(app.isPublic)}, ${sqlNumber(app.trialDays)}, `
    + `${sqlString(app.category)}, now(), now())`
  ));
  lines.push(appRows.join(',\n'));
  lines.push('ON CONFLICT (slug) DO NOTHING;');
  lines.push('');
  lines.push('-- 3) Install EVERY feature/app for the tenant (company_apps).');
  lines.push('--    ref: apps/backend/utils/initializeCompanyDefaults.js:194-222');
  lines.push('INSERT INTO company_apps (');
  lines.push('  id, "companyId", "appId", status, "activePricingModel", settings, "createdAt", "updatedAt"');
  lines.push(')');
  lines.push('SELECT');
  lines.push(`  ${newIdExpr()}, c.id, a.id, 'ACTIVE', 'FREE',`);
  lines.push(`  ${sqlJsonb(JSON.parse(INSTALL_SETTINGS(opts)))}, now(), now()`);
  lines.push(`FROM (VALUES ${features.map((app) => `(${sqlString(app.slug)})`).join(', ')}) AS v(slug)`);
  lines.push(`JOIN companies c ON c.email = ${sqlString(opts.email)}`);
  lines.push('JOIN marketplace_apps a ON a.slug = v.slug');
  lines.push('ON CONFLICT ("companyId", "appId") DO NOTHING;');
  lines.push('');
  lines.push('-- 4) Verification row (also visible when running the dry-run SQL manually).');
  lines.push('SELECT');
  lines.push('  c.id AS company_id,');
  lines.push('  c.slug AS company_slug,');
  lines.push('  c.email AS company_email,');
  lines.push('  count(ca.id) AS installed_apps');
  lines.push('FROM companies c');
  lines.push('LEFT JOIN company_apps ca ON ca."companyId" = c.id');
  lines.push(`WHERE c.email = ${sqlString(opts.email)}`);
  lines.push('GROUP BY c.id, c.slug, c.email;');
  lines.push('');
  lines.push('COMMIT;');
  return `${lines.join('\n')}\n`;
}

// ---------------------------------------------------------------------------
// PostgreSQL driver (optional)
// ---------------------------------------------------------------------------
function loadPg() {
  const bases = [
    path.join(REPO_ROOT, 'apps/backend/package.json'),
    path.join(REPO_ROOT, 'package.json'),
    path.join(REPO_ROOT, 'apps/frontend/package.json'),
  ];
  for (const base of bases) {
    try {
      return createRequire(base)('pg');
    } catch {
      /* try next base */
    }
  }
  return null;
}

function redact(message) {
  const url = process.env.DATABASE_URL || '';
  if (!url) return String(message);
  return String(message).split(url).join('[DATABASE_URL redacted]');
}

async function executeSql(sql, opts, featureCount) {
  const { Client } = loadPg();
  const connectionString = process.env.DATABASE_URL;
  const needsSsl = /sslmode=(require|prefer|verify-ca|verify-full)/i.test(connectionString);
  const client = new Client({
    connectionString,
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  await client.connect();
  try {
    const beforeCompany = await client.query(
      'SELECT id FROM companies WHERE email = $1 LIMIT 1',
      [opts.email],
    );
    const beforeInstalls = await client.query(
      `SELECT count(*)::int AS n
         FROM company_apps ca
         JOIN companies c ON c.id = ca."companyId"
        WHERE c.email = $1`,
      [opts.email],
    );

    await client.query(sql);

    const company = await client.query(
      'SELECT id, name, slug FROM companies WHERE email = $1 LIMIT 1',
      [opts.email],
    );
    const afterInstalls = await client.query(
      `SELECT count(*)::int AS n
         FROM company_apps ca
         JOIN companies c ON c.id = ca."companyId"
        WHERE c.email = $1`,
      [opts.email],
    );
    const installsForTargets = await client.query(
      `SELECT count(*)::int AS n
         FROM company_apps ca
         JOIN companies c ON c.id = ca."companyId"
         JOIN marketplace_apps a ON a.id = ca."appId"
        WHERE c.email = $1`,
      [opts.email],
    );

    return {
      company: company.rows[0] || null,
      companyExistedBefore: beforeCompany.rowCount > 0,
      installsBefore: beforeInstalls.rows[0]?.n || 0,
      installsAfter: afterInstalls.rows[0]?.n || 0,
      installsForTargets: installsForTargets.rows[0]?.n || 0,
      featureCount,
    };
  } finally {
    await client.end();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return 0;
  }
  validate(opts);

  const registryApps = readRegistryApps();
  const catalogApps = readCatalogApps();
  const features = buildTargets(registryApps, catalogApps);
  const publicCode = generatePublicCode(opts);
  const sql = buildSql(opts, features, publicCode);

  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const pg = hasDatabaseUrl ? loadPg() : null;
  const dryRun = opts.dryRun || !hasDatabaseUrl || !pg;

  if (!opts.dryRun && hasDatabaseUrl && !pg) {
    console.warn('WARN: DATABASE_URL is set but the "pg" driver could not be resolved');
    console.warn('      (checked apps/backend/node_modules and repo root). Printing SQL only.');
    console.warn('      Install it with: npm --prefix apps/backend install pg');
    console.warn('');
  }

  const registryCount = features.filter((f) => f.source === 'registry').length;
  const catalogOnlyCount = features.filter((f) => f.source === 'catalog').length;
  const hiddenCount = registryApps.filter((a) => a.isHidden).length;

  if (dryRun) {
    console.log(`-- DRY RUN${opts.dryRun ? ' (--dry-run)' : (!hasDatabaseUrl ? ' (DATABASE_URL is not set)' : ' (pg driver unavailable)')}`);
    console.log(`-- publicCode that will be used: ${publicCode}`);
    console.log('');
    console.log(sql);
    console.log('=== Provision summary (dry-run) ===');
    console.log(`script            : ${SCRIPT_ID}`);
    console.log(`company id        : (generated by gen_random_uuid() at execution time)`);
    console.log(`company name      : ${opts.name}`);
    console.log(`company slug      : ${opts.slug}`);
    console.log(`company email     : ${opts.email}`);
    console.log(`company publicCode: ${publicCode}`);
    console.log(`registry features : ${registryCount} app ids from apps/frontend/src/config/appRegistry.ts`
      + (catalogApps === null ? ' (catalog file missing)' : ` (${hiddenCount} hidden)`));
    console.log(`catalog apps      : ${catalogOnlyCount} additional active/public app(s) from catalog/marketplace/apps.json`);
    console.log(`target app slugs  : ${features.length}`);
    console.log(`apps installed    : ${features.length} (would be inserted if absent)`);
    console.log(`apps skipped      : 0 new rows on first run; re-run skips already-installed rows`);
    console.log('nothing was executed; no database connection was opened.');
    return 0;
  }

  console.log(`Connecting to PostgreSQL and provisioning "${opts.name}" (${opts.slug}) ...`);
  let result;
  try {
    result = await executeSql(sql, opts, features.length);
  } catch (error) {
    console.error(`ERROR: provisioning failed: ${redact(error?.message || error)}`);
    if (error?.detail) console.error(`detail: ${redact(error.detail)}`);
    if (error?.hint) console.error(`hint: ${redact(error.hint)}`);
    return 1;
  }

  if (!result.company) {
    console.error('ERROR: company row not found after provisioning (nothing was created).');
    return 1;
  }

  const newlyInstalled = Math.max(0, result.installsAfter - result.installsBefore);

  console.log('');
  console.log('=== Provision summary ===');
  console.log(`script            : ${SCRIPT_ID}`);
  console.log(`company id        : ${result.company.id}`);
  console.log(`company name      : ${result.company.name}`);
  console.log(`company slug      : ${result.company.slug}`);
  console.log(`company email     : ${opts.email}`);
  console.log(`company           : ${result.companyExistedBefore ? 'reused (already existed)' : 'created'}`);
  console.log(`registry features : ${registryCount} app ids from apps/frontend/src/config/appRegistry.ts`);
  console.log(`catalog apps      : ${catalogOnlyCount} additional active/public app(s) from catalog/marketplace/apps.json`);
  console.log(`target app slugs  : ${features.length}`);
  console.log(`apps installed    : ${newlyInstalled} new installation row(s)`);
  console.log(`apps skipped      : ${Math.max(0, features.length - newlyInstalled)} (already present for this company)`);
  console.log(`company apps total: ${result.installsForTargets} targeted app(s) now installed for this company`);
  return 0;
}

main()
  .then((code) => { process.exitCode = code; })
  .catch((error) => {
    console.error(`ERROR: ${error?.message || error}`);
    process.exitCode = 1;
  });

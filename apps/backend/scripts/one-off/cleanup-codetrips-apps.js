/**
 * @file cleanup-codetrips-apps.js
 * @description Diagnostic and cleanup script to remove unintended e-commerce / store / orders
 * apps and settings from company "كودتربس" (Codetrips), ensure education-app is properly active,
 * sync granular Education RBAC permissions into the database, and audit user roles and access.
 *
 * Usage:
 *   DRY_RUN=true node apps/backend/scripts/one-off/cleanup-codetrips-apps.js
 *   DRY_RUN=false node apps/backend/scripts/one-off/cleanup-codetrips-apps.js
 */

const path = require('path');
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
} catch (_) {}

const { getSharedPrismaClientAsync } = require('../../services/sharedDatabase');
const companyCacheService = require('../../services/companyCacheService');
const { PERMISSIONS, BUILT_IN_ROLES } = require('../../../prisma/seeds/seedPermissions.js');

const TARGET_SEARCH = process.env.COMPANY_IDENTIFIER || 'codetrips';
const IS_DRY_RUN = process.env.DRY_RUN !== 'false';

// E-Commerce, Retail & Orders app slugs that should NOT be active for an education center
const UNINTENDED_COMMERCE_APP_SLUGS = [
  'store',
  'store-basic',
  'store-pro',
  'ecommerce-basic',
  'ecommerce-pro',
  'inventory-pro',
  'pos-pro',
  'order-core',
  'order-invoicing',
  'order-automation',
  'manual-orders-pro',
  'order-shipping-turbo',
  'order-shipping-hub',
  'order-shipping-bosta',
  'order-shipping-qpexpress',
  'bulk-orders',
  'returns-settings',
  'procurement-pro',
  'cafe-restaurant-pro'
];

async function main() {
  console.log('===========================================================');
  console.log(`🔍 [CLEANUP-CODETRIPS] Target Identifier: "${TARGET_SEARCH}"`);
  console.log(`⚙️  [CLEANUP-CODETRIPS] Mode: ${IS_DRY_RUN ? 'DRY RUN (Report Only)' : 'APPLY (Modifying Database)'}`);
  console.log('===========================================================');

  const prisma = await getSharedPrismaClientAsync();

  // 1. Sync all granular permissions (including Education) into DB
  console.log('\n🔐 [1/4] Checking and syncing Permissions & Roles in DB...');
  const educationPerms = PERMISSIONS.filter((p) => p.domain === 'EDUCATION');
  console.log(`   Found ${educationPerms.length} Education permissions defined in seed.`);

  if (!IS_DRY_RUN) {
    let syncedPermCount = 0;
    for (const perm of educationPerms) {
      await prisma.permission.upsert({
        where: { key: perm.key },
        create: {
          key: perm.key,
          name: perm.name,
          domain: perm.domain,
          isActive: true
        },
        update: {
          name: perm.name,
          domain: perm.domain,
          isActive: true
        }
      });
      syncedPermCount++;
    }
    console.log(`   ✓ Synced ${syncedPermCount} Education permissions into public.permissions.`);

    // Sync built-in roles
    for (const [key, def] of Object.entries(BUILT_IN_ROLES)) {
      const role = await prisma.role.findFirst({
        where: { key, OR: [{ companyId: '__system__' }, { companyId: null }] },
        include: { permissions: { include: { permission: true } } }
      });
      if (role) {
        const existingKeys = new Set(role.permissions.map((rp) => rp.permission?.key).filter(Boolean));
        const missingKeys = def.permissions.filter((k) => !existingKeys.has(k));
        if (missingKeys.length > 0) {
          const dbPerms = await prisma.permission.findMany({
            where: { key: { in: missingKeys }, isActive: true }
          });
          if (dbPerms.length > 0) {
            await prisma.rolePermission.createMany({
              data: dbPerms.map((p) => ({ roleId: role.id, permissionId: p.id })),
              skipDuplicates: true
            });
            console.log(`   ✓ Added ${dbPerms.length} missing permissions to built-in role: ${key}`);
          }
        }
      }
    }
  } else {
    console.log(`   ℹ️ [DRY RUN] Will sync ${educationPerms.length} Education permissions into DB on apply.`);
  }

  // 2. Search for matching companies
  console.log('\n🏢 [2/4] Searching for company...');
  const matchingCompanies = await prisma.company.findMany({
    where: {
      OR: [
        { slug: { contains: TARGET_SEARCH, mode: 'insensitive' } },
        { name: { contains: TARGET_SEARCH, mode: 'insensitive' } },
        { name: { contains: 'كود', mode: 'insensitive' } },
        { name: { contains: 'تربس', mode: 'insensitive' } },
        { email: { contains: TARGET_SEARCH, mode: 'insensitive' } },
        { id: TARGET_SEARCH }
      ]
    },
    include: {
      installedApps: {
        include: {
          app: true
        }
      },
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          customRole: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });

  if (matchingCompanies.length === 0) {
    console.log(`⚠️ No company found matching "${TARGET_SEARCH}".`);
    const allEducationCompanies = await prisma.company.findMany({
      where: {
        installedApps: {
          some: {
            OR: [
              { appId: 'education-app' },
              { app: { slug: 'education-app' } }
            ]
          }
        }
      },
      select: { id: true, name: true, slug: true, email: true }
    });
    console.log('ℹ️ Companies with education-app installed:', allEducationCompanies);
    return;
  }

  console.log(`✅ Found ${matchingCompanies.length} matching company(ies):\n`);

  for (const company of matchingCompanies) {
    console.log('-----------------------------------------------------------');
    console.log(`🏢 Company ID: ${company.id}`);
    console.log(`   Name:       ${company.name}`);
    console.log(`   Slug:       ${company.slug || '(none)'}`);
    console.log(`   Email:      ${company.email}`);
    console.log(`   Total Apps: ${company.installedApps.length}`);

    // Audit installed apps
    const unintendedApps = company.installedApps.filter((ca) => {
      const slug = (ca.app?.slug || ca.appId || '').toLowerCase().trim();
      return UNINTENDED_COMMERCE_APP_SLUGS.includes(slug);
    });

    const isEducationInstalled = company.installedApps.some((ca) => {
      const slug = (ca.app?.slug || ca.appId || '').toLowerCase().trim();
      return slug === 'education-app' && ['ACTIVE', 'TRIAL'].includes(String(ca.status || '').toUpperCase());
    });

    console.log(`\n📦 Installed Apps Status:`);
    company.installedApps.forEach((ca) => {
      const slug = (ca.app?.slug || ca.appId || '').toLowerCase().trim();
      const isUnintended = unintendedApps.some((u) => u.id === ca.id);
      console.log(`   - ${slug} [${ca.app?.name || 'N/A'}] | Status: ${ca.status} | ID: ${ca.id} ${isUnintended ? '⚠️ [COMMERCE TARGET FOR REMOVAL]' : '✓ [KEEP]'}`);
    });

    console.log(`\n🎓 Education App Installed: ${isEducationInstalled ? 'YES (Active)' : 'NO (Needs Activation)'}`);

    // Audit users & roles
    console.log(`\n👥 Company Users (${company.users.length} user(s)):`);
    company.users.forEach((u) => {
      console.log(`   - ${u.name} (${u.email}) | Role: ${u.role} | CustomRole: ${u.customRole ? u.customRole.name : 'None'} | Status: ${u.status}`);
    });

    console.log(`\n📋 Actions Required for "${company.name}":`);
    console.log(`   - Unintended commerce apps to remove: ${unintendedApps.length}`);
    console.log(`   - Education app to activate if missing: ${!isEducationInstalled ? 'YES' : 'NO'}`);

    if (IS_DRY_RUN) {
      console.log(`\n🔒 [DRY RUN] No changes were applied. Run with DRY_RUN=false to execute.`);
      continue;
    }

    console.log(`\n🚀 [APPLY] Executing cleanup for "${company.name}"...`);

    // 1. Remove unintended commerce apps
    if (unintendedApps.length > 0) {
      const appRecordIds = unintendedApps.map((u) => u.id);
      const delResult = await prisma.companyApp.deleteMany({
        where: { id: { in: appRecordIds } }
      });
      console.log(`   ✓ Deleted ${delResult.count} unintended commerce CompanyApp record(s).`);
    }

    // 2. Ensure education-app is installed and active
    if (!isEducationInstalled) {
      const eduAppRecord = await prisma.app.findFirst({
        where: { slug: 'education-app' }
      });
      if (eduAppRecord) {
        await prisma.companyApp.upsert({
          where: {
            companyId_appId: {
              companyId: company.id,
              appId: eduAppRecord.id
            }
          },
          create: {
            companyId: company.id,
            appId: eduAppRecord.id,
            status: 'ACTIVE',
            installedAt: new Date()
          },
          update: {
            status: 'ACTIVE'
          }
        });
        console.log(`   ✓ Ensured education-app is ACTIVE for ${company.name}.`);
      }
    }

    // 3. Clean sidebar preferences if present
    if (company.sidebarPreferences) {
      let cleanedPrefs = null;
      try {
        const raw = company.sidebarPreferences;
        if (typeof raw === 'object' && raw !== null) {
          cleanedPrefs = { ...raw };
          const bannedKeys = ['orders', 'products', 'inventory', 'procurement', 'cafe'];
          if (Array.isArray(cleanedPrefs.customItems)) {
            cleanedPrefs.customItems = cleanedPrefs.customItems.filter(
              (item) => !bannedKeys.some((b) => String(item.key || '').toLowerCase().includes(b))
            );
          }
          if (Array.isArray(cleanedPrefs.pinnedSections)) {
            cleanedPrefs.pinnedSections = cleanedPrefs.pinnedSections.filter(
              (sec) => !bannedKeys.some((b) => String(sec).toLowerCase().includes(b))
            );
          }
        }
      } catch (_) {
        cleanedPrefs = null;
      }
      await prisma.company.update({
        where: { id: company.id },
        data: { sidebarPreferences: cleanedPrefs }
      });
      console.log(`   ✓ Cleaned sidebarPreferences.`);
    }

    // 4. Invalidate caches
    if (companyCacheService?.invalidateCompany) {
      await companyCacheService.invalidateCompany(company.id);
      console.log(`   ✓ Invalidated company cache for ${company.id}.`);
    }
  }

  console.log('\n===========================================================');
  console.log('✅ [CLEANUP-CODETRIPS] Run completed.');
  console.log('===========================================================');
}

main()
  .catch((err) => {
    console.error('❌ Error executing cleanup:', err);
    process.exit(1);
  })
  .finally(() => process.exit(0));

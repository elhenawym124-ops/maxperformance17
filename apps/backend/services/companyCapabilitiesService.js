'use strict';

/**
 * @module companyCapabilitiesService
 * @description Resolves which apps and permission modules are genuinely active
 * for a tenant company (`CompanyApp` + `isCompanyAppInstallationValid`), so API key
 * creation UIs only present options that actually exist for that company.
 */

const { getSharedPrismaClientAsync, executeWithRetry } = require('./sharedDatabase');
const {
  filterActiveCompanyAppSlugs,
  getCandidateAppSlugs,
  isCompanyAppInstallationValid,
} = require('../middleware/checkAppAccess');

const runWithoutTenantContext = (operation) =>
  require('./tenantContext').run(null, operation);

/**
 * Module catalog mapping permission prefixes / domains to Arabic & English labels
 * and the marketplace app slugs that unlock them (`requiredApps: []` = core platform).
 */
const MODULE_CATALOG = [
  { id: 'dashboard', labelAr: 'لوحة التحكم والتقارير', labelEn: 'Dashboard & Reports', requiredApps: [], prefixes: ['dashboard.', 'analytics.', 'reports.'] },
  { id: 'orders', labelAr: 'الطلبات والمبيعات', labelEn: 'Orders & Sales', requiredApps: ['order-core', 'ecommerce-basic', 'store-basic', 'store-pro', 'store', 'pos-pro', 'manual-orders-pro'], prefixes: ['orders.', 'bulkOrders.'] },
  { id: 'products', labelAr: 'المنتجات والتصنيفات', labelEn: 'Products & Categories', requiredApps: ['ecommerce-basic', 'store-basic', 'store-pro', 'store'], prefixes: ['products.'] },
  { id: 'wholesale', labelAr: 'تجارة الجملة B2B', labelEn: 'Wholesale B2B', requiredApps: ['wholesale', 'wholesale-pro', 'store-pro'], prefixes: ['wholesale.'] },
  { id: 'inventory', labelAr: 'المخزون والمستودعات', labelEn: 'Inventory & Warehouses', requiredApps: ['inventory-pro', 'multi-warehouse-pro', 'store-pro', 'cafe-restaurant-pro'], prefixes: ['inventory.'] },
  { id: 'procurement', labelAr: 'المشتريات والموردين', labelEn: 'Procurement & Suppliers', requiredApps: ['procurement-pro', 'store-pro', 'cafe-restaurant-pro'], prefixes: ['procurement.'] },
  { id: 'manufacturing', labelAr: 'التصنيع والتشغيل MES', labelEn: 'Manufacturing & MES', requiredApps: ['manufacturing-pro', 'manufacturing'], prefixes: ['manufacturing.'] },
  { id: 'customers', labelAr: 'العملاء والليدز', labelEn: 'Customers & CRM', requiredApps: ['crm-basic', 'crm-lite', 'crm', 'store-pro', 'ecommerce-basic'], prefixes: ['customers.'] },
  { id: 'inbox', labelAr: 'المحادثات والإنبوكس', labelEn: 'Inbox & Conversations', requiredApps: ['unified-inbox', 'whatsapp-business', 'facebook-pages-connect', 'crm-basic', 'crm-lite'], prefixes: ['inbox.', 'notes.', 'tags.'] },
  { id: 'whatsapp', labelAr: 'واتساب والأرقام', labelEn: 'WhatsApp & Numbers', requiredApps: ['whatsapp-business', 'whatsapp-integration'], prefixes: ['whatsapp.', 'numbers.', 'settings.whatsapp'] },
  { id: 'facebook', labelAr: 'فيسبوك والصفحات', labelEn: 'Facebook & Ads', requiredApps: ['facebook-pages-connect', 'facebook-ads-pro'], prefixes: ['facebook.'] },
  { id: 'marketing', labelAr: 'التسويق والكوبونات', labelEn: 'Marketing & Coupons', requiredApps: ['marketing-agency-pro', 'coupons-pro', 'store-pro', 'whatsapp-business'], prefixes: ['marketing.'] },
  { id: 'competitors', labelAr: 'رادار المنافسين', labelEn: 'Competitors Radar', requiredApps: ['competitors', 'competitors-radar'], prefixes: ['competitors.'] },
  { id: 'storefront', labelAr: 'المتجر والمدونة', labelEn: 'Storefront & Blog', requiredApps: ['store-pro', 'store-basic', 'ecommerce-basic', 'storefront'], prefixes: ['storefront.', 'blog.'] },
  { id: 'courier', labelAr: 'المناديب وتشغيل الشحن', labelEn: 'Courier & Shipping Ops', requiredApps: ['internal-courier-fleet', 'courier-fleet', 'shipping-ops', 'order-shipping-hub'], prefixes: ['courier.', 'shipping.'] },
  { id: 'hr', labelAr: 'الموارد البشرية', labelEn: 'HR & Attendance', requiredApps: ['hr-core', 'hr-basic', 'hr-pro', 'hr-attendance-pro', 'hr-payroll'], prefixes: ['hr.'] },
  { id: 'accounting', labelAr: 'المحاسبة العامة', labelEn: 'Accounting & GL', requiredApps: ['accounting-pro', 'accounting'], prefixes: ['accounting.'] },
  { id: 'treasury', labelAr: 'الخزينة والمصروفات', labelEn: 'Treasury & Expenses', requiredApps: ['treasury-expenses-pro', 'treasury-expenses', 'treasury-pro', 'treasury'], prefixes: ['treasury.', 'finance.'] },
  { id: 'ai', labelAr: 'الذكاء الاصطناعي والوكلاء', labelEn: 'AI Agents & Studio', requiredApps: ['ai-operator', 'ai-agents', 'ai-tools'], prefixes: ['ai.'] },
  { id: 'tasks', labelAr: 'المهام والمشاريع', labelEn: 'Tasks & Projects', requiredApps: ['tasks', 'tasks-pro', 'project-management'], prefixes: ['tasks.'] },
  { id: 'education', labelAr: 'التعليم والأكاديمية', labelEn: 'Education & Academy', requiredApps: ['education', 'academy', 'academy-app', 'academy-pro'], prefixes: ['education.', 'academy.'] },
  { id: 'medical', labelAr: 'العيادات والمراكز الطبية', labelEn: 'Medical Center', requiredApps: ['medical-center', 'booking-app'], prefixes: ['medical.'] },
  { id: 'dentallab', labelAr: 'معامل الأسنان', labelEn: 'Dental Lab', requiredApps: ['dental-lab', 'dental-lab-app', 'dental-lab-elite'], prefixes: ['dentallab.'] },
  { id: 'lab', labelAr: 'معامل التحاليل', labelEn: 'Laboratories', requiredApps: ['lab', 'lab-app'], prefixes: ['lab.'] },
  { id: 'radiology', labelAr: 'مراكز الأشعة', labelEn: 'Radiology', requiredApps: ['radiology', 'radiology-app', 'radiology-pro'], prefixes: ['radiology.'] },
  { id: 'cafe', labelAr: 'الكافيه والمطاعم', labelEn: 'Cafe & Restaurants', requiredApps: ['cafe-restaurant-pro', 'cafe'], prefixes: ['cafe.'] },
  { id: 'forms', labelAr: 'النماذج والخدمات', labelEn: 'Forms & Services', requiredApps: ['forms', 'forms-builder', 'service-request-app', 'service-requests', 'booking-app'], prefixes: ['forms.', 'services.'] },
  { id: 'admin', labelAr: 'المستخدمون والأدوار والإعدادات', labelEn: 'Users, Roles & Settings', requiredApps: [], prefixes: ['users.', 'roles.', 'teams.', 'settings.', 'notifications.'] },
];

/**
 * Developer Hub (`mxp_live_*`) scope -> required marketplace app slugs.
 */
const DEVELOPER_SCOPE_APP_MAP = {
  'products:read': ['ecommerce-basic', 'store-basic', 'store-pro', 'store'],
  'inventory:read': ['inventory-pro', 'multi-warehouse-pro', 'store-pro', 'ecommerce-basic'],
  'orders:read': ['order-core', 'ecommerce-basic', 'store-basic', 'store-pro', 'store'],
  'customers:read': ['crm-basic', 'crm-lite', 'crm', 'store-pro', 'ecommerce-basic'],
  'coupons:read': ['coupons-pro', 'store-pro', 'ecommerce-basic'],
  'analytics:read': [], // core dashboard/analytics
  'video:read': ['ai-operator', 'video-studio', 'ai-tools'],
  'video:create': ['ai-operator', 'video-studio', 'ai-tools'],
  'agents:read': ['ai-operator', 'ai-agents', 'ai-tools'],
  'agents:chat': ['ai-operator', 'ai-agents', 'ai-tools'],
};

async function getCompanyActiveAppsState(companyId) {
  if (!companyId) {
    return { activeSlugs: new Set(), activeApps: [], isCompanyInActiveTrial: false };
  }

  const prisma = await getSharedPrismaClientAsync();
  const company = await runWithoutTenantContext(() =>
    executeWithRetry(() =>
      prisma.company.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          settings: true,
          trialModeEnabled: true,
          trialEndsAt: true,
          platformSubscription: {
            select: { status: true, nextBillingDate: true, monthlyFee: true },
          },
          installedApps: {
            where: {
              status: { in: ['ACTIVE', 'TRIAL', 'EXPIRED', 'active', 'trial', 'expired'] },
            },
            select: {
              id: true,
              status: true,
              settings: true,
              activePricingModel: true,
              trialEndsAt: true,
              validUntil: true,
              nextBillingAt: true,
              app: {
                select: {
                  slug: true,
                  name: true,
                  category: true,
                  monthlyPrice: true,
                  pricingModel: true,
                },
              },
            },
          },
        },
      })
    )
  );

  if (!company) {
    return { activeSlugs: new Set(), activeApps: [], isCompanyInActiveTrial: false };
  }

  const now = new Date();
  const isCompanyInActiveTrial = Boolean(
    company.trialModeEnabled && company.trialEndsAt && now <= new Date(company.trialEndsAt)
  );

  const validSlugs = filterActiveCompanyAppSlugs(company.installedApps || [], company);
  const activeSlugs = new Set(validSlugs.map((s) => String(s).trim().toLowerCase()));

  const activeApps = [];
  const seen = new Set();
  for (const ca of company.installedApps || []) {
    const slug = String(ca.app?.slug || '').trim().toLowerCase();
    if (!slug || seen.has(slug)) continue;
    if (['THEME', 'TEMPLATE'].includes(String(ca.app?.category || '').toUpperCase())) continue;
    if (activeSlugs.has(slug) || isCompanyAppInstallationValid(ca, company)) {
      seen.add(slug);
      activeSlugs.add(slug);
      activeApps.push({
        slug,
        name: ca.app?.name || slug,
        nameEn: ca.app?.name || slug,
        status: ca.status,
      });
    }
  }

  return { activeSlugs, activeApps, isCompanyInActiveTrial };
}

function isModuleUnlockedForCompany(requiredApps, activeSlugs, isCompanyInActiveTrial) {
  if (!Array.isArray(requiredApps) || requiredApps.length === 0) {
    return true;
  }
  if (isCompanyInActiveTrial) {
    return true;
  }
  for (const appSlug of requiredApps) {
    const candidates = getCandidateAppSlugs(appSlug);
    for (const c of candidates) {
      if (activeSlugs.has(String(c).trim().toLowerCase())) {
        return true;
      }
    }
  }
  return false;
}

function resolveModuleForPermissionKey(permKey) {
  const key = String(permKey || '').trim();
  // Match longest/most specific prefix first (e.g. settings.whatsapp before settings.)
  let best = null;
  let bestLen = -1;
  for (const mod of MODULE_CATALOG) {
    for (const prefix of mod.prefixes) {
      if (key.startsWith(prefix) && prefix.length > bestLen) {
        best = mod;
        bestLen = prefix.length;
      }
    }
  }
  return best || MODULE_CATALOG.find((m) => m.id === 'admin');
}

/**
 * Returns grouped permission modules for a company + target user, indicating which
 * modules are unlocked by the company's active installed apps and which permissions
 * the target user actually holds.
 */
async function getCompanyUserCapabilities({ companyId, targetUserId, targetRole, targetPermissions }) {
  const prisma = await getSharedPrismaClientAsync();
  const [{ activeSlugs, activeApps, isCompanyInActiveTrial }, dbPermissions] = await Promise.all([
    getCompanyActiveAppsState(companyId),
    runWithoutTenantContext(() =>
      executeWithRetry(() =>
        prisma.permission.findMany({
          where: { isActive: true },
          select: { key: true, name: true, domain: true },
          orderBy: [{ domain: 'asc' }, { key: 'asc' }],
        })
      )
    ),
  ]);

  const normalizedRole = String(targetRole || '').trim().toUpperCase();
  const isUnrestrictedRole = normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'OWNER';
  const userPermSet = new Set(Array.isArray(targetPermissions) ? targetPermissions : []);

  // Ensure any permission held by the user that isn't in dbPermissions is still included
  const permByKey = new Map();
  for (const p of dbPermissions) {
    permByKey.set(p.key, p);
  }
  for (const pk of userPermSet) {
    if (!permByKey.has(pk)) {
      permByKey.set(pk, { key: pk, name: pk, domain: pk.split('.')[0].toUpperCase() });
    }
  }

  const buckets = new Map();
  for (const mod of MODULE_CATALOG) {
    const isAppActive = isModuleUnlockedForCompany(mod.requiredApps, activeSlugs, isCompanyInActiveTrial);
    buckets.set(mod.id, {
      id: mod.id,
      labelAr: mod.labelAr,
      labelEn: mod.labelEn,
      isAppActive,
      requiredApps: mod.requiredApps,
      permissions: [],
    });
  }

  for (const perm of permByKey.values()) {
    const mod = resolveModuleForPermissionKey(perm.key);
    const bucket = buckets.get(mod.id);
    if (!bucket) continue;
    const grantedToUser = isUnrestrictedRole || userPermSet.has(perm.key);
    if (!grantedToUser) continue; // Never expose permissions the employee doesn't have
    bucket.permissions.push({
      key: perm.key,
      name: perm.name || perm.key,
      domain: perm.domain,
    });
  }

  const allModules = Array.from(buckets.values()).filter((m) => m.permissions.length > 0);
  const availableModules = allModules.filter((m) => m.isAppActive);
  const unavailableModules = allModules
    .filter((m) => !m.isAppActive)
    .map((m) => ({
      id: m.id,
      labelAr: m.labelAr,
      labelEn: m.labelEn,
      permissionCount: m.permissions.length,
    }));

  return {
    companyId,
    isCompanyInActiveTrial,
    activeApps,
    modules: availableModules,
    unavailableModules,
    totalAvailablePermissions: availableModules.reduce((sum, m) => sum + m.permissions.length, 0),
  };
}

/**
 * Filters Developer Hub scopes (`mxp_live_*`) based on the company's active apps.
 */
async function filterDeveloperScopesForCompany(companyId, scopeDefinitions) {
  const { activeSlugs, activeApps, isCompanyInActiveTrial } = await getCompanyActiveAppsState(companyId);
  const scopes = (scopeDefinitions || []).map((def) => {
    const reqApps = DEVELOPER_SCOPE_APP_MAP[def.key] || [];
    const isAppActive = isModuleUnlockedForCompany(reqApps, activeSlugs, isCompanyInActiveTrial);
    return {
      ...def,
      isAppActive,
    };
  });
  return {
    scopes: scopes.filter((s) => s.isAppActive),
    unavailableScopes: scopes.filter((s) => !s.isAppActive),
    activeApps,
  };
}

module.exports = {
  MODULE_CATALOG,
  DEVELOPER_SCOPE_APP_MAP,
  getCompanyActiveAppsState,
  isModuleUnlockedForCompany,
  getCompanyUserCapabilities,
  filterDeveloperScopesForCompany,
};

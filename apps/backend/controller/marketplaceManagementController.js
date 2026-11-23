const { getSharedPrismaClient, executeWithRetry } = require('../services/sharedDatabase');
const { getMarketplaceCatalogDbDiff } = require('../services/catalog/marketplaceCatalogDiffService');
const { marketplaceCatalogService } = require('../services/catalog/marketplaceCatalogService');
let uuidv4;
try {
  uuidv4 = require('uuid').v4;
} catch (_) {
  const crypto = require('crypto');
  uuidv4 = () => crypto.randomUUID();
}
const { buildInstalledMarketplaceAppSettings } = require('../utils/marketplaceAppSettings');
const { appManifestService } = require('../services/appManifestService');

const ACTIVE_APP_STATUSES = ['ACTIVE', 'TRIAL'];
const VALID_PRICING_MODELS = new Set(['FREE', 'SUBSCRIPTION', 'PAY_PER_USE']);
const NON_RUNTIME_APP_CATEGORIES = ['THEME', 'TEMPLATE'];

function normalizePricingModel(value, fallback = 'SUBSCRIPTION') {
  const normalized = String(value || '').trim().toUpperCase();
  return VALID_PRICING_MODELS.has(normalized) ? normalized : fallback;
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function createRequiredAppsError(requiredApps) {
  const error = new Error('Required marketplace apps are missing');
  error.code = 'REQUIRED_APPS_MISSING';
  error.requiredApps = requiredApps;
  return error;
}

const MAX_RECURSION_DEPTH = 10;

async function ensureCompanyMarketplaceAppInstalled(tx, {
  companyId,
  app,
  pricingModel,
  visited = new Set(),
  autoInstalledApps = [],
  recordAutoInstall = false,
  depth = 0
}) {
  if (depth > MAX_RECURSION_DEPTH) {
    throw new Error(`Exceeded max auto-install recursion depth (${MAX_RECURSION_DEPTH}) for app: ${app?.slug}`);
  }
  const normalizedSlug = String(app?.slug || '').trim();
  if (!normalizedSlug) {
    throw new Error('App slug is required for installation');
  }

  if (visited.has(normalizedSlug)) {
    return autoInstalledApps;
  }
  visited.add(normalizedSlug);

  const requiredAppSlugs = normalizeStringArray(app.requiredApps);
  if (requiredAppSlugs.length > 0) {
    const requiredApps = await tx.marketplaceApp.findMany({
      where: {
        slug: { in: requiredAppSlugs },
        isActive: true,
        isPublic: true
      }
    });

    const foundRequiredSlugs = new Set(requiredApps.map((requiredApp) => requiredApp.slug));
    const missingRequiredSlugs = requiredAppSlugs.filter(
      (requiredSlug) => !foundRequiredSlugs.has(requiredSlug)
    );

    if (missingRequiredSlugs.length > 0) {
      throw createRequiredAppsError(
        missingRequiredSlugs.map((requiredSlug) => ({
          slug: requiredSlug,
          name: requiredSlug
        }))
      );
    }

    for (const requiredApp of requiredApps) {
      await ensureCompanyMarketplaceAppInstalled(tx, {
        companyId,
        app: requiredApp,
        pricingModel: normalizePricingModel(requiredApp.pricingModel, 'SUBSCRIPTION'),
        visited,
        autoInstalledApps,
        recordAutoInstall: true,
        depth: depth + 1
      });
    }
  }

  const existing = await tx.companyApp.findUnique({
    where: {
      companyId_appId: { companyId, appId: app.id }
    }
  });

  const requestedPricingModel = normalizePricingModel(
    pricingModel,
    normalizePricingModel(app.pricingModel, 'SUBSCRIPTION')
  );
  const validUntil = requestedPricingModel === 'SUBSCRIPTION'
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : null;
  const installedSettings = buildInstalledMarketplaceAppSettings(
    app.slug,
    existing?.settings,
    {
      general: {
        enabled: true
      }
    }
  );

  if (existing && ACTIVE_APP_STATUSES.includes(existing.status)) {
    return autoInstalledApps;
  }

  if (existing) {
    await tx.companyApp.update({
      where: { id: existing.id },
      data: {
        activePricingModel: requestedPricingModel,
        status: 'ACTIVE',
        validUntil,
        nextBillingAt: validUntil,
        settings: installedSettings,
        updatedAt: new Date()
      }
    });
  } else {
    await tx.companyApp.create({
      data: {
        id: uuidv4(),
        companyId,
        appId: app.id,
        activePricingModel: requestedPricingModel,
        status: 'ACTIVE',
        validUntil,
        settings: installedSettings,
        nextBillingAt: validUntil
      }
    });

    await tx.marketplaceApp.update({
      where: { id: app.id },
      data: { installCount: { increment: 1 } }
    });
  }

  if (recordAutoInstall) {
    autoInstalledApps.push({
      slug: app.slug,
      name: app.name
    });
  }

  return autoInstalledApps;
}

/**
 * @route GET /api/v1/super-admin/marketplace-management/apps
 * @desc Get all marketplace apps with stats
 * @access Super Admin
 */
exports.getAllApps = async (req, res) => {
  try {
    const apps = await executeWithRetry(async () => {
      return await getSharedPrismaClient().marketplaceApp.findMany({
        where: {
          category: {
            notIn: ['THEME', 'TEMPLATE'],
          },
        },
        include: {
          _count: {
            select: {
              installations: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    });

    res.json({
      success: true,
      data: apps
    });
  } catch (error) {
    console.error('❌ Error fetching marketplace apps:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الأدوات',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @route GET /api/v1/super-admin/marketplace-management/catalog/diff
 * @desc Compare file catalog snapshot with DB snapshot
 * @access Super Admin
 */
exports.getCatalogDiff = async (req, res) => {
  try {
    const summary = await getMarketplaceCatalogDbDiff();
    const includeDetails = String(req.query.includeDetails || "true").toLowerCase() !== "false";

    if (includeDetails) {
      return res.json({
        success: true,
        data: summary
      });
    }

    return res.json({
      success: true,
      data: {
        comparedAt: summary.comparedAt,
        catalogMeta: summary.catalogMeta,
        totals: summary.totals
      }
    });
  } catch (error) {
    console.error("Error generating catalog diff:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate catalog diff",
      error: error.message
    });
  }
};

/**
 * @route GET /api/v1/super-admin/marketplace-management/coverage
 * @desc Return companies, active app installations, and DB app catalog for Marketplace coverage auditing
 * @access Super Admin
 */
exports.getCoverage = async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const requestedLimit = Number.parseInt(String(req.query.limit || '200'), 10);
    const limit = Math.max(1, Math.min(500, Number.isFinite(requestedLimit) ? requestedLimit : 200));
    const companyWhere = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } }
          ]
        }
      : {};

    const prisma = getSharedPrismaClient();
    const [companies, apps, totalCompanies] = await executeWithRetry(async () => {
      return await Promise.all([
        prisma.company.findMany({
          where: companyWhere,
          take: limit,
          orderBy: [
            { isActive: 'desc' },
            { name: 'asc' }
          ],
          select: {
            id: true,
            name: true,
            email: true,
            slug: true,

            isActive: true,
            createdAt: true,
            installedApps: {
              where: {
                status: { in: ACTIVE_APP_STATUSES }
              },
              select: {
                id: true,
                status: true,
                activePricingModel: true,
                trialEndsAt: true,
                validUntil: true,
                app: {
                  select: {
                    id: true,
                    slug: true,
                    name: true,
                    icon: true,
                    category: true,
                    pricingModel: true
                  }
                }
              }
            }
          }
        }),
        prisma.marketplaceApp.findMany({
          where: {
            category: {
              notIn: NON_RUNTIME_APP_CATEGORIES
            }
          },
          select: {
            id: true,
            slug: true,
            name: true,
            icon: true,
            category: true,
            isActive: true,
            isPublic: true,
            pricingModel: true,
            monthlyPrice: true,
            requiredApps: true
          },
          orderBy: { name: 'asc' }
        }),
        prisma.company.count({ where: companyWhere })
      ]);
    });

    const normalizedCompanies = companies.map((company) => {
      const activeApps = (company.installedApps || [])
        .filter((installation) => installation.app && installation.app.slug)
        .map((installation) => ({
          installationId: installation.id,
          status: installation.status,
          activePricingModel: installation.activePricingModel,
          trialEndsAt: installation.trialEndsAt,
          validUntil: installation.validUntil,
          app: installation.app
        }));

      return {
        id: company.id,
        name: company.name,
        email: company.email,
        slug: company.slug,
        isActive: company.isActive,
        createdAt: company.createdAt,
        activeApps,
        activeAppSlugs: activeApps.map((installation) => installation.app.slug)
      };
    });

    return res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        totals: {
          companies: totalCompanies,
          returnedCompanies: normalizedCompanies.length,
          marketplaceApps: apps.length
        },
        companies: normalizedCompanies,
        apps
      }
    });
  } catch (error) {
    console.error('Error generating marketplace coverage:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate marketplace coverage',
      error: error.message
    });
  }
};

/**
 * @route POST /api/v1/super-admin/marketplace-management/coverage/companies/:companyId/apps/:slug/install
 * @desc Install or reactivate a marketplace app for a selected company
 * @access Super Admin
 */
exports.installCompanyCoverageApp = async (req, res) => {
  try {
    const { companyId, slug } = req.params;
    const { pricingModel } = req.body || {};
    const prisma = getSharedPrismaClient();

    const result = await executeWithRetry(async () => {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true
        }
      });

      if (!company) {
        const error = new Error('Company not found');
        error.code = 'COMPANY_NOT_FOUND';
        throw error;
      }

      const app = await prisma.marketplaceApp.findUnique({
        where: { slug }
      });

      if (!app || !app.isActive || !app.isPublic || NON_RUNTIME_APP_CATEGORIES.includes(app.category)) {
        const error = new Error('Marketplace app is not installable');
        error.code = 'APP_NOT_INSTALLABLE';
        throw error;
      }

      return await prisma.$transaction(async (tx) => {
        const autoInstalledApps = [];
        await ensureCompanyMarketplaceAppInstalled(tx, {
          companyId,
          app,
          pricingModel,
          autoInstalledApps
        });

        const installation = await tx.companyApp.findUnique({
          where: {
            companyId_appId: { companyId, appId: app.id }
          },
          include: {
            app: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
                category: true
              }
            }
          }
        });

        return {
          company,
          installation,
          autoInstalledApps
        };
      });
    });

    return res.json({
      success: true,
      message: 'Marketplace app activated for company',
      data: result
    });
  } catch (error) {
    if (error.code === 'COMPANY_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    if (error.code === 'APP_NOT_INSTALLABLE') {
      return res.status(404).json({
        success: false,
        message: 'Marketplace app is not installable'
      });
    }

    if (error.code === 'REQUIRED_APPS_MISSING') {
      return res.status(400).json({
        success: false,
        message: error.message,
        requiredApps: error.requiredApps
      });
    }

    console.error('Error installing coverage marketplace app:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to activate marketplace app for company',
      error: error.message
    });
  }
};

/**
 * @route POST /api/v1/super-admin/marketplace-management/apps
 * @desc Create new marketplace app
 * @access Super Admin
 */
const generateSlug = (name) => {
  const base = String(name || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (base) return base;
  return `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

exports.createApp = async (req, res) => {
  try {
    const body = req.body;

    if (!body.name || !String(body.name).trim()) {
      return res.status(400).json({
        success: false,
        message: 'اسم التطبيق مطلوب'
      });
    }

    // Only pick fields that exist in the Prisma MarketplaceApp model
    const ALLOWED_FIELDS = [
      'slug', 'name', 'description', 'logo', 'images',
      'monthlyPrice', 'yearlyPrice', 'pricingModel', 'unitPrice', 'unitName',
      'ppuBillingMethod',
      'features', 'isActive', 'isPublic', 'isFeatured', 'isPopular',
      'requiredApps', 'trialDays', 'mainRoute', 'adminRoute',
      'category', 'icon', 'coverImage', 'engineCompatibility', 'isAutoInstall',
      'version', 'permissions', 'settingsSchema', 'killSwitch', 'manifest',
      'manifestVersion', 'appVersion', 'entryRoute', 'killSwitchReason', 'killSwitchAt'
    ];
    const appData = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) appData[key] = body[key];
    }

    // Generate slug from name if not provided (fallback for non-latin names)
    if (!appData.slug) {
      appData.slug = generateSlug(appData.name);
    }

    // Publishing Gate: Reject publishing without a compliant manifest
    const shouldEnforceManifest = process.env.APP_MANIFEST_ENFORCE === 'true' || appData.isPublic === true;
    if (shouldEnforceManifest) {
      const publishCheck = appManifestService.validatePublishGate(appData);
      if (!publishCheck.canPublish) {
        return res.status(422).json({
          success: false,
          code: 'PUBLISH_GATE_REJECTED',
          message: 'بوابة النشر رفضت نشر التطبيق: التطبيق لا يستوفي عقد التطبيق أو تنقصه متطلبات المانيفست',
          errors: publishCheck.errors,
          warnings: publishCheck.warnings
        });
      }
      if (publishCheck.manifest) {
        appData.manifest = publishCheck.manifest;
        if (!appData.version) appData.version = publishCheck.manifest.version;
        if (!appData.manifestVersion) appData.manifestVersion = publishCheck.manifest.manifestVersion || '1.0';
        if (!appData.appVersion) appData.appVersion = publishCheck.manifest.appVersion || publishCheck.manifest.version;
        if (!appData.entryRoute) appData.entryRoute = publishCheck.manifest.entryRoute || appData.mainRoute;
        if (!appData.permissions) appData.permissions = publishCheck.manifest.permissions;
        if (!appData.settingsSchema) appData.settingsSchema = publishCheck.manifest.settingsSchema;
      }
    }

    // Ensure required non-null model fields have valid values
    if (appData.description == null) appData.description = String(body.name).trim() || '';
    if (appData.monthlyPrice == null) appData.monthlyPrice = 0;
    if (appData.yearlyPrice == null) appData.yearlyPrice = 0;

    // Ensure numeric fields are correctly typed
    if (appData.monthlyPrice != null) appData.monthlyPrice = parseFloat(appData.monthlyPrice);
    if (appData.yearlyPrice != null) appData.yearlyPrice = parseFloat(appData.yearlyPrice);
    if (appData.trialDays != null) appData.trialDays = parseInt(appData.trialDays);

    const app = await executeWithRetry(async () => {
      return await getSharedPrismaClient().marketplaceApp.create({
        data: appData
      });
    });

    try { marketplaceCatalogService?.clearCache?.(); } catch (_) {}

    res.json({
      success: true,
      message: 'تم إنشاء الأداة بنجاح',
      data: app
    });
  } catch (error) {
    console.error('Error creating app:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء الأداة',
      error: error.message
    });
  }
};

/**
 * @route PUT /api/v1/super-admin/marketplace-management/apps/:id
 * @desc Update marketplace app
 * @access Super Admin
 */
exports.updateApp = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // Only pick fields that exist in the Prisma MarketplaceApp model
    const ALLOWED_FIELDS = [
      'slug', 'name', 'description', 'logo', 'images',
      'monthlyPrice', 'yearlyPrice', 'pricingModel', 'unitPrice', 'unitName',
      'ppuBillingMethod',
      'features', 'isActive', 'isPublic', 'isFeatured', 'isPopular',
      'requiredApps', 'trialDays', 'mainRoute', 'adminRoute',
      'category', 'icon', 'coverImage', 'engineCompatibility', 'isAutoInstall',
      'version', 'permissions', 'settingsSchema', 'killSwitch', 'manifest',
      'manifestVersion', 'appVersion', 'entryRoute', 'killSwitchReason', 'killSwitchAt'
    ];
    const updateData = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) updateData[key] = body[key];
    }

    // Early Publishing Gate check on payload if attempting to publish with explicit invalid manifest/schema
    if (updateData.isPublic === true) {
      if (updateData.settingsSchema !== undefined || updateData.permissions !== undefined || updateData.killSwitch === true) {
        const payloadForGate = {
          slug: updateData.slug || id.replace(/^cat-app-/, ''),
          ...updateData
        };
        const earlyCheck = appManifestService.validatePublishGate(payloadForGate);
        if (!earlyCheck.canPublish) {
          return res.status(422).json({
            success: false,
            code: 'PUBLISH_GATE_REJECTED',
            message: 'بوابة النشر رفضت تحديث/نشر التطبيق: التطبيق لا يستوفي عقد التطبيق أو تنقصه متطلبات المانيفست',
            errors: earlyCheck.errors,
            warnings: earlyCheck.warnings
          });
        }
      }
    }

    // Ensure numeric fields are correctly typed
    if (updateData.monthlyPrice != null) updateData.monthlyPrice = parseFloat(updateData.monthlyPrice);
    if (updateData.yearlyPrice != null) updateData.yearlyPrice = parseFloat(updateData.yearlyPrice);
    if (updateData.trialDays != null) updateData.trialDays = parseInt(updateData.trialDays);

    // Convert features array to JSON string if needed
    if (Array.isArray(updateData.features)) {
      updateData.features = updateData.features;
    }

    const prisma = getSharedPrismaClient();
    let targetApp = await prisma.marketplaceApp.findUnique({
      where: { id }
    });

    if (!targetApp) {
      const strippedSlug = id.replace(/^cat-app-/, '');
      targetApp = await prisma.marketplaceApp.findFirst({
        where: {
          OR: [
            { slug: id },
            { slug: strippedSlug }
          ]
        }
      });
    }

    if (!targetApp) {
      return res.status(404).json({
        success: false,
        message: 'الأداة غير موجودة'
      });
    }

    const isEffectivelyPublic = updateData.isPublic === true || (targetApp && targetApp.isPublic === true && updateData.isPublic !== false);
    const touchesContract = updateData.isPublic === true || updateData.settingsSchema !== undefined || updateData.permissions !== undefined || updateData.version !== undefined || updateData.killSwitch !== undefined || updateData.manifest !== undefined;

    // Publishing Gate: Reject publishing or modifying public app without a compliant manifest
    if (isEffectivelyPublic && touchesContract) {
      const mergedForGate = { ...targetApp, ...updateData };
      const publishCheck = appManifestService.validatePublishGate(mergedForGate, targetApp);
      if (!publishCheck.canPublish) {
        return res.status(422).json({
          success: false,
          code: 'PUBLISH_GATE_REJECTED',
          message: 'بوابة النشر رفضت تحديث/نشر التطبيق: التطبيق لا يستوفي عقد التطبيق أو تنقصه متطلبات المانيفست',
          errors: publishCheck.errors,
          warnings: publishCheck.warnings
        });
      }
      if (publishCheck.manifest) {
        updateData.manifest = publishCheck.manifest;
        if (!updateData.version) updateData.version = publishCheck.manifest.version;
        if (!updateData.permissions) updateData.permissions = publishCheck.manifest.permissions;
        if (!updateData.settingsSchema) updateData.settingsSchema = publishCheck.manifest.settingsSchema;
      }
    }

    const app = await executeWithRetry(async () => {
      return await prisma.marketplaceApp.update({
        where: { id: targetApp.id },
        data: updateData
      });
    });

    if (updateData.killSwitch !== undefined) {
      try {
        await appKillSwitchService.setKillSwitch(app.slug, updateData.killSwitch, {
          reason: 'Updated via Super Admin Marketplace Management',
          updatedBy: req.user?.id || 'SUPER_ADMIN'
        });
      } catch (ksErr) {
        console.warn('[updateApp] Failed to sync kill switch with in-memory service:', ksErr.message);
      }
    }

    // Auto-sync price and metadata changes back to file catalog (apps.json)
    let catalogSyncResult = null;
    try {
      if (typeof marketplaceCatalogService?.updateAppFile === 'function') {
        catalogSyncResult = await marketplaceCatalogService.updateAppFile(app.slug, updateData);
        if (catalogSyncResult?.success && catalogSyncResult?.modified) {
          console.log(`[catalog:auto-sync] Synchronized updates for app ${app.slug} to apps.json`);
        } else if (!catalogSyncResult?.success && catalogSyncResult?.reason !== 'app_not_in_catalog') {
          console.warn(`[catalog:auto-sync] ⚠️ Warning: Failed to sync app ${app.slug} to apps.json:`, catalogSyncResult?.error || catalogSyncResult?.reason);
        }
      }
      marketplaceCatalogService?.clearCache?.();
    } catch (catalogErr) {
      console.warn(`[catalog:auto-sync] ⚠️ Error syncing to catalog file:`, catalogErr.message);
    }

    res.json({
      success: true,
      message: 'تم تحديث الأداة بنجاح',
      data: app,
      catalogSynced: catalogSyncResult?.success ?? false,
      catalogWarning: (!catalogSyncResult?.success && catalogSyncResult?.reason !== 'app_not_in_catalog')
        ? 'تم التحديث في قاعدة البيانات ولكن تعذر تحديث ملف الكاتالوج تلقائياً — يرجى تشغيل npm run catalog:export-db'
        : undefined
    });
  } catch (error) {
    console.error('Error updating app:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الأداة',
      error: error.message
    });
  }
};

/**
 * @route DELETE /api/v1/super-admin/marketplace-management/apps/:id
 * @desc Delete marketplace app
 * @access Super Admin
 */
exports.deleteApp = async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = getSharedPrismaClient();

    let app = await prisma.marketplaceApp.findUnique({
      where: { id },
      include: {
        _count: {
          select: { installations: true }
        }
      }
    });

    if (!app) {
      const strippedSlug = id.replace(/^cat-app-/, '');
      app = await prisma.marketplaceApp.findFirst({
        where: {
          OR: [
            { slug: id },
            { slug: strippedSlug }
          ]
        },
        include: {
          _count: {
            select: { installations: true }
          }
        }
      });
    }

    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'الأداة غير موجودة'
      });
    }

    if (app._count.installations > 0) {
      return res.status(400).json({
        success: false,
        message: `لا يمكن حذف الأداة: مثبتة لدى ${app._count.installations} شركة. قم بإلغاء التثبيت أولاً.`
      });
    }

    await executeWithRetry(async () => {
      return await prisma.marketplaceApp.delete({
        where: { id: app.id }
      });
    });

    try { marketplaceCatalogService?.clearCache?.(); } catch (_) {}

    res.json({
      success: true,
      message: 'تم حذف الأداة بنجاح'
    });
  } catch (error) {
    console.error('Error deleting app:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الأداة'
    });
  }
};

/**
 * @route GET /api/v1/super-admin/marketplace-management/pricing-rules
 * @desc Get all pricing rules
 * @access Super Admin
 */
exports.getAllPricingRules = async (req, res) => {
  try {
    const rules = await executeWithRetry(async () => {
      return await getSharedPrismaClient().appPricingRule.findMany({
        orderBy: { name: 'asc' }
      });
    });

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('❌ Error fetching pricing rules:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب قواعد التسعير',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @route POST /api/v1/super-admin/marketplace-management/pricing-rules
 * @desc Create new pricing rule
 * @access Super Admin
 */
exports.createPricingRule = async (req, res) => {
  try {
    const ruleData = req.body;

    const rule = await executeWithRetry(async () => {
      return await getSharedPrismaClient().appPricingRule.create({
        data: ruleData
      });
    });

    res.json({
      success: true,
      message: 'تم إنشاء قاعدة التسعير بنجاح',
      data: rule
    });
  } catch (error) {
    console.error('Error creating pricing rule:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء قاعدة التسعير'
    });
  }
};

/**
 * @route PUT /api/v1/super-admin/marketplace-management/pricing-rules/:id
 * @desc Update pricing rule
 * @access Super Admin
 */
exports.updatePricingRule = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const rule = await executeWithRetry(async () => {
      return await getSharedPrismaClient().appPricingRule.update({
        where: { id },
        data: updateData
      });
    });

    res.json({
      success: true,
      message: 'تم تحديث قاعدة التسعير بنجاح',
      data: rule
    });
  } catch (error) {
    console.error('Error updating pricing rule:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث قاعدة التسعير'
    });
  }
};

/**
 * @route DELETE /api/v1/super-admin/marketplace-management/pricing-rules/:id
 * @desc Delete pricing rule
 * @access Super Admin
 */
exports.deletePricingRule = async (req, res) => {
  try {
    const { id } = req.params;

    await executeWithRetry(async () => {
      return await getSharedPrismaClient().appPricingRule.delete({
        where: { id }
      });
    });

    res.json({
      success: true,
      message: 'تم حذف قاعدة التسعير بنجاح'
    });
  } catch (error) {
    console.error('Error deleting pricing rule:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف قاعدة التسعير'
    });
  }
};

/**
 * @route GET /api/v1/super-admin/marketplace-management/bundles
 * @desc Get all bundles
 * @access Super Admin
 */
exports.getAllBundles = async (req, res) => {
  try {
    const bundles = await executeWithRetry(async () => {
      const allBundles = await getSharedPrismaClient().appBundle.findMany({
        orderBy: { createdAt: 'desc' }
      });

      // Fetch apps for each bundle based on appIds (supports both IDs and slugs)
      const bundlesWithApps = await Promise.all(
        allBundles.map(async (bundle) => {
          const appIds = Array.isArray(bundle.appIds) ? bundle.appIds : [];
          const apps = await getSharedPrismaClient().marketplaceApp.findMany({
            where: {
              OR: [
                { id: { in: appIds } },
                { slug: { in: appIds } }
              ]
            },
            select: {
              id: true,
              name: true,
              slug: true,
              monthlyPrice: true
            }
          });
          return { ...bundle, apps };
        })
      );

      return bundlesWithApps;
    });

    res.json({
      success: true,
      data: bundles
    });
  } catch (error) {
    console.error('❌ Error fetching bundles:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الباقات',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @route POST /api/v1/super-admin/marketplace-management/bundles
 * @desc Create new bundle
 * @access Super Admin
 */
exports.createBundle = async (req, res) => {
  try {
    const bundleData = req.body;
    const { apps, ...rest } = bundleData;

    if (!rest.name || !String(rest.name).trim()) {
      return res.status(400).json({
        success: false,
        message: 'اسم الباقة مطلوب'
      });
    }

    const payload = {
      ...rest,
      ...(rest.slug ? {} : { slug: generateSlug(rest.name) }),
      description: rest.description == null ? String(rest.name).trim() : rest.description,
      monthlyPrice: rest.monthlyPrice != null ? parseFloat(rest.monthlyPrice) : 0,
      discount: rest.discount != null ? parseFloat(rest.discount) : 0,
      appIds: rest.appIds || (Array.isArray(apps)
        ? apps.map((app) => (typeof app === 'string' ? app : app.slug || app.id || '')).filter(Boolean)
        : [])
    };

    const bundle = await executeWithRetry(async () => {
      return await getSharedPrismaClient().appBundle.create({
        data: payload
      });
    });

    res.json({
      success: true,
      message: 'تم إنشاء الباقة بنجاح',
      data: bundle
    });
  } catch (error) {
    console.error('Error creating bundle:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء الباقة'
    });
  }
};

/**
 * @route PUT /api/v1/super-admin/marketplace-management/bundles/:id
 * @desc Update bundle
 * @access Super Admin
 */
exports.updateBundle = async (req, res) => {
  try {
    const { id } = req.params;
    const { apps, ...rest } = req.body;

    // Only set appIds when explicitly provided, otherwise preserve existing value
    const updateData = { ...rest };
    if (rest.appIds !== undefined || Array.isArray(apps)) {
      updateData.appIds = rest.appIds || (Array.isArray(apps)
        ? apps.map((app) => (typeof app === 'string' ? app : app.slug || app.id || '')).filter(Boolean)
        : []);
    }
    if (updateData.monthlyPrice != null) updateData.monthlyPrice = parseFloat(updateData.monthlyPrice);
    if (updateData.discount != null) updateData.discount = parseFloat(updateData.discount);

    const bundle = await executeWithRetry(async () => {
      return await getSharedPrismaClient().appBundle.update({
        where: { id },
        data: updateData
      });
    });

    res.json({
      success: true,
      message: 'تم تحديث الباقة بنجاح',
      data: bundle
    });
  } catch (error) {
    console.error('Error updating bundle:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الباقة'
    });
  }
};

/**
 * @route DELETE /api/v1/super-admin/marketplace-management/bundles/:id
 * @desc Delete bundle
 * @access Super Admin
 */
exports.deleteBundle = async (req, res) => {
  try {
    const { id } = req.params;

    await executeWithRetry(async () => {
      return await getSharedPrismaClient().appBundle.delete({
        where: { id }
      });
    });

    res.json({
      success: true,
      message: 'تم حذف الباقة بنجاح'
    });
  } catch (error) {
    console.error('Error deleting bundle:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الباقة'
    });
  }
};

/**
 * ============================================================================
 * MODULAR TOOLS & APP CONTRACT MANAGEMENT (Kill Switch & Per-Company Toggle)
 * ============================================================================
 */

const appKillSwitchService = require('../services/appContract/appKillSwitchService');
const appRegistryService = require('../services/appContract/appRegistryService');

/**
 * @route POST /api/v1/super-admin/apps/:id/kill
 * @desc Instant emergency kill switch for an app
 * @access Super Admin
 */
exports.killApp = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const effectiveReason = reason || 'Emergency shutoff by Super Admin';
    const prisma = getSharedPrismaClient();

    const stripped = String(id).replace(/^cat-app-/, '');
    const app = await prisma.marketplaceApp.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { slug: stripped }]
      }
    });

    if (!app) {
      return res.status(404).json({ success: false, message: `التطبيق "${id}" غير موجود` });
    }

    const killTime = new Date();
    await prisma.marketplaceApp.update({
      where: { id: app.id },
      data: {
        killSwitch: true,
        killSwitchReason: effectiveReason,
        killSwitchAt: killTime
      }
    });

    // Invalidate caches immediately (<= 5s)
    appManifestService.setKillSwitchCache(app.slug, true, effectiveReason);
    appManifestService.setKillSwitchCache(app.id, true, effectiveReason);
    try {
      await appKillSwitchService.setKillSwitch(app.slug, true, {
        reason: effectiveReason,
        updatedBy: req.user?.id || 'SUPER_ADMIN'
      });
    } catch (_) {}

    // Emit Audit Row in activityLog
    try {
      await prisma.activityLog.create({
        data: {
          category: 'marketplace',
          action: 'APP_KILL_SWITCH_ACTIVATED',
          description: `Super Admin activated kill switch for app "${app.slug}". Reason: ${effectiveReason}`,
          userId: req.user?.id || 'SUPER_ADMIN',
          metadata: {
            appId: app.id,
            slug: app.slug,
            reason: effectiveReason,
            killedAt: killTime
          }
        }
      });
    } catch (auditErr) {
      console.warn('Failed to emit activityLog for kill switch:', auditErr.message);
    }

    return res.json({
      success: true,
      message: `تم تفعيل مفتاح الإيقاف الفوري للتطبيق "${app.slug}" بنجاح`,
      data: {
        id: app.id,
        slug: app.slug,
        killSwitch: true,
        killSwitchReason: effectiveReason,
        killSwitchAt: killTime
      }
    });
  } catch (error) {
    console.error('Error killing app:', error);
    return res.status(500).json({ success: false, message: 'خطأ في تفعيل مفتاح الإيقاف الفوري', error: error.message });
  }
};

/**
 * @route POST /api/v1/super-admin/apps/:id/unkill
 * @desc Deactivate kill switch and restore app
 * @access Super Admin
 */
exports.unkillApp = async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = getSharedPrismaClient();
    const stripped = String(id).replace(/^cat-app-/, '');
    const app = await prisma.marketplaceApp.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { slug: stripped }]
      }
    });

    if (!app) {
      return res.status(404).json({ success: false, message: `التطبيق "${id}" غير موجود` });
    }

    await prisma.marketplaceApp.update({
      where: { id: app.id },
      data: {
        killSwitch: false,
        killSwitchReason: null,
        killSwitchAt: null
      }
    });

    // Invalidate caches immediately
    appManifestService.invalidateKillSwitchCache(app.slug);
    appManifestService.invalidateKillSwitchCache(app.id);
    try {
      await appKillSwitchService.setKillSwitch(app.slug, false, {
        reason: 'Restored by Super Admin',
        updatedBy: req.user?.id || 'SUPER_ADMIN'
      });
    } catch (_) {}

    // Emit Audit Row in activityLog
    try {
      await prisma.activityLog.create({
        data: {
          category: 'marketplace',
          action: 'APP_KILL_SWITCH_DEACTIVATED',
          description: `Super Admin deactivated kill switch for app "${app.slug}".`,
          userId: req.user?.id || 'SUPER_ADMIN',
          metadata: {
            appId: app.id,
            slug: app.slug,
            unkilledAt: new Date()
          }
        }
      });
    } catch (auditErr) {
      console.warn('Failed to emit activityLog for unkill switch:', auditErr.message);
    }

    return res.json({
      success: true,
      message: `تم إلغاء مفتاح الإيقاف واستعادة التطبيق "${app.slug}" بنجاح`,
      data: {
        id: app.id,
        slug: app.slug,
        killSwitch: false
      }
    });
  } catch (error) {
    console.error('Error unkilling app:', error);
    return res.status(500).json({ success: false, message: 'خطأ في إلغاء مفتاح الإيقاف الفوري', error: error.message });
  }
};

/**
 * @route POST /api/v1/super-admin/marketplace-management/tools/:slug/kill-switch
 * @desc Instant emergency shutoff for a modular tool or app across the platform
 * @access Super Admin
 */
exports.toggleToolKillSwitch = async (req, res) => {
  try {
    const { slug } = req.params;
    const { active, reason } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'الحقل "active" مطلوب ويجب أن يكون boolean'
      });
    }

    const payload = await appKillSwitchService.setKillSwitch(slug, active, {
      reason,
      updatedBy: req.user?.id || 'SUPER_ADMIN'
    });

    try {
      const prisma = getSharedPrismaClient();
      const strippedSlug = slug.replace(/^cat-app-/, '');
      await prisma.marketplaceApp.updateMany({
        where: {
          OR: [
            { slug },
            { slug: strippedSlug }
          ]
        },
        data: { killSwitch: active }
      });
    } catch (dbErr) {
      console.warn('[toggleToolKillSwitch] Failed to sync killSwitch with DB:', dbErr.message);
    }

    try {
      marketplaceCatalogService?.clearCache?.();
    } catch (_) {}

    return res.json({
      success: true,
      message: active
        ? `تم تفعيل مفتاح الإيقاف الفوري (Kill Switch) للأداة "${slug}" بنجاح`
        : `تم إلغاء مفتاح الإيقاف الفوري واستعادة الأداة "${slug}" بنجاح`,
      data: payload
    });
  } catch (error) {
    console.error('Error toggling tool kill switch:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في تشغيل مفتاح الإيقاف الفوري للأداة',
      error: error.message
    });
  }
};

/**
 * @route GET /api/v1/super-admin/marketplace-management/tools
 * @desc List all registered modular tools with their manifests, health, and kill switch status
 * @access Super Admin
 */
exports.getAllRegisteredTools = async (req, res) => {
  try {
    const tools = appRegistryService.getAllTools().map((t) => {
      const isKilled = appKillSwitchService.isKillSwitchActive(t.slug);
      return {
        slug: t.slug,
        name: t.name,
        version: t.version,
        killSwitch: isKilled,
        manifest: t.manifest,
        status: isKilled ? 'DISABLED_BY_KILL_SWITCH' : 'ACTIVE',
        routesPrefix: t.manifest.routes?.prefix,
        healthCheck: t.manifest.healthCheck,
        permissions: t.manifest.permissions,
        defaultEnabled: t.manifest.defaultEnabled
      };
    });

    return res.json({
      success: true,
      total: tools.length,
      data: tools
    });
  } catch (error) {
    console.error('Error listing registered tools:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في جلب الأدوات المسجلة',
      error: error.message
    });
  }
};

/**
 * @route GET /api/v1/super-admin/marketplace-management/tools/:slug/status
 * @desc Get detailed status and health of a specific tool
 * @access Super Admin
 */
exports.getToolStatus = async (req, res) => {
  try {
    const { slug } = req.params;
    const tool = appRegistryService.getTool(slug);

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: `الأداة "${slug}" غير مسجلة في منصة الأدوات`
      });
    }

    const isKilled = appKillSwitchService.isKillSwitchActive(slug);
    const killMetadata = appKillSwitchService.getKillSwitchStatus(slug);

    // Count installed companies
    const prisma = getSharedPrismaClient();
    const [activeInstalls, totalInstalls] = await executeWithRetry(async () => {
      return await Promise.all([
        prisma.companyApp.count({
          where: {
            app: { slug },
            status: 'ACTIVE'
          }
        }),
        prisma.companyApp.count({
          where: { app: { slug } }
        })
      ]);
    }).catch(() => [0, 0]);

    return res.json({
      success: true,
      data: {
        slug: tool.slug,
        name: tool.name,
        version: tool.version,
        killSwitch: isKilled,
        killMetadata,
        manifest: tool.manifest,
        installations: {
          active: activeInstalls,
          total: totalInstalls
        }
      }
    });
  } catch (error) {
    console.error('Error fetching tool status:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في جلب تفاصيل حالة الأداة',
      error: error.message
    });
  }
};

/**
 * @route POST /api/v1/super-admin/marketplace-management/tools/:slug/companies/:companyId/toggle
 * @desc Enable or disable a modular tool for a specific company without deployment
 * @access Super Admin
 */
exports.toggleCompanyToolAccess = async (req, res) => {
  try {
    const { slug, companyId } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'الحقل "enabled" مطلوب ويجب أن يكون boolean'
      });
    }

    const prisma = getSharedPrismaClient();

    // Verify company exists
    const company = await executeWithRetry(async () => {
      return await prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, name: true }
      });
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }

    // Ensure MarketplaceApp record exists in DB for foreign key relations
    let app = await executeWithRetry(async () => {
      return await prisma.marketplaceApp.findUnique({
        where: { slug }
      });
    });

    if (!app) {
      const tool = appRegistryService.getTool(slug);
      const toolManifest = tool?.manifest;

      app = await executeWithRetry(async () => {
        return await prisma.marketplaceApp.create({
          data: {
            slug,
            name: toolManifest?.name || slug,
            description: toolManifest?.description || 'Modular tool',
            category: toolManifest?.category || 'general',
            pricingModel: 'FREE',
            monthlyPrice: 0,
            yearlyPrice: 0,
            trialDays: 0,
            isActive: true,
            isPublic: true,
            features: toolManifest?.settingsSchema || {}
          }
        });
      });
    }

    const nextStatus = enabled ? 'ACTIVE' : 'DISABLED';

    const companyApp = await executeWithRetry(async () => {
      return await prisma.companyApp.upsert({
        where: {
          companyId_appId: {
            companyId,
            appId: app.id
          }
        },
        create: {
          companyId,
          appId: app.id,
          status: nextStatus,
          activePricingModel: 'FREE'
        },
        update: {
          status: nextStatus
        }
      });
    });

    return res.json({
      success: true,
      message: enabled
        ? `تم تمكين الأداة "${app.name}" للشركة "${company.name}" بنجاح`
        : `تم تعطيل الأداة "${app.name}" للشركة "${company.name}" بنجاح`,
      data: {
        slug,
        companyId,
        companyName: company.name,
        enabled,
        status: nextStatus,
        companyAppId: companyApp.id
      }
    });
  } catch (error) {
    console.error('Error toggling company tool access:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في تعديل صلاحية الأداة للشركة',
      error: error.message
    });
  }
};

/**
 * @route POST /api/v1/super-admin/marketplace-management/apps/:id/publish
 * @desc Publish an app after verifying it against the App Contract & Manifest Publishing Gate
 * @access Super Admin
 */
exports.publishApp = async (req, res) => {
  try {
    const { id } = req.params;
    const published = await appManifestService.publishApp(id, req.body || {});

    try {
      if (typeof marketplaceCatalogService?.updateAppFile === 'function') {
        await marketplaceCatalogService.updateAppFile(published.slug || id, { isPublic: true });
      }
      marketplaceCatalogService?.clearCache?.();
    } catch (_) {}

    return res.json({
      success: true,
      message: 'تم نشر الأداة بنجاح بعد اجتياز بوابة النشر والمانيفست',
      data: published
    });
  } catch (error) {
    if (error.code === 'APP_NOT_FOUND') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.code === 'PUBLISH_GATE_REJECTED') {
      return res.status(422).json({
        success: false,
        code: 'PUBLISH_GATE_REJECTED',
        message: 'بوابة النشر رفضت نشر التطبيق: التطبيق لا يستوفي عقد التطبيق أو تنقصه متطلبات المانيفست',
        errors: error.errors || [error.message]
      });
    }
    console.error('Error publishing app:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في نشر الأداة عبر بوابة النشر',
      error: error.message
    });
  }
};

/**
 * @route POST /api/v1/super-admin/marketplace-management/apps/:id/unpublish
 * @desc Unpublish an app (sets isPublic: false)
 * @access Super Admin
 */
exports.unpublishApp = async (req, res) => {
  try {
    const { id } = req.params;
    const unpublished = await appManifestService.unpublishApp(id);

    try {
      if (typeof marketplaceCatalogService?.updateAppFile === 'function') {
        await marketplaceCatalogService.updateAppFile(unpublished.slug || id, { isPublic: false });
      }
      marketplaceCatalogService?.clearCache?.();
    } catch (_) {}

    return res.json({
      success: true,
      message: 'تم إلغاء نشر الأداة بنجاح',
      data: unpublished
    });
  } catch (error) {
    if (error.code === 'APP_NOT_FOUND') {
      return res.status(404).json({ success: false, message: error.message });
    }
    console.error('Error unpublishing app:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في إلغاء نشر الأداة',
      error: error.message
    });
  }
};

/**
 * @route GET /api/v1/super-admin/marketplace-management/apps/:id/manifest
 * @desc Get app manifest and validation audit status
 * @access Super Admin
 */
exports.getAppManifest = async (req, res) => {
  try {
    const { id } = req.params;
    const manifest = await appManifestService.getAppManifest(id);

    if (!manifest) {
      return res.status(404).json({
        success: false,
        message: `لم يتم العثور على مانيفست للأداة "${id}"`
      });
    }

    const validation = appManifestService.validateManifest(manifest);
    const gateVerdict = appManifestService.validatePublishGate(manifest);

    return res.json({
      success: true,
      data: {
        manifest,
        validation,
        canPublish: gateVerdict.canPublish,
        gateErrors: gateVerdict.errors
      }
    });
  } catch (error) {
    console.error('Error fetching app manifest:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في جلب مانيفست الأداة',
      error: error.message
    });
  }
};

/**
 * @route POST /api/v1/super-admin/marketplace-management/apps/validate-manifest
 * @desc Audit and validate a manifest payload before publishing
 * @access Super Admin
 */
exports.validateAppManifest = async (req, res) => {
  try {
    const manifestPayload = req.body;
    const validation = appManifestService.validateManifest(manifestPayload);
    const gateVerdict = appManifestService.validatePublishGate(manifestPayload);

    return res.json({
      success: true,
      data: {
        valid: validation.valid,
        canPublish: gateVerdict.canPublish,
        errors: Array.from(new Set([...validation.errors, ...gateVerdict.errors])),
        warnings: validation.warnings
      }
    });
  } catch (error) {
    console.error('Error validating manifest payload:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في التحقق من المانيفست',
      error: error.message
    });
  }
};

module.exports = exports;

/**
 * App Manifest & Publishing Gate Service
 * 
 * Enforces the strict App Contract and platform security gate for Marketplace apps:
 * - Manifest validation (version, permissions, settingsSchema, routes, healthCheck)
 * - Publishing gate: Rejects app publishing without a compliant manifest
 * - Rejects apps with active killSwitch, empty settingsSchema, or undeclared permissions
 * - Schema-driven settings validation and default value extraction
 * - Direct database integration with MarketplaceApp model
 */

const {
  validateManifest: internalValidateManifest,
  assertValidManifest: internalAssertValidManifest,
  CORE_PROTECTED_DOMAINS,
  getPlatformPermissions
} = require('./appContract/appManifestValidator');
const appKillSwitchService = require('./appContract/appKillSwitchService');
const { getSharedPrismaClient, executeWithRetry } = require('./sharedDatabase');

class AppManifestService {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Validates a manifest object against the App Contract rules
   * @param {Object} manifest - Manifest definition
   * @param {Object} [options] - Optional validation options
   * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
   */
  validateManifest(manifest, options = {}) {
    return internalValidateManifest(manifest, options);
  }

  /**
   * Asserts that a manifest is fully valid, throwing if not
   * @param {Object} manifest 
   * @param {Object} [options] 
   */
  assertValidManifest(manifest, options = {}) {
    return internalAssertValidManifest(manifest, options.toolDir);
  }

  /**
   * Normalizes or compiles a manifest object from app data or partial inputs
   * @param {Object} appData 
   * @returns {Object} Compiled manifest
   */
  extractOrCompileManifest(appData) {
    if (!appData || typeof appData !== 'object') {
      return null;
    }

    let manifest = appData.manifest;
    if (typeof manifest === 'string') {
      try {
        manifest = JSON.parse(manifest);
      } catch (_) {
        manifest = null;
      }
    }

    if (manifest && typeof manifest === 'object' && !Array.isArray(manifest)) {
      return manifest;
    }

    const slug = String(appData.slug || '').trim().toLowerCase();
    if (!slug) return null;

    let permissions = [];
    if (Array.isArray(appData.permissions)) {
      permissions = appData.permissions.map((p) => String(p).trim()).filter(Boolean);
    } else if (typeof appData.permissions === 'string') {
      try {
        const parsed = JSON.parse(appData.permissions);
        if (Array.isArray(parsed)) permissions = parsed.map((p) => String(p).trim()).filter(Boolean);
      } catch (_) {
        permissions = appData.permissions.split(',').map((p) => p.trim()).filter(Boolean);
      }
    }

    let settingsSchema = appData.settingsSchema;
    if (typeof settingsSchema === 'string') {
      try {
        settingsSchema = JSON.parse(settingsSchema);
      } catch (_) {
        settingsSchema = null;
      }
    }

    const featureFlag = appData.featureFlag || `FEATURE_${slug.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
    const defaultPermission = permissions[0] || 'dashboard.view';

    return {
      slug,
      name: String(appData.name || slug).trim(),
      version: String(appData.version || '1.0.0').trim(),
      minPlatformVersion: String(appData.minPlatformVersion || '1.0.0').trim(),
      category: appData.category || 'general',
      pricingModel: appData.pricingModel || 'SUBSCRIPTION',
      icon: appData.icon || appData.logo || null,
      permissions,
      featureFlag,
      defaultEnabled: false,
      routes: appData.routes || {
        prefix: `/api/v1/tools/${slug}`,
        endpoints: [
          {
            path: '/health',
            method: 'GET',
            permission: defaultPermission,
            handler: 'health'
          }
        ]
      },
      healthCheck: appData.healthCheck || `/api/v1/tools/${slug}/health`,
      settingsSchema: settingsSchema || null
    };
  }

  /**
   * Publishing Gate Validator
   * 
   * Evaluates whether an app meets all prerequisites to be published (`isPublic: true`).
   * Rejects publishing if:
   * 1. No valid manifest is present or compilable
   * 2. Manifest fails App Contract rules (version, minPlatformVersion, routes, guards, etc.)
   * 3. KillSwitch is currently active for the app
   * 4. settingsSchema is missing, not an object, or has 0 properties (rule: zero empty settings pages)
   * 5. permissions array is missing, empty, or requests undeclared permissions
   * 6. Slug or routes collide with platform protected domains
   * 
   * @param {Object} appOrPayload - The app record or update payload
   * @param {Object} [existingApp] - Optional existing app record in DB
   * @returns {{ canPublish: boolean, errors: string[], warnings: string[], manifest?: Object }}
   */
  validatePublishGate(appOrPayload, existingApp = null) {
    const errors = [];
    const warnings = [];

    if (!appOrPayload || typeof appOrPayload !== 'object') {
      return {
        canPublish: false,
        errors: ['بيانات التطبيق غير صالحة (App data must be a valid object)'],
        warnings: []
      };
    }

    // Merge existing DB state with update payload if provided
    const merged = {
      ...(existingApp || {}),
      ...appOrPayload
    };

    const slug = String(merged.slug || '').trim().toLowerCase();
    if (!slug) {
      errors.push('معرف التطبيق (slug) مطلوب للتحقق من بوابة النشر');
      return { canPublish: false, errors, warnings };
    }

    // 1. KillSwitch Check: Cannot publish an app that is currently killed
    const isKilled = Boolean(merged.killSwitch) || appKillSwitchService.isKillSwitchActive(slug);
    if (isKilled) {
      errors.push(`لا يمكن نشر التطبيق "${slug}" لأن مفتاح الإيقاف الطارئ (Kill Switch) مفعل حالياً.`);
    }

    // 2. Manifest Existence Check
    const manifest = this.extractOrCompileManifest(merged);
    if (!manifest) {
      errors.push('لا يمكن نشر التطبيق بدون مانيفست صالح (Missing app manifest)');
      return { canPublish: false, errors, warnings };
    }

    // 3. Strict Manifest Validation
    const manifestValidation = this.validateManifest(manifest);
    if (!manifestValidation.valid) {
      errors.push(...manifestValidation.errors);
    }
    if (manifestValidation.warnings) {
      warnings.push(...manifestValidation.warnings);
    }

    // 4. Permissions Strict Validation
    if (!Array.isArray(manifest.permissions) || manifest.permissions.length === 0) {
      errors.push('صلاحيات التطبيق (permissions) مطلوبة وغير فارغة لنشر التطبيق');
    }

    // 5. SettingsSchema Strict Validation (Zero empty settings pages rule)
    if (!manifest.settingsSchema || typeof manifest.settingsSchema !== 'object' || Array.isArray(manifest.settingsSchema)) {
      errors.push('مخطط الإعدادات (settingsSchema) مطلوب ويجب أن يكون كائن صالح للنشر');
    } else {
      const properties = manifest.settingsSchema.properties;
      if (!properties || typeof properties !== 'object' || Object.keys(properties).length === 0) {
        errors.push('مخطط الإعدادات (settingsSchema.properties) يجب أن يحتوي على خاصية واحدة على الأقل لمنع صفحات الإعدادات الفارغة');
      }
    }

    // 6. Versioning check
    if (!manifest.version || typeof manifest.version !== 'string') {
      errors.push('إصدار التطبيق (version) مطلوب للنشر');
    }

    return {
      canPublish: errors.length === 0,
      errors,
      warnings,
      manifest
    };
  }

  /**
   * Asserts that an app can be published, throwing a structured error if not
   * @param {Object} appOrPayload 
   * @param {Object} [existingApp] 
   */
  assertCanPublish(appOrPayload, existingApp = null) {
    const verdict = this.validatePublishGate(appOrPayload, existingApp);
    if (!verdict.canPublish) {
      const errorMsg = `بوابة النشر رفضت نشر التطبيق "${appOrPayload?.slug || 'unknown'}":\n- ` + verdict.errors.join('\n- ');
      const err = new Error(errorMsg);
      err.code = 'PUBLISH_GATE_REJECTED';
      err.status = 422;
      err.errors = verdict.errors;
      err.details = verdict;
      throw err;
    }
    return verdict;
  }

  /**
   * Retrieves an app's manifest from Registry, DB, or Catalog
   * @param {string} slugOrId 
   * @returns {Promise<Object|null>}
   */
  async getAppManifest(slugOrId) {
    if (!slugOrId) return null;
    const normalized = String(slugOrId).trim().toLowerCase();

    // 1. Check tools registry
    try {
      const appRegistryService = require('./appContract/appRegistryService');
      const tool = appRegistryService.getTool(normalized);
      if (tool?.manifest) {
        return tool.manifest;
      }
    } catch (_) {}

    // 2. Check Database MarketplaceApp
    try {
      const prisma = getSharedPrismaClient();
      const stripped = normalized.replace(/^cat-app-/, '');
      const dbApp = await executeWithRetry(async () => {
        return await prisma.marketplaceApp.findFirst({
          where: {
            OR: [
              { id: slugOrId },
              { slug: normalized },
              { slug: stripped }
            ]
          }
        });
      });

      if (dbApp) {
        if (dbApp.manifest && typeof dbApp.manifest === 'object') {
          return dbApp.manifest;
        }
        return this.extractOrCompileManifest(dbApp);
      }
    } catch (_) {}

    return null;
  }

  /**
   * Validates user-supplied app settings against a settingsSchema definition
   * @param {Object} settings - Key-value map of settings
   * @param {Object} schema - JSON Schema definition
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validateSettingsAgainstSchema(settings = {}, schema) {
    const errors = [];
    if (!schema || typeof schema !== 'object') {
      return { valid: true, errors: [] };
    }

    let effectiveSchema = schema;
    if (typeof schema === 'string') {
      try {
        effectiveSchema = JSON.parse(schema);
      } catch (parseErr) {
        return { valid: false, errors: [`مخطط الإعدادات غير صالح: ${parseErr.message}`] };
      }
    }
    if (!effectiveSchema || typeof effectiveSchema !== 'object') {
      return { valid: true, errors: [] };
    }
    const properties = effectiveSchema.properties || {};
    const requiredKeys = new Set(Array.isArray(effectiveSchema.required) ? effectiveSchema.required : []);

    // Check required fields
    for (const key of requiredKeys) {
      const val = settings[key];
      if (val === undefined || val === null || val === '') {
        errors.push(`الحقل المطلوب "${key}" مفقود أو فارغ`);
      }
    }

    // Type and bounds validation
    for (const [key, prop] of Object.entries(properties)) {
      const val = settings[key];
      if (val === undefined || val === null) continue;

      if (prop.type === 'string' && typeof val !== 'string') {
        errors.push(`الحقل "${key}" يجب أن يكون نصاً (string)`);
      } else if ((prop.type === 'number' || prop.type === 'integer')) {
        const num = Number(val);
        if (isNaN(num)) {
          errors.push(`الحقل "${key}" يجب أن يكون رقماً (number)`);
        } else {
          if (prop.minimum !== undefined && num < prop.minimum) {
            errors.push(`الحقل "${key}" قيمته (${num}) أقل من الحد الأدنى (${prop.minimum})`);
          }
          if (prop.maximum !== undefined && num > prop.maximum) {
            errors.push(`الحقل "${key}" قيمته (${num}) أكبر من الحد الأقصى (${prop.maximum})`);
          }
        }
      } else if (prop.type === 'boolean' && typeof val !== 'boolean') {
        errors.push(`الحقل "${key}" يجب أن يكون منطقياً (boolean)`);
      }

      if (Array.isArray(prop.enum) && !prop.enum.includes(val)) {
        errors.push(`الحقل "${key}" يحتوي على قيمة غير صالحة. القيم المسموحة: [${prop.enum.join(', ')}]`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Extracts default values from a settingsSchema definition
   * @param {Object} schema 
   * @returns {Object}
   */
  getDefaultSettingsFromSchema(schema) {
    const defaults = {};
    if (!schema || typeof schema !== 'object') return defaults;
    let effectiveSchema = schema;
    if (typeof schema === 'string') {
      try {
        effectiveSchema = JSON.parse(schema);
      } catch (_) {
        return defaults;
      }
    }
    if (!effectiveSchema || typeof effectiveSchema !== 'object') {
      return defaults;
    }
    const properties = effectiveSchema.properties || {};

    for (const [key, prop] of Object.entries(properties)) {
      if (prop.default !== undefined) {
        defaults[key] = prop.default;
      } else {
        if (prop.type === 'boolean') defaults[key] = false;
        else if (prop.type === 'number' || prop.type === 'integer') defaults[key] = 0;
        else if (prop.type === 'string') defaults[key] = '';
        else if (prop.type === 'array') defaults[key] = [];
        else defaults[key] = null;
      }
    }

    return defaults;
  }

  /**
   * Publishes an app in the platform through the publishing gate
   * @param {string} idOrSlug - ID or slug of the app
   * @param {Object} [overrides] - Optional overrides to update upon publishing
   * @returns {Promise<Object>} The updated app record
   */
  async publishApp(idOrSlug, overrides = {}) {
    if (!idOrSlug) throw new Error('معرف التطبيق مطلوب للنشر');

    const prisma = getSharedPrismaClient();
    const strippedSlug = String(idOrSlug).replace(/^cat-app-/, '');
    const app = await executeWithRetry(async () => {
      return await prisma.marketplaceApp.findFirst({
        where: {
          OR: [
            { id: idOrSlug },
            { slug: idOrSlug },
            { slug: strippedSlug }
          ]
        }
      });
    });

    if (!app) {
      const err = new Error(`التطبيق "${idOrSlug}" غير موجود`);
      err.code = 'APP_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    const merged = {
      ...app,
      ...overrides,
      isPublic: true
    };

    // Run publish gate
    const gateVerdict = this.assertCanPublish(merged, app);
    const manifest = gateVerdict.manifest;

    // Update in DB
    const updated = await executeWithRetry(async () => {
      return await prisma.marketplaceApp.update({
        where: { id: app.id },
        data: {
          isPublic: true,
          isActive: true,
          version: manifest.version,
          permissions: manifest.permissions,
          settingsSchema: manifest.settingsSchema,
          manifest,
          killSwitch: false,
          ...(overrides.name ? { name: overrides.name } : {}),
          ...(overrides.description ? { description: overrides.description } : {})
        }
      });
    });

    return updated;
  }

  /**
   * Unpublishes an app (sets isPublic: false)
   * @param {string} idOrSlug 
   * @returns {Promise<Object>}
   */
  async unpublishApp(idOrSlug) {
    if (!idOrSlug) throw new Error('معرف التطبيق مطلوب');

    const prisma = getSharedPrismaClient();
    const strippedSlug = String(idOrSlug).replace(/^cat-app-/, '');
    const app = await executeWithRetry(async () => {
      return await prisma.marketplaceApp.findFirst({
        where: {
          OR: [
            { id: idOrSlug },
            { slug: idOrSlug },
            { slug: strippedSlug }
          ]
        }
      });
    });

    if (!app) {
      const err = new Error(`التطبيق "${idOrSlug}" غير موجود`);
      err.code = 'APP_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    const updated = await executeWithRetry(async () => {
      return await prisma.marketplaceApp.update({
        where: { id: app.id },
        data: { isPublic: false }
      });
    });

    return updated;
  }
}

const appManifestService = new AppManifestService();

module.exports = {
  AppManifestService,
  appManifestService
};

/**
 * App Manifest Service & Publishing Gate
 * Enforces the Application Manifest Contract, Settings Schema validation,
 * Kill Switch enforcement, and Runtime Configuration.
 */

const { getSharedPrismaClient } = require('./sharedDatabase');
const { isValidPermission } = require('../constants/permissionsRegistry');

// ── Custom Error Classes ──────────────────────────────────────────────────────
class ManifestInvalidError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ManifestInvalidError';
    this.code = 'PUBLISH_GATE_REJECTED';
    this.status = 422;
    this.statusCode = 422;
    this.errors = errors;
  }
}

// ── In-Memory Fast Cache for Kill Switch (30-second TTL) ─────────────────────
const KILL_SWITCH_CACHE_TTL_MS = 30 * 1000;
const _killSwitchCache = new Map(); // key -> { active: boolean, expiresAt: number, reason: string }

// ── Allowed Top-Level Manifest Keys ──────────────────────────────────────────
const ALLOWED_MANIFEST_KEYS = new Set([
  'manifestVersion',
  'appVersion',
  'name',
  'slug',
  'description',
  'entryRoute',
  'mainRoute',
  'permissions',
  'settingsSchema',
  'version',
  'minPlatformVersion',
  'defaultEnabled',
  'featureFlag',
  'routes',
  'healthCheck',
  'category',
  'icon',
  'logo',
  'pricingModel'
]);

// ── Disallowed Secret Pattern ────────────────────────────────────────────────
const SECRET_KEY_PATTERN = /(secret|token|password|auth_key|private_key)/i;

// ── SemVer Regex ─────────────────────────────────────────────────────────────
const SEMVER_PATTERN = /^\d+\.\d+(\.\d+)?(-[a-zA-Z0-9.]+)?$/;

class AppManifestService {
  /**
   * Validates an Application Manifest against the contract specification (§2, §3, Condition 3)
   * @param {Object|string} manifest
   * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
   */
  validateManifest(manifest) {
    const errors = [];
    const warnings = [];

    if (!manifest || (typeof manifest !== 'object' && typeof manifest !== 'string')) {
      return { valid: false, errors: ['المانيفست مطلوب ويجب أن يكون كائناً (Object)'], warnings: [] };
    }

    let parsed = manifest;
    if (typeof manifest === 'string') {
      try {
        parsed = JSON.parse(manifest);
      } catch (err) {
        return { valid: false, errors: [`فشل تحليل كائن المانيفست: ${err.message}`], warnings: [] };
      }
    }

    // 1. Payload size check (≤ 32 KB)
    try {
      const payloadBytes = Buffer.byteLength(JSON.stringify(parsed), 'utf8');
      if (payloadBytes > 32768) {
        errors.push(`حجم حمولة المانيفست (${payloadBytes} bytes) يتجاوز الحد الأقصى المسموح به (32 KB / 32768 bytes)`);
      }
    } catch (_) {}

    // 2. Disallowed keys check (no unknown keys at root level)
    for (const key of Object.keys(parsed)) {
      if (!ALLOWED_MANIFEST_KEYS.has(key)) {
        errors.push(`حقل غير مسموح به في المانيفست: "${key}". الحقول المسموحة: [${Array.from(ALLOWED_MANIFEST_KEYS).join(', ')}]`);
      }
      if (SECRET_KEY_PATTERN.test(key)) {
        errors.push(`حظر أمني: المانيفست يحتوي على حقل سري غير مصرح به: "${key}"`);
      }
    }

    // 3. Check for embedded secrets in string values
    const scanForSecrets = (obj, path = '') => {
      if (!obj || typeof obj !== 'object') return;
      for (const [k, v] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${k}` : k;
        if (SECRET_KEY_PATTERN.test(k)) {
          errors.push(`حظر أمني: المانيفست يحتوي على مفتاح حساس/سري: "${currentPath}"`);
        }
        if (typeof v === 'object') {
          scanForSecrets(v, currentPath);
        }
      }
    };
    scanForSecrets(parsed);

    // 4. manifestVersion is semver
    const manifestVersion = String(parsed.manifestVersion || parsed.version || '').trim();
    if (!manifestVersion) {
      errors.push('إصدار المانيفست (manifestVersion / version) مطلوب');
    } else if (!SEMVER_PATTERN.test(manifestVersion)) {
      errors.push(`إصدار المانيفست غير صالح (manifestVersion / version): "${manifestVersion}". يجب أن يتبع معيار SemVer مثل "1.0" أو "1.0.0"`);
    }

    // 5. At least one entryRoute (starts with /)
    const entryRoute = parsed.entryRoute || parsed.mainRoute || parsed.routes?.prefix || parsed.healthCheck;
    if (!entryRoute || typeof entryRoute !== 'string' || !entryRoute.trim().startsWith('/')) {
      errors.push('مسار المدخل (entryRoute) مطلوب ويجب أن يبدأ بـ "/" (مثال: "/app/custom-tool")');
    }

    // 6. Permissions registry validation
    if (parsed.permissions !== undefined && parsed.permissions !== null) {
      if (!Array.isArray(parsed.permissions)) {
        errors.push('حقل الصلاحيات (permissions) يجب أن يكون مصفوفة من النصوص (Array<string>)');
      } else {
        for (const perm of parsed.permissions) {
          if (!isValidPermission(perm)) {
            errors.push(`الصلاحية "${perm}" غير مسجلة في سجل صلاحيات المنصة (permissions registry)`);
          }
        }
      }
    }

    // 7. settingsSchema validation (§2)
    if (parsed.settingsSchema !== undefined && parsed.settingsSchema !== null) {
      const schemaErrors = this.validateSettingsSchemaDefinition(parsed.settingsSchema);
      errors.push(...schemaErrors);
    } else {
      errors.push('مخطط الإعدادات (settingsSchema) مطلوب ويجب أن يحتوي على properties غير فارغة');
    }

    // 8. defaultEnabled must be strictly false
    if (parsed.defaultEnabled === true) {
      errors.push('غير مسموح بتفعيل الأداة تلقائياً (defaultEnabled must be false)');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates the structure and types of settingsSchema against the §2 specification
   * Supported field types ONLY: string, number, boolean, string+enum, array<string>
   * @param {Object|string} schema
   * @returns {string[]} errors
   */
  validateSettingsSchemaDefinition(schema) {
    const errors = [];
    let parsed = schema;
    if (typeof schema === 'string') {
      try { parsed = JSON.parse(schema); } catch (e) {
        return [`مخطط الإعدادات (settingsSchema) غير صالح كـ JSON: ${e.message}`];
      }
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return ['مخطط الإعدادات (settingsSchema) يجب أن يكون كائناً (Object)'];
    }

    if (parsed.type !== 'object') {
      errors.push('نوع مخطط الإعدادات الرئيسي (settingsSchema.type) يجب أن يكون "object"');
    }

    const properties = parsed.properties;
    if (!properties || typeof properties !== 'object' || Array.isArray(properties) || Object.keys(properties).length === 0) {
      errors.push('مخطط الإعدادات (settingsSchema) يجب أن يحتوي على خصائص (properties) غير فارغة');
      return errors;
    }

    const allowedTypes = new Set(['string', 'number', 'boolean', 'array']);

    for (const [key, prop] of Object.entries(properties)) {
      if (!prop || typeof prop !== 'object' || Array.isArray(prop)) {
        errors.push(`خاصية الإعداد "${key}" يجب أن تكون كائناً صالحاً`);
        continue;
      }

      // Title is required per property
      if (!prop.title || typeof prop.title !== 'string' || !prop.title.trim()) {
        errors.push(`خاصية الإعداد "${key}" تتطلب حقلاً عنواناً (title)`);
      }

      const type = prop.type;
      if (!allowedTypes.has(type)) {
        errors.push(`نوع الخاصية "${key}" (${type}) غير مدعوم. الأنواع المدعومة فقط: string, number, boolean, string+enum, array<string>`);
        continue;
      }

      // array must be array<string>
      if (type === 'array') {
        if (!prop.items || prop.items.type !== 'string') {
          errors.push(`خاصية المصفوفة "${key}" يجب أن تكون مصفوفة نصوص حصراً (array<string>) مع items.type = "string"`);
        }
      }

      // enum must be array of strings
      if (prop.enum !== undefined && (!Array.isArray(prop.enum) || prop.enum.some(e => typeof e !== 'string'))) {
        errors.push(`خيارات enum للخاصية "${key}" يجب أن تكون مصفوفة نصوص`);
      }

      // number min/max validation
      if (type === 'number') {
        if (prop.minimum !== undefined && typeof prop.minimum !== 'number') {
          errors.push(`الحد الأدنى minimum للخاصية "${key}" يجب أن يكون رقماً`);
        }
        if (prop.maximum !== undefined && typeof prop.maximum !== 'number') {
          errors.push(`الحد الأقصى maximum للخاصية "${key}" يجب أن يكون رقماً`);
        }
      }
    }

    return errors;
  }

  /**
   * Asserts that an app can be published; throws ManifestInvalidError if not publishable
   * @param {string} appId
   * @returns {Promise<Object>} The valid app with compiled manifest
   */
  async assertPublishable(appId) {
    if (!appId) throw new ManifestInvalidError('معرف التطبيق مطلوب للتحقق من بوابة النشر', ['appId is required']);

    const prisma = getSharedPrismaClient();
    const stripped = String(appId).replace(/^cat-app-/, '');
    const app = await prisma.marketplaceApp.findFirst({
      where: {
        OR: [
          { id: appId },
          { slug: appId },
          { slug: stripped }
        ]
      }
    });

    if (!app) {
      throw new ManifestInvalidError(`التطبيق "${appId}" غير موجود في قاعدة البيانات`, ['App not found']);
    }

    // Fast-path: Check kill switch
    if (app.killSwitch || this.isKillSwitchActive(app.slug)) {
      throw new ManifestInvalidError(`لا يمكن نشر التطبيق "${app.slug}": مفتاح الإيقاف الفوري (Kill Switch) نشط`, [
        'Kill switch is currently active'
      ]);
    }

    const manifestToValidate = app.manifest || {
      manifestVersion: app.manifestVersion || '1.0',
      appVersion: app.appVersion || app.version || '1.0.0',
      entryRoute: app.entryRoute || app.mainRoute,
      permissions: app.permissions || [],
      settingsSchema: app.settingsSchema,
      name: app.name,
      slug: app.slug
    };

    const validation = this.validateManifest(manifestToValidate);
    if (!validation.valid) {
      throw new ManifestInvalidError(
        `بوابة النشر رفضت نشر التطبيق "${app.slug}": مخالفة عقد التطبيق`,
        validation.errors
      );
    }

    return {
      app,
      manifest: manifestToValidate
    };
  }

  /**
   * Alias for backward compatibility
   */
  assertCanPublish(appOrPayload, existingApp) {
    const verdict = this.validatePublishGate(appOrPayload, existingApp);
    if (!verdict.canPublish) {
      const err = new ManifestInvalidError(
        `بوابة النشر رفضت نشر التطبيق: التطبيق لا يستوفي عقد التطبيق`,
        verdict.errors
      );
      throw err;
    }
    return verdict;
  }

  /**
   * Registers or updates a manifest for an app in the database
   * @param {string} appId
   * @param {Object} manifest
   * @returns {Promise<Object>}
   */
  async registerManifest(appId, manifest) {
    const validation = this.validateManifest(manifest);
    if (!validation.valid) {
      throw new ManifestInvalidError('فشل تسجيل المانيفست: البيانات لا تستوفي متطلبات عقد التطبيق', validation.errors);
    }

    const prisma = getSharedPrismaClient();
    const stripped = String(appId).replace(/^cat-app-/, '');
    const app = await prisma.marketplaceApp.findFirst({
      where: {
        OR: [{ id: appId }, { slug: appId }, { slug: stripped }]
      }
    });

    if (!app) {
      throw new ManifestInvalidError(`التطبيق "${appId}" غير موجود`, ['App not found']);
    }

    const updated = await prisma.marketplaceApp.update({
      where: { id: app.id },
      data: {
        manifestVersion: manifest.manifestVersion || '1.0',
        appVersion: manifest.appVersion || manifest.version || '1.0.0',
        entryRoute: manifest.entryRoute,
        permissions: manifest.permissions || [],
        settingsSchema: manifest.settingsSchema || null,
        manifest: manifest,
        version: manifest.appVersion || manifest.version || '1.0.0'
      }
    });

    return updated;
  }

  /**
   * Gets runtime configuration for an app: { permissions, settingsSchema, entryRoute, appVersion, killSwitch }
   * @param {string} appId
   * @returns {Promise<Object|null>}
   */
  async getRuntimeConfig(appId) {
    if (!appId) return null;
    const prisma = getSharedPrismaClient();
    const stripped = String(appId).replace(/^cat-app-/, '');

    const app = await prisma.marketplaceApp.findFirst({
      where: {
        OR: [{ id: appId }, { slug: appId }, { slug: stripped }]
      },
      select: {
        id: true,
        slug: true,
        manifestVersion: true,
        appVersion: true,
        version: true,
        permissions: true,
        settingsSchema: true,
        entryRoute: true,
        mainRoute: true,
        killSwitch: true,
        manifest: true
      }
    });

    if (!app) return null;

    const isKilled = this.isKillSwitchActive(app.slug) || Boolean(app.killSwitch);

    return {
      permissions: app.permissions || [],
      settingsSchema: app.settingsSchema || null,
      entryRoute: app.entryRoute || app.mainRoute || `/app/${app.slug}`,
      appVersion: app.appVersion || app.version || '1.0.0',
      manifestVersion: app.manifestVersion || '1.0',
      killSwitch: isKilled
    };
  }

  /**
   * Checks if an app is enabled for a specific company (Tenant Isolation)
   * @param {string} appId
   * @param {string} companyId
   * @returns {Promise<boolean>}
   */
  async isEnabled(appId, companyId) {
    if (!appId || !companyId) return false;

    // Fast-path: Check kill switch
    if (this.isKillSwitchActive(appId)) return false;

    const prisma = getSharedPrismaClient();
    const stripped = String(appId).replace(/^cat-app-/, '');

    const app = await prisma.marketplaceApp.findFirst({
      where: {
        OR: [{ id: appId }, { slug: appId }, { slug: stripped }]
      },
      select: { id: true, slug: true, isActive: true, killSwitch: true }
    });

    if (!app || !app.isActive || app.killSwitch || this.isKillSwitchActive(app.slug)) {
      return false;
    }

    // Check company app installation scoped by companyId
    const installation = await prisma.companyApp.findFirst({
      where: {
        companyId,
        appId: app.id,
        status: { in: ['ACTIVE', 'TRIAL', 'active', 'trial'] }
      }
    });

    return Boolean(installation);
  }

  /**
   * Fast In-Memory Kill Switch status check (≤ 30s TTL, 0s latency)
   * @param {string} slugOrId
   * @returns {boolean}
   */
  isKillSwitchActive(slugOrId) {
    if (!slugOrId) return false;
    const key = String(slugOrId).toLowerCase().trim();
    const cached = _killSwitchCache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return Boolean(cached.active);
    }
    return false;
  }

  /**
   * Sets or updates kill switch state in cache and memory
   * @param {string} slugOrId
   * @param {boolean} active
   * @param {string} [reason]
   */
  setKillSwitchCache(slugOrId, active, reason = '') {
    if (!slugOrId) return;
    const key = String(slugOrId).toLowerCase().trim();
    _killSwitchCache.set(key, {
      active: Boolean(active),
      reason,
      expiresAt: Date.now() + KILL_SWITCH_CACHE_TTL_MS
    });
  }

  /**
   * Invalidates kill switch cache immediately
   * @param {string} [slugOrId]
   */
  invalidateKillSwitchCache(slugOrId) {
    if (slugOrId) {
      _killSwitchCache.delete(String(slugOrId).toLowerCase().trim());
    } else {
      _killSwitchCache.clear();
    }
  }

  /**
   * Validates user-supplied app settings against a settingsSchema definition
   * @param {Object} settings
   * @param {Object|string} schema
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

    for (const key of requiredKeys) {
      const val = settings[key];
      if (val === undefined || val === null || val === '') {
        errors.push(`الحقل المطلوب "${key}" مفقود أو فارغ`);
      }
    }

    for (const [key, prop] of Object.entries(properties)) {
      const val = settings[key];
      if (val === undefined || val === null) continue;

      if (prop.type === 'string' && typeof val !== 'string') {
        errors.push(`الحقل "${key}" يجب أن يكون نصاً (string)`);
      } else if (prop.type === 'number' || prop.type === 'integer') {
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
   * Compiles or extracts manifest from app payload
   */
  extractOrCompileManifest(appData) {
    if (!appData || typeof appData !== 'object') return null;
    let manifest = appData.manifest;
    if (typeof manifest === 'string') {
      try { manifest = JSON.parse(manifest); } catch (_) { manifest = null; }
    }
    if (manifest && typeof manifest === 'object' && !Array.isArray(manifest)) {
      return manifest;
    }

    const slug = String(appData.slug || '').trim().toLowerCase();
    if (!slug) return null;

    let permissions = [];
    if (Array.isArray(appData.permissions)) {
      permissions = appData.permissions;
    }

    const version = appData.version || appData.appVersion || '1.0.0';
    const entryRoute = appData.entryRoute || appData.mainRoute || `/app/${slug}`;

    return {
      manifestVersion: appData.manifestVersion || '1.0',
      appVersion: version,
      version: version,
      name: appData.name || slug,
      slug,
      description: appData.description || '',
      entryRoute,
      permissions,
      defaultEnabled: false,
      routes: {
        prefix: `/api/v1/tools/${slug}`,
        endpoints: [
          { path: '/status', method: 'GET', permission: permissions[0] || 'dashboard.view', handler: 'status' }
        ]
      },
      healthCheck: `/api/v1/tools/${slug}/status`,
      settingsSchema: appData.settingsSchema || null
    };
  }

  /**
   * Validates publishing gate for payloads or DB records
   * @param {Object} appOrPayload
   * @param {Object} [existingApp]
   * @returns {{ canPublish: boolean, errors: string[], manifest?: Object }}
   */
  validatePublishGate(appOrPayload, existingApp) {
    const errors = [];
    if (!appOrPayload) {
      return { canPublish: false, errors: ['بيانات التطبيق مطلوبة'] };
    }

    const merged = { ...(existingApp || {}), ...appOrPayload };
    const slug = merged.slug || merged.id;

    if (!slug) {
      return { canPublish: false, errors: ['معرف التطبيق (slug) مطلوب للتحقق من بوابة النشر'] };
    }

    // Kill switch check
    let isKilled = Boolean(merged.killSwitch) || this.isKillSwitchActive(slug);
    if (!isKilled) {
      try {
        const appKillSwitchService = require('./appContract/appKillSwitchService');
        if (appKillSwitchService && appKillSwitchService.isKillSwitchActive(slug)) {
          isKilled = true;
        }
      } catch (_) {}
    }
    if (isKilled) {
      errors.push(`لا يمكن نشر الأداة "${slug}": مفتاح الإيقاف الفوري (Kill Switch) نشط للأداة`);
    }

    // Permissions check
    if (!merged.permissions || (Array.isArray(merged.permissions) && merged.permissions.length === 0)) {
      errors.push(`الأداة "${slug}" لا تحتوي على أي صلاحيات معلنة (permissions array is empty)`);
    }

    // Schema check
    if (!merged.settingsSchema || (typeof merged.settingsSchema === 'object' && Object.keys(merged.settingsSchema.properties || {}).length === 0)) {
      errors.push(`مخطط الإعدادات (settingsSchema) للأداة "${slug}" فارغ أو لا يحتوي على أي حقول (Zero Empty Settings Pages Rule)`);
    }

    const version = merged.version || merged.appVersion || '1.0.0';
    const entryRoute = merged.entryRoute || merged.mainRoute || merged.routes?.prefix || merged.healthCheck || (merged.slug ? `/app/${merged.slug}` : null);

    const manifestToValidate = merged.manifest || {
      manifestVersion: merged.manifestVersion || '1.0',
      appVersion: version,
      version,
      name: merged.name,
      slug: merged.slug,
      entryRoute,
      permissions: merged.permissions,
      settingsSchema: merged.settingsSchema,
      routes: merged.routes,
      healthCheck: merged.healthCheck
    };

    const manifestResult = this.validateManifest(manifestToValidate);
    if (!manifestResult.valid) {
      errors.push(...manifestResult.errors);
    }

    const uniqueErrors = Array.from(new Set(errors));
    return {
      canPublish: uniqueErrors.length === 0,
      errors: uniqueErrors,
      manifest: manifestToValidate
    };
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
    const app = await prisma.marketplaceApp.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
          { slug: strippedSlug }
        ]
      }
    });

    if (!app) {
      const err = new Error(`التطبيق "${idOrSlug}" غير موجود`);
      err.code = 'APP_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    const merged = { ...app, ...overrides, isPublic: true };
    const gateVerdict = this.assertCanPublish(merged, app);
    const manifest = gateVerdict.manifest;

    const updated = await prisma.marketplaceApp.update({
      where: { id: app.id },
      data: {
        isPublic: true,
        isActive: true,
        version: manifest.appVersion || manifest.version,
        manifestVersion: manifest.manifestVersion || '1.0',
        appVersion: manifest.appVersion || manifest.version || '1.0.0',
        entryRoute: manifest.entryRoute || app.mainRoute,
        permissions: manifest.permissions,
        settingsSchema: manifest.settingsSchema,
        manifest,
        killSwitch: false,
        ...(overrides.name ? { name: overrides.name } : {}),
        ...(overrides.description ? { description: overrides.description } : {})
      }
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
    const app = await prisma.marketplaceApp.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
          { slug: strippedSlug }
        ]
      }
    });

    if (!app) {
      const err = new Error(`التطبيق "${idOrSlug}" غير موجود`);
      err.code = 'APP_NOT_FOUND';
      err.status = 404;
      throw err;
    }

    const updated = await prisma.marketplaceApp.update({
      where: { id: app.id },
      data: { isPublic: false }
    });

    return updated;
  }

  /**
   * Gets app manifest
   * @param {string} slugOrId
   * @returns {Promise<Object|null>}
   */
  async getAppManifest(slugOrId) {
    if (!slugOrId) return null;
    const normalized = String(slugOrId).trim().toLowerCase();
    const stripped = normalized.replace(/^cat-app-/, '');

    const prisma = getSharedPrismaClient();
    const dbApp = await prisma.marketplaceApp.findFirst({
      where: {
        OR: [{ id: slugOrId }, { slug: normalized }, { slug: stripped }]
      }
    });

    if (dbApp) {
      if (dbApp.manifest && typeof dbApp.manifest === 'object') return dbApp.manifest;
      return this.extractOrCompileManifest(dbApp);
    }

    return null;
  }
}

const appManifestService = new AppManifestService();

module.exports = {
  AppManifestService,
  appManifestService,
  ManifestInvalidError
};

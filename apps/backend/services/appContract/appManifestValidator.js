/**
 * App Contract & Manifest Validator
 * 
 * Enforces the strict contract required for all modular tools and apps:
 * - Mandatory manifest.json keys (slug, name, version, minPlatformVersion, permissions, settingsSchema, routes, featureFlag, defaultEnabled: false, healthCheck)
 * - Validation of declared permissions against platform permissions table/catalog
 * - Prohibition of undeclared permissions
 * - Verification that every route has a permission guard
 * - Protection of core boundaries (orders, checkout, payments, billing, auth, rbac, permissions)
 * - Strict prohibition of `requireRole` in tool code
 */

const fs = require('fs');
const path = require('path');
const { PERMISSIONS } = require('../../middleware/rbacMiddleware');

// Core protected domains that NO modular tool or external app can claim, alter, or hook into
const CORE_PROTECTED_DOMAINS = [
  'orders',
  'order',
  'checkout',
  'payments',
  'payment',
  'billing',
  'wallet',
  'auth',
  'login',
  'tokens',
  'rbac',
  'roles',
  'permissions',
  'super-admin/rbac',
  'super-admin/auth'
];

const SEMVER_REGEX = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Returns the set of valid platform permission keys
 */
function getPlatformPermissions() {
  return new Set(Object.keys(PERMISSIONS || {}));
}

/**
 * Validates a tool manifest object
 * @param {Object} manifest - The manifest object to validate
 * @param {Object} [options] - Options
 * @param {string} [options.toolDir] - Path to the tool directory for scanning code
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
function validateManifest(manifest, options = {}) {
  const errors = [];
  const warnings = [];

  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return {
      valid: false,
      errors: ['Manifest must be a non-null object'],
      warnings: []
    };
  }

  // 1. Slug validation
  if (!manifest.slug || typeof manifest.slug !== 'string') {
    errors.push('Manifest missing required field: "slug" (must be a non-empty string)');
  } else if (!SLUG_REGEX.test(manifest.slug)) {
    errors.push(`Invalid slug "${manifest.slug}": must be lowercase alphanumeric with hyphens (e.g. "my-tool")`);
  } else {
    // Check core collision
    const slugLower = manifest.slug.toLowerCase();
    for (const coreDomain of CORE_PROTECTED_DOMAINS) {
      if (slugLower === coreDomain || slugLower === `core-${coreDomain}` || slugLower === `${coreDomain}-core`) {
        errors.push(`Core boundary violation: slug "${manifest.slug}" collides with protected core domain "${coreDomain}"`);
      }
    }
  }

  // 2. Name validation
  if (!manifest.name || typeof manifest.name !== 'string' || manifest.name.trim().length === 0) {
    errors.push('Manifest missing required field: "name" (must be a non-empty string)');
  }

  // 3. Version validation (SemVer)
  if (!manifest.version || typeof manifest.version !== 'string') {
    errors.push('Manifest missing required field: "version" (must be a string)');
  } else if (!SEMVER_REGEX.test(manifest.version)) {
    errors.push(`Invalid version "${manifest.version}": must follow Semantic Versioning (e.g. "1.0.0")`);
  }

  // 4. minPlatformVersion validation
  if (!manifest.minPlatformVersion || typeof manifest.minPlatformVersion !== 'string') {
    errors.push('Manifest missing required field: "minPlatformVersion" (must be a string)');
  } else if (!SEMVER_REGEX.test(manifest.minPlatformVersion)) {
    errors.push(`Invalid minPlatformVersion "${manifest.minPlatformVersion}": must follow Semantic Versioning (e.g. "1.0.0")`);
  }

  // 5. featureFlag & defaultEnabled: false
  if (!manifest.featureFlag || typeof manifest.featureFlag !== 'string') {
    errors.push('Manifest missing required field: "featureFlag" (must be a string)');
  }

  if (manifest.defaultEnabled !== false) {
    errors.push('Manifest requirement violated: "defaultEnabled" must be explicitly set to false (tools must start disabled by default)');
  }

  // 6. Permissions validation
  const platformPermissions = getPlatformPermissions();
  const declaredPermissions = new Set();

  if (!Array.isArray(manifest.permissions)) {
    errors.push('Manifest missing required field: "permissions" (must be an array of permission keys)');
  } else if (manifest.permissions.length === 0) {
    errors.push('Manifest "permissions" array cannot be empty: tool must explicitly declare which permissions it requires');
  } else {
    for (const perm of manifest.permissions) {
      if (typeof perm !== 'string' || perm.trim().length === 0) {
        errors.push(`Invalid permission entry: "${perm}" must be a non-empty string`);
        continue;
      }
      if (!platformPermissions.has(perm)) {
        errors.push(`Undeclared/Invalid platform permission: "${perm}" does not exist in platform permissions table`);
      }
      declaredPermissions.add(perm);
    }
  }

  // 7. SettingsSchema validation (JSON Schema, must not be empty)
  if (!manifest.settingsSchema || typeof manifest.settingsSchema !== 'object' || Array.isArray(manifest.settingsSchema)) {
    errors.push('Manifest missing required field: "settingsSchema" (must be a JSON Schema object; empty settings pages are forbidden)');
  } else {
    const schema = manifest.settingsSchema;
    if (schema.type !== 'object') {
      errors.push('settingsSchema.type must be "object"');
    }
    if (!schema.properties || typeof schema.properties !== 'object' || Object.keys(schema.properties).length === 0) {
      errors.push('settingsSchema.properties must define at least one configuration property (preventing empty settings pages)');
    }
  }

  // 8. Routes & Guard validation
  if (!manifest.routes || typeof manifest.routes !== 'object') {
    errors.push('Manifest missing required field: "routes" (must be an object containing prefix and endpoints)');
  } else {
    const { prefix, endpoints } = manifest.routes;

    if (!prefix || typeof prefix !== 'string' || !prefix.startsWith('/')) {
      errors.push('manifest.routes.prefix must be a valid path string starting with "/"');
    } else {
      // Mandate proper tool namespace
      if (!/^\/api\/v\d+\/tools(?:\/|$)/.test(prefix)) {
        errors.push(`manifest.routes.prefix "${prefix}" must be within the tools namespace (e.g. "/api/v1/tools/${manifest.slug || 'my-tool'}")`);
      }

      // Check core boundary collision across all path segments
      const cleanPrefix = prefix.toLowerCase().replace(/^\/+/, '').replace(/^api\/(?:v\d+\/)?/, '');
      const segments = cleanPrefix.split('/').filter(Boolean);
      for (const coreDomain of CORE_PROTECTED_DOMAINS) {
        if (segments.includes(coreDomain) || cleanPrefix === coreDomain || cleanPrefix.startsWith(`${coreDomain}/`)) {
          errors.push(`Core boundary violation: route prefix "${prefix}" intrudes on protected core domain "${coreDomain}"`);
        }
      }
    }

    if (!Array.isArray(endpoints) || endpoints.length === 0) {
      errors.push('manifest.routes.endpoints must be a non-empty array of endpoint definitions');
    } else {
      endpoints.forEach((ep, idx) => {
        const epPath = ep.path || `endpoints[${idx}]`;
        if (!ep.path || typeof ep.path !== 'string' || !ep.path.startsWith('/')) {
          errors.push(`Endpoint ${epPath}: "path" must be a string starting with "/"`);
        }
        const method = (ep.method || '').toUpperCase();
        if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
          errors.push(`Endpoint ${epPath}: "method" must be one of GET, POST, PUT, DELETE, PATCH`);
        }
        if (!ep.permission || typeof ep.permission !== 'string') {
          errors.push(`Endpoint ${epPath}: missing permission guard ("permission" is required for every route; unguarded routes are forbidden)`);
        } else if (!declaredPermissions.has(ep.permission)) {
          errors.push(`Endpoint ${epPath}: references undeclared permission "${ep.permission}". Must be listed in manifest.permissions`);
        }
      });
    }
  }

  // 9. HealthCheck endpoint validation
  if (!manifest.healthCheck || typeof manifest.healthCheck !== 'string') {
    errors.push('Manifest missing required field: "healthCheck" endpoint path (must be a non-empty string)');
  } else {
    const prefix = manifest.routes?.prefix || '';
    if (prefix && !manifest.healthCheck.startsWith(prefix)) {
      errors.push(`healthCheck endpoint "${manifest.healthCheck}" must be rooted under the tool route prefix "${prefix}"`);
    }
  }

  // 10. Code-level audit: Prohibition of `requireRole` in tool code
  if (options.toolDir && fs.existsSync(options.toolDir)) {
    const codeViolations = scanForForbiddenCode(options.toolDir);
    for (const violation of codeViolations) {
      errors.push(violation);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Scans a directory recursively for prohibited patterns (e.g. `requireRole`)
 * @param {string} dirPath - Directory path to scan
 * @returns {string[]} Array of violation messages
 */
function scanForForbiddenCode(dirPath) {
  const violations = [];

  function walk(currentDir) {
    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.git') {
          walk(fullPath);
        }
      } else if (entry.isFile() && /\.(js|ts|jsx|tsx)$/.test(entry.name)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          // Strict rule: zero requireRole in new tool code
          if (/\brequireRole\s*\(/.test(content)) {
            const relPath = path.relative(dirPath, fullPath);
            violations.push(`Security violation in "${relPath}": "requireRole" is strictly forbidden in tool code. Enforce permissions via manifest permission keys.`);
          }
        } catch {
          // ignore read error
        }
      }
    }
  }

  walk(dirPath);
  return violations;
}

/**
 * Asserts that a manifest is valid, throwing an Error with all details if not
 */
function assertValidManifest(manifest, toolDir) {
  const result = validateManifest(manifest, { toolDir });
  if (!result.valid) {
    const errorMsg = `App Contract validation failed for tool "${manifest?.slug || 'unknown'}":\n- ` + result.errors.join('\n- ');
    const err = new Error(errorMsg);
    err.code = 'APP_CONTRACT_VALIDATION_FAILED';
    err.details = result.errors;
    throw err;
  }
  return result;
}

module.exports = {
  validateManifest,
  assertValidManifest,
  scanForForbiddenCode,
  getPlatformPermissions,
  CORE_PROTECTED_DOMAINS
};

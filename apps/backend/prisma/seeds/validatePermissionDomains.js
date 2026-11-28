const fs = require('fs');
const path = require('path');

const DEFAULT_SCHEMA_PATH = path.resolve(__dirname, '../schema/permissions.prisma');

// DEPLOY-FAIL-1: dependency-free pre-flight check. Runs before any DB write.
function validatePermissionDomains(definitions, schemaPath = DEFAULT_SCHEMA_PATH) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const enumMatch = schema.match(/enum\s+PermissionDomain\s*\{([^}]+)\}/);
  if (!enumMatch) {
    throw new Error('❌ [SEED PREFLIGHT] enum PermissionDomain not found in prisma/schema/permissions.prisma');
  }

  const allowedDomains = new Set(
    enumMatch[1]
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('//') && !line.startsWith('@@'))
  );
  const usedDomains = [...new Set((definitions || []).map(p => p && p.domain).filter(Boolean))];
  const missingDomains = usedDomains.filter(domain => !allowedDomains.has(domain));

  if (missingDomains.length > 0) {
    throw new Error(
      `❌ [SEED PREFLIGHT] Invalid PermissionDomain(s) in seedPermissions.js: ${missingDomains.join(', ')}. ` +
      `Allowed: ${[...allowedDomains].join(', ')}`
    );
  }
  return allowedDomains;
}

module.exports = { validatePermissionDomains, DEFAULT_SCHEMA_PATH };

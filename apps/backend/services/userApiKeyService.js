'use strict';

/**
 * @module userApiKeyService
 * @description Personal Employee/User API Keys (`mxp_usr_*`).
 *
 * Each key is bound to `(userId, companyId)` and dynamically resolves the user's
 * live role and RBAC permissions from the database on every request — so any new
 * permission granted to (or revoked from) the employee takes effect immediately.
 */

const crypto = require('crypto');
const {
  getSharedPrismaClientAsync,
  executeWithRetry,
} = require('./sharedDatabase');
const permissionService = require('./permissionService');

const USER_API_KEY_PREFIX = 'mxp_usr_';
const VISIBLE_PREFIX_LENGTH = 16; // e.g. "mxp_usr_a1b2c3d4"
const VALID_PERMISSION_MODES = new Set(['INHERIT_ALL', 'SCOPED']);
const DEFAULT_RATE_LIMIT_PER_MIN = 60;
const MIN_RATE_LIMIT_PER_MIN = 10;
const MAX_RATE_LIMIT_PER_MIN = 600;

// In-memory 1-minute sliding bucket per key ID
const keyRateLimitMap = new Map();
const RATE_WINDOW_MS = 60 * 1000;
const rateCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [id, rec] of keyRateLimitMap.entries()) {
    if (now > rec.resetTime + RATE_WINDOW_MS) keyRateLimitMap.delete(id);
  }
}, 5 * 60 * 1000);
if (typeof rateCleanupInterval.unref === 'function') rateCleanupInterval.unref();

function checkKeyRateLimit(keyId, maxPerMin = DEFAULT_RATE_LIMIT_PER_MIN) {
  const limit = Math.min(Math.max(parseInt(maxPerMin, 10) || DEFAULT_RATE_LIMIT_PER_MIN, MIN_RATE_LIMIT_PER_MIN), MAX_RATE_LIMIT_PER_MIN);
  const now = Date.now();
  let rec = keyRateLimitMap.get(keyId);
  if (!rec || now > rec.resetTime) {
    rec = { count: 1, resetTime: now + RATE_WINDOW_MS };
    keyRateLimitMap.set(keyId, rec);
    return { allowed: true, limit, remaining: limit - 1, reset: Math.ceil(rec.resetTime / 1000) };
  }
  if (rec.count >= limit) {
    return { allowed: false, limit, remaining: 0, reset: Math.ceil(rec.resetTime / 1000) };
  }
  rec.count += 1;
  return { allowed: true, limit, remaining: limit - rec.count, reset: Math.ceil(rec.resetTime / 1000) };
}

function normalizeIpAddress(ip) {
  return String(ip || '').replace(/^::ffff:/, '').trim();
}

function parseAllowedIps(value) {
  if (!value) return [];
  const rawList = Array.isArray(value)
    ? value
    : String(value)
        .split(/[\n,]+/)
        .map((s) => s.trim());
  return [...new Set(rawList.map(normalizeIpAddress).filter(Boolean))].slice(0, 50);
}

function parseScopesList(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((s) => String(s || '').trim()).filter(Boolean))];
}

function normalizeRateLimit(value) {
  if (value === undefined || value === null || value === '') return DEFAULT_RATE_LIMIT_PER_MIN;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return DEFAULT_RATE_LIMIT_PER_MIN;
  return Math.min(Math.max(parsed, MIN_RATE_LIMIT_PER_MIN), MAX_RATE_LIMIT_PER_MIN);
}

function resolveExpiryDate({ expiresAt = null, expiresInDays = null }) {
  if (expiresInDays !== undefined && expiresInDays !== null && String(expiresInDays).trim() !== '') {
    const days = parseInt(expiresInDays, 10);
    if (Number.isNaN(days) || days < 1 || days > 3650) {
      const err = new Error('مدة الصلاحية بالأيام يجب أن تكون بين 1 و 3650 يوماً');
      err.statusCode = 400;
      throw err;
    }
    return new Date(Date.now() + days * 86400000);
  }
  if (expiresAt) {
    const parsed = new Date(expiresAt);
    if (Number.isNaN(parsed.getTime()) || parsed <= new Date()) {
      const err = new Error('تاريخ الانتهاء يجب أن يكون تاريخاً مستقبلياً صالحاً');
      err.statusCode = 400;
      throw err;
    }
    return parsed;
  }
  return null;
}

const ROLE_RANK = Object.freeze({
  SUPER_ADMIN: 100,
  OWNER: 80,
  COMPANY_ADMIN: 60,
  MANAGER: 40,
});

const runWithoutTenantContext = (operation) =>
  require('./tenantContext').run(null, operation);

function isUserApiKey(token) {
  return typeof token === 'string' && token.trim().startsWith(USER_API_KEY_PREFIX);
}

function hashUserApiKey(rawKey) {
  return crypto.createHash('sha256').update(String(rawKey || '').trim()).digest('hex');
}

function maskKeyPrefix(keyPrefix) {
  if (!keyPrefix) return '';
  return `${keyPrefix}••••••••`;
}

function generateUserApiKey() {
  const randomHex = crypto.randomBytes(24).toString('hex'); // 192 bits of entropy
  const rawKey = `${USER_API_KEY_PREFIX}${randomHex}`;
  return {
    rawKey,
    keyPrefix: rawKey.slice(0, VISIBLE_PREFIX_LENGTH),
    keyHash: hashUserApiKey(rawKey),
  };
}

function getRoleRank(role) {
  const normalized = String(role || '').trim().toUpperCase();
  return ROLE_RANK[normalized] || 10;
}

function isManagementRole(role) {
  return getRoleRank(role) >= ROLE_RANK.MANAGER;
}

/**
 * Authorization matrix for managing a target user's API keys:
 *  - Any user can manage their own keys (`actorId === targetUserId`).
 *  - SUPER_ADMIN can manage any user's keys.
 *  - OWNER can manage any non-SUPER_ADMIN user in their company.
 *  - COMPANY_ADMIN / MANAGER can manage strictly lower-ranked roles (no privilege escalation).
 */
function canManageTargetUser({ actorId, actorRole, targetUserId, targetRole }) {
  if (actorId && targetUserId && String(actorId) === String(targetUserId)) {
    return true;
  }
  const normalizedActor = String(actorRole || '').trim().toUpperCase();
  const normalizedTarget = String(targetRole || '').trim().toUpperCase();

  if (!isManagementRole(normalizedActor)) {
    return false;
  }
  if (normalizedActor === 'SUPER_ADMIN') {
    return true;
  }
  if (normalizedActor === 'OWNER') {
    return normalizedTarget !== 'SUPER_ADMIN';
  }
  return getRoleRank(normalizedActor) > getRoleRank(normalizedTarget);
}

function serializeKey(row, userMap = null) {
  const now = new Date();
  const isExpired = Boolean(row.expiresAt && new Date(row.expiresAt) <= now);
  const isRevoked = !row.isActive || Boolean(row.revokedAt);
  const status = isRevoked ? 'REVOKED' : isExpired ? 'EXPIRED' : 'ACTIVE';

  const owner = userMap ? userMap.get(row.userId) || null : null;
  const creator = userMap ? userMap.get(row.createdByUserId) || null : null;

  return {
    id: row.id,
    name: row.name,
    userId: row.userId,
    companyId: row.companyId,
    keyPrefix: row.keyPrefix,
    maskedKey: maskKeyPrefix(row.keyPrefix),
    permissionMode: VALID_PERMISSION_MODES.has(row.permissionMode) ? row.permissionMode : 'INHERIT_ALL',
    scopes: Array.isArray(row.scopes) ? row.scopes : [],
    rateLimitPerMin: row.rateLimitPerMin || DEFAULT_RATE_LIMIT_PER_MIN,
    allowedIps: Array.isArray(row.allowedIps) ? row.allowedIps : [],
    isActive: row.isActive,
    status,
    expiresAt: row.expiresAt || null,
    revokedAt: row.revokedAt || null,
    revokedReason: row.revokedReason || null,
    lastUsedAt: row.lastUsedAt || null,
    lastUsedIp: row.lastUsedIp || null,
    requestCount: row.requestCount || 0,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...(owner ? { user: owner } : {}),
    ...(creator ? { createdBy: creator } : {}),
  };
}

async function hasLegacyPrimaryCompanyAccess(prisma, userId, targetCompanyId, primaryCompanyId) {
  if (!targetCompanyId || targetCompanyId !== primaryCompanyId) return false;
  const activeMembershipCount = await prisma.userCompany.count({
    where: { userId, isActive: true },
  });
  return activeMembershipCount === 0;
}

/**
 * Resolves a user's active role inside `companyId` (same precedence as verifyToken.js).
 */
async function resolveUserCompanyMembership(prisma, user, companyId) {
  if (!user || user.isActive === false) {
    return { allowed: false, code: 'USER_INACTIVE', message: 'الحساب غير نشط' };
  }

  if (user.role === 'SUPER_ADMIN') {
    return { allowed: true, effectiveRole: 'SUPER_ADMIN' };
  }

  const membership = await executeWithRetry(() =>
    prisma.userCompany.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId,
        },
      },
      select: {
        role: true,
        isActive: true,
        roleId: true,
        roleRef: { select: { key: true } },
      },
    })
  );

  if (!membership || !membership.isActive) {
    const legacyOk = await hasLegacyPrimaryCompanyAccess(
      prisma,
      user.id,
      companyId,
      user.companyId
    );
    if (!legacyOk) {
      return {
        allowed: false,
        code: 'ACCESS_REVOKED',
        message: 'ليس لدى صاحب المفتاح صلاحية للوصول لهذه الشركة',
      };
    }
    return { allowed: true, effectiveRole: user.role || 'AGENT' };
  }

  let effectiveRole = membership.roleRef?.key || membership.role || user.role || 'AGENT';
  if (!membership.roleRef?.key && membership.roleId) {
    try {
      const resolvedRole = await executeWithRetry(() =>
        prisma.role.findUnique({
          where: { id: membership.roleId },
          select: { key: true },
        })
      );
      if (resolvedRole?.key) {
        effectiveRole = resolvedRole.key;
      }
    } catch (_) {
      // keep fallback role
    }
  }

  return { allowed: true, effectiveRole };
}

/**
 * Authenticates a `mxp_usr_*` API key and builds a live `req.user`-compatible identity
 * inheriting ALL current permissions of the bound employee in the bound company.
 */
async function resolveAuthenticatedUserFromApiKey(rawKey, { ip = null } = {}) {
  const trimmed = String(rawKey || '').trim();
  if (!isUserApiKey(trimmed)) {
    return { ok: false, status: 401, code: 'INVALID_API_KEY', message: 'صيغة مفتاح API غير صالحة' };
  }

  const prisma = await getSharedPrismaClientAsync();
  const keyHash = hashUserApiKey(trimmed);

  const keyRow = await runWithoutTenantContext(() =>
    executeWithRetry(() =>
      prisma.userApiKey.findUnique({
        where: { keyHash },
        select: {
          id: true,
          userId: true,
          companyId: true,
          name: true,
          keyPrefix: true,
          permissionMode: true,
          scopes: true,
          rateLimitPerMin: true,
          allowedIps: true,
          isActive: true,
          expiresAt: true,
          revokedAt: true,
        },
      })
    )
  );

  if (!keyRow) {
    return { ok: false, status: 401, code: 'INVALID_API_KEY', message: 'مفتاح API غير صالح' };
  }

  if (!keyRow.isActive || keyRow.revokedAt) {
    return { ok: false, status: 401, code: 'API_KEY_REVOKED', message: 'تم إيقاف مفتاح API هذا' };
  }

  if (keyRow.expiresAt && new Date(keyRow.expiresAt) <= new Date()) {
    return { ok: false, status: 401, code: 'API_KEY_EXPIRED', message: 'انتهت صلاحية مفتاح API هذا' };
  }

  // IP Allowlist enforcement (if configured on the key)
  const normalizedIp = normalizeIpAddress(ip);
  const allowedIps = Array.isArray(keyRow.allowedIps) ? keyRow.allowedIps : [];
  if (allowedIps.length > 0 && !allowedIps.includes('*')) {
    if (!normalizedIp || !allowedIps.includes(normalizedIp)) {
      return {
        ok: false,
        status: 403,
        code: 'IP_NOT_ALLOWED',
        message: `عنوان IP (${normalizedIp || 'unknown'}) غير مصرح له باستخدام هذا المفتاح`,
      };
    }
  }

  // Per-key rate limit enforcement
  const rateLimit = checkKeyRateLimit(keyRow.id, keyRow.rateLimitPerMin);
  if (!rateLimit.allowed) {
    return {
      ok: false,
      status: 429,
      code: 'RATE_LIMITED',
      message: `تجاوزت الحد المسموح (${rateLimit.limit} طلب/دقيقة) لهذا المفتاح`,
    };
  }

  const user = await runWithoutTenantContext(() =>
    executeWithRetry(() =>
      prisma.user.findUnique({
        where: { id: keyRow.userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          merchantId: true,
          companyId: true,
          isActive: true,
        },
      })
    )
  );

  if (!user) {
    return { ok: false, status: 401, code: 'USER_NOT_FOUND', message: 'صاحب المفتاح غير موجود' };
  }

  const membershipCheck = await runWithoutTenantContext(() =>
    resolveUserCompanyMembership(prisma, user, keyRow.companyId)
  );

  if (!membershipCheck.allowed) {
    return {
      ok: false,
      status: 403,
      code: membershipCheck.code,
      message: membershipCheck.message,
    };
  }

  const effectiveRole = membershipCheck.effectiveRole;
  const effectiveCompanyId = keyRow.companyId;
  const permissionMode = VALID_PERMISSION_MODES.has(keyRow.permissionMode)
    ? keyRow.permissionMode
    : 'INHERIT_ALL';

  // Live RBAC permissions from DB/cache — automatically reflects newly granted or revoked permissions
  let userPermissions = [];
  if (effectiveCompanyId && effectiveRole !== 'SUPER_ADMIN') {
    try {
      userPermissions = await permissionService.getUserPermissions(user.id, effectiveCompanyId);
    } catch (_) {
      userPermissions = [];
    }
  }

  // When SCOPED mode is active, strictly intersect selected scopes with the employee's live
  // permissions (for OWNER/SUPER_ADMIN, use selected scopes directly and remove admin bypass role
  // so least-privilege enforcement is guaranteed).
  let runtimeRole = effectiveRole;
  if (permissionMode === 'SCOPED') {
    const keyScopeSet = new Set(Array.isArray(keyRow.scopes) ? keyRow.scopes : []);
    if (effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'OWNER') {
      userPermissions = Array.from(keyScopeSet);
    } else {
      userPermissions = userPermissions.filter((perm) => keyScopeSet.has(perm));
    }
    runtimeRole = 'SCOPED_API_KEY';
  }

  // Non-blocking telemetry update
  runWithoutTenantContext(() =>
    prisma.userApiKey.update({
      where: { id: keyRow.id },
      data: {
        lastUsedAt: new Date(),
        ...(normalizedIp ? { lastUsedIp: normalizedIp.slice(0, 64) } : {}),
        requestCount: { increment: 1 },
      },
    })
  ).catch(() => {});

  return {
    ok: true,
    key: keyRow,
    user: {
      id: user.id,
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: runtimeRole,
      baseRole: effectiveRole,
      merchantId: user.merchantId || null,
      companyId: effectiveCompanyId,
      effectiveCompanyId,
      userPermissions,
      permissionMode,
      rateLimitPerMin: keyRow.rateLimitPerMin || DEFAULT_RATE_LIMIT_PER_MIN,
      deviceType: 'OFFICE',
      deviceId: null,
      deviceFingerprint: null,
      isDeviceApproved: true,
      authType: 'USER_API_KEY',
      apiKeyId: keyRow.id,
      apiKeyPrefix: keyRow.keyPrefix,
      apiKeyCompanyId: keyRow.companyId,
    },
  };
}

async function fetchUsersSummaryMap(prisma, companyId, userIds) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  const map = new Map();
  if (ids.length === 0) return map;

  const users = await runWithoutTenantContext(() =>
    prisma.user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        userCompanies: {
          where: { companyId },
          select: { role: true, isActive: true, roleRef: { select: { key: true, name: true } } },
          take: 1,
        },
      },
    })
  );

  for (const u of users) {
    const uc = u.userCompanies?.[0];
    const effectiveRole = u.role === 'SUPER_ADMIN'
      ? 'SUPER_ADMIN'
      : uc?.roleRef?.key || uc?.role || u.role || 'AGENT';
    map.set(u.id, {
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      email: u.email,
      role: effectiveRole,
      roleName: uc?.roleRef?.name || effectiveRole,
      isActive: u.isActive,
    });
  }
  return map;
}

async function getTargetUserInCompany(prisma, companyId, targetUserId) {
  const user = await runWithoutTenantContext(() =>
    prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        companyId: true,
        isActive: true,
      },
    })
  );

  if (!user) {
    const err = new Error('المستخدم غير موجود');
    err.statusCode = 404;
    throw err;
  }

  const membership = await runWithoutTenantContext(() =>
    resolveUserCompanyMembership(prisma, user, companyId)
  );

  if (!membership.allowed) {
    const err = new Error(membership.message || 'المستخدم غير نشط في هذه الشركة');
    err.statusCode = 403;
    throw err;
  }

  return { user, effectiveRole: membership.effectiveRole };
}

async function getCapabilitiesForUser({ companyId, actorId, actorRole, targetUserId = null }) {
  const prisma = await getSharedPrismaClientAsync();
  const resolvedTargetId = targetUserId || actorId;
  const { effectiveRole: targetRole } = await getTargetUserInCompany(
    prisma,
    companyId,
    resolvedTargetId
  );

  if (!canManageTargetUser({ actorId, actorRole, targetUserId: resolvedTargetId, targetRole })) {
    const err = new Error('ليس لديك صلاحية عرض قدرات هذا المستخدم');
    err.statusCode = 403;
    throw err;
  }

  let targetPermissions = [];
  if (targetRole !== 'SUPER_ADMIN') {
    try {
      targetPermissions = await permissionService.getUserPermissions(resolvedTargetId, companyId);
    } catch (_) {
      targetPermissions = [];
    }
  }

  const companyCapabilitiesService = require('./companyCapabilitiesService');
  const capabilities = await companyCapabilitiesService.getCompanyUserCapabilities({
    companyId,
    targetUserId: resolvedTargetId,
    targetRole,
    targetPermissions,
  });

  return {
    targetUserId: resolvedTargetId,
    targetRole,
    ...capabilities,
  };
}

function filterRequestedScopesByCapabilities(requestedScopes, capabilities, targetRole) {
  const cleaned = parseScopesList(requestedScopes);
  if (cleaned.length === 0) return [];
  const allowedSet = new Set();
  for (const mod of capabilities.modules || []) {
    for (const p of mod.permissions || []) {
      allowedSet.add(p.key);
    }
  }
  const normalizedRole = String(targetRole || '').trim().toUpperCase();
  if (normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'OWNER') {
    // Allow any active-app permission or explicitly passed valid permission
    return cleaned.filter((k) => allowedSet.size === 0 || allowedSet.has(k));
  }
  return cleaned.filter((k) => allowedSet.has(k));
}

async function createKey({
  companyId,
  actorId,
  actorRole,
  targetUserId,
  name,
  permissionMode = 'INHERIT_ALL',
  scopes = [],
  rateLimitPerMin = DEFAULT_RATE_LIMIT_PER_MIN,
  allowedIps = [],
  expiresInDays = null,
  expiresAt = null,
}) {
  const trimmedName = String(name || '').trim();
  if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 100) {
    const err = new Error('اسم المفتاح مطلوب (من 2 إلى 100 حرف)');
    err.statusCode = 400;
    throw err;
  }

  const normalizedMode = VALID_PERMISSION_MODES.has(permissionMode) ? permissionMode : 'INHERIT_ALL';
  const parsedExpiresAt = resolveExpiryDate({ expiresAt, expiresInDays });
  const parsedRateLimit = normalizeRateLimit(rateLimitPerMin);
  const parsedIps = parseAllowedIps(allowedIps);

  const resolvedTargetId = targetUserId || actorId;
  const prisma = await getSharedPrismaClientAsync();
  const { effectiveRole: targetRole } = await getTargetUserInCompany(
    prisma,
    companyId,
    resolvedTargetId
  );

  if (!canManageTargetUser({ actorId, actorRole, targetUserId: resolvedTargetId, targetRole })) {
    const err = new Error('ليس لديك صلاحية إنشاء مفتاح لهذا المستخدم');
    err.statusCode = 403;
    throw err;
  }

  let validatedScopes = [];
  if (normalizedMode === 'SCOPED') {
    const capabilities = await getCapabilitiesForUser({
      companyId,
      actorId,
      actorRole,
      targetUserId: resolvedTargetId,
    });
    validatedScopes = filterRequestedScopesByCapabilities(scopes, capabilities, targetRole);
    if (validatedScopes.length === 0) {
      const err = new Error('يجب اختيار صلاحية واحدة على الأقل عند تفعيل الوضع المقيّد');
      err.statusCode = 400;
      throw err;
    }
  }

  const generated = generateUserApiKey();
  const created = await runWithoutTenantContext(() =>
    prisma.userApiKey.create({
      data: {
        userId: resolvedTargetId,
        companyId,
        name: trimmedName,
        keyPrefix: generated.keyPrefix,
        keyHash: generated.keyHash,
        permissionMode: normalizedMode,
        scopes: validatedScopes,
        rateLimitPerMin: parsedRateLimit,
        allowedIps: parsedIps,
        isActive: true,
        expiresAt: parsedExpiresAt,
        createdByUserId: actorId,
      },
    })
  );

  const userMap = await fetchUsersSummaryMap(prisma, companyId, [created.userId, created.createdByUserId]);
  return {
    key: serializeKey(created, userMap),
    rawKey: generated.rawKey,
  };
}

async function updateKey({
  companyId,
  keyId,
  actorId,
  actorRole,
  name,
  permissionMode,
  scopes,
  rateLimitPerMin,
  allowedIps,
  isActive,
  expiresInDays,
  expiresAt,
}) {
  const prisma = await getSharedPrismaClientAsync();
  const existing = await findAndAuthorizeKey(prisma, { companyId, keyId, actorId, actorRole });

  const updateData = {};
  if (name !== undefined) {
    const trimmedName = String(name || '').trim();
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 100) {
      const err = new Error('اسم المفتاح مطلوب (من 2 إلى 100 حرف)');
      err.statusCode = 400;
      throw err;
    }
    updateData.name = trimmedName;
  }

  const nextMode = permissionMode !== undefined
    ? (VALID_PERMISSION_MODES.has(permissionMode) ? permissionMode : existing.permissionMode)
    : existing.permissionMode;

  if (permissionMode !== undefined) {
    updateData.permissionMode = nextMode;
    if (nextMode === 'INHERIT_ALL') {
      updateData.scopes = [];
    }
  }

  if (scopes !== undefined || (permissionMode === 'SCOPED' && nextMode === 'SCOPED')) {
    const capabilities = await getCapabilitiesForUser({
      companyId,
      actorId,
      actorRole,
      targetUserId: existing.userId,
    });
    const candidateScopes = scopes !== undefined ? scopes : existing.scopes;
    const validated = filterRequestedScopesByCapabilities(
      candidateScopes,
      capabilities,
      capabilities.targetRole
    );
    if (nextMode === 'SCOPED' && validated.length === 0) {
      const err = new Error('يجب اختيار صلاحية واحدة على الأقل عند تفعيل الوضع المقيّد');
      err.statusCode = 400;
      throw err;
    }
    updateData.scopes = validated;
  }

  if (rateLimitPerMin !== undefined) {
    updateData.rateLimitPerMin = normalizeRateLimit(rateLimitPerMin);
  }
  if (allowedIps !== undefined) {
    updateData.allowedIps = parseAllowedIps(allowedIps);
  }
  if (expiresInDays !== undefined || expiresAt !== undefined) {
    if (expiresInDays === null && expiresAt === null) {
      updateData.expiresAt = null;
    } else if (expiresInDays === '' && expiresAt === '') {
      updateData.expiresAt = null;
    } else {
      updateData.expiresAt = resolveExpiryDate({ expiresAt, expiresInDays });
    }
  }
  if (isActive !== undefined) {
    updateData.isActive = Boolean(isActive);
    if (Boolean(isActive)) {
      updateData.revokedAt = null;
      updateData.revokedByUserId = null;
      updateData.revokedReason = null;
    } else {
      updateData.revokedAt = new Date();
      updateData.revokedByUserId = actorId;
    }
  }

  const updated = await runWithoutTenantContext(() =>
    prisma.userApiKey.update({
      where: { id: keyId },
      data: updateData,
    })
  );

  const userMap = await fetchUsersSummaryMap(prisma, companyId, [updated.userId, updated.createdByUserId]);
  return serializeKey(updated, userMap);
}

async function listKeys({ companyId, actorId, actorRole, targetUserId = null, scope = 'self', includeRevoked = false }) {
  const prisma = await getSharedPrismaClientAsync();
  const where = { companyId };
  if (!includeRevoked) {
    where.revokedAt = null;
    where.isActive = true;
  }

  if (targetUserId) {
    const { effectiveRole: targetRole } = await getTargetUserInCompany(prisma, companyId, targetUserId);
    if (!canManageTargetUser({ actorId, actorRole, targetUserId, targetRole })) {
      const err = new Error('ليس لديك صلاحية عرض مفاتيح هذا المستخدم');
      err.statusCode = 403;
      throw err;
    }
    where.userId = targetUserId;
  } else if (scope === 'company') {
    if (!isManagementRole(actorRole)) {
      const err = new Error('عرض مفاتيح جميع الموظفين متاح للمدير أو المالك فقط');
      err.statusCode = 403;
      throw err;
    }
  } else {
    where.userId = actorId;
  }

  const rows = await runWithoutTenantContext(() =>
    prisma.userApiKey.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
  );

  const userMap = await fetchUsersSummaryMap(
    prisma,
    companyId,
    rows.flatMap((r) => [r.userId, r.createdByUserId])
  );

  const filtered = scope === 'company' && !targetUserId
    ? rows.filter((r) => {
        const owner = userMap.get(r.userId);
        return canManageTargetUser({
          actorId,
          actorRole,
          targetUserId: r.userId,
          targetRole: owner?.role || 'AGENT',
        });
      })
    : rows;

  return filtered.map((r) => serializeKey(r, userMap));
}

async function findAndAuthorizeKey(prisma, { companyId, keyId, actorId, actorRole }) {
  const existing = await runWithoutTenantContext(() =>
    prisma.userApiKey.findFirst({
      where: { id: keyId, companyId },
    })
  );

  if (!existing) {
    const err = new Error('مفتاح API غير موجود');
    err.statusCode = 404;
    throw err;
  }

  const userMap = await fetchUsersSummaryMap(prisma, companyId, [existing.userId]);
  const targetRole = userMap.get(existing.userId)?.role || 'AGENT';

  if (!canManageTargetUser({ actorId, actorRole, targetUserId: existing.userId, targetRole })) {
    const err = new Error('ليس لديك صلاحية تعديل أو إيقاف هذا المفتاح');
    err.statusCode = 403;
    throw err;
  }

  return existing;
}

async function revokeKey({ companyId, keyId, actorId, actorRole, reason = null }) {
  const prisma = await getSharedPrismaClientAsync();
  await findAndAuthorizeKey(prisma, { companyId, keyId, actorId, actorRole });

  const updated = await runWithoutTenantContext(() =>
    prisma.userApiKey.update({
      where: { id: keyId },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedByUserId: actorId,
        revokedReason: reason ? String(reason).trim().slice(0, 200) : null,
      },
    })
  );

  const userMap = await fetchUsersSummaryMap(prisma, companyId, [updated.userId, updated.createdByUserId]);
  return serializeKey(updated, userMap);
}

async function deleteKey({ companyId, keyId, actorId, actorRole }) {
  const prisma = await getSharedPrismaClientAsync();
  await findAndAuthorizeKey(prisma, { companyId, keyId, actorId, actorRole });

  await runWithoutTenantContext(() =>
    prisma.userApiKey.delete({ where: { id: keyId } })
  );
  return { deleted: true, id: keyId };
}

async function listManageableUsers({ companyId, actorId, actorRole }) {
  if (!isManagementRole(actorRole)) {
    return [];
  }

  const prisma = await getSharedPrismaClientAsync();
  const memberships = await runWithoutTenantContext(() =>
    prisma.userCompany.findMany({
      where: {
        companyId,
        isActive: true,
        user: { isActive: true },
      },
      select: {
        role: true,
        roleRef: { select: { key: true, name: true } },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
  );

  const seen = new Set();
  const list = [];

  for (const m of memberships) {
    if (!m.user || seen.has(m.user.id)) continue;
    seen.add(m.user.id);
    const effectiveRole = m.user.role === 'SUPER_ADMIN'
      ? 'SUPER_ADMIN'
      : m.roleRef?.key || m.role || m.user.role || 'AGENT';

    if (canManageTargetUser({ actorId, actorRole, targetUserId: m.user.id, targetRole: effectiveRole })) {
      list.push({
        id: m.user.id,
        name: `${m.user.firstName || ''} ${m.user.lastName || ''}`.trim() || m.user.email,
        email: m.user.email,
        role: effectiveRole,
        roleName: m.roleRef?.name || effectiveRole,
      });
    }
  }

  return list;
}

module.exports = {
  USER_API_KEY_PREFIX,
  isUserApiKey,
  hashUserApiKey,
  maskKeyPrefix,
  generateUserApiKey,
  getRoleRank,
  isManagementRole,
  canManageTargetUser,
  resolveAuthenticatedUserFromApiKey,
  getCapabilitiesForUser,
  createKey,
  updateKey,
  listKeys,
  revokeKey,
  deleteKey,
  listManageableUsers,
};

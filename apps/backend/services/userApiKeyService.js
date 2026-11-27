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

  // Live RBAC permissions from DB/cache — automatically reflects newly granted or revoked permissions
  let userPermissions = [];
  if (effectiveCompanyId && effectiveRole !== 'SUPER_ADMIN') {
    try {
      userPermissions = await permissionService.getUserPermissions(user.id, effectiveCompanyId);
    } catch (_) {
      userPermissions = [];
    }
  }

  // Non-blocking telemetry update
  runWithoutTenantContext(() =>
    prisma.userApiKey.update({
      where: { id: keyRow.id },
      data: {
        lastUsedAt: new Date(),
        ...(ip ? { lastUsedIp: String(ip).slice(0, 64) } : {}),
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
      role: effectiveRole,
      merchantId: user.merchantId || null,
      companyId: effectiveCompanyId,
      effectiveCompanyId,
      userPermissions,
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

async function createKey({ companyId, actorId, actorRole, targetUserId, name, expiresAt = null }) {
  const trimmedName = String(name || '').trim();
  if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 100) {
    const err = new Error('اسم المفتاح مطلوب (من 2 إلى 100 حرف)');
    err.statusCode = 400;
    throw err;
  }

  let parsedExpiresAt = null;
  if (expiresAt) {
    parsedExpiresAt = new Date(expiresAt);
    if (Number.isNaN(parsedExpiresAt.getTime()) || parsedExpiresAt <= new Date()) {
      const err = new Error('تاريخ الانتهاء يجب أن يكون تاريخاً مستقبلياً صالحاً');
      err.statusCode = 400;
      throw err;
    }
  }

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

  const generated = generateUserApiKey();
  const created = await runWithoutTenantContext(() =>
    prisma.userApiKey.create({
      data: {
        userId: resolvedTargetId,
        companyId,
        name: trimmedName,
        keyPrefix: generated.keyPrefix,
        keyHash: generated.keyHash,
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
  createKey,
  listKeys,
  revokeKey,
  deleteKey,
  listManageableUsers,
};

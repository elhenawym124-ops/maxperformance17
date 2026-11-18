'use strict';

/**
 * @module v2/core/authContext
 * @description Unified authentication and strict tenant context for /api/v2
 * Supports Tenant API Keys (hashed) and User JWTs with instant revocation.
 */

const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../../utils/jwtSecret');
const { getSharedPrismaClient } = require('../../services/sharedDatabase');
const tenantContext = require('../../services/tenantContext');
const developerApiService = require('../../services/developerApiService');
const redisCacheService = require('../../services/redisCacheService');
const permissionService = require('../../services/permissionService');
const { UnauthorizedError, ForbiddenError } = require('./errors');

function extractRawToken(req) {
  const authHeader = String(req.headers.authorization || '').trim();
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const apiKeyHeader = String(req.headers['x-api-key'] || req.headers['X-Api-Key'] || '').trim();
  if (apiKeyHeader) return apiKeyHeader;
  return authHeader || null;
}

/**
 * Resolves permissions for a user within a specific company with Redis caching (5 min TTL)
 */
async function resolveUserPermissions(userId, companyId) {
  const cacheKey = `v2:perms:${userId}:${companyId}`;
  try {
    const cached = await redisCacheService.get(cacheKey);
    if (cached && Array.isArray(cached)) {
      return cached;
    }
  } catch (_) {}

  const perms = await permissionService.getUserPermissions(userId, companyId);
  const permissionsList = Array.isArray(perms) ? perms : [];

  try {
    await redisCacheService.set(cacheKey, permissionsList, 300);
  } catch (_) {}

  return permissionsList;
}

/**
 * Main authentication middleware for /api/v2
 */
async function authContextMiddleware(req, res, next) {
  const rawToken = extractRawToken(req);
  if (!rawToken) {
    return next(new UnauthorizedError('مفتاح API أو توكن المصادقة مطلوب للوصول إلى /api/v2'));
  }

  // ─── 1. Tenant API Key (mxp_live_... or mxp_test_...) ──────────────────────────
  if (rawToken.startsWith('mxp_live_') || rawToken.startsWith('mxp_test_')) {
    try {
      const verifyRes = await developerApiService.verifyCredential(rawToken, { requiredType: 'API' });
      if (!verifyRes || !verifyRes.ok) {
        if (verifyRes?.reason === 'inactive') {
          return next(new UnauthorizedError('مفتاح API هذا معطل', { subCode: 'KEY_INACTIVE' }));
        }
        if (verifyRes?.reason === 'expired') {
          return next(new UnauthorizedError('انتهت صلاحية مفتاح API هذا', { subCode: 'KEY_EXPIRED' }));
        }
        return next(new UnauthorizedError('مفتاح API غير صالح', { subCode: 'INVALID_API_KEY' }));
      }

      const credential = verifyRes.credential;

      // Instant revocation check
      const revoked = await redisCacheService.get(`v2:revoked:key:${credential.id}`);
      if (revoked) {
        return next(new UnauthorizedError('تم إلغاء مفتاح API هذا فورياً', { subCode: 'KEY_REVOKED' }));
      }

      const scopes = Array.isArray(credential.scopes) ? credential.scopes : [];
      req.authContext = {
        actorType: 'API_KEY',
        actorId: credential.id,
        apiKeyId: credential.id,
        keyPrefix: credential.keyPrefix,
        companyId: credential.companyId,
        scopes,
        permissions: new Set(scopes),
        deniedPermissions: new Set(),
        role: 'API_CLIENT',
        deviceType: 'OFFICE',
        branchId: null,
      };

      // Strict tenant isolation: purge any client-supplied companyId
      delete req.body?.companyId;
      delete req.query?.companyId;
      delete req.params?.companyId;

      return tenantContext.run(credential.companyId, next);
    } catch (err) {
      return next(err);
    }
  }

  // ─── 2. User JWT Bearer Token ───────────────────────────────────────────────
  const secret = getJwtSecret();
  let decoded;
  try {
    decoded = jwt.verify(rawToken, secret);
  } catch (jwtErr) {
    if (jwtErr.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('انتهت صلاحية الجلسة، يرجى تحديث التوكن', { subCode: 'TOKEN_EXPIRED' }));
    }
    return next(new UnauthorizedError('رمز المصادقة غير صالح', { subCode: 'INVALID_TOKEN' }));
  }

  try {
    const userId = decoded.userId || decoded.sub || decoded.id;
    if (!userId) {
      return next(new UnauthorizedError('بيانات التوكن غير مكتملة', { subCode: 'INVALID_TOKEN_PAYLOAD' }));
    }

    // Instant user revocation check
    const isRevoked = await redisCacheService.get(`v2:revoked:user:${userId}`);
    if (isRevoked) {
      return next(new UnauthorizedError('تم إنهاء هذه الجلسة، يرجى تسجيل الدخول مجدداً', { subCode: 'SESSION_REVOKED' }));
    }

    // Resolve tenant companyId
    const companyId = decoded.effectiveCompanyId || decoded.companyId;
    if (!companyId && decoded.role !== 'SUPER_ADMIN') {
      return next(new UnauthorizedError('التوكن غير مرتبط بشركة نشطة', { subCode: 'NO_COMPANY_CONTEXT' }));
    }

    // Load active permissions
    const permissionsList = await resolveUserPermissions(userId, companyId);

    req.authContext = {
      actorType: 'USER',
      actorId: userId,
      userId,
      companyId,
      role: decoded.role || 'USER',
      permissions: new Set(permissionsList),
      deniedPermissions: new Set(decoded.deniedPermissions || []),
      deviceType: decoded.deviceType || 'OFFICE',
      branchId: decoded.branchId || null,
      userName: decoded.name || null,
    };

    // Strict tenant isolation
    delete req.body?.companyId;
    delete req.query?.companyId;
    delete req.params?.companyId;

    return tenantContext.run(companyId, next);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  extractRawToken,
  resolveUserPermissions,
  authContextMiddleware,
};

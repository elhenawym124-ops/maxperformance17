'use strict';

/**
 * @module userApiKeyRoutes
 * @description Management endpoints for Personal Employee/User API Keys (`mxp_usr_*`).
 * Mounted at `/api/v1/user-api-keys`.
 */

const express = require('express');
const router = express.Router();
const verifyToken = require('../utils/verifyToken');
const userApiKeyService = require('../services/userApiKeyService');

router.use(verifyToken.authenticateToken, verifyToken.requireCompanyAccess);

const getCompanyId = (req) => req.user?.effectiveCompanyId || req.user?.companyId;

/**
 * GET /api/v1/user-api-keys/whoami
 * Live identity + permissions probe (ideal for AI agents verifying their key).
 */
router.get('/whoami', (req, res) => {
  const u = req.user || {};
  return res.json({
    success: true,
    data: {
      userId: u.id,
      email: u.email,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      role: u.role,
      companyId: getCompanyId(req),
      authType: u.authType || 'JWT',
      apiKeyPrefix: u.apiKeyPrefix || null,
      deviceType: u.deviceType || 'OFFICE',
      permissions: Array.isArray(u.userPermissions) ? u.userPermissions : [],
      canManageTeamKeys: userApiKeyService.isManagementRole(u.role),
    },
  });
});

/**
 * GET /api/v1/user-api-keys/manageable-users
 * Returns employees the caller (MANAGER/COMPANY_ADMIN/OWNER/SUPER_ADMIN) can issue keys for.
 */
router.get('/manageable-users', async (req, res) => {
  try {
    const users = await userApiKeyService.listManageableUsers({
      companyId: getCompanyId(req),
      actorId: req.user.id,
      actorRole: req.user.role,
    });
    return res.json({ success: true, data: users });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'فشل تحميل قائمة الموظفين',
    });
  }
});

/**
 * GET /api/v1/user-api-keys/me
 * List caller's own keys in the active company.
 */
router.get('/me', async (req, res) => {
  try {
    const includeRevoked = String(req.query.includeRevoked || 'false') === 'true';
    const data = await userApiKeyService.listKeys({
      companyId: getCompanyId(req),
      actorId: req.user.id,
      actorRole: req.user.role,
      targetUserId: req.user.id,
      includeRevoked,
    });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'فشل تحميل مفاتيح API',
    });
  }
});

/**
 * GET /api/v1/user-api-keys/users/:userId
 * List keys for a specific employee (self or manager/admin/owner).
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const includeRevoked = String(req.query.includeRevoked || 'false') === 'true';
    const data = await userApiKeyService.listKeys({
      companyId: getCompanyId(req),
      actorId: req.user.id,
      actorRole: req.user.role,
      targetUserId: req.params.userId,
      includeRevoked,
    });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'فشل تحميل مفاتيح الموظف',
    });
  }
});

/**
 * GET /api/v1/user-api-keys
 * Supports ?scope=company (managers/owners) or ?userId=... or defaults to caller's own keys.
 */
router.get('/', async (req, res) => {
  try {
    const includeRevoked = String(req.query.includeRevoked || 'false') === 'true';
    const scope = req.query.scope === 'company' ? 'company' : 'self';
    const targetUserId = req.query.userId ? String(req.query.userId).trim() : null;

    const data = await userApiKeyService.listKeys({
      companyId: getCompanyId(req),
      actorId: req.user.id,
      actorRole: req.user.role,
      targetUserId,
      scope,
      includeRevoked,
    });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'فشل تحميل مفاتيح API',
    });
  }
});

/**
 * POST /api/v1/user-api-keys
 * Create a personal API key for self or (if manager/admin/owner) for an employee.
 * Raw key is returned ONCE in `secret.apiKey`.
 */
router.post('/', async (req, res) => {
  try {
    const { name, userId, expiresAt } = req.body || {};
    const { key, rawKey } = await userApiKeyService.createKey({
      companyId: getCompanyId(req),
      actorId: req.user.id,
      actorRole: req.user.role,
      targetUserId: userId || req.user.id,
      name,
      expiresAt: expiresAt || null,
    });

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء مفتاح API بنجاح. احفظه الآن فلن يُعرض مرة أخرى.',
      data: key,
      secret: {
        apiKey: rawKey,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'فشل إنشاء مفتاح API',
    });
  }
});

/**
 * POST /api/v1/user-api-keys/:id/revoke
 * Immediately revoke a key.
 */
router.post('/:id/revoke', async (req, res) => {
  try {
    const updated = await userApiKeyService.revokeKey({
      companyId: getCompanyId(req),
      keyId: req.params.id,
      actorId: req.user.id,
      actorRole: req.user.role,
      reason: req.body?.reason || null,
    });
    return res.json({
      success: true,
      message: 'تم إيقاف المفتاح فوراً',
      data: updated,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'فشل إيقاف المفتاح',
    });
  }
});

/**
 * DELETE /api/v1/user-api-keys/:id
 * Delete a key record.
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await userApiKeyService.deleteKey({
      companyId: getCompanyId(req),
      keyId: req.params.id,
      actorId: req.user.id,
      actorRole: req.user.role,
    });
    return res.json({
      success: true,
      message: 'تم حذف المفتاح نهائياً',
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'فشل حذف المفتاح',
    });
  }
});

module.exports = router;

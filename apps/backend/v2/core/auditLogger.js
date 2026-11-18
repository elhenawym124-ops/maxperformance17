'use strict';

/**
 * @module v2/core/auditLogger
 * @description Centralized immutable audit logger recording actor, target, state diff, and IP
 */

const { getSharedPrismaClient } = require('../../services/sharedDatabase');

function sanitizeState(state) {
  if (!state || typeof state !== 'object') return state;
  const clone = { ...state };
  delete clone.password;
  delete clone.passwordHash;
  delete clone.token;
  delete clone.secret;
  return clone;
}

/**
 * Log an audit event
 */
async function logAuditEvent({
  req,
  category = 'orders',
  action,
  description = null,
  targetType = 'Order',
  targetId = null,
  beforeState = null,
  afterState = null,
  severity = 'LOW',
  isFinancial = false,
}) {
  const authContext = req?.authContext || {};
  const companyId = authContext.companyId;
  const userId = authContext.userId || (authContext.actorType === 'API_KEY' ? null : authContext.actorId);

  const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || 'unknown';
  const requestId = req?.requestId || req?.headers?.['x-request-id'] || null;

  const metadata = JSON.stringify({
    actorType: authContext.actorType || 'USER',
    apiKeyPrefix: authContext.keyPrefix || null,
    apiKeyId: authContext.apiKeyId || null,
    ipAddress,
    requestId,
    before: sanitizeState(beforeState),
    after: sanitizeState(afterState),
  });

  const entry = {
    companyId,
    userId,
    category,
    action: action || 'ORDER_ACTION',
    description: description || `إجراء ${action} على ${targetType} #${targetId || ''}`,
    targetType,
    targetId: targetId ? String(targetId) : null,
    metadata,
    severity,
    isSuccess: true,
    isLocked: true,
  };

  const writePromise = (async () => {
    try {
      const prisma = getSharedPrismaClient();
      await prisma.activityLog.create({ data: entry });
    } catch (err) {
      console.error('[AUDIT_LOG_ERROR] Failed to persist activity log:', err.message);
    }
  })();

  if (isFinancial) {
    // Financial writes must wait for audit persistence
    await writePromise;
  }
}

module.exports = {
  logAuditEvent,
};

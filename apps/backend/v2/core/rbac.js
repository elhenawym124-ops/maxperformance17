'use strict';

/**
 * @module v2/core/rbac
 * @description RBAC enforcement engine with explicit Deny Rules override
 * and legacy alias resolution
 */

const { ForbiddenError } = require('./errors');

// Comprehensive mapping from standard v2 permission keys to legacy v1 keys & API scopes
const PERMISSION_ALIASES = {
  // Orders Core
  'orders.order.read': ['orders.view', 'orders.read', 'orders:read', 'orders.*'],
  'orders.order.create': ['orders.create', 'orders:write', 'orders.*'],
  'orders.order.update': ['orders.edit', 'orders:write', 'orders.*'],
  'orders.order.delete': ['orders.delete', 'orders:write', 'orders.*'],
  'orders.order.export': ['orders.export', 'orders:export', 'orders.*'],

  // Order Items
  'orders.items.manage': ['orders.edit', 'orders.items.edit', 'orders:write', 'orders.*'],

  // Pricing & Discounts
  'orders.pricing.override': ['orders.discount', 'orders.edit', 'orders:write', 'orders.*'],

  // Status & Transitions
  'orders.status.transition': ['orders.update_status', 'orders.status.change', 'orders:write', 'orders.*'],
  'orders.status.bulk_transition': ['orders.update_status', 'orders.bulk', 'orders:write', 'orders.*'],

  // Assignment & Call Queue
  'orders.assignment.manage': ['orders.assign', 'orders.edit', 'orders:write', 'orders.*'],
  'orders.queue.claim': ['orders.claim', 'orders.view', 'orders.*'],
  'orders.queue.log_attempt': ['orders.call_attempt', 'orders.edit', 'orders.*'],

  // Shipping & Dispatch
  'orders.fulfillment.dispatch': ['shipping.create_awb', 'orders.shipping', 'orders:write', 'orders.*'],
  'orders.fulfillment.print_label': ['shipping.print', 'orders.view', 'orders.*'],
  'orders.fulfillment.cancel_dispatch': ['shipping.cancel', 'orders.shipping', 'orders:write', 'orders.*'],

  // Financials & Payments
  'orders.financials.collect_payment': ['payments.record', 'orders.edit', 'orders:write', 'orders.*'],
  'orders.financials.refund': ['orders.refund', 'payments.refund', 'orders:write', 'orders.*'],

  // Returns & Timeline
  'orders.returns.create': ['returns.manage', 'orders.returns', 'orders:write', 'orders.*'],
  'orders.timeline.read': ['orders.view', 'orders.history', 'orders:read', 'orders.*'],
  'orders.notes.create': ['orders.notes', 'orders.edit', 'orders:write', 'orders.*'],

  // PII Unmask
  'customers.pii.unmask': ['customers.unmask', 'admin', 'OWNER', 'COMPANY_ADMIN'],
  'inventory.cost.read_raw': ['inventory.cost.view', 'admin', 'OWNER', 'COMPANY_ADMIN'],
};

/**
 * Check if the active authContext holds the required permission
 */
function hasPermission(authContext, requiredPermission) {
  if (!authContext) return false;

  // 1. Explicit Deny Rules override EVERYTHING
  if (authContext.deniedPermissions && authContext.deniedPermissions.has(requiredPermission)) {
    return false;
  }

  // 2. Platform Super Admin and Company Owner bypass (unless explicitly denied)
  if (['SUPER_ADMIN', 'OWNER'].includes(authContext.role)) {
    return true;
  }

  const userPerms = authContext.permissions;
  if (!userPerms) return false;

  // 3. Direct match
  if (userPerms.has(requiredPermission)) {
    return true;
  }

  // 4. Wildcard match (e.g. orders.*)
  const [domain] = requiredPermission.split('.');
  if (userPerms.has(`${domain}.*`) || userPerms.has('*')) {
    return true;
  }

  // 5. Legacy aliases match
  const aliases = PERMISSION_ALIASES[requiredPermission] || [];
  for (const alias of aliases) {
    if (userPerms.has(alias)) {
      return true;
    }
  }

  return false;
}

/**
 * Middleware factory ensuring required permission
 */
function requirePermission(requiredPermission) {
  if (!requiredPermission) {
    throw new Error('FAIL-CLOSED: requirePermission called without a valid permission key');
  }

  return (req, res, next) => {
    if (!req.authContext) {
      return next(new ForbiddenError('سياق الأمان مفقود'));
    }

    if (!hasPermission(req.authContext, requiredPermission)) {
      return next(
        new ForbiddenError('ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء', {
          requiredPermission,
          scope: req.authContext.scope || 'TENANT',
        })
      );
    }

    return next();
  };
}

module.exports = {
  PERMISSION_ALIASES,
  hasPermission,
  requirePermission,
};

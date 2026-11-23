/**
 * Platform Permissions Registry
 * Single Source of Truth for Platform & Marketplace App Permissions
 */

let SEEDED_PERMISSIONS = [];
try {
  const seedModule = require('../prisma/seeds/seedPermissions');
  // If seed module exports PERMISSIONS array or exports directly
  if (Array.isArray(seedModule)) {
    SEEDED_PERMISSIONS = seedModule;
  } else if (seedModule && Array.isArray(seedModule.PERMISSIONS)) {
    SEEDED_PERMISSIONS = seedModule.PERMISSIONS;
  }
} catch (_) {}

// Core fallback permissions covering all platform domains if seed module isn't loaded
const FALLBACK_PERMISSIONS = [
  'dashboard.view', 'dashboard.view.all', 'dashboard.view.team', 'dashboard.view.own',
  'analytics.view', 'analytics.view.own',
  'orders.view', 'orders.create', 'orders.edit', 'orders.delete', 'orders.status.change',
  'orders.assign', 'orders.export', 'orders.bulk.create', 'orders.bulk.view', 'orders.bulk.edit',
  'orders.bulk.delete', 'orders.bulk.export', 'orders.invoice.print',
  'orders.incomplete.view', 'orders.incomplete.edit', 'orders.incomplete.delete',
  'orders.preparation.view', 'orders.preparation.manage',
  'orders.confirmation.view', 'orders.confirmation.manage',
  'orders.quickstatus.view', 'orders.quickstatus.manage',
  'orders.turbo.view', 'orders.turbo.manage',
  'orders.bosta.view', 'orders.bosta.manage',
  'orders.stats.view', 'orders.automation.view', 'orders.automation.manage',
  'orders.invoices.view', 'orders.invoices.manage', 'orders.manual.create',
  'orders.status-summary.view', 'orders.returns.view', 'orders.returns.manage',
  'orders.returns.approve', 'orders.shipping.view', 'orders.shipping.manage',
  'courier.view', 'courier.manage', 'courier.runs.view', 'courier.runs.manage',
  'courier.settlement.view', 'courier.settlement.manage', 'courier.settings.view', 'courier.settings.manage',
  'settings.read', 'settings.view', 'settings.general', 'settings.shipping', 'settings.whatsapp',
  'settings.whatsapp.manage', 'whatsapp.settings', 'marketing.broadcast', 'whatsapp.broadcast',
  'inventory.view', 'inventory.manage', 'products.view', 'products.manage',
  'customers.view', 'customers.manage', 'reports.view', 'accounting.view', 'accounting.manage',
  'education.view', 'education.students.view', 'education.students.manage', 'education.sessions.view',
  'education.sessions.manage', 'education.financials.view', 'education.financials.manage',
  'tools.view', 'tools.manage', 'marketplace.view', 'marketplace.install'
];

const PERMISSION_KEYS = new Set([
  ...FALLBACK_PERMISSIONS,
  ...SEEDED_PERMISSIONS.map(p => (typeof p === 'string' ? p : p.key)).filter(Boolean)
]);

/**
 * Checks if a given permission key exists in the platform permissions registry
 * @param {string} key
 * @returns {boolean}
 */
function isValidPermission(key) {
  if (!key || typeof key !== 'string') return false;
  const normalized = key.trim();
  return PERMISSION_KEYS.has(normalized);
}

module.exports = {
  PERMISSION_KEYS,
  isValidPermission
};

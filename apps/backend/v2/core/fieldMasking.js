'use strict';

/**
 * @module v2/core/fieldMasking
 * @description Centralized field masking interceptor and masked write guard
 */

const PII_UNMASK_PERMISSION = 'customers.pii.unmask';
const ADDRESS_UNMASK_PERMISSION = 'customers.address.unmask';
const COST_UNMASK_PERMISSION = 'inventory.cost.read_raw';
const HR_UNMASK_PERMISSION = 'hr.salaries.read_raw';

/**
 * Mask an Egyptian/international phone number: 01012345678 -> 010****5678
 */
function maskPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return phone;
  const clean = phone.trim();
  if (clean.length < 7) return '***';
  const prefix = clean.slice(0, 3);
  const suffix = clean.slice(-4);
  return `${prefix}****${suffix}`;
}

/**
 * Mask street address: keeps city/gov, hides detailed street
 */
function maskAddress(address) {
  if (!address || typeof address !== 'string') return address;
  const parts = address.split('-').map((p) => p.trim());
  if (parts.length > 1) {
    return `${parts[0]} - ${parts[1]} (مخفي)`;
  }
  return `${address.slice(0, 8)}... (مخفي)`;
}

/**
 * Check if a field value contains a masking artifact
 */
function isMaskedValue(value) {
  if (typeof value !== 'string') return false;
  return value.includes('****') || value.includes('***') || value.includes('(مخفي)');
}

/**
 * Sanitizes input body before update/create:
 * Strips any field containing a masked pattern so user cannot overwrite
 * real data with masked placeholders.
 */
function sanitizeMaskedInput(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  if (Array.isArray(payload)) {
    return payload.map(sanitizeMaskedInput);
  }

  const clean = {};
  for (const [key, value] of Object.entries(payload)) {
    if (isMaskedValue(value)) {
      // Ignored to prevent corrupting real data
      continue;
    }
    if (value && typeof value === 'object') {
      clean[key] = sanitizeMaskedInput(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Recursively masks sensitive fields in a response payload
 */
function maskSensitiveFields(data, permissions = new Set()) {
  const canUnmaskPii = permissions.has(PII_UNMASK_PERMISSION) || permissions.has('admin');
  const canUnmaskAddress = canUnmaskPii || permissions.has(ADDRESS_UNMASK_PERMISSION) || permissions.has('orders.fulfillment.ship');
  const canUnmaskCost = permissions.has(COST_UNMASK_PERMISSION) || permissions.has('admin');
  const canUnmaskHr = permissions.has(HR_UNMASK_PERMISSION) || permissions.has('admin');

  const maskedFieldsSet = new Set();

  function traverse(obj, path = '') {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item, idx) => traverse(item, `${path}[${idx}]`));
    }

    const cloned = {};
    for (const [key, val] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      // 1. Phone number PII
      if (['customerPhone', 'alternatePhone', 'turboCaptainPhone', 'turboBranchPhone'].includes(key)) {
        if (!canUnmaskPii && val) {
          cloned[key] = maskPhoneNumber(String(val));
          maskedFieldsSet.add(currentPath);
          continue;
        }
      }

      // 2. Detailed address PII
      if (['shippingAddress', 'customerAddress', 'billingAddress'].includes(key)) {
        if (!canUnmaskAddress && val) {
          cloned[key] = maskAddress(String(val));
          maskedFieldsSet.add(currentPath);
          continue;
        }
      }

      // 3. Cost & Profit COGS
      if (['costPrice', 'cost', 'netProfit', 'wholesalePrice', 'supplierPrice'].includes(key)) {
        if (!canUnmaskCost && val !== undefined && val !== null) {
          cloned[key] = null;
          maskedFieldsSet.add(currentPath);
          continue;
        }
      }

      // 4. HR Salaries
      if (['baseSalary', 'netSalary', 'bankAccount', 'nationalId'].includes(key)) {
        if (!canUnmaskHr && val !== undefined && val !== null) {
          cloned[key] = null;
          maskedFieldsSet.add(currentPath);
          continue;
        }
      }

      // Recurse into nested objects
      if (val && typeof val === 'object' && !(val instanceof Date)) {
        cloned[key] = traverse(val, currentPath);
      } else {
        cloned[key] = val;
      }
    }

    return cloned;
  }

  const maskedData = traverse(data);
  return {
    maskedData,
    maskedFields: Array.from(maskedFieldsSet),
  };
}

module.exports = {
  PII_UNMASK_PERMISSION,
  ADDRESS_UNMASK_PERMISSION,
  COST_UNMASK_PERMISSION,
  HR_UNMASK_PERMISSION,
  maskPhoneNumber,
  maskAddress,
  isMaskedValue,
  sanitizeMaskedInput,
  maskSensitiveFields,
};

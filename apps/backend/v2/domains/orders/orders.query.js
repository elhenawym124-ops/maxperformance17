'use strict';

/**
 * @module v2/domains/orders/orders.query
 * @description Query helpers, sparse field selection, and read operations for Orders
 */

const { getSharedPrismaClient } = require('../../../services/sharedDatabase');
const { buildCursorPrismaWhere, formatPaginationResult } = require('../../core/cursorPagination');
const { NotFoundError } = require('../../core/errors');

function parseSparseSelect(fieldsString) {
  if (!fieldsString || typeof fieldsString !== 'string') return null;
  const fields = fieldsString.split(',').map((f) => f.trim()).filter(Boolean);
  if (fields.length === 0) return null;

  const select = { id: true };
  const allowed = [
    'orderNumber', 'status', 'customStatusCode', 'customerId', 'customerName',
    'customerPhone', 'customerEmail', 'shippingAddress', 'city', 'governorate',
    'subtotal', 'tax', 'shipping', 'discount', 'total', 'currency', 'notes',
    'paymentStatus', 'paymentMethod', 'assignedTo', 'confirmedAt', 'confirmedBy',
    'createdAt', 'updatedAt', 'turboTrackingNumber', 'turboShipmentStatus'
  ];

  for (const f of fields) {
    if (allowed.includes(f)) {
      select[f] = true;
    }
  }
  return select;
}

function parseIncludes(includeString) {
  if (!includeString || typeof includeString !== 'string') return undefined;
  const parts = includeString.split(',').map((p) => p.trim()).filter(Boolean);
  const include = {};

  if (parts.includes('items')) {
    include.orderItems = {
      include: {
        product: {
          select: { id: true, name: true, sku: true, cost: true, price: true }
        }
      }
    };
  }
  if (parts.includes('customer')) {
    include.customer = {
      select: { id: true, name: true, phone: true, email: true, totalOrders: true }
    };
  }
  if (parts.includes('notes')) {
    include.orderNotes = { take: 20, orderBy: { id: 'desc' } };
  }
  if (parts.includes('shipments')) {
    include.shipments = true;
  }

  return Object.keys(include).length > 0 ? include : undefined;
}

/**
 * List orders with cursor-based pagination, scoping, filtering, and sparse fieldsets
 */
async function listOrders({
  companyId,
  scopeFilter = {},
  pagination,
  filters = {},
  fields = null,
  include = null,
}) {
  const prisma = getSharedPrismaClient();

  const whereConditions = {
    companyId,
    ...scopeFilter,
  };

  // Status filter
  if (filters.status) {
    const statuses = filters.status.split(',').map((s) => s.trim().toUpperCase());
    whereConditions.status = { in: statuses };
  }

  // Exact phone filter (blind lookup)
  if (filters.phoneExact) {
    whereConditions.customerPhone = filters.phoneExact.trim();
  } else if (filters.customerPhone) {
    whereConditions.customerPhone = { contains: filters.customerPhone.trim() };
  }

  if (filters.orderNumber) {
    whereConditions.orderNumber = { contains: filters.orderNumber.trim() };
  }

  if (filters.assignedTo) {
    whereConditions.assignedTo = filters.assignedTo;
  }

  if (filters.createdAtGte || filters.createdAtLte) {
    whereConditions.createdAt = {};
    if (filters.createdAtGte) whereConditions.createdAt.gte = new Date(filters.createdAtGte);
    if (filters.createdAtLte) whereConditions.createdAt.lte = new Date(filters.createdAtLte);
  }

  const finalWhere = buildCursorPrismaWhere({
    cursor: pagination.cursor,
    sortField: pagination.sortField,
    sortOrder: pagination.sortOrder,
    direction: pagination.direction,
    existingWhere: whereConditions,
  });

  const select = parseSparseSelect(fields);
  const includeQuery = select ? undefined : parseIncludes(include);

  const queryArgs = {
    where: finalWhere,
    take: pagination.limit + 1,
    orderBy: [
      { [pagination.sortField]: pagination.sortOrder },
      { id: pagination.sortOrder },
    ],
  };

  if (select) {
    queryArgs.select = select;
  } else if (includeQuery) {
    queryArgs.include = includeQuery;
  }

  const rows = await prisma.order.findMany(queryArgs);

  return formatPaginationResult({
    rows,
    limit: pagination.limit,
    sortField: pagination.sortField,
  });
}

/**
 * Get single order by ID with scope validation
 */
async function getOrderById({ companyId, orderId, scopeFilter = {}, include = 'items,customer,notes' }) {
  const prisma = getSharedPrismaClient();

  const where = {
    id: orderId,
    companyId,
    ...scopeFilter,
  };

  const order = await prisma.order.findFirst({
    where,
    include: parseIncludes(include),
  });

  if (!order) {
    throw new NotFoundError('الطلب', orderId);
  }

  return order;
}

module.exports = {
  parseSparseSelect,
  parseIncludes,
  listOrders,
  getOrderById,
};

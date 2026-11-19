'use strict';

/**
 * @module v2/domains/orders/orders.service
 * @description Core mutations for the Orders Domain in /api/v2
 */

const { getSharedPrismaClient } = require('../../../services/sharedDatabase');
const { logAuditEvent } = require('../../core/auditLogger');
const { NotFoundError, ValidationError } = require('../../core/errors');
const { listOrders, getOrderById } = require('./orders.query');

/**
 * Create order with items & totals calculation
 */
async function createOrder({ companyId, userId, payload, req }) {
  const prisma = getSharedPrismaClient();

  const items = payload.items || [];
  let subtotal = 0;
  const orderItemsData = [];

  for (const item of items) {
    const qty = parseInt(item.quantity, 10) || 1;
    const price = parseFloat(item.price) || 0;
    const lineTotal = qty * price;
    subtotal += lineTotal;

    orderItemsData.push({
      productId: item.productId || null,
      variantId: item.variantId || null,
      productName: item.productName,
      productSku: item.productSku || null,
      productColor: item.productColor || null,
      productSize: item.productSize || null,
      quantity: qty,
      price,
      total: lineTotal,
    });
  }

  const shipping = parseFloat(payload.shipping) || 0;
  const discount = parseFloat(payload.discount) || 0;
  const total = Math.max(subtotal + shipping - discount, 0);

  const orderNumber = payload.orderNumber || `ORD-${Date.now().toString(36).toUpperCase()}`;

  // Find or create customer if customerId not provided
  let customerId = payload.customerId;
  if (!customerId && payload.customerPhone) {
    let cust = await prisma.customer.findFirst({
      where: { companyId, phone: payload.customerPhone.trim() },
    });
    if (!cust) {
      cust = await prisma.customer.create({
        data: {
          companyId,
          name: payload.customerName || 'عميل جديد',
          phone: payload.customerPhone.trim(),
          email: payload.customerEmail || null,
          address: payload.shippingAddress || null,
          city: payload.city || null,
          governorate: payload.governorate || null,
        },
      });
    }
    customerId = cust.id;
  }

  const created = await prisma.order.create({
    data: {
      companyId,
      customerId: customerId || 'guest',
      orderNumber,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerEmail: payload.customerEmail || null,
      shippingAddress: payload.shippingAddress,
      city: payload.city || null,
      governorate: payload.governorate || null,
      subtotal,
      tax: 0,
      shipping,
      discount,
      total,
      currency: payload.currency || 'EGP',
      paymentMethod: payload.paymentMethod || 'CASH',
      notes: payload.notes || null,
      status: 'PENDING',
      createdBy: userId,
      orderItems: {
        create: orderItemsData,
      },
    },
    include: {
      orderItems: true,
      customer: true,
    },
  });

  await logAuditEvent({
    req,
    action: 'ORDER_CREATED',
    description: `إنشاء الطلب #${created.orderNumber}`,
    targetType: 'Order',
    targetId: created.id,
    afterState: { id: created.id, total: created.total, status: created.status },
    isFinancial: true,
  });

  return created;
}

/**
 * Update order basic fields
 */
async function updateOrder({ companyId, orderId, scopeFilter = {}, payload, req }) {
  const prisma = getSharedPrismaClient();

  const existing = await prisma.order.findFirst({
    where: { id: orderId, companyId, ...scopeFilter },
  });

  if (!existing) {
    throw new NotFoundError('الطلب', orderId);
  }

  const data = {};
  if (payload.customerName) data.customerName = payload.customerName;
  if (payload.customerPhone) data.customerPhone = payload.customerPhone;
  if (payload.shippingAddress) data.shippingAddress = payload.shippingAddress;
  if (payload.city !== undefined) data.city = payload.city;
  if (payload.governorate !== undefined) data.governorate = payload.governorate;
  if (payload.notes !== undefined) data.notes = payload.notes;

  if (payload.shipping !== undefined || payload.discount !== undefined) {
    const shipping = payload.shipping !== undefined ? parseFloat(payload.shipping) : parseFloat(existing.shipping);
    const discount = payload.discount !== undefined ? parseFloat(payload.discount) : parseFloat(existing.discount);
    const subtotal = parseFloat(existing.subtotal);
    data.shipping = shipping;
    data.discount = discount;
    data.total = Math.max(subtotal + shipping - discount, 0);
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data,
    include: { orderItems: true },
  });

  await logAuditEvent({
    req,
    action: 'ORDER_UPDATED',
    description: `تحديث بيانات الطلب #${existing.orderNumber}`,
    targetType: 'Order',
    targetId: orderId,
    beforeState: existing,
    afterState: updated,
  });

  return updated;
}

/**
 * Delete order (logical cancellation/soft delete)
 */
async function deleteOrder({ companyId, orderId, scopeFilter = {}, req }) {
  const prisma = getSharedPrismaClient();

  const existing = await prisma.order.findFirst({
    where: { id: orderId, companyId, ...scopeFilter },
  });

  if (!existing) {
    throw new NotFoundError('الطلب', orderId);
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: 'CANCELLED', notes: `${existing.notes || ''}\n[ملغي عبر API]` },
  });

  await logAuditEvent({
    req,
    action: 'ORDER_DELETED',
    description: `إلغاء وحذف الطلب #${existing.orderNumber}`,
    targetType: 'Order',
    targetId: orderId,
    beforeState: existing,
    afterState: updated,
    isFinancial: true,
  });

  return { message: 'تم إلغاء وحذف الطلب بنجاح', orderId };
}

/**
 * Transition order status
 */
async function transitionStatus({ companyId, orderId, scopeFilter = {}, newStatus, notes, req }) {
  const prisma = getSharedPrismaClient();

  const existing = await prisma.order.findFirst({
    where: { id: orderId, companyId, ...scopeFilter },
  });

  if (!existing) {
    throw new NotFoundError('الطلب', orderId);
  }

  const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];
  const targetStatus = String(newStatus).toUpperCase();

  if (!validStatuses.includes(targetStatus)) {
    throw new ValidationError(`الحالة المطلوبة [${newStatus}] غير صالحة`, { field: 'status' });
  }

  const updateData = {
    status: targetStatus,
  };

  if (targetStatus === 'CONFIRMED') {
    updateData.confirmedAt = new Date();
    updateData.confirmedBy = req.authContext.userId || req.authContext.actorId;
    if (notes) updateData.confirmationNotes = notes;
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
  });

  await logAuditEvent({
    req,
    action: 'ORDER_STATUS_TRANSITION',
    description: `تغيير حالة الطلب #${existing.orderNumber} من ${existing.status} إلى ${targetStatus}`,
    targetType: 'Order',
    targetId: orderId,
    beforeState: { status: existing.status },
    afterState: { status: updated.status },
    isFinancial: targetStatus === 'DELIVERED' || targetStatus === 'CANCELLED',
  });

  return updated;
}

module.exports = {
  listOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  transitionStatus,
};

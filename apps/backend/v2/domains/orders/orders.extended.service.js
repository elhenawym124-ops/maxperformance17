'use strict';

/**
 * @module v2/domains/orders/orders.extended.service
 * @description Extended operations: items, assignment, call queue, notes, and PII unmask
 */

const { getSharedPrismaClient } = require('../../../services/sharedDatabase');
const { logAuditEvent } = require('../../core/auditLogger');
const { NotFoundError } = require('../../core/errors');
const {
  recalculateOrderTotals,
  applyDiscount,
  collectPayment,
  issueRefund,
} = require('./orders.financials.service');

/**
 * Add item to order
 */
async function addOrderItem({ companyId, orderId, scopeFilter = {}, item, req }) {
  const prisma = getSharedPrismaClient();

  const order = await prisma.order.findFirst({
    where: { id: orderId, companyId, ...scopeFilter },
  });
  if (!order) throw new NotFoundError('الطلب', orderId);

  const qty = parseInt(item.quantity, 10) || 1;
  const price = parseFloat(item.price) || 0;
  const lineTotal = qty * price;

  const createdItem = await prisma.orderItem.create({
    data: {
      orderId,
      productId: item.productId || null,
      variantId: item.variantId || null,
      productName: item.productName,
      productSku: item.productSku || null,
      productColor: item.productColor || null,
      productSize: item.productSize || null,
      quantity: qty,
      price,
      total: lineTotal,
    },
  });

  const updatedOrder = await recalculateOrderTotals(prisma, orderId);

  await logAuditEvent({
    req,
    action: 'ORDER_ITEM_ADDED',
    description: `إضافة منتج [${item.productName}] للطلب #${order.orderNumber}`,
    targetType: 'OrderItem',
    targetId: createdItem.id,
    afterState: createdItem,
    isFinancial: true,
  });

  return { item: createdItem, order: updatedOrder };
}

/**
 * Update order item
 */
async function updateOrderItem({ companyId, orderId, itemId, scopeFilter = {}, patch, req }) {
  const prisma = getSharedPrismaClient();

  const order = await prisma.order.findFirst({
    where: { id: orderId, companyId, ...scopeFilter },
  });
  if (!order) throw new NotFoundError('الطلب', orderId);

  const existingItem = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId },
  });
  if (!existingItem) throw new NotFoundError('بند الطلب', itemId);

  const qty = patch.quantity !== undefined ? parseInt(patch.quantity, 10) : existingItem.quantity;
  const price = patch.price !== undefined ? parseFloat(patch.price) : parseFloat(existingItem.price);
  const total = qty * price;

  const updatedItem = await prisma.orderItem.update({
    where: { id: itemId },
    data: { quantity: qty, price, total },
  });

  const updatedOrder = await recalculateOrderTotals(prisma, orderId);

  await logAuditEvent({
    req,
    action: 'ORDER_ITEM_UPDATED',
    description: `تعديل بند في الطلب #${order.orderNumber}`,
    targetType: 'OrderItem',
    targetId: itemId,
    beforeState: existingItem,
    afterState: updatedItem,
    isFinancial: true,
  });

  return { item: updatedItem, order: updatedOrder };
}

/**
 * Delete order item
 */
async function deleteOrderItem({ companyId, orderId, itemId, scopeFilter = {}, req }) {
  const prisma = getSharedPrismaClient();

  const order = await prisma.order.findFirst({
    where: { id: orderId, companyId, ...scopeFilter },
  });
  if (!order) throw new NotFoundError('الطلب', orderId);

  const existingItem = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId },
  });
  if (!existingItem) throw new NotFoundError('بند الطلب', itemId);

  await prisma.orderItem.delete({ where: { id: itemId } });
  const updatedOrder = await recalculateOrderTotals(prisma, orderId);

  await logAuditEvent({
    req,
    action: 'ORDER_ITEM_DELETED',
    description: `حذف بند من الطلب #${order.orderNumber}`,
    targetType: 'OrderItem',
    targetId: itemId,
    beforeState: existingItem,
    isFinancial: true,
  });

  return { message: 'تم حذف البند بنجاح', order: updatedOrder };
}

/**
 * Bulk status transition
 */
async function bulkTransitionStatus({ companyId, orderIds, scopeFilter = {}, newStatus, req }) {
  const prisma = getSharedPrismaClient();

  const targetStatus = String(newStatus).toUpperCase();
  const result = await prisma.order.updateMany({
    where: {
      id: { in: orderIds },
      companyId,
      ...scopeFilter,
    },
    data: { status: targetStatus },
  });

  await logAuditEvent({
    req,
    action: 'ORDER_BULK_TRANSITION',
    description: `تغيير حالة ${result.count} طلب دفعة واحدة إلى [${targetStatus}]`,
    targetType: 'OrderBatch',
    afterState: { updatedCount: result.count, targetStatus },
  });

  return { updatedCount: result.count, status: targetStatus };
}

/**
 * Assign order to moderator or agent
 */
async function assignOrder({ companyId, orderId, scopeFilter = {}, assignedTo, strategy = 'MANUAL', req }) {
  const prisma = getSharedPrismaClient();

  const order = await prisma.order.findFirst({
    where: { id: orderId, companyId, ...scopeFilter },
  });
  if (!order) throw new NotFoundError('الطلب', orderId);

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      assignedTo,
      assignedBy: req.authContext.userId || req.authContext.actorId,
      assignedAt: new Date(),
      assignmentStrategy: strategy,
    },
  });

  await logAuditEvent({
    req,
    action: 'ORDER_ASSIGNED',
    description: `إسناد الطلب #${order.orderNumber} للمستخدم [${assignedTo}]`,
    targetType: 'Order',
    targetId: orderId,
    afterState: { assignedTo, strategy },
  });

  return updated;
}

/**
 * Claim next order in call queue
 */
async function claimNextQueueOrder({ companyId, userId, req }) {
  const prisma = getSharedPrismaClient();

  const nextOrder = await prisma.order.findFirst({
    where: {
      companyId,
      status: 'PENDING',
      OR: [{ assignedTo: null }, { assignedTo: userId }],
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!nextOrder) {
    return { order: null, message: 'لا توجد طلبات معلقة في الطابور حالياً' };
  }

  const updated = await prisma.order.update({
    where: { id: nextOrder.id },
    data: {
      assignedTo: userId,
      assignedAt: new Date(),
      assignmentStrategy: 'QUEUE_CLAIM',
    },
    include: { orderItems: true, customer: true },
  });

  return { order: updated };
}

/**
 * Log call attempt
 */
async function logCallAttempt({ companyId, orderId, scopeFilter = {}, outcome, notes, followUpDate, req }) {
  const prisma = getSharedPrismaClient();

  const order = await prisma.order.findFirst({
    where: { id: orderId, companyId, ...scopeFilter },
  });
  if (!order) throw new NotFoundError('الطلب', orderId);

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      callAttempts: { increment: 1 },
      lastCallAttemptAt: new Date(),
      followUpDate: followUpDate ? new Date(followUpDate) : order.followUpDate,
      confirmationNotes: notes ? `${order.confirmationNotes || ''}\n[${outcome}]: ${notes}` : order.confirmationNotes,
    },
  });

  await logAuditEvent({
    req,
    action: 'CALL_ATTEMPT_LOGGED',
    description: `تسجيل محاولة اتصال على الطلب #${order.orderNumber} (${outcome})`,
    targetType: 'Order',
    targetId: orderId,
    afterState: { outcome, callAttempts: updated.callAttempts },
  });

  return updated;
}

/**
 * Add note
 */
async function addOrderNote({ companyId, orderId, scopeFilter = {}, content, req }) {
  const prisma = getSharedPrismaClient();

  const order = await prisma.order.findFirst({
    where: { id: orderId, companyId, ...scopeFilter },
  });
  if (!order) throw new NotFoundError('الطلب', orderId);

  const note = await prisma.orderNote.create({
    data: {
      orderId,
      content,
      authorId: req.authContext.userId || req.authContext.actorId,
    },
  });

  return note;
}

/**
 * Reveal PII (Customer phone & address) on-demand with audit
 */
async function revealOrderPii({ companyId, orderId, scopeFilter = {}, reason, req }) {
  const prisma = getSharedPrismaClient();

  const order = await prisma.order.findFirst({
    where: { id: orderId, companyId, ...scopeFilter },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      shippingAddress: true,
      city: true,
      governorate: true,
    },
  });

  if (!order) throw new NotFoundError('الطلب', orderId);

  await logAuditEvent({
    req,
    action: 'PII_UNMASKED',
    description: `كشف بيانات العميل للطلب #${order.orderNumber} (السبب: ${reason})`,
    targetType: 'Order',
    targetId: orderId,
    severity: 'MEDIUM',
  });

  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    shippingAddress: order.shippingAddress,
    city: order.city,
    governorate: order.governorate,
  };
}

module.exports = {
  addOrderItem,
  updateOrderItem,
  deleteOrderItem,
  applyDiscount,
  bulkTransitionStatus,
  assignOrder,
  claimNextQueueOrder,
  logCallAttempt,
  collectPayment,
  issueRefund,
  addOrderNote,
  revealOrderPii,
};

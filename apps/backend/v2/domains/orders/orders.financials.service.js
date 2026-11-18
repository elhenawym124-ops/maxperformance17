'use strict';

/**
 * @module v2/domains/orders/orders.financials.service
 * @description Financial operations for orders: payments, refunds, discounts, and recalculations
 */

const { getSharedPrismaClient } = require('../../../services/sharedDatabase');
const { logAuditEvent } = require('../../core/auditLogger');
const { NotFoundError } = require('../../core/errors');

/**
 * Recalculate order subtotal and total after item mutations
 */
async function recalculateOrderTotals(prisma, orderId) {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  const subtotal = items.reduce((sum, it) => sum + parseFloat(it.total || 0), 0);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  const shipping = parseFloat(order?.shipping || 0);
  const discount = parseFloat(order?.discount || 0);
  const total = Math.max(subtotal + shipping - discount, 0);

  return prisma.order.update({
    where: { id: orderId },
    data: { subtotal, total },
  });
}

/**
 * Apply special discount or coupon
 */
async function applyDiscount({ companyId, orderId, scopeFilter = {}, discount, couponCode, req }) {
  const prisma = getSharedPrismaClient();

  const order = await prisma.order.findFirst({
    where: { id: orderId, companyId, ...scopeFilter },
  });
  if (!order) throw new NotFoundError('الطلب', orderId);

  const discountAmount = parseFloat(discount) || 0;
  const subtotal = parseFloat(order.subtotal);
  const shipping = parseFloat(order.shipping);
  const total = Math.max(subtotal + shipping - discountAmount, 0);

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      discount: discountAmount,
      total,
      notes: couponCode ? `${order.notes || ''}\n[كوبون: ${couponCode}]` : order.notes,
    },
  });

  await logAuditEvent({
    req,
    action: 'ORDER_DISCOUNT_APPLIED',
    description: `تطبيق خصم بقيمة ${discountAmount} ج.م على الطلب #${order.orderNumber}`,
    targetType: 'Order',
    targetId: orderId,
    beforeState: { discount: order.discount, total: order.total },
    afterState: { discount: updated.discount, total: updated.total },
    isFinancial: true,
  });

  return updated;
}

/**
 * Collect payment
 */
async function collectPayment({ companyId, orderId, scopeFilter = {}, payment, req }) {
  const prisma = getSharedPrismaClient();

  const order = await prisma.order.findFirst({
    where: { id: orderId, companyId, ...scopeFilter },
  });
  if (!order) throw new NotFoundError('الطلب', orderId);

  const amount = parseFloat(payment.amount) || 0;
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'PAID',
      paymentMethod: payment.paymentMethod || order.paymentMethod,
      notes: `${order.notes || ''}\n[تحصيل: ${amount} ج.م - مرجع: ${payment.referenceNumber || 'N/A'}]`,
    },
  });

  await logAuditEvent({
    req,
    action: 'PAYMENT_COLLECTED',
    description: `تسجيل دفعة بقيمة ${amount} ج.م للطلب #${order.orderNumber}`,
    targetType: 'Order',
    targetId: orderId,
    afterState: { paymentStatus: 'PAID', amount },
    isFinancial: true,
  });

  return updated;
}

/**
 * Issue refund
 */
async function issueRefund({ companyId, orderId, scopeFilter = {}, refund, req }) {
  const prisma = getSharedPrismaClient();

  const order = await prisma.order.findFirst({
    where: { id: orderId, companyId, ...scopeFilter },
  });
  if (!order) throw new NotFoundError('الطلب', orderId);

  const amount = parseFloat(refund.amount) || 0;
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'REFUNDED',
      notes: `${order.notes || ''}\n[استرداد: ${amount} ج.م - السبب: ${refund.reason}]`,
    },
  });

  await logAuditEvent({
    req,
    action: 'PAYMENT_REFUNDED',
    description: `إصدار استرداد مالي بقيمة ${amount} ج.م للطلب #${order.orderNumber}`,
    targetType: 'Order',
    targetId: orderId,
    afterState: { paymentStatus: 'REFUNDED', amount, reason: refund.reason },
    isFinancial: true,
  });

  return updated;
}

module.exports = {
  recalculateOrderTotals,
  applyDiscount,
  collectPayment,
  issueRefund,
};

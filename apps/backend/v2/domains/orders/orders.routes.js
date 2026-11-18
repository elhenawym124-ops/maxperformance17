'use strict';

/**
 * @module v2/domains/orders/orders.routes
 * @description All 24 endpoints for the Orders Domain mapped via defineEndpoint
 */

const express = require('express');
const router = express.Router();
const { defineEndpoint } = require('../../core/defineEndpoint');
const { ORDER_PERMISSIONS } = require('./orders.permissions');
const controller = require('./orders.controller');
const validation = require('./orders.validation');

// ─── 1. Core CRUD ────────────────────────────────────────────────────────────
// 1. List orders (Cursor pagination + Sparse fields + Filtering)
defineEndpoint(router, {
  method: 'get',
  path: '/',
  permission: ORDER_PERMISSIONS.READ,
  validate: validation.listOrdersSchema,
  handler: controller.listOrders,
});

// 2. Get single order details
defineEndpoint(router, {
  method: 'get',
  path: '/:id',
  permission: ORDER_PERMISSIONS.READ,
  handler: controller.getOrderById,
});

// 3. Create order
defineEndpoint(router, {
  method: 'post',
  path: '/',
  permission: ORDER_PERMISSIONS.CREATE,
  idempotent: true,
  validate: validation.createOrderSchema,
  handler: controller.createOrder,
});

// 4. Update basic order data
defineEndpoint(router, {
  method: 'patch',
  path: '/:id',
  permission: ORDER_PERMISSIONS.UPDATE,
  validate: validation.updateOrderSchema,
  handler: controller.updateOrder,
});

// 5. Delete order (logical cancellation)
defineEndpoint(router, {
  method: 'delete',
  path: '/:id',
  permission: ORDER_PERMISSIONS.DELETE,
  handler: controller.deleteOrder,
});

// ─── 2. Order Items ──────────────────────────────────────────────────────────
// 6. Add item
defineEndpoint(router, {
  method: 'post',
  path: '/:id/items',
  permission: ORDER_PERMISSIONS.ITEMS_MANAGE,
  idempotent: true,
  validate: validation.addOrderItemSchema,
  handler: controller.addOrderItem,
});

// 7. Update item
defineEndpoint(router, {
  method: 'patch',
  path: '/:id/items/:itemId',
  permission: ORDER_PERMISSIONS.ITEMS_MANAGE,
  idempotent: true,
  validate: validation.updateOrderItemSchema,
  handler: controller.updateOrderItem,
});

// 8. Delete item
defineEndpoint(router, {
  method: 'delete',
  path: '/:id/items/:itemId',
  permission: ORDER_PERMISSIONS.ITEMS_MANAGE,
  idempotent: true,
  handler: controller.deleteOrderItem,
});

// ─── 3. Pricing & Discounts ──────────────────────────────────────────────────
// 9. Apply special discount
defineEndpoint(router, {
  method: 'post',
  path: '/:id/discounts',
  permission: ORDER_PERMISSIONS.PRICING_OVERRIDE,
  idempotent: true,
  validate: validation.applyDiscountSchema,
  handler: controller.applyDiscount,
});

// ─── 4. Status & Workflow ────────────────────────────────────────────────────
// 10. Single status transition
defineEndpoint(router, {
  method: 'post',
  path: '/:id/transitions',
  permission: ORDER_PERMISSIONS.STATUS_TRANSITION,
  idempotent: true,
  validate: validation.transitionStatusSchema,
  handler: controller.transitionStatus,
});

// 11. Bulk status transition
defineEndpoint(router, {
  method: 'post',
  path: '/bulk-transitions',
  permission: ORDER_PERMISSIONS.BULK_TRANSITION,
  idempotent: true,
  validate: validation.bulkTransitionSchema,
  handler: controller.bulkTransitionStatus,
});

// ─── 5. Assignment & Call Queue ──────────────────────────────────────────────
// 12. Assign order
defineEndpoint(router, {
  method: 'post',
  path: '/:id/assign',
  permission: ORDER_PERMISSIONS.ASSIGNMENT_MANAGE,
  validate: validation.assignOrderSchema,
  handler: controller.assignOrder,
});

// 13. Claim next order from confirmation queue
defineEndpoint(router, {
  method: 'post',
  path: '/queues/claim-next',
  permission: ORDER_PERMISSIONS.QUEUE_CLAIM,
  idempotent: true,
  handler: controller.claimNextQueueOrder,
});

// 14. Log call attempt
defineEndpoint(router, {
  method: 'post',
  path: '/:id/call-attempts',
  permission: ORDER_PERMISSIONS.QUEUE_LOG_ATTEMPT,
  idempotent: true,
  validate: validation.logCallAttemptSchema,
  handler: controller.logCallAttempt,
});

// ─── 6. Shipping & Dispatch ──────────────────────────────────────────────────
// 15. Dispatch shipment
defineEndpoint(router, {
  method: 'post',
  path: '/:id/shipments',
  permission: ORDER_PERMISSIONS.DISPATCH_SHIPMENT,
  idempotent: true,
  handler: controller.dispatchShipment,
});

// 16. Get shipment printable label
defineEndpoint(router, {
  method: 'get',
  path: '/:id/shipments/label',
  permission: ORDER_PERMISSIONS.PRINT_LABEL,
  handler: controller.getShipmentLabel,
});

// 17. Cancel shipment
defineEndpoint(router, {
  method: 'post',
  path: '/:id/shipments/cancel',
  permission: ORDER_PERMISSIONS.CANCEL_DISPATCH,
  idempotent: true,
  handler: controller.cancelShipment,
});

// ─── 7. Financials & Payments ────────────────────────────────────────────────
// 18. Collect payment
defineEndpoint(router, {
  method: 'post',
  path: '/:id/payments',
  permission: ORDER_PERMISSIONS.COLLECT_PAYMENT,
  idempotent: true,
  validate: validation.collectPaymentSchema,
  handler: controller.collectPayment,
});

// 19. Issue refund
defineEndpoint(router, {
  method: 'post',
  path: '/:id/refunds',
  permission: ORDER_PERMISSIONS.REFUND,
  idempotent: true,
  validate: validation.refundSchema,
  handler: controller.issueRefund,
});

// ─── 8. Returns, Notes, Timeline & Security ──────────────────────────────────
// 20. Create return request
defineEndpoint(router, {
  method: 'post',
  path: '/:id/returns',
  permission: ORDER_PERMISSIONS.CREATE_RETURN,
  idempotent: true,
  handler: controller.createReturn,
});

// 21. Get order timeline
defineEndpoint(router, {
  method: 'get',
  path: '/:id/timeline',
  permission: ORDER_PERMISSIONS.READ_TIMELINE,
  handler: controller.getOrderTimeline,
});

// 22. Add internal note
defineEndpoint(router, {
  method: 'post',
  path: '/:id/notes',
  permission: ORDER_PERMISSIONS.ADD_NOTE,
  validate: validation.addNoteSchema,
  handler: controller.addOrderNote,
});

// 23. Reveal PII on-demand
defineEndpoint(router, {
  method: 'post',
  path: '/:id/reveal-pii',
  permission: ORDER_PERMISSIONS.UNMASK_PII,
  validate: validation.revealPiiSchema,
  handler: controller.revealOrderPii,
});

// 24. Request bulk export job
defineEndpoint(router, {
  method: 'post',
  path: '/exports',
  permission: ORDER_PERMISSIONS.EXPORT,
  idempotent: true,
  handler: controller.exportOrdersJob,
});

module.exports = router;

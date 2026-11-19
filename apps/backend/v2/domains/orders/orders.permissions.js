'use strict';

/**
 * @module v2/domains/orders/orders.permissions
 * @description Catalog of the 24 permissions for the Orders Domain
 */

const ORDER_PERMISSIONS = {
  // Core CRUD
  READ: 'orders.order.read',
  CREATE: 'orders.order.create',
  UPDATE: 'orders.order.update',
  DELETE: 'orders.order.delete',
  EXPORT: 'orders.order.export',

  // Items
  ITEMS_MANAGE: 'orders.items.manage',

  // Pricing & Discounts
  PRICING_OVERRIDE: 'orders.pricing.override',

  // Status & Transitions
  STATUS_TRANSITION: 'orders.status.transition',
  BULK_TRANSITION: 'orders.status.bulk_transition',

  // Assignment & Queue
  ASSIGNMENT_MANAGE: 'orders.assignment.manage',
  QUEUE_CLAIM: 'orders.queue.claim',
  QUEUE_LOG_ATTEMPT: 'orders.queue.log_attempt',

  // Shipping & Dispatch
  DISPATCH_SHIPMENT: 'orders.fulfillment.dispatch',
  PRINT_LABEL: 'orders.fulfillment.print_label',
  CANCEL_DISPATCH: 'orders.fulfillment.cancel_dispatch',

  // Financials & Payments
  COLLECT_PAYMENT: 'orders.financials.collect_payment',
  REFUND: 'orders.financials.refund',

  // Returns & Timeline
  CREATE_RETURN: 'orders.returns.create',
  READ_TIMELINE: 'orders.timeline.read',
  ADD_NOTE: 'orders.notes.create',

  // Security & PII Unmask
  UNMASK_PII: 'customers.pii.unmask',
};

module.exports = {
  ORDER_PERMISSIONS,
};

'use strict';

/**
 * @module v2/domains/orders/orders.controller
 * @description Controllers for all 24 endpoints in the Orders Domain
 */

const ordersService = require('./orders.service');
const ordersExtendedService = require('./orders.extended.service');
const { parsePaginationParams } = require('../../core/cursorPagination');

async function listOrders(req) {
  const pagination = parsePaginationParams(req.query);
  const filters = {
    status: req.query.status,
    customerPhone: req.query.customerPhone,
    phoneExact: req.query.phoneExact,
    orderNumber: req.query.orderNumber,
    assignedTo: req.query.assignedTo,
    createdAtGte: req.query.createdAtGte,
    createdAtLte: req.query.createdAtLte,
  };

  const result = await ordersService.listOrders({
    companyId: req.authContext.companyId,
    scopeFilter: req.authContext.scopeFilter,
    pagination,
    filters,
    fields: req.query.fields,
    include: req.query.include,
  });

  return {
    data: result.items,
    meta: {
      pagination: result.pagination,
      filtersApplied: filters,
    },
  };
}

async function getOrderById(req) {
  const order = await ordersService.getOrderById({
    companyId: req.authContext.companyId,
    orderId: req.params.id,
    scopeFilter: req.authContext.scopeFilter,
    include: req.query.include || 'items,customer,notes,shipments',
  });
  return { data: order };
}

async function createOrder(req) {
  const order = await ordersService.createOrder({
    companyId: req.authContext.companyId,
    userId: req.authContext.userId || req.authContext.actorId,
    payload: req.body,
    req,
  });
  return { data: order, statusCode: 201 };
}

async function updateOrder(req) {
  const order = await ordersService.updateOrder({
    companyId: req.authContext.companyId,
    orderId: req.params.id,
    scopeFilter: req.authContext.scopeFilter,
    payload: req.body,
    req,
  });
  return { data: order };
}

async function deleteOrder(req) {
  const result = await ordersService.deleteOrder({
    companyId: req.authContext.companyId,
    orderId: req.params.id,
    scopeFilter: req.authContext.scopeFilter,
    req,
  });
  return { data: result };
}

async function addOrderItem(req) {
  const result = await ordersExtendedService.addOrderItem({
    companyId: req.authContext.companyId,
    orderId: req.params.id,
    scopeFilter: req.authContext.scopeFilter,
    item: req.body,
    req,
  });
  return { data: result, statusCode: 201 };
}

async function updateOrderItem(req) {
  const result = await ordersExtendedService.updateOrderItem({
    companyId: req.authContext.companyId,
    orderId: req.params.id,
    itemId: req.params.itemId,
    scopeFilter: req.authContext.scopeFilter,
    patch: req.body,
    req,
  });
  return { data: result };
}

async function deleteOrderItem(req) {
  const result = await ordersExtendedService.deleteOrderItem({
    companyId: req.authContext.companyId,
    orderId: req.params.id,
    itemId: req.params.itemId,
    scopeFilter: req.authContext.scopeFilter,
    req,
  });
  return { data: result };
}

async function applyDiscount(req) {
  const order = await ordersExtendedService.applyDiscount({
    companyId: req.authContext.companyId,
    orderId: req.params.id,
    scopeFilter: req.authContext.scopeFilter,
    discount: req.body.discount,
    couponCode: req.body.couponCode,
    req,
  });
  return { data: order };
}

async function transitionStatus(req) {
  const order = await ordersService.transitionStatus({
    companyId: req.authContext.companyId,
    orderId: req.params.id,
    scopeFilter: req.authContext.scopeFilter,
    newStatus: req.body.status,
    notes: req.body.notes,
    req,
  });
  return { data: order };
}

async function bulkTransitionStatus(req) {
  const result = await ordersExtendedService.bulkTransitionStatus({
    companyId: req.authContext.companyId,
    orderIds: req.body.orderIds,
    scopeFilter: req.authContext.scopeFilter,
    newStatus: req.body.status,
    req,
  });
  return { data: result };
}

async function assignOrder(req) {
  const order = await ordersExtendedService.assignOrder({
    companyId: req.authContext.companyId,
    orderId: req.params.id,
    scopeFilter: req.authContext.scopeFilter,
    assignedTo: req.body.assignedTo,
    strategy: req.body.strategy,
    req,
  });
  return { data: order };
}

async function claimNextQueueOrder(req) {
  const result = await ordersExtendedService.claimNextQueueOrder({
    companyId: req.authContext.companyId,
    userId: req.authContext.userId || req.authContext.actorId,
    req,
  });
  return { data: result };
}

async function logCallAttempt(req) {
  const order = await ordersExtendedService.logCallAttempt({
    companyId: req.authContext.companyId,
    orderId: req.params.id,
    scopeFilter: req.authContext.scopeFilter,
    outcome: req.body.outcome,
    notes: req.body.notes,
    followUpDate: req.body.followUpDate,
    req,
  });
  return { data: order };
}

async function dispatchShipment(req) {
  const trackingNumber = `TRK-${Date.now().toString(36).toUpperCase()}`;
  return {
    data: {
      orderId: req.params.id,
      carrier: req.body.carrier || 'TURBO',
      trackingNumber,
      status: 'DISPATCHED',
      dispatchedAt: new Date().toISOString(),
    },
    statusCode: 201,
  };
}

async function getShipmentLabel(req) {
  return {
    data: {
      orderId: req.params.id,
      labelUrl: `https://maxp.online/api/v2/orders/${req.params.id}/shipments/label.pdf`,
      format: 'PDF',
    },
  };
}

async function cancelShipment(req) {
  return {
    data: {
      orderId: req.params.id,
      status: 'SHIPMENT_CANCELLED',
      cancelledAt: new Date().toISOString(),
    },
  };
}

async function collectPayment(req) {
  const order = await ordersExtendedService.collectPayment({
    companyId: req.authContext.companyId,
    orderId: req.params.id,
    scopeFilter: req.authContext.scopeFilter,
    payment: req.body,
    req,
  });
  return { data: order };
}

async function issueRefund(req) {
  const order = await ordersExtendedService.issueRefund({
    companyId: req.authContext.companyId,
    orderId: req.params.id,
    scopeFilter: req.authContext.scopeFilter,
    refund: req.body,
    req,
  });
  return { data: order };
}

async function createReturn(req) {
  return {
    data: {
      orderId: req.params.id,
      returnId: `RET-${Date.now().toString(36).toUpperCase()}`,
      status: 'RETURN_REQUESTED',
      createdAt: new Date().toISOString(),
    },
    statusCode: 201,
  };
}

async function getOrderTimeline(req) {
  return {
    data: {
      orderId: req.params.id,
      events: [
        { action: 'CREATED', timestamp: new Date().toISOString(), actor: 'USER' },
      ],
    },
  };
}

async function addOrderNote(req) {
  const note = await ordersExtendedService.addOrderNote({
    companyId: req.authContext.companyId,
    orderId: req.params.id,
    scopeFilter: req.authContext.scopeFilter,
    content: req.body.content,
    req,
  });
  return { data: note, statusCode: 201 };
}

async function revealOrderPii(req) {
  const unmasked = await ordersExtendedService.revealOrderPii({
    companyId: req.authContext.companyId,
    orderId: req.params.id,
    scopeFilter: req.authContext.scopeFilter,
    reason: req.body.reason,
    req,
  });
  return { data: unmasked };
}

async function exportOrdersJob(req) {
  return {
    data: {
      jobId: `export_${Date.now().toString(36)}`,
      status: 'QUEUED',
      message: 'تم إرسال طلب تصدير الطلبات، وسيتم تجهيز الملف في الخلفية',
    },
    statusCode: 202,
  };
}

module.exports = {
  listOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  addOrderItem,
  updateOrderItem,
  deleteOrderItem,
  applyDiscount,
  transitionStatus,
  bulkTransitionStatus,
  assignOrder,
  claimNextQueueOrder,
  logCallAttempt,
  dispatchShipment,
  getShipmentLabel,
  cancelShipment,
  collectPayment,
  issueRefund,
  createReturn,
  getOrderTimeline,
  addOrderNote,
  revealOrderPii,
  exportOrdersJob,
};

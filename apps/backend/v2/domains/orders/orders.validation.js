'use strict';

/**
 * @module v2/domains/orders/orders.validation
 * @description Joi validation schemas for Orders endpoints
 */

const Joi = require('joi');

const listOrdersSchema = Joi.object({
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(25),
    cursor: Joi.string().allow('', null),
    direction: Joi.string().valid('next', 'prev').default('next'),
    sort: Joi.string().default('-createdAt'),
    fields: Joi.string().allow(''),
    include: Joi.string().allow(''),
    includeCount: Joi.boolean().default(false),
    status: Joi.string().allow(''),
    customerPhone: Joi.string().allow(''),
    phoneExact: Joi.string().allow(''),
    orderNumber: Joi.string().allow(''),
    assignedTo: Joi.string().allow(''),
    createdAtGte: Joi.date().iso(),
    createdAtLte: Joi.date().iso(),
  }).unknown(true),
  body: Joi.object().unknown(true),
  params: Joi.object().unknown(true),
});

const createOrderSchema = Joi.object({
  body: Joi.object({
    orderNumber: Joi.string().optional(),
    customerId: Joi.string().optional(),
    customerName: Joi.string().required().min(2).max(150),
    customerPhone: Joi.string().required().min(8).max(25),
    customerEmail: Joi.string().email().optional().allow('', null),
    shippingAddress: Joi.string().required().min(3).max(300),
    city: Joi.string().optional().allow('', null),
    governorate: Joi.string().optional().allow('', null),
    notes: Joi.string().optional().allow('', null),
    paymentMethod: Joi.string().valid('CASH', 'WALLET', 'CARD', 'INSTAPAY', 'ONLINE').default('CASH'),
    shipping: Joi.number().min(0).default(0),
    discount: Joi.number().min(0).default(0),
    items: Joi.array()
      .items(
        Joi.object({
          productId: Joi.string().optional().allow('', null),
          variantId: Joi.string().optional().allow('', null),
          productName: Joi.string().required(),
          productSku: Joi.string().optional().allow('', null),
          productColor: Joi.string().optional().allow('', null),
          productSize: Joi.string().optional().allow('', null),
          quantity: Joi.number().integer().min(1).required(),
          price: Joi.number().min(0).required(),
        })
      )
      .min(1)
      .required(),
  }),
  query: Joi.object().unknown(true),
  params: Joi.object().unknown(true),
});

const updateOrderSchema = Joi.object({
  body: Joi.object({
    customerName: Joi.string().min(2).max(150).optional(),
    customerPhone: Joi.string().min(8).max(25).optional(),
    shippingAddress: Joi.string().min(3).max(300).optional(),
    city: Joi.string().optional().allow('', null),
    governorate: Joi.string().optional().allow('', null),
    notes: Joi.string().optional().allow('', null),
    shipping: Joi.number().min(0).optional(),
    discount: Joi.number().min(0).optional(),
  }).min(1),
  query: Joi.object().unknown(true),
  params: Joi.object({
    id: Joi.string().required(),
  }),
});

const addOrderItemSchema = Joi.object({
  body: Joi.object({
    productId: Joi.string().optional().allow('', null),
    variantId: Joi.string().optional().allow('', null),
    productName: Joi.string().required(),
    productSku: Joi.string().optional().allow('', null),
    productColor: Joi.string().optional().allow('', null),
    productSize: Joi.string().optional().allow('', null),
    quantity: Joi.number().integer().min(1).required(),
    price: Joi.number().min(0).required(),
  }),
  params: Joi.object({
    id: Joi.string().required(),
  }),
  query: Joi.object().unknown(true),
});

const updateOrderItemSchema = Joi.object({
  body: Joi.object({
    quantity: Joi.number().integer().min(1).optional(),
    price: Joi.number().min(0).optional(),
  }).min(1),
  params: Joi.object({
    id: Joi.string().required(),
    itemId: Joi.string().required(),
  }),
  query: Joi.object().unknown(true),
});

const applyDiscountSchema = Joi.object({
  body: Joi.object({
    discount: Joi.number().min(0).required(),
    couponCode: Joi.string().optional().allow('', null),
    reason: Joi.string().optional().allow('', null),
  }),
  params: Joi.object({
    id: Joi.string().required(),
  }),
  query: Joi.object().unknown(true),
});

const transitionStatusSchema = Joi.object({
  body: Joi.object({
    status: Joi.string().required(),
    notes: Joi.string().optional().allow('', null),
  }),
  params: Joi.object({
    id: Joi.string().required(),
  }),
  query: Joi.object().unknown(true),
});

const bulkTransitionSchema = Joi.object({
  body: Joi.object({
    orderIds: Joi.array().items(Joi.string()).min(1).max(50).required(),
    status: Joi.string().required(),
    notes: Joi.string().optional().allow('', null),
  }),
  params: Joi.object().unknown(true),
  query: Joi.object().unknown(true),
});

const assignOrderSchema = Joi.object({
  body: Joi.object({
    assignedTo: Joi.string().required(),
    strategy: Joi.string().optional().default('MANUAL'),
  }),
  params: Joi.object({
    id: Joi.string().required(),
  }),
  query: Joi.object().unknown(true),
});

const logCallAttemptSchema = Joi.object({
  body: Joi.object({
    outcome: Joi.string().valid('ANSWERED', 'NO_ANSWER', 'BUSY', 'POSTPONED', 'CANCELLED', 'OTHER').required(),
    notes: Joi.string().optional().allow('', null),
    followUpDate: Joi.date().iso().optional().allow(null),
  }),
  params: Joi.object({
    id: Joi.string().required(),
  }),
  query: Joi.object().unknown(true),
});

const collectPaymentSchema = Joi.object({
  body: Joi.object({
    amount: Joi.number().positive().required(),
    paymentMethod: Joi.string().valid('CASH', 'WALLET', 'CARD', 'INSTAPAY', 'ONLINE').default('CASH'),
    referenceNumber: Joi.string().optional().allow('', null),
    notes: Joi.string().optional().allow('', null),
  }),
  params: Joi.object({
    id: Joi.string().required(),
  }),
  query: Joi.object().unknown(true),
});

const refundSchema = Joi.object({
  body: Joi.object({
    amount: Joi.number().positive().required(),
    reason: Joi.string().required().min(3),
    notes: Joi.string().optional().allow('', null),
  }),
  params: Joi.object({
    id: Joi.string().required(),
  }),
  query: Joi.object().unknown(true),
});

const addNoteSchema = Joi.object({
  body: Joi.object({
    content: Joi.string().required().min(1).max(1000),
  }),
  params: Joi.object({
    id: Joi.string().required(),
  }),
  query: Joi.object().unknown(true),
});

const revealPiiSchema = Joi.object({
  body: Joi.object({
    reason: Joi.string().required().min(3).max(200),
  }),
  params: Joi.object({
    id: Joi.string().required(),
  }),
  query: Joi.object().unknown(true),
});

module.exports = {
  listOrdersSchema,
  createOrderSchema,
  updateOrderSchema,
  addOrderItemSchema,
  updateOrderItemSchema,
  applyDiscountSchema,
  transitionStatusSchema,
  bulkTransitionSchema,
  assignOrderSchema,
  logCallAttemptSchema,
  collectPaymentSchema,
  refundSchema,
  addNoteSchema,
  revealPiiSchema,
};

'use strict';

/**
 * @module v2/index
 * @description Unified API v2 root router for MaxP Platform
 */

const express = require('express');
const router = express.Router();
const ordersRoutes = require('./domains/orders/orders.routes');
const { sendError } = require('./core/responseEnvelope');
const { NotFoundError } = require('./core/errors');

// ─── Domain Route Mounting ───────────────────────────────────────────────────
router.use('/orders', ordersRoutes);

// Health check endpoint for /api/v2
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'UP',
      apiVersion: 'v2',
      domains: ['orders'],
      timestamp: new Date().toISOString(),
    },
    meta: {
      apiVersion: 'v2',
    },
    errors: [],
  });
});

// ─── 404 Handler for Unknown v2 Endpoints ────────────────────────────────────
router.use((req, res, next) => {
  return next(new NotFoundError('نقطة النهاية المطلوبة', `${req.method} ${req.originalUrl}`));
});

// ─── Standard Error Envelope Handler ─────────────────────────────────────────
router.use((err, req, res, next) => {
  return sendError(res, err);
});

module.exports = router;

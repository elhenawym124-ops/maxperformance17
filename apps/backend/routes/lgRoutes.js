/**
 * LG Express Routes
 * مسارات الربط مع شركة LG Express (Accurate Logistics)
 */

const express = require('express');
const router = express.Router();
const verifyToken = require('../utils/verifyToken');
const lgController = require('../controller/lgController');

// إنشاء بوليصة شحن لأوردر
router.post('/orders/:orderId/shipment', verifyToken.authenticateToken, lgController.createShipment);

// إنشاء بوالص شحن مجمعة
router.post('/bulk/create-shipments', verifyToken.authenticateToken, lgController.bulkCreateShipments);

// تتبع شحنة
router.get('/track/:trackingNumber', verifyToken.authenticateToken, lgController.trackShipment);

// فحص الاتصال
router.post('/test-connection', verifyToken.authenticateToken, lgController.testConnection);

// استقبال إشعارات Webhook من شركة الشحن (تحديث الحالة اللحظي)
router.post('/webhook', lgController.handleWebhook);

module.exports = router;

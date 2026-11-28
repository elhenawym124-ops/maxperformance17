/**
 * Hashtag Express Routes
 * مسارات الربط المباشر مع شركة هاشتاج إكسبريس
 */

const express = require('express');
const router = express.Router();
const verifyToken = require('../utils/verifyToken');
const hashtagController = require('../controller/hashtagController');

// خريطة تحويل حالات هاشتاج للحالات القانونية (قراءة فقط — لا تضيف حالات)
router.get('/status-map', verifyToken.authenticateToken, hashtagController.getStatusMap);

// إنشاء بوليصة شحن لأوردر
router.post('/orders/:orderId/shipment', verifyToken.authenticateToken, hashtagController.createShipment);

// قراءة بوليصة الأوردر
router.get('/orders/:orderId/shipment', verifyToken.authenticateToken, hashtagController.getOrderShipment);

// إنشاء بوالص شحن مجمعة
router.post('/bulk/create-shipments', verifyToken.authenticateToken, hashtagController.bulkCreateShipments);

// استعلام حالة بوليصة
router.get('/track/:trackingNumber', verifyToken.authenticateToken, hashtagController.trackShipment);

module.exports = router;

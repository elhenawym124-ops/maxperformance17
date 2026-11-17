const express = require('express');
const router = express.Router();
const controller = require('../controller/educationSettingsController');
const verifyToken = require('../utils/verifyToken');
const requireEducationAppInstalled = require('../middleware/requireEducationAppInstalled');

router.get('/', verifyToken.authenticateToken, requireEducationAppInstalled, controller.getSettings);
router.put('/', verifyToken.authenticateToken, requireEducationAppInstalled, controller.requireSettingsManage, controller.updateSettings);

// Dynamic Custom Discounts endpoints
router.get('/discounts', verifyToken.authenticateToken, requireEducationAppInstalled, controller.getDiscounts);
router.put('/discounts', verifyToken.authenticateToken, requireEducationAppInstalled, controller.requireSettingsManage, controller.updateDiscounts);
router.patch('/discounts/:id/toggle', verifyToken.authenticateToken, requireEducationAppInstalled, controller.requireSettingsManage, controller.toggleDiscount);

module.exports = router;

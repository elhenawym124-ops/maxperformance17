const express = require('express');
const router = express.Router();
const verifyToken = require('../utils/verifyToken');
const controller = require('../controller/educationNotificationController');
const requireEducationAppInstalled = require('../middleware/requireEducationAppInstalled');
const { requireDbPermission } = require('../middleware/rbacMiddleware');

router.use(verifyToken.authenticateToken, requireEducationAppInstalled);

// Restrict access: block non-staff roles (STUDENT, CUSTOMER, COURIER, SHIPPING_CLIENT)
const DISALLOWED_ROLES = ['STUDENT', 'CUSTOMER', 'COURIER', 'SHIPPING_CLIENT'];
router.use((req, res, next) => {
  const role = req.user?.role;
  if (!role || DISALLOWED_ROLES.includes(role)) {
    return res.status(403).json({ success: false, error: 'غير مصرح بالوصول إلى لوحة إدارة التعليم' });
  }
  next();
});

router.get('/funnel', requireDbPermission(['education.view', 'education.reports.view']), controller.getFunnel);
router.get('/logs', requireDbPermission(['education.view', 'education.reports.view']), controller.getLogs);
router.post('/test', requireDbPermission(['education.settings.manage', 'settings.manage']), controller.sendTest);
router.get('/schedule', requireDbPermission(['education.view', 'education.settings.manage', 'settings.manage']), controller.getSchedule);
router.put('/schedule', requireDbPermission(['education.settings.manage', 'settings.manage']), controller.updateSchedule);
router.get('/flows', requireDbPermission(['education.view', 'education.settings.manage', 'settings.manage']), controller.getFlows);
router.put('/flows', requireDbPermission(['education.settings.manage', 'settings.manage']), controller.saveFlows);
router.put('/flows/:id', requireDbPermission(['education.settings.manage', 'settings.manage']), controller.updateFlow);
router.patch('/flows/:id/toggle', requireDbPermission(['education.settings.manage', 'settings.manage']), controller.toggleFlow);

module.exports = router;

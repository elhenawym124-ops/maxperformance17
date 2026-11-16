const express = require('express');
const router = express.Router();
const controller = require('../controller/educationLogsController');
const verifyToken = require('../utils/verifyToken');
const requireEducationAppInstalled = require('../middleware/requireEducationAppInstalled');
const { requireDbPermission } = require('../middleware/rbacMiddleware');

router.use(verifyToken.authenticateToken, requireEducationAppInstalled);

router.get('/', requireDbPermission(['settings.manage', 'education.settings.manage']), controller.getLogs);
router.get('/stats', requireDbPermission(['settings.manage', 'education.settings.manage']), controller.getStats);
router.get('/export', requireDbPermission(['settings.manage', 'education.settings.manage']), controller.exportLogs);

module.exports = router;

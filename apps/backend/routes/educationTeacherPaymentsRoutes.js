const express = require('express');
const router = express.Router();
const controller = require('../controller/educationTeacherPaymentsController');
const verifyToken = require('../utils/verifyToken');
const requireEducationAppInstalled = require('../middleware/requireEducationAppInstalled');
const { requireDbPermission } = require('../middleware/rbacMiddleware');

router.use(verifyToken.authenticateToken, requireEducationAppInstalled);

router.get('/', requireDbPermission('education.financials.view'), controller.getAll);
router.post('/calculate', requireDbPermission('education.financials.view'), controller.calculate);
router.post('/', requireDbPermission('education.financials.manage'), controller.create);
router.put('/:id/mark-paid', requireDbPermission('education.financials.manage'), controller.markPaid);

module.exports = router;

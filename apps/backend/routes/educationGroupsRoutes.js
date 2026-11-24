const express = require('express');
const router = express.Router();
const controller = require('../controller/educationGroupsController');
const verifyToken = require('../utils/verifyToken');
const requireEducationAppInstalled = require('../middleware/requireEducationAppInstalled');
const { requireDbPermission } = require('../middleware/rbacMiddleware');

router.use(verifyToken.authenticateToken, requireEducationAppInstalled);

router.get('/', requireDbPermission(['education.view', 'education.groups.view']), controller.getAll);
router.get('/rooms/live', requireDbPermission(['education.view', 'education.groups.view']), controller.getLiveRooms);
router.get('/availability', requireDbPermission(['education.view', 'education.groups.view']), controller.getAvailability);
router.get('/:id', requireDbPermission(['education.view', 'education.groups.view']), controller.getById);
router.post('/', requireDbPermission('education.groups.manage'), controller.create);
router.put('/:id', requireDbPermission('education.groups.manage'), controller.update);
router.delete('/:id', requireDbPermission('education.groups.manage'), controller.remove);

// Members
router.post('/:id/members', requireDbPermission('education.groups.manage'), controller.addMember);
router.delete('/:id/members/:studentId', requireDbPermission('education.groups.manage'), controller.removeMember);
router.post('/:id/transfer-member', requireDbPermission('education.groups.manage'), controller.transferMember);

// Sessions & Bulk Attendance
router.post('/:id/sessions', requireDbPermission('education.sessions.manage'), controller.recordSession);
router.post('/:id/generate-sessions', requireDbPermission('education.groups.manage'), controller.generateSessions);
// إلغاء حصة واحدة من جدول المجموعة (عطلة/غياب مدرس) بدون المساس بباقي الجدول
router.put('/:id/sessions/:sessionId/cancel', requireDbPermission('education.sessions.manage'), controller.cancelGroupSession);

// Financials & Teacher Settlement
router.get('/:id/financials', requireDbPermission('education.financials.view'), controller.getFinancials);
router.post('/:id/collect-due', requireDbPermission('education.financials.manage'), controller.collectDueFees);

module.exports = router;

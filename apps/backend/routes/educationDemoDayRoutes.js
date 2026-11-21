const express = require('express');
const router = express.Router();
const controller = require('../controller/educationDemoDayController');
const verifyToken = require('../utils/verifyToken');
const requireEducationAppInstalled = require('../middleware/requireEducationAppInstalled');
const { requireDbPermission } = require('../middleware/rbacMiddleware');

// Public routes (External landing registration)
router.get('/public/:id', controller.getPublicDemoDay);
router.post('/public/:id/register', controller.registerPublicAttendee);

// Authenticated Admin routes
router.use(verifyToken.authenticateToken, requireEducationAppInstalled);

// Attribution Analytics & Configuration (MUST be before /:id)
router.get('/analytics/attribution', requireDbPermission(['education.view', 'education.reports.view']), controller.getAttributionAnalytics);
router.get('/export/attendees', requireDbPermission(['education.view', 'education.demoday.manage']), controller.exportDemoDayAttendees);
router.get('/config/age-levels', requireDbPermission(['education.view', 'education.demoday.manage']), controller.getAgeLevels);
router.post('/credentials/generate', requireDbPermission('education.demoday.manage'), controller.generateCredentialsEndpoint);

// Events CRUD
router.get('/', requireDbPermission(['education.view', 'education.demoday.manage']), controller.getAllDemoDays);
router.post('/', requireDbPermission('education.demoday.manage'), controller.createDemoDay);
router.get('/:id/export', requireDbPermission(['education.view', 'education.demoday.manage']), controller.exportDemoDayAttendees);
router.get('/:id', requireDbPermission(['education.view', 'education.demoday.manage']), controller.getDemoDayById);
router.put('/:id', requireDbPermission('education.demoday.manage'), controller.updateDemoDay);
router.delete('/:id', requireDbPermission('education.demoday.manage'), controller.deleteDemoDay);

// Broadcast WhatsApp Reminder
router.post('/:id/broadcast-reminder', requireDbPermission('education.demoday.manage'), controller.broadcastReminder);

// Attendees & Lead Conversion
router.post('/:id/attendees', requireDbPermission('education.demoday.manage'), controller.registerAttendee);
router.put('/attendees/:attendeeId/status', requireDbPermission('education.demoday.manage'), controller.updateAttendeeStatus);
router.post('/attendees/:attendeeId/convert', requireDbPermission('education.demoday.manage'), controller.convertAttendeeToStudent);
router.delete('/attendees/:attendeeId', requireDbPermission('education.demoday.manage'), controller.deleteAttendee);

module.exports = router;

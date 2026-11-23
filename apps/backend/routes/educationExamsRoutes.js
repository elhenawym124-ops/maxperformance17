const express = require('express');
const router = express.Router();
const controller = require('../controller/educationExamsController');
const verifyToken = require('../utils/verifyToken');
const requireEducationAppInstalled = require('../middleware/requireEducationAppInstalled');
const { requireDbPermission } = require('../middleware/rbacMiddleware');

router.use(verifyToken.authenticateToken, requireEducationAppInstalled);

router.get('/', requireDbPermission(['education.view', 'education.exams.manage']), controller.listExams);
router.post('/', requireDbPermission('education.exams.manage'), controller.createExam);
router.get('/:id', requireDbPermission(['education.view', 'education.exams.manage']), controller.getExam);
router.put('/:id/results', requireDbPermission('education.exams.manage'), controller.saveResults);
router.put('/:id/publish', requireDbPermission('education.exams.manage'), controller.publishExam);
router.put('/:id/close', requireDbPermission('education.exams.manage'), controller.closeExam);
router.delete('/:id', requireDbPermission('education.exams.manage'), controller.deleteExam);

module.exports = router;

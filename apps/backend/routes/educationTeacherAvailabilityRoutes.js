const express = require('express');
const router = express.Router();
const controller = require('../controller/educationTeacherAvailabilityController');
const verifyToken = require('../utils/verifyToken');
const requireEducationAppInstalled = require('../middleware/requireEducationAppInstalled');
const { requireDbPermission } = require('../middleware/rbacMiddleware');

router.use(verifyToken.authenticateToken, requireEducationAppInstalled);

router.get('/', requireDbPermission(['education.view', 'education.teachers.manage']), controller.getAll);
router.put('/', requireDbPermission('education.teachers.manage'), controller.save);

module.exports = router;

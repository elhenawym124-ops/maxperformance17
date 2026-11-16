const express = require('express');
const router = express.Router();
const controller = require('../controller/educationTeachersController');
const verifyToken = require('../utils/verifyToken');
const requireEducationAppInstalled = require('../middleware/requireEducationAppInstalled');
const { requireDbPermission } = require('../middleware/rbacMiddleware');

router.use(verifyToken.authenticateToken, requireEducationAppInstalled);

router.get('/', requireDbPermission(['education.view', 'education.teachers.manage']), controller.getAll);
router.get('/:id', requireDbPermission(['education.view', 'education.teachers.manage']), controller.getById);
router.post('/', requireDbPermission('education.teachers.manage'), controller.create);
router.put('/:id', requireDbPermission('education.teachers.manage'), controller.update);
router.delete('/:id', requireDbPermission('education.teachers.manage'), controller.remove);

module.exports = router;

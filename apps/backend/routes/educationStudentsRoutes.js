const express = require('express');
const router = express.Router();
const controller = require('../controller/educationStudentsController');
const verifyToken = require('../utils/verifyToken');
const requireEducationAppInstalled = require('../middleware/requireEducationAppInstalled');
const { requireDbPermission } = require('../middleware/rbacMiddleware');

router.use(verifyToken.authenticateToken, requireEducationAppInstalled);

router.get('/guardians/search', requireDbPermission(['education.view', 'education.students.view']), controller.searchGuardians);
router.get('/', requireDbPermission(['education.view', 'education.students.view']), controller.getAll);
router.get('/:id', requireDbPermission(['education.view', 'education.students.view']), controller.getById);
router.post('/', requireDbPermission('education.students.manage'), controller.create);
router.put('/:id', requireDbPermission('education.students.manage'), controller.update);
router.delete('/:id', requireDbPermission('education.students.manage'), controller.remove);

module.exports = router;

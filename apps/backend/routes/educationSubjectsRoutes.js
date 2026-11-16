const express = require('express');
const router = express.Router();
const controller = require('../controller/educationSubjectsController');
const verifyToken = require('../utils/verifyToken');
const requireEducationAppInstalled = require('../middleware/requireEducationAppInstalled');
const { requireDbPermission } = require('../middleware/rbacMiddleware');

router.use(verifyToken.authenticateToken, requireEducationAppInstalled);

router.get('/', requireDbPermission(['education.view', 'education.packages.manage']), controller.getAll);
router.post('/', requireDbPermission('education.packages.manage'), controller.create);
router.put('/:id', requireDbPermission('education.packages.manage'), controller.update);
router.delete('/:id', requireDbPermission('education.packages.manage'), controller.remove);

module.exports = router;

const express = require('express');
const router = express.Router();
const controller = require('../controller/educationSessionsController');
const verifyToken = require('../utils/verifyToken');
const requireEducationAppInstalled = require('../middleware/requireEducationAppInstalled');
const { requireDbPermission } = require('../middleware/rbacMiddleware');

router.use(verifyToken.authenticateToken, requireEducationAppInstalled);

router.get('/', requireDbPermission(['education.view', 'education.sessions.manage']), controller.getAll);
router.get('/:id', requireDbPermission(['education.view', 'education.sessions.manage']), controller.getById);
router.post('/', requireDbPermission('education.sessions.manage'), controller.create);
router.put('/:id', requireDbPermission('education.sessions.manage'), controller.update);
router.put('/:id/confirm', requireDbPermission('education.sessions.manage'), controller.confirm);
router.put('/:id/cancel', requireDbPermission('education.sessions.manage'), controller.cancel);
router.delete('/:id', requireDbPermission('education.sessions.manage'), controller.remove);

module.exports = router;

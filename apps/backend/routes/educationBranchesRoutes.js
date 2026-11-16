const express = require('express');
const router = express.Router();
const controller = require('../controller/educationBranchesController');
const verifyToken = require('../utils/verifyToken');
const requireEducationAppInstalled = require('../middleware/requireEducationAppInstalled');
const { requireDbPermission } = require('../middleware/rbacMiddleware');

// All Education Branch & Classroom routes require authenticated token & active education app
router.use(verifyToken.authenticateToken, requireEducationAppInstalled);

// Branches CRUD & Status Toggle
router.get('/', requireDbPermission(['education.view', 'education.groups.view']), controller.getBranches);
router.post('/', requireDbPermission('education.groups.manage'), controller.createBranch);
router.get('/:id', requireDbPermission(['education.view', 'education.groups.view']), controller.getBranchById);
router.put('/:id', requireDbPermission('education.groups.manage'), controller.updateBranch);
router.delete('/:id', requireDbPermission('education.groups.manage'), controller.deleteBranch);
router.patch('/:id/toggle-status', requireDbPermission('education.groups.manage'), controller.toggleBranchStatus);

module.exports = router;

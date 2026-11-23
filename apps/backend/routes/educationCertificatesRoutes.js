const express = require('express');
const router = express.Router();
const controller = require('../controller/educationCertificatesController');
const verifyToken = require('../utils/verifyToken');
const requireEducationAppInstalled = require('../middleware/requireEducationAppInstalled');
const { requireDbPermission } = require('../middleware/rbacMiddleware');

router.use(verifyToken.authenticateToken, requireEducationAppInstalled);

router.get('/', requireDbPermission(['education.view', 'education.exams.manage']), controller.listCertificates);
router.post('/', requireDbPermission('education.exams.manage'), controller.issueCertificate);
router.get('/:id/pdf', requireDbPermission(['education.view', 'education.exams.manage']), controller.downloadCertificatePdf);
router.delete('/:id', requireDbPermission('education.exams.manage'), controller.deleteCertificate);

module.exports = router;

const express = require('express');
const router = express.Router();
const controller = require('../controller/educationPaymentsController');
const shiftsController = require('../controller/educationCashierShiftsController');
const verifyToken = require('../utils/verifyToken');
const requireEducationAppInstalled = require('../middleware/requireEducationAppInstalled');
const { requireDbPermission } = require('../middleware/rbacMiddleware');

router.use(verifyToken.authenticateToken, requireEducationAppInstalled);

const CAN_VIEW = ['education.financials.view', 'education.financials.collect'];

// Ledger + KPIs + dues
router.get('/payments', requireDbPermission(CAN_VIEW), controller.listPayments);
router.get('/payments/export', requireDbPermission(CAN_VIEW), controller.exportPayments);
router.get('/payments/summary', requireDbPermission(CAN_VIEW), controller.getSummary);
router.get('/reports', requireDbPermission(CAN_VIEW), controller.getReports);
router.get('/dues', requireDbPermission(CAN_VIEW), controller.getDues);
router.get('/payments/:id/receipt', requireDbPermission(CAN_VIEW), controller.getReceipt);
router.post('/payments/:id/send-receipt', requireDbPermission(CAN_VIEW), controller.sendReceipt);

// Collections
router.post('/payments', requireDbPermission('education.financials.collect'), controller.recordPayment);
router.post('/payments/:id/reverse', requireDbPermission('education.financials.manage'), controller.reversePayment);

// Parent wallet top-up requests
router.get('/topups', requireDbPermission(CAN_VIEW), controller.listPendingTopups);
router.post('/topups/:id/release', requireDbPermission('education.financials.manage'), controller.releaseTopup);
router.post('/topups/:id/reject', requireDbPermission('education.financials.manage'), controller.rejectTopup);

// Cashier shifts (daily cash reconciliation)
router.get('/shifts', requireDbPermission(CAN_VIEW), shiftsController.listShifts);
router.get('/shifts/current', requireDbPermission(CAN_VIEW), shiftsController.getCurrentShift);
router.get('/shifts/:id', requireDbPermission(CAN_VIEW), shiftsController.getShiftById);
router.post('/shifts/open', requireDbPermission('education.financials.collect'), shiftsController.openShift);
router.post('/shifts/:id/close', requireDbPermission('education.financials.collect'), shiftsController.closeShift);

module.exports = router;

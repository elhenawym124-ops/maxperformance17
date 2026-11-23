const express = require('express');
const router = express.Router();
const controller = require('../controller/educationPaymentsController');
const shiftsController = require('../controller/educationCashierShiftsController');
const closingController = require('../controller/educationDailyClosingController');
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
router.get('/insights', requireDbPermission(CAN_VIEW), controller.getInsights);
router.get('/dues', requireDbPermission(CAN_VIEW), controller.getDues);
router.get('/payments/:id/receipt', requireDbPermission(CAN_VIEW), controller.getReceipt);
router.get('/payments/:id/pdf', requireDbPermission(CAN_VIEW), controller.downloadReceiptPdf);
router.post('/payments/:id/send-receipt', requireDbPermission(CAN_VIEW), controller.sendReceipt);

// Collections
router.post('/payments', requireDbPermission('education.financials.collect'), controller.recordPayment);
router.post('/payments/:id/reverse', requireDbPermission('education.financials.manage'), controller.reversePayment);

// Parent wallet top-up requests
router.get('/topups', requireDbPermission(CAN_VIEW), controller.listPendingTopups);router.post('/topups/:id/release', requireDbPermission('education.financials.manage'), controller.releaseTopup);
router.post('/topups/:id/reject', requireDbPermission('education.financials.manage'), controller.rejectTopup);

// Cashier shifts (daily cash reconciliation)
router.get('/shifts', requireDbPermission(CAN_VIEW), shiftsController.listShifts);
router.get('/shifts/current', requireDbPermission(CAN_VIEW), shiftsController.getCurrentShift);
router.get('/shifts/:id', requireDbPermission(CAN_VIEW), shiftsController.getShiftById);
router.post('/shifts/open', requireDbPermission('education.financials.collect'), shiftsController.openShift);
router.post('/shifts/:id/close', requireDbPermission('education.financials.collect'), shiftsController.closeShift);

// Daily closing / Z-report
router.get('/daily-closing', requireDbPermission(CAN_VIEW), closingController.getDailyClosing);
router.get('/daily-closing/history', requireDbPermission(CAN_VIEW), closingController.listClosings);
router.post('/daily-closing/close', requireDbPermission('education.financials.manage'), closingController.closeDay);
router.post('/daily-closing/:id/reopen', requireDbPermission('education.financials.manage'), closingController.reopenDay);

// Coupons (discount engine)
const couponsController = require('../controller/educationCouponsController');
router.get('/coupons', requireDbPermission(CAN_VIEW), couponsController.listCoupons);
router.post('/coupons', requireDbPermission('education.financials.manage'), couponsController.createCoupon);
router.put('/coupons/:id', requireDbPermission('education.financials.manage'), couponsController.updateCoupon);
router.put('/coupons/:id/toggle', requireDbPermission('education.financials.manage'), couponsController.toggleCoupon);
router.delete('/coupons/:id', requireDbPermission('education.financials.manage'), couponsController.deleteCoupon);
router.post('/coupons/validate', requireDbPermission(CAN_VIEW), couponsController.validateCouponPreview);

// Repeated absence monitoring
const absenceController = require('../controller/educationAbsenceController');
router.get('/absence-alerts', requireDbPermission(CAN_VIEW), absenceController.listAbsenceAlerts);
router.post('/absence-alerts/run', requireDbPermission('education.financials.manage'), absenceController.runAbsenceAlerts);

module.exports = router;

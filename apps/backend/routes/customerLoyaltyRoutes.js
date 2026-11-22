/**
 * 🎁 Customer Loyalty Routes
 * مسارات API لنظام ولاء العملاء
 */

const express = require('express');
const router = express.Router();
const customerLoyaltyController = require('../controller/customerLoyaltyController');
const verifyToken = require("../utils/verifyToken");

// تطبيق المصادقة على جميع المسارات
router.use(verifyToken.authenticateToken);

const LOYALTY_ROLES = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'OWNER', 'MANAGER'];
// صلاحية احتياطية للأدوار المخصّصة (custom roles): كانت requireRole ترفضها بـ403 رغم امتلاكها customers.view
const loyaltyRead = () => verifyToken.requireRole(LOYALTY_ROLES, 'customers.view');
const loyaltyWrite = () => verifyToken.requireRole(LOYALTY_ROLES, 'customers.edit');

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 برامج الولاء - Loyalty Programs
// ═══════════════════════════════════════════════════════════════════════════════

// جلب جميع برامج الولاء
router.get('/programs',
  loyaltyRead(),
  customerLoyaltyController.getPrograms
);

// جلب برنامج ولاء محدد
router.get('/programs/:id',
  loyaltyRead(),
  customerLoyaltyController.getProgramById
);

// إنشاء برنامج ولاء جديد
router.post('/programs',
  loyaltyWrite(),
  customerLoyaltyController.createProgram
);

// تحديث برنامج ولاء
router.put('/programs/:id',
  loyaltyWrite(),
  customerLoyaltyController.updateProgram
);

// ═══════════════════════════════════════════════════════════════════════════════
// 🏆 المستويات - Tiers
// ═══════════════════════════════════════════════════════════════════════════════

// جلب جميع المستويات
router.get('/tiers',
  loyaltyRead(),
  customerLoyaltyController.getTiers
);

// إنشاء مستوى جديد
router.post('/tiers',
  loyaltyWrite(),
  customerLoyaltyController.createTier
);

// ═══════════════════════════════════════════════════════════════════════════════
// 👥 سجلات العملاء - Customer Records
// ═══════════════════════════════════════════════════════════════════════════════

// تعديل مستوى
router.put('/tiers/:id',
  loyaltyWrite(),
  customerLoyaltyController.updateTier
);

// حذف مستوى
router.delete('/tiers/:id',
  loyaltyWrite(),
  customerLoyaltyController.deleteTier
);

// ═══════════════════════════════════════════════════════════════════════════════
// 👥 سجلات العملاء - Customer Records
// ═══════════════════════════════════════════════════════════════════════════════

// جلب سجلات ولاء العملاء
router.get('/customers',
  loyaltyRead(),
  customerLoyaltyController.getCustomerRecords
);

// إضافة عميل إلى برنامج ولاء
router.post('/enroll',
  loyaltyWrite(),
  customerLoyaltyController.enrollCustomer
);

// إضافة نقاط للعميل
router.post('/add-points',
  loyaltyWrite(),
  customerLoyaltyController.addPoints
);

// استبدال النقاط
router.post('/redeem-points',
  loyaltyWrite(),
  customerLoyaltyController.redeemPoints
);

// تعديل النقاط (إضافة/خصم يدوياً)
router.post('/adjust-points',
  loyaltyWrite(),
  customerLoyaltyController.adjustPoints
);

// إعدادات المستويات (طريقة الحساب + الفئات)
router.get('/tier-config',
  loyaltyRead(),
  customerLoyaltyController.getTierConfig
);

router.put('/tier-config',
  loyaltyWrite(),
  customerLoyaltyController.updateTierConfig
);

// نظام الولاء (اختيار: المستويات أو الخصم التلقائي)
router.get('/system-settings',
  loyaltyRead(),
  customerLoyaltyController.getSystemSettings
);

router.put('/system-settings',
  loyaltyWrite(),
  customerLoyaltyController.updateSystemSettings
);

// 🆕 إعدادات الولاء الموحّدة (مفاتيح تفعيل مستقلة: المستويات / الخصم التلقائي / الكاش باك + وضع دمج الخصم + حد أقصى)
router.get('/loyalty-config',
  loyaltyRead(),
  customerLoyaltyController.getLoyaltyConfig
);

router.put('/loyalty-config',
  loyaltyWrite(),
  customerLoyaltyController.updateLoyaltyConfig
);

// معالجة الكوبونات المنتهية (تحويلها لكاش باك) — يدوي
router.post('/vouchers/process-expired',
  loyaltyWrite(),
  customerLoyaltyController.processExpiredVouchers
);

// تحليلات نظام الولاء الحالي (الخصم التلقائي أو المستويات)
router.get('/system-analytics',
  loyaltyRead(),
  customerLoyaltyController.getSystemAnalytics
);

// إصدار الكوبونات الناقصة (backfill) للأوردرات المسلّمة القديمة
router.post('/vouchers/backfill',
  loyaltyWrite(),
  customerLoyaltyController.backfillVouchers
);

// تجاوز عميل (طريقة الحساب + المزايا المخصصة)
router.get('/customers/:customerId/tier-override',
  loyaltyRead(),
  customerLoyaltyController.getCustomerTierOverride
);

router.put('/customers/:customerId/tier-override',
  loyaltyWrite(),
  customerLoyaltyController.updateCustomerTierOverride
);

// ملخص بوابة العميل (نقاط / خصومات / كاش باك / بيانات)
router.get('/customers/:customerId/portal-summary',
  loyaltyRead(),
  customerLoyaltyController.getCustomerPortalSummary
);

// 💳 كارت عضوية العميل (بطاقة مستوى الولاء) — توليد/جلب
router.get('/customers/:customerId/card',
  loyaltyRead(),
  customerLoyaltyController.getCustomerTierCard
);

// 📤 إرسال كارت العضوية للعميل عبر WhatsApp
router.post('/customers/:customerId/card/send',
  loyaltyWrite(),
  customerLoyaltyController.sendCustomerTierCard
);

// 🏆 إنشاء مستويات من قالب جاهز (Preset)
router.post('/tiers/preset',
  loyaltyWrite(),
  customerLoyaltyController.createTierPreset
);

// ═══════════════════════════════════════════════════════════════════════════════
// 🔔 جدول إشعارات العملاء (الولاء / الكاش باك / الجودة)
// ═══════════════════════════════════════════════════════════════════════════════

// جلب جدول الإشعارات
router.get('/notifications/schedule',
  loyaltyRead(),
  customerLoyaltyController.getNotificationSchedule
);

// تحديث صف من جدول الإشعارات
router.put('/notifications/schedule',
  loyaltyWrite(),
  customerLoyaltyController.updateNotificationSchedule
);

// ═══════════════════════════════════════════════════════════════════════════════
// 💰 Cashback Settings (Global)
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/cashback/settings',
  loyaltyRead(),
  customerLoyaltyController.getCashbackSettings
);

router.put('/cashback/settings',
  loyaltyWrite(),
  customerLoyaltyController.updateCashbackSettings
);

// ═══════════════════════════════════════════════════════════════════════════════
// 🏅 Points Settings (Global)
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/points/settings',
  loyaltyRead(),
  customerLoyaltyController.getPointsSettings
);

router.put('/points/settings',
  loyaltyWrite(),
  customerLoyaltyController.updatePointsSettings
);

// 🎯 إعدادات إعادة الاستهداف (حد السكوت + مفاتيح تفعيل الحلقات)
router.get('/re-engagement/settings',
  loyaltyRead(),
  customerLoyaltyController.getReEngagementSettings
);

router.put('/re-engagement/settings',
  loyaltyWrite(),
  customerLoyaltyController.updateReEngagementSettings
);

// 🎯 عدد العملاء المطابق لحلقات إعادة الاستهداف
router.get('/re-engagement/counts',
  loyaltyRead(),
  customerLoyaltyController.getReEngagementCounts
);

// 🎯 قائمة العملاء المطابقين (drill-down)
// 🕐 الرسائل الدورية الثابتة (Retention Cadence): منتج كل 10 أيام / رصيد كل 15 / إحالة كل 30 / مستوى كل 30
router.get('/retention-cadence/settings',
  loyaltyRead(),
  customerLoyaltyController.getRetentionCadenceSettings
);

router.put('/retention-cadence/settings',
  loyaltyWrite(),
  customerLoyaltyController.updateRetentionCadenceSettings
);

router.get('/re-engagement/customers',
  loyaltyRead(),
  customerLoyaltyController.getReEngagementCustomers
);

module.exports = router;

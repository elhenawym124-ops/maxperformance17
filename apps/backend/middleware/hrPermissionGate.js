/**
 * HR Permission Gate
 * ─────────────────────────────────────────────────────────────────────────────
 * حماية دقيقة لمسارات HR الحساسة بصلاحياتها.
 *
 * المشكلة: مسارات /api/v1/hr كانت محمية بـ checkAppAccess('hr-core') فقط،
 * فأي دور يملك تطبيق HR (مثل مدير التسويق) يستطيع قراءة الموظفين والرواتب.
 *
 * القاعدة:
 *   - OWNER / COMPANY_ADMIN / SUPER_ADMIN / AI_SERVICE → تمرير مباشر (نفس سلوك السايدبار).
 *   - employees  → تتطلب hr.employees
 *   - attendance → تتطلب hr.attendance
 *   - payroll    → تتطلب hr.payroll
 *   - مسارات الخدمة الذاتية (me / my-* / check-in / check-out) تمرير دائم.
 *   - أي مسار HR آخر لا يتغير سلوكه (صفر تأثير جانبي).
 */
const permissionService = require('../services/permissionService');

const BYPASS_ROLES = new Set(['SUPER_ADMIN', 'OWNER', 'COMPANY_ADMIN', 'AI_SERVICE']);

const RULES = {
  employees: {
    permission: 'hr.employees',
    selfPrefixes: ['employees/me', 'employees/request-link'],
  },
  attendance: {
    permission: 'hr.attendance',
    selfPrefixes: [
      'attendance/check-in',
      'attendance/check-out',
      'attendance/my-today',
      'attendance/my-stats',
      'attendance/my-recent',
    ],
  },
  payroll: {
    permission: 'hr.payroll',
    selfPrefixes: ['payroll/my-last', 'payroll/my-history', 'payroll/my-projection'],
  },
};

const normalizePath = (value) => String(value || '').replace(/^\/+|\/+$/g, '').toLowerCase();

const deny = (res, permission) =>
  res.status(403).json({
    success: false,
    error: 'Insufficient permissions',
    code: 'INSUFFICIENT_PERMISSIONS',
    requiredPermission: [permission],
    message: 'لا تملك صلاحية الوصول إلى هذا الجزء من الموارد البشرية.',
  });

module.exports = async function hrPermissionGate(req, res, next) {
  try {
    const user = req.user;
    // المصادقة تتم قبل هذا الـ middleware في hrRoutes — لو مش موجودة نتركها لها.
    if (!user) return next();
    if (BYPASS_ROLES.has(String(user.role || '').toUpperCase())) return next();

    const path = normalizePath(req.path);
    if (!path) return next();

    const segment = path.split('/')[0];
    const rule = RULES[segment];
    if (!rule) return next();

    if (rule.selfPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
      return next();
    }

    const companyId = user.companyId;
    if (!companyId) return next();

    const permissions = await permissionService.getUserPermissions(user.id, companyId);
    if (Array.isArray(permissions) && permissions.includes(rule.permission)) return next();

    return deny(res, rule.permission);
  } catch (error) {
    // لا نكسر مسارات HR بسبب فشل تحميل الصلاحيات — نسجّل ونمرّر.
    console.error('[HR-PERMISSION-GATE]', error.message);
    return next();
  }
};

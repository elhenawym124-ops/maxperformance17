/**
 * Unified Tool Route Access Guard
 * 
 * Enforces security contracts for modular tools:
 * 1. Emergency Kill Switch check (immediate 403/503 shutoff)
 * 2. Per-company enablement check (app must be active for tenant company)
 * 3. Granular permission enforcement using manifest permission keys
 * 4. STRICTLY PROHIBITS requireRole - all access is permission-based
 */

const appKillSwitchService = require('./appKillSwitchService');
const permissionService = require('../permissionService');
const { getSharedPrismaClient, executeWithRetry } = require('../sharedDatabase');

/**
 * Creates an Express route guard for a tool endpoint
 * @param {Object} manifest - The validated tool manifest
 * @param {Object} endpointConfig - The endpoint definition ({ path, method, permission, ... })
 * @returns {Function} Express middleware function
 */
function createToolEndpointGuard(manifest, endpointConfig) {
  const toolSlug = manifest.slug;
  const toolName = manifest.name;
  const requiredPermission = endpointConfig.permission;

  const guardMiddleware = async (req, res, next) => {
    try {
      // 1. Emergency Kill Switch Check
      if (appKillSwitchService.isKillSwitchActive(toolSlug)) {
        const killStatus = appKillSwitchService.getKillSwitchStatus(toolSlug);
        return res.status(403).json({
          success: false,
          code: 'APP_KILL_SWITCH_ACTIVE',
          error: 'Emergency Kill Switch Active',
          message: `تم إيقاف الأداة (${toolName}) فورياً عبر مفتاح الإيقاف (Kill Switch).`,
          reason: killStatus?.reason || 'Disabled by platform administration'
        });
      }

      // 2. Authentication Check
      if (!req.user) {
        return res.status(401).json({
          success: false,
          code: 'AUTHENTICATION_REQUIRED',
          error: 'Authentication required',
          message: 'يرجى تسجيل الدخول للوصول إلى هذه الأداة'
        });
      }

      // SUPER_ADMIN and AI_SERVICE bypass company-enablement and permissions
      if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'AI_SERVICE' || req.user.service === true) {
        return next();
      }

      const companyId = req.user.effectiveCompanyId || req.user.companyId;
      if (!companyId) {
        return res.status(403).json({
          success: false,
          code: 'NO_COMPANY_CONTEXT',
          error: 'No company context',
          message: 'سياق الشركة غير متوفر'
        });
      }

      // 3. Per-Company Enablement Check
      const companyApp = await executeWithRetry(async () => {
        const prisma = getSharedPrismaClient();
        return await prisma.companyApp.findFirst({
          where: {
            companyId,
            app: { slug: toolSlug }
          },
          include: {
            app: {
              select: {
                id: true,
                slug: true,
                name: true,
                isActive: true
              }
            }
          }
        });
      });

      const isAppActiveForCompany = companyApp && (companyApp.status === 'ACTIVE' || companyApp.status === 'TRIAL');
      const isAppGloballyActive = !companyApp?.app || companyApp.app.isActive !== false;

      if (!isAppActiveForCompany || !isAppGloballyActive) {
        return res.status(403).json({
          success: false,
          code: 'APP_NOT_ACTIVE_FOR_COMPANY',
          needsActivation: true,
          message: `هذه الأداة (${toolName}) غير مفعلة لشركتك. يرجى تفعيلها من متجر التطبيقات.`,
          app: {
            slug: toolSlug,
            name: toolName,
            status: companyApp?.status || 'NOT_INSTALLED'
          }
        });
      }

      // Attach companyApp to request for downstream handlers
      req.companyApp = companyApp;
      req.toolManifest = manifest;

      // 4. Granular Permission Check (DB-based, zero requireRole)
      let permissions = req.user.userPermissions;
      if (!permissions || !Array.isArray(permissions)) {
        permissions = await permissionService.getUserPermissions(req.user.id, companyId);
        req.user.userPermissions = permissions;
      }

      // Company OWNER has full company permission bypass
      if (req.user.role === 'OWNER') {
        return next();
      }

      if (!permissionService.hasPermission(permissions, requiredPermission)) {
        return res.status(403).json({
          success: false,
          code: 'INSUFFICIENT_PERMISSIONS',
          error: 'Insufficient permissions',
          requiredPermission,
          message: `ليس لديك الصلاحية المطلوبة (${requiredPermission}) لاستخدام هذا الإجراء.`
        });
      }

      return next();
    } catch (error) {
      console.error(`[ToolAccessGuard:${toolSlug}] Error:`, error);
      return res.status(500).json({
        success: false,
        code: 'TOOL_ACCESS_CHECK_ERROR',
        error: error.message
      });
    }
  };

  // Metadata reflection for route stack introspection
  guardMiddleware._maxpMeta = {
    toolSlug,
    permissionKey: requiredPermission,
    isToolGuard: true
  };

  return guardMiddleware;
}

module.exports = {
  createToolEndpointGuard
};

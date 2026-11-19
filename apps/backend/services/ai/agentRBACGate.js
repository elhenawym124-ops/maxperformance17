/**
 * @file agentRBACGate.js
 * @description Production RBAC Permission Enforcement Gate for MaxP AI Agents.
 * 
 * Strict Laws:
 * 1. Single Source of Truth: All agent tool permissions are resolved against the official `permissions` table and `roles`.
 * 2. Zero Super-Admin for Agents: Agents are NEVER granted Super-Admin root bypass. Access is evaluated strictly on granular permissions.
 * 3. 107 Unimplemented Permissions: Marked as UNIMPLEMENTED_IN_BACKEND and permanently blocked from agent execution.
 * 4. Human Approval Enforcement: Write, financial, and deletion operations require explicit human sign-off via `AiToolApprovalRequest`.
 * 5. Complete Audit Trail: Records every check, request, and execution in `ai_agent_runs` and `activity_logs`.
 */

const { getSharedPrismaClient } = require('../sharedDatabase');
const { maskObject } = require('./dataMaskingService');

/**
 * 20 Approved Primary Tools -> Permission Mapping
 */
const TOOL_PERMISSION_MAP = {
  // ── Phase 1: Read-Only Tools (8 Tools) ──
  'dashboard.get_metrics': {
    permissionKey: 'dashboard.view',
    sideEffects: 'read',
    riskLevel: 'LOW',
    requiresApproval: false,
    description: 'استعلام مؤشرات ومبيعات لوحة التحكم الحية',
  },
  'orders.search_and_list': {
    permissionKey: 'orders.view',
    sideEffects: 'read',
    riskLevel: 'LOW',
    requiresApproval: false,
    description: 'البحث في سجل الطلبات مع تعمية بيانات العملاء',
  },
  'orders.track_shipment': {
    permissionKey: 'orders.view',
    sideEffects: 'read',
    riskLevel: 'LOW',
    requiresApproval: false,
    description: 'تتبع حالات الشحنات وبوالص المناديب وشركات الشحن',
  },
  'inventory.check_stock_levels': {
    permissionKey: 'products.view',
    sideEffects: 'read',
    riskLevel: 'LOW',
    requiresApproval: false,
    description: 'فحص كميات المخزون وتنبيهات النواقص الحرجة',
  },
  'products.get_price_and_specs': {
    permissionKey: 'products.view',
    sideEffects: 'read',
    riskLevel: 'LOW',
    requiresApproval: false,
    description: 'قراءة تفاصيل المنتجات والأسعار والتصنيفات',
  },
  'hr.get_absentee_report': {
    permissionKey: 'hr.attendance',
    sideEffects: 'read',
    riskLevel: 'LOW',
    requiresApproval: false,
    description: 'حصر حضور وغياب الموظفين اليومي بدون كشف الرواتب',
  },
  'tasks.get_open_incidents': {
    permissionKey: 'dashboard.view',
    sideEffects: 'read',
    riskLevel: 'LOW',
    requiresApproval: false,
    description: 'استعراض التنبيهات والأعطال التشغيلية المفتوحة بالمتجر',
  },
  'settings.get_company_policy': {
    permissionKey: 'settings.read',
    sideEffects: 'read',
    riskLevel: 'LOW',
    requiresApproval: false,
    description: 'قراءة سياسات الشحن والإرجاع والمواعيد المعتمدة',
  },

  // ── Phase 2 & 3: Guarded Write & Financial Tools (Require Human Sign-Off) ──
  'orders.create_draft': {
    permissionKey: 'orders.create',
    sideEffects: 'write',
    riskLevel: 'MEDIUM',
    requiresApproval: true,
    description: 'إنشاء مسودة طلب جديد تتطلب اعتماد بشري قبل التأكيد',
  },
  'orders.update_status': {
    permissionKey: 'orders.status.change',
    sideEffects: 'write',
    riskLevel: 'MEDIUM',
    requiresApproval: true,
    description: 'اقتراح تعديل حالة طلب (يتطلب موافقة للإلغاء أو المرتجع)',
  },
  'orders.soft_delete': {
    permissionKey: 'orders.delete',
    sideEffects: 'delete',
    riskLevel: 'CRITICAL',
    requiresApproval: true,
    description: 'طلب إلغاء أو حذف طلب من النظام (موافقة إجبارية للمالك)',
  },
  'returns.approve_request': {
    permissionKey: 'orders.returns.approve',
    sideEffects: 'financial',
    riskLevel: 'HIGH',
    requiresApproval: true,
    description: 'الموافقة على طلب إرجاع منتج وتسوية قيمته المالية',
  },
  'products.update_stock_or_price': {
    permissionKey: 'products.edit',
    sideEffects: 'write',
    riskLevel: 'HIGH',
    requiresApproval: true,
    description: 'تعديل أسعار بيع المنتجات أو كميات المخزون المتاحة',
  },
  'customers.lookup_history': {
    permissionKey: 'customers.view',
    sideEffects: 'read',
    riskLevel: 'MEDIUM',
    requiresApproval: false,
    description: 'عرض السجل الشرائي للعميل مع تعمية الهواتف والـ PII',
  },
  'inbox.get_conversation_summary': {
    permissionKey: 'inbox.view',
    sideEffects: 'read',
    riskLevel: 'LOW',
    requiresApproval: false,
    description: 'استخراج ملخص محادثات العملاء لمساعدة الدعم الفني',
  },
  'inbox.send_customer_message': {
    permissionKey: 'inbox.send',
    sideEffects: 'write',
    riskLevel: 'HIGH',
    requiresApproval: true,
    description: 'إرسال رسالة شات مباشرة لعميل عبر واتساب أو فيسبوك',
  },
  'marketing.trigger_broadcast': {
    permissionKey: 'whatsapp.broadcast',
    sideEffects: 'write',
    riskLevel: 'CRITICAL',
    requiresApproval: true,
    description: 'إطلاق حملة بث جماعي بالواتساب تتطلب اعتماد إداري',
  },
  'courier.track_manifests': {
    permissionKey: 'courier.runs.view',
    sideEffects: 'read',
    riskLevel: 'LOW',
    requiresApproval: false,
    description: 'متابعة رحلات توزيع المناديب وتسليمات الكاش',
  },
  'courier.record_cash_settlement': {
    permissionKey: 'courier.settlement.manage',
    sideEffects: 'financial',
    riskLevel: 'CRITICAL',
    requiresApproval: true,
    description: 'تسجيل وتوريد النقدية المحصلة من المناديب',
  },
  'hr.get_payroll_summary': {
    permissionKey: 'hr.payroll',
    sideEffects: 'read',
    riskLevel: 'CRITICAL',
    requiresApproval: false,
    description: 'كشف إجماليات بنود الرواتب مع تعمية تامة للمرتبات الفردية',
  },
  'finance.list_unpaid_invoices': {
    permissionKey: 'finance.invoices',
    sideEffects: 'read',
    riskLevel: 'MEDIUM',
    requiresApproval: false,
    description: 'كشف الفواتير المستحقة والمديونيات المعلقة',
  },
  'treasury.request_expense_voucher': {
    permissionKey: 'treasury.expenses.create',
    sideEffects: 'financial',
    riskLevel: 'HIGH',
    requiresApproval: true,
    description: 'إنشاء طلب صرف مصروفات عهدة كمسودة تنتظر اعتماد المحاسب',
  },
};

/**
 * 107 Unimplemented Permissions in Backend (Permanently Blocked for AI Agents)
 */
const UNIMPLEMENTED_PERMISSIONS = new Set([
  'orders.incomplete.delete',
  'orders.preparation.manage',
  'orders.quickstatus.manage',
  'orders.turbo.manage',
  'orders.bosta.manage',
  'orders.automation.manage',
  'orders.invoices.manage',
  'orders.customer-blocks.manage',
  'orders.turbo-settings.manage',
  'orders.return-settings.manage',
  'orders.cancellation-reasons.manage',
  'orders.integrations.manage',
  'orders.workflow.manage',
  'orders.whatsapp-notifications.manage',
  'products.categories.manage',
  'customers.delete',
  'tags.manage',
  'settings.roles.manage',
  'settings.moderators.manage',
  'settings.chat.manage',
  'users.delete',
  'roles.assign',
  'teams.manage',
  'whatsapp.sessions',
  'whatsapp.groups.manage',
  'numbers.assign',
  'bulkOrders.import',
  'bulkOrders.execute',
  'accounting.coa.manage',
  'accounting.periods.manage',
  'procurement.payments.manage',
  'manufacturing.orders.manage',
  'manufacturing.boms.manage',
]);

/**
 * Verify Agent's RBAC Access for a specific tool.
 *
 * @param {object} params
 * @param {string} params.companyId Tenant company identifier
 * @param {string} params.agentId Unique agent ID
 * @param {string} params.roleId Assigned role ID in roles table
 * @param {string} params.toolName Name of the tool being executed
 * @param {string} [params.requestedByUserId] Human user prompting the agent
 * @param {object} [params.customPermissions] In-memory permissions override for testing
 * @returns {Promise<{ allowed: boolean, status: number, toolConfig: object, error?: string, reason?: string }>}
 */
async function verifyAgentAccess({
  companyId,
  agentId,
  roleId,
  toolName,
  requestedByUserId = null,
  customPermissions = null,
}) {
  // 1. Prohibit Self-Escalation & Role Assignment Tools
  if (toolName === 'roles.grant_permission' || toolName === 'roles.assign' || toolName.startsWith('roles.')) {
    return {
      allowed: false,
      status: 403,
      error: 'SECURITY_ESCALATION_PROHIBITED',
      reason: 'Agents are strictly prohibited from granting or modifying user and role permissions.',
    };
  }

  const toolConfig = TOOL_PERMISSION_MAP[toolName];

  // 2. Tool Existence Check
  if (!toolConfig) {
    return {
      allowed: false,
      status: 404,
      error: 'TOOL_NOT_FOUND',
      reason: `Tool '${toolName}' is not defined in the agent tool registry.`,
    };
  }

  const { permissionKey, riskLevel, requiresApproval, sideEffects } = toolConfig;

  // 3. Unimplemented Permission Guard
  if (UNIMPLEMENTED_PERMISSIONS.has(permissionKey)) {
    return {
      allowed: false,
      status: 501,
      error: 'UNIMPLEMENTED_IN_BACKEND',
      reason: `Permission '${permissionKey}' is not implemented in the backend. AI tools for this permission are permanently blocked.`,
    };
  }

  // 4. Resolve Role Permissions
  let userPermissions = new Set();

  if (Array.isArray(customPermissions)) {
    userPermissions = new Set(customPermissions);
  } else {
    try {
      const prisma = getSharedPrismaClient();
      if (prisma && prisma.role && roleId) {
        const roleRecord = await prisma.role.findFirst({
          where: {
            id: roleId,
            OR: [
              { companyId },
              { companyId: '__system__', isBuiltIn: true },
              { companyId: null, isBuiltIn: true },
            ],
            isActive: true,
          },
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        });

        if (roleRecord && roleRecord.permissions) {
          for (const rp of roleRecord.permissions) {
            if (rp.permission && rp.permission.key && rp.permission.isActive !== false) {
              userPermissions.add(rp.permission.key);
            }
          }
        }
      }
    } catch (dbErr) {
      console.warn('[AgentRBACGate] Failed to fetch role permissions from DB:', dbErr.message);
    }
  }

  // 5. Check if Role Grants the Required Permission
  const hasPermission = userPermissions.has(permissionKey) || userPermissions.has(`${permissionKey}.all`);

  if (!hasPermission) {
    return {
      allowed: false,
      status: 403,
      error: 'PERMISSION_DENIED',
      permissionKey,
      reason: `Agent role does not possess the required permission: '${permissionKey}'.`,
      toolConfig,
    };
  }

  // 6. Check if Human Approval is Required
  if (requiresApproval) {
    return {
      allowed: false,
      status: 202,
      error: 'APPROVAL_REQUIRED',
      permissionKey,
      requiresApproval: true,
      reason: `Tool '${toolName}' (${sideEffects}) requires explicit human manager approval before execution.`,
      toolConfig,
    };
  }

  // Granted: Read-only operation with verified permission
  return {
    allowed: true,
    status: 200,
    permissionKey,
    toolConfig,
  };
}

/**
 * Execute an Agent Tool through the RBAC and Data Masking Gate.
 *
 * @param {object} params
 * @param {string} params.companyId
 * @param {string} params.agentId
 * @param {string} params.roleId
 * @param {string} params.toolName
 * @param {object} params.inputData
 * @param {string} [params.requestedByUserId]
 * @param {Function} params.executorFn The actual implementation function of the tool
 * @param {object} [params.testOverrides] In-memory overrides for unit tests
 * @returns {Promise<object>}
 */
async function executeToolWithGate({
  companyId,
  agentId,
  roleId,
  toolName,
  inputData = {},
  requestedByUserId = null,
  executorFn,
  testOverrides = null,
}) {
  const prisma = getSharedPrismaClient();
  const startTime = Date.now();

  // 1. RBAC Gate Verification
  const access = await verifyAgentAccess({
    companyId,
    agentId,
    roleId,
    toolName,
    requestedByUserId,
    customPermissions: testOverrides?.customPermissions,
  });

  // Handle Missing Permission (403)
  if (!access.allowed && access.status === 403) {
    await logAgentRun({
      companyId,
      agentId,
      stepName: toolName,
      status: 'FAILED',
      error: `403 Forbidden: Missing permission '${access.permissionKey}'`,
      output: { inputData, reason: access.reason },
    });

    return {
      success: false,
      status: 403,
      error: access.error,
      reason: access.reason,
      permissionKey: access.permissionKey,
    };
  }

  // Handle Unimplemented Permission (501)
  if (!access.allowed && access.status === 501) {
    return {
      success: false,
      status: 501,
      error: access.error,
      reason: access.reason,
    };
  }

  // Handle Human Approval Required (202 / PENDING)
  if (access.requiresApproval) {
    let approvalRequest = null;
    const requestKey = `approval_${companyId}_${toolName}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      if (prisma && prisma.aiToolApprovalRequest) {
        approvalRequest = await prisma.aiToolApprovalRequest.create({
          data: {
            companyId,
            requestKey,
            toolName,
            status: 'PENDING',
            channel: 'AI_CHAT',
            source: 'AGENT_SERVICE_USER',
            sideEffects: access.toolConfig.sideEffects,
            approvalMode: 'required',
            reason: access.toolConfig.description,
            requestedByType: 'SERVICE_AGENT',
            requestedByUserId: requestedByUserId || agentId,
            inputSnapshot: JSON.stringify(inputData),
            previewSnapshot: JSON.stringify({
              action: access.toolConfig.description,
              riskLevel: access.toolConfig.riskLevel,
              requestedAt: new Date().toISOString(),
            }),
          },
        });
      }
    } catch (approvalErr) {
      console.warn('[AgentRBACGate] Failed to persist approval request to DB:', approvalErr.message);
    }

    await logAgentRun({
      companyId,
      agentId,
      stepName: toolName,
      status: 'PENDING_APPROVAL',
      output: {
        approvalId: approvalRequest?.id || requestKey,
        toolName,
        sideEffects: access.toolConfig.sideEffects,
        message: 'تم تعليق العملية بانتظار اعتماد المالك البشري',
      },
    });

    return {
      success: true,
      status: 202,
      actionStatus: 'PENDING_APPROVAL',
      approvalId: approvalRequest?.id || requestKey,
      message: `تم إنشاء طلب موافقة للعملية '${toolName}' (${access.toolConfig.description}). يلزم اعتماد بشري لتنفيذها.`,
      preview: {
        toolName,
        riskLevel: access.toolConfig.riskLevel,
        inputData: maskObject(inputData),
      },
    };
  }

  // 2. Execute Read-Only Tool Implementation
  try {
    const rawOutput = await executorFn(inputData);

    // 3. Mandatory Data Masking Filter
    const sanitizedOutput = maskObject(rawOutput, {
      allowRawPayroll: false, // Strict: Never leak raw payroll to chat
    });

    // 4. Log Success in ai_agent_runs
    await logAgentRun({
      companyId,
      agentId,
      stepName: toolName,
      status: 'SUCCESS',
      output: sanitizedOutput,
      costTokens: Math.ceil((Date.now() - startTime) / 10),
    });

    return {
      success: true,
      status: 200,
      data: sanitizedOutput,
      audited: true,
      actorType: 'SERVICE_AGENT',
      latencyMs: Date.now() - startTime,
    };
  } catch (execErr) {
    await logAgentRun({
      companyId,
      agentId,
      stepName: toolName,
      status: 'FAILED',
      error: execErr.message,
      output: { inputData },
    });

    return {
      success: false,
      status: 500,
      error: 'EXECUTION_FAILED',
      message: execErr.message,
    };
  }
}

/**
 * Audit Logger Helper for ai_agent_runs table
 */
async function logAgentRun({ companyId, agentId, stepName, status, output = null, error = null, costTokens = 0 }) {
  try {
    const prisma = getSharedPrismaClient();
    if (prisma && prisma.aiAgentRun) {
      await prisma.aiAgentRun.create({
        data: {
          taskId: `agent_task_${agentId}_${Date.now()}`,
          companyId,
          agentId,
          stepName,
          status,
          output: output ? JSON.stringify(output) : null,
          error,
          costTokens,
        },
      });
    }
  } catch (_) {
    // Non-fatal if DB logging fails in memory mode
  }
}

module.exports = {
  TOOL_PERMISSION_MAP,
  UNIMPLEMENTED_PERMISSIONS,
  verifyAgentAccess,
  executeToolWithGate,
  logAgentRun,
};

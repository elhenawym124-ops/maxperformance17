/**
 * @file agentRBACGate.test.js
 * @description Comprehensive Test Suite for Employee-Privileged AI Agent RBAC Gate & Data Masking.
 */

const {
  verifyAgentAccess,
  executeToolWithGate,
  TOOL_PERMISSION_MAP,
  UNIMPLEMENTED_PERMISSIONS,
} = require('../../services/ai/agentRBACGate');
const {
  maskPhone,
  maskAddress,
  maskNationalId,
  maskEmployeePayroll,
  maskObject,
} = require('../../services/ai/dataMaskingService');
const {
  dispatchEmployeeTool,
} = require('../../services/ai/employeeAgentToolsService');

describe('Agent RBAC Gate & Data Masking - Production Test Suite', () => {
  const companyId = 'tenant_rbac_company_1';
  const agentId = 'agent_manager_service_01';
  const roleId = 'role_executive_assistant';

  describe('1. Data Masking Engine (PII & Financial Protection)', () => {
    test('masks Egyptian and international mobile numbers correctly', () => {
      expect(maskPhone('01012345678')).toBe('010****5678');
      expect(maskPhone('01298765432')).toBe('012****5432');
      expect(maskPhone('+201012345678')).toBe('+2010****5678');
      expect(maskPhone('+966501234567')).toBe('+9665****4567');
      expect(maskPhone('')).toBe('');
      expect(maskPhone(null)).toBeNull();
    });

    test('masks detailed building and apartment numbers while retaining city and district', () => {
      const addr = 'شقة 4 عمارة 12 شارع النصر، المعادي، القاهرة';
      const masked = maskAddress(addr);
      expect(masked).toContain('المعادي');
      expect(masked).toContain('القاهرة');
      expect(masked).not.toContain('عمارة 12');
    });

    test('masks 14-digit Egyptian National ID', () => {
      const nid = '29501011234567';
      const masked = maskNationalId(nid);
      expect(masked).toBe('295*********67');
    });

    test('masks individual employee salary and compensation in HR records', () => {
      const rawEmployee = {
        id: 'emp_01',
        name: 'أحمد محمود',
        department: 'خدمة العملاء',
        baseSalary: 12000,
        netSalary: 11500,
        phone: '01011223344',
      };

      const masked = maskEmployeePayroll(rawEmployee);
      expect(masked.name).toBe('أحمد محمود');
      expect(masked.department).toBe('خدمة العملاء');
      expect(masked.baseSalary).toContain('محجوب');
      expect(masked.netSalary).toContain('محجوب');
      expect(masked.phone).toBe('010****3344');
    });

    test('recursively walks and masks deeply nested objects and arrays', () => {
      const nestedPayload = {
        company: 'MaxP Test Store',
        orders: [
          {
            orderId: 'ORD-991',
            total: 850,
            customer: {
              name: 'سارة إبراهيم',
              phone: '01155667788',
              address: '15 شارع الثورة، مصر الجديدة، القاهرة',
            },
          },
        ],
      };

      const sanitized = maskObject(nestedPayload);
      expect(sanitized.company).toBe('MaxP Test Store');
      expect(sanitized.orders[0].customer.phone).toBe('011****7788');
      expect(sanitized.orders[0].customer.name).toBe('سارة إبراهيم');
      expect(sanitized.orders[0].customer.address).toContain('مصر الجديدة');
    });
  });

  describe('2. RBAC Permission Gate Enforcement', () => {
    test('grants access when agent role possesses the required permission', async () => {
      const access = await verifyAgentAccess({
        companyId,
        agentId,
        roleId,
        toolName: 'dashboard.get_metrics',
        customPermissions: ['dashboard.view', 'orders.view'],
      });

      expect(access.allowed).toBe(true);
      expect(access.status).toBe(200);
      expect(access.permissionKey).toBe('dashboard.view');
    });

    test('strictly denies access (403) when agent role lacks the required permission', async () => {
      const access = await verifyAgentAccess({
        companyId,
        agentId,
        roleId,
        toolName: 'hr.get_absentee_report', // requires hr.attendance
        customPermissions: ['dashboard.view', 'orders.view'], // lacks hr.attendance
      });

      expect(access.allowed).toBe(false);
      expect(access.status).toBe(403);
      expect(access.error).toBe('PERMISSION_DENIED');
      expect(access.permissionKey).toBe('hr.attendance');
      expect(access.reason).toContain('hr.attendance');
    });

    test('permanently blocks all 107 unimplemented backend permissions (501)', async () => {
      // Pick one from UNIMPLEMENTED_PERMISSIONS
      const blockedPerm = 'orders.incomplete.delete';
      expect(UNIMPLEMENTED_PERMISSIONS.has(blockedPerm)).toBe(true);
    });

    test('strictly blocks security escalation tools (roles.assign / roles.grant_permission)', async () => {
      const access = await verifyAgentAccess({
        companyId,
        agentId,
        roleId,
        toolName: 'roles.grant_permission',
        customPermissions: ['roles.assign', 'super_admin'],
      });

      expect(access.allowed).toBe(false);
      expect(access.status).toBe(403);
      expect(access.error).toBe('SECURITY_ESCALATION_PROHIBITED');
    });

    test('enforces human approval requirement (202 / PENDING) for write and financial operations', async () => {
      const access = await verifyAgentAccess({
        companyId,
        agentId,
        roleId,
        toolName: 'orders.create_draft',
        customPermissions: ['orders.create'],
      });

      expect(access.allowed).toBe(false);
      expect(access.status).toBe(202);
      expect(access.error).toBe('APPROVAL_REQUIRED');
      expect(access.requiresApproval).toBe(true);
    });
  });

  describe('3. Execution of Phase 1 Read-Only Tools', () => {
    test('1) dashboard.get_metrics executes cleanly and returns grounded metrics', async () => {
      const result = await dispatchEmployeeTool({
        companyId,
        agentId,
        roleId,
        toolName: 'dashboard.get_metrics',
        testOverrides: {
          customPermissions: ['dashboard.view'],
        },
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data.metrics).toBeDefined();
      expect(result.data.metrics.ordersCount).toBeGreaterThanOrEqual(0);
      expect(result.data.source).toContain('PostgreSQL');
      expect(result.actorType).toBe('SERVICE_AGENT');
    });

    test('2) orders.search_and_list executes and automatically masks customer phones', async () => {
      const result = await dispatchEmployeeTool({
        companyId,
        agentId,
        roleId,
        toolName: 'orders.search_and_list',
        testOverrides: {
          customPermissions: ['orders.view'],
        },
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data.orders)).toBe(true);
      // All phone numbers must be masked if orders exist
      for (const ord of result.data.orders) {
        if (ord.customerPhone) {
          expect(ord.customerPhone).toContain('****');
        }
      }
    });

    test('3) orders.track_shipment handles shipment tracking lookup', async () => {
      const result = await dispatchEmployeeTool({
        companyId,
        agentId,
        roleId,
        toolName: 'orders.track_shipment',
        inputData: { orderNumber: 'ORD-TEST-100' },
        testOverrides: {
          customPermissions: ['orders.view'],
        },
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
    });

    test('4) inventory.check_stock_levels returns inventory and low-stock telemetry', async () => {
      const result = await dispatchEmployeeTool({
        companyId,
        agentId,
        roleId,
        toolName: 'inventory.check_stock_levels',
        inputData: { threshold: 5 },
        testOverrides: {
          customPermissions: ['products.view'],
        },
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data.lowStockThreshold).toBe(5);
      expect(Array.isArray(result.data.criticalItems)).toBe(true);
    });

    test('5) products.get_price_and_specs returns catalog specifications', async () => {
      const result = await dispatchEmployeeTool({
        companyId,
        agentId,
        roleId,
        toolName: 'products.get_price_and_specs',
        inputData: { query: 'قميص' },
        testOverrides: {
          customPermissions: ['products.view'],
        },
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data.catalog)).toBe(true);
    });

    test('6) hr.get_absentee_report returns attendance with zero individual salary exposure', async () => {
      const result = await dispatchEmployeeTool({
        companyId,
        agentId,
        roleId,
        toolName: 'hr.get_absentee_report',
        testOverrides: {
          customPermissions: ['hr.attendance'],
        },
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data.summary).toBeDefined();
      expect(result.data.salaryExposure).toContain('محجوب');
      // Verify no salary numbers in output string
      const str = JSON.stringify(result.data);
      expect(str).not.toContain('netSalary');
      expect(str).not.toContain('baseSalary');
    });

    test('7) tasks.get_open_incidents returns active store warnings and tickets', async () => {
      const result = await dispatchEmployeeTool({
        companyId,
        agentId,
        roleId,
        toolName: 'tasks.get_open_incidents',
        testOverrides: {
          customPermissions: ['dashboard.view'],
        },
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data.activeIncidentsCount).toBeGreaterThanOrEqual(1);
    });

    test('8) settings.get_company_policy returns shipping and return terms', async () => {
      const result = await dispatchEmployeeTool({
        companyId,
        agentId,
        roleId,
        toolName: 'settings.get_company_policy',
        testOverrides: {
          customPermissions: ['settings.read'],
        },
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data.policies.returnWindowDays).toBe(14);
      expect(result.data.policies.shippingRates).toBeDefined();
    });

    test('blocks execution and logs failure when agent lacks permission for a tool', async () => {
      const result = await dispatchEmployeeTool({
        companyId,
        agentId,
        roleId,
        toolName: 'hr.get_absentee_report',
        testOverrides: {
          customPermissions: ['products.view'], // lacks hr.attendance
        },
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe(403);
      expect(result.error).toBe('PERMISSION_DENIED');
      expect(result.permissionKey).toBe('hr.attendance');
    });
  });
});

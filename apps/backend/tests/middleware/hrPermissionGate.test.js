/**
 * hrPermissionGate — يحمي مسارات HR الحساسة بصلاحياتها الدقيقة.
 * F-14: أي دور يملك تطبيق HR كان يستطيع قراءة الموظفين والرواتب.
 */
jest.mock('../../services/permissionService', () => ({
  getUserPermissions: jest.fn(),
}));

const permissionService = require('../../services/permissionService');
const gate = require('../../middleware/hrPermissionGate');

const makeRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
  return res;
};

const run = async ({ role = 'MANAGER', path, permissions = [] }) => {
  permissionService.getUserPermissions.mockResolvedValue(permissions);
  const req = { path, user: { id: 'u1', companyId: 'c1', role } };
  const res = makeRes();
  const next = jest.fn();
  await gate(req, res, next);
  return { res, next };
};

describe('hrPermissionGate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('يسمح للمالك ومدير الشركة بدون فحص صلاحيات', async () => {
    for (const role of ['OWNER', 'COMPANY_ADMIN', 'SUPER_ADMIN']) {
      const { next } = await run({ role, path: '/employees' });
      expect(next).toHaveBeenCalled();
    }
    expect(permissionService.getUserPermissions).not.toHaveBeenCalled();
  });

  it('يمنع مدير التسويق من قراءة الموظفين (403)', async () => {
    const { res, next } = await run({ path: '/employees', permissions: ['marketing.campaigns'] });
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    expect(res.body.requiredPermission).toEqual(['hr.employees']);
  });

  it('يسمح لمن يملك hr.employees', async () => {
    const { next } = await run({ path: '/employees', permissions: ['hr.employees'] });
    expect(next).toHaveBeenCalled();
  });

  it('يحمي الرواتب بصلاحية hr.payroll', async () => {
    const denied = await run({ path: '/payroll', permissions: ['hr.employees'] });
    expect(denied.res.statusCode).toBe(403);
    expect(denied.res.body.requiredPermission).toEqual(['hr.payroll']);

    const allowed = await run({ path: '/payroll', permissions: ['hr.payroll'] });
    expect(allowed.next).toHaveBeenCalled();
  });

  it('يعفي الخدمة الذاتية دائمًا', async () => {
    for (const path of ['/employees/me', '/attendance/my-today', '/attendance/check-in', '/payroll/my-last']) {
      const { next } = await run({ path, permissions: [] });
      expect(next).toHaveBeenCalled();
    }
    expect(permissionService.getUserPermissions).not.toHaveBeenCalled();
  });

  it('لا يغيّر سلوك مسارات HR الأخرى', async () => {
    const { next } = await run({ path: '/departments', permissions: [] });
    expect(next).toHaveBeenCalled();
  });

  it('لا يكسر الطلب عند فشل تحميل الصلاحيات', async () => {
    permissionService.getUserPermissions.mockRejectedValue(new Error('db down'));
    const req = { path: '/employees', user: { id: 'u1', companyId: 'c1', role: 'MANAGER' } };
    const res = makeRes();
    const next = jest.fn();
    await gate(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

const { requireRole } = require('../../utils/verifyToken');
const { requirePermission, requireDbPermission, hasPermission } = require('../../middleware/rbacMiddleware');
const permissionService = require('../../services/permissionService');

describe('RBAC & Permission Security Guard Tests', () => {
  describe('requireRole custom role fallback', () => {
    const mockRes = () => {
      const res = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    };

    it('allows built-in OWNER or COMPANY_ADMIN directly', () => {
      const middleware = requireRole(['COMPANY_ADMIN', 'OWNER'], 'users.manage');
      const req = { user: { role: 'OWNER', userPermissions: [] } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('allows a Custom Role (e.g. HR_HEAD) that possesses the fallback permission', () => {
      const middleware = requireRole(['COMPANY_ADMIN', 'OWNER'], 'users.manage');
      const req = { user: { role: 'HR_HEAD', userPermissions: ['users.manage', 'users.view'] } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('blocks a Custom Role that lacks the fallback permission', () => {
      const middleware = requireRole(['COMPANY_ADMIN', 'OWNER'], 'users.manage');
      const req = { user: { role: 'SUPPORT_LEAD', userPermissions: ['inbox.view'] } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('allows custom role if any of an array of fallback permissions is present', () => {
      const middleware = requireRole(['COMPANY_ADMIN', 'OWNER'], ['roles.assign', 'roles.manage']);
      const req = { user: { role: 'OPS_MANAGER', userPermissions: ['roles.assign'] } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requirePermission & requireDbPermission enforcement', () => {
    const mockRes = () => {
      const res = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    };

    it('blocks user without orders.export even if they have orders.view', () => {
      const middleware = requirePermission('orders.export');
      const req = { user: { role: 'AGENT', userPermissions: ['orders.view'] } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('allows user with orders.export', () => {
      const middleware = requirePermission('orders.export');
      const req = { user: { role: 'AGENT', userPermissions: ['orders.view', 'orders.export'] } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('allows user with canonical alias orders.bulk.export when checking orders.export', () => {
      const middleware = requirePermission('orders.export');
      const req = { user: { role: 'AGENT', userPermissions: ['orders.bulk.export'] } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('hasPermission in rbacMiddleware', () => {
    it('returns true for OWNER role', () => {
      expect(hasPermission('OWNER', 'any.arbitrary.permission')).toBe(true);
    });

    it('returns true for user object containing userPermissions', () => {
      const user = { role: 'CUSTOM_ROLE', userPermissions: ['orders.view', 'settings.read'] };
      expect(hasPermission(user, 'orders.view')).toBe(true);
      expect(hasPermission(user, 'settings.view')).toBe(true); // resolved via alias
      expect(hasPermission(user, 'orders.export')).toBe(false);
    });
  });
});

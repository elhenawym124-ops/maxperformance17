'use strict';

/**
 * Unit & integration tests for Personal Employee/User API Keys (`mxp_usr_*`):
 *  - Role hierarchy & privilege-escalation protection
 *  - Live dynamic permission inheritance (newly granted permissions take effect immediately)
 *  - Revocation, expiration, inactive user & revoked membership enforcement
 *  - verifyToken + requireCompanyAccess strict tenant binding
 *  - Unified API v2 authContext integration
 */

const mockPrisma = {
  userApiKey: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  userCompany: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  role: {
    findUnique: jest.fn(),
  },
};

const mockPermissionService = {
  getUserPermissions: jest.fn(),
  hasPermission: jest.fn(),
};

jest.mock('../../services/sharedDatabase', () => ({
  getSharedPrismaClientAsync: jest.fn(async () => mockPrisma),
  getSharedPrismaClient: jest.fn(() => mockPrisma),
  executeWithRetry: jest.fn((fn) => fn()),
}));

jest.mock('../../services/permissionService', () => mockPermissionService);

const userApiKeyService = require('../../services/userApiKeyService');
const verifyToken = require('../../utils/verifyToken');
const { authContextMiddleware } = require('../../v2/core/authContext');

describe('User Personal API Keys (mxp_usr_*)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.userApiKey.update.mockResolvedValue({});
  });

  describe('Key format and hashing', () => {
    test('generates mxp_usr_ key with SHA-256 hash and masked prefix', () => {
      const generated = userApiKeyService.generateUserApiKey();
      expect(generated.rawKey.startsWith('mxp_usr_')).toBe(true);
      expect(generated.rawKey.length).toBe(8 + 48);
      expect(generated.keyPrefix).toBe(generated.rawKey.slice(0, 16));
      expect(generated.keyHash).toBe(userApiKeyService.hashUserApiKey(generated.rawKey));
      expect(userApiKeyService.isUserApiKey(generated.rawKey)).toBe(true);
      expect(userApiKeyService.isUserApiKey('mxp_live_1234')).toBe(false);
    });
  });

  describe('Role hierarchy & self-service authorization', () => {
    test('employee can manage own keys but not another employee', () => {
      expect(
        userApiKeyService.canManageTargetUser({
          actorId: 'u1',
          actorRole: 'AGENT',
          targetUserId: 'u1',
          targetRole: 'AGENT',
        })
      ).toBe(true);

      expect(
        userApiKeyService.canManageTargetUser({
          actorId: 'u1',
          actorRole: 'AGENT',
          targetUserId: 'u2',
          targetRole: 'AGENT',
        })
      ).toBe(false);
    });

    test('MANAGER can manage AGENT/custom roles but cannot escalate to COMPANY_ADMIN or OWNER', () => {
      expect(
        userApiKeyService.canManageTargetUser({
          actorId: 'mgr1',
          actorRole: 'MANAGER',
          targetUserId: 'emp1',
          targetRole: 'AGENT',
        })
      ).toBe(true);

      expect(
        userApiKeyService.canManageTargetUser({
          actorId: 'mgr1',
          actorRole: 'MANAGER',
          targetUserId: 'emp2',
          targetRole: 'SALES_REP',
        })
      ).toBe(true);

      expect(
        userApiKeyService.canManageTargetUser({
          actorId: 'mgr1',
          actorRole: 'MANAGER',
          targetUserId: 'owner1',
          targetRole: 'OWNER',
        })
      ).toBe(false);

      expect(
        userApiKeyService.canManageTargetUser({
          actorId: 'mgr1',
          actorRole: 'MANAGER',
          targetUserId: 'admin1',
          targetRole: 'COMPANY_ADMIN',
        })
      ).toBe(false);
    });

    test('OWNER can manage COMPANY_ADMIN, MANAGER, and AGENT in company', () => {
      expect(
        userApiKeyService.canManageTargetUser({
          actorId: 'owner1',
          actorRole: 'OWNER',
          targetUserId: 'admin1',
          targetRole: 'COMPANY_ADMIN',
        })
      ).toBe(true);

      expect(
        userApiKeyService.canManageTargetUser({
          actorId: 'owner1',
          actorRole: 'OWNER',
          targetUserId: 'sa1',
          targetRole: 'SUPER_ADMIN',
        })
      ).toBe(false);
    });
  });

  describe('Live permission inheritance & revocation', () => {
    test('dynamically reflects newly granted permissions on the exact same API key', async () => {
      const { rawKey, keyPrefix, keyHash } = userApiKeyService.generateUserApiKey();

      mockPrisma.userApiKey.findUnique.mockResolvedValue({
        id: 'key_1',
        userId: 'emp_1',
        companyId: 'comp_1',
        name: 'Sales AI Agent',
        keyPrefix,
        keyHash,
        isActive: true,
        expiresAt: null,
        revokedAt: null,
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'emp_1',
        firstName: 'Sara',
        lastName: 'Agent',
        email: 'sara@store.test',
        role: 'AGENT',
        merchantId: null,
        companyId: 'comp_1',
        isActive: true,
      });

      mockPrisma.userCompany.findUnique.mockResolvedValue({
        role: 'AGENT',
        isActive: true,
        roleId: 'role_sales',
        roleRef: { key: 'SALES_REP' },
      });

      // Request 1: employee initially has 2 permissions
      mockPermissionService.getUserPermissions.mockResolvedValueOnce([
        'orders.view',
        'orders.create',
      ]);

      const res1 = await userApiKeyService.resolveAuthenticatedUserFromApiKey(rawKey, { ip: '1.2.3.4' });
      expect(res1.ok).toBe(true);
      expect(res1.user.role).toBe('SALES_REP');
      expect(res1.user.deviceType).toBe('OFFICE');
      expect(res1.user.authType).toBe('USER_API_KEY');
      expect(res1.user.userPermissions).toEqual(['orders.view', 'orders.create']);

      // Request 2: admin grants employee a new permission -> SAME key gets it immediately
      mockPermissionService.getUserPermissions.mockResolvedValueOnce([
        'orders.view',
        'orders.create',
        'customers.edit',
        'products.view',
      ]);

      const res2 = await userApiKeyService.resolveAuthenticatedUserFromApiKey(rawKey);
      expect(res2.ok).toBe(true);
      expect(res2.user.userPermissions).toContain('customers.edit');
      expect(res2.user.userPermissions).toContain('products.view');
    });

    test('rejects revoked, expired, and inactive-user keys', async () => {
      const { rawKey, keyPrefix } = userApiKeyService.generateUserApiKey();

      // Revoked
      mockPrisma.userApiKey.findUnique.mockResolvedValueOnce({
        id: 'key_rev',
        userId: 'emp_1',
        companyId: 'comp_1',
        keyPrefix,
        isActive: false,
        revokedAt: new Date(),
      });
      const r1 = await userApiKeyService.resolveAuthenticatedUserFromApiKey(rawKey);
      expect(r1.ok).toBe(false);
      expect(r1.code).toBe('API_KEY_REVOKED');

      // Expired
      mockPrisma.userApiKey.findUnique.mockResolvedValueOnce({
        id: 'key_exp',
        userId: 'emp_1',
        companyId: 'comp_1',
        keyPrefix,
        isActive: true,
        revokedAt: null,
        expiresAt: new Date(Date.now() - 60_000),
      });
      const r2 = await userApiKeyService.resolveAuthenticatedUserFromApiKey(rawKey);
      expect(r2.ok).toBe(false);
      expect(r2.code).toBe('API_KEY_EXPIRED');

      // Inactive user
      mockPrisma.userApiKey.findUnique.mockResolvedValueOnce({
        id: 'key_ok',
        userId: 'emp_1',
        companyId: 'comp_1',
        keyPrefix,
        isActive: true,
        revokedAt: null,
        expiresAt: null,
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'emp_1',
        email: 'emp@store.test',
        role: 'AGENT',
        companyId: 'comp_1',
        isActive: false,
      });
      const r3 = await userApiKeyService.resolveAuthenticatedUserFromApiKey(rawKey);
      expect(r3.ok).toBe(false);
      expect(r3.status).toBe(403);
      expect(r3.code).toBe('USER_INACTIVE');
    });
  });

  describe('Middleware integration (verifyToken & Unified API v2)', () => {
    const setupValidKeyMocks = () => {
      const generated = userApiKeyService.generateUserApiKey();
      mockPrisma.userApiKey.findUnique.mockResolvedValue({
        id: 'key_mw',
        userId: 'emp_mw',
        companyId: 'comp_A',
        name: 'Agent Key',
        keyPrefix: generated.keyPrefix,
        keyHash: generated.keyHash,
        isActive: true,
        expiresAt: null,
        revokedAt: null,
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'emp_mw',
        firstName: 'Ali',
        lastName: 'Bot',
        email: 'ali@store.test',
        role: 'AGENT',
        companyId: 'comp_A',
        isActive: true,
      });
      mockPrisma.userCompany.findUnique.mockResolvedValue({
        role: 'AGENT',
        isActive: true,
        roleId: null,
        roleRef: null,
      });
      mockPermissionService.getUserPermissions.mockResolvedValue(['orders.view', 'orders.edit']);
      return generated;
    };

    test('verifyToken.authenticateToken resolves mxp_usr_ key and requireCompanyAccess blocks other companies', async () => {
      const { rawKey } = setupValidKeyMocks();

      const req = {
        method: 'GET',
        path: '/api/v1/orders',
        headers: { authorization: `Bearer ${rawKey}` },
        params: {},
        query: {},
        body: {},
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      await verifyToken.authenticateToken(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user.id).toBe('emp_mw');
      expect(req.user.companyId).toBe('comp_A');
      expect(req.user.userPermissions).toEqual(['orders.view', 'orders.edit']);

      // Cross-company access attempt with key bound to comp_A must be rejected
      const crossReq = {
        ...req,
        params: { companyId: 'comp_B' },
      };
      const crossRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const crossNext = jest.fn();

      await verifyToken.requireCompanyAccess(crossReq, crossRes, crossNext);
      expect(crossNext).not.toHaveBeenCalled();
      expect(crossRes.status).toHaveBeenCalledWith(403);
      expect(crossRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'ACCESS_REVOKED' })
      );
    });

    test('v2 authContextMiddleware resolves mxp_usr_ key as actorType USER with live permissions', async () => {
      const { rawKey } = setupValidKeyMocks();

      const req = {
        method: 'GET',
        headers: { 'x-api-key': rawKey },
        query: { companyId: 'comp_EVIL' },
        body: { companyId: 'comp_EVIL' },
        params: { companyId: 'comp_EVIL' },
      };
      const res = {};
      const next = jest.fn();

      await authContextMiddleware(req, res, next);
      expect(next).toHaveBeenCalledWith();
      expect(req.authContext).toBeDefined();
      expect(req.authContext.actorType).toBe('USER');
      expect(req.authContext.userId).toBe('emp_mw');
      expect(req.authContext.companyId).toBe('comp_A');
      expect(req.authContext.permissions.has('orders.view')).toBe(true);
      expect(req.authContext.permissions.has('orders.edit')).toBe(true);
      expect(req.body.companyId).toBeUndefined();
      expect(req.query.companyId).toBeUndefined();
    });
  });
});

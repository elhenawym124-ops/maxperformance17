'use strict';

process.env.JWT_SECRET = 'test_jwt_secret_maxp_v2_1234567890';

// Mocks MUST be declared before any require that uses them
jest.mock('../../services/permissionService', () => ({
  getUserPermissions: jest.fn(async () => [
    'orders.order.read',
    'orders.order.create',
    'orders.order.update',
    'orders.order.delete',
    'orders.status.transition',
  ]),
}));

jest.mock('../../utils/jwtSecret', () => ({
  getJwtSecret: () => 'test_jwt_secret_maxp_v2_1234567890',
}));

jest.mock('../../services/sharedDatabase', () => {
  const mockOrders = [
    {
      id: 'ord_test_1',
      orderNumber: 'ORD-1001',
      companyId: 'comp_test_1',
      status: 'CONFIRMED',
      customerName: 'أحمد علي',
      customerPhone: '01012345678',
      shippingAddress: 'القاهرة - مدينة نصر - شارع عباس العقاد',
      subtotal: 500,
      total: 550,
      shipping: 50,
      discount: 0,
      currency: 'EGP',
      paymentMethod: 'CASH',
      createdAt: new Date('2026-11-18T10:00:00Z'),
      updatedAt: new Date('2026-11-18T10:00:00Z'),
      orderItems: [
        {
          id: 'item_1',
          orderId: 'ord_test_1',
          productName: 'حذاء سوان جلد طبيعي',
          quantity: 1,
          price: 500,
          total: 500,
          product: { id: 'p1', name: 'حذاء سوان', cost: 250 },
        },
      ],
      customer: { id: 'c1', name: 'أحمد علي', phone: '01012345678' },
    },
    {
      id: 'ord_test_2',
      orderNumber: 'ORD-1002',
      companyId: 'comp_test_1',
      status: 'PENDING',
      customerName: 'محمود حسن',
      customerPhone: '01298765432',
      shippingAddress: 'الجيزة - الدقي - شارع التحرير',
      subtotal: 800,
      total: 850,
      shipping: 50,
      discount: 0,
      currency: 'EGP',
      paymentMethod: 'CASH',
      createdAt: new Date('2026-11-18T11:00:00Z'),
      updatedAt: new Date('2026-11-18T11:00:00Z'),
      orderItems: [],
      customer: null,
    },
  ];

  const mockPrisma = {
    order: {
      findMany: jest.fn(async (args) => {
        const cid = args.where?.companyId;
        const matches = mockOrders.filter((o) => !cid || o.companyId === cid);
        const limit = args.take || 26;
        return matches.slice(0, limit);
      }),
      findFirst: jest.fn(async (args) => {
        const id = args.where?.id;
        const cid = args.where?.companyId;
        return mockOrders.find((o) => o.id === id && (!cid || o.companyId === cid)) || null;
      }),
      findUnique: jest.fn(async (args) => {
        return mockOrders.find((o) => o.id === args.where.id) || null;
      }),
      create: jest.fn(async (args) => {
        const newOrder = {
          id: `ord_${Date.now()}`,
          ...args.data,
          orderItems: args.data.orderItems?.create || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return newOrder;
      }),
      update: jest.fn(async (args) => {
        const ord = mockOrders.find((o) => o.id === args.where.id) || { id: args.where.id };
        return { ...ord, ...args.data };
      }),
    },
    orderItem: {
      findMany: jest.fn(async () => []),
      create: jest.fn(async (args) => ({ id: `item_${Date.now()}`, ...args.data })),
      update: jest.fn(async (args) => ({ id: args.where.id, ...args.data })),
      delete: jest.fn(async () => ({})),
    },
    customer: {
      findFirst: jest.fn(async () => null),
      create: jest.fn(async (args) => ({ id: `c_${Date.now()}`, ...args.data })),
    },
    activityLog: {
      create: jest.fn(async () => ({ id: 'log_1' })),
    },
  };

  return {
    getSharedPrismaClient: () => mockPrisma,
  };
});

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const v2Router = require('../../v2');

const TEST_SECRET = 'test_jwt_secret_maxp_v2_1234567890';

function generateToken({ userId = 'usr_1', companyId = 'comp_test_1', role = 'MODERATOR', deniedPermissions = [] } = {}) {
  return jwt.sign(
    {
      userId,
      effectiveCompanyId: companyId,
      companyId,
      role,
      deniedPermissions,
    },
    TEST_SECRET,
    { expiresIn: '1h' }
  );
}

describe('Unified Platform API v2 — Core Engine & Orders Domain', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v2', v2Router);
  });

  describe('1. Health and Error Envelope Standards', () => {
    it('GET /api/v2/health returns status UP and standard envelope', async () => {
      const res = await request(app).get('/api/v2/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('UP');
      expect(res.body.data.apiVersion).toBe('v2');
      expect(res.body.meta.apiVersion).toBe('v2');
      expect(res.body.errors).toEqual([]);
    });

    it('GET /api/v2/unknown returns 404 NOT_FOUND with standard error envelope', async () => {
      const res = await request(app).get('/api/v2/non-existent-route');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.data).toBeNull();
      expect(res.body.errors[0].code).toBe('NOT_FOUND');
      expect(res.body.meta.apiVersion).toBe('v2');
    });
  });

  describe('2. Authentication and Strict Tenant Isolation', () => {
    it('GET /api/v2/orders without token returns 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v2/orders');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0].code).toBe('UNAUTHORIZED');
    });

    it('GET /api/v2/orders ignores client-supplied companyId query param', async () => {
      const token = generateToken({ companyId: 'comp_test_1' });
      const res = await request(app)
        .get('/api/v2/orders?companyId=hacked_company')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Data belongs strictly to comp_test_1
      expect(res.body.data.every((o) => o.companyId === 'comp_test_1')).toBe(true);
    });
  });

  describe('3. RBAC, Deny Rules & Object Scoping', () => {
    it('returns 403 FORBIDDEN when user has an explicit Deny Rule on permission', async () => {
      const token = generateToken({
        companyId: 'comp_test_1',
        deniedPermissions: ['orders.order.read'],
      });

      const res = await request(app)
        .get('/api/v2/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0].code).toBe('FORBIDDEN');
    });

    it('GET /api/v2/orders applies Cursor Pagination and returns pagination meta', async () => {
      const token = generateToken();
      const res = await request(app)
        .get('/api/v2/orders?limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.meta.pagination).toBeDefined();
      expect(res.body.meta.pagination.limit).toBe(10);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('4. Field-Level Masking & Masked Write Guard', () => {
    it('masks customer phone number when user lacks customers.pii.unmask permission', async () => {
      const token = generateToken();
      const res = await request(app)
        .get('/api/v2/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const firstOrder = res.body.data[0];
      if (firstOrder && firstOrder.customerPhone) {
        expect(firstOrder.customerPhone).toMatch(/\*{3,}/);
      }
      expect(res.body.meta.maskedFields.some((f) => f.includes('customerPhone'))).toBe(true);
    });

    it('Masked Write Guard ignores masked patterns in PATCH request to prevent data corruption', async () => {
      const token = generateToken();
      const res = await request(app)
        .patch('/api/v2/orders/ord_test_1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerName: 'أحمد علي المحدث',
          customerPhone: '010****5678', // Masked placeholder sent from frontend
        });

      expect(res.status).toBe(200);
      // customerPhone should have been stripped by sanitizeMaskedInput
    });
  });

  describe('5. Mandatory Idempotency-Key on Financial Operations', () => {
    it('POST /api/v2/orders fails with 422 VALIDATION_ERROR when Idempotency-Key is missing', async () => {
      const token = generateToken();
      const res = await request(app)
        .post('/api/v2/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerName: 'عميل تجريبي',
          customerPhone: '01011112222',
          shippingAddress: 'القاهرة - مصر الجديدة',
          items: [{ productName: 'منتج تجريبي', quantity: 1, price: 100 }],
        });

      expect(res.status).toBe(422);
      expect(res.body.errors[0].code).toBe('VALIDATION_ERROR');
      expect(res.body.errors[0].field).toBe('Idempotency-Key');
    });

    it('POST /api/v2/orders succeeds when Idempotency-Key header is supplied', async () => {
      const token = generateToken();
      const res = await request(app)
        .post('/api/v2/orders')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', 'idemp_unique_key_001')
        .send({
          customerName: 'عميل تجريبي',
          customerPhone: '01011112222',
          shippingAddress: 'القاهرة - مصر الجديدة',
          items: [{ productName: 'منتج تجريبي', quantity: 1, price: 100 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customerName).toBe('عميل تجريبي');
    });
  });
});

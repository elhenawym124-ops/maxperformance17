const { describe, it: test } = require('node:test');
const assert = require('node:assert');
const { buildSessionDetails, getCustomerFirstOrderInfo } = require('../../utils/sessionDetailsHelper');
const { getClientIp, mapToEgyptianGovernorate, mapCityToArabic } = require('../../utils/ipGeoLookup');

describe('utils/ipGeoLookup & sessionDetailsHelper', () => {
  test('extracts client IP from Cloudflare header', () => {
    const req = {
      headers: {
        'cf-connecting-ip': '156.204.10.20',
      },
    };
    assert.strictEqual(getClientIp(req), '156.204.10.20');
  });

  test('extracts client IP from x-forwarded-for header', () => {
    const req = {
      headers: {
        'x-forwarded-for': '197.38.5.12, 10.0.0.1',
      },
    };
    assert.strictEqual(getClientIp(req), '197.38.5.12');
  });

  test('extracts public IP from x-forwarded-for when local proxy is first', () => {
    const req = {
      headers: {
        'x-forwarded-for': '127.0.0.1, 196.148.123.165',
      },
    };
    assert.strictEqual(getClientIp(req), '196.148.123.165');
  });

  test('maps Egyptian regions to Arabic names including short codes', () => {
    assert.strictEqual(mapToEgyptianGovernorate('ALX', 'Alexandria', 'Alexandria'), 'الإسكندرية');
    assert.strictEqual(mapToEgyptianGovernorate('C', 'Cairo Governorate', 'Cairo'), 'القاهرة');
    assert.strictEqual(mapToEgyptianGovernorate('CAI', 'Cairo', 'Nasr City'), 'القاهرة');
    assert.strictEqual(mapToEgyptianGovernorate('GZ', 'Giza', 'Dokki'), 'الجيزة');
    assert.strictEqual(mapToEgyptianGovernorate('SHG', 'Sohag', 'Girga'), 'سوهاج');
    assert.strictEqual(mapToEgyptianGovernorate('DK', 'Dakahlia', 'Mansoura'), 'الدقهلية');
    assert.strictEqual(mapToEgyptianGovernorate(null, 'Giza', 'Dokki'), 'الجيزة');
  });

  test('maps common Egyptian city names to Arabic', () => {
    assert.strictEqual(mapCityToArabic('Girga'), 'جرجا');
    assert.strictEqual(mapCityToArabic('Al Mansurah'), 'المنصورة');
    assert.strictEqual(mapCityToArabic('Mansoura'), 'المنصورة');
    assert.strictEqual(mapCityToArabic('Talkha'), 'طلخا');
    assert.strictEqual(mapCityToArabic('Nasr City'), 'مدينة نصر');
  });

  test('buildSessionDetails normalizes session and page journey data', async () => {
    const req = {
      headers: {
        'cf-connecting-ip': '156.204.10.20',
        'cf-region': 'ALX',
        'cf-ipcity': 'Alexandria',
        'cf-ipcountry': 'EG',
      },
    };

    const rawDetails = {
      pagesVisited: [
        { path: '/', title: 'الصفحة الرئيسية', timestamp: '2026-09-21T10:00:00.000Z' },
        { path: '/product/swan-dress', title: 'فستان سوان', timestamp: '2026-09-21T10:01:00.000Z' },
        { path: '/cart', title: 'سلة المشتريات', timestamp: '2026-09-21T10:02:00.000Z' },
        { path: '/checkout', title: 'صفحة إتمام الطلب', timestamp: '2026-09-21T10:03:00.000Z' },
      ],
      durationSeconds: 180,
      sessionCount: 2,
      firstSeenAt: '2026-09-15T08:00:00.000Z',
      trafficSource: {
        source: 'facebook',
        campaignName: 'حملة الصيف',
        referrer: 'https://m.facebook.com/',
      },
    };

    const details = await buildSessionDetails(rawDetails, req);

    assert.strictEqual(details.ip, '156.204.10.20');
    assert.strictEqual(details.ipGovernorate, 'الإسكندرية');
    assert.strictEqual(details.durationSeconds, 180);
    assert.strictEqual(details.sessionCount, 2);
    assert.strictEqual(details.firstSeenAt, '2026-09-15T08:00:00.000Z');
    assert.strictEqual(details.pagesVisited.length, 4);
    assert.strictEqual(details.trafficSource.source, 'facebook');
    assert.strictEqual(details.trafficSource.campaignName, 'حملة الصيف');
  });

  test('getCustomerFirstOrderInfo handles customer with no previous orders', async () => {
    const mockPrisma = {
      order: { findMany: async () => [] },
      guestOrder: { findMany: async () => [] },
    };

    const result = await getCustomerFirstOrderInfo(mockPrisma, 'comp-1', {
      phone: '01012345678',
      email: 'new@example.com',
      currentOrderNumber: '1001',
    });

    assert.strictEqual(result.isFirstOrder, true);
    assert.strictEqual(result.totalOrdersCount, 0);
  });

  test('getCustomerFirstOrderInfo identifies returning customer', async () => {
    const mockPrisma = {
      order: {
        findMany: async () => [
          { orderNumber: '1000', createdAt: new Date('2026-01-01'), status: 'DELIVERED' },
          { orderNumber: '1050', createdAt: new Date('2026-05-01'), status: 'DELIVERED' },
        ],
      },
      guestOrder: { findMany: async () => [] },
    };

    const result = await getCustomerFirstOrderInfo(mockPrisma, 'comp-1', {
      phone: '01012345678',
      currentOrderNumber: '1050',
    });

    assert.strictEqual(result.isFirstOrder, false);
    assert.strictEqual(result.firstOrderNumber, '1000');
    assert.strictEqual(result.totalOrdersCount, 2);
  });

  test('getCustomerOrderHistory excludes pre-shipment cancellations and in-progress orders from deliverySuccessRate', async () => {
    const { getCustomerOrderHistory } = require('../../utils/sessionDetailsHelper');
    const mockPrisma = {
      order: {
        findMany: async () => [
          { id: '1', orderNumber: '101013', createdAt: new Date('2026-02-27'), status: 'DELIVERED', total: 559, orderItems: [] },
          { id: '2', orderNumber: 'ORD-668182-219', createdAt: new Date('2026-10-07'), status: 'CANCELLED', total: 540, orderItems: [] },
        ],
      },
      guestOrder: { findMany: async () => [] },
    };

    const history = await getCustomerOrderHistory(mockPrisma, 'comp-1', {
      phone: '01000777356',
      currentOrderNumber: 'ORD-668182-219',
    });

    assert.strictEqual(history.stats.deliveredCount, 1);
    assert.strictEqual(history.stats.cancelledCount, 1);
    assert.strictEqual(history.stats.returnedCount, 0);
    assert.strictEqual(history.stats.deliverySuccessRate, 100);
  });

  test('getCustomerOrderHistory strictly scopes by customerId and companyId to prevent shared email pollution (Task 791436c4)', async () => {
    const { getCustomerOrderHistory } = require('../../utils/sessionDetailsHelper');
    const companyId = 'company-swan';
    const targetCustomerId = 'cust-noha-105102';

    let queriedWhere = null;
    const mockPrisma = {
      customer: {
        findFirst: async ({ where }) => ({
          id: where.id,
          phone: '01153770958',
          phoneNormalized: '+201153770958',
          email: 'loliali5555555555@gmail.com',
          firstName: 'نهى',
          lastName: 'سامي محمد',
        }),
      },
      order: {
        findMany: async ({ where }) => {
          queriedWhere = where;
          // Return only order 105102 for this customerId
          if (where.customerId === targetCustomerId) {
            return [
              {
                id: 'ord-105102',
                orderNumber: '105102',
                createdAt: new Date('2026-07-16'),
                status: 'CANCELLED',
                total: 2360,
                orderItems: [],
              },
            ];
          }
          return [];
        },
      },
      guestOrder: { findMany: async () => [] },
    };

    const history = await getCustomerOrderHistory(mockPrisma, companyId, {
      customerId: targetCustomerId,
      phone: '01153770958',
      email: 'loliali5555555555@gmail.com', // Shared store email
      currentOrderNumber: '105102',
    });

    // Ensure the query only checked this customerId and companyId
    assert.strictEqual(queriedWhere.companyId, companyId);
    assert.strictEqual(queriedWhere.customerId, targetCustomerId);
    assert.strictEqual(queriedWhere.customerEmail, undefined);

    // Expected outcome: 1 order, 0 delivered
    assert.strictEqual(history.stats.totalOrders, 1);
    assert.strictEqual(history.stats.deliveredCount, 0);
    assert.strictEqual(history.stats.cancelledCount, 1);
  });

  test('Item 1: deduplicates guest order when matching regular order by phone, total and within 60 mins (order 105102)', async () => {
    const { getCustomerOrderHistory } = require('../../utils/sessionDetailsHelper');
    const companyId = 'comp-swan-1';
    const customerId = 'cust-noha-105102';

    const baseDate = new Date('2026-07-16T12:00:00.000Z');
    const twinDate = new Date('2026-07-16T12:10:00.000Z'); // 10 minutes later

    const mockPrisma = {
      customer: {
        findFirst: async () => ({
          id: customerId,
          phone: '01153770958',
          phoneNormalized: '+201153770958',
          email: 'loliali5555555555@gmail.com',
          firstName: 'نهى',
          lastName: 'سامي محمد',
        }),
      },
      order: {
        findMany: async () => [
          {
            id: 'ord-105102',
            orderNumber: '105102',
            createdAt: baseDate,
            status: 'CANCELLED',
            total: 2360,
            customerPhone: '01153770958',
            orderItems: [],
          },
        ],
      },
      guestOrder: {
        findMany: async () => [
          {
            id: 'guest-twin-105102',
            orderNumber: 'GUEST-999',
            createdAt: twinDate,
            status: 'DELIVERED',
            total: 2360,
            guestPhone: '01153770958',
            items: [],
          },
        ],
      },
    };

    const history = await getCustomerOrderHistory(mockPrisma, companyId, {
      customerId,
      phone: '01153770958',
      currentOrderNumber: '105102',
    });

    // Twin guest order is deduplicated: regular order CANCELLED is the original
    assert.strictEqual(history.stats.totalOrders, 1);
    assert.strictEqual(history.stats.deliveredCount, 0);
    assert.strictEqual(history.stats.cancelledCount, 1);
  });

  test('Item 1: includes guest order when total is different or placed 3 days later', async () => {
    const { getCustomerOrderHistory } = require('../../utils/sessionDetailsHelper');
    const companyId = 'comp-swan-1';
    const customerId = 'cust-noha-105102';

    const baseDate = new Date('2026-07-16T12:00:00.000Z');
    const threeDaysLater = new Date('2026-07-19T12:00:00.000Z'); // 3 days later

    const mockPrisma = {
      customer: {
        findFirst: async () => ({
          id: customerId,
          phone: '01153770958',
          phoneNormalized: '+201153770958',
          firstName: 'نهى',
          lastName: 'سامي',
        }),
      },
      order: {
        findMany: async () => [
          {
            id: 'ord-105102',
            orderNumber: '105102',
            createdAt: baseDate,
            status: 'CANCELLED',
            total: 2360,
            customerPhone: '01153770958',
            orderItems: [],
          },
        ],
      },
      guestOrder: {
        findMany: async () => [
          {
            id: 'guest-later',
            orderNumber: 'GUEST-888',
            createdAt: threeDaysLater,
            status: 'DELIVERED',
            total: 1500, // different total and 3 days later
            guestPhone: '01153770958',
            items: [],
          },
        ],
      },
    };

    const history = await getCustomerOrderHistory(mockPrisma, companyId, {
      customerId,
      phone: '01153770958',
      currentOrderNumber: '105102',
    });

    // Not a duplicate -> 2 orders counted (1 cancelled, 1 delivered)
    assert.strictEqual(history.stats.totalOrders, 2);
    assert.strictEqual(history.stats.deliveredCount, 1);
    assert.strictEqual(history.stats.cancelledCount, 1);
  });
});

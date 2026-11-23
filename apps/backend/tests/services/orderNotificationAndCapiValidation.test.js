const FacebookConversionsService = require('../../services/facebookConversionsService');
const notificationService = require('../../services/notificationService');

describe('Order Notifications & Meta CAPI Bug Fixes Test Suite', () => {
  describe('Meta CAPI Error Classification (#270, #190, #100)', () => {
    test('Correctly classifies error #270 as meta_app_permission with actionable Arabic message', () => {
      const errorObj = {
        response: {
          data: {
            error: {
              code: 270,
              message: 'Permissions ads_management or ads_read is required',
              fbtrace_id: 'trace_270_xyz'
            }
          }
        }
      };

      const result = FacebookConversionsService.classifyMetaError(errorObj);
      expect(result.code).toBe(270);
      expect(result.category).toBe('meta_app_permission');
      expect(result.fbtrace_id).toBe('trace_270_xyz');
      expect(result.message).toContain('ads_management');
      expect(result.message).toContain('Business Portfolio');
      expect(result.message).toContain('Development Mode');
    });

    test('Correctly classifies error #190 as invalid_token with Arabic message', () => {
      const errorObj = {
        code: 190,
        message: 'Error validating access token: Session has expired'
      };

      const result = FacebookConversionsService.classifyMetaError(errorObj);
      expect(result.code).toBe(190);
      expect(result.category).toBe('invalid_token');
      expect(result.message).toContain('منتهي الصلاحية');
    });

    test('Correctly classifies error #100 as invalid_parameters', () => {
      const result = FacebookConversionsService.classifyMetaError(100, 'Invalid Pixel ID');
      expect(result.code).toBe(100);
      expect(result.category).toBe('invalid_parameters');
      expect(result.message).toContain('معرف بكسل غير صالح');
    });
  });

  describe('Notification Service: Company Recipient Resolution & Non-null userId', () => {
    test('resolveCompanyRecipientUserIds returns active managers/owners', async () => {
      const mockUsers = [
        { id: 'usr_owner_1' },
        { id: 'usr_admin_2' }
      ];

      // Mock database call inside getSharedPrismaClient
      const sharedDb = require('../../services/sharedDatabase');
      const originalGetPrisma = sharedDb.getSharedPrismaClient;
      sharedDb.getSharedPrismaClient = () => ({
        user: {
          findMany: jest.fn().mockResolvedValue(mockUsers),
          findFirst: jest.fn().mockResolvedValue(null)
        }
      });

      const userIds = await notificationService.resolveCompanyRecipientUserIds('test_company_123');
      expect(userIds).toEqual(['usr_owner_1', 'usr_admin_2']);

      sharedDb.getSharedPrismaClient = originalGetPrisma;
    });

    test('createOrderNotification creates notifications with resolved userIds and prevents NULL', async () => {
      const createdRecords = [];
      const sharedDb = require('../../services/sharedDatabase');
      const originalGetPrisma = sharedDb.getSharedPrismaClient;

      sharedDb.getSharedPrismaClient = () => ({
        user: {
          findMany: jest.fn().mockResolvedValue([{ id: 'usr_manager_1' }]),
          findFirst: jest.fn().mockResolvedValue(null)
        },
        notification: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockImplementation(async ({ data }) => {
            createdRecords.push(data);
            return { id: 'notif_' + Date.now(), ...data };
          })
        }
      });

      const result = await notificationService.createOrderNotification({
        companyId: 'company_red_line',
        order: {
          id: 'ord_12345',
          orderNumber: 'ORD-999-TEST',
          guestName: 'محمد أحمد',
          guestPhone: '01012345678',
          total: 450
        },
        source: 'storefront'
      });

      expect(result).toHaveLength(1);
      expect(createdRecords[0].companyId).toBe('company_red_line');
      expect(createdRecords[0].userId).toBe('usr_manager_1');
      expect(createdRecords[0].userId).not.toBeNull();
      expect(createdRecords[0].type).toBe('order_created');
      expect(createdRecords[0].title).toBe('طلب جديد #ORD-999-TEST');
      expect(createdRecords[0].message).toBe('محمد أحمد • 450 ج.م');

      sharedDb.getSharedPrismaClient = originalGetPrisma;
    });

    test('createOrderNotification deduplicates repeated order creation calls', async () => {
      const sharedDb = require('../../services/sharedDatabase');
      const originalGetPrisma = sharedDb.getSharedPrismaClient;

      // Mock that order notification already exists
      sharedDb.getSharedPrismaClient = () => ({
        user: {
          findMany: jest.fn().mockResolvedValue([{ id: 'usr_manager_1' }]),
        },
        notification: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'existing_notif_1',
            data: JSON.stringify({ orderNumber: 'ORD-DUPE-TEST' })
          }),
          create: jest.fn()
        }
      });

      const result = await notificationService.createOrderNotification({
        companyId: 'company_red_line',
        order: {
          id: 'ord_dupe',
          orderNumber: 'ORD-DUPE-TEST',
          guestName: 'علي',
          total: 200
        }
      });

      expect(result).toBeNull();

      sharedDb.getSharedPrismaClient = originalGetPrisma;
    });
  });
});

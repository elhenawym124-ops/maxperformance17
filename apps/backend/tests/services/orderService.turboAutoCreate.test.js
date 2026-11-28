const defaultFormattedOrder = {
  orderNumber: 'ORD-123',
  customerName: 'John Doe',
  customerPhone: '01012345678',
  shippingAddress: 'شارع التحرير مبنى 10',
  governorate: 'القاهرة',
  city: 'الدقي',
  items: [{ id: 'item_1', name: 'Product 1', quantity: 1, price: 100 }]
};

const mockFormatOrderForTurbo = jest.fn().mockImplementation((order) => ({
  ...defaultFormattedOrder,
  ...(order?.orderNumber ? { orderNumber: order.orderNumber } : {}),
  ...(order?.customerPhone ? { customerPhone: order.customerPhone } : {})
}));
const mockCreateShipment = jest.fn().mockResolvedValue({
  success: true,
  shipmentId: 'TURBO-SHP-001',
  trackingNumber: 'TRK-998877',
  status: 'turbo_sent',
  labelUrl: 'https://turbo-eg.com/label/001',
  data: { code: 'TURBO-SHP-001', bar_code: 'TRK-998877' }
});

const mockFindShipmentByInvoiceNumber = jest.fn().mockResolvedValue(null);

const mockTurboInstance = {
  createShipment: mockCreateShipment,
  formatOrderForTurbo: mockFormatOrderForTurbo,
  findShipmentByInvoiceNumber: mockFindShipmentByInvoiceNumber,
  translateTurboErrorToArabic: jest.fn(msg => msg)
};

jest.mock('../../services/turboService', () => {
  return jest.fn().mockImplementation(() => mockTurboInstance);
});

const orderService = require('../../services/orderService');
const TurboService = require('../../services/turboService');

describe('OrderService - Turbo Auto-Shipment Creation & Idempotency', () => {
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFormatOrderForTurbo.mockImplementation((order) => ({
      ...defaultFormattedOrder,
      ...(order?.orderNumber ? { orderNumber: order.orderNumber } : {}),
      ...(order?.customerPhone ? { customerPhone: order.customerPhone } : {})
    }));
    mockCreateShipment.mockResolvedValue({
      success: true,
      shipmentId: 'TURBO-SHP-001',
      trackingNumber: 'TRK-998877',
      status: 'turbo_sent',
      labelUrl: 'https://turbo-eg.com/label/001',
      data: { code: 'TURBO-SHP-001', bar_code: 'TRK-998877' }
    });

    mockPrisma = {
      order: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'ord_1', ...data })),
        updateMany: jest.fn().mockResolvedValue({ count: 1 })
      },
      guestOrder: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'guest_1', ...data })),
        updateMany: jest.fn().mockResolvedValue({ count: 1 })
      },
      shipment: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'shp_mock_1' }),
        update: jest.fn().mockResolvedValue({ id: 'shp_mock_1' })
      },
      shippingCompany: {
        findFirst: jest.fn().mockResolvedValue(null)
      },
      company: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'comp_1',
          turboEnabled: true,
          turboAutoCreate: true,
          turboApiKey: 'test-api-key'
        })
      }
    };

    jest.spyOn(orderService, 'getPrisma').mockReturnValue(mockPrisma);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('autoCreateTurboShipmentForOrder', () => {
    test('1. Idempotency: skips when order already has turboShipmentId', async () => {
      const order = {
        id: 'ord_1',
        orderNumber: 'ORD-123',
        companyId: 'comp_1',
        turboShipmentId: 'EXISTING_SHIPMENT',
        turboTrackingNumber: null,
        shipments: [],
        customer: { name: 'John Doe' },
        orderItems: [{ id: 'item_1' }],
        company: { turboEnabled: true, turboAutoCreate: true, turboApiKey: 'key' }
      };

      const result = await orderService.autoCreateTurboShipmentForOrder(order, 'comp_1');

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('ALREADY_HAS_SHIPMENT');
      expect(TurboService).not.toHaveBeenCalled();
    });

    test('2. Idempotency: skips when order already has tracking number in shipments array', async () => {
      const order = {
        id: 'ord_1',
        orderNumber: 'ORD-123',
        companyId: 'comp_1',
        turboShipmentId: null,
        turboTrackingNumber: null,
        shipments: [{ trackingNumber: 'SHIP-TRK-123' }],
        customer: { name: 'John Doe' },
        orderItems: [{ id: 'item_1' }],
        company: { turboEnabled: true, turboAutoCreate: true, turboApiKey: 'key' }
      };

      const result = await orderService.autoCreateTurboShipmentForOrder(order, 'comp_1');

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('ALREADY_HAS_SHIPMENT');
      expect(TurboService).not.toHaveBeenCalled();
    });

    test('3. Skips cleanly when Turbo is disabled for the company', async () => {
      const order = {
        id: 'ord_1',
        orderNumber: 'ORD-123',
        companyId: 'comp_1',
        turboShipmentId: null,
        customer: { name: 'John Doe' },
        orderItems: [{ id: 'item_1' }],
        company: { turboEnabled: false, turboAutoCreate: false, turboApiKey: null }
      };

      mockPrisma.shippingCompany.findFirst.mockResolvedValue(null);

      const result = await orderService.autoCreateTurboShipmentForOrder(order, 'comp_1');

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('TURBO_NOT_ENABLED');
      expect(mockPrisma.order.update).not.toHaveBeenCalled();
      expect(TurboService).not.toHaveBeenCalled();
    });

    test('4. Records clear note and log when Turbo is enabled but autoCreate is disabled in settings', async () => {
      const order = {
        id: 'ord_1',
        orderNumber: 'ORD-123',
        companyId: 'comp_1',
        notes: 'ملاحظة قديمة',
        turboShipmentId: null,
        customer: { name: 'John' },
        orderItems: [{ id: 'item_1' }],
        company: { turboEnabled: true, turboAutoCreate: false, turboApiKey: 'key_123' }
      };

      const result = await orderService.autoCreateTurboShipmentForOrder(order, 'comp_1');

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('AUTO_CREATE_DISABLED');
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord_1' },
          data: expect.objectContaining({
            notes: expect.stringContaining('ميزة الإنشاء التلقائي غير مفعلة')
          })
        })
      );
      expect(TurboService).not.toHaveBeenCalled();
    });

    test('5. Records clear note and log when Turbo is enabled and autoCreate=true but API key is missing', async () => {
      const order = {
        id: 'ord_1',
        orderNumber: 'ORD-123',
        companyId: 'comp_1',
        notes: null,
        turboShipmentId: null,
        customer: { name: 'John' },
        orderItems: [{ id: 'item_1' }],
        company: { turboEnabled: true, turboAutoCreate: true, turboApiKey: '' }
      };

      const result = await orderService.autoCreateTurboShipmentForOrder(order, 'comp_1');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('MISSING_API_KEY');
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord_1' },
          data: expect.objectContaining({
            notes: expect.stringContaining('مفتاح API غير مضبوط')
          })
        })
      );
      expect(TurboService).not.toHaveBeenCalled();
    });

    test('6. Successfully creates shipment and saves tracking number & shipmentId', async () => {
      const order = {
        id: 'ord_1',
        orderNumber: 'ORD-123',
        companyId: 'comp_1',
        customerPhone: '01012345678',
        turboShipmentId: null,
        customer: { name: 'John' },
        orderItems: [{ id: 'item_1' }],
        company: { turboEnabled: true, turboAutoCreate: true, turboApiKey: 'key_123' }
      };

      jest.spyOn(orderService, 'checkDuplicateActiveTurboShipment').mockResolvedValue(null);

      const result = await orderService.autoCreateTurboShipmentForOrder(order, 'comp_1');

      expect(result.success).toBe(true);
      expect(result.shipmentId).toBe('TURBO-SHP-001');
      expect(result.trackingNumber).toBe('TRK-998877');
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord_1' },
          data: expect.objectContaining({
            turboShipmentId: 'TURBO-SHP-001',
            turboTrackingNumber: 'TRK-998877',
            turboShipmentStatus: 'turbo_sent',
            turboLabelUrl: 'https://turbo-eg.com/label/001'
          })
        })
      );
      expect(mockPrisma.guestOrder.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId: 'comp_1', orderNumber: 'ORD-123' },
          data: expect.objectContaining({
            turboShipmentId: 'TURBO-SHP-001',
            turboTrackingNumber: 'TRK-998877'
          })
        })
      );
    });

    test('7. Records failure note on order when Turbo API rejects/throws without throwing', async () => {
      const order = {
        id: 'ord_1',
        orderNumber: 'ORD-123',
        companyId: 'comp_1',
        customerPhone: '01012345678',
        turboShipmentId: null,
        notes: 'ملاحظة',
        customer: { name: 'John' },
        orderItems: [{ id: 'item_1' }],
        company: { turboEnabled: true, turboAutoCreate: true, turboApiKey: 'key_123' }
      };

      jest.spyOn(orderService, 'checkDuplicateActiveTurboShipment').mockResolvedValue(null);
      mockTurboInstance.createShipment.mockRejectedValue(new Error('رقم هاتف العميل غير صحيح'));

      const result = await orderService.autoCreateTurboShipmentForOrder(order, 'comp_1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('رقم هاتف العميل غير صحيح');
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord_1' },
          data: expect.objectContaining({
            notes: expect.stringContaining('فشل إنشاء شحنة تربو تلقائياً: رقم هاتف العميل غير صحيح')
          })
        })
      );
    });

    test('9. Repeat customer placed another order within 48h is NOT blocked (per-order idempotency)', async () => {
      const order = {
        id: 'ord_2_repeat',
        orderNumber: 'ORD-456',
        companyId: 'comp_1',
        customerPhone: '01012345678',
        turboShipmentId: null,
        turboTrackingNumber: null,
        shipments: [],
        customer: { name: 'Repeat Customer', phone: '01012345678' },
        orderItems: [{ id: 'item_2' }],
        company: { turboEnabled: true, turboAutoCreate: true, turboApiKey: 'key_123' }
      };

      const result = await orderService.autoCreateTurboShipmentForOrder(order, 'comp_1');

      expect(result.success).toBe(true);
      expect(result.shipmentId).toBe('TURBO-SHP-001');
      expect(result.trackingNumber).toBe('TRK-998877');
      expect(TurboService).toHaveBeenCalled();
    });

    test('10. Attaches structured shippingAutoError (DATA_ERROR) to metadata on invalid phone', async () => {
      const order = {
        id: 'ord_phone_err',
        orderNumber: 'ORD-789',
        companyId: 'comp_1',
        customerPhone: '010123',
        turboShipmentId: null,
        metadata: JSON.stringify({ someKey: 'val' }),
        customer: { name: 'John' },
        orderItems: [{ id: 'item_1' }],
        company: { turboEnabled: true, turboAutoCreate: true, turboApiKey: 'key_123' }
      };

      mockTurboInstance.createShipment.mockRejectedValue(new Error('رقم هاتف العميل غير صحيح: الرقم مكون من 6 أرقام بدلاً من 11 رقماً'));

      const result = await orderService.autoCreateTurboShipmentForOrder(order, 'comp_1');

      expect(result.success).toBe(false);
      expect(result.errorInfo.category).toBe('DATA_ERROR');
      expect(result.errorInfo.code).toBe('INVALID_PHONE');

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord_phone_err' },
          data: expect.objectContaining({
            metadata: expect.stringContaining('"category":"DATA_ERROR"')
          })
        })
      );
    });

    test('11. Attaches structured shippingAutoError (SYSTEM_ERROR) to metadata on carrier timeout', async () => {
      const order = {
        id: 'ord_sys_err',
        orderNumber: 'ORD-999',
        companyId: 'comp_1',
        customerPhone: '01012345678',
        turboShipmentId: null,
        metadata: null,
        customer: { name: 'John' },
        orderItems: [{ id: 'item_1' }],
        company: { turboEnabled: true, turboAutoCreate: true, turboApiKey: 'key_123' }
      };

      mockTurboInstance.createShipment.mockRejectedValue(new Error('تعذر الاتصال بسيرفر تربو، timeout'));

      const result = await orderService.autoCreateTurboShipmentForOrder(order, 'comp_1');

      expect(result.success).toBe(false);
      expect(result.errorInfo.category).toBe('SYSTEM_ERROR');
      expect(result.errorInfo.code).toBe('CARRIER_CONNECTION_ERROR');

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord_sys_err' },
          data: expect.objectContaining({
            metadata: expect.stringContaining('"category":"SYSTEM_ERROR"')
          })
        })
      );
    });

    test('12. Clears shippingAutoError from metadata upon successful shipment creation', async () => {
      const order = {
        id: 'ord_recovered',
        orderNumber: 'ORD-RECOVER',
        companyId: 'comp_1',
        customerPhone: '01012345678',
        turboShipmentId: null,
        metadata: JSON.stringify({
          previousFlag: true,
          shippingAutoError: { category: 'DATA_ERROR', code: 'INVALID_PHONE' }
        }),
        customer: { name: 'John' },
        orderItems: [{ id: 'item_1' }],
        company: { turboEnabled: true, turboAutoCreate: true, turboApiKey: 'key_123' }
      };

      const result = await orderService.autoCreateTurboShipmentForOrder(order, 'comp_1');

      expect(result.success).toBe(true);
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord_recovered' },
          data: expect.objectContaining({
            metadata: expect.not.stringContaining('shippingAutoError')
          })
        })
      );
    });

    test('13. Transient failure: retries on transient errors and succeeds on 3rd attempt (max 3 attempts)', async () => {
      const order = {
        id: 'ord_retry_success',
        orderNumber: 'ORD-RETRY-1',
        companyId: 'comp_1',
        customerPhone: '01012345678',
        shippingAddress: 'شارع التحرير',
        governorate: 'القاهرة',
        turboShipmentId: null,
        customer: { name: 'Retry Customer' },
        orderItems: [{ id: 'item_1' }],
        company: { turboEnabled: true, turboAutoCreate: true, turboApiKey: 'key_123' }
      };

      jest.spyOn(orderService, 'checkDuplicateActiveTurboShipment').mockResolvedValue(null);

      mockTurboInstance.createShipment
        .mockRejectedValueOnce(new Error('لم يتم تلقي استجابة من سيرفر تربو (timeout)'))
        .mockRejectedValueOnce(new Error('ETIMEDOUT: connection timed out'))
        .mockResolvedValueOnce({
          success: true,
          shipmentId: 'TURBO-SHP-001',
          trackingNumber: 'TRK-998877',
          status: 'turbo_sent',
          labelUrl: 'https://turbo-eg.com/label/001',
          data: { code: 'TURBO-SHP-001', bar_code: 'TRK-998877' }
        });

      const result = await orderService.autoCreateTurboShipmentForOrder(order, 'comp_1', {
        retryDelays: [5, 5]
      });

      expect(result.success).toBe(true);
      expect(result.shipmentId).toBe('TURBO-SHP-001');
      expect(result.trackingNumber).toBe('TRK-998877');
      expect(result.attempts).toBe(3);
      expect(mockTurboInstance.createShipment).toHaveBeenCalledTimes(3);
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord_retry_success' },
          data: expect.objectContaining({
            turboShipmentId: 'TURBO-SHP-001',
            turboTrackingNumber: 'TRK-998877'
          })
        })
      );
    });

    test('14. Data failure: does NOT retry on data validation errors and exits immediately after 1 attempt', async () => {
      const order = {
        id: 'ord_data_fail',
        orderNumber: 'ORD-DATA-1',
        companyId: 'comp_1',
        customerPhone: '01012345678',
        shippingAddress: 'شارع التحرير',
        governorate: 'القاهرة',
        turboShipmentId: null,
        customer: { name: 'Data Err Customer' },
        orderItems: [{ id: 'item_1' }],
        company: { turboEnabled: true, turboAutoCreate: true, turboApiKey: 'key_123' }
      };

      jest.spyOn(orderService, 'checkDuplicateActiveTurboShipment').mockResolvedValue(null);

      mockTurboInstance.createShipment.mockResolvedValueOnce({
        success: false,
        error: 'رقم هاتف العميل غير صحيح أو غير مفعل في شبكات المحمول'
      });

      const result = await orderService.autoCreateTurboShipmentForOrder(order, 'comp_1', {
        retryDelays: [5, 5]
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(mockTurboInstance.createShipment).toHaveBeenCalledTimes(1);
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord_data_fail' },
          data: expect.objectContaining({
            metadata: expect.stringContaining('"attempts":1')
          })
        })
      );
    });
    test('15. Stage mismatch: skips when trigger is ON_READY and requested stage is ON_CONFIRM', async () => {
      mockPrisma.shippingCompany.findFirst.mockResolvedValueOnce({
        providerKey: 'TURBO',
        apiKey: 'turbo_key_123',
        settings: JSON.stringify({ autoCreateShipments: true, shipmentCreateTrigger: 'ON_READY' })
      });

      const order = {
        id: 'ord_stage_1',
        orderNumber: 'ORD-STAGE-1',
        companyId: 'comp_1',
        customer: { firstName: 'علي', lastName: 'محمد' },
        customerPhone: '01012345678',
        governorate: 'القاهرة',
        total: 500,
        shipping: 50,
        orderItems: [{ product: { name: 'حذاء' }, quantity: 1, price: 450 }],
        company: { id: 'comp_1', turboEnabled: true, turboAutoCreate: true, turboApiKey: 'turbo_key_123' }
      };

      const result = await orderService.autoCreateTurboShipmentForOrder(order, 'comp_1', { stage: 'ON_CONFIRM' });

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('TRIGGER_STAGE_MISMATCH');
      expect(result.stage).toBe('ON_CONFIRM');
    });

    test('16. Stage match: creates shipment when trigger is ON_READY and requested stage is ON_READY', async () => {
      mockPrisma.shippingCompany.findFirst.mockResolvedValueOnce({
        providerKey: 'TURBO',
        apiKey: 'turbo_key_123',
        settings: JSON.stringify({ autoCreateShipments: true, shipmentCreateTrigger: 'ON_READY' })
      });

      const order = {
        id: 'ord_stage_2',
        orderNumber: 'ORD-STAGE-2',
        companyId: 'comp_1',
        customer: { firstName: 'علي', lastName: 'محمد' },
        customerPhone: '01012345678',
        governorate: 'القاهرة',
        total: 500,
        shipping: 50,
        orderItems: [{ product: { name: 'حذاء' }, quantity: 1, price: 450 }],
        company: { id: 'comp_1', turboEnabled: true, turboAutoCreate: true, turboApiKey: 'turbo_key_123' }
      };

      const result = await orderService.autoCreateTurboShipmentForOrder(order, 'comp_1', { stage: 'ON_READY' });

      expect(result.success).toBe(true);
      expect(result.shipmentId).toBe('TURBO-SHP-001');
    });

    test('17. Stage match: creates shipment when trigger is ON_ORDER and requested stage is ON_ORDER', async () => {
      mockPrisma.shippingCompany.findFirst.mockResolvedValueOnce({
        providerKey: 'TURBO',
        apiKey: 'turbo_key_123',
        settings: JSON.stringify({ autoCreateShipments: true, shipmentCreateTrigger: 'ON_ORDER' })
      });

      const order = {
        id: 'ord_stage_3',
        orderNumber: 'ORD-STAGE-3',
        companyId: 'comp_1',
        customer: { firstName: 'علي', lastName: 'محمد' },
        customerPhone: '01012345678',
        governorate: 'القاهرة',
        total: 500,
        shipping: 50,
        orderItems: [{ product: { name: 'حذاء' }, quantity: 1, price: 450 }],
        company: { id: 'comp_1', turboEnabled: true, turboAutoCreate: true, turboApiKey: 'turbo_key_123' }
      };

      const result = await orderService.autoCreateTurboShipmentForOrder(order, 'comp_1', { stage: 'ON_ORDER' });

      expect(result.success).toBe(true);
      expect(result.shipmentId).toBe('TURBO-SHP-001');
    });
  });

  describe('autoCreateTurboShipmentForGuestOrder', () => {
    test('8. Formats guest order and creates Turbo shipment successfully', async () => {
      const guestOrder = {
        id: 'guest_1',
        orderNumber: 'ORD-GUEST-99',
        companyId: 'comp_1',
        guestName: 'أحمد علي',
        guestPhone: '01012345678',
        guestEmail: 'guest@example.com',
        shippingAddress: 'شارع الهرم الرئيسي',
        governorate: 'الجيزة',
        total: 250,
        shippingCost: 50,
        items: JSON.stringify([{ id: 'p1', name: 'تيشيرت', quantity: 1, price: 200 }]),
        turboShipmentId: null
      };

      const result = await orderService.autoCreateTurboShipmentForGuestOrder(guestOrder, 'comp_1');

      expect(result.success).toBe(true);
      expect(result.shipmentId).toBe('TURBO-SHP-001');
      expect(result.trackingNumber).toBe('TRK-998877');
      expect(mockPrisma.guestOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'guest_1' },
          data: expect.objectContaining({
            turboShipmentId: 'TURBO-SHP-001',
            turboTrackingNumber: 'TRK-998877'
          })
        })
      );
      expect(mockPrisma.order.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId: 'comp_1', orderNumber: 'ORD-GUEST-99' },
          data: expect.objectContaining({
            turboShipmentId: 'TURBO-SHP-001',
            turboTrackingNumber: 'TRK-998877'
          })
        })
      );
    });

    test('18. Guest order: skips when trigger is ON_READY and requested stage is ON_CONFIRM', async () => {
      mockPrisma.shippingCompany.findFirst.mockResolvedValueOnce({
        providerKey: 'TURBO',
        apiKey: 'turbo_key_123',
        settings: JSON.stringify({ autoCreateShipments: true, shipmentCreateTrigger: 'ON_READY' })
      });

      const guestOrder = {
        id: 'guest_stage_1',
        orderNumber: 'ORD-GUEST-STAGE-1',
        companyId: 'comp_1',
        guestName: 'أحمد علي',
        guestPhone: '01012345678',
        governorate: 'الجيزة',
        total: 250,
        shippingCost: 50,
        items: JSON.stringify([{ id: 'p1', name: 'تيشيرت', quantity: 1, price: 200 }]),
        turboShipmentId: null
      };

      const result = await orderService.autoCreateTurboShipmentForGuestOrder(guestOrder, 'comp_1', { stage: 'ON_CONFIRM' });

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('TRIGGER_STAGE_MISMATCH');
      expect(result.stage).toBe('ON_CONFIRM');
    });

    test('19. Guest order: creates shipment when trigger is ON_READY and requested stage is ON_READY', async () => {
      mockPrisma.shippingCompany.findFirst.mockResolvedValueOnce({
        providerKey: 'TURBO',
        apiKey: 'turbo_key_123',
        settings: JSON.stringify({ autoCreateShipments: true, shipmentCreateTrigger: 'ON_READY' })
      });

      const guestOrder = {
        id: 'guest_stage_2',
        orderNumber: 'ORD-GUEST-STAGE-2',
        companyId: 'comp_1',
        guestName: 'أحمد علي',
        guestPhone: '01012345678',
        governorate: 'الجيزة',
        total: 250,
        shippingCost: 50,
        items: JSON.stringify([{ id: 'p1', name: 'تيشيرت', quantity: 1, price: 200 }]),
        turboShipmentId: null
      };

      const result = await orderService.autoCreateTurboShipmentForGuestOrder(guestOrder, 'comp_1', { stage: 'ON_READY' });

      expect(result.success).toBe(true);
      expect(result.shipmentId).toBe('TURBO-SHP-001');
    });
  });

  describe('Red-Line Concurrency & Timeout Idempotency', () => {
    test('20. Concurrency Red-Line: Two simultaneous calls for the same order create EXACTLY ONE shipment at Turbo and in DB', async () => {
      const order = {
        id: 'ord_concurrent_1',
        orderNumber: 'ORD-CONC-001',
        companyId: 'comp_1',
        customer: { firstName: 'سعيد', lastName: 'محمود' },
        customerPhone: '01011223344',
        governorate: 'القاهرة',
        city: 'المعادي',
        shippingAddress: 'شارع النصر المعادي',
        total: 600,
        shipping: 50,
        orderItems: [{ product: { name: 'قميص' }, quantity: 1, price: 550 }],
        company: { id: 'comp_1', turboEnabled: true, turboAutoCreate: true, turboApiKey: 'turbo_key_123' },
        turboShipmentId: null,
        turboTrackingNumber: null
      };

      // Mock createShipment to have a realistic async delay
      mockCreateShipment.mockImplementationOnce(async () => {
        await new Promise(r => setTimeout(r, 60));
        return {
          success: true,
          shipmentId: 'TURBO-SHP-CONC',
          trackingNumber: 'TRK-CONC',
          status: 'turbo_sent',
          data: { code: 'TURBO-SHP-CONC' }
        };
      });

      // Fire two simultaneous calls at the exact same millisecond
      const [res1, res2] = await Promise.all([
        orderService.autoCreateTurboShipmentForOrder(order, 'comp_1', { force: true }),
        orderService.autoCreateTurboShipmentForOrder(order, 'comp_1', { force: true })
      ]);

      // Exactly ONE must succeed and create shipment
      const successful = [res1, res2].filter(r => r.success === true);
      const skipped = [res1, res2].filter(r => r.skipped === true);

      expect(successful.length).toBe(1);
      expect(skipped.length).toBe(1);
      expect(skipped[0].reason).toMatch(/IN_FLIGHT|ALREADY_HAS_SHIPMENT/);

      // Verify Turbo API was called EXACTLY ONCE
      expect(mockCreateShipment).toHaveBeenCalledTimes(1);
    });

    test('21. Timeout Idempotency: When createShipment throws timeout exception, inquires Turbo and adopts remote shipment without retry', async () => {
      const order = {
        id: 'ord_timeout_1',
        orderNumber: 'ORD-TIMEOUT-001',
        companyId: 'comp_1',
        customer: { firstName: 'وائل', lastName: 'حسن' },
        customerPhone: '01055667788',
        governorate: 'الجيزة',
        city: 'الدقي',
        shippingAddress: 'شارع مصدق',
        total: 400,
        shipping: 40,
        orderItems: [{ product: { name: 'بنطلون' }, quantity: 1, price: 360 }],
        company: { id: 'comp_1', turboEnabled: true, turboAutoCreate: true, turboApiKey: 'turbo_key_123' },
        turboShipmentId: null,
        turboTrackingNumber: null
      };

      // First call to createShipment times out (e.g. Turbo took request but response timed out)
      const timeoutError = new Error('connect ETIMEDOUT');
      timeoutError.code = 'ETIMEDOUT';
      mockCreateShipment.mockRejectedValueOnce(timeoutError);

      // Pre-shipment inquiry returns null (shipment not yet created)
      // Then post-exception inquiry discovers Turbo actually created the shipment!
      mockFindShipmentByInvoiceNumber
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          success: true,
          shipmentId: '39185999',
          trackingNumber: '39185999',
          status: 'قيد الإنتظار',
          data: { code: '39185999', invoice_number: 'ORD-TIMEOUT-001' }
        });

      const result = await orderService.autoCreateTurboShipmentForOrder(order, 'comp_1', { force: true });

      expect(result.success).toBe(true);
      expect(result.shipmentId).toBe('39185999');
      // Must NOT retry createShipment again!
      expect(mockCreateShipment).toHaveBeenCalledTimes(1);
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord_timeout_1' },
          data: expect.objectContaining({
            turboShipmentId: '39185999',
            turboTrackingNumber: '39185999'
          })
        })
      );
    });

    test('22. Pre-Check Idempotency: Skips when active shipment exists in shipments table', async () => {
      const order = {
        id: 'ord_existing_shp',
        orderNumber: 'ORD-EXIST-SHP',
        companyId: 'comp_1',
        customer: { firstName: 'عمرو', lastName: 'خالد' },
        customerPhone: '01011223399',
        governorate: 'القاهرة',
        total: 300,
        shipping: 50,
        orderItems: [{ product: { name: 'كاب' }, quantity: 1, price: 250 }],
        company: { id: 'comp_1', turboEnabled: true, turboAutoCreate: true, turboApiKey: 'turbo_key_123' },
        turboShipmentId: null,
        turboTrackingNumber: null
      };

      mockPrisma.shipment.findFirst.mockResolvedValueOnce({
        id: 'shp_row_existing',
        orderId: 'ord_existing_shp',
        externalShipmentId: '39185858',
        trackingNumber: '39185858',
        status: 'turbo_sent'
      });

      const result = await orderService.autoCreateTurboShipmentForOrder(order, 'comp_1', { force: true });

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('ALREADY_HAS_SHIPMENT');
      expect(result.shipmentId).toBe('39185858');
      expect(mockCreateShipment).not.toHaveBeenCalled();
    });
  });
});


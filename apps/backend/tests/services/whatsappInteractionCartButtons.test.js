const mockPrisma = {
  whatsAppNotificationLog: { findFirst: jest.fn() },
  order: { findFirst: jest.fn() },
  guestCart: { findMany: jest.fn() },
  cartContactLog: { create: jest.fn() },
};

jest.mock('../../services/sharedDatabase', () => ({
  getSharedPrismaClient: jest.fn(() => mockPrisma),
}));

jest.mock('../../services/orderService', () => ({}));
jest.mock('../../services/taskNotificationService', () => ({
  handleExecutionResponse: jest.fn(),
}));

const mockConvertSingleIncompleteCart = jest.fn();
jest.mock('../../services/orders/incompleteCartAutoConvertService', () => ({
  convertSingleIncompleteCart: (...args) => mockConvertSingleIncompleteCart(...args),
}));

const mockSendText = jest.fn().mockResolvedValue({ success: true });
jest.mock('../../services/whatsapp/WhatsAppMessageHandler', () => ({
  sendText: (...args) => mockSendText(...args),
}));

const WhatsAppInteractionService = require('../../services/whatsapp/WhatsAppInteractionService');

describe('WhatsAppInteractionService incomplete cart button actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    WhatsAppInteractionService.updateOrderStatus = jest.fn().mockResolvedValue({ success: true });
    mockPrisma.whatsAppNotificationLog.findFirst.mockResolvedValue(null);
    mockPrisma.order.findFirst.mockResolvedValue(null);
    mockPrisma.guestCart.findMany.mockResolvedValue([]);
    mockPrisma.cartContactLog.create.mockResolvedValue({ id: 'log-1' });
  });

  test('confirm_cart_<cartId> converts incomplete cart and sets order to CONFIRMED', async () => {
    mockConvertSingleIncompleteCart.mockResolvedValue({
      success: true,
      data: { id: 'ord-new-1', orderNumber: 'ORD-2026-001' },
    });

    const result = await WhatsAppInteractionService.handleButtonResponse(
      'sess-1',
      'cmp-1',
      '201001234567@s.whatsapp.net',
      { id: 'confirm_cart_cart-777', text: 'تأكيد الطلب' }
    );

    expect(mockConvertSingleIncompleteCart).toHaveBeenCalledWith({
      companyId: 'cmp-1',
      cartId: 'cart-777',
      forceConvert: true,
      channel: 'whatsapp-confirm',
    });
    expect(WhatsAppInteractionService.updateOrderStatus).toHaveBeenCalledWith(
      'ord-new-1',
      'cmp-1',
      'CONFIRMED',
      expect.stringContaining('تأكيد')
    );
    expect(result).toEqual({ success: true });
  });

  test('cancel_cart_<cartId> creates dismissed CartContactLog and sends confirmation reply', async () => {
    const result = await WhatsAppInteractionService.handleButtonResponse(
      'sess-1',
      'cmp-1',
      '201001234567@s.whatsapp.net',
      { id: 'cancel_cart_cart-888', text: 'إلغاء الطلب' }
    );

    expect(mockPrisma.cartContactLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: 'cmp-1',
        cartId: 'cart-888',
        method: 'dismissed',
        result: 'cancelled',
      }),
    });
    expect(mockSendText).toHaveBeenCalledWith(
      'sess-1',
      '201001234567@s.whatsapp.net',
      expect.stringContaining('إلغاء')
    );
    expect(result).toEqual({ success: true, cancelled: true, cartId: 'cart-888' });
  });

  test('Meta QUICK_REPLY "تأكيد الطلب" routes to pending incomplete cart from ABANDONED_CART log', async () => {
    mockPrisma.whatsAppNotificationLog.findFirst.mockResolvedValue({
      category: 'ABANDONED_CART',
      cartId: 'cart-999',
      orderId: null,
    });
    mockConvertSingleIncompleteCart.mockResolvedValue({
      success: true,
      data: { id: 'ord-new-2', orderNumber: 'ORD-2026-002' },
    });

    await WhatsAppInteractionService.handleButtonResponse(
      'sess-1',
      'cmp-1',
      '201001234567@s.whatsapp.net',
      { id: 'تأكيد الطلب', text: 'تأكيد الطلب' }
    );

    expect(mockConvertSingleIncompleteCart).toHaveBeenCalledWith({
      companyId: 'cmp-1',
      cartId: 'cart-999',
      forceConvert: true,
      channel: 'whatsapp-confirm',
    });
    expect(WhatsAppInteractionService.updateOrderStatus).toHaveBeenCalledWith(
      'ord-new-2',
      'cmp-1',
      'CONFIRMED',
      expect.any(String)
    );
  });
});

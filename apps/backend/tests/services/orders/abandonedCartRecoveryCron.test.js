jest.mock('node-cron', () => ({ schedule: jest.fn() }), { virtual: true });

const mockPrisma = {
  whatsAppNotificationSettings: { findMany: jest.fn() },
  guestCart: { findMany: jest.fn() },
  whatsAppNotificationLog: { findFirst: jest.fn() },
  cartConversionLog: { findFirst: jest.fn() },
  cartContactLog: { findFirst: jest.fn() },
  order: { findFirst: jest.fn() },
};

jest.mock('../../../services/sharedDatabase', () => ({
  getSharedPrismaClient: jest.fn(() => mockPrisma),
}));

jest.mock('../../../services/whatsapp/WhatsAppNotificationService', () => ({
  sendAbandonedCartNotification: jest.fn().mockResolvedValue({ success: true }),
}));

const { processAbandonedCarts } = require('../../../cron/abandonedCartRecoveryCron');
const { sendAbandonedCartNotification } = require('../../../services/whatsapp/WhatsAppNotificationService');

describe('abandonedCartRecoveryCron.processAbandonedCarts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.whatsAppNotificationSettings.findMany.mockResolvedValue([
      {
        companyId: 'cmp-1',
        abandonedCartFirstReminder: 1,
        abandonedCartSecondReminder: 24,
        abandonedCartThirdReminder: 72,
        abandonedCartDiscountEnabled: false,
        abandonedCartDiscountPercent: 10,
      },
    ]);
    mockPrisma.whatsAppNotificationLog.findFirst.mockResolvedValue(null);
    mockPrisma.cartConversionLog.findFirst.mockResolvedValue(null);
    mockPrisma.cartContactLog.findFirst.mockResolvedValue(null);
    mockPrisma.order.findFirst.mockResolvedValue(null);
    sendAbandonedCartNotification.mockResolvedValue({ success: true });
  });

  test('skips converted or dismissed carts and deduplicates by phone', async () => {
    const carts = [
      {
        id: 'cuid-1',
        cartId: 'cart-converted',
        companyId: 'cmp-1',
        items: JSON.stringify([{ productId: 'p1', quantity: 1 }]),
        total: '200',
        checkoutData: JSON.stringify({ guestPhone: '01011112222', guestName: 'Converted User' }),
      },
      {
        id: 'cuid-2',
        cartId: 'cart-active-1',
        companyId: 'cmp-1',
        items: JSON.stringify([{ productId: 'p2', quantity: 1 }]),
        total: '350',
        checkoutData: JSON.stringify({ guestPhone: '01033334444', guestName: 'Active User' }),
      },
      {
        id: 'cuid-3',
        cartId: 'cart-active-dup-phone',
        companyId: 'cmp-1',
        items: JSON.stringify([{ productId: 'p3', quantity: 1 }]),
        total: '150',
        checkoutData: JSON.stringify({ guestPhone: '01033334444', guestName: 'Active User Dup' }),
      },
    ];

    // Return carts only on first window, empty on others
    mockPrisma.guestCart.findMany
      .mockResolvedValueOnce(carts)
      .mockResolvedValue([]);

    mockPrisma.cartConversionLog.findFirst.mockImplementation(async ({ where }) =>
      where.cartId === 'cart-converted' ? { id: 'conv-1' } : null
    );

    const res = await processAbandonedCarts();
    expect(res.sent).toBe(1);
    expect(sendAbandonedCartNotification).toHaveBeenCalledTimes(1);
    expect(sendAbandonedCartNotification.mock.calls[0][0].cartId).toBe('cart-active-1');
  });

  test('skips carts whose phone already has a recent order', async () => {
    mockPrisma.guestCart.findMany
      .mockResolvedValueOnce([
        {
          id: 'cuid-4',
          cartId: 'cart-ordered-phone',
          companyId: 'cmp-1',
          items: JSON.stringify([{ productId: 'p4', quantity: 1 }]),
          total: '400',
          checkoutData: JSON.stringify({ guestPhone: '01055556666' }),
        },
      ])
      .mockResolvedValue([]);

    mockPrisma.order.findFirst.mockResolvedValue({ id: 'ord-1' });

    const res = await processAbandonedCarts();
    expect(res.sent).toBe(0);
    expect(sendAbandonedCartNotification).not.toHaveBeenCalled();
  });
});

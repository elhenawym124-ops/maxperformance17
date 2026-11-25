const { getSharedPrismaClient, safeQuery } = require('../sharedDatabase');
const {
  sendNotification,
  isDuplicateNotification,
} = require('../whatsapp/WhatsAppNotificationService');
const {
  buildCartRecoveryUrl,
  isCartConvertedOrDismissed,
} = require('../../utils/cartRecoveryHelper');

const EVENT_TYPE = 'INCOMPLETE_CART_FIRST_APPEARANCE';
const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000;
const DEFAULT_GRACE_MINUTES = 15;

const PHONE_KEYS = [
  'guestPhone',
  'customerPhone',
  'phoneNumber',
  'mobileNumber',
  'phone',
  'mobile',
];
const NAME_KEYS = ['guestName', 'fullName', 'customerName', 'name'];

function parseJsonField(value) {
  if (!value) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return null;
  }
}

function pickFirst(obj, keys) {
  if (!obj || typeof obj !== 'object') return '';
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

async function handleCartCreated(cart) {
  try {
    const prisma = getSharedPrismaClient();

    const settings = await safeQuery(() =>
      prisma.whatsAppNotificationSettings.findUnique({
        where: { companyId: cart.companyId },
      }),
    );

    if (!settings?.isEnabled) {
      return { success: false, reason: 'notifications_disabled' };
    }

    if (!settings.incompleteCartImmediateMessage) {
      return { success: false, reason: 'immediate_message_disabled' };
    }

    const checkoutData = parseJsonField(cart.checkoutData);
    const phone = pickFirst(checkoutData, PHONE_KEYS);
    if (!phone) {
      return { success: false, reason: 'no_phone' };
    }

    const guard = await safeQuery(() =>
      isCartConvertedOrDismissed(prisma, {
        companyId: cart.companyId,
        cartId: cart.cartId,
        customerPhone: phone,
      }),
    );
    if (guard?.blocked) {
      return { success: false, reason: guard.reason || 'converted' };
    }

    const duplicate = await isDuplicateNotification({
      companyId: cart.companyId,
      recipientPhone: phone,
      eventType: EVENT_TYPE,
      windowMs: DEDUP_WINDOW_MS,
    });
    if (duplicate) {
      return { success: false, reason: 'duplicate_blocked' };
    }

    const items = parseJsonField(cart.items);
    const name = pickFirst(checkoutData, NAME_KEYS);
    const total = typeof cart.total === 'string' ? parseFloat(cart.total) || 0 : Number(cart.total || 0);
    const itemCount = (Array.isArray(items) ? items.length : 0).toString();
    const cartUrl = await buildCartRecoveryUrl(cart.companyId, cart.cartId);

    const template = await safeQuery(() =>
      prisma.whatsAppNotificationTemplate.findFirst({
        where: { companyId: cart.companyId, eventType: EVENT_TYPE, isActive: true },
        orderBy: { isDefault: 'desc' },
        select: { channel: true },
      }),
    );

    const graceMinutes = Number.isFinite(Number(settings.incompleteCartGraceMinutes))
      ? Math.max(0, Number(settings.incompleteCartGraceMinutes))
      : DEFAULT_GRACE_MINUTES;
    const scheduleAt = graceMinutes > 0
      ? new Date(Date.now() + graceMinutes * 60 * 1000)
      : null;

    return sendNotification({
      companyId: cart.companyId,
      recipientPhone: phone,
      recipientName: name || null,
      recipientType: 'CUSTOMER',
      category: 'ABANDONED_CART',
      eventType: EVENT_TYPE,
      channel: template?.channel || 'AUTO',
      ...(scheduleAt ? { scheduleAt } : {}),
      variables: {
        customerName: name || 'عميلنا العزيز',
        itemCount,
        itemsCount: itemCount,
        total: total.toString(),
        cartTotal: total.toString(),
        currency: 'EGP',
        cartUrl,
        checkoutUrl: cartUrl,
      },
      cartId: cart.cartId,
      priority: 3,
    });
  } catch (error) {
    console.error('❌ [INCOMPLETE-CART-MSG] Failed to send first-appearance message:', error.message);
    return { success: false, reason: 'error', error: error.message };
  }
}

module.exports = {
  EVENT_TYPE,
  handleCartCreated,
};

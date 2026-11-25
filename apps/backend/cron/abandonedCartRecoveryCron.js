const cron = require('node-cron');
const { getSharedPrismaClient } = require('../services/sharedDatabase');
const { sendAbandonedCartNotification } = require('../services/whatsapp/WhatsAppNotificationService');
const { isCartConvertedOrDismissed, normalizePhoneSuffix } = require('../utils/cartRecoveryHelper');

/**
 * 🆕 Wave 1 — Abandoned guest-cart recovery cron.
 * Sweeps over guest carts per enabled company respecting tenant reminder hours,
 * excludes converted/dismissed carts and recent orders, deduplicates by phone & cartId.
 */

const DEFAULT_WINDOWS = [
  { eventType: 'CART_ABANDONED_1H', settingKey: 'abandonedCartFirstReminder', defaultHours: 1, spanHours: 2 },
  { eventType: 'CART_ABANDONED_24H', settingKey: 'abandonedCartSecondReminder', defaultHours: 24, spanHours: 24 },
  { eventType: 'CART_ABANDONED_72H', settingKey: 'abandonedCartThirdReminder', defaultHours: 72, spanHours: 24 }
];

function extractGuestContact(cart) {
  let checkout = null;
  try {
    checkout = typeof cart.checkoutData === 'string' ? JSON.parse(cart.checkoutData) : cart.checkoutData;
  } catch (e) {
    checkout = null;
  }
  if (!checkout || typeof checkout !== 'object') return null;
  const phone = checkout.guestPhone || checkout.customerPhone || checkout.phoneNumber || checkout.mobileNumber || checkout.phone || checkout.mobile || null;
  const name = checkout.guestName || checkout.customerName || checkout.fullName || checkout.name || checkout.firstName || null;
  if (!phone) return null;
  return { phone: String(phone).trim(), name: name ? String(name).trim() : null };
}

function buildCompanyWindows(companySettings) {
  return DEFAULT_WINDOWS
    .map((w) => {
      const configured = Number(companySettings?.[w.settingKey]);
      const minHours = Number.isFinite(configured) && configured > 0 ? configured : w.defaultHours;
      return {
        eventType: w.eventType,
        minHours,
        maxHours: minHours + w.spanHours
      };
    })
    .filter((w) => w.minHours > 0);
}

async function processAbandonedCarts() {
  const prisma = getSharedPrismaClient();
  const now = Date.now();
  let sent = 0;

  const enabledCompanies = await prisma.whatsAppNotificationSettings.findMany({
    where: { abandonedCartEnabled: true, isEnabled: true },
    select: {
      companyId: true,
      abandonedCartFirstReminder: true,
      abandonedCartSecondReminder: true,
      abandonedCartThirdReminder: true,
      abandonedCartDiscountEnabled: true,
      abandonedCartDiscountPercent: true
    }
  });

  for (const companySetting of enabledCompanies) {
    const { companyId } = companySetting;
    const windows = buildCompanyWindows(companySetting);
    const notifiedPhonesThisSweep = new Set();

    for (let i = 0; i < windows.length; i++) {
      const window = windows[i];
      const isDiscountWindow =
        Boolean(companySetting.abandonedCartDiscountEnabled) &&
        i === windows.length - 1;
      const effectiveEventType = isDiscountWindow ? 'CART_ABANDONED_WITH_DISCOUNT' : window.eventType;

      const olderThan = new Date(now - window.minHours * 60 * 60 * 1000);
      const newerThan = new Date(now - window.maxHours * 60 * 60 * 1000);

      const carts = await prisma.guestCart.findMany({
        where: { companyId, updatedAt: { gte: newerThan, lte: olderThan } },
        orderBy: { updatedAt: 'desc' },
        take: 200
      });

      for (const cart of carts) {
        try {
          const canonicalCartId = cart.cartId || cart.id;
          const contact = extractGuestContact(cart);
          if (!contact) continue;

          const phoneSuffix = normalizePhoneSuffix(contact.phone);
          if (phoneSuffix && notifiedPhonesThisSweep.has(phoneSuffix)) {
            continue;
          }

          const guard = await isCartConvertedOrDismissed(prisma, {
            companyId,
            cartId: canonicalCartId,
            customerPhone: contact.phone
          });
          if (guard.blocked) continue;

          const alreadySent = await prisma.whatsAppNotificationLog.findFirst({
            where: {
              companyId,
              eventType: { in: [window.eventType, effectiveEventType] },
              OR: [
                { cartId: canonicalCartId },
                ...(cart.id && cart.id !== canonicalCartId ? [{ cartId: cart.id }] : [])
              ]
            },
            select: { id: true }
          });
          if (alreadySent) continue;

          let items = [];
          try {
            items = typeof cart.items === 'string' ? JSON.parse(cart.items) : (cart.items || []);
          } catch (e) {
            items = [];
          }

          const result = await sendAbandonedCartNotification({
            id: cart.id,
            cartId: canonicalCartId,
            companyId: cart.companyId,
            customerId: null,
            customerPhone: contact.phone,
            customerName: contact.name,
            items,
            total: parseFloat(cart.total) || 0,
            currency: 'EGP'
          }, effectiveEventType);

          if (result && result.success) {
            sent += 1;
            if (phoneSuffix) notifiedPhonesThisSweep.add(phoneSuffix);
          }
        } catch (cartError) {
          console.error('[CART-RECOVERY-CRON] Cart processing failed:', cart.cartId || cart.id, cartError.message);
        }
      }
    }
  }

  return { sent };
}

function startAbandonedCartRecoveryScheduler() {
  console.log('[CART-RECOVERY-CRON] Initializing abandoned cart recovery scheduler...');

  cron.schedule('5 * * * *', async () => {
    console.log('[CART-RECOVERY-CRON] Sweeping abandoned guest carts...');
    try {
      const result = await processAbandonedCarts();
      if (result && result.sent > 0) {
        console.log(`[CART-RECOVERY-CRON] Sent ${result.sent} recovery reminder(s)`);
      }
    } catch (error) {
      console.error('[CART-RECOVERY-CRON] Error during sweep:', error.message);
    }
  });

  console.log('[CART-RECOVERY-CRON] Scheduler started (runs hourly at minute 5)');
}

module.exports = { startAbandonedCartRecoveryScheduler, processAbandonedCarts };

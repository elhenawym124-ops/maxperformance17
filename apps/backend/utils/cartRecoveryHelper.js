const { getCompanyBranding } = require('./companyBranding');

const RECENT_ORDER_WINDOW_MS = 48 * 60 * 60 * 1000;
const INACTIVE_ORDER_STATUSES = ['CANCELLED', 'RETURNED', 'REFUNDED', 'TRASH', 'LOST'];

function normalizePhoneSuffix(phone) {
  if (!phone) return '';
  const digits = String(phone)
    .replace(/[\u0660-\u0669]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48))
    .replace(/\D/g, '');
  if (digits.length < 8) return '';
  return digits.slice(-10);
}

async function buildCartRecoveryUrl(companyId, cartId, couponCode = null) {
  if (!cartId) return '';
  try {
    const branding = await getCompanyBranding(companyId);
    const baseUrl = `https://${branding.domain}`;
    const couponPart = couponCode ? `&coupon=${encodeURIComponent(couponCode)}` : '';
    return `${baseUrl}/checkout?recoverCart=${encodeURIComponent(cartId)}${couponPart}`;
  } catch (err) {
    return '';
  }
}

async function isCartConvertedOrDismissed(
  prisma,
  { companyId, cartId, customerPhone = null, requireExistingCart = false }
) {
  if (!prisma || !companyId || !cartId) {
    return { blocked: false, reason: null };
  }

  try {
    if (prisma.cartConversionLog?.findFirst) {
      const converted = await prisma.cartConversionLog.findFirst({
        where: { companyId, cartId },
        select: { id: true },
      });
      if (converted) {
        return { blocked: true, reason: 'converted' };
      }
    }

    if (prisma.cartContactLog?.findFirst) {
      const dismissed = await prisma.cartContactLog.findFirst({
        where: {
          companyId,
          cartId,
          OR: [{ method: 'dismissed' }, { result: 'cancelled' }],
        },
        select: { id: true },
      });
      if (dismissed) {
        return { blocked: true, reason: 'dismissed' };
      }
    }

    if (requireExistingCart && prisma.guestCart?.findFirst) {
      const existing = await prisma.guestCart.findFirst({
        where: { companyId, cartId },
        select: { id: true },
      });
      if (!existing) {
        return { blocked: true, reason: 'cart_deleted' };
      }
    }

    if (prisma.order?.findFirst) {
      const since = new Date(Date.now() - RECENT_ORDER_WINDOW_MS);
      const phoneSuffix = normalizePhoneSuffix(customerPhone);
      const orClauses = [{ metadata: { contains: `"cartId":"${cartId}"` } }];
      if (phoneSuffix) {
        orClauses.push({ customerPhone: { contains: phoneSuffix } });
      }

      const existingOrder = await prisma.order.findFirst({
        where: {
          companyId,
          createdAt: { gte: since },
          status: { notIn: INACTIVE_ORDER_STATUSES },
          OR: orClauses,
        },
        select: { id: true },
      });

      if (existingOrder) {
        return { blocked: true, reason: 'recent_order_exists' };
      }
    }
  } catch (err) {
    console.warn('[CART-RECOVERY-HELPER] Guard check warning:', err.message);
  }

  return { blocked: false, reason: null };
}

module.exports = {
  normalizePhoneSuffix,
  buildCartRecoveryUrl,
  isCartConvertedOrDismissed,
};

/**
 * Online parent-wallet top-ups through Kashier.
 *
 * Money is only credited after server-side verification with Kashier
 * (`getSessionStatus`), never from an unverified webhook payload.
 */

const { getSharedPrismaClient } = require('./sharedDatabase');
const KashierService = require('./kashierService');
const { logEducationEvent } = require('./educationAuditService');
const { getOrCreateDefaultTreasury } = require('./educationFinancialIntegrationService');

const TOPUP_PREFIX = 'EDUTOP-';
const MAX_TOPUP = 50000;
const MIN_TOPUP = 10;
const SUCCESS_STATES = ['SUCCESS', 'CAPTURED', 'PAID', 'APPROVED'];

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getOrCreateCustomerWallet = async (prisma, companyId, customerId) => {
  let wallet = await prisma.customerWallet.findFirst({ where: { customerId, companyId } });
  if (!wallet) {
    wallet = await prisma.customerWallet.create({ data: { customerId, companyId, balance: 0 } });
  }
  return wallet;
};

const extractSessionId = (description = '') => {
  const match = String(description).match(/session:([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
};

const resolveCompanyFromOrder = (orderNumber, metaData = {}) => {
  if (metaData?.companyId) return metaData.companyId;
  if (typeof orderNumber === 'string' && orderNumber.startsWith(TOPUP_PREFIX)) {
    const parts = orderNumber.split('-');
    return parts[1] || null;
  }
  return null;
};

async function createTopupSession({
  companyId,
  customerId,
  parentName,
  parentPhone,
  amount,
  baseUrl,
  webhookUrl,
}) {
  if (!companyId) throw httpError('غير مصرح', 403);
  if (!customerId) throw httpError('ولي الأمر غير محدد', 400);

  const value = money(amount);
  if (!value || value < MIN_TOPUP) throw httpError(`أقل مبلغ للشحن ${MIN_TOPUP} ج.م`, 400);
  if (value > MAX_TOPUP) throw httpError(`أقصى مبلغ للشحن ${MAX_TOPUP} ج.م`, 400);

  const prisma = getSharedPrismaClient();
  const wallet = await getOrCreateCustomerWallet(prisma, companyId, customerId);

  const orderId = `${TOPUP_PREFIX}${companyId}-${Date.now()}`;
  const pending = await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: 'CREDIT',
      amount: value,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance,
      status: 'PENDING_RELEASE',
      description: `شحن محفظة أونلاين (Kashier) — قيد المعالجة`,
      referenceId: orderId,
    },
  });

  const session = await KashierService.createPaymentSession(
    {
      amount: value,
      currency: 'EGP',
      orderId,
      customer: {
        email: `${parentPhone || customerId}@parent.maxp.online`.replace(/\s+/g, ''),
        reference: `edu:${companyId}:${customerId}`,
      },
      redirectUrl: `${baseUrl}/parent/wallet?topupOrder=${encodeURIComponent(orderId)}`,
      webhookUrl,
      description: `شحن محفظة ولي الأمر (${parentName || 'ولي أمر'}): ${value} ج.م`,
    },
    companyId,
    {
      metaData: {
        orderId,
        type: 'EDUCATION_TOPUP',
        companyId,
        customerId,
        rechargeAmount: String(value),
      },
    }
  );

  if (!session.success) {
    await prisma.walletTransaction.deleteMany({ where: { id: pending.id } }).catch(() => {});
    throw httpError(session.error || 'فشل إنشاء جلسة الدفع', 502);
  }

  if (session.sessionId) {
    await prisma.walletTransaction.update({
      where: { id: pending.id },
      data: { description: `شحن محفظة أونلاين (Kashier) — قيد المعالجة | session:${session.sessionId}` },
    }).catch(() => {});
  }

  return {
    orderId,
    sessionUrl: session.sessionUrl,
    sessionId: session.sessionId,
    amount: value,
  };
}

async function releaseVerifiedTopup(prisma, transactionId, { companyId, sessionId }) {
  return prisma.$transaction(async (tx) => {
    const fresh = await tx.walletTransaction.findFirst({
      where: { id: transactionId, status: 'PENDING_RELEASE' },
      include: {
        wallet: {
          select: {
            id: true,
            customerId: true,
            balance: true,
            customer: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
      },
    });

    if (!fresh) {
      const existing = await tx.walletTransaction.findFirst({ where: { id: transactionId } });
      return {
        already: true,
        released: existing?.status === 'RELEASED',
        balance: existing?.balanceAfter,
        amount: money(existing?.amount),
      };
    }

    const amount = money(fresh.amount);
    const updatedWallet = await tx.customerWallet.update({
      where: { id: fresh.walletId },
      data: { balance: { increment: amount }, totalDeposited: { increment: amount } },
    });

    await tx.walletTransaction.update({
      where: { id: fresh.id },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
        balanceAfter: Number(updatedWallet.balance),
        description: `شحن محفظة أونلاين معتمد (Kashier) | session:${sessionId}`,
      },
    });

    const treasury = await getOrCreateDefaultTreasury(tx, companyId);
    const updatedTreasury = await tx.treasuryAccount.update({
      where: { id: treasury.id },
      data: { balance: { increment: amount } },
    });
    await tx.treasuryTransaction.create({
      data: {
        companyId,
        treasuryAccountId: treasury.id,
        amount,
        type: 'DEPOSIT',
        runningBalance: Number(updatedTreasury.balance),
        referenceType: 'EDUCATION_WALLET_TOPUP',
        referenceId: fresh.referenceId || fresh.id,
        description: `شحن محفظة ولي أمر أونلاين (Kashier) بمبلغ ${amount} ج.م`,
        createdById: null,
        date: new Date(),
      },
    });

    return {
      released: true,
      amount,
      balance: Number(updatedWallet.balance),
      walletId: fresh.walletId,
      customer: fresh.wallet?.customer || null,
      customerId: fresh.wallet?.customerId || null,
    };
  });
}

async function verifyTopup({ companyId, orderId, sessionId = null, customerId = null }) {
  if (!companyId) throw httpError('غير مصرح', 403);
  if (!orderId) throw httpError('رقم العملية مطلوب', 400);

  const prisma = getSharedPrismaClient();
  const tx = await prisma.walletTransaction.findFirst({
    where: {
      referenceId: orderId,
      type: 'CREDIT',
      wallet: { companyId, ...(customerId ? { customerId } : {}) },
    },
    include: { wallet: { select: { id: true, customerId: true, balance: true } } },
  });

  if (!tx) throw httpError('عملية الشحن غير موجودة', 404);
  if (tx.status === 'CANCELLED') throw httpError('عملية الشحن ملغاة', 409);
  if (tx.status === 'RELEASED') {
    return { verified: true, already: true, amount: money(tx.amount), balance: Number(tx.wallet?.balance) };
  }

  const effectiveSessionId = sessionId || extractSessionId(tx.description);
  if (!effectiveSessionId) throw httpError('جلسة الدفع غير معروفة', 400);

  const status = await KashierService.getSessionStatus(effectiveSessionId, companyId);
  if (!status.success) throw httpError(status.error || 'تعذر التحقق من الدفع', 502);

  const normalizedStatus = String(status.status || '').toUpperCase();
  const captured = money(status.capturedAmount);
  const isPaid = SUCCESS_STATES.includes(normalizedStatus) || captured > 0;

  if (!isPaid) {
    return { verified: false, paid: false, status: normalizedStatus || 'PENDING' };
  }
  if (captured > 0 && captured + 0.01 < money(tx.amount)) {
    throw httpError(`المبلغ المحصل أقل من المطلوب (${captured} من ${money(tx.amount)})`, 409);
  }

  const { assertDayOpen } = require('./educationDailyClosingService');
  await assertDayOpen(prisma, companyId, new Date());

  const result = await releaseVerifiedTopup(prisma, tx.id, { companyId, sessionId: effectiveSessionId });

  if (result.released) {
    try {
      const notificationService = require('./educationNotificationService');
      notificationService.notifyWalletTopupDecision({
        companyId,
        customerId: result.customerId,
        parentName: `${result.customer?.firstName || ''} ${result.customer?.lastName || ''}`.trim() || 'وليّ الأمر',
        parentPhone: result.customer?.phone || null,
        amount: result.amount,
        approved: true,
        balance: result.balance,
      }).catch(() => {});
    } catch (_) {}

    logEducationEvent({
      companyId,
      action: 'RELEASE_WALLET_TOPUP',
      entityType: 'PAYMENT',
      entityId: tx.id,
      entityName: orderId,
      description: `تم اعتماد شحن محفظة أونلاين بقيمة ${result.amount} ج.م عبر Kashier`,
      details: { amount: result.amount, sessionId: effectiveSessionId, channel: 'KASHIER' },
      severity: 'MEDIUM',
      actorType: 'SYSTEM',
    }).catch(() => {});
  }

  return { verified: true, paid: true, ...result };
}

/**
 * Called from the global Kashier webhook. Always re-verifies with the API,
 * so a forged webhook cannot credit a wallet.
 */
async function handleEducationTopupWebhook({ orderNumber, sessionId = null, metaData = {} }) {
  const isEducationTopup = metaData?.type === 'EDUCATION_TOPUP'
    || (typeof orderNumber === 'string' && orderNumber.startsWith(TOPUP_PREFIX));
  if (!isEducationTopup) return { handled: false };

  const companyId = resolveCompanyFromOrder(orderNumber, metaData);
  if (!companyId || !orderNumber) return { handled: true, credited: false, error: 'missing_company_or_order' };

  try {
    const result = await verifyTopup({ companyId, orderId: orderNumber, sessionId });
    return { handled: true, credited: Boolean(result.paid), result };
  } catch (error) {
    console.warn(`[EDU-KASHIER] webhook verification failed for ${orderNumber}:`, error.message);
    return { handled: true, credited: false, error: error.message };
  }
}

module.exports = {
  TOPUP_PREFIX,
  MIN_TOPUP,
  MAX_TOPUP,
  createTopupSession,
  verifyTopup,
  handleEducationTopupWebhook,
};

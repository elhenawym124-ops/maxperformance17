/**
 * Online installment payment for education enrollments through Kashier.
 * Money is credited only after server-side verification with the gateway.
 */

const { getSharedPrismaClient } = require('./sharedDatabase');
const KashierService = require('./kashierService');
const { recordEducationRevenueInTx } = require('./educationFinancialIntegrationService');
const { logEducationEvent } = require('./educationAuditService');
const educationNotificationService = require('./educationNotificationService');

const PREFIX = 'EDUINST-';
const SUCCESS_STATES = ['SUCCESS', 'CAPTURED', 'PAID', 'APPROVED'];
const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const parseInstallments = (value) => {
  try {
    if (Array.isArray(value)) return value;
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
};

const findInstallment = (installments, number) =>
  installments.find((item) => Number(item.installmentNumber) === Number(number))
  || (Number(number) >= 1 && Number(number) <= installments.length ? installments[Number(number) - 1] : null);

const nextPaymentNumber = async (db, companyId, date = new Date()) => {
  const prefix = `EDU-PAY-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-`;
  const last = await db.educationPayment.findFirst({
    where: { companyId, paymentNumber: { startsWith: prefix } },
    orderBy: { paymentNumber: 'desc' },
    select: { paymentNumber: true },
  });
  let seq = 1;
  if (last?.paymentNumber) {
    const parsed = parseInt(String(last.paymentNumber).split('-').pop(), 10);
    if (!Number.isNaN(parsed)) seq = parsed + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
};

const resolveCompanyFromOrder = (orderNumber, metaData = {}) => {
  if (metaData?.companyId) return metaData.companyId;
  if (typeof orderNumber === 'string' && orderNumber.startsWith(PREFIX)) {
    return orderNumber.split('-')[1] || null;
  }
  return null;
};

async function createInstallmentSession({
  companyId,
  customerId,
  enrollmentId,
  installmentNumber,
  baseUrl,
  webhookUrl,
}) {
  if (!companyId) throw httpError('غير مصرح', 403);
  if (!customerId) throw httpError('ولي الأمر غير محدد', 400);

  const prisma = getSharedPrismaClient();
  const enrollment = await prisma.educationEnrollment.findFirst({
    where: { id: enrollmentId, companyId },
    include: {
      student: { select: { id: true, customerId: true, firstName: true, lastName: true } },
      package: { select: { name: true } },
    },
  });

  if (!enrollment || enrollment.student?.customerId !== customerId) {
    throw httpError('التسجيل غير موجود', 404);
  }
  if (!enrollment.isActive) throw httpError('التسجيل غير نشط', 409);

  const installments = parseInstallments(enrollment.installments);
  const number = Number(installmentNumber);
  const target = findInstallment(installments, number);
  if (!target) throw httpError('القسط غير موجود', 404);
  if (String(target.status || '').toUpperCase() === 'PAID') {
    throw httpError('هذا القسط مسدد بالفعل', 409);
  }

  const amount = money(target.amount);
  if (amount <= 0) throw httpError('قيمة القسط غير صحيحة', 400);

  const orderId = `${PREFIX}${companyId}-${enrollmentId}-${number}-${Date.now()}`;
  const intent = await prisma.educationPaymentIntent.create({
    data: {
      companyId,
      customerId,
      enrollmentId: enrollment.id,
      installmentNumber: number,
      amount,
      purpose: 'INSTALLMENT',
      referenceId: orderId,
      status: 'PENDING',
    },
  });

  const studentName = `${enrollment.student?.firstName || ''} ${enrollment.student?.lastName || ''}`.trim();
  const session = await KashierService.createPaymentSession(
    {
      amount,
      currency: 'EGP',
      orderId,
      customer: {
        email: `${customerId}@parent.maxp.online`,
        reference: `eduinst:${companyId}:${customerId}:${enrollment.id}:${number}`,
      },
      redirectUrl: `${baseUrl}/parent/enrollments?installmentOrder=${encodeURIComponent(orderId)}`,
      webhookUrl,
      description: `قسط ${number} — ${enrollment.package?.name || 'باقة'} — ${studentName}`.trim(),
    },
    companyId,
    {
      metaData: {
        orderId,
        type: 'EDUCATION_INSTALLMENT',
        companyId,
        customerId,
        enrollmentId: enrollment.id,
        installmentNumber: number,
        amount: String(amount),
      },
    }
  );

  if (!session.success) {
    await prisma.educationPaymentIntent.deleteMany({ where: { id: intent.id } }).catch(() => {});
    throw httpError(session.error || 'فشل إنشاء جلسة الدفع', 502);
  }

  if (session.sessionId) {
    await prisma.educationPaymentIntent.update({
      where: { id: intent.id },
      data: { sessionId: session.sessionId },
    }).catch(() => {});
  }

  return {
    orderId,
    sessionUrl: session.sessionUrl,
    sessionId: session.sessionId,
    amount,
    enrollmentId: enrollment.id,
    installmentNumber: number,
  };
}

async function verifyInstallmentPayment({ companyId, orderId, sessionId = null, customerId = null }) {
  if (!companyId) throw httpError('غير مصرح', 403);
  if (!orderId) throw httpError('رقم العملية مطلوب', 400);

  const prisma = getSharedPrismaClient();
  const intent = await prisma.educationPaymentIntent.findFirst({
    where: {
      referenceId: orderId,
      companyId,
      ...(customerId ? { customerId } : {}),
    },
  });

  if (!intent) throw httpError('عملية الدفع غير موجودة', 404);
  if (intent.status === 'CANCELLED') throw httpError('عملية الدفع ملغاة', 409);
  if (intent.status === 'COMPLETED') {
    return { paid: true, already: true, paymentId: intent.paymentId, amount: money(intent.amount) };
  }

  const effectiveSessionId = sessionId || intent.sessionId;
  if (!effectiveSessionId) throw httpError('جلسة الدفع غير معروفة', 400);

  const status = await KashierService.getSessionStatus(effectiveSessionId, companyId);
  if (!status.success) throw httpError(status.error || 'تعذر التحقق من الدفع', 502);

  const normalizedStatus = String(status.status || '').toUpperCase();
  const captured = money(status.capturedAmount);
  const isPaid = SUCCESS_STATES.includes(normalizedStatus) || captured > 0;

  if (!isPaid) return { paid: false, status: normalizedStatus || 'PENDING' };
  if (captured > 0 && captured + 0.01 < money(intent.amount)) {
    throw httpError(`المبلغ المحصل أقل من قيمة القسط (${captured} من ${money(intent.amount)})`, 409);
  }

  const result = await prisma.$transaction(async (tx) => {
    const freshIntent = await tx.educationPaymentIntent.findFirst({
      where: { id: intent.id, status: 'PENDING' },
    });
    if (!freshIntent) {
      return { already: true, intent };
    }

    const enrollment = await tx.educationEnrollment.findFirst({
      where: { id: intent.enrollmentId, companyId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, customer: { select: { phone: true } } } },
        package: { select: { name: true, price: true } },
      },
    });
    if (!enrollment) throw httpError('التسجيل غير موجود', 404);

    const installments = parseInstallments(enrollment.installments);
    const target = findInstallment(installments, intent.installmentNumber);
    if (!target) throw httpError('القسط غير موجود', 404);

    const now = new Date();
    const alreadyPaid = String(target.status || '').toUpperCase() === 'PAID';
    if (!alreadyPaid) {
      target.status = 'PAID';
      target.paidAt = now.toISOString();
    }

    const newAmountPaid = money(
      installments
        .filter((item) => String(item.status || '').toUpperCase() === 'PAID')
        .reduce((sum, item) => sum + money(item.amount), 0)
    );
    const total = money(enrollment.finalAmount || enrollment.package?.price || 0);
    const paymentStatus = total > 0 && newAmountPaid >= total - 0.009
      ? 'COMPLETED'
      : (newAmountPaid > 0 ? 'PARTIALLY_PAID' : 'PENDING');

    const savedEnrollment = await tx.educationEnrollment.update({
      where: { id: enrollment.id },
      data: { installments, amountPaid: newAmountPaid, paymentStatus },
    });

    const studentName = `${enrollment.student?.firstName || ''} ${enrollment.student?.lastName || ''}`.trim();
    const paymentNumber = await nextPaymentNumber(tx, companyId, now);
    const payment = await tx.educationPayment.create({
      data: {
        companyId,
        paymentNumber,
        receiptNumber: paymentNumber.replace('EDU-PAY-', 'RCP-'),
        studentId: savedEnrollment.studentId,
        enrollmentId: savedEnrollment.id,
        branchId: savedEnrollment.branchId || null,
        packageId: savedEnrollment.packageId || null,
        studentName: studentName || null,
        amount: money(intent.amount),
        method: 'CARD',
        status: 'COMPLETED',
        source: 'ONLINE',
        reference: orderId,
        notes: `قسط رقم ${intent.installmentNumber} مدفوع أونلاين (Kashier)`,
        paidAt: now,
        cashierName: 'Kashier',
      },
    });

    await recordEducationRevenueInTx(tx, {
      companyId,
      sourceType: 'EDUCATION_INSTALLMENT_ONLINE',
      sourceId: freshIntent.id,
      studentName,
      title: `تحصيل قسط أونلاين رقم ${intent.installmentNumber} (${enrollment.package?.name || ''})`,
      amount: money(intent.amount),
      createdById: null,
    });

    const updatedIntent = await tx.educationPaymentIntent.update({
      where: { id: freshIntent.id },
      data: {
        status: 'COMPLETED',
        completedAt: now,
        paymentId: payment.id,
        sessionId: effectiveSessionId,
      },
    });

    return {
      payment,
      enrollment: savedEnrollment,
      studentName,
      parentPhone: enrollment.student?.customer?.phone || null,
      intent: updatedIntent,
    };
  });

  if (result.already) {
    return { paid: true, already: true, paymentId: result.intent?.paymentId || null, amount: money(intent.amount) };
  }

  logEducationEvent({
    companyId,
    action: 'RECORD_PAYMENT',
    entityType: 'PAYMENT',
    entityId: result.payment.id,
    entityName: result.payment.paymentNumber,
    description: `تم تحصيل قسط رقم ${intent.installmentNumber} أونلاين بمبلغ ${money(intent.amount)} ج.م`,
    details: {
      channel: 'KASHIER',
      enrollmentId: intent.enrollmentId,
      installmentNumber: intent.installmentNumber,
      orderId,
      receiptNumber: result.payment.receiptNumber,
    },
    severity: 'MEDIUM',
    actorType: 'PARENT',
  }).catch(() => {});

  if (result.parentPhone) {
    educationNotificationService.notifyPaymentReceipt({
      companyId,
      customerId: intent.customerId,
      parentName: 'وليّ الأمر',
      parentPhone: result.parentPhone,
      studentName: result.studentName,
      amount: money(intent.amount),
      receiptNumber: result.payment.receiptNumber,
      paidAt: result.payment.paidAt,
      packageName: null,
    }).catch(() => {});
  }

  return {
    paid: true,
    already: false,
    paymentId: result.payment.id,
    amount: money(intent.amount),
    enrollmentId: intent.enrollmentId,
    installmentNumber: intent.installmentNumber,
    paymentStatus: result.enrollment.paymentStatus,
  };
}

async function handleWebhook({ orderNumber, sessionId = null, metaData = {} }) {
  const isInstallment = metaData?.type === 'EDUCATION_INSTALLMENT'
    || (typeof orderNumber === 'string' && orderNumber.startsWith(PREFIX));
  if (!isInstallment) return { handled: false };

  const companyId = resolveCompanyFromOrder(orderNumber, metaData);
  if (!companyId || !orderNumber) return { handled: true, credited: false, error: 'missing_company_or_order' };

  try {
    const result = await verifyInstallmentPayment({ companyId, orderId: orderNumber, sessionId });
    return { handled: true, credited: Boolean(result.paid), result };
  } catch (error) {
    console.warn(`[EDU-INSTALLMENT] webhook verification failed for ${orderNumber}:`, error.message);
    return { handled: true, credited: false, error: error.message };
  }
}

module.exports = {
  PREFIX,
  createInstallmentSession,
  verifyInstallmentPayment,
  handleWebhook,
  parseInstallments,
};

const { getSharedPrismaClient } = require('../services/sharedDatabase');

/**
 * Parent-scoped payment history + receipts.
 * A parent can only see payments that belong to their own children (customerId scope).
 */

const resolveParentStudentIds = async (prisma, companyId, parentId) => {
  const students = await prisma.educationStudent.findMany({
    where: { companyId, customerId: parentId },
    select: { id: true },
  });
  return students.map((student) => student.id);
};

const listPayments = async (req, res) => {
  try {
    const parentId = req.parent?.id;
    const companyId = req.parent?.companyId;
    if (!parentId || !companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const studentIds = await resolveParentStudentIds(prisma, companyId, parentId);
    if (studentIds.length === 0) return res.json({ success: true, data: [] });

    const payments = await prisma.educationPayment.findMany({
      where: { companyId, studentId: { in: studentIds } },
      orderBy: { paidAt: 'desc' },
      take: 200,
    });

    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('[ParentPortal] Payments error:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب المدفوعات' });
  }
};

const resolveBaseUrl = (req) => {
  const origin = String(req.headers?.origin || '').trim();
  if (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
    return origin;
  }
  return `https://${process.env.MAIN_DOMAIN || 'maxp.online'}`;
};

const createTopupSession = async (req, res) => {
  try {
    const parentId = req.parent?.id;
    const companyId = req.parent?.companyId;
    if (!parentId || !companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const amount = Number(req.body?.amount);
    const prisma = getSharedPrismaClient();
    const customer = await prisma.customer.findFirst({
      where: { id: parentId, companyId },
      select: { firstName: true, lastName: true, phone: true },
    });
    if (!customer) return res.status(404).json({ success: false, error: 'ولي الأمر غير موجود' });

    const service = require('../services/educationKashierService');
    const result = await service.createTopupSession({
      companyId,
      customerId: parentId,
      parentName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
      parentPhone: customer.phone,
      amount,
      baseUrl: resolveBaseUrl(req),
      webhookUrl: `https://${process.env.MAIN_DOMAIN || 'maxp.online'}/api/v1/payment/kashier/webhook`,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status >= 500) console.error('[ParentPortal] Kashier session error:', error);
    res.status(status).json({ success: false, error: error.message || 'تعذر إنشاء جلسة الدفع' });
  }
};

const verifyTopup = async (req, res) => {
  try {
    const parentId = req.parent?.id;
    const companyId = req.parent?.companyId;
    if (!parentId || !companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const orderId = req.body?.orderId || req.query?.orderId;
    const sessionId = req.body?.sessionId || null;
    if (!orderId) return res.status(400).json({ success: false, error: 'رقم العملية مطلوب' });

    const service = require('../services/educationKashierService');
    const result = await service.verifyTopup({ companyId, orderId, sessionId, customerId: parentId });
    res.json({ success: true, data: result });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status >= 500) console.error('[ParentPortal] Kashier verify error:', error);
    res.status(status).json({ success: false, error: error.message || 'تعذر التحقق من الدفع' });
  }
};

const getReceipt = async (req, res) => {
  try {
    const parentId = req.parent?.id;
    const companyId = req.parent?.companyId;
    if (!parentId || !companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const studentIds = await resolveParentStudentIds(prisma, companyId, parentId);
    if (studentIds.length === 0) return res.status(404).json({ success: false, error: 'الإيصال غير موجود' });

    const payment = await prisma.educationPayment.findFirst({
      where: { id: req.params.id, companyId, studentId: { in: studentIds } },
    });
    if (!payment) return res.status(404).json({ success: false, error: 'الإيصال غير موجود' });

    const [company, student, enrollment] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId }, select: { name: true, phone: true, email: true, address: true } }),
      prisma.educationStudent.findFirst({
        where: { id: payment.studentId, companyId },
        select: { id: true, code: true, firstName: true, lastName: true, phone: true },
      }),
      payment.enrollmentId
        ? prisma.educationEnrollment.findFirst({
            where: { id: payment.enrollmentId, companyId },
            include: { package: { select: { name: true, hoursCount: true } } },
          })
        : null,
    ]);

    res.json({
      success: true,
      data: {
        payment,
        company: company || null,
        student: student || null,
        package: enrollment?.package
          ? { name: enrollment.package.name, hoursCount: enrollment.package.hoursCount }
          : null,
      },
    });
  } catch (error) {
    console.error('[ParentPortal] Payment receipt error:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب الإيصال' });
  }
};

const downloadReceiptPdf = async (req, res) => {
  try {
    const parentId = req.parent?.id;
    const companyId = req.parent?.companyId;
    if (!parentId || !companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const studentIds = await resolveParentStudentIds(prisma, companyId, parentId);
    if (studentIds.length === 0) return res.status(404).json({ success: false, error: 'الإيصال غير موجود' });

    const service = require('../services/educationReceiptPdfService');
    const result = await service.getOrCreateReceiptPdf(prisma, {
      companyId,
      paymentId: req.params.id,
      studentIds,
    });
    if (!result) return res.status(404).json({ success: false, error: 'الإيصال غير موجود' });

    const fileName = `${result.payment.paymentNumber || result.payment.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.send(result.buffer);
  } catch (error) {
    console.error('[ParentPortal] Receipt PDF error:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في إنشاء ملف الإيصال' });
  }
};

module.exports = { listPayments, getReceipt, createTopupSession, verifyTopup, downloadReceiptPdf };

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

module.exports = { listPayments, getReceipt };

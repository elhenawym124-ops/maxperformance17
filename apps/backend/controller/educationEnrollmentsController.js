const { getSharedPrismaClient } = require('../services/sharedDatabase');
const { logEducationEvent } = require('../services/educationAuditService');
const { getSingularTeacherLabel } = require('../services/educationLabelService');
const educationNotificationService = require('../services/educationNotificationService');

const ALLOWED_PAYMENT_STATUSES = ['PENDING', 'COMPLETED', 'PARTIALLY_PAID', 'FAILED', 'REFUNDED'];

const normalizePaymentStatus = (status, fallback = 'PENDING') => {
  if (!status) return fallback;
  const upper = String(status).toUpperCase();
  if (upper === 'PAID') return 'COMPLETED';
  if (ALLOWED_PAYMENT_STATUSES.includes(upper)) return upper;
  return fallback;
};

const getAll = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { studentId, teacherId, subjectId } = req.query;
    const where = { companyId };
    if (studentId) where.studentId = studentId;
    if (teacherId) where.teacherId = teacherId;
    if (subjectId) where.package = { subjectId };

    const data = await getSharedPrismaClient().educationEnrollment.findMany({
      where,
      include: {
        student: { select: { id: true, code: true, firstName: true, lastName: true } },
        package: { include: { subject: { select: { id: true, name: true } } } },
        teacher: { select: { id: true, name: true } }
      },
      orderBy: { enrollmentDate: 'desc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب التسجيلات' });
  }
};

const getById = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const data = await getSharedPrismaClient().educationEnrollment.findFirst({
      where: { id, companyId },
      include: {
        student: { select: { id: true, code: true, firstName: true, lastName: true, phone: true } },
        package: { include: { subject: { select: { id: true, name: true } } } },
        teacher: { select: { id: true, name: true, phone: true } },
        sessions: { orderBy: { scheduledAt: 'desc' } }
      }
    });
    if (!data) return res.status(404).json({ success: false, error: 'التسجيل غير موجود' });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب التسجيل' });
  }
};

const create = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const {
      studentId,
      packageId,
      teacherId,
      amountPaid,
      paymentStatus,
      expiresAt,
      paymentMethod,
      installmentCount,
      installments,
      discountType,
      discountAmount,
      finalAmount,
      branchId
    } = req.body;
    if (!studentId) return res.status(400).json({ success: false, error: 'الطالب مطلوب' });
    if (!packageId) return res.status(400).json({ success: false, error: 'الباقة مطلوبة' });

    // Multi-tenant validation: ensure student belongs to company
    const student = await getSharedPrismaClient().educationStudent.findFirst({
      where: { id: studentId, companyId }
    });
    if (!student) return res.status(400).json({ success: false, error: 'الطالب غير موجود' });

    // Multi-tenant validation: ensure package belongs to company
    const pkg = await getSharedPrismaClient().educationPackage.findFirst({
      where: { id: packageId, companyId },
      include: { subject: true }
    });
    if (!pkg) return res.status(400).json({ success: false, error: 'الباقة غير موجودة' });

    // Multi-tenant validation: ensure teacher belongs to company if assigned
    const safeTeacherId = teacherId || null;
    let teacher = null;
    if (safeTeacherId) {
      teacher = await getSharedPrismaClient().educationTeacher.findFirst({
        where: { id: safeTeacherId, companyId }
      });
      if (!teacher) return res.status(400).json({ success: false, error: 'المدرس المعين غير موجود' });
    }

    const parsedExpiresAt = (expiresAt && !isNaN(new Date(expiresAt).getTime()))
      ? new Date(expiresAt)
      : null;

    let safeInstallments = [];
    if (Array.isArray(installments)) {
      safeInstallments = installments;
    } else if (typeof installments === 'string' && installments.trim()) {
      try { safeInstallments = JSON.parse(installments); } catch (_) { safeInstallments = []; }
    }

    const safeFinalAmount = finalAmount !== undefined
      ? parseFloat(finalAmount)
      : (parseFloat(amountPaid) || pkg.price);

    const safePaymentStatus = paymentStatus
      ? normalizePaymentStatus(paymentStatus, 'PENDING')
      : (Number(amountPaid) >= safeFinalAmount ? 'COMPLETED' : (Number(amountPaid) > 0 ? 'PARTIALLY_PAID' : 'PENDING'));

    const data = await getSharedPrismaClient().educationEnrollment.create({
      data: {
        companyId,
        studentId,
        packageId,
        teacherId: safeTeacherId,
        totalHours: Number(pkg.hoursCount) || 0,
        remainingHours: Number(pkg.hoursCount) || 0,
        amountPaid: Number(amountPaid) || 0,
        paymentStatus: safePaymentStatus,
        expiresAt: parsedExpiresAt,
        paymentMethod: paymentMethod || 'CASH',
        installmentCount: installmentCount ? parseInt(installmentCount, 10) : 1,
        installments: safeInstallments,
        discountType: discountType || 'NONE',
        discountAmount: discountAmount ? parseFloat(discountAmount) : 0,
        finalAmount: safeFinalAmount,
        branchId: branchId || null
      },
      include: {
        student: { select: { id: true, code: true, firstName: true, lastName: true } },
        package: { include: { subject: { select: { id: true, name: true } } } },
        teacher: { select: { id: true, name: true } }
      }
    });

    const studentName = `${student.firstName} ${student.lastName || ''}`.trim();
    const teacherLabel = teacher ? await getSingularTeacherLabel(companyId, 'ar') : '';

    // 🏦 Automatic Financial Inflow to Treasury
    const paidAmount = Number(amountPaid) || 0;
    if (paidAmount > 0 && (safePaymentStatus === 'COMPLETED' || safePaymentStatus === 'PAID' || safePaymentStatus === 'PARTIALLY_PAID')) {
      try {
        const educationFinancialService = require('../services/educationFinancialIntegrationService');
        educationFinancialService.recordEducationRevenue({
          companyId,
          sourceType: 'EDUCATION_PACKAGE_REVENUE',
          sourceId: data.id,
          studentName,
          title: `تحصيل باقة تعليمية (${pkg.name})`,
          amount: paidAmount,
          createdById: req.user?.id
        }).catch(e => console.warn('[EnrollmentRevenuePosting] warning:', e.message));
      } catch (fe) {
        console.warn('[EnrollmentRevenuePosting] notice:', fe.message);
      }
    }
    logEducationEvent({
      companyId,
      action: 'CREATE_ENROLLMENT',
      entityType: 'ENROLLMENT',
      entityId: data.id,
      entityName: `${studentName} - ${pkg.name}`,
      description: `تم تسجيل الطالب ${studentName} في باقة ${pkg.name} (${pkg.hoursCount} ساعة - المدفوع: ${amountPaid || 0} ج.م${teacher ? ` - ${teacherLabel}: ${teacher.name}` : ''})`,
      details: {
        studentId,
        packageId,
        teacherId: safeTeacherId,
        hours: pkg.hoursCount,
        amountPaid,
        paymentStatus: safePaymentStatus,
      },
      req,
    }).catch(e => console.error('[EnrollmentAudit]', e.message));

    educationNotificationService.notifyEnrollmentCreated(companyId, data).catch(e =>
      console.error('[EnrollmentNotify]', e.message)
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في إنشاء التسجيل' });
  }
};

const update = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const { teacherId, amountPaid, paymentStatus, remainingHours, expiresAt, isActive } = req.body;

    const existing = await getSharedPrismaClient().educationEnrollment.findFirst({
      where: { id, companyId },
      include: {
        student: { select: { firstName: true, lastName: true } },
        package: { select: { name: true } },
        teacher: { select: { name: true } }
      }
    });
    if (!existing) return res.status(404).json({ success: false, error: 'التسجيل غير موجود' });

    // Validate teacher tenant isolation if teacherId is being updated
    let safeTeacherId = undefined;
    if (teacherId !== undefined) {
      safeTeacherId = teacherId || null;
      if (safeTeacherId) {
        const teacher = await getSharedPrismaClient().educationTeacher.findFirst({
          where: { id: safeTeacherId, companyId }
        });
        if (!teacher) return res.status(400).json({ success: false, error: 'المدرس المعين غير موجود' });
      }
    }

    const parsedExpiresAt = expiresAt !== undefined
      ? ((expiresAt && !isNaN(new Date(expiresAt).getTime())) ? new Date(expiresAt) : null)
      : undefined;

    const safePaymentStatus = paymentStatus !== undefined
      ? normalizePaymentStatus(paymentStatus, existing.paymentStatus)
      : undefined;

    const data = await getSharedPrismaClient().educationEnrollment.update({
      where: { id },
      data: {
        teacherId: safeTeacherId,
        amountPaid: amountPaid !== undefined ? Number(amountPaid) || 0 : undefined,
        paymentStatus: safePaymentStatus,
        remainingHours: remainingHours !== undefined ? Number(remainingHours) || 0 : undefined,
        expiresAt: parsedExpiresAt,
        isActive: isActive !== undefined ? !!isActive : undefined,
      },
      include: {
        student: { select: { id: true, code: true, firstName: true, lastName: true } },
        package: { include: { subject: { select: { id: true, name: true } } } },
        teacher: { select: { id: true, name: true } }
      }
    });

    const studentName = `${data.student?.firstName || ''} ${data.student?.lastName || ''}`.trim();
    logEducationEvent({
      companyId,
      action: 'UPDATE_ENROLLMENT',
      entityType: 'ENROLLMENT',
      entityId: data.id,
      entityName: `${studentName} - ${data.package?.name || ''}`,
      description: `تم تحديث اشتراك الطالب ${studentName} (الساعات المتبقية: ${data.remainingHours})`,
      details: {
        before: { remainingHours: existing.remainingHours, amountPaid: existing.amountPaid, teacher: existing.teacher?.name },
        after: { remainingHours: data.remainingHours, amountPaid: data.amountPaid, teacher: data.teacher?.name }
      },
      req,
    }).catch(e => console.error('[EnrollmentAudit]', e.message));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في تحديث التسجيل' });
  }
};

const remove = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const existing = await getSharedPrismaClient().educationEnrollment.findFirst({
      where: { id, companyId },
      include: {
        student: { select: { firstName: true, lastName: true } },
        package: { select: { name: true } }
      }
    });
    if (!existing) return res.status(404).json({ success: false, error: 'التسجيل غير موجود' });

    await getSharedPrismaClient().educationEnrollment.delete({ where: { id } });

    const studentName = `${existing.student?.firstName || ''} ${existing.student?.lastName || ''}`.trim();
    logEducationEvent({
      companyId,
      action: 'DELETE_ENROLLMENT',
      entityType: 'ENROLLMENT',
      entityId: id,
      entityName: `${studentName} - ${existing.package?.name || ''}`,
      description: `تم حذف اشتراك الطالب ${studentName} في باقة ${existing.package?.name || ''}`,
      details: { deletedEnrollment: existing },
      severity: 'HIGH',
      req,
    }).catch(e => console.error('[EnrollmentAudit]', e.message));

    res.json({ success: true, message: 'تم حذف التسجيل' });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في حذف التسجيل' });
  }
};

const payInstallment = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id, installmentNumber } = req.params;
    const num = parseInt(installmentNumber, 10);
    const prisma = getSharedPrismaClient();

    const enrollment = await prisma.educationEnrollment.findFirst({
      where: { id, companyId },
      include: { package: true, student: true }
    });
    if (!enrollment) return res.status(404).json({ success: false, error: 'التسجيل غير موجود' });

    let currentInstallments = [];
    try {
      currentInstallments = Array.isArray(enrollment.installments)
        ? enrollment.installments
        : JSON.parse(enrollment.installments || '[]');
    } catch (_) { currentInstallments = []; }

    let target = currentInstallments.find(i => Number(i.installmentNumber) === num);
    // توافق: بعض الخطط القديمة لا تحمل installmentNumber — نطابق بالترتيب
    if (!target && num >= 1 && num <= currentInstallments.length) {
      target = currentInstallments[num - 1];
      target.installmentNumber = num;
    }
    if (!target) {
      return res.status(404).json({ success: false, error: 'القسط غير موجود' });
    }

    target.status = 'PAID';
    target.paidAt = new Date().toISOString();

    const newAmountPaid = currentInstallments
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

    const targetTotal = enrollment.finalAmount || enrollment.package?.price || 0;
    const isFullyPaid = newAmountPaid >= targetTotal;
    const newStatus = isFullyPaid ? 'COMPLETED' : 'PARTIALLY_PAID';

    const updated = await prisma.educationEnrollment.update({
      where: { id },
      data: {
        installments: currentInstallments,
        amountPaid: newAmountPaid,
        paymentStatus: newStatus
      },
      include: {
        student: { select: { id: true, code: true, firstName: true, lastName: true } },
        package: { include: { subject: { select: { id: true, name: true } } } },
        teacher: { select: { id: true, name: true } }
      }
    });

    // 🏦 Automatic Financial Inflow to Treasury for Installment Payment
    const instAmount = Number(target.amount) || 0;
    if (instAmount > 0) {
      try {
        const educationFinancialService = require('../services/educationFinancialIntegrationService');
        const studentName = `${updated.student?.firstName || ''} ${updated.student?.lastName || ''}`.trim();
        educationFinancialService.recordEducationRevenue({
          companyId,
          sourceType: 'EDUCATION_INSTALLMENT',
          sourceId: `${enrollment.id}_inst_${num}`,
          studentName,
          title: `تحصيل قسط تعليمي رقم ${num} (${updated.package?.name || ''})`,
          amount: instAmount,
          createdById: req.user?.id
        }).catch(e => console.warn('[InstallmentRevenuePosting] warning:', e.message));
      } catch (fe) {
        console.warn('[InstallmentRevenuePosting] notice:', fe.message);
      }
    }

    res.json({
      success: true,
      message: `تم سداد القسط رقم ${num} بمبلغ ${target.amount} ج.م بنجاح`,
      data: updated
    });
  } catch (error) {
    console.error('Error paying installment:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء تحصيل القسط' });
  }
};

module.exports = { getAll, getById, create, update, remove, payInstallment };

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

    // Ledger integrity: the payment status must always match the recorded amount.
    const paidNow = Number(amountPaid) || 0;
    const statusAlignedToAmount = ['REFUNDED', 'FAILED'].includes(safePaymentStatus)
      ? safePaymentStatus
      : (paidNow >= safeFinalAmount && safeFinalAmount > 0
        ? 'COMPLETED'
        : (paidNow > 0 ? 'PARTIALLY_PAID' : 'PENDING'));

    const prisma = getSharedPrismaClient();
    const runInTx = typeof prisma.$transaction === 'function'
      ? (fn) => prisma.$transaction(fn)
      : (fn) => fn(prisma);

    const studentName = `${student.firstName} ${student.lastName || ''}`.trim();
    const teacherLabel = teacher ? await getSingularTeacherLabel(companyId, 'ar') : '';
    const paidAmount = Number(amountPaid) || 0;

    // The enrollment row and its treasury inflow commit together or not at all.
    const data = await runInTx(async (tx) => {
      const created = await tx.educationEnrollment.create({
        data: {
          companyId,
          studentId,
          packageId,
          teacherId: safeTeacherId,
          totalHours: Number(pkg.hoursCount) || 0,
          remainingHours: Number(pkg.hoursCount) || 0,
          amountPaid: Number(amountPaid) || 0,
          paymentStatus: statusAlignedToAmount,
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

      if (paidAmount > 0 && statusAlignedToAmount !== 'REFUNDED' && statusAlignedToAmount !== 'FAILED') {
        const educationFinancialService = require('../services/educationFinancialIntegrationService');
        await educationFinancialService.recordEducationRevenueInTx(tx, {
          companyId,
          sourceType: 'EDUCATION_PACKAGE_REVENUE',
          sourceId: created.id,
          studentName,
          title: `تحصيل باقة تعليمية (${pkg.name})`,
          amount: paidAmount,
          createdById: req.user?.id
        });
      }

      return created;
    });
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
        paymentStatus: statusAlignedToAmount,
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

    // Ledger integrity: money only moves through the payment ledger, never through a plain edit.
    if (amountPaid !== undefined) {
      const requested = Number(amountPaid) || 0;
      const current = Number(existing.amountPaid) || 0;
      if (Math.abs(requested - current) > 0.009) {
        return res.status(400).json({
          success: false,
          error: 'لا يمكن تغيير المبلغ المدفوع من شاشة التعديل. استخدم صفحة المدفوعات لتسجيل دفعة أو إلغائها',
        });
      }
    }

    let safePaymentStatus;
    if (paymentStatus !== undefined) {
      safePaymentStatus = normalizePaymentStatus(paymentStatus, existing.paymentStatus);
      if (!['REFUNDED', 'FAILED'].includes(safePaymentStatus)) {
        const total = Number(existing.finalAmount ?? existing.package?.price ?? 0) || 0;
        const paid = Number(existing.amountPaid) || 0;
        const aligned = total > 0 && paid >= total - 0.009
          ? 'COMPLETED'
          : (paid > 0 ? 'PARTIALLY_PAID' : 'PENDING');
        if (safePaymentStatus !== aligned) {
          return res.status(400).json({
            success: false,
            error: 'حالة السداد لا تطابق المبلغ المدفوع. سجّل الدفعة من صفحة المدفوعات لتحديث الحالة تلقائياً',
          });
        }
      }
    }

    const data = await getSharedPrismaClient().educationEnrollment.update({
      where: { id },
      data: {
        teacherId: safeTeacherId,
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
    const runInTx = typeof prisma.$transaction === 'function'
      ? (fn) => prisma.$transaction(fn)
      : (fn) => fn(prisma);

    const buildPaymentNumber = async (db, date = new Date()) => {
      const prefix = `EDU-PAY-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-`;
      const lastPayment = await db.educationPayment.findFirst({
        where: { companyId, paymentNumber: { startsWith: prefix } },
        orderBy: { paymentNumber: 'desc' },
        select: { paymentNumber: true },
      });
      let seq = 1;
      if (lastPayment?.paymentNumber) {
        const parsed = parseInt(String(lastPayment.paymentNumber).split('-').pop(), 10);
        if (!Number.isNaN(parsed)) seq = parsed + 1;
      }
      return `${prefix}${String(seq).padStart(4, '0')}`;
    };

    // The installment, its ledger row and its treasury deposit commit together.
    const { updated, paidAmount: instAmount } = await runInTx(async (tx) => {
      const enrollment = await tx.educationEnrollment.findFirst({
        where: { id, companyId },
        include: { package: true, student: true }
      });
      if (!enrollment) {
        const err = new Error('التسجيل غير موجود');
        err.statusCode = 404;
        throw err;
      }

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
        const err = new Error('القسط غير موجود');
        err.statusCode = 404;
        throw err;
      }
      if (String(target.status || '').toUpperCase() === 'PAID') {
        const err = new Error('هذا القسط مسدد بالفعل');
        err.statusCode = 409;
        throw err;
      }

      target.status = 'PAID';
      target.paidAt = new Date().toISOString();

      const newAmountPaid = currentInstallments
        .filter(i => i.status === 'PAID')
        .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

      const targetTotal = enrollment.finalAmount || enrollment.package?.price || 0;
      const isFullyPaid = newAmountPaid >= targetTotal;
      const newStatus = isFullyPaid ? 'COMPLETED' : 'PARTIALLY_PAID';

      const saved = await tx.educationEnrollment.update({
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

      const amount = Number(target.amount) || 0;
      if (amount > 0) {
        const now = new Date();
        const paymentNumber = await buildPaymentNumber(tx, now);
        const studentName = `${saved.student?.firstName || ''} ${saved.student?.lastName || ''}`.trim();

        await tx.educationPayment.create({
          data: {
            companyId,
            paymentNumber,
            receiptNumber: paymentNumber.replace('EDU-PAY-', 'RCP-'),
            studentId: saved.studentId,
            enrollmentId: saved.id,
            studentName: studentName || null,
            amount,
            method: 'CASH',
            status: 'COMPLETED',
            source: 'INSTALLMENT',
            notes: `قسط رقم ${num} من ${enrollment.installmentCount || currentInstallments.length}`,
            paidAt: now,
            cashierId: req.user?.id || null,
            cashierName: req.user?.name || [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ') || null,
          },
        });

        const educationFinancialService = require('../services/educationFinancialIntegrationService');
        await educationFinancialService.recordEducationRevenueInTx(tx, {
          companyId,
          sourceType: 'EDUCATION_INSTALLMENT',
          sourceId: `${enrollment.id}_inst_${num}`,
          studentName,
          title: `تحصيل قسط تعليمي رقم ${num} (${saved.package?.name || ''})`,
          amount,
          createdById: req.user?.id
        });
      }

      return { updated: saved, paidAmount: amount };
    });

    res.json({
      success: true,
      message: `تم سداد القسط رقم ${num} بمبلغ ${instAmount} ج.م بنجاح`,
      data: updated
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error('Error paying installment:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء تحصيل القسط' });
  }
};

/**
 * W8: إلغاء اشتراك مع استرداد اختياري
 * POST /api/education/enrollments/:id/cancel
 */
const cancelEnrollment = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const { reason, refundAmount } = req.body || {};
    const prisma = getSharedPrismaClient();

    const enrollment = await prisma.educationEnrollment.findFirst({
      where: { id, companyId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        package: { select: { id: true, name: true, price: true } },
      },
    });
    if (!enrollment) return res.status(404).json({ success: false, error: 'التسجيل غير موجود' });
    if (!enrollment.isActive) return res.status(409).json({ success: false, error: 'الاشتراك ملغى بالفعل' });

    const refund = Math.max(0, Number(refundAmount) || 0);
    const paid = Number(enrollment.amountPaid) || 0;
    if (refund > paid) {
      return res.status(400).json({ success: false, error: `مبلغ الاسترداد أكبر من المدفوع (${paid})` });
    }

    const now = new Date();

    const cancelledSessions = await prisma.educationSession.updateMany({
      where: { companyId, enrollmentId: id, status: { not: 'CANCELLED' }, scheduledAt: { gte: now } },
      data: { status: 'CANCELLED' },
    });

    const updated = await prisma.educationEnrollment.update({
      where: { id },
      data: {
        isActive: false,
        remainingHours: 0,
        ...(refund > 0 ? { paymentStatus: 'REFUNDED' } : {}),
      },
      include: { student: true, package: true, teacher: true },
    });

    if (refund > 0) {
      try {
        const educationFinancialService = require('../services/educationFinancialIntegrationService');
        const studentName = `${enrollment.student?.firstName || ''} ${enrollment.student?.lastName || ''}`.trim();
        educationFinancialService.recordEducationRefund({
          companyId,
          sourceType: 'EDUCATION_ENROLLMENT_REFUND',
          sourceId: id,
          studentName,
          title: `استرداد اشتراك (${enrollment.package?.name || ''})${reason ? ' — ' + reason : ''}`,
          amount: refund,
          createdById: req.user?.id,
        }).catch(e => console.warn('[EnrollmentRefund] warning:', e.message));
      } catch (fe) {
        console.warn('[EnrollmentRefund] notice:', fe.message);
      }

      // Money that was collected from the parent wallet goes back to that wallet.
      try {
        const walletPayment = await prisma.educationPayment.findFirst({
          where: { companyId, enrollmentId: id, source: 'PARENT_WALLET', status: 'COMPLETED' },
        });
        if (walletPayment) {
          const student = await prisma.educationStudent.findFirst({
            where: { id: enrollment.studentId, companyId },
            select: { customerId: true },
          });
          if (student?.customerId) {
            const wallet = await prisma.customerWallet.findFirst({
              where: { customerId: student.customerId, companyId },
            });
            if (wallet) {
              const updatedWallet = await prisma.customerWallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: refund } },
              });
              await prisma.walletTransaction.create({
                data: {
                  walletId: wallet.id,
                  type: 'CREDIT',
                  amount: refund,
                  balanceBefore: wallet.balance,
                  balanceAfter: updatedWallet.balance,
                  status: 'RELEASED',
                  releasedAt: new Date(),
                  description: `استرداد اشتراك ملغي (${enrollment.package?.name || ''})${reason ? ' — ' + reason : ''}`,
                },
              });
            }
          }
        }
      } catch (walletError) {
        console.warn('[EnrollmentRefundWallet] warning:', walletError.message);
      }
    }

    return res.json({
      success: true,
      message: refund > 0 ? 'تم إلغاء الاشتراك وتسجيل الاسترداد' : 'تم إلغاء الاشتراك',
      data: {
        enrollment: updated,
        refundAmount: refund,
        cancelledSessions: cancelledSessions.count,
      },
    });
  } catch (error) {
    console.error('Error cancelling enrollment:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء إلغاء الاشتراك' });
  }
};

module.exports = { getAll, getById, create, update, remove, payInstallment, cancelEnrollment };

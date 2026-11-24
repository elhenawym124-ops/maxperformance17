/**
 * Education Payments Ledger
 * ---------------------------------------------------------------
 * Single ledger for student / group collections:
 *   - list + KPIs + dues
 *   - record payment (enrollment or group member)  -> treasury DEPOSIT
 *   - reverse payment                               -> treasury EXPENSE
 *   - parent wallet top-up requests: list / release / reject
 *
 * Every amount movement is written inside one DB transaction together with
 * its treasury_transactions row, so the ledger and the treasury never drift.
 */
const { getSharedPrismaClient } = require('../services/sharedDatabase');
const { logEducationEvent } = require('../services/educationAuditService');
const { assertDayOpen } = require('../services/educationDailyClosingService');

const PAYMENT_METHODS = ['CASH', 'TRANSFER', 'WALLET', 'CARD', 'INSTAPAY', 'OTHER'];
const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

const getCompanyId = (req) => req.user?.effectiveCompanyId || req.user?.companyId || null;

const resolveTreasury = async (tx, companyId) => {
  let account = await tx.treasuryAccount.findFirst({
    where: { companyId, isDefault: true, isActive: true },
  });
  if (!account) {
    account = await tx.treasuryAccount.findFirst({
      where: { companyId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }
  if (!account) {
    account = await tx.treasuryAccount.create({
      data: {
        companyId,
        name: 'الخزينة النقدية الرئيسية (الكاش)',
        type: 'CASH',
        isDefault: true,
        isActive: true,
        balance: 0,
        currency: 'EGP',
        description: 'الخزينة الافتراضية للسنتر والأنشطة التعليمية',
      },
    });
  }
  return account;
};

const postDeposit = async (tx, { companyId, treasury, amount, referenceType, referenceId, description, createdById }) => {
  const updated = await tx.treasuryAccount.update({
    where: { id: treasury.id },
    data: { balance: { increment: amount } },
  });
  return tx.treasuryTransaction.create({
    data: {
      companyId,
      treasuryAccountId: treasury.id,
      amount,
      type: 'DEPOSIT',
      runningBalance: Number(updated.balance),
      referenceType,
      referenceId: String(referenceId),
      description,
      createdById: createdById || null,
      date: new Date(),
    },
  });
};

const postExpense = async (tx, { companyId, treasury, amount, referenceType, referenceId, description, createdById }) => {
  const updated = await tx.treasuryAccount.update({
    where: { id: treasury.id },
    data: { balance: { decrement: amount } },
  });
  return tx.treasuryTransaction.create({
    data: {
      companyId,
      treasuryAccountId: treasury.id,
      amount,
      type: 'EXPENSE',
      runningBalance: Number(updated.balance),
      referenceType,
      referenceId: String(referenceId),
      description,
      createdById: createdById || null,
      date: new Date(),
    },
  });
};

const nextSequenceNumber = async (tx, model, companyId, prefix, field) => {
  const last = await model.findFirst({
    where: { companyId, [field]: { startsWith: prefix } },
    orderBy: { [field]: 'desc' },
    select: { [field]: true },
  });
  let seq = 1;
  if (last && last[field]) {
    const parts = String(last[field]).split('-');
    const parsed = parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(parsed)) seq = parsed + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
};

const enrollmentStatusAfterPayment = (finalAmount, amountPaid) => {
  const total = money(finalAmount);
  const paid = money(amountPaid);
  if (total > 0 && paid >= total - 0.009) return 'COMPLETED';
  if (paid > 0) return 'PARTIALLY_PAID';
  return 'PENDING';
};

const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const nextRenewal = (feeType, from = new Date()) => {
  if (String(feeType || '').toUpperCase() === 'MONTHLY') return addMonths(from, 1);
  return null;
};

const parseDate = (value, fallback) => {
  if (!value) return fallback;
  const raw = String(value);
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  const parsed = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(raw);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};

/* ------------------------------------------------------------------ */
/* List + KPIs                                                         */
/* ------------------------------------------------------------------ */

const buildPaymentsWhere = (query, companyId) => {
  const where = { companyId };
  if (query.studentId) where.studentId = query.studentId;
  if (query.enrollmentId) where.enrollmentId = query.enrollmentId;
  if (query.branchId) where.branchId = query.branchId;
  if (query.packageId) where.packageId = query.packageId;
  if (query.method && PAYMENT_METHODS.includes(String(query.method).toUpperCase())) {
    where.method = String(query.method).toUpperCase();
  }
  if (query.status && ['COMPLETED', 'REVERSED', 'PARTIALLY_REVERSED'].includes(String(query.status).toUpperCase())) {
    where.status = String(query.status).toUpperCase();
  }
  if (query.from || query.to) {
    where.paidAt = {};
    if (query.from) where.paidAt.gte = parseDate(query.from, new Date(0));
    if (query.to) {
      const to = parseDate(query.to, new Date());
      to.setHours(23, 59, 59, 999);
      where.paidAt.lte = to;
    }
  }
  const q = String(query.q || '').trim();
  if (q) {
    where.OR = [
      { studentName: { contains: q, mode: 'insensitive' } },
      { paymentNumber: { contains: q, mode: 'insensitive' } },
      { receiptNumber: { contains: q, mode: 'insensitive' } },
      { reference: { contains: q, mode: 'insensitive' } },
    ];
  }
  return where;
};

const listPayments = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const where = buildPaymentsWhere(req.query, companyId);

    const [items, total] = await Promise.all([
      prisma.educationPayment.findMany({
        where,
        orderBy: { paidAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.educationPayment.count({ where }),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error('Error fetching education payments:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب المدفوعات' });
  }
};

const exportPayments = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const where = buildPaymentsWhere(req.query, companyId);
    const rows = await prisma.educationPayment.findMany({
      where,
      orderBy: { paidAt: 'desc' },
      take: 10000,
    });

    const header = [
      'payment_number', 'receipt_number', 'paid_at', 'student_name', 'amount', 'reversed_amount',
      'method', 'source', 'status', 'branch_id', 'package_id', 'cashier', 'reference', 'notes',
    ];
    const escapeCsv = (value) => {
      const text = value === null || value === undefined ? '' : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };
    const lines = [header.join(',')];
    for (const row of rows) {
      lines.push([
        row.paymentNumber,
        row.receiptNumber,
        row.paidAt ? new Date(row.paidAt).toISOString() : '',
        row.studentName,
        money(row.amount),
        money(row.reversedAmount),
        row.method,
        row.source,
        row.status,
        row.branchId,
        row.packageId,
        row.cashierName,
        row.reference,
        row.notes,
      ].map(escapeCsv).join(','));
    }

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="education-payments-${stamp}.csv"`);
    res.send(`\uFEFF${lines.join('\r\n')}`);
  } catch (error) {
    console.error('Error exporting education payments:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في تصدير المدفوعات' });
  }
};

const getSummary = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const rangeFrom = parseDate(req.query.from, monthStart);
    const rangeTo = parseDate(req.query.to, now);
    rangeTo.setHours(23, 59, 59, 999);

    const [todayRows, monthRows, rangeRows, byMethod, activeEnrollments, pendingTopups] = await Promise.all([
      prisma.educationPayment.aggregate({
        where: { companyId, status: 'COMPLETED', paidAt: { gte: todayStart } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.educationPayment.aggregate({
        where: { companyId, status: 'COMPLETED', paidAt: { gte: monthStart } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.educationPayment.aggregate({
        where: { companyId, status: 'COMPLETED', paidAt: { gte: rangeFrom, lte: rangeTo } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.educationPayment.groupBy({
        by: ['method'],
        where: { companyId, status: 'COMPLETED', paidAt: { gte: rangeFrom, lte: rangeTo } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.educationEnrollment.findMany({
        where: { companyId, isActive: true },
        select: { id: true, amountPaid: true, finalAmount: true, installments: true, studentId: true },
      }),
      prisma.walletTransaction.count({
        where: { status: 'PENDING_RELEASE', wallet: { companyId } },
      }),
    ]);

    let outstandingTotal = 0;
    let outstandingCount = 0;
    let overdueInstallmentsCount = 0;
    let overdueAmount = 0;
    const dayStart = todayStart.getTime();

    for (const enrollment of activeEnrollments) {
      const total = money(enrollment.finalAmount);
      const paid = money(enrollment.amountPaid);
      const remaining = money(total - paid);
      if (remaining > 0.009) {
        outstandingTotal = money(outstandingTotal + remaining);
        outstandingCount += 1;

        let installments = [];
        try {
          installments = Array.isArray(enrollment.installments)
            ? enrollment.installments
            : JSON.parse(enrollment.installments || '[]');
        } catch (_) {
          installments = [];
        }
        for (const inst of installments) {
          if (String(inst?.status || '').toUpperCase() === 'PAID') continue;
          const due = inst?.dueDate ? new Date(inst.dueDate) : null;
          if (due && !Number.isNaN(due.getTime()) && due.getTime() < dayStart) {
            overdueInstallmentsCount += 1;
            overdueAmount = money(overdueAmount + money(inst.amount));
          }
        }
      }
    }

    const methodBreakdown = {};
    for (const row of byMethod) {
      methodBreakdown[row.method] = {
        amount: money(row._sum?.amount),
        count: row._count || 0,
      };
    }

    res.json({
      success: true,
      data: {
        period: { from: rangeFrom, to: rangeTo },
        today: { amount: money(todayRows._sum?.amount), count: todayRows._count || 0 },
        month: { amount: money(monthRows._sum?.amount), count: monthRows._count || 0 },
        range: { amount: money(rangeRows._sum?.amount), count: rangeRows._count || 0 },
        byMethod: methodBreakdown,
        outstanding: { amount: outstandingTotal, count: outstandingCount },
        overdueInstallments: { amount: overdueAmount, count: overdueInstallmentsCount },
        pendingTopups,
      },
    });
  } catch (error) {
    console.error('Error fetching education payments summary:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب ملخص التحصيل' });
  }
};

const getDues = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const now = new Date();

    const enrollments = await prisma.educationEnrollment.findMany({
      where: { companyId, isActive: true },
      include: {
        student: { select: { id: true, code: true, firstName: true, lastName: true, phone: true } },
        package: { select: { id: true, name: true, subject: { select: { name: true } } } },
      },
      orderBy: { enrollmentDate: 'asc' },
      take: 500,
    });

    const dues = [];
    for (const enrollment of enrollments) {
      const total = money(enrollment.finalAmount);
      const paid = money(enrollment.amountPaid);
      const remaining = money(total - paid);
      if (remaining <= 0.009) continue;

      let installments = [];
      try {
        installments = Array.isArray(enrollment.installments)
          ? enrollment.installments
          : JSON.parse(enrollment.installments || '[]');
      } catch (_) {
        installments = [];
      }
      const overdue = installments.filter((inst) => {
        if (String(inst?.status || '').toUpperCase() === 'PAID') return false;
        const due = inst?.dueDate ? new Date(inst.dueDate) : null;
        return due && !Number.isNaN(due.getTime()) && due.getTime() < now.getTime();
      });

      dues.push({
        kind: 'ENROLLMENT',
        enrollmentId: enrollment.id,
        studentId: enrollment.studentId,
        studentName: `${enrollment.student?.firstName || ''} ${enrollment.student?.lastName || ''}`.trim(),
        studentCode: enrollment.student?.code || null,
        phone: enrollment.student?.phone || null,
        packageId: enrollment.packageId || null,
        packageName: enrollment.package?.name || null,
        subjectName: enrollment.package?.subject?.name || null,
        total,
        paid,
        remaining,
        paymentMethod: enrollment.paymentMethod || 'CASH',
        installmentCount: enrollment.installmentCount || 1,
        overdueCount: overdue.length,
        overdueAmount: money(overdue.reduce((sum, inst) => sum + money(inst.amount), 0)),
        nextDueDate: overdue[0]?.dueDate
          || installments.find((inst) => String(inst?.status || '').toUpperCase() !== 'PAID' && inst?.dueDate)?.dueDate
          || null,
      });
    }

    let groupRenewals = [];
    try {
      const rows = await prisma.$queryRawUnsafe(`
        SELECT m."id", m."groupId", m."studentId", m."paymentStatus", m."amountPaid", m."nextRenewalDate",
               COALESCE(m."discountAmount", 0) AS "discountAmount",
               g."name" AS "groupName", g."feeAmount", g."feeType",
               s."firstName", s."lastName", s."phone"
        FROM "education_group_members" m
        JOIN "education_groups" g ON g."id" = m."groupId" AND g."companyId" = m."companyId"
        JOIN "education_students" s ON s."id" = m."studentId" AND s."companyId" = m."companyId"
        WHERE m."companyId" = $1
          AND m."status" = 'ACTIVE'
          AND (
            m."paymentStatus" <> 'PAID'
            OR (m."nextRenewalDate" IS NOT NULL AND m."nextRenewalDate" <= NOW())
          )
        ORDER BY m."nextRenewalDate" ASC NULLS FIRST
        LIMIT 500
      `, companyId);
      groupRenewals = (rows || []).map((row) => {
        const fee = money(row.feeAmount);
        const paid = money(row.amountPaid);
        const discount = money(row.discountAmount);
        const effectiveFee = money(Math.max(0, fee - discount));
        const fullyPaid = String(row.paymentStatus || '').toUpperCase() === 'PAID';
        return {
          kind: 'GROUP',
          groupMemberId: row.id,
          groupId: row.groupId,
          groupName: row.groupName,
          studentId: row.studentId,
          studentName: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
          phone: row.phone || null,
          feeAmount: fee,
          discountAmount: discount,
          feeType: row.feeType,
          paid,
          // A paid member whose renewal date passed owes a full new cycle.
          remaining: fullyPaid ? effectiveFee : money(Math.max(0, effectiveFee - paid)),
          paymentStatus: row.paymentStatus,
          nextRenewalDate: row.nextRenewalDate,
        };
      });
    } catch (rawError) {
      console.warn('[EducationPayments] group renewals query skipped:', rawError.message);
    }

    res.json({
      success: true,
      data: {
        enrollments: dues,
        groupRenewals,
        totals: {
          enrollmentsRemaining: money(dues.reduce((sum, item) => sum + item.remaining, 0)),
          enrollmentsCount: dues.length,
          groupRenewalsRemaining: money(groupRenewals.reduce((sum, item) => sum + item.remaining, 0)),
          groupRenewalsCount: groupRenewals.length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching education dues:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب المستحقات' });
  }
};

/* ------------------------------------------------------------------ */
/* Record / reverse payment                                            */
/* ------------------------------------------------------------------ */

const recordPayment = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const {
      enrollmentId,
      groupMemberId,
      amount,
      method = 'CASH',
      paidAt,
      reference,
      notes,
      couponCode,
    } = req.body || {};

    const value = money(amount);
    if (!value || value <= 0) {
      return res.status(400).json({ success: false, error: 'المبلغ غير صحيح' });
    }
    const paymentMethod = String(method).toUpperCase();
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ success: false, error: 'طريقة الدفع غير مدعومة' });
    }
    if (Boolean(enrollmentId) === Boolean(groupMemberId)) {
      return res.status(400).json({ success: false, error: 'حدد التسجيل أو عضو المجموعة (واحد فقط)' });
    }

    const prisma = getSharedPrismaClient();
    const paidDate = parseDate(paidAt, new Date());
    await assertDayOpen(prisma, companyId, paidDate);
    const cashierId = req.user?.id || null;
    const cashierName = req.user?.name
      || [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ')
      || req.user?.email
      || null;
    const monthPrefix = `EDU-PAY-${paidDate.getFullYear()}${String(paidDate.getMonth() + 1).padStart(2, '0')}-`;

    // 🎟️ كود خصم اختياري (دفعات الباقات ورسوم المجموعات)
    let collected = value;
    let appliedCoupon = null;
    let couponDiscount = 0;

    const result = await prisma.$transaction(async (tx) => {
      let enrollment = null;
      let member = null;
      let student = null;
      let studentName = '';
      let description = '';
      let referenceType = 'EDUCATION_PAYMENT';
      const metadata = {};

      if (enrollmentId) {
        enrollment = await tx.educationEnrollment.findFirst({
          where: { id: enrollmentId, companyId },
          include: {
            student: { select: { id: true, firstName: true, lastName: true } },
            package: { select: { id: true, name: true, price: true } },
          },
        });
        if (!enrollment) {
          const err = new Error('التسجيل غير موجود');
          err.statusCode = 404;
          throw err;
        }
        if (!enrollment.isActive) {
          const err = new Error('التسجيل غير نشط — لا يمكن تحصيل دفعة عليه');
          err.statusCode = 409;
          throw err;
        }
        const total = money(enrollment.finalAmount || enrollment.package?.price || 0);
        const paid = money(enrollment.amountPaid);
        const remaining = money(total - paid);
        if (remaining <= 0.009) {
          const err = new Error('التسجيل مسدد بالكامل');
          err.statusCode = 409;
          throw err;
        }
        if (value > remaining + 0.009) {
          const err = new Error(`المبلغ أكبر من المتبقي (${remaining} ج.م)`);
          err.statusCode = 400;
          throw err;
        }

        // 🎟️ كود خصم على دفعة الباقة: يقلل المبلغ المحصّل ويقلل إجمالي المطلوب بنفس القيمة
        let newTotal = total;
        if (couponCode) {
          const couponService = require('../services/educationCouponService');
          const validation = await couponService.validateCoupon(tx, {
            companyId,
            code: couponCode,
            amount: value,
            studentId: enrollment.studentId,
            packageId: enrollment.packageId,
          });
          appliedCoupon = validation.coupon;
          couponDiscount = validation.discountAmount;
          collected = validation.finalAmount;
          if (collected <= 0.009) {
            const err = new Error('الخصم يغطي كامل المبلغ — سجّل إعفاءً بدل دفعة نقدية');
            err.statusCode = 400;
            throw err;
          }
          newTotal = money(total - couponDiscount);
        }

        student = enrollment.student;
        studentName = `${student?.firstName || ''} ${student?.lastName || ''}`.trim();
        const newPaid = money(paid + collected);
        await tx.educationEnrollment.update({
          where: { id: enrollment.id },
          data: {
            amountPaid: newPaid,
            ...(couponDiscount > 0
              ? {
                finalAmount: newTotal,
                discountType: 'COUPON',
                discountAmount: money(money(enrollment.discountAmount) + couponDiscount),
              }
              : {}),
            paymentStatus: enrollmentStatusAfterPayment(newTotal, newPaid),
          },
        });
        metadata.enrollmentId = enrollment.id;
        metadata.packageName = enrollment.package?.name || null;
        metadata.remainingBefore = remaining;
        if (couponDiscount > 0) {
          metadata.couponCode = appliedCoupon?.code || null;
          metadata.couponDiscount = couponDiscount;
        }
        referenceType = 'EDUCATION_PAYMENT';
        description = `تحصيل دفعة تعليمية (${enrollment.package?.name || 'باقة'}) - الطالب: ${studentName || 'طالب'}`;
      } else {
        const rows = await tx.$queryRawUnsafe(`
          SELECT m."id", m."groupId", m."studentId", m."status", m."paymentStatus", m."amountPaid",
                 m."nextRenewalDate", COALESCE(m."discountAmount", 0) AS "discountAmount",
                 g."name" AS "groupName", g."feeAmount", g."feeType", g."branchId" AS "groupBranchId",
                 s."firstName", s."lastName"
          FROM "education_group_members" m
          JOIN "education_groups" g ON g."id" = m."groupId" AND g."companyId" = m."companyId"
          JOIN "education_students" s ON s."id" = m."studentId" AND s."companyId" = m."companyId"
          WHERE m."id" = $1 AND m."companyId" = $2
          LIMIT 1
        `, groupMemberId, companyId);
        member = Array.isArray(rows) ? rows[0] : null;
        if (!member) {
          const err = new Error('عضو المجموعة غير موجود');
          err.statusCode = 404;
          throw err;
        }

        const fee = money(member.feeAmount);
        const alreadyPaid = money(member.amountPaid);
        const priorDiscount = money(member.discountAmount);
        const effectiveFee = money(Math.max(0, fee - priorDiscount));
        const isPaid = String(member.paymentStatus || '').toUpperCase() === 'PAID';
        const renewalDate = member.nextRenewalDate ? new Date(member.nextRenewalDate) : null;
        const renewalDue = !renewalDate || renewalDate.getTime() <= Date.now();

        if (isPaid && !renewalDue) {
          const err = new Error('عضو المجموعة مسدد للدورة الحالية — التجديد مستحق لاحقاً');
          err.statusCode = 409;
          throw err;
        }

        if (effectiveFee > 0 && value > effectiveFee + 0.009) {
          const err = new Error(`المبلغ أكبر من المتبقي على رسوم المجموعة (${effectiveFee} ج.م)`);
          err.statusCode = 400;
          throw err;
        }

        // 🎟️ كود خصم على رسوم العضو: يقلل المحصّل ويزيد خصم العضو (نفس معادلة المتبقي)
        if (couponCode) {
          const couponService = require('../services/educationCouponService');
          const validation = await couponService.validateCoupon(tx, {
            companyId,
            code: couponCode,
            amount: value,
            studentId: member.studentId,
            groupId: member.groupId,
          });
          appliedCoupon = validation.coupon;
          couponDiscount = validation.discountAmount;
          collected = validation.finalAmount;
          if (collected <= 0.009) {
            const err = new Error('الخصم يغطي كامل المبلغ — سجّل إعفاءً بدل دفعة نقدية');
            err.statusCode = 400;
            throw err;
          }
        }

        const basePaid = isPaid ? 0 : alreadyPaid;
        const newPaid = money(basePaid + collected);
        const newDiscount = money(priorDiscount + couponDiscount);
        const settled = money(basePaid + value);
        const fullyPaid = effectiveFee > 0 ? settled >= effectiveFee - 0.009 : true;
        const newStatus = fullyPaid ? 'PAID' : (newPaid > 0 ? 'PARTIAL' : 'PENDING');
        const newRenewalDate = fullyPaid ? nextRenewal(member.feeType) : renewalDate;

        await tx.$executeRawUnsafe(`
          UPDATE "education_group_members"
          SET "amountPaid" = $1,
              "discountAmount" = $2,
              "paymentStatus" = $3,
              "nextRenewalDate" = $4,
              "updatedAt" = NOW()
          WHERE "id" = $5 AND "companyId" = $6
        `,
          newPaid,
          newDiscount,
          newStatus,
          newRenewalDate,
          member.id,
          companyId
        );

        studentName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
        metadata.groupMemberId = member.id;
        metadata.groupId = member.groupId;
        metadata.groupName = member.groupName;
        metadata.feeAmount = fee;
        if (priorDiscount || couponDiscount) {
          metadata.memberDiscount = newDiscount;
        }
        if (couponDiscount > 0) {
          metadata.couponCode = appliedCoupon?.code || null;
          metadata.couponDiscount = couponDiscount;
        }
        referenceType = 'EDUCATION_GROUP_PAYMENT';
        description = `تحصيل رسوم مجموعة (${member.groupName || 'مجموعة'}) - الطالب: ${studentName || 'طالب'}`;
      }

      const treasury = await resolveTreasury(tx, companyId);
      const paymentNumber = await nextSequenceNumber(tx, tx.educationPayment, companyId, monthPrefix, 'paymentNumber');

      const payment = await tx.educationPayment.create({
        data: {
          companyId,
          paymentNumber,
          receiptNumber: paymentNumber.replace('EDU-PAY-', 'RCP-'),
          studentId: enrollment?.studentId || member?.studentId || null,
          enrollmentId: enrollment?.id || null,
          groupId: member?.groupId || null,
          groupMemberId: member?.id || null,
          branchId: enrollment?.branchId || member?.groupBranchId || null,
          packageId: enrollment?.packageId || null,
          studentName: studentName || null,
          amount: collected,
          method: paymentMethod,
          status: 'COMPLETED',
          source: enrollmentId ? 'ADMIN' : 'GROUP',
          reference: reference || null,
          notes: couponDiscount > 0
            ? `${notes ? `${notes} — ` : ''}كود خصم ${appliedCoupon?.code || ''} (-${couponDiscount} ج.م)`
            : (notes || null),
          paidAt: paidDate,
          cashierId,
          cashierName,
        },
      });

      // 🎟️ استهلاك الكود داخل نفس المعاملة
      if (appliedCoupon) {
        const couponService = require('../services/educationCouponService');
        await couponService.redeemCoupon(tx, {
          companyId,
          coupon: appliedCoupon,
          studentId: enrollment?.studentId || member?.studentId || null,
          customerId: null,
          enrollmentId: enrollment?.id || null,
          paymentId: payment.id,
          discount: couponDiscount,
        });
      }

      const transaction = await postDeposit(tx, {
        companyId,
        treasury,
        amount: collected,
        referenceType,
        referenceId: payment.id,
        description: `${description} — إيصال ${payment.paymentNumber}`,
        createdById: cashierId,
      });

      return { payment, transaction, metadata, studentName, description };
    });

    logEducationEvent({
      companyId,
      action: 'RECORD_PAYMENT',
      entityType: 'PAYMENT',
      entityId: result.payment.id,
      entityName: result.payment.paymentNumber,
      description: `${result.description} بمبلغ ${collected} ج.م (${paymentMethod}) — إيصال ${result.payment.paymentNumber}${couponDiscount > 0 ? ` — خصم ${couponDiscount} ج.م (${appliedCoupon?.code || ''})` : ''}`,
      details: {
        ...result.metadata,
        amount: collected,
        method: paymentMethod,
        receiptNumber: result.payment.receiptNumber,
        reference: reference || null,
      },
      severity: 'MEDIUM',
      req,
    }).catch((e) => console.error('[PaymentAudit]', e.message));

    res.json({ success: true, data: result.payment });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error('Error recording education payment:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء تسجيل الدفعة' });
  }
};

const getCockpit = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const service = require('../services/educationFinanceCockpitService');
    const data = await service.buildCockpit(getSharedPrismaClient(), companyId, {
      months: req.query.months,
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error building finance cockpit:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب النظرة المالية' });
  }
};

const getVarianceReport = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const service = require('../services/educationVarianceReportService');
    const data = await service.buildVarianceReport(getSharedPrismaClient(), companyId, {
      months: req.query.months,
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error building variance report:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب تقرير الفروق' });
  }
};

const getMethodReport = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const service = require('../services/educationMethodReportService');
    const data = await service.buildMethodReport(getSharedPrismaClient(), companyId, {
      months: req.query.months,
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error building method report:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب توزيع المحصّل' });
  }
};

const getCollectionReport = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const service = require('../services/educationCollectionReportService');
    const data = await service.buildCollectionReport(getSharedPrismaClient(), companyId, {
      months: req.query.months,
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error building collection report:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب تقرير التحصيل' });
  }
};

const getDiscountReport = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const service = require('../services/educationDiscountReportService');
    const data = await service.buildDiscountReport(getSharedPrismaClient(), companyId, {
      months: req.query.months,
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error building discount report:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب تقرير الخصومات' });
  }
};

/**
 * Standing discount on a single group member (sibling/employee waivers …).
 * Reduces that member's cycle due without touching the shared group fee.
 */
const setMemberDiscount = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const rows = await prisma.$queryRawUnsafe(`
      SELECT m."id", m."paymentStatus", m."amountPaid", m."groupId",
             g."feeAmount",
             s."firstName", s."lastName"
      FROM "education_group_members" m
      JOIN "education_groups" g ON g."id" = m."groupId" AND g."companyId" = m."companyId"
      JOIN "education_students" s ON s."id" = m."studentId" AND s."companyId" = m."companyId"
      WHERE m."id" = $1 AND m."companyId" = $2
      LIMIT 1
    `, req.params.id, companyId);

    const member = Array.isArray(rows) ? rows[0] : null;
    if (!member) return res.status(404).json({ success: false, error: 'عضو المجموعة غير موجود' });

    const fee = money(member.feeAmount);
    const rawAmount = req.body?.amount;
    const numericAmount = Number(rawAmount);
    if (rawAmount === undefined || rawAmount === null || rawAmount === ''
      || !Number.isFinite(numericAmount) || numericAmount < 0) {
      return res.status(400).json({ success: false, error: 'قيمة الخصم غير صحيحة' });
    }
    const amount = money(numericAmount);
    if (amount > fee + 0.009) {
      return res.status(400).json({ success: false, error: `الخصم أكبر من رسوم المجموعة (${fee} ج.م)` });
    }

    const reason = req.body?.reason ? String(req.body.reason).slice(0, 300) : null;
    const paid = money(member.amountPaid);
    const settled = money(paid + amount);
    const fullyPaid = fee - amount <= 0.009 ? true : settled >= fee - 0.009;
    const status = fullyPaid ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'PENDING');

    await prisma.$executeRawUnsafe(`
      UPDATE "education_group_members"
      SET "discountAmount" = $1,
          "discountReason" = $2,
          "paymentStatus" = $3,
          "updatedAt" = NOW()
      WHERE "id" = $4 AND "companyId" = $5
    `, amount, reason, status, member.id, companyId);

    logEducationEvent({
      companyId,
      action: 'MANUAL_DISCOUNT',
      entityType: 'PAYMENT',
      entityId: member.id,
      entityName: `${member.firstName || ''} ${member.lastName || ''}`.trim(),
      description: `تم تطبيق خصم ${amount} ج.م على رسوم عضو المجموعة ${member.firstName || ''} ${member.lastName || ''}`.trim(),
      details: { groupMemberId: member.id, feeAmount: fee, discountAmount: amount, reason },
      severity: 'MEDIUM',
      req,
    }).catch(() => {});

    res.json({
      success: true,
      data: {
        groupMemberId: member.id,
        discountAmount: amount,
        reason,
        feeAmount: fee,
        effectiveFee: money(Math.max(0, fee - amount)),
        paymentStatus: status,
      },
    });
  } catch (error) {
    console.error('Error setting member discount:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في تطبيق الخصم' });
  }
};

const reversePayment = async (req, res) => {  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const reason = req.body?.reason ? String(req.body.reason).slice(0, 500) : null;
    const prisma = getSharedPrismaClient();
    await assertDayOpen(prisma, companyId, new Date());

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.educationPayment.findFirst({ where: { id, companyId } });
      if (!payment) {
        const err = new Error('الدفعة غير موجودة');
        err.statusCode = 404;
        throw err;
      }
      if (payment.status === 'REVERSED') {
        const err = new Error('الدفعة ملغاة بالفعل');
        err.statusCode = 409;
        throw err;
      }

      const alreadyReversed = money(payment.reversedAmount);
      const remaining = money(money(payment.amount) - alreadyReversed);
      if (remaining <= 0.009) {
        const err = new Error('لا يوجد مبلغ متبقٍ قابل للإلغاء');
        err.statusCode = 409;
        throw err;
      }

      const requested = req.body?.amount === undefined || req.body?.amount === null || req.body?.amount === ''
        ? remaining
        : money(req.body.amount);
      if (requested <= 0) {
        const err = new Error('مبلغ الإلغاء غير صحيح');
        err.statusCode = 400;
        throw err;
      }
      if (requested > remaining + 0.009) {
        const err = new Error(`مبلغ الإلغاء أكبر من المتبقي (${remaining} ج.م)`);
        err.statusCode = 400;
        throw err;
      }

      const reversalRef = `${payment.id}_rev_${alreadyReversed}_${requested}`;
      const duplicate = await tx.treasuryTransaction.findFirst({
        where: { companyId, referenceType: 'EDUCATION_PAYMENT_REVERSAL', referenceId: reversalRef },
      });
      if (duplicate) {
        const err = new Error('تم تنفيذ هذا الإلغاء بالفعل');
        err.statusCode = 409;
        throw err;
      }

      if (payment.enrollmentId) {
        const enrollment = await tx.educationEnrollment.findFirst({
          where: { id: payment.enrollmentId, companyId },
        });
        if (enrollment) {
          const newPaid = money(Math.max(0, money(enrollment.amountPaid) - requested));
          const total = money(enrollment.finalAmount || 0);
          await tx.educationEnrollment.update({
            where: { id: enrollment.id },
            data: {
              amountPaid: newPaid,
              paymentStatus: newPaid <= 0.009 ? 'PENDING' : enrollmentStatusAfterPayment(total, newPaid),
            },
          });
        }
      }

      if (payment.groupMemberId) {
        const rows = await tx.$queryRawUnsafe(`
          SELECT m."id", m."amountPaid", g."feeAmount"
          FROM "education_group_members" m
          JOIN "education_groups" g ON g."id" = m."groupId" AND g."companyId" = m."companyId"
          WHERE m."id" = $1 AND m."companyId" = $2
          LIMIT 1
        `, payment.groupMemberId, companyId);
        const member = Array.isArray(rows) ? rows[0] : null;
        if (member) {
          const remainingPaid = money(Math.max(0, money(member.amountPaid) - requested));
          const fee = money(member.feeAmount);
          const newStatus = remainingPaid <= 0.009 ? 'PENDING' : (fee > 0 && remainingPaid >= fee - 0.009 ? 'PAID' : 'PARTIAL');
          await tx.$executeRawUnsafe(`
            UPDATE "education_group_members"
            SET "amountPaid" = $1, "paymentStatus" = $2, "updatedAt" = NOW()
            WHERE "id" = $3 AND "companyId" = $4
          `, remainingPaid, newStatus, member.id, companyId);
        }
      }

      const treasury = await resolveTreasury(tx, companyId);
      await postExpense(tx, {
        companyId,
        treasury,
        amount: requested,
        referenceType: 'EDUCATION_PAYMENT_REVERSAL',
        referenceId: reversalRef,
        description: `إلغاء ${requested} ج.م من تحصيل ${payment.paymentNumber}${reason ? ` — ${reason}` : ''}`,
        createdById: req.user?.id,
      });

      const newReversed = money(alreadyReversed + requested);
      const fullyReversed = newReversed >= money(payment.amount) - 0.009;

      return tx.educationPayment.update({
        where: { id: payment.id },
        data: {
          status: fullyReversed ? 'REVERSED' : 'PARTIALLY_REVERSED',
          reversedAmount: newReversed,
          reversedAt: new Date(),
          reversedById: req.user?.id || null,
          reversalReason: reason,
        },
      });
    });

    logEducationEvent({
      companyId,
      action: 'REVERSE_PAYMENT',
      entityType: 'PAYMENT',
      entityId: result.id,
      entityName: result.paymentNumber,
      description: `تم إلغاء الدفعة ${result.paymentNumber} بمبلغ ${result.amount} ج.م${reason ? ` — السبب: ${reason}` : ''}`,
      details: { amount: result.amount, reason, studentName: result.studentName },
      severity: 'HIGH',
      req,
    }).catch((e) => console.error('[PaymentAudit]', e.message));

    res.json({ success: true, data: result });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error('Error reversing education payment:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء إلغاء الدفعة' });
  }
};

/* ------------------------------------------------------------------ */
/* Parent wallet top-ups                                               */
/* ------------------------------------------------------------------ */

const listPendingTopups = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const status = String(req.query.status || 'PENDING_RELEASE').toUpperCase();
    const allowed = ['PENDING_RELEASE', 'RELEASED', 'CANCELLED', 'ALL'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: 'حالة غير مدعومة' });
    }

    const items = await getSharedPrismaClient().walletTransaction.findMany({
      where: {
        wallet: { companyId },
        ...(status === 'ALL' ? {} : { status }),
      },
      include: {
        wallet: {
          select: {
            id: true,
            customerId: true,
            customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching wallet topups:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب طلبات الشحن' });
  }
};

const releaseTopup = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const prisma = getSharedPrismaClient();

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.walletTransaction.findFirst({
        where: { id, wallet: { companyId } },
        include: {
          wallet: {
            select: {
              id: true,
              customerId: true,
              customer: { select: { firstName: true, lastName: true, phone: true } },
            },
          },
        },
      });
      if (!transaction) {
        const err = new Error('طلب الشحن غير موجود');
        err.statusCode = 404;
        throw err;
      }
      if (transaction.status !== 'PENDING_RELEASE') {
        const err = new Error('طلب الشحن ليس معلقاً');
        err.statusCode = 409;
        throw err;
      }

      const amount = money(transaction.amount);
      const updatedWallet = await tx.customerWallet.update({
        where: { id: transaction.wallet.id },
        data: {
          balance: { increment: amount },
          totalDeposited: { increment: amount },
        },
      });

      const released = await tx.walletTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
          balanceAfter: Number(updatedWallet.balance),
        },
      });

      const treasury = await resolveTreasury(tx, companyId);
      const studentName = `${transaction.wallet.customer?.firstName || ''} ${transaction.wallet.customer?.lastName || ''}`.trim();
      const treasuryTx = await postDeposit(tx, {
        companyId,
        treasury,
        amount,
        referenceType: 'EDUCATION_WALLET_TOPUP',
        referenceId: transaction.id,
        description: `اعتماد شحن محفظة ولي أمر (${studentName || 'ولي أمر'}) بمبلغ ${amount} ج.م`,
        createdById: req.user?.id,
      });

      return {
        transaction: released,
        wallet: updatedWallet,
        treasuryTx,
        amount,
        customer: transaction.wallet.customer || null,
        customerId: transaction.wallet.customerId,
      };
    });

    const customer = result.customer;
    const parentName = `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() || 'وليّ الأمر';
    try {
      const notificationService = require('../services/educationNotificationService');
      notificationService.notifyWalletTopupDecision({
        companyId,
        customerId: result.customerId,
        parentName,
        parentPhone: customer?.phone || null,
        amount: result.amount,
        approved: true,
        balance: Number(result.wallet?.balance) || 0,
      }).catch((e) => console.warn('[TopupNotify] warning:', e.message));
    } catch (notifyError) {
      console.warn('[TopupNotify] notice:', notifyError.message);
    }

    logEducationEvent({
      companyId,
      action: 'RELEASE_WALLET_TOPUP',
      entityType: 'PAYMENT',
      entityId: result.transaction.id,
      entityName: `TOPUP-${result.transaction.id.slice(-6)}`,
      description: `تم اعتماد شحن محفظة بقيمة ${result.amount} ج.م`,
      details: { amount: result.amount, walletId: result.wallet.id },
      severity: 'MEDIUM',
      req,
    }).catch((e) => console.error('[TopupAudit]', e.message));

    res.json({ success: true, data: result });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error('Error releasing wallet topup:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء اعتماد الشحن' });
  }
};

const rejectTopup = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const reason = req.body?.reason ? String(req.body.reason).slice(0, 500) : null;
    const prisma = getSharedPrismaClient();

    const transaction = await prisma.walletTransaction.findFirst({
      where: { id, wallet: { companyId } },
      include: {
        wallet: {
          select: {
            id: true,
            customerId: true,
            customer: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
      },
    });
    if (!transaction) return res.status(404).json({ success: false, error: 'طلب الشحن غير موجود' });
    if (transaction.status !== 'PENDING_RELEASE') {
      return res.status(409).json({ success: false, error: 'طلب الشحن ليس معلقاً' });
    }

    const updated = await prisma.walletTransaction.update({
      where: { id: transaction.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    const customer = transaction.wallet?.customer;
    const parentName = `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() || 'وليّ الأمر';
    try {
      const notificationService = require('../services/educationNotificationService');
      notificationService.notifyWalletTopupDecision({
        companyId,
        customerId: transaction.wallet?.customerId,
        parentName,
        parentPhone: customer?.phone || null,
        amount: money(updated.amount),
        approved: false,
        reason,
      }).catch((e) => console.warn('[TopupNotify] warning:', e.message));
    } catch (notifyError) {
      console.warn('[TopupNotify] notice:', notifyError.message);
    }

    logEducationEvent({
      companyId,
      action: 'REJECT_WALLET_TOPUP',
      entityType: 'PAYMENT',
      entityId: updated.id,
      entityName: `TOPUP-${updated.id.slice(-6)}`,
      description: `تم رفض طلب شحن محفظة بقيمة ${money(updated.amount)} ج.م${reason ? ` — ${reason}` : ''}`,
      details: { amount: money(updated.amount), reason },
      severity: 'MEDIUM',
      req,
    }).catch((e) => console.error('[TopupAudit]', e.message));

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error rejecting wallet topup:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء رفض الشحن' });
  }
};

/* ------------------------------------------------------------------ */
/* Receipt                                                             */
/* ------------------------------------------------------------------ */

const getReceipt = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const { id } = req.params;
    const payment = await prisma.educationPayment.findFirst({ where: { id, companyId } });
    if (!payment) return res.status(404).json({ success: false, error: 'الدفعة غير موجودة' });

    const [company, student, enrollment] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId }, select: { name: true, phone: true, email: true, address: true } }),
      payment.studentId
        ? prisma.educationStudent.findFirst({
            where: { id: payment.studentId, companyId },
            select: { id: true, code: true, firstName: true, lastName: true, phone: true },
          })
        : null,
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
    console.error('Error fetching payment receipt:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب الإيصال' });
  }
};

/* ------------------------------------------------------------------ */
/* Financial report                                                    */
/* ------------------------------------------------------------------ */

const getReports = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const months = Math.min(12, Math.max(1, parseInt(req.query.months, 10) || 6));
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const [payments, enrollments, pendingTopups] = await Promise.all([
      prisma.educationPayment.findMany({
        where: { companyId, status: 'COMPLETED', paidAt: { gte: start } },
        select: { amount: true, method: true, source: true, paidAt: true },
        take: 20000,
      }),
      prisma.educationEnrollment.findMany({
        where: { companyId, isActive: true },
        select: {
          id: true, studentId: true, amountPaid: true, finalAmount: true,
          installments: true, paymentMethod: true,
          student: { select: { firstName: true, lastName: true, phone: true } },
          package: { select: { name: true } },
        },
        take: 2000,
      }),
      prisma.walletTransaction.count({ where: { status: 'PENDING_RELEASE', wallet: { companyId } } }),
    ]);

    const monthKeys = [];
    for (let i = 0; i < months; i += 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    const monthlyMap = new Map(monthKeys.map((key) => [key, { month: key, amount: 0, count: 0 }]));
    const byMethod = {};
    const bySource = {};
    let collected = 0;

    for (const payment of payments) {
      const amount = money(payment.amount);
      collected = money(collected + amount);
      const key = `${new Date(payment.paidAt).getFullYear()}-${String(new Date(payment.paidAt).getMonth() + 1).padStart(2, '0')}`;
      const bucket = monthlyMap.get(key);
      if (bucket) {
        bucket.amount = money(bucket.amount + amount);
        bucket.count += 1;
      }
      const method = payment.method || 'OTHER';
      byMethod[method] = byMethod[method] || { amount: 0, count: 0 };
      byMethod[method].amount = money(byMethod[method].amount + amount);
      byMethod[method].count += 1;
      const source = payment.source || 'ADMIN';
      bySource[source] = bySource[source] || { amount: 0, count: 0 };
      bySource[source].amount = money(bySource[source].amount + amount);
      bySource[source].count += 1;
    }

    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dues = [];
    let overdueCount = 0;
    let overdueAmount = 0;

    for (const enrollment of enrollments) {
      const total = money(enrollment.finalAmount);
      const paid = money(enrollment.amountPaid);
      const remaining = money(total - paid);
      let installments = [];
      try {
        installments = Array.isArray(enrollment.installments)
          ? enrollment.installments
          : JSON.parse(enrollment.installments || '[]');
      } catch (_) {
        installments = [];
      }
      let enrollmentOverdue = 0;
      for (const inst of installments) {
        if (String(inst?.status || '').toUpperCase() === 'PAID') continue;
        const due = inst?.dueDate ? new Date(inst.dueDate) : null;
        if (due && !Number.isNaN(due.getTime()) && due.getTime() < dayStart) {
          overdueCount += 1;
          enrollmentOverdue += money(inst.amount);
        }
      }
      overdueAmount = money(overdueAmount + enrollmentOverdue);

      if (remaining > 0.009) {
        dues.push({
          enrollmentId: enrollment.id,
          studentName: `${enrollment.student?.firstName || ''} ${enrollment.student?.lastName || ''}`.trim(),
          phone: enrollment.student?.phone || null,
          packageName: enrollment.package?.name || null,
          remaining,
          overdueAmount: money(enrollmentOverdue),
        });
      }
    }

    dues.sort((a, b) => b.remaining - a.remaining);

    res.json({
      success: true,
      data: {
        period: { from: start, to: now, months },
        totals: {
          collected,
          payments: payments.length,
          average: payments.length ? money(collected / payments.length) : 0,
        },
        monthly: monthKeys.map((key) => monthlyMap.get(key)),
        byMethod,
        bySource,
        outstanding: {
          amount: money(dues.reduce((sum, item) => sum + item.remaining, 0)),
          count: dues.length,
          top: dues.slice(0, 10),
        },
        overdueInstallments: { count: overdueCount, amount: overdueAmount },
        pendingTopups,
      },
    });
  } catch (error) {
    console.error('Error fetching education finance report:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب التقرير المالي' });
  }
};

const sendReceipt = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const payment = await prisma.educationPayment.findFirst({
      where: { id: req.params.id, companyId },
    });
    if (!payment) return res.status(404).json({ success: false, error: 'الدفعة غير موجودة' });

    const [student, enrollment] = await Promise.all([
      payment.studentId
        ? prisma.educationStudent.findFirst({
            where: { id: payment.studentId, companyId },
            select: {
              id: true, customerId: true,
              customer: { select: { firstName: true, lastName: true, phone: true } },
            },
          })
        : null,
      payment.enrollmentId
        ? prisma.educationEnrollment.findFirst({
            where: { id: payment.enrollmentId, companyId },
            include: { package: { select: { name: true } } },
          })
        : null,
    ]);

    const phone = student?.customer?.phone || null;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'لا يوجد رقم هاتف لولي الأمر لإرسال الإيصال' });
    }

    const notificationService = require('../services/educationNotificationService');
    const result = await notificationService.notifyPaymentReceipt({
      companyId,
      customerId: student?.customerId || null,
      parentName: `${student?.customer?.firstName || ''} ${student?.customer?.lastName || ''}`.trim() || 'وليّ الأمر',
      parentPhone: phone,
      studentName: payment.studentName || '',
      amount: money(payment.amount),
      receiptNumber: payment.receiptNumber || payment.paymentNumber,
      paidAt: payment.paidAt,
      packageName: enrollment?.package?.name || null,
    });

    res.json({
      success: true,
      data: {
        sent: result?.success !== false,
        reason: result?.reason || null,
        phone,
      },
    });
  } catch (error) {
    console.error('Error sending payment receipt:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في إرسال الإيصال' });
  }
};

const downloadReceiptPdf = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const service = require('../services/educationReceiptPdfService');
    const result = await service.getOrCreateReceiptPdf(prisma, {
      companyId,
      paymentId: req.params.id,
      force: req.query.regenerate === '1',
    });
    if (!result) return res.status(404).json({ success: false, error: 'الدفعة غير موجودة' });

    const fileName = `${result.payment.paymentNumber || result.payment.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.send(result.buffer);
  } catch (error) {
    console.error('Error generating payment PDF:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في إنشاء ملف الإيصال' });
  }
};

const getInsights = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const months = Math.min(12, Math.max(1, parseInt(req.query.months, 10) || 6));
    const inactiveDays = Math.min(90, Math.max(7, parseInt(req.query.inactiveDays, 10) || 21));
    const service = require('../services/educationInsightsService');
    const data = await service.buildInsights(getSharedPrismaClient(), companyId, { months, inactiveDays });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error building education insights:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب تقرير الاحتفاظ والإيراد' });
  }
};

module.exports = {
  listPayments,
  exportPayments,
  getSummary,
  getInsights,
  getReports,
  getDues,
  getCollectionReport,
  getMethodReport,
  getVarianceReport,
  getCockpit,
  getDiscountReport,
  recordPayment,
  setMemberDiscount,
  reversePayment,
  listPendingTopups,
  releaseTopup,
  rejectTopup,
  getReceipt,
  sendReceipt,
  downloadReceiptPdf,
  PAYMENT_METHODS,
  enrollmentStatusAfterPayment,
  nextRenewal,
};

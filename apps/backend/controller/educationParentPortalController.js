const { getSharedPrismaClient } = require('../services/sharedDatabase');
const { logEducationEvent } = require('../services/educationAuditService');
const { computePackagePrice } = require('../utils/educationPricing');

const getWallet = async (req, res) => {
  try {
    const parentId = req.parent.id;
    const companyId = req.parent.companyId;
    const prisma = getSharedPrismaClient();
    let wallet = await prisma.customerWallet.findFirst({ where: { customerId: parentId, companyId } });
    if (!wallet) {
      wallet = await prisma.customerWallet.create({
        data: { customerId: parentId, companyId, balance: 0 }
      });
    }
    const transactions = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id, wallet: { companyId } },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json({ success: true, data: { wallet, transactions } });
  } catch (error) {
    console.error('[ParentPortal] Wallet error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب المحفظة' });
  }
};

const topupWallet = async (req, res) => {
  try {
    const parentId = req.parent.id;
    const companyId = req.parent.companyId;
    const { amount } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return res.status(400).json({ success: false, message: 'المبلغ غير صحيح' });
    if (numAmount > 50000) return res.status(400).json({ success: false, message: 'الحد الأقصى لطلب الشحن لمرة واحدة هو 50,000 ج.م' });

    const prisma = getSharedPrismaClient();
    let wallet = await prisma.customerWallet.findFirst({ where: { customerId: parentId, companyId } });
    if (!wallet) {
      wallet = await prisma.customerWallet.create({
        data: { customerId: parentId, companyId, balance: 0 }
      });
    }

    // حماية مالية وأمنية: تسجيل طلب الشحن كمعاملة معلقة للمراجعة والتحصيل (PENDING_RELEASE)
    // منع الزيادة الآلية الحرة للرصيد بدون دفع إلكتروني أو اعتماد إداري
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'CREDIT',
        amount: numAmount,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance,
        status: 'PENDING_RELEASE',
        description: `طلب شحن محفظة بقيمة ${numAmount} ج.م (بانتظار التأكيد والتحصيل)`
      }
    });

    res.json({
      success: true,
      pending: true,
      message: `تم تسجيل طلب شحن بقيمة ${numAmount} ج.م بنجاح. سيتم تفعيل الرصيد في محفظتك فور مراجعة وتأكيد التحويل من إدارة المركز.`
    });
  } catch (error) {
    console.error('[ParentPortal] Topup error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في طلب شحن المحفظة' });
  }
};

const getSubjects = async (req, res) => {
  try {
    const companyId = req.parent.companyId;
    const data = await getSharedPrismaClient().educationSubject.findMany({
      where: { companyId, isActive: true },
      include: {
        packages: { where: { isActive: true }, orderBy: { price: 'asc' } }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('[ParentPortal] Subjects error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب المواد' });
  }
};

/**
 * Preview a discount code for the parent before paying.
 * Only validates: nothing is consumed here.
 */
const validateCouponForParent = async (req, res) => {
  try {
    const companyId = req.parent?.companyId;
    const parentId = req.parent?.id;
    if (!companyId || !parentId) {
      return res.status(403).json({ success: false, message: 'غير مصرح' });
    }

    const { code, amount, studentId, packageId } = req.body || {};
    const prisma = getSharedPrismaClient();

    if (studentId) {
      const student = await prisma.educationStudent.findFirst({
        where: { id: studentId, customerId: parentId, companyId },
        select: { id: true }
      });
      if (!student) return res.status(404).json({ success: false, message: 'الطالب غير موجود' });
    }

    const couponService = require('../services/educationCouponService');
    const result = await couponService.validateCoupon(prisma, {
      companyId,
      code,
      amount: Number(amount) || 0,
      studentId: studentId || null,
      packageId: packageId || null
    });

    res.json({
      success: true,
      data: {
        code: result.code,
        type: result.type,
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount
      }
    });
  } catch (error) {
    if (error && error.name === 'CouponError') {
      return res.status(error.statusCode || 400).json({
        success: false,
        code: error.code,
        message: error.message
      });
    }
    if (error && error.code && String(error.code).startsWith('COUPON_')) {
      return res.status(error.statusCode || 400).json({
        success: false,
        code: error.code,
        message: error.message
      });
    }
    console.error('[ParentPortal] Coupon validate error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في التحقق من كود الخصم' });
  }
};

const purchasePackage = async (req, res) => {  try {
    const parentId = req.parent.id;
    const companyId = req.parent.companyId;
    const { studentId, packageId } = req.body;
    if (!studentId || !packageId) {
      return res.status(400).json({ success: false, message: 'الطالب والباقة مطلوبان' });
    }

    const prisma = getSharedPrismaClient();

    const student = await prisma.educationStudent.findFirst({
      where: { id: studentId, customerId: parentId, companyId }
    });
    if (!student) return res.status(404).json({ success: false, message: 'الطالب غير موجود' });

    const pkg = await prisma.educationPackage.findFirst({
      where: { id: packageId, companyId, isActive: true }
    });
    if (!pkg) return res.status(404).json({ success: false, message: 'الباقة غير موجودة' });

    // 🎓 خصم الأخوات 10%: نفس ولي الأمر وعنده أكتر من طالب مسجل
    const siblingCount = await prisma.educationStudent.count({
      where: { companyId, customerId: parentId, isActive: true }
    });
    const pricing = computePackagePrice({ basePrice: pkg.price, siblingCount });

    // 🎟️ كود خصم (يُطبّق بعد خصم الأخوات، ويتحقق قبل خصم أي مال)
    let coupon = null;
    let couponDiscount = 0;
    let payable = pricing.finalPrice;
    if (req.body?.couponCode) {
      const couponService = require('../services/educationCouponService');
      try {
        const validation = await couponService.validateCoupon(prisma, {
          companyId,
          code: req.body.couponCode,
          amount: payable,
          studentId,
          packageId,
        });
        coupon = validation.coupon;
        couponDiscount = validation.discountAmount;
        payable = validation.finalAmount;
      } catch (couponError) {
        if (couponError instanceof couponService.CouponError) {
          return res.status(couponError.statusCode || 400).json({
            success: false,
            code: couponError.code,
            message: couponError.message,
          });
        }
        throw couponError;
      }
    }

    let wallet = await prisma.customerWallet.findFirst({ where: { customerId: parentId, companyId } });
    if (!wallet) return res.status(400).json({ success: false, message: 'لا توجد محفظة. قم بشحن المحفظة أولاً' });
    if (wallet.balance < payable) {
      return res.status(400).json({ success: false, message: `الرصيد غير كافٍ. السعر: ${payable} ج.م، الرصيد: ${wallet.balance} ج.م` });
    }

    const result = await prisma.$transaction(async (tx) => {
      const debitResult = await tx.customerWallet.updateMany({
        where: { id: wallet.id, companyId, balance: { gte: payable } },
        data: { balance: { decrement: payable }, totalSpent: { increment: payable } }
      });
      if (!debitResult || debitResult.count !== 1) {
        const err = new Error(`الرصيد غير كافٍ. السعر: ${payable} ج.م`);
        err.statusCode = 400;
        throw err;
      }

      const updatedWallet = await tx.customerWallet.findFirst({
        where: { id: wallet.id, companyId }
      });

      const enrollment = await tx.educationEnrollment.create({
        data: {
          companyId, studentId, packageId,
          remainingHours: pkg.hoursCount, totalHours: pkg.hoursCount,
          amountPaid: payable, paymentStatus: 'COMPLETED',
          ...(coupon ? { discountType: 'COUPON', discountAmount: couponDiscount, finalAmount: payable } : {}),
          enrollmentDate: new Date()
        },
        include: {
          package: { select: { id: true, name: true, hoursCount: true, price: true, levelNumber: true } },
          student: { select: { id: true, firstName: true, lastName: true, currentLevel: true } }
        }
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id, type: 'DEBIT', amount: payable,
          balanceBefore: wallet.balance, balanceAfter: updatedWallet ? updatedWallet.balance : (wallet.balance - payable),
          description: `شراء باقة "${pkg.name}" للطالب ${student.firstName} ${student.lastName}${pricing.reason ? ` (${pricing.reason} — وفر ${pricing.discountAmount} ج.م)` : ''}`
        }
      });

      // 🧾 Unified payment ledger entry (money already captured via wallet debit)
      let createdPayment = null;
      try {
        const now = new Date();
        const prefix = `EDU-PAY-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`;
        const lastPayment = await tx.educationPayment.findFirst({
          where: { companyId, paymentNumber: { startsWith: prefix } },
          orderBy: { paymentNumber: 'desc' },
          select: { paymentNumber: true },
        });
        let seq = 1;
        if (lastPayment?.paymentNumber) {
          const parsed = parseInt(String(lastPayment.paymentNumber).split('-').pop(), 10);
          if (!Number.isNaN(parsed)) seq = parsed + 1;
        }
        const paymentNumber = `${prefix}${String(seq).padStart(4, '0')}`;
        createdPayment = await tx.educationPayment.create({
          data: {
            companyId,
            paymentNumber,
            receiptNumber: paymentNumber.replace('EDU-PAY-', 'RCP-'),
            studentId,
            enrollmentId: enrollment.id,
            packageId,
            studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim() || null,
            amount: payable,
            method: 'WALLET',
            status: 'COMPLETED',
            source: 'PARENT_WALLET',
            notes: coupon
              ? `شراء من محفظة ولي الأمر — باقة ${pkg.name} — كود خصم ${coupon.code} (-${couponDiscount} ج.م)`
              : `شراء من محفظة ولي الأمر — باقة ${pkg.name}`,
            paidAt: now,
          },
        });
      } catch (ledgerError) {
        console.warn('[ParentPurchaseLedger] warning:', ledgerError.message);
      }

      // 🎟️ استهلاك كود الخصم داخل نفس المعاملة (فشله يرجّع كل شيء)
      if (coupon) {
        const couponService = require('../services/educationCouponService');
        await couponService.redeemCoupon(tx, {
          companyId,
          coupon,
          studentId,
          customerId: parentId,
          enrollmentId: enrollment.id,
          paymentId: createdPayment?.id || null,
          discount: couponDiscount,
        });
      }

      // ترقية مستوى الطالب ليطابق المستوى المشترى
      if (pkg.levelNumber && (!student.currentLevel || pkg.levelNumber > student.currentLevel)) {
        await tx.educationStudent.updateMany({
          where: { id: student.id, companyId },
          data: { currentLevel: pkg.levelNumber }
        });
      }

      return enrollment;
    });

    const studentFullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();

    // 🏛️ No treasury posting here: the money already entered the treasury when the
    // parent wallet was funded (online or approved top-up). Posting a second deposit
    // on purchase would double-count the same cash.

    logEducationEvent({
      companyId,
      action: 'PARENT_ENROLL',
      entityType: 'ENROLLMENT',
      entityId: result.id,
      entityName: `${studentFullName} - ${pkg.name}`,
      description: `قام ولي الأمر بشراء باقة "${pkg.name}" للطالب ${studentFullName} بمبلغ ${pkg.price} ج.م من رصيد المحفظة`,
      actorType: 'PARENT',
      userName: `ولي أمر الطالب ${studentFullName}`,
      userRole: 'PARENT',
      details: {
        studentId,
        packageId,
        price: payable,
        basePrice: pricing.basePrice,
        discountAmount: pricing.discountAmount,
        discountReason: pricing.reason,
        couponCode: coupon?.code || null,
        couponDiscount,
        hours: pkg.hoursCount,
      },
      severity: 'MEDIUM',
      req,
    }).catch(e => console.error('[ParentPurchaseAudit]', e.message));

    // 📣 إشعار ولي الأمر بإتمام الشراء (نفس قالب تسجيل باقة)
    try {
      const educationNotificationService = require('../services/educationNotificationService');
      if (typeof educationNotificationService.notifyEnrollmentCreated === 'function') {
        educationNotificationService.notifyEnrollmentCreated(companyId, result)
          .catch(e => console.error('[ParentPurchaseNotify]', e.message));
      }
    } catch (notifyErr) {
      console.error('[ParentPurchaseNotify] load error:', notifyErr.message);
    }

    res.json({ success: true, data: result, message: `تم شراء الباقة "${pkg.name}" بنجاح` });
  } catch (error) {
    console.error('[ParentPortal] Purchase error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : 'حدث خطأ في شراء الباقة' });
  }
};

module.exports = { getWallet, topupWallet, getSubjects, purchasePackage, validateCouponForParent };

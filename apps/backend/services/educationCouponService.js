/**
 * Education coupon engine: validation, discount math and redemption.
 * Money-safe: discounts are always clamped to the payable amount.
 */

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

const normalizeCode = (value) => String(value || '').trim().toUpperCase().replace(/\s+/g, '');

class CouponError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

const computeDiscount = (coupon, amount) => {
  const base = money(amount);
  if (base <= 0) return 0;

  let discount = 0;
  if (String(coupon.type).toUpperCase() === 'AMOUNT') {
    discount = money(coupon.value);
  } else {
    discount = money((base * (Number(coupon.value) || 0)) / 100);
  }

  const cap = coupon.maxDiscount === null || coupon.maxDiscount === undefined ? null : money(coupon.maxDiscount);
  if (cap !== null && cap > 0 && discount > cap) discount = cap;
  if (discount > base) discount = base;
  if (discount < 0) discount = 0;
  return money(discount);
};

const assertUsable = (coupon, { amount, studentId, packageId, groupId, now = new Date() }) => {
  if (!coupon || coupon.isActive === false) {
    throw new CouponError('COUPON_NOT_FOUND', 'كود الخصم غير صالح', 404);
  }
  if (coupon.validFrom && new Date(coupon.validFrom).getTime() > now.getTime()) {
    throw new CouponError('COUPON_NOT_STARTED', 'كود الخصم لم يبدأ بعد');
  }
  if (coupon.validUntil && new Date(coupon.validUntil).getTime() < now.getTime()) {
    throw new CouponError('COUPON_EXPIRED', 'انتهت صلاحية كود الخصم');
  }
  if (coupon.maxUses !== null && coupon.maxUses !== undefined && Number(coupon.usedCount) >= Number(coupon.maxUses)) {
    throw new CouponError('COUPON_EXHAUSTED', 'تم استهلاك كود الخصم بالكامل');
  }
  if (coupon.minAmount !== null && coupon.minAmount !== undefined && money(amount) < money(coupon.minAmount)) {
    throw new CouponError('COUPON_MIN_AMOUNT', `أقل مبلغ لاستخدام الكود ${money(coupon.minAmount)} ج.م`);
  }

  const scope = String(coupon.scope || 'ALL').toUpperCase();
  if (scope === 'PACKAGE') {
    if (!coupon.packageId || coupon.packageId !== packageId) {
      throw new CouponError('COUPON_SCOPE', 'كود الخصم لا ينطبق على هذه الباقة');
    }
  }
  if (scope === 'GROUP') {
    if (!coupon.groupId || coupon.groupId !== groupId) {
      throw new CouponError('COUPON_SCOPE', 'كود الخصم لا ينطبق على هذه المجموعة');
    }
  }
  return true;
};

async function findCoupon(prisma, companyId, code) {
  const normalized = normalizeCode(code);
  if (!normalized) throw new CouponError('COUPON_REQUIRED', 'أدخل كود الخصم');
  return prisma.educationCoupon.findFirst({ where: { companyId, code: normalized } });
}

async function countStudentRedemptions(prisma, companyId, couponId, studentId) {
  if (!studentId) return 0;
  return prisma.educationCouponRedemption.count({ where: { companyId, couponId, studentId } });
}

/**
 * Validates a coupon and returns the computed discount without consuming it.
 */
async function validateCoupon(prisma, { companyId, code, amount, studentId, packageId, groupId }) {
  const coupon = await findCoupon(prisma, companyId, code);
  assertUsable(coupon, { amount, studentId, packageId, groupId });

  if (coupon.perStudentLimit !== null && coupon.perStudentLimit !== undefined) {
    const used = await countStudentRedemptions(prisma, companyId, coupon.id, studentId);
    if (used >= Number(coupon.perStudentLimit)) {
      throw new CouponError('COUPON_STUDENT_LIMIT', 'تم استخدام هذا الكود لهذا الطالب من قبل');
    }
  }

  const discountAmount = computeDiscount(coupon, amount);
  if (discountAmount <= 0) {
    throw new CouponError('COUPON_NO_VALUE', 'كود الخصم لا يمنح أي خصم على هذا المبلغ');
  }

  return {
    coupon,
    code: coupon.code,
    type: coupon.type,
    discountAmount,
    finalAmount: money(money(amount) - discountAmount),
  };
}

/**
 * Consumes the coupon atomically (usedCount guard) and writes the redemption row.
 * Must be called inside a transaction when money is being moved.
 */
async function redeemCoupon(tx, { companyId, coupon, studentId, customerId, enrollmentId, paymentId, discount }) {
  const guard = await tx.educationCoupon.updateMany({
    where: {
      id: coupon.id,
      companyId,
      isActive: true,
      ...(coupon.maxUses !== null && coupon.maxUses !== undefined
        ? { usedCount: { lt: Number(coupon.maxUses) } }
        : {}),
    },
    data: { usedCount: { increment: 1 } },
  });

  if (!guard || guard.count !== 1) {
    throw new CouponError('COUPON_EXHAUSTED', 'تم استهلاك كود الخصم بالكامل', 409);
  }

  const redemption = await tx.educationCouponRedemption.create({
    data: {
      companyId,
      couponId: coupon.id,
      studentId: studentId || null,
      customerId: customerId || null,
      enrollmentId: enrollmentId || null,
      paymentId: paymentId || null,
      discount: money(discount),
    },
  });

  return redemption;
}

module.exports = {
  CouponError,
  normalizeCode,
  computeDiscount,
  validateCoupon,
  redeemCoupon,
};

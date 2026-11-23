const { getSharedPrismaClient } = require('../services/sharedDatabase');
const { logEducationEvent } = require('../services/educationAuditService');
const couponService = require('../services/educationCouponService');

const getCompanyId = (req) => req.user?.effectiveCompanyId || req.user?.companyId || null;

const sanitizeType = (value) => (String(value || '').toUpperCase() === 'AMOUNT' ? 'AMOUNT' : 'PERCENT');
const sanitizeScope = (value) => {
  const scope = String(value || '').toUpperCase();
  return ['PACKAGE', 'GROUP'].includes(scope) ? scope : 'ALL';
};
const numberOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const listCoupons = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const where = { companyId };
    if (req.query.active === '1') where.isActive = true;
    if (req.query.active === '0') where.isActive = false;
    if (req.query.search) where.code = { contains: couponService.normalizeCode(req.query.search) };

    const coupons = await prisma.educationCoupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    res.json({ success: true, data: coupons });
  } catch (error) {
    console.error('Error listing coupons:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب أكواد الخصم' });
  }
};

const createCoupon = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const {
      code, type, value, minAmount, maxDiscount, scope,
      packageId, groupId, maxUses, perStudentLimit, validFrom, validUntil, notes, isActive,
    } = req.body || {};

    const normalizedCode = couponService.normalizeCode(code);
    if (!normalizedCode) return res.status(400).json({ success: false, error: 'كود الخصم مطلوب' });

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return res.status(400).json({ success: false, error: 'قيمة الخصم غير صحيحة' });
    }
    if (sanitizeType(type) === 'PERCENT' && numericValue > 100) {
      return res.status(400).json({ success: false, error: 'نسبة الخصم لا تتجاوز 100%' });
    }

    const prisma = getSharedPrismaClient();
    const existing = await prisma.educationCoupon.findFirst({
      where: { companyId, code: normalizedCode },
      select: { id: true },
    });
    if (existing) return res.status(409).json({ success: false, error: 'هذا الكود مستخدم بالفعل' });

    const coupon = await prisma.educationCoupon.create({
      data: {
        companyId,
        code: normalizedCode,
        type: sanitizeType(type),
        value: numericValue,
        minAmount: numberOrNull(minAmount),
        maxDiscount: numberOrNull(maxDiscount),
        scope: sanitizeScope(scope),
        packageId: packageId || null,
        groupId: groupId || null,
        maxUses: numberOrNull(maxUses),
        perStudentLimit: numberOrNull(perStudentLimit),
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        notes: notes ? String(notes).slice(0, 500) : null,
        isActive: isActive === undefined ? true : Boolean(isActive),
        createdById: req.user?.id || null,
      },
    });

    logEducationEvent({
      companyId,
      action: 'CREATE_COUPON',
      entityType: 'PAYMENT',
      entityId: coupon.id,
      entityName: coupon.code,
      description: `تم إنشاء كود خصم ${coupon.code} (${coupon.type === 'PERCENT' ? `${coupon.value}%` : `${coupon.value} ج.م`})`,
      details: { scope: coupon.scope, maxUses: coupon.maxUses },
      severity: 'LOW',
      req,
    }).catch(() => {});

    res.json({ success: true, data: coupon });
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في إنشاء كود الخصم' });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const coupon = await prisma.educationCoupon.findFirst({
      where: { id: req.params.id, companyId },
    });
    if (!coupon) return res.status(404).json({ success: false, error: 'كود الخصم غير موجود' });

    const body = req.body || {};
    const data = {};
    if (body.value !== undefined) {
      const numericValue = Number(body.value);
      if (!Number.isFinite(numericValue) || numericValue <= 0) {
        return res.status(400).json({ success: false, error: 'قيمة الخصم غير صحيحة' });
      }
      data.value = numericValue;
    }
    if (body.type !== undefined) data.type = sanitizeType(body.type);
    if (body.scope !== undefined) data.scope = sanitizeScope(body.scope);
    if (body.minAmount !== undefined) data.minAmount = numberOrNull(body.minAmount);
    if (body.maxDiscount !== undefined) data.maxDiscount = numberOrNull(body.maxDiscount);
    if (body.maxUses !== undefined) data.maxUses = numberOrNull(body.maxUses);
    if (body.perStudentLimit !== undefined) data.perStudentLimit = numberOrNull(body.perStudentLimit);
    if (body.packageId !== undefined) data.packageId = body.packageId || null;
    if (body.groupId !== undefined) data.groupId = body.groupId || null;
    if (body.validFrom !== undefined) data.validFrom = body.validFrom ? new Date(body.validFrom) : null;
    if (body.validUntil !== undefined) data.validUntil = body.validUntil ? new Date(body.validUntil) : null;
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).slice(0, 500) : null;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    const updated = await prisma.educationCoupon.update({ where: { id: coupon.id }, data });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في تحديث كود الخصم' });
  }
};

const toggleCoupon = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const coupon = await prisma.educationCoupon.findFirst({ where: { id: req.params.id, companyId } });
    if (!coupon) return res.status(404).json({ success: false, error: 'كود الخصم غير موجود' });

    const active = req.body?.isActive === undefined ? !coupon.isActive : Boolean(req.body.isActive);
    const updated = await prisma.educationCoupon.update({
      where: { id: coupon.id },
      data: { isActive: active },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error toggling coupon:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في تعديل حالة الكود' });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const coupon = await prisma.educationCoupon.findFirst({ where: { id: req.params.id, companyId } });
    if (!coupon) return res.status(404).json({ success: false, error: 'كود الخصم غير موجود' });

    if (Number(coupon.usedCount) > 0) {
      return res.status(409).json({
        success: false,
        error: 'الكود مستخدم بالفعل — أوقفه بدل حذفه للحفاظ على سجل الخصومات',
      });
    }

    await prisma.educationCoupon.delete({ where: { id: coupon.id } });
    res.json({ success: true, message: 'تم حذف كود الخصم' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في حذف كود الخصم' });
  }
};

const validateCouponPreview = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { code, amount, studentId, packageId, groupId } = req.body || {};
    const prisma = getSharedPrismaClient();
    const result = await couponService.validateCoupon(prisma, {
      companyId,
      code,
      amount: Number(amount) || 0,
      studentId: studentId || null,
      packageId: packageId || null,
      groupId: groupId || null,
    });

    res.json({
      success: true,
      data: {
        code: result.code,
        type: result.type,
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
      },
    });
  } catch (error) {
    if (error instanceof couponService.CouponError) {
      return res.status(error.statusCode || 400).json({ success: false, code: error.code, error: error.message });
    }
    console.error('Error validating coupon:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في التحقق من كود الخصم' });
  }
};

module.exports = {
  listCoupons,
  createCoupon,
  updateCoupon,
  toggleCoupon,
  deleteCoupon,
  validateCouponPreview,
};

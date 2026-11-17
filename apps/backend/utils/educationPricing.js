/**
 * تسعير وحدة التعليم — نظام الخصومات والعروض الديناميكية المخصصة.
 *
 * يدعم:
 * 1. الخصومات المخصصة للشركة التعليمية (نسبة مئوية % أو مبلغ ثابت ج.م).
 * 2. شروط التطبيق التلقائي (مثل خصم الأخوات عند وجود أكثر من طالب).
 * 3. الأكواد الترويجية (Promo Codes).
 * 4. التوافق التام 100% مع حسابات خصم الأخوات الافتراضية السابقة.
 */

const SIBLING_DISCOUNT_RATE = 0.1; // 10% (قيمة افتراضية متوافقة)

const DEFAULT_EDUCATION_DISCOUNTS = [
  {
    id: 'disc_sibling',
    nameAr: 'خصم الأخوات',
    nameEn: 'Sibling Discount',
    type: 'PERCENTAGE',
    value: 15,
    minSiblings: 2,
    isActive: true,
    description: 'خصم تلقائي عند تسجيل أكثر من طالب لنفس ولي الأمر',
  },
  {
    id: 'disc_early_bird',
    nameAr: 'خصم التسجيل المبكر',
    nameEn: 'Early Bird Discount',
    type: 'PERCENTAGE',
    value: 10,
    code: 'EARLY10',
    isActive: true,
    description: 'خصم للحجز المبكر قبل بدء الدورة',
  },
  {
    id: 'disc_cash_full',
    nameAr: 'خصم الدفع النقدي الفوري',
    nameEn: 'Full Cash Payment',
    type: 'FIXED',
    value: 100,
    isActive: false,
    description: 'خصم ثابت عند سداد كامل المبلغ دفعة واحدة كاش',
  },
];

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

/**
 * حساب قيمة خصم مخصص محدد على سعر أساسي
 * @param {object} params
 * @param {number} params.basePrice السعر الأصلي
 * @param {object} params.discount كائن الخصم { type: 'PERCENTAGE'|'FIXED', value: number, minSiblings?: number }
 * @param {number} [params.siblingCount] عدد الأبناء (للتحقق من شرط minSiblings)
 * @returns {{ discountAmount: number, finalPrice: number, applies: boolean, reason: string|null }}
 */
const computeDynamicDiscount = ({ basePrice, discount, siblingCount = 1 }) => {
  const base = Math.max(0, Number(basePrice) || 0);
  if (!discount || discount.isActive === false) {
    return { discountAmount: 0, finalPrice: round2(base), applies: false, reason: null };
  }

  // فحص شرط عدد الأخوة
  if (discount.minSiblings && Number(siblingCount) < Number(discount.minSiblings)) {
    return { discountAmount: 0, finalPrice: round2(base), applies: false, reason: 'لم يتحقق شرط عدد الإخوة' };
  }

  let discountAmount = 0;
  const rawValue = Number(discount.value) || 0;

  if (discount.type === 'PERCENTAGE') {
    const rate = Math.min(100, Math.max(0, rawValue)) / 100;
    discountAmount = round2(base * rate);
  } else if (discount.type === 'FIXED') {
    discountAmount = Math.min(base, round2(Math.max(0, rawValue)));
  }

  const finalPrice = Math.max(0, round2(base - discountAmount));
  const reason = discount.nameAr || discount.nameEn || 'خصم مخصص';

  return {
    discountAmount,
    finalPrice,
    applies: discountAmount > 0,
    reason,
  };
};

/**
 * حساب سعر الباقة مع دعم الخصومات المخصصة والتوافق مع خصم الأخوات القديم
 * @param {object} params
 * @param {number} params.basePrice سعر الباقة الأصلي
 * @param {number} [params.siblingCount] عدد أبناء ولي الأمر
 * @param {Array<object>} [params.customDiscounts] قائمة الخصومات المعرفة للشركة
 * @param {string} [params.selectedDiscountId] معرف الخصم المختار يدوياً
 * @param {string} [params.promoCode] كود الخصم الترويجي
 * @param {number} [params.customDiscountAmount] قيمة خصم يدوي مخصص مباشرة
 * @returns {{ basePrice:number, discountRate:number, discountAmount:number, finalPrice:number, reason:string|null }}
 */
const computePackagePrice = ({
  basePrice,
  siblingCount = 0,
  customDiscounts,
  selectedDiscountId,
  promoCode,
  customDiscountAmount,
}) => {
  const base = Number(basePrice) || 0;
  const count = Number(siblingCount) || 0;

  // 1. إذا تم إدخال مبلغ خصم مخصص يدوي
  if (customDiscountAmount !== undefined && customDiscountAmount !== null && Number(customDiscountAmount) > 0) {
    const disc = Math.min(base, round2(Number(customDiscountAmount)));
    return {
      basePrice: round2(base),
      discountRate: base > 0 ? round2(disc / base) : 0,
      discountAmount: disc,
      finalPrice: Math.max(0, round2(base - disc)),
      reason: 'خصم يدوي مخصص',
    };
  }

  // 2. إذا توفرت قائمة الخصومات المخصصة للشركة
  if (Array.isArray(customDiscounts) && customDiscounts.length > 0) {
    let matchedDiscount = null;

    if (selectedDiscountId && selectedDiscountId !== 'NONE') {
      matchedDiscount = customDiscounts.find(
        (d) => d && d.id === selectedDiscountId && d.isActive !== false
      );
    } else if (promoCode) {
      const cleanCode = String(promoCode).trim().toUpperCase();
      matchedDiscount = customDiscounts.find(
        (d) => d && d.code && String(d.code).trim().toUpperCase() === cleanCode && d.isActive !== false
      );
    } else if (count > 1) {
      // البحث عن خصم أخوات مفعّل
      matchedDiscount = customDiscounts.find(
        (d) => d && d.isActive !== false && (d.minSiblings && count >= d.minSiblings || d.id === 'disc_sibling')
      );
    }

    if (matchedDiscount) {
      const result = computeDynamicDiscount({ basePrice: base, discount: matchedDiscount, siblingCount: count });
      return {
        basePrice: round2(base),
        discountRate: base > 0 ? round2(result.discountAmount / base) : 0,
        discountAmount: result.discountAmount,
        finalPrice: result.finalPrice,
        reason: result.reason,
      };
    }
  }

  // 3. السلوك الافتراضي المتوافق (خصم الأخوات 10%)
  const applies = count > 1;
  const discountRate = applies ? SIBLING_DISCOUNT_RATE : 0;
  const discountAmount = round2(base * discountRate);
  return {
    basePrice: round2(base),
    discountRate,
    discountAmount,
    finalPrice: round2(base - discountAmount),
    reason: applies ? 'خصم الأخوات 10%' : null,
  };
};

module.exports = {
  SIBLING_DISCOUNT_RATE,
  DEFAULT_EDUCATION_DISCOUNTS,
  computeDynamicDiscount,
  computePackagePrice,
  round2,
};

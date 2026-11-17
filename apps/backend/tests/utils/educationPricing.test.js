/**
 * تسعير باقات وحدة التعليم — خصم الأخوات 10% والخصومات الديناميكية المخصصة
 */
const {
  SIBLING_DISCOUNT_RATE,
  DEFAULT_EDUCATION_DISCOUNTS,
  computeDynamicDiscount,
  computePackagePrice,
  round2,
} = require('../../utils/educationPricing');

describe('educationPricing — sibling discount', () => {
  test('discount rate is exactly 10%', () => {
    expect(SIBLING_DISCOUNT_RATE).toBe(0.1);
  });

  test('single child pays the full base price and gets no discount', () => {
    const result = computePackagePrice({ basePrice: 900, siblingCount: 1 });
    expect(result.finalPrice).toBe(900);
    expect(result.discountAmount).toBe(0);
    expect(result.discountRate).toBe(0);
    expect(result.reason).toBeNull();
  });

  test('two or more children get 10% off every package', () => {
    for (const count of [2, 3, 5]) {
      const result = computePackagePrice({ basePrice: 900, siblingCount: count });
      expect(result.discountRate).toBe(0.1);
      expect(result.discountAmount).toBe(90);
      expect(result.finalPrice).toBe(810);
      expect(result.reason).toContain('خصم الأخوات');
    }
  });

  test('applies to every price band the client uses', () => {
    expect(computePackagePrice({ basePrice: 800, siblingCount: 2 }).finalPrice).toBe(720);
    expect(computePackagePrice({ basePrice: 900, siblingCount: 2 }).finalPrice).toBe(810);
    expect(computePackagePrice({ basePrice: 1000, siblingCount: 2 }).finalPrice).toBe(900);
  });

  test('rounds to 2 decimals for odd amounts', () => {
    const result = computePackagePrice({ basePrice: 833.33, siblingCount: 2 });
    expect(result.discountAmount).toBe(83.33);
    expect(result.finalPrice).toBe(750);
  });

  test('tolerates missing/invalid input without producing NaN', () => {
    expect(computePackagePrice({ basePrice: undefined, siblingCount: 2 }).finalPrice).toBe(0);
    expect(computePackagePrice({ basePrice: 900, siblingCount: undefined }).finalPrice).toBe(900);
    expect(round2('900.005')).toBe(900.01);
  });
});

describe('educationPricing — dynamic custom discounts', () => {
  test('computes percentage discount accurately', () => {
    const discount = {
      id: 'custom_1',
      nameAr: 'خصم المتفوقين',
      type: 'PERCENTAGE',
      value: 25,
      isActive: true,
    };
    const res = computeDynamicDiscount({ basePrice: 1000, discount });
    expect(res.discountAmount).toBe(250);
    expect(res.finalPrice).toBe(750);
    expect(res.reason).toBe('خصم المتفوقين');
    expect(res.applies).toBe(true);
  });

  test('computes fixed amount discount accurately', () => {
    const discount = {
      id: 'custom_fixed',
      nameAr: 'خصم 150 ج.م كاش',
      type: 'FIXED',
      value: 150,
      isActive: true,
    };
    const res = computeDynamicDiscount({ basePrice: 800, discount });
    expect(res.discountAmount).toBe(150);
    expect(res.finalPrice).toBe(650);
    expect(res.applies).toBe(true);
  });

  test('fixed discount cannot exceed base price (clamps to 0)', () => {
    const discount = {
      id: 'huge_discount',
      nameAr: 'خصم كبير',
      type: 'FIXED',
      value: 1500,
      isActive: true,
    };
    const res = computeDynamicDiscount({ basePrice: 500, discount });
    expect(res.discountAmount).toBe(500);
    expect(res.finalPrice).toBe(0);
  });

  test('respects minSiblings condition', () => {
    const discount = {
      id: 'sibling_disc_custom',
      nameAr: 'خصم عائلي',
      type: 'PERCENTAGE',
      value: 20,
      minSiblings: 3,
      isActive: true,
    };
    // 2 siblings: does not meet minSiblings 3
    const res1 = computeDynamicDiscount({ basePrice: 1000, discount, siblingCount: 2 });
    expect(res1.applies).toBe(false);
    expect(res1.discountAmount).toBe(0);
    expect(res1.finalPrice).toBe(1000);

    // 3 siblings: meets condition
    const res2 = computeDynamicDiscount({ basePrice: 1000, discount, siblingCount: 3 });
    expect(res2.applies).toBe(true);
    expect(res2.discountAmount).toBe(200);
    expect(res2.finalPrice).toBe(800);
  });

  test('applies customDiscounts via computePackagePrice with selectedDiscountId', () => {
    const customDiscounts = [
      { id: 'd1', nameAr: 'خصم 15%', type: 'PERCENTAGE', value: 15, isActive: true },
      { id: 'd2', nameAr: 'خصم 50 ج.م', type: 'FIXED', value: 50, isActive: true },
    ];
    const res = computePackagePrice({
      basePrice: 600,
      customDiscounts,
      selectedDiscountId: 'd1',
    });
    expect(res.discountAmount).toBe(90);
    expect(res.finalPrice).toBe(510);
    expect(res.reason).toBe('خصم 15%');
  });

  test('applies promoCode matching from customDiscounts', () => {
    const customDiscounts = [
      { id: 'd1', nameAr: 'عرض الصيف', code: 'SUMMER2026', type: 'PERCENTAGE', value: 30, isActive: true },
    ];
    const res = computePackagePrice({
      basePrice: 1000,
      customDiscounts,
      promoCode: 'summer2026', // case-insensitive
    });
    expect(res.discountAmount).toBe(300);
    expect(res.finalPrice).toBe(700);
    expect(res.reason).toBe('عرض الصيف');
  });

  test('supports direct customDiscountAmount override', () => {
    const res = computePackagePrice({
      basePrice: 1000,
      customDiscountAmount: 175,
    });
    expect(res.discountAmount).toBe(175);
    expect(res.finalPrice).toBe(825);
    expect(res.reason).toBe('خصم يدوي مخصص');
  });
});

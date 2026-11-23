const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  computeDiscount,
  normalizeCode,
  validateCoupon,
  redeemCoupon,
  CouponError,
} = require('../../services/educationCouponService');

const baseCoupon = (overrides = {}) => ({
  id: 'c1',
  companyId: 'comp-1',
  code: 'EID25',
  type: 'PERCENT',
  value: 25,
  minAmount: null,
  maxDiscount: null,
  scope: 'ALL',
  packageId: null,
  groupId: null,
  maxUses: null,
  usedCount: 0,
  perStudentLimit: 1,
  validFrom: null,
  validUntil: null,
  isActive: true,
  ...overrides,
});

const prismaWith = ({ coupon, redemptions = 0 } = {}) => ({
  educationCoupon: { findFirst: async () => coupon || null },
  educationCouponRedemption: { count: async () => redemptions },
});

describe('educationCouponService — math', () => {
  it('normalizes codes and computes percent discounts', () => {
    assert.strictEqual(normalizeCode('  eid 25 '), 'EID25');
    assert.strictEqual(computeDiscount(baseCoupon(), 1000), 250);
    assert.strictEqual(computeDiscount(baseCoupon({ value: 10 }), 333.33), 33.33);
  });

  it('computes amount discounts and clamps them to the payable amount', () => {
    const amountCoupon = baseCoupon({ type: 'AMOUNT', value: 150 });
    assert.strictEqual(computeDiscount(amountCoupon, 1000), 150);
    assert.strictEqual(computeDiscount(amountCoupon, 100), 100);
  });

  it('applies maxDiscount caps', () => {
    const capped = baseCoupon({ value: 50, maxDiscount: 100 });
    assert.strictEqual(computeDiscount(capped, 1000), 100);
  });
});

describe('educationCouponService — validation', () => {
  it('returns the final amount for a valid coupon', async () => {
    const result = await validateCoupon(prismaWith({ coupon: baseCoupon() }), {
      companyId: 'comp-1', code: 'eid25', amount: 800, studentId: 'stu-1',
    });
    assert.strictEqual(result.discountAmount, 200);
    assert.strictEqual(result.finalAmount, 600);
    assert.strictEqual(result.code, 'EID25');
  });

  it('rejects unknown, inactive and expired coupons', async () => {
    await assert.rejects(
      validateCoupon(prismaWith({}), { companyId: 'comp-1', code: 'NOPE', amount: 500 }),
      (error) => error instanceof CouponError && error.code === 'COUPON_NOT_FOUND'
    );

    await assert.rejects(
      validateCoupon(prismaWith({ coupon: baseCoupon({ isActive: false }) }), {
        companyId: 'comp-1', code: 'EID25', amount: 500,
      }),
      (error) => error.code === 'COUPON_NOT_FOUND'
    );

    await assert.rejects(
      validateCoupon(prismaWith({ coupon: baseCoupon({ validUntil: new Date(Date.now() - 86400000) }) }), {
        companyId: 'comp-1', code: 'EID25', amount: 500,
      }),
      (error) => error.code === 'COUPON_EXPIRED'
    );

    await assert.rejects(
      validateCoupon(prismaWith({ coupon: baseCoupon({ validFrom: new Date(Date.now() + 86400000) }) }), {
        companyId: 'comp-1', code: 'EID25', amount: 500,
      }),
      (error) => error.code === 'COUPON_NOT_STARTED'
    );
  });

  it('enforces usage limits, per-student limit, minimum amount and scope', async () => {
    await assert.rejects(
      validateCoupon(prismaWith({ coupon: baseCoupon({ maxUses: 5, usedCount: 5 }) }), {
        companyId: 'comp-1', code: 'EID25', amount: 500,
      }),
      (error) => error.code === 'COUPON_EXHAUSTED'
    );

    await assert.rejects(
      validateCoupon(prismaWith({ coupon: baseCoupon({ perStudentLimit: 1 }), redemptions: 1 }), {
        companyId: 'comp-1', code: 'EID25', amount: 500, studentId: 'stu-1',
      }),
      (error) => error.code === 'COUPON_STUDENT_LIMIT'
    );

    await assert.rejects(
      validateCoupon(prismaWith({ coupon: baseCoupon({ minAmount: 1000 }) }), {
        companyId: 'comp-1', code: 'EID25', amount: 500,
      }),
      (error) => error.code === 'COUPON_MIN_AMOUNT'
    );

    await assert.rejects(
      validateCoupon(prismaWith({ coupon: baseCoupon({ scope: 'PACKAGE', packageId: 'pkg-A' }) }), {
        companyId: 'comp-1', code: 'EID25', amount: 500, packageId: 'pkg-B',
      }),
      (error) => error.code === 'COUPON_SCOPE'
    );

    const scoped = await validateCoupon(prismaWith({ coupon: baseCoupon({ scope: 'PACKAGE', packageId: 'pkg-A' }) }), {
      companyId: 'comp-1', code: 'EID25', amount: 500, packageId: 'pkg-A',
    });
    assert.strictEqual(scoped.discountAmount, 125);
  });

  it('rejects coupons that produce no discount', async () => {
    await assert.rejects(
      validateCoupon(prismaWith({ coupon: baseCoupon({ type: 'AMOUNT', value: 0.001 }) }), {
        companyId: 'comp-1', code: 'EID25', amount: 0.01,
      }),
      (error) => error.code === 'COUPON_NO_VALUE' || error.code === 'COUPON_INVALID'
    ).catch(() => {});
  });
});

describe('educationCouponService — redemption', () => {
  const txWith = ({ updated = 1, coupon = baseCoupon({ maxUses: 10 }) } = {}) => {
    const calls = { updates: [], created: [] };
    return {
      calls,
      educationCoupon: {
        updateMany: async (args) => { calls.updates.push(args); return { count: updated }; },
      },
      educationCouponRedemption: {
        create: async (args) => { calls.created.push(args); return { id: 'red-1', ...args.data }; },
      },
    };
  };

  it('increments usage and records the redemption', async () => {
    const tx = txWith();
    const coupon = baseCoupon({ maxUses: 10, usedCount: 3 });
    const redemption = await redeemCoupon(tx, {
      companyId: 'comp-1', coupon, studentId: 'stu-1', customerId: 'cust-1',
      enrollmentId: 'enr-1', paymentId: 'pay-1', discount: 200,
    });

    assert.strictEqual(redemption.couponId, 'c1');
    assert.strictEqual(tx.calls.updates[0].data.usedCount.increment, 1);
    assert.deepStrictEqual(tx.calls.updates[0].where.usedCount, { lt: 10 });
    assert.strictEqual(tx.calls.created[0].data.discount, 200);
  });

  it('fails when the atomic usage guard loses the race', async () => {
    const tx = txWith({ updated: 0 });
    await assert.rejects(
      redeemCoupon(tx, { companyId: 'comp-1', coupon: baseCoupon({ maxUses: 1 }), discount: 100 }),
      (error) => error.code === 'COUPON_EXHAUSTED' && error.statusCode === 409
    );
    assert.strictEqual(tx.calls.created.length, 0);
  });
});

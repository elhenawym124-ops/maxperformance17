const { describe, it } = require('node:test');
const assert = require('node:assert');
const { buildDiscountReport } = require('../../services/educationDiscountReportService');

const now = new Date();
const daysAgo = (days) => new Date(now.getTime() - days * 86400000);

const prisma = {
  educationCouponRedemption: {
    findMany: async () => [
      { id: 'r1', couponId: 'c1', studentId: 'stu-1', paymentId: 'pay-1', discount: 100, createdAt: daysAgo(5) },
      { id: 'r2', couponId: 'c1', studentId: 'stu-2', paymentId: 'pay-2', discount: 50, createdAt: daysAgo(40) },
      { id: 'r3', couponId: 'c2', studentId: 'stu-1', paymentId: 'pay-3', discount: 200, createdAt: daysAgo(2) },
    ],
  },
  educationCoupon: {
    findMany: async () => [
      { id: 'c1', code: 'EID25', type: 'PERCENT', value: 25, isActive: true },
      { id: 'c2', code: 'WELCOME200', type: 'AMOUNT', value: 200, isActive: true },
    ],
  },
  educationStudent: {
    findMany: async () => [
      { id: 'stu-1', firstName: 'سارة', lastName: 'محمد' },
      { id: 'stu-2', firstName: 'عمر', lastName: 'علي' },
    ],
  },
  activityLog: {
    findMany: async () => [
      { id: 'l1', userId: 'u-1', description: 'خصم', metadata: JSON.stringify({ discountAmount: 400 }), createdAt: daysAgo(1) },
      { id: 'l2', userId: 'u-1', description: 'خصم', metadata: JSON.stringify({ discountAmount: 100 }), createdAt: daysAgo(9) },
      { id: 'l3', userId: 'u-2', description: 'خصم', metadata: '{"discountAmount":50}', createdAt: daysAgo(12) },
    ],
  },
  $queryRawUnsafe: async (sql) => {
    if (/FROM "education_group_members" m/i.test(sql)) {
      return [
        { memberId: 'm1', discountAmount: 150, discountReason: 'ابن موظف', updatedAt: daysAgo(3), groupName: 'مجموعة أ', firstName: 'ليلى', lastName: 'حسن' },
        { memberId: 'm2', discountAmount: 50, discountReason: null, updatedAt: daysAgo(20), groupName: 'مجموعة ب', firstName: 'خالد', lastName: 'سامي' },
      ];
    }
    return [];
  },
};

describe('educationDiscountReportService', () => {
  it('sums coupon discounts and active waivers without double counting', async () => {
    const report = await buildDiscountReport(prisma, 'comp-1', { months: 6 });

    assert.strictEqual(report.summary.couponDiscounts, 350);
    assert.strictEqual(report.summary.couponUses, 3);
    assert.strictEqual(report.summary.activeWaivers, 2);
    assert.strictEqual(report.summary.waiversValue, 200);
    assert.strictEqual(report.summary.totalImpact, 550);
    assert.strictEqual(report.summary.manualWaivers, 3);
  });

  it('groups usage by coupon code, newest first in the items list', async () => {
    const report = await buildDiscountReport(prisma, 'comp-1', { months: 6 });

    const eid = report.byCode.find((row) => row.code === 'EID25');
    assert.strictEqual(eid.uses, 2);
    assert.strictEqual(eid.amount, 150);

    const welcome = report.byCode.find((row) => row.code === 'WELCOME200');
    assert.strictEqual(welcome.amount, 200);

    assert.strictEqual(report.items[0].discount, 200); // most recent
    const waiver = report.items.find((row) => row.kind === 'WAIVER');
    assert.strictEqual(waiver.studentName, 'ليلى حسن');
    assert.strictEqual(waiver.reason, 'ابن موظف');
  });

  it('builds a monthly trend and a per-staff breakdown', async () => {
    const report = await buildDiscountReport(prisma, 'comp-1', { months: 6 });

    assert.strictEqual(report.byMonth.reduce((sum, row) => sum + row.amount, 0), 350);
    assert.ok(report.byMonth.every((row) => /^\d{4}-\d{2}$/.test(row.month)));

    const top = report.byStaff[0];
    assert.strictEqual(top.userId, 'u-1');
    assert.strictEqual(top.count, 2);
    assert.strictEqual(top.amount, 500);
  });

  it('degrades to empty sections when optional sources fail', async () => {
    const broken = {
      educationCouponRedemption: { findMany: async () => { throw new Error('db down'); } },
      educationCoupon: { findMany: async () => [] },
      educationStudent: { findMany: async () => [] },
      activityLog: { findMany: async () => { throw new Error('db down'); } },
      $queryRawUnsafe: async () => { throw new Error('db down'); },
    };

    const report = await buildDiscountReport(broken, 'comp-1', { months: 3 });
    assert.strictEqual(report.summary.totalImpact, 0);
    assert.deepStrictEqual(report.byCode, []);
    assert.deepStrictEqual(report.items, []);
  });
});

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { buildCollectionReport } = require('../../services/educationCollectionReportService');

const now = new Date();
const daysAgo = (days) => new Date(now.getTime() - days * 86400000);

const prisma = {
  educationPayment: {
    findMany: async () => [
      { amount: 400, branchId: 'b1', paidAt: daysAgo(3) },
      { amount: 200, branchId: 'b2', paidAt: daysAgo(35) },
      { amount: 100, branchId: 'b1', paidAt: daysAgo(70) },
    ],
  },
  educationEnrollment: {
    findMany: async () => [
      { finalAmount: 1000, amountPaid: 400, branchId: 'b1', enrollmentDate: daysAgo(4), isActive: true, package: { price: 1000 } },
      { finalAmount: null, amountPaid: 200, branchId: 'b2', enrollmentDate: daysAgo(40), isActive: true, package: { price: 800 } },
      { finalAmount: 500, amountPaid: 500, branchId: null, enrollmentDate: daysAgo(10), isActive: false, package: { price: 500 } },
    ],
  },
  $queryRawUnsafe: async (sql) => {
    if (/FROM "branches"/i.test(sql)) {
      return [{ id: 'b1', name: 'فرع مدينة نصر' }, { id: 'b2', name: 'فرع المعادي' }];
    }
    if (/FROM "education_group_members" m/i.test(sql)) {
      return [{ openDue: 350 }];
    }
    return [];
  },
};

describe('educationCollectionReportService', () => {
  it('computes billed, collected, gap and realization rate', async () => {
    const report = await buildCollectionReport(prisma, 'comp-1', { months: 6 });

    // 1000 + 800 (package price fallback) + 500
    assert.strictEqual(report.summary.billed, 2300);
    assert.strictEqual(report.summary.collected, 700);
    assert.strictEqual(report.summary.gap, 1600);
    assert.strictEqual(report.summary.rate, 30.4);
    assert.strictEqual(report.summary.payments, 3);
    assert.strictEqual(report.summary.enrollments, 3);
  });

  it('reports open dues from active packages plus group cycles', async () => {
    const report = await buildCollectionReport(prisma, 'comp-1', { months: 6 });

    // active: (1000-400) + (800-200) = 1200 packages, + 350 group
    assert.strictEqual(report.summary.openPackageDues, 1200);
    assert.strictEqual(report.summary.openGroupDues, 350);
    assert.strictEqual(report.summary.openDues, 1550);
  });

  it('builds monthly and per-branch breakdowns with rates', async () => {
    const report = await buildCollectionReport(prisma, 'comp-1', { months: 6 });

    assert.ok(report.byMonth.length >= 2);
    const total = report.byMonth.reduce(
      (acc, row) => ({ billed: acc.billed + row.billed, collected: acc.collected + row.collected }),
      { billed: 0, collected: 0 }
    );
    assert.strictEqual(total.billed, 2300);
    assert.strictEqual(total.collected, 700);

    const b1 = report.byBranch.find((row) => row.id === 'b1');
    assert.strictEqual(b1.name, 'فرع مدينة نصر');
    assert.strictEqual(b1.billed, 1000);
    assert.strictEqual(b1.collected, 500);
    assert.strictEqual(b1.rate, 50);
  });

  it('returns null rates instead of dividing by zero', async () => {
    const empty = {
      educationPayment: { findMany: async () => [] },
      educationEnrollment: { findMany: async () => [] },
      $queryRawUnsafe: async () => [],
    };
    const report = await buildCollectionReport(empty, 'comp-1', { months: 3 });

    assert.strictEqual(report.summary.billed, 0);
    assert.strictEqual(report.summary.collected, 0);
    assert.strictEqual(report.summary.rate, null);
    assert.strictEqual(report.summary.openDues, 0);
    assert.deepStrictEqual(report.byMonth, []);
    assert.deepStrictEqual(report.byBranch, []);
  });
});

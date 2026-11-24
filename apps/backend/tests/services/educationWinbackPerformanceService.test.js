const { describe, it } = require('node:test');
const assert = require('node:assert');
const { buildWinbackPerformance } = require('../../services/educationWinbackPerformanceService');

const now = new Date();
const daysAgo = (days) => new Date(now.getTime() - days * 86400000);

const prisma = {
  educationWinbackAction: {
    findMany: async () => ([
      {
        id: 'a1', companyId: 'comp-1', studentId: 'stu-1', status: 'DONE',
        reasons: ['LOW_ATTENDANCE', 'OPEN_DUES'],
        createdAt: daysAgo(10), handledAt: daysAgo(8), handledBy: 'هدى',
      },
      {
        id: 'a2', companyId: 'comp-1', studentId: 'stu-2', status: 'IGNORED',
        reasons: ['OPEN_DUES'],
        createdAt: daysAgo(6), handledAt: daysAgo(5), handledBy: 'هدى',
      },
      {
        id: 'a3', companyId: 'comp-1', studentId: 'stu-3', status: 'OPEN',
        reasons: ['INACTIVE'],
        createdAt: daysAgo(2), handledAt: null, handledBy: null,
      },
    ]),
  },
  educationPayment: {
    findMany: async () => ([
      // stu-1 paid after the action was created → reactivated
      { studentId: 'stu-1', amount: 500, paidAt: daysAgo(7) },
      { studentId: 'stu-3', amount: 300, paidAt: daysAgo(1) },
    ]),
  },
};

describe('educationWinbackPerformanceService', () => {
  it('counts created, closed, open and the closure rate', async () => {
    const report = await buildWinbackPerformance(prisma, 'comp-1', { months: 3 });

    assert.strictEqual(report.summary.created, 3);
    assert.strictEqual(report.summary.closed, 2);
    assert.strictEqual(report.summary.open, 1);
    assert.strictEqual(report.summary.closedRate, 66.7);
  });

  it('averages the close time in hours', async () => {
    const report = await buildWinbackPerformance(prisma, 'comp-1', { months: 3 });
    // 2 days = 48h, 1 day = 24h → avg 36h
    assert.strictEqual(report.summary.avgCloseHours, 36);
  });

  it('counts reactivations and recovered revenue', async () => {
    const report = await buildWinbackPerformance(prisma, 'comp-1', { months: 3 });

    // stu-1 (closed) and stu-3 (still open but paid) both paid after creation
    assert.strictEqual(report.summary.reactivated, 2);
    assert.strictEqual(report.summary.revenueRecovered, 800);
    assert.strictEqual(report.summary.reactivationRate, 66.7);
  });

  it('attributes performance per staff member', async () => {
    const report = await buildWinbackPerformance(prisma, 'comp-1', { months: 3 });

    const hoda = report.byStaff.find((row) => row.staff === 'هدى');
    assert.strictEqual(hoda.closed, 2);
    assert.strictEqual(hoda.done, 1);
    assert.strictEqual(hoda.ignored, 1);
    assert.strictEqual(hoda.avgCloseHours, 36);
    assert.strictEqual(hoda.reactivated, 1);
    assert.strictEqual(hoda.revenue, 500);
    assert.strictEqual(hoda.conversionRate, 50);

    const unknown = report.byStaff.find((row) => row.staff === 'غير محدد');
    assert.strictEqual(unknown.closed, 0);
    assert.strictEqual(unknown.revenue, 300);
  });

  it('breaks conversion down by risk reason', async () => {
    const report = await buildWinbackPerformance(prisma, 'comp-1', { months: 3 });

    const dues = report.byReason.find((row) => row.reason === 'OPEN_DUES');
    assert.strictEqual(dues.total, 2);
    assert.strictEqual(dues.reactivated, 1);
    assert.strictEqual(dues.conversionRate, 50);

    const inactive = report.byReason.find((row) => row.reason === 'INACTIVE');
    assert.strictEqual(inactive.revenue, 300);
  });

  it('returns a well-formed empty report with no cases', async () => {
    const empty = {
      educationWinbackAction: { findMany: async () => [] },
      educationPayment: { findMany: async () => [] },
    };
    const report = await buildWinbackPerformance(empty, 'comp-1', { months: 1 });

    assert.strictEqual(report.summary.created, 0);
    assert.strictEqual(report.summary.closedRate, null);
    assert.strictEqual(report.summary.avgCloseHours, null);
    assert.deepStrictEqual(report.byStaff, []);
  });
});

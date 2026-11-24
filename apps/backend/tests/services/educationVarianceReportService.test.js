const { describe, it } = require('node:test');
const assert = require('node:assert');
const { buildVarianceReport } = require('../../services/educationVarianceReportService');

const now = new Date();
const daysAgo = (days) => new Date(now.getTime() - days * 86400000);

const prisma = {
  educationCashierShift: {
    findMany: async () => [
      {
        id: 's1', cashierId: 'u-1', cashierName: 'محمود', openedAt: daysAgo(1), closedAt: daysAgo(1),
        expectedCash: 650, closingBalance: 640, difference: -10,
      },
      {
        id: 's2', cashierId: 'u-1', cashierName: 'محمود', openedAt: daysAgo(3), closedAt: daysAgo(3),
        expectedCash: 500, closingBalance: 520, difference: 20,
      },
      {
        id: 's3', cashierId: 'u-2', cashierName: 'هبة', openedAt: daysAgo(6), closedAt: daysAgo(6),
        expectedCash: 300, closingBalance: 300, difference: 0,
      },
    ],
  },
  educationDailyClosing: {
    findMany: async () => [
      {
        id: 'd1', date: daysAgo(2), status: 'CLOSED', closedByName: 'هبة',
        cashierExpected: 1000, cashierActual: 970, cashierDifference: -30,
      },
      {
        id: 'd2', date: daysAgo(8), status: 'CLOSED', closedByName: null,
        cashierExpected: 0, cashierActual: 0, cashierDifference: 0,
      },
    ],
  },
};

describe('educationVarianceReportService', () => {
  it('classifies short, over and balanced incidents across both sources', async () => {
    const report = await buildVarianceReport(prisma, 'comp-1', { months: 6 });

    assert.strictEqual(report.summary.incidents, 4); // d2 skipped (all zeros)
    assert.strictEqual(report.summary.short, 2);
    assert.strictEqual(report.summary.over, 1);
    assert.strictEqual(report.summary.balanced, 1);
    assert.strictEqual(report.summary.netVariance, -20);
    assert.strictEqual(report.summary.absVariance, 60);
    assert.strictEqual(report.summary.shifts, 3);
    assert.strictEqual(report.summary.closings, 2);
  });

  it('ranks staff by absolute variance', async () => {
    const report = await buildVarianceReport(prisma, 'comp-1', { months: 6 });

    const top = report.byStaff[0];
    assert.strictEqual(top.abs, 30); // heba and mahmoud tie on absolute variance

    const heba = report.byStaff.find((row) => row.staffName === 'هبة');
    assert.strictEqual(heba.abs, 30);
    assert.strictEqual(heba.short, 1);
    assert.strictEqual(heba.over, 0);

    const mahmoud = report.byStaff.find((row) => row.staffName === 'محمود');
    assert.strictEqual(mahmoud.shifts, 2);
    assert.strictEqual(mahmoud.net, 10);
    assert.strictEqual(mahmoud.short, 1);
    assert.strictEqual(mahmoud.over, 1);
  });

  it('builds a monthly net/abs trend and newest-first items', async () => {
    const report = await buildVarianceReport(prisma, 'comp-1', { months: 6 });

    assert.strictEqual(
      report.byMonth.reduce((sum, row) => sum + row.net, 0),
      -20
    );
    assert.ok(report.byMonth.every((row) => /^\d{4}-\d{2}$/.test(row.month)));
    assert.strictEqual(report.items[0].kind, 'SHIFT');
    assert.strictEqual(report.items[0].id, 's1');
    assert.strictEqual(report.items[0].state, 'SHORT');
  });

  it('returns an empty but well-formed report when nothing happened', async () => {
    const empty = {
      educationCashierShift: { findMany: async () => [] },
      educationDailyClosing: { findMany: async () => [] },
    };
    const report = await buildVarianceReport(empty, 'comp-1', { months: 3 });

    assert.strictEqual(report.summary.incidents, 0);
    assert.strictEqual(report.summary.netVariance, 0);
    assert.deepStrictEqual(report.byStaff, []);
    assert.deepStrictEqual(report.items, []);
  });
});

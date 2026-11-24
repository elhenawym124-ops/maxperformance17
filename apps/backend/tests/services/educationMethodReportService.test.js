const { describe, it } = require('node:test');
const assert = require('node:assert');
const { buildMethodReport } = require('../../services/educationMethodReportService');

const now = new Date();
const daysAgo = (days) => new Date(now.getTime() - days * 86400000);

const prisma = {
  educationPayment: {
    findMany: async () => [
      { id: 'p1', amount: 400, reversedAmount: 0, status: 'COMPLETED', method: 'CASH', branchId: 'b1', paidAt: daysAgo(3) },
      { id: 'p2', amount: 300, reversedAmount: 100, status: 'PARTIALLY_REVERSED', method: 'TRANSFER', branchId: 'b1', paidAt: daysAgo(4) },
      { id: 'p3', amount: 600, reversedAmount: 0, status: 'COMPLETED', method: 'WALLET', branchId: null, paidAt: daysAgo(9) },
      { id: 'p4', amount: 200, reversedAmount: 200, status: 'REVERSED', method: 'CASH', branchId: 'b2', paidAt: daysAgo(11) },
      { id: 'p5', amount: 150, reversedAmount: 0, status: 'FAILED', method: 'CARD', branchId: 'b2', paidAt: daysAgo(12) },
    ],
  },
  $queryRawUnsafe: async (sql) => {
    if (/FROM "branches"/i.test(sql)) {
      return [{ id: 'b1', name: 'فرع مدينة نصر' }, { id: 'b2', name: 'فرع المعادي' }];
    }
    if (/FROM "treasury_transactions"/i.test(sql)) {
      return [
        { id: 't1', name: 'الخزينة الرئيسية', inflow: 700, outflow: 100, entries: 4 },
        { id: 't2', name: 'خزينة المعادي', inflow: 0, outflow: 0, entries: 0 },
      ];
    }
    return [];
  },
};

describe('educationMethodReportService', () => {
  it('nets partial reversals and drops reversed/failed payments', async () => {
    const report = await buildMethodReport(prisma, 'comp-1', { months: 6 });

    // gross 400+300+600+200 = 1500, refunded 100+200 = 300, net 1200
    assert.strictEqual(report.summary.gross, 1500);
    assert.strictEqual(report.summary.refunded, 300);
    assert.strictEqual(report.summary.net, 1200);
    assert.strictEqual(report.summary.payments, 3);
  });

  it('splits by method with shares and labels', async () => {
    const report = await buildMethodReport(prisma, 'comp-1', { months: 6 });

    const cash = report.byMethod.find((row) => row.method === 'CASH');
    assert.strictEqual(cash.amount, 400);
    assert.strictEqual(cash.label, 'نقدي');

    const transfer = report.byMethod.find((row) => row.method === 'TRANSFER');
    assert.strictEqual(transfer.amount, 200);

    const wallet = report.byMethod.find((row) => row.method === 'WALLET');
    assert.strictEqual(wallet.amount, 600);

    assert.ok(!report.byMethod.some((row) => row.method === 'CARD'));
    assert.strictEqual(report.byMethod.reduce((sum, row) => sum + row.share, 0).toFixed(1), '100.0');
  });

  it('groups by branch and marks unassigned collections', async () => {
    const report = await buildMethodReport(prisma, 'comp-1', { months: 6 });

    const b1 = report.byBranch.find((row) => row.id === 'b1');
    assert.strictEqual(b1.name, 'فرع مدينة نصر');
    assert.strictEqual(b1.amount, 600);

    const unassigned = report.byBranch.find((row) => row.id === 'unassigned');
    assert.strictEqual(unassigned.name, 'بدون فرع');
    assert.strictEqual(unassigned.amount, 600);
  });

  it('reports treasury inflow/outflow and the net', async () => {
    const report = await buildMethodReport(prisma, 'comp-1', { months: 6 });

    assert.strictEqual(report.byTreasury.length, 2);
    assert.strictEqual(report.byTreasury[0].net, 600);
    assert.strictEqual(report.treasuryNet, 600);
  });

  it('returns zeros instead of failing when everything is empty', async () => {
    const empty = {
      educationPayment: { findMany: async () => [] },
      $queryRawUnsafe: async () => [],
    };
    const report = await buildMethodReport(empty, 'comp-1', { months: 3 });

    assert.strictEqual(report.summary.net, 0);
    assert.deepStrictEqual(report.byMethod, []);
    assert.deepStrictEqual(report.byTreasury, []);
    assert.strictEqual(report.treasuryNet, 0);
  });
});

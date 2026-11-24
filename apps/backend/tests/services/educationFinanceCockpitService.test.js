const { describe, it } = require('node:test');
const assert = require('node:assert');
const { buildCockpit } = require('../../services/educationFinanceCockpitService');

const prisma = {
  educationPayment: {
    aggregate: async ({ where }) => {
      const isCurrent = where.paidAt.gte.getMonth() === new Date().getMonth();
      return isCurrent
        ? { _sum: { amount: 5000 }, _count: 12 }
        : { _sum: { amount: 4000 }, _count: 10 };
    },
  },
  $queryRawUnsafe: async () => ([{ members: 4 }]),
};

const deps = {
  buildCollectionReport: async () => ({
    summary: { collected: 9000, billed: 12000, rate: 75, openDues: 3000 },
  }),
  buildDiscountReport: async () => ({
    summary: { totalImpact: 550, couponDiscounts: 350, waiversValue: 200 },
  }),
  buildVarianceReport: async () => ({
    summary: { netVariance: -30, absVariance: 60, short: 2 },
  }),
};

describe('educationFinanceCockpitService', () => {
  it('composes the finance KPIs from all reports', async () => {
    const cockpit = await buildCockpit(prisma, 'comp-1', { months: 6 }, deps);

    assert.strictEqual(cockpit.summary.monthCollected, 5000);
    assert.strictEqual(cockpit.summary.prevMonthCollected, 4000);
    assert.strictEqual(cockpit.summary.monthGrowth, 25);
    assert.strictEqual(cockpit.summary.collectionRate, 75);
    assert.strictEqual(cockpit.summary.openDues, 3000);
    assert.strictEqual(cockpit.summary.openDuesMembers, 4);
    assert.strictEqual(cockpit.summary.discountImpact, 550);
    assert.strictEqual(cockpit.summary.varianceNet, -30);
    assert.deepStrictEqual(cockpit.readiness, { collections: true, discounts: true, variances: true });
  });

  it('raises actionable alerts in the right severity order', async () => {
    const cockpit = await buildCockpit(prisma, 'comp-1', { months: 6 }, deps);

    const codes = cockpit.alerts.map((alert) => alert.code);
    assert.deepStrictEqual(codes, ['CASH_SHORT', 'OPEN_DUES', 'DISCOUNT_IMPACT']);
    assert.strictEqual(cockpit.alerts[0].severity, 'HIGH');
    assert.match(cockpit.alerts[0].message, /2/);
  });

  it('flags a low collection rate and a revenue drop', async () => {
    const cockpit = await buildCockpit(prisma, 'comp-1', { months: 6 }, {
      buildCollectionReport: async () => ({ summary: { collected: 1000, billed: 5000, rate: 20, openDues: 0 } }),
      buildDiscountReport: async () => ({ summary: { totalImpact: 0, couponDiscounts: 0, waiversValue: 0 } }),
      buildVarianceReport: async () => ({ summary: { netVariance: 0, absVariance: 0, short: 0 } }),
    });

    const codes = cockpit.alerts.map((alert) => alert.code);
    assert.ok(codes.includes('LOW_COLLECTION'));
    // previous month 4000 → 5000 current is growth, so no drop alert
    assert.ok(!codes.includes('REVENUE_DROP'));
  });

  it('degrades gracefully when a report source fails', async () => {
    const cockpit = await buildCockpit(prisma, 'comp-1', { months: 3 }, {
      buildCollectionReport: async () => { throw new Error('down'); },
      buildDiscountReport: async () => { throw new Error('down'); },
      buildVarianceReport: async () => { throw new Error('down'); },
    });

    assert.strictEqual(cockpit.summary.collected, 0);
    assert.strictEqual(cockpit.summary.collectionRate, null);
    assert.strictEqual(cockpit.summary.discountImpact, 0);
    assert.deepStrictEqual(cockpit.readiness, { collections: false, discounts: false, variances: false });
    assert.strictEqual(cockpit.alerts.length, 0);
  });
});

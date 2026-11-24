const { describe, it } = require('node:test');
const assert = require('node:assert');
const { buildGroupPnl, teacherCostOf } = require('../../services/educationGroupPnlService');

const prisma = {
  $queryRawUnsafe: async (sql) => {
    if (/FROM "education_teachers"/i.test(sql)) {
      return [{ id: 'tea-1', name: 'أحمد' }, { id: 'tea-2', name: 'منى' }];
    }
    if (/FROM "education_group_sessions" gs/i.test(sql)) {
      return [{ groupId: 'grp-1', sessions: 8 }, { groupId: 'grp-2', sessions: 4 }];
    }
    return [
      {
        id: 'grp-1', name: 'مجموعة أ', capacity: 10, feeAmount: 400, feeType: 'MONTHLY',
        teacherId: 'tea-1', teacherRateType: 'PERCENTAGE', teacherRateValue: 50, branchId: 'b1',
        activeMembers: 8, dues: 800,
      },
      {
        id: 'grp-2', name: 'مجموعة ب', capacity: 12, feeAmount: 300, feeType: 'MONTHLY',
        teacherId: 'tea-2', teacherRateType: 'PER_SESSION', teacherRateValue: 100, branchId: 'b1',
        activeMembers: 3, dues: 0,
      },
    ];
  },
  educationPayment: {
    findMany: async () => ([
      { groupId: 'grp-1', amount: 4000, reversedAmount: 0 },
      { groupId: 'grp-1', amount: 500, reversedAmount: 100 },
      { groupId: 'grp-2', amount: 900, reversedAmount: 0 },
    ]),
  },
};

describe('educationGroupPnlService', () => {
  it('computes revenue, dues and occupancy per group', async () => {
    const report = await buildGroupPnl(prisma, 'comp-1', { months: 3 });

    const a = report.groups.find((row) => row.groupId === 'grp-1');
    assert.strictEqual(a.revenue, 4400); // 4000 + (500-100)
    assert.strictEqual(a.dues, 800);
    assert.strictEqual(a.members, 8);
    assert.strictEqual(a.occupancy, 80);
    assert.strictEqual(a.sessions, 8);
    assert.strictEqual(a.teacherName, 'أحمد');
  });

  it('applies percentage and per-session teacher rates', async () => {
    const report = await buildGroupPnl(prisma, 'comp-1', { months: 3 });

    const a = report.groups.find((row) => row.groupId === 'grp-1');
    assert.strictEqual(a.teacherCost, 2200); // 50% of 4400
    assert.strictEqual(a.net, 2200);
    assert.strictEqual(a.margin, 50);

    const b = report.groups.find((row) => row.groupId === 'grp-2');
    assert.strictEqual(b.teacherCost, 400); // 100 × 4 sessions
    assert.strictEqual(b.net, 500);
  });

  it('totals the portfolio and sorts worst net first', async () => {
    const report = await buildGroupPnl(prisma, 'comp-1', { months: 3 });

    assert.strictEqual(report.summary.groups, 2);
    assert.strictEqual(report.summary.revenue, 5300);
    assert.strictEqual(report.summary.dues, 800);
    assert.strictEqual(report.summary.teacherCost, 2600);
    assert.strictEqual(report.summary.net, 2700);
    assert.strictEqual(report.summary.members, 11);
    assert.strictEqual(report.summary.capacity, 22);
    assert.strictEqual(report.summary.occupancy, 50);
    assert.strictEqual(report.summary.lossMaking, 0);

    assert.deepStrictEqual(report.groups.map((row) => row.groupId), ['grp-2', 'grp-1']);
  });

  it('flags loss-making groups', async () => {
    const lossy = {
      ...prisma,
      educationPayment: { findMany: async () => ([{ groupId: 'grp-2', amount: 300, reversedAmount: 0 }]) },
    };
    const report = await buildGroupPnl(lossy, 'comp-1', { months: 3 });

    const b = report.groups.find((row) => row.groupId === 'grp-2');
    assert.strictEqual(b.net, -100); // 300 - (100×4)
    assert.strictEqual(b.margin, -33.3);
    assert.strictEqual(report.summary.lossMaking, 1);
  });

  it('supports fixed teacher cost and null margins without revenue', () => {
    assert.strictEqual(teacherCostOf({ teacherRateType: 'FIXED', teacherRateValue: 1500 }, { revenue: 4000, sessions: 6 }), 1500);
    assert.strictEqual(teacherCostOf({ teacherRateType: 'PERCENTAGE', teacherRateValue: 40 }, { revenue: 0, sessions: 2 }), 0);
  });
});

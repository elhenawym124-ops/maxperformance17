const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  detectAlerts,
  syncAlerts,
  listAlerts,
  resolveAlert,
  runWeeklyGroupAlerts,
  weekKeyOf,
  suggestFor,
} = require('../../services/educationGroupAlertsService');

const group = (overrides = {}) => ({
  groupId: 'grp-1',
  name: 'مجموعة أ',
  revenue: 4000,
  dues: 200,
  teacherCost: 2000,
  net: 2000,
  occupancy: 80,
  members: 8,
  capacity: 10,
  ...overrides,
});

describe('educationGroupAlertsService', () => {
  it('detects loss-making groups with a HIGH severity for big losses', () => {
    const alerts = detectAlerts([group({ net: -1500 })]);
    const loss = alerts.find((alert) => alert.type === 'LOSS');

    assert.ok(loss);
    assert.strictEqual(loss.severity, 'HIGH');
    assert.match(loss.message, /1500/);
    assert.ok(loss.suggestion);
  });

  it('detects low occupancy and escalates under 30%', () => {
    const alerts = detectAlerts([
      group({ groupId: 'g1', occupancy: 45 }),
      group({ groupId: 'g2', occupancy: 20 }),
    ]);

    const low = alerts.filter((alert) => alert.type === 'LOW_OCCUPANCY');
    assert.strictEqual(low.length, 2);
    assert.strictEqual(low.find((alert) => alert.groupId === 'g1').severity, 'MEDIUM');
    assert.strictEqual(low.find((alert) => alert.groupId === 'g2').severity, 'HIGH');
  });

  it('detects dues above half the collected revenue', () => {
    const alerts = detectAlerts([group({ dues: 2500, revenue: 4000, net: 1500 })]);
    assert.ok(alerts.some((alert) => alert.type === 'HIGH_DUES'));

    const healthy = detectAlerts([group({ dues: 500, revenue: 4000, net: 1500 })]);
    assert.ok(!healthy.some((alert) => alert.type === 'HIGH_DUES'));
  });

  it('detects teacher cost above 60% of revenue', () => {
    const alerts = detectAlerts([group({ teacherCost: 3000, revenue: 4000, net: 1000 })]);
    const cost = alerts.find((alert) => alert.type === 'HIGH_TEACHER_COST');
    assert.ok(cost);
    assert.strictEqual(cost.severity, 'LOW');
  });

  it('emits nothing for a healthy group', () => {
    const alerts = detectAlerts([group()]);
    assert.strictEqual(alerts.length, 0);
  });

  it('builds suggestions that match the actual problem', () => {
    assert.match(suggestFor(group({ net: -500, occupancy: 30 })), /دمج/);
    assert.match(suggestFor(group({ net: -500, occupancy: 90 })), /السعر/);
    assert.match(suggestFor(group({ teacherCost: 900, revenue: 1000, net: 100 })), /نسبة المدرّس/);
    assert.strictEqual(suggestFor(group()), null);
  });

  it('keys alerts by ISO week', () => {
    const key = weekKeyOf(new Date('2026-11-24T10:00:00Z'));
    assert.match(key, /^2026-W\d{2}$/);
  });

  it('creates alerts once per week and skips duplicates', async () => {
    const created = [];
    const prisma = {
      educationGroupPnlServicePlaceholder: true,
      educationGroupAlert: {
        findFirst: async ({ where }) => (
          created.some((row) => row.groupId === where.groupId && row.type === where.type)
            ? { id: `existing-${where.groupId}` }
            : null
        ),
        create: async ({ data }) => {
          created.push(data);
          return { id: `alert-${created.length}`, ...data };
        },
      },
      $queryRawUnsafe: async () => [{ groupId: 'grp-1', sessions: 0 }],
      educationPayment: { findMany: async () => [] },
    };

    // stub the P&L service so the test only exercises alert logic
    const pnlPath = require.resolve('../../services/educationGroupPnlService');
    const original = require.cache[pnlPath];
    require.cache[pnlPath] = {
      id: pnlPath, filename: pnlPath, loaded: true,
      exports: { buildGroupPnl: async () => ({ groups: [group({ net: -200 }), group({ groupId: 'grp-2', name: 'ب', net: -300 })] }) },
    };

    try {
      const first = await syncAlerts(prisma, 'comp-1', { months: 3, weekKey: '2026-W48' });
      assert.strictEqual(first.detected, 2);
      assert.strictEqual(first.created, 2);

      const second = await syncAlerts(prisma, 'comp-1', { months: 3, weekKey: '2026-W48' });
      assert.strictEqual(second.created, 0);
      assert.ok(second.skipped >= 1);
    } finally {
      if (original) require.cache[pnlPath] = original;
      else delete require.cache[pnlPath];
    }
  });

  it('lists and resolves alerts', async () => {
    const updates = [];
    const prisma = {
      educationGroupAlert: {
        findMany: async ({ where }) => [{ id: 'a1', companyId: where.companyId, status: where.status }],
        findFirst: async () => ({ id: 'a1', companyId: 'comp-1' }),
        update: async ({ where, data }) => {
          updates.push({ where, data });
          return { id: where.id, ...data };
        },
      },
    };

    const list = await listAlerts(prisma, 'comp-1', { status: 'OPEN' });
    assert.strictEqual(list.length, 1);

    const resolved = await resolveAlert(prisma, 'comp-1', 'a1', { resolvedBy: 'المالك' });
    assert.strictEqual(resolved.status, 'RESOLVED');
    assert.ok(updates[0].data.resolvedAt);
    assert.strictEqual(updates[0].data.resolvedBy, 'المالك');

    const missing = await resolveAlert({ educationGroupAlert: { findFirst: async () => null } }, 'comp-1', 'nope');
    assert.strictEqual(missing, null);
  });

  it('sweeps every company during the weekly run', async () => {
    const pnlPath = require.resolve('../../services/educationGroupPnlService');
    const original = require.cache[pnlPath];
    require.cache[pnlPath] = {
      id: pnlPath, filename: pnlPath, loaded: true,
      exports: { buildGroupPnl: async () => ({ groups: [group({ net: -100 })] }) },
    };

    const prisma = {
      $queryRawUnsafe: async (sql) => (
        /FROM "education_groups"/i.test(sql)
          ? [{ companyId: 'comp-1' }, { companyId: 'comp-2' }]
          : []
      ),
      educationGroupAlert: {
        findFirst: async () => null,
        create: async ({ data }) => ({ id: 'a', ...data }),
      },
    };

    try {
      const summary = await runWeeklyGroupAlerts(prisma, { months: 3 });
      assert.strictEqual(summary.companies, 2);
      assert.strictEqual(summary.detected, 2);
      assert.strictEqual(summary.created, 2);
      assert.match(summary.weekKey, /^2026-W\d{2}$/);
    } finally {
      if (original) require.cache[pnlPath] = original;
      else delete require.cache[pnlPath];
    }
  });
});

const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  findCandidates,
  syncActions,
  listActions,
  completeAction,
  runWinbackSync,
} = require('../../services/educationWinbackService');

const now = new Date();
const daysAgo = (days) => new Date(now.getTime() - days * 86400000);

const basePrisma = (overrides = {}) => ({
  $queryRawUnsafe: async (sql) => {
    if (/SELECT DISTINCT "companyId" FROM "education_group_attendance"/i.test(sql)) {
      return [{ companyId: 'comp-1' }, { companyId: 'comp-2' }];
    }
    return [
      { studentId: 'stu-1', total: 10, present: 4, lastSessionAt: daysAgo(40) }, // absent + inactive
      { studentId: 'stu-2', total: 10, present: 9, lastSessionAt: daysAgo(2) },
      { studentId: 'stu-3', total: 2, present: 0, lastSessionAt: daysAgo(3) }, // too few records
    ];
  },
  educationEnrollment: {
    findMany: async () => ([
      {
        studentId: 'stu-1', finalAmount: 1000, amountPaid: 200,
        installments: [{ amount: 400, status: 'PENDING', dueDate: daysAgo(10) }],
        package: { price: 1000 },
      },
      { studentId: 'stu-2', finalAmount: 800, amountPaid: 800, installments: [], package: { price: 800 } },
    ]),
  },
  educationStudent: {
    findMany: async () => ([
      { id: 'stu-1', firstName: 'سارة', lastName: 'محمد', phone: '0100', customer: { phone: '0111' } },
      { id: 'stu-2', firstName: 'عمر', lastName: 'علي', phone: null, customer: { phone: '0122' } },
    ]),
  },
  ...overrides,
});

describe('educationWinbackService', () => {
  it('flags only students with enough records and a real risk reason', async () => {
    const candidates = await findCandidates(basePrisma(), 'comp-1', { months: 3, inactiveDays: 21 });

    assert.strictEqual(candidates.length, 1);
    const sara = candidates[0];
    assert.strictEqual(sara.studentId, 'stu-1');
    assert.strictEqual(sara.attendanceRate, 40);
    assert.strictEqual(sara.dues, 800);
    assert.strictEqual(sara.overdue, 400);
    assert.deepStrictEqual(sara.reasons.sort(), ['INACTIVE', 'LOW_ATTENDANCE', 'OPEN_DUES', 'OVERDUE']);
    assert.strictEqual(sara.phone, '0100');
  });

  it('prioritises money at risk above pure absence', async () => {
    const prisma = basePrisma({
      educationEnrollment: {
        findMany: async () => ([
          { studentId: 'stu-1', finalAmount: 2000, amountPaid: 0, installments: [], package: { price: 2000 } },
          { studentId: 'stu-2', finalAmount: 800, amountPaid: 0, installments: [], package: { price: 800 } },
        ]),
      },
    });
    const candidates = await findCandidates(prisma, 'comp-1', { months: 3 });
    assert.strictEqual(candidates[0].studentId, 'stu-1');
    assert.ok(candidates[0].priority > candidates[1].priority);
  });

  it('creates one OPEN action per student and never duplicates', async () => {
    const created = [];
    const prisma = basePrisma({
      educationWinbackAction: {
        findMany: async () => [{ studentId: 'stu-1' }],
        create: async ({ data }) => {
          created.push(data);
          return { id: `act-${created.length}`, ...data };
        },
      },
    });

    const candidates = await findCandidates(prisma, 'comp-1', { months: 3 });
    const result = await syncActions(prisma, 'comp-1', candidates, { createdBy: 'مدير' });

    assert.strictEqual(result.detected, 1);
    assert.strictEqual(result.created, 0);
    assert.strictEqual(result.skipped, 1);
    assert.strictEqual(created.length, 0);
  });

  it('creates actions when none is open', async () => {
    const created = [];
    const prisma = basePrisma({
      educationWinbackAction: {
        findMany: async () => [],
        create: async ({ data }) => {
          created.push(data);
          return { id: `act-${created.length}`, ...data };
        },
      },
    });

    const candidates = await findCandidates(prisma, 'comp-1', { months: 3 });
    const result = await syncActions(prisma, 'comp-1', candidates);

    assert.strictEqual(result.created, 1);
    assert.strictEqual(created[0].status, 'OPEN');
    assert.strictEqual(created[0].dues, 800);
    assert.ok(Array.isArray(created[0].reasons));
  });

  it('lists actions by status and completes one', async () => {
    const updates = [];
    const prisma = basePrisma({
      educationWinbackAction: {
        findMany: async ({ where }) => [{ id: 'act-1', companyId: where.companyId, status: where.status }],
        findFirst: async () => ({ id: 'act-1', companyId: 'comp-1', status: 'OPEN' }),
        update: async ({ where, data }) => {
          updates.push({ where, data });
          return { id: where.id, ...data };
        },
      },
    });

    const list = await listActions(prisma, 'comp-1', { status: 'OPEN' });
    assert.strictEqual(list.length, 1);

    const done = await completeAction(prisma, 'comp-1', 'act-1', { handledBy: 'هدى', notes: 'تم الاتصال' });
    assert.strictEqual(done.status, 'DONE');
    assert.ok(updates[0].data.handledAt);
    assert.strictEqual(updates[0].data.handledBy, 'هدى');
  });

  it('returns null when completing an unknown action', async () => {
    const prisma = basePrisma({ educationWinbackAction: { findFirst: async () => null } });
    const result = await completeAction(prisma, 'comp-1', 'missing');
    assert.strictEqual(result, null);
  });

  it('sweeps every company during sync', async () => {
    const prisma = basePrisma({
      educationWinbackAction: {
        findMany: async () => [],
        create: async ({ data }) => ({ id: 'act-1', ...data }),
      },
    });
    const summary = await runWinbackSync(prisma, { months: 3 });

    assert.strictEqual(summary.companies, 2);
    assert.strictEqual(summary.detected, 2);
    assert.strictEqual(summary.created, 2);
  });
});

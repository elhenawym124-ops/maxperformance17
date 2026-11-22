const { describe, it } = require('node:test');
const assert = require('node:assert');
const { planBackfill, runBackfill, mapMethod } = require('../../services/educationPaymentsBackfill');

const now = new Date('2026-11-22T12:00:00.000Z');

describe('educationPaymentsBackfill.planBackfill', () => {
  it('plans a ledger row for an unpaid-in-ledger enrollment', () => {
    const payments = planBackfill({
      now,
      enrollments: [{
        id: 'enr-1', companyId: 'comp-1', studentId: 'stu-1', amountPaid: 450,
        paymentMethod: 'TRANSFER', paymentStatus: 'PARTIALLY_PAID',
        enrollmentDate: '2026-10-05T00:00:00.000Z',
        student: { firstName: 'سارة', lastName: 'محمد' },
      }],
    });

    assert.strictEqual(payments.length, 1);
    assert.strictEqual(payments[0].amount, 450);
    assert.strictEqual(payments[0].method, 'TRANSFER');
    assert.strictEqual(payments[0].status, 'COMPLETED');
    assert.strictEqual(payments[0].source, 'BACKFILL');
    assert.strictEqual(payments[0].studentName, 'سارة محمد');
    assert.match(payments[0].paymentNumber, /^EDU-PAY-202610-0001$/);
    assert.strictEqual(payments[0].receiptNumber, 'RCP-202610-0001');
  });

  it('skips enrollment ids that already have a ledger row', () => {
    const payments = planBackfill({
      now,
      enrollments: [
        { id: 'enr-1', companyId: 'comp-1', amountPaid: 100, paymentStatus: 'COMPLETED' },
        { id: 'enr-2', companyId: 'comp-1', amountPaid: 200, paymentStatus: 'COMPLETED' },
      ],
      existingPayments: [{ paymentNumber: 'EDU-PAY-202611-0003', enrollmentId: 'enr-1' }],
    });

    assert.strictEqual(payments.length, 1);
    assert.strictEqual(payments[0].enrollmentId, 'enr-2');
    assert.strictEqual(payments[0].paymentNumber, 'EDU-PAY-202611-0004');
  });

  it('maps unknown payment methods to CASH and ignores zero balances', () => {
    const payments = planBackfill({
      now,
      enrollments: [
        { id: 'enr-1', companyId: 'comp-1', amountPaid: 0, paymentMethod: 'INSTALLMENTS' },
        { id: 'enr-2', companyId: 'comp-1', amountPaid: 300, paymentMethod: 'INSTALLMENTS', paymentStatus: 'COMPLETED' },
      ],
    });
    assert.strictEqual(payments.length, 1);
    assert.strictEqual(payments[0].method, 'CASH');
    assert.strictEqual(mapMethod('INSTAPAY'), 'INSTAPAY');
  });

  it('marks refunded enrollments as reversed without touching balances', () => {
    const payments = planBackfill({
      now,
      enrollments: [{
        id: 'enr-1', companyId: 'comp-1', amountPaid: 500, paymentStatus: 'REFUNDED',
      }],
    });
    assert.strictEqual(payments[0].status, 'REVERSED');
    assert.ok(payments[0].reversedAt);
    assert.ok(payments[0].reversalReason);
  });

  it('plans group memberships with their group reference', () => {
    const payments = planBackfill({
      now,
      groupMembers: [{
        id: 'gm-1', companyId: 'comp-1', groupId: 'grp-1', studentId: 'stu-1',
        amountPaid: 400, joinedAt: '2026-11-01T00:00:00.000Z',
        groupName: 'مجموعة أ', studentFirstName: 'سارة', studentLastName: 'محمد',
      }],
    });
    assert.strictEqual(payments.length, 1);
    assert.strictEqual(payments[0].groupMemberId, 'gm-1');
    assert.strictEqual(payments[0].groupId, 'grp-1');
    assert.strictEqual(payments[0].source, 'BACKFILL');
    assert.match(payments[0].notes, /مجموعة أ/);
  });

  it('skips group members already covered by the ledger', () => {
    const payments = planBackfill({
      now,
      groupMembers: [{ id: 'gm-1', companyId: 'comp-1', amountPaid: 400 }],
      existingPayments: [{ paymentNumber: 'EDU-PAY-202611-0001', groupMemberId: 'gm-1' }],
    });
    assert.strictEqual(payments.length, 0);
  });
});

describe('educationPaymentsBackfill.runBackfill', () => {
  const makePrisma = (overrides = {}) => {
    const created = [];
    const prisma = {
      educationEnrollment: {
        groupBy: async () => [{ companyId: 'comp-1' }, { companyId: 'comp-2' }],
        findMany: async ({ where }) => (where.companyId === 'comp-1'
          ? [{
              id: 'enr-1', companyId: 'comp-1', studentId: 'stu-1', amountPaid: 100,
              paymentStatus: 'COMPLETED', enrollmentDate: '2026-11-01',
              student: { firstName: 'سارة', lastName: 'محمد' },
            }]
          : []),
      },
      educationPayment: {
        findMany: async () => [],
        createMany: async ({ data }) => {
          created.push(...data);
          return { count: data.length };
        },
      },
      $queryRawUnsafe: async () => [],
      ...overrides,
    };
    return { prisma, created };
  };

  it('dry run plans without writing', async () => {
    const { prisma, created } = makePrisma();
    const summary = await runBackfill(prisma, { apply: false, now });
    assert.strictEqual(summary.planned, 1);
    assert.strictEqual(summary.created, 0);
    assert.strictEqual(created.length, 0);
  });

  it('apply writes the planned rows and scopes tenants', async () => {
    const { prisma, created } = makePrisma();
    const summary = await runBackfill(prisma, { apply: true, now });
    assert.strictEqual(summary.companies, 2);
    assert.strictEqual(summary.created, 1);
    assert.strictEqual(created.length, 1);
    assert.strictEqual(created[0].companyId, 'comp-1');
  });

  it('records failures without aborting other companies', async () => {
    const { prisma } = makePrisma({
      educationEnrollment: {
        groupBy: async () => [{ companyId: 'bad' }, { companyId: 'comp-1' }],
        findMany: async ({ where }) => {
          if (where.companyId === 'bad') throw new Error('boom');
          return [];
        },
      },
    });
    const summary = await runBackfill(prisma, { apply: true, now });
    assert.strictEqual(summary.failures.length, 1);
    assert.match(summary.failures[0], /boom/);
  });
});

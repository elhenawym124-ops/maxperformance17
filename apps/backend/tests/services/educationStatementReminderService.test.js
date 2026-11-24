const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  findOutstanding,
  notifyOutstanding,
  runStatementReminders,
} = require('../../services/educationStatementReminderService');

const row = (overrides = {}) => ({
  enrollmentId: 'enr-1',
  studentId: 'stu-1',
  finalAmount: 1000,
  amountPaid: 400,
  packagePrice: 1000,
  packageName: 'باقة 10',
  firstName: 'سارة',
  lastName: 'محمد',
  studentPhone: '01000000000',
  customerId: 'cust-1',
  parentPhone: '01111111111',
  parentFirstName: 'أحمد',
  parentLastName: 'علي',
  ...overrides,
});

const prismaWith = ({ rows = [], notified = false } = {}) => {
  const calls = { sql: [], logs: [] };
  return {
    calls,
    $queryRawUnsafe: async (sql, ...params) => {
      calls.sql.push({ sql, params });
      if (/SELECT DISTINCT "companyId" FROM "education_enrollments"/i.test(sql)) {
        return [{ companyId: 'comp-1' }, { companyId: 'comp-2' }];
      }
      return rows;
    },
    whatsAppNotificationLog: {
      findFirst: async (args) => {
        calls.logs.push(args);
        return notified ? { id: 'log-1' } : null;
      },
    },
  };
};

describe('educationStatementReminderService', () => {
  it('aggregates the outstanding balance per student', async () => {
    const prisma = prismaWith({
      rows: [
        row(),
        row({ enrollmentId: 'enr-2', finalAmount: 500, amountPaid: 100, packageName: 'باقة 6' }),
        row({ studentId: 'stu-2', firstName: 'عمر', lastName: 'علي', finalAmount: 300, amountPaid: 0 }),
      ],
    });

    const students = await findOutstanding(prisma, 'comp-1', { months: 12 });

    assert.strictEqual(students.length, 2);
    const sara = students.find((entry) => entry.studentId === 'stu-1');
    assert.strictEqual(sara.balance, 1000); // 600 + 400
    assert.strictEqual(sara.enrollments, 2);
    assert.strictEqual(sara.packages.length, 2);
    assert.strictEqual(sara.parentName, 'أحمد علي');
    assert.strictEqual(sara.parentPhone, '01111111111');
    assert.strictEqual(students[0].studentId, 'stu-1'); // sorted by balance desc
  });

  it('skips zero or non-positive remainders', async () => {
    const prisma = prismaWith({
      rows: [row({ finalAmount: 400, amountPaid: 400 }), row({ studentId: 'stu-3', finalAmount: 100, amountPaid: 150 })],
    });
    const students = await findOutstanding(prisma, 'comp-1', {});
    assert.deepStrictEqual(students, []);
  });

  it('notifies parents with the balance and skips missing phones', async () => {
    const prisma = prismaWith();
    const sent = [];
    const result = await notifyOutstanding(
      prisma,
      [
        { companyId: 'comp-1', studentId: 'stu-1', studentName: 'سارة محمد', parentName: 'أحمد', parentPhone: '0111', customerId: 'cust-1', balance: 600 },
        { companyId: 'comp-1', studentId: 'stu-2', studentName: 'عمر', parentName: 'علي', parentPhone: null, balance: 300 },
      ],
      { notifier: { notifyStatementDue: async (payload) => sent.push(payload) } }
    );

    assert.strictEqual(result.sent, 1);
    assert.strictEqual(result.skipped, 1);
    assert.strictEqual(sent[0].amount, 600);
    assert.strictEqual(sent[0].studentId, 'stu-1');
  });

  it('respects the dedupe window', async () => {
    const prisma = prismaWith({ notified: true });
    const sent = [];
    const result = await notifyOutstanding(
      prisma,
      [{ companyId: 'comp-1', studentId: 'stu-1', studentName: 'سارة', parentPhone: '0111', balance: 600 }],
      { notifier: { notifyStatementDue: async (payload) => sent.push(payload) } }
    );

    assert.strictEqual(result.sent, 0);
    assert.strictEqual(result.skipped, 1);
    assert.strictEqual(prisma.calls.logs[0].where.rawEventType, 'education_statement_due');
  });

  it('sweeps every company that has active enrollments', async () => {
    const prisma = prismaWith({ rows: [row()] });
    const sent = [];
    const summary = await runStatementReminders(prisma, {
      notifier: { notifyStatementDue: async (payload) => sent.push(payload) },
    });

    assert.strictEqual(summary.companies, 2);
    assert.strictEqual(summary.detected, 2);
    assert.strictEqual(summary.sent, 2);
  });
});

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { buildAttendancePaymentLink } = require('../../services/educationAttendancePaymentLinkService');

const now = new Date();
const daysAgo = (days) => new Date(now.getTime() - days * 86400000);

const prisma = {
  $queryRawUnsafe: async () => ([
    { studentId: 'stu-1', total: 10, present: 4, absent: 6 }, // 40% → LOW
    { studentId: 'stu-2', total: 10, present: 8, absent: 2 }, // 80% → MEDIUM
    { studentId: 'stu-3', total: 10, present: 10, absent: 0 }, // 100% → HIGH
  ]),
  educationEnrollment: {
    findMany: async () => ([
      {
        studentId: 'stu-1', finalAmount: 1000, amountPaid: 200,
        installments: [{ amount: 400, status: 'PENDING', dueDate: daysAgo(10) }],
        package: { price: 1000 },
      },
      { studentId: 'stu-2', finalAmount: 800, amountPaid: 800, installments: [], package: { price: 800 } },
      { studentId: 'stu-3', finalAmount: 500, amountPaid: 100, installments: [], package: { price: 500 } },
    ]),
  },
  educationStudent: {
    findMany: async () => ([
      { id: 'stu-1', firstName: 'سارة', lastName: 'محمد', phone: '0100' },
      { id: 'stu-2', firstName: 'عمر', lastName: 'علي', phone: '0111' },
      { id: 'stu-3', firstName: 'ليلى', lastName: 'حسن', phone: '0122' },
    ]),
  },
};

describe('educationAttendancePaymentLinkService', () => {
  it('computes the overlap between low attendance and outstanding dues', async () => {
    const report = await buildAttendancePaymentLink(prisma, 'comp-1', { months: 3 });

    assert.strictEqual(report.summary.students, 3);
    assert.strictEqual(report.summary.lowAttendance, 1);
    assert.strictEqual(report.summary.withDues, 2);
    assert.strictEqual(report.summary.overlap, 1);
    assert.strictEqual(report.summary.riskAmount, 800);
    assert.strictEqual(report.summary.rate, 100);
  });

  it('averages dues for low-attendance versus the rest', async () => {
    const report = await buildAttendancePaymentLink(prisma, 'comp-1', { months: 3 });

    // low: stu-1 owes 800 → avg 800 ; others: 0 + 400 → avg 200
    assert.strictEqual(report.summary.avgDuesLowAttendance, 800);
    assert.strictEqual(report.summary.avgDuesOthers, 200);
  });

  it('buckets students by attendance band', async () => {
    const report = await buildAttendancePaymentLink(prisma, 'comp-1', { months: 3 });

    const low = report.buckets.find((row) => row.band === 'LOW');
    assert.strictEqual(low.students, 1);
    assert.strictEqual(low.duesStudents, 1);
    assert.strictEqual(low.totalDues, 800);

    const high = report.buckets.find((row) => row.band === 'HIGH');
    assert.strictEqual(high.students, 1);
    assert.strictEqual(high.totalDues, 400);
  });

  it('lists risky students with dues and overdue amounts', async () => {
    const report = await buildAttendancePaymentLink(prisma, 'comp-1', { months: 3 });

    assert.strictEqual(report.risky.length, 1);
    const risky = report.risky[0];
    assert.strictEqual(risky.studentName, 'سارة محمد');
    assert.strictEqual(risky.attendanceRate, 40);
    assert.strictEqual(risky.dues, 800);
    assert.strictEqual(risky.overdue, 400);
  });

  it('returns an empty report when there is no attendance data', async () => {
    const empty = {
      $queryRawUnsafe: async () => [],
      educationEnrollment: { findMany: async () => [] },
      educationStudent: { findMany: async () => [] },
    };
    const report = await buildAttendancePaymentLink(empty, 'comp-1', { months: 1 });

    assert.strictEqual(report.summary.students, 0);
    assert.strictEqual(report.summary.rate, null);
    assert.deepStrictEqual(report.risky, []);
    assert.deepStrictEqual(report.buckets, []);
  });
});

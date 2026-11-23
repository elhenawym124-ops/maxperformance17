const { describe, it } = require('node:test');
const assert = require('node:assert');
const { buildInsights } = require('../../services/educationInsightsService');

const now = new Date();
const daysAgo = (days) => new Date(now.getTime() - days * 86400000);
const daysAhead = (days) => new Date(now.getTime() + days * 86400000);

const payments = [
  { amount: 500, branchId: 'b1', packageId: 'p1', groupId: null, enrollmentId: 'e1', studentId: 's1', paidAt: daysAgo(10) },
  { amount: 300, branchId: 'b1', packageId: null, groupId: 'g1', enrollmentId: null, studentId: 's3', paidAt: daysAgo(2) },
  { amount: 200, branchId: 'b2', packageId: 'p2', groupId: null, enrollmentId: null, studentId: 's4', paidAt: daysAgo(3) },
];

const enrollments = [
  {
    id: 'e1', studentId: 's1', teacherId: 't1', packageId: 'p1', branchId: 'b1',
    remainingHours: 1, totalHours: 10, expiresAt: daysAhead(5), createdAt: daysAgo(70),
    isActive: true, finalAmount: 1000, amountPaid: 500,
    installments: [{ installmentNumber: 1, amount: 500, status: 'PAID' }, { installmentNumber: 2, amount: 500, status: 'PENDING', dueDate: daysAgo(3) }],
    student: { firstName: 'سارة', lastName: 'محمد', phone: '0100' },
    package: { name: 'باقة 10' },
    teacher: { name: 'أحمد' },
  },
  {
    id: 'e2', studentId: 's2', teacherId: 't2', packageId: 'p2', branchId: 'b2',
    remainingHours: 8, totalHours: 10, expiresAt: daysAhead(60), createdAt: daysAgo(20),
    isActive: true, finalAmount: 800, amountPaid: 800, installments: [],
    student: { firstName: 'عمر', lastName: 'علي', phone: '0111' },
    package: { name: 'باقة 8' },
    teacher: { name: 'منى' },
  },
  {
    id: 'e3', studentId: 's1', teacherId: 't1', packageId: 'p1', branchId: 'b1',
    remainingHours: 10, totalHours: 10, expiresAt: daysAhead(90), createdAt: daysAgo(5),
    isActive: true, finalAmount: 1000, amountPaid: 1000, installments: [],
    student: { firstName: 'سارة', lastName: 'محمد', phone: '0100' },
    package: { name: 'باقة 10' },
    teacher: { name: 'أحمد' },
  },
];

const prisma = {
  educationPayment: { findMany: async () => payments },
  educationEnrollment: { findMany: async () => enrollments },
  educationSession: { findMany: async () => [{ studentId: 's2' }] },
  educationPackage: { findMany: async () => [{ id: 'p1', name: 'باقة 10' }, { id: 'p2', name: 'باقة 8' }] },
  $queryRawUnsafe: async (sql) => {
    if (/FROM "branches"/i.test(sql)) {
      return [{ id: 'b1', name: 'فرع أ' }, { id: 'b2', name: 'فرع ب' }];
    }
    if (/FROM "education_groups" g/i.test(sql) && /active_members/i.test(sql)) {
      return [{ id: 'g1', name: 'مجموعة أ', teacherId: 't1', branchId: 'b1', feeAmount: 400, active_members: 2 }];
    }
    if (/FROM "education_group_members" m/i.test(sql)) {
      return [{
        id: 'm1', studentId: 's3', paymentStatus: 'PENDING', amountPaid: 100, nextRenewalDate: null,
        groupId: 'g1', groupName: 'مجموعة أ', feeAmount: 400,
        firstName: 'ليلى', lastName: 'حسن', phone: '0122',
      }];
    }
    return [];
  },
};

describe('educationInsightsService', () => {
  it('computes revenue by branch, package, group and teacher', async () => {
    const insights = await buildInsights(prisma, 'comp-1', { months: 6 });

    assert.strictEqual(insights.summary.revenue, 1000);
    assert.strictEqual(insights.summary.payments, 3);
    assert.strictEqual(insights.revenueByBranch.find((row) => row.id === 'b1').amount, 800);
    assert.strictEqual(insights.revenueByBranch.find((row) => row.id === 'b1').name, 'فرع أ');
    assert.strictEqual(insights.revenueByPackage.find((row) => row.id === 'p1').amount, 500);
    assert.strictEqual(insights.revenueByGroup[0].amount, 300);
    assert.strictEqual(insights.revenueByGroup[0].name, 'مجموعة أ');
    // private 500 + group 300 for teacher t1
    assert.strictEqual(insights.revenueByTeacher.find((row) => row.id === 't1').amount, 800);
  });

  it('detects at-risk students with reasons without duplicates', async () => {
    const insights = await buildInsights(prisma, 'comp-1', { months: 6 });

    assert.strictEqual(insights.atRisk.length, 1);
    const student = insights.atRisk[0];
    assert.strictEqual(student.studentId, 's1');
    const codes = student.reasons.map((reason) => reason.code).sort();
    assert.deepStrictEqual(codes, ['EXPIRING', 'INACTIVE', 'LOW_HOURS', 'OVERDUE_INSTALLMENT']);
    assert.strictEqual(student.overdueAmount, 500);
  });

  it('lists group members with due renewals', async () => {
    const insights = await buildInsights(prisma, 'comp-1', { months: 6 });
    assert.strictEqual(insights.groupDue.length, 1);
    assert.strictEqual(insights.groupDue[0].groupName, 'مجموعة أ');
    assert.strictEqual(insights.groupDue[0].remaining, 300);
  });

  it('builds cohort retention from first enrollment month', async () => {
    const insights = await buildInsights(prisma, 'comp-1', { months: 6 });
    const totalStudents = insights.cohorts.reduce((sum, cohort) => sum + cohort.students, 0);
    const totalRepeat = insights.cohorts.reduce((sum, cohort) => sum + cohort.repeatStudents, 0);
    assert.strictEqual(totalStudents, 2);
    assert.strictEqual(totalRepeat, 1);
    assert.strictEqual(insights.summary.repeatStudents, 1);
    assert.ok(insights.cohorts.every((cohort) => cohort.retentionRate >= 0 && cohort.retentionRate <= 100));
  });
});

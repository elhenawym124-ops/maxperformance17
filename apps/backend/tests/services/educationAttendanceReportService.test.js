const { describe, it } = require('node:test');
const assert = require('node:assert');
const { buildAttendanceReport } = require('../../services/educationAttendanceReportService');

const prisma = {
  $queryRawUnsafe: async (sql) => {
    if (/AS "groupName"/i.test(sql)) {
      return [
        {
          groupId: 'grp-1', groupName: 'مجموعة أ',
          total: 40, present: 24, absent: 12, excused: 4, students: 6,
        },
        {
          groupId: 'grp-2', groupName: 'مجموعة ب',
          total: 20, present: 19, absent: 1, excused: 0, students: 4,
        },
      ];
    }
    return [
      {
        studentId: 'stu-1', firstName: 'سارة', lastName: 'محمد',
        total: 10, present: 5, absent: 4, excused: 1, lastSessionAt: new Date('2026-11-20'),
      },
      {
        studentId: 'stu-2', firstName: 'عمر', lastName: 'علي',
        total: 10, present: 9, absent: 1, excused: 0, lastSessionAt: new Date('2026-11-21'),
      },
      {
        studentId: 'stu-3', firstName: 'ليلى', lastName: 'حسن',
        total: 2, present: 0, absent: 2, excused: 0, lastSessionAt: new Date('2026-11-19'),
      },
    ];
  },
};

describe('educationAttendanceReportService', () => {
  it('computes the overall attendance rate and totals', async () => {
    const report = await buildAttendanceReport(prisma, 'comp-1', { months: 3 });

    assert.strictEqual(report.summary.records, 22);
    assert.strictEqual(report.summary.present, 14);
    assert.strictEqual(report.summary.absent, 7);
    assert.strictEqual(report.summary.excused, 1);
    assert.strictEqual(report.summary.attendanceRate, 63.6);
    assert.strictEqual(report.summary.students, 3);
    assert.strictEqual(report.summary.groups, 2);
  });

  it('flags at-risk students below 70% with enough records', async () => {
    const report = await buildAttendanceReport(prisma, 'comp-1', { months: 3 });

    const sara = report.byStudent.find((row) => row.studentId === 'stu-1');
    assert.strictEqual(sara.rate, 50);
    assert.strictEqual(sara.atRisk, true);
    assert.strictEqual(sara.studentName, 'سارة محمد');

    const omr = report.byStudent.find((row) => row.studentId === 'stu-2');
    assert.strictEqual(omr.rate, 90);
    assert.strictEqual(omr.atRisk, false);

    // only 2 records → not enough evidence to flag
    const layla = report.byStudent.find((row) => row.studentId === 'stu-3');
    assert.strictEqual(layla.rate, 0);
    assert.strictEqual(layla.atRisk, false);

    assert.strictEqual(report.summary.atRiskStudents, 1);
    assert.deepStrictEqual(report.atRisk.map((row) => row.studentId), ['stu-1']);
  });

  it('reports group-level rates with student counts', async () => {
    const report = await buildAttendanceReport(prisma, 'comp-1', { months: 3 });

    const group = report.byGroup.find((row) => row.groupId === 'grp-1');
    assert.strictEqual(group.name, 'مجموعة أ');
    assert.strictEqual(group.rate, 60);
    assert.strictEqual(group.students, 6);
    assert.strictEqual(group.atRisk, true);
  });

  it('returns null rates when there is no attendance data', async () => {
    const empty = { $queryRawUnsafe: async () => [] };
    const report = await buildAttendanceReport(empty, 'comp-1', { months: 1 });

    assert.strictEqual(report.summary.records, 0);
    assert.strictEqual(report.summary.attendanceRate, null);
    assert.strictEqual(report.summary.atRiskStudents, 0);
    assert.deepStrictEqual(report.byStudent, []);
    assert.deepStrictEqual(report.byGroup, []);
  });
});

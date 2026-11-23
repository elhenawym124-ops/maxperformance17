const { describe, it } = require('node:test');
const assert = require('node:assert');
const absenceService = require('../../services/educationAbsenceService');

const studentRow = (overrides = {}) => ({
  companyId: 'comp-1',
  studentId: 'stu-1',
  streak: 3,
  firstName: 'سارة',
  lastName: 'محمد',
  phone: '01000000000',
  customerId: 'cust-1',
  parentPhone: '01011111111',
  parentFirstName: 'أحمد',
  parentLastName: 'علي',
  groupName: 'مجموعة أ',
  lastSessionAt: new Date('2026-11-20'),
  ...overrides,
});

const prismaWith = ({ rows = [], notified = false } = {}) => {
  const calls = { sql: [], logs: [] };
  return {
    calls,
    $queryRawUnsafe: async (sql, ...params) => {
      calls.sql.push({ sql, params });
      if (/FROM "education_group_attendance" LIMIT/i.test(sql)) {
        return [{ companyId: 'comp-1' }];
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

describe('educationAbsenceService', () => {
  it('maps streak rows into alert payloads with the parent phone fallback', async () => {
    const prisma = prismaWith({ rows: [studentRow(), studentRow({ studentId: 'stu-2', parentPhone: null, phone: '0122' })] });
    const students = await absenceService.findStreaks(prisma, 'comp-1', { threshold: 3, windowDays: 30 });

    assert.strictEqual(students.length, 2);
    assert.strictEqual(students[0].studentName, 'سارة محمد');
    assert.strictEqual(students[0].parentName, 'أحمد علي');
    assert.strictEqual(students[0].parentPhone, '01011111111');
    assert.strictEqual(students[0].groupName, 'مجموعة أ');
    assert.strictEqual(students[0].streak, 3);
    // falls back to the student phone when the customer has none
    assert.strictEqual(students[1].parentPhone, '0122');
  });

  it('clamps the threshold and window into safe bounds', async () => {
    const prisma = prismaWith();
    const students = await absenceService.findStreaks(prisma, 'comp-1', { threshold: 0, windowDays: 9999 });
    assert.deepStrictEqual(students, []);
    const [{ params }] = prisma.calls.sql;
    assert.strictEqual(params[2], 2); // threshold clamped to minimum 2
    const windowMs = new Date().getTime() - new Date(params[1]).getTime();
    assert.ok(windowMs <= 180 * 86400000 + 5000);
  });

  it('notifies each detected student and skips ones without a phone', async () => {
    const prisma = prismaWith({ rows: [studentRow()] });
    const students = await absenceService.findStreaks(prisma, 'comp-1', { threshold: 3 });
    const withMissingPhone = await absenceService.findStreaks(
      prismaWith({ rows: [studentRow({ studentId: 'stu-3', parentPhone: null, phone: null })] }),
      'comp-1',
      { threshold: 3 }
    );

    const sent = [];
    const result = await absenceService.notifyStreaks(prisma, [...students, ...withMissingPhone], {
      notifier: { notifyRepeatedAbsence: async (payload) => sent.push(payload) },
    });

    assert.strictEqual(result.sent, 1);
    assert.strictEqual(result.skipped, 1);
    assert.strictEqual(sent[0].absentCount, 3);
    assert.strictEqual(sent[0].studentName, 'سارة محمد');
    assert.strictEqual(sent[0].groupName, 'مجموعة أ');
  });

  it('skips parents already notified recently', async () => {
    const prisma = prismaWith({ rows: [studentRow()], notified: true });
    const students = await absenceService.findStreaks(prisma, 'comp-1', { threshold: 3 });
    const sent = [];
    const result = await absenceService.notifyStreaks(prisma, students, {
      notifier: { notifyRepeatedAbsence: async (payload) => sent.push(payload) },
    });

    assert.strictEqual(result.sent, 0);
    assert.strictEqual(result.skipped, 1);
    assert.strictEqual(sent.length, 0);
    assert.strictEqual(prisma.calls.logs[0].where.rawEventType, 'education_repeated_absence');
  });

  it('counts failures without aborting the sweep', async () => {
    const prisma = prismaWith({ rows: [studentRow()] });
    const students = await absenceService.findStreaks(prisma, 'comp-1', { threshold: 3 });
    const result = await absenceService.notifyStreaks(prisma, students, {
      notifier: {
        notifyRepeatedAbsence: async () => {
          throw new Error('meta down');
        },
      },
    });
    assert.strictEqual(result.failed, 1);
    assert.strictEqual(result.sent, 0);
  });

  it('sweeps every company when no companyId is passed', async () => {
    const prisma = {
      $queryRawUnsafe: async (sql) => {
        if (/SELECT DISTINCT "companyId"/i.test(sql)) {
          return [{ companyId: 'comp-1' }, { companyId: 'comp-2' }];
        }
        return [studentRow()];
      },
      whatsAppNotificationLog: { findFirst: async () => null },
    };
    const sent = [];
    const summary = await absenceService.runAbsenceSweep(prisma, {
      notifier: { notifyRepeatedAbsence: async (payload) => sent.push(payload) },
    });

    assert.strictEqual(summary.companies, 2);
    assert.strictEqual(summary.detected, 2);
    assert.strictEqual(summary.sent, 2);
    assert.strictEqual(sent.length, 2);
  });
});

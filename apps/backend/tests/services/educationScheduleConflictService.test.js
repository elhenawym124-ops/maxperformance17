const { describe, it } = require('node:test');
const assert = require('node:assert');
const conflictService = require('../../services/educationScheduleConflictService');

const mockPrisma = (rows) => ({
  $queryRawUnsafe: async () => rows,
});

describe('educationScheduleConflictService — pure helpers', () => {
  it('normalizes named and numeric days and detects overlaps', () => {
    const slots = conflictService.normalizeGroupSlots({
      scheduleDays: ['SUNDAY', 'MONDAY'],
      startTime: '17:00',
      endTime: '18:30',
    });
    assert.strictEqual(slots.length, 2);
    assert.deepStrictEqual(slots[0], { dayIdx: 0, start: 17 * 60, end: 18 * 60 + 30 });

    const a = { dayIdx: 0, start: 17 * 60, end: 18 * 60 + 30 };
    const b = { dayIdx: 0, start: 18 * 60, end: 19 * 60 };
    const c = { dayIdx: 1, start: 17 * 60, end: 18 * 60 };
    assert.strictEqual(conflictService.slotsOverlap(a, b), true);
    assert.strictEqual(conflictService.slotsOverlap(a, c), false);
  });

  it('prefers scheduleSlots over scheduleDays', () => {
    const slots = conflictService.normalizeGroupSlots({
      scheduleSlots: JSON.stringify([{ dayOfWeek: 'TUESDAY', startTime: '10:00', endTime: '11:00' }]),
      scheduleDays: ['SUNDAY'],
      startTime: '17:00',
      endTime: '18:30',
    });
    assert.deepStrictEqual(slots, [{ dayIdx: 2, start: 600, end: 660 }]);
  });
});

describe('educationScheduleConflictService — student conflicts', () => {
  it('detects a group overlap for the same student', async () => {
    const prisma = mockPrisma([{
      id: 'grp-2',
      name: 'مجموعة ب',
      scheduleDays: JSON.stringify(['SUNDAY']),
      scheduleSlots: '[]',
      startTime: '17:30',
      endTime: '19:00',
    }]);

    const conflicts = await conflictService.findStudentGroupConflicts(prisma, {
      companyId: 'comp-1',
      studentId: 'stu-1',
      targetSlots: [{ dayIdx: 0, start: 1020, end: 1110 }],
      excludeGroupId: 'grp-1',
    });

    assert.strictEqual(conflicts.length, 1);
    assert.strictEqual(conflicts[0].groupId, 'grp-2');
    assert.strictEqual(conflicts[0].type, 'STUDENT_GROUP');
  });

  it('detects a private session clashing with the target group slots', async () => {
    const sunday = new Date(2026, 10, 22, 18, 0, 0); // Sunday 18:00
    const prisma = {
      educationSession: {
        findMany: async () => [{
          id: 'sess-1',
          scheduledAt: sunday,
          plannedDuration: 60,
          subject: { name: 'رياضيات' },
        }],
      },
    };

    const conflicts = await conflictService.findStudentPrivateSlotConflicts(prisma, {
      companyId: 'comp-1',
      studentId: 'stu-1',
      targetSlots: [{ dayIdx: 0, start: 17 * 60, end: 19 * 60 }],
      from: new Date(2026, 10, 22, 8, 0, 0),
      days: 7,
    });

    assert.strictEqual(conflicts.length, 1);
    assert.strictEqual(conflicts[0].type, 'STUDENT_PRIVATE');
    assert.strictEqual(conflicts[0].sessionId, 'sess-1');
  });

  it('detects a group conflict at a specific session time', async () => {
    const prisma = mockPrisma([{
      id: 'grp-1',
      name: 'مجموعة أ',
      scheduleDays: JSON.stringify(['SUNDAY']),
      scheduleSlots: '[]',
      startTime: '17:00',
      endTime: '18:30',
    }]);

    const start = new Date(2026, 10, 22, 17, 30, 0);
    const end = new Date(2026, 10, 22, 18, 30, 0);
    const conflicts = await conflictService.findStudentGroupConflictAtTime(prisma, {
      companyId: 'comp-1',
      studentId: 'stu-1',
      start,
      end,
    });

    assert.strictEqual(conflicts.length, 1);
    assert.strictEqual(conflicts[0].groupId, 'grp-1');
  });

  it('returns no conflicts when there are no other groups or sessions', async () => {
    const prisma = { $queryRawUnsafe: async () => [], educationSession: { findMany: async () => [] } };
    const group = await conflictService.findStudentGroupConflicts(prisma, {
      companyId: 'comp-1', studentId: 'stu-1', targetSlots: [{ dayIdx: 0, start: 600, end: 700 }],
    });
    const privateConflicts = await conflictService.findStudentPrivateSlotConflicts(prisma, {
      companyId: 'comp-1', studentId: 'stu-1', targetSlots: [{ dayIdx: 0, start: 600, end: 700 }],
    });
    assert.deepStrictEqual(group, []);
    assert.deepStrictEqual(privateConflicts, []);
  });
});

/**
 * Schedule conflicts that involve the student (not just the teacher/room):
 * - group vs group (same student in two overlapping groups)
 * - private session vs group schedule
 * - private session vs private session
 */

const DAY_NAME_TO_INDEX = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
  'الأحد': 0, 'الاحد': 0, 'الاثنين': 1, 'الإثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3,
  'الخميس': 4, 'الجمعة': 5, 'السبت': 6,
};

const minutesOfDay = (value) => {
  const [h, m] = String(value || '').split(':').map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
};

const dayIndexOf = (value) => {
  const raw = String(value || '').trim().toUpperCase();
  if (!raw) return null;
  if (DAY_NAME_TO_INDEX[raw] !== undefined) return DAY_NAME_TO_INDEX[raw];
  const asNum = parseInt(raw, 10);
  return Number.isNaN(asNum) ? null : asNum;
};

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }
  return [];
};

const normalizeGroupSlots = (row) => {
  const slots = parseJsonArray(row.scheduleSlots);
  const fallbackStart = row.startTime || '17:00';
  const fallbackEnd = row.endTime || '18:30';
  if (slots.length) {
    return slots
      .map((slot) => ({
        dayIdx: dayIndexOf(slot.dayOfWeek ?? slot.day),
        start: minutesOfDay(slot.startTime || fallbackStart),
        end: minutesOfDay(slot.endTime || fallbackEnd),
      }))
      .filter((slot) => slot.dayIdx !== null && slot.end > slot.start);
  }
  return parseJsonArray(row.scheduleDays)
    .map((day) => ({
      dayIdx: dayIndexOf(day),
      start: minutesOfDay(fallbackStart),
      end: minutesOfDay(fallbackEnd),
    }))
    .filter((slot) => slot.dayIdx !== null && slot.end > slot.start);
};

const slotsOverlap = (a, b) => a.dayIdx === b.dayIdx && a.start < b.end && b.start < a.end;

const formatMinutes = (value) =>
  `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;

const describeSlot = (slot) => ({
  dayIdx: slot.dayIdx,
  startTime: formatMinutes(slot.start),
  endTime: formatMinutes(slot.end),
});

async function findStudentGroupConflicts(prisma, { companyId, studentId, targetSlots, excludeGroupId = null }) {
  if (!studentId || !Array.isArray(targetSlots) || targetSlots.length === 0) return [];

  const rows = await prisma.$queryRawUnsafe(`
    SELECT g.id, g.name, g."scheduleDays"::text AS "scheduleDays",
           g."scheduleSlots"::text AS "scheduleSlots", g."startTime", g."endTime"
    FROM "education_group_members" m
    JOIN "education_groups" g ON g.id = m."groupId" AND g."companyId" = m."companyId"
    WHERE m."studentId" = $1
      AND m."companyId" = $2
      AND m."status" = 'ACTIVE'
      AND g.id <> $3
  `, studentId, companyId, excludeGroupId || '');

  const conflicts = [];
  for (const row of rows || []) {
    const otherSlots = normalizeGroupSlots(row);
    for (const mine of targetSlots) {
      for (const theirs of otherSlots) {
        if (!slotsOverlap(mine, theirs)) continue;
        conflicts.push({
          type: 'STUDENT_GROUP',
          groupId: row.id,
          groupName: row.name,
          ...describeSlot(theirs),
        });
      }
    }
  }
  return conflicts.slice(0, 10);
}

async function findStudentPrivateConflicts(prisma, {
  companyId,
  studentId,
  start,
  end,
  excludeSessionId = null,
}) {
  if (!studentId || !start || !end) return [];

  const sessions = await prisma.educationSession.findMany({
    where: {
      companyId,
      studentId,
      status: { not: 'CANCELLED' },
      scheduledAt: {
        gte: new Date(new Date(start).getTime() - 2 * 60 * 60 * 1000),
        lte: new Date(new Date(end).getTime() + 2 * 60 * 60 * 1000),
      },
      ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
    },
    select: {
      id: true,
      scheduledAt: true,
      plannedDuration: true,
      subject: { select: { name: true } },
    },
    take: 50,
  });

  const conflicts = [];
  for (const session of sessions) {
    const otherStart = new Date(session.scheduledAt);
    const otherEnd = new Date(otherStart.getTime() + (Number(session.plannedDuration) || 60) * 60000);
    if (new Date(start) < otherEnd && new Date(end) > otherStart) {
      conflicts.push({
        type: 'STUDENT_PRIVATE',
        sessionId: session.id,
        subjectName: session.subject?.name || null,
        scheduledAt: session.scheduledAt,
      });
    }
  }
  return conflicts;
}

async function findStudentGroupConflictAtTime(prisma, { companyId, studentId, start, end }) {
  if (!studentId || !start || !end) return [];

  const rows = await prisma.$queryRawUnsafe(`
    SELECT g.id, g.name, g."scheduleDays"::text AS "scheduleDays",
           g."scheduleSlots"::text AS "scheduleSlots", g."startTime", g."endTime"
    FROM "education_group_members" m
    JOIN "education_groups" g ON g.id = m."groupId" AND g."companyId" = m."companyId"
    WHERE m."studentId" = $1 AND m."companyId" = $2 AND m."status" = 'ACTIVE'
  `, studentId, companyId);

  const startDate = new Date(start);
  const endDate = new Date(end);
  const dayIdx = startDate.getDay();
  const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
  const endMinutes = endDate.getHours() * 60 + endDate.getMinutes()
    + (endDate.getDate() !== startDate.getDate() ? 24 * 60 : 0);

  const conflictSlot = { dayIdx, start: startMinutes, end: endMinutes };
  const conflicts = [];
  for (const row of rows || []) {
    const slots = normalizeGroupSlots(row);
    for (const slot of slots) {
      if (!slotsOverlap(conflictSlot, slot)) continue;
      conflicts.push({
        type: 'STUDENT_GROUP',
        groupId: row.id,
        groupName: row.name,
        ...describeSlot(slot),
      });
    }
  }
  return conflicts.slice(0, 10);
}

async function findStudentPrivateSlotConflicts(prisma, {
  companyId,
  studentId,
  targetSlots,
  from = new Date(),
  days = 28,
}) {
  if (!studentId || !Array.isArray(targetSlots) || targetSlots.length === 0) return [];

  const until = new Date(new Date(from).getTime() + Math.max(1, days) * 24 * 60 * 60 * 1000);
  const sessions = await prisma.educationSession.findMany({
    where: {
      companyId,
      studentId,
      status: { not: 'CANCELLED' },
      scheduledAt: { gte: from, lte: until },
    },
    select: {
      id: true,
      scheduledAt: true,
      plannedDuration: true,
      subject: { select: { name: true } },
    },
    take: 100,
  });

  const conflicts = [];
  for (const session of sessions) {
    const start = new Date(session.scheduledAt);
    const end = new Date(start.getTime() + (Number(session.plannedDuration) || 60) * 60000);
    const sessionSlot = {
      dayIdx: start.getDay(),
      start: start.getHours() * 60 + start.getMinutes(),
      end: end.getHours() * 60 + end.getMinutes() + (end.getDate() !== start.getDate() ? 24 * 60 : 0),
    };
    for (const slot of targetSlots) {
      if (!slotsOverlap(sessionSlot, slot)) continue;
      conflicts.push({
        type: 'STUDENT_PRIVATE',
        sessionId: session.id,
        subjectName: session.subject?.name || null,
        scheduledAt: session.scheduledAt,
        ...describeSlot(slot),
      });
      break;
    }
  }
  return conflicts.slice(0, 10);
}

async function findGroupMembersOverlapConflicts(prisma, { companyId, groupId, targetSlots }) {
  if (!Array.isArray(targetSlots) || targetSlots.length === 0) return [];

  const members = await prisma.$queryRawUnsafe(`
    SELECT m."studentId", s."firstName", s."lastName"
    FROM "education_group_members" m
    JOIN "education_students" s ON s.id = m."studentId" AND s."companyId" = m."companyId"
    WHERE m."groupId" = $1 AND m."companyId" = $2 AND m."status" = 'ACTIVE'
    LIMIT 300
  `, groupId, companyId);

  const conflicts = [];
  for (const member of members || []) {
    const studentConflicts = await findStudentGroupConflicts(prisma, {
      companyId,
      studentId: member.studentId,
      targetSlots,
      excludeGroupId: groupId,
    });
    if (studentConflicts.length > 0) {
      conflicts.push({
        studentId: member.studentId,
        studentName: `${member.firstName || ''} ${member.lastName || ''}`.trim(),
        conflicts: studentConflicts,
      });
    }
  }
  return conflicts.slice(0, 10);
}

module.exports = {
  DAY_NAME_TO_INDEX,
  minutesOfDay,
  dayIndexOf,
  parseJsonArray,
  normalizeGroupSlots,
  slotsOverlap,
  findStudentGroupConflicts,
  findStudentPrivateConflicts,
  findStudentGroupConflictAtTime,
  findStudentPrivateSlotConflicts,
  findGroupMembersOverlapConflicts,
};

/**
 * Repeated absence detection for education groups.
 *
 * Streak = number of consecutive ABSENT attendance rows counting back from the
 * student's most recent group session. A present/excused row resets the streak.
 */

const DAY_MS = 24 * 3600 * 1000;
const SENT_STATES = ['SENT', 'DELIVERED', 'READ'];

const clamp = (value, min, max, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
};

const STREAK_SQL = `
WITH ranked AS (
  SELECT a."companyId", a."studentId", a."status", gs."sessionDate",
         ROW_NUMBER() OVER (
           PARTITION BY a."companyId", a."studentId"
           ORDER BY gs."sessionDate" DESC, a."id" DESC
         ) AS rn
  FROM "education_group_attendance" a
  JOIN "education_group_sessions" gs
    ON gs.id = a."sessionId" AND gs."companyId" = a."companyId"
  WHERE a."companyId" = $1 AND gs."sessionDate" >= $2
),
streak AS (
  SELECT "companyId", "studentId",
         MIN(CASE WHEN "status" <> 'ABSENT' THEN rn END) AS first_present_rn
  FROM ranked
  GROUP BY "companyId", "studentId"
),
consecutive AS (
  SELECT r."companyId", r."studentId", COUNT(*)::int AS streak
  FROM ranked r
  JOIN streak s ON s."companyId" = r."companyId" AND s."studentId" = r."studentId"
  WHERE r."status" = 'ABSENT'
    AND (s.first_present_rn IS NULL OR r.rn < s.first_present_rn)
  GROUP BY r."companyId", r."studentId"
)
SELECT c."companyId", c."studentId", c.streak,
       st."firstName", st."lastName", st."phone", st."customerId",
       cu."phone" AS "parentPhone", cu."firstName" AS "parentFirstName", cu."lastName" AS "parentLastName",
       (
         SELECT g."name"
         FROM "education_group_attendance" a2
         JOIN "education_group_sessions" gs2 ON gs2.id = a2."sessionId" AND gs2."companyId" = a2."companyId"
         JOIN "education_groups" g ON g.id = gs2."groupId" AND g."companyId" = a2."companyId"
         WHERE a2."companyId" = c."companyId" AND a2."studentId" = c."studentId"
         ORDER BY gs2."sessionDate" DESC
         LIMIT 1
       ) AS "groupName",
       (
         SELECT gs3."sessionDate"
         FROM "education_group_attendance" a3
         JOIN "education_group_sessions" gs3 ON gs3.id = a3."sessionId" AND gs3."companyId" = a3."companyId"
         WHERE a3."companyId" = c."companyId" AND a3."studentId" = c."studentId"
         ORDER BY gs3."sessionDate" DESC
         LIMIT 1
       ) AS "lastSessionAt"
FROM consecutive c
JOIN "education_students" st ON st.id = c."studentId" AND st."companyId" = c."companyId"
LEFT JOIN "customers" cu ON cu.id = st."customerId"
WHERE c.streak >= $3
ORDER BY c.streak DESC, c."studentId" ASC
LIMIT 500
`;

/**
 * Returns students whose current consecutive absence streak >= threshold.
 */
async function findStreaks(prisma, companyId, { threshold = 3, windowDays = 45 } = {}) {
  const safeThreshold = clamp(threshold, 2, 30, 3);
  const safeWindow = clamp(windowDays, 7, 180, 45);
  const from = new Date(Date.now() - safeWindow * DAY_MS);

  const rows = await prisma.$queryRawUnsafe(STREAK_SQL, companyId, from, safeThreshold);
  return (rows || []).map((row) => ({
    companyId: row.companyId,
    studentId: row.studentId,
    studentName: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
    studentPhone: row.phone || null,
    customerId: row.customerId || null,
    parentName: `${row.parentFirstName || ''} ${row.parentLastName || ''}`.trim() || 'وليّ الأمر',
    parentPhone: row.parentPhone || row.phone || null,
    groupName: row.groupName || '',
    streak: Number(row.streak) || 0,
    lastSessionAt: row.lastSessionAt || null,
    threshold: safeThreshold,
    windowDays: safeWindow,
  }));
}

async function wasRecentlyNotified(prisma, { companyId, phone, eventType, days = 7, now = new Date() }) {
  if (!phone) return false;
  try {
    const row = await prisma.whatsAppNotificationLog.findFirst({
      where: {
        companyId,
        rawEventType: eventType,
        recipientPhone: phone,
        createdAt: { gte: new Date(now.getTime() - days * DAY_MS) },
        status: { in: SENT_STATES },
      },
      select: { id: true },
    });
    return Boolean(row);
  } catch {
    return false;
  }
}

/**
 * Sends the repeated-absence alert for each detected student.
 * Optionally accepts a notifier override (used by tests / callers that batch).
 */
async function notifyStreaks(prisma, students, { notifier = null, dedupeDays = 7, now = new Date() } = {}) {
  const notificationService = notifier || require('./educationNotificationService');
  const results = { sent: 0, skipped: 0, failed: 0, items: [] };

  for (const student of students || []) {
    if (!student.parentPhone) {
      results.skipped += 1;
      continue;
    }

    const already = await wasRecentlyNotified(prisma, {
      companyId: student.companyId,
      phone: student.parentPhone,
      eventType: 'education_repeated_absence',
      days: dedupeDays,
      now,
    });
    if (already) {
      results.skipped += 1;
      continue;
    }

    try {
      await notificationService.notifyRepeatedAbsence({
        companyId: student.companyId,
        customerId: student.customerId,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        studentName: student.studentName,
        groupName: student.groupName,
        absentCount: student.streak,
      });
      results.sent += 1;
      results.items.push({ studentId: student.studentId, streak: student.streak });
    } catch (error) {
      results.failed += 1;
      console.warn('[AbsenceAlert] send failed:', error.message);
    }
  }

  return results;
}

/**
 * Sweep: finds streaks (optionally for every company) then notifies parents.
 */
async function runAbsenceSweep(prisma, { companyId = null, threshold = 3, windowDays = 45, dedupeDays = 7, notifier = null } = {}) {
  let companyIds = [];
  if (companyId) {
    companyIds = [companyId];
  } else {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT DISTINCT "companyId" FROM "education_group_attendance" LIMIT 2000`
    ).catch(() => []);
    companyIds = (rows || []).map((row) => row.companyId).filter(Boolean);
  }

  const summary = { companies: companyIds.length, detected: 0, sent: 0, skipped: 0, failed: 0 };
  for (const cid of companyIds) {
    const students = await findStreaks(prisma, cid, { threshold, windowDays });
    summary.detected += students.length;
    const result = await notifyStreaks(prisma, students, { notifier, dedupeDays });
    summary.sent += result.sent;
    summary.skipped += result.skipped;
    summary.failed += result.failed;
  }
  return summary;
}

module.exports = {
  findStreaks,
  notifyStreaks,
  runAbsenceSweep,
  wasRecentlyNotified,
  STREAK_SQL,
};

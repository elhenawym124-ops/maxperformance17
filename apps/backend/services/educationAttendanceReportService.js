/**
 * Student attendance report for group sessions.
 *
 * Source: education_group_attendance joined to education_group_sessions.
 * Private sessions carry no attendance rows, so they are out of scope by design.
 */

const pct = (part, total) => {
  if (!total || total <= 0) return null;
  return Math.round((part / total) * 1000) / 10;
};

const AT_RISK_RATE = 70;
const AT_RISK_MIN_RECORDS = 3;

async function buildAttendanceReport(prisma, companyId, { months = 3 } = {}) {
  const safeMonths = Math.min(24, Math.max(1, Number(months) || 3));
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (safeMonths - 1), 1);

  const [studentRows, groupRows] = await Promise.all([
    prisma.$queryRawUnsafe(`
      SELECT a."studentId", MAX(s."firstName") AS "firstName", MAX(s."lastName") AS "lastName",
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE a."status" = 'PRESENT')::int AS present,
             COUNT(*) FILTER (WHERE a."status" = 'ABSENT')::int AS absent,
             COUNT(*) FILTER (WHERE a."status" = 'EXCUSED')::int AS excused,
             MAX(gs."sessionDate") AS "lastSessionAt"
      FROM "education_group_attendance" a
      JOIN "education_group_sessions" gs ON gs."id" = a."sessionId" AND gs."companyId" = a."companyId"
      JOIN "education_students" s ON s."id" = a."studentId" AND s."companyId" = a."companyId"
      WHERE a."companyId" = $1 AND gs."sessionDate" >= $2
      GROUP BY a."studentId"
      ORDER BY (COUNT(*) FILTER (WHERE a."status" = 'PRESENT')::numeric / NULLIF(COUNT(*), 0)) ASC
      LIMIT 500
    `, companyId, rangeStart).catch(() => []),
    prisma.$queryRawUnsafe(`
      SELECT gs."groupId", MAX(g."name") AS "groupName",
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE a."status" = 'PRESENT')::int AS present,
             COUNT(*) FILTER (WHERE a."status" = 'ABSENT')::int AS absent,
             COUNT(*) FILTER (WHERE a."status" = 'EXCUSED')::int AS excused,
             COUNT(DISTINCT a."studentId")::int AS students
      FROM "education_group_attendance" a
      JOIN "education_group_sessions" gs ON gs."id" = a."sessionId" AND gs."companyId" = a."companyId"
      JOIN "education_groups" g ON g."id" = gs."groupId" AND g."companyId" = gs."companyId"
      WHERE a."companyId" = $1 AND gs."sessionDate" >= $2
      GROUP BY gs."groupId"
      ORDER BY (COUNT(*) FILTER (WHERE a."status" = 'PRESENT')::numeric / NULLIF(COUNT(*), 0)) ASC
      LIMIT 200
    `, companyId, rangeStart).catch(() => []),
  ]);

  const buildRow = (row, key, nameKey) => {
    const total = Number(row.total) || 0;
    const present = Number(row.present) || 0;
    const absent = Number(row.absent) || 0;
    const excused = Number(row.excused) || 0;
    const rate = pct(present, total);
    return {
      [key]: row[key],
      [nameKey]: row[nameKey] || null,
      total,
      present,
      absent,
      excused,
      rate,
      atRisk: rate !== null && rate < AT_RISK_RATE && total >= AT_RISK_MIN_RECORDS,
    };
  };

  const byStudent = (studentRows || []).map((row) => ({
    ...buildRow(row, 'studentId', 'firstName'),
    studentName: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
    lastSessionAt: row.lastSessionAt || null,
  }));

  const byGroup = (groupRows || []).map((row) => ({
    ...buildRow(row, 'groupId', 'groupName'),
    name: row.groupName || row.groupId,
    students: Number(row.students) || 0,
  }));

  const totals = (rows) => rows.reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      present: acc.present + row.present,
      absent: acc.absent + row.absent,
      excused: acc.excused + row.excused,
    }),
    { total: 0, present: 0, absent: 0, excused: 0 }
  );

  const overall = totals(byStudent);
  const atRisk = byStudent.filter((row) => row.atRisk);

  return {
    period: { from: rangeStart, to: now, months: safeMonths },
    summary: {
      records: overall.total,
      present: overall.present,
      absent: overall.absent,
      excused: overall.excused,
      attendanceRate: pct(overall.present, overall.total),
      students: byStudent.length,
      groups: byGroup.length,
      atRiskStudents: atRisk.length,
    },
    byGroup: byGroup.slice(0, 50),
    byStudent,
    atRisk: atRisk.slice(0, 50),
  };
}

module.exports = { buildAttendanceReport, AT_RISK_RATE, AT_RISK_MIN_RECORDS };

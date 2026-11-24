/**
 * Attendance × collection link: does absence correlate with unpaid balances?
 *
 * For each student in the window we combine:
 * - attendance rate from group attendance,
 * - outstanding balance from active enrollments,
 * - overdue installments.
 * Students with no attendance rows are excluded (they would skew the ratio).
 */

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;
const pct = (part, total) => (total > 0 ? Math.round((part / total) * 1000) / 10 : null);

const LOW_ATTENDANCE = 70;

const bandOf = (rate) => {
  if (rate === null) return 'UNKNOWN';
  if (rate >= 90) return 'HIGH';
  if (rate >= LOW_ATTENDANCE) return 'MEDIUM';
  return 'LOW';
};

const parseInstallments = (value) => {
  try {
    if (Array.isArray(value)) return value;
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
};

const overdueAmountOf = (installments, now) =>
  money(parseInstallments(installments)
    .filter((inst) => String(inst?.status || '').toUpperCase() !== 'PAID')
    .filter((inst) => {
      const due = inst?.dueDate ? new Date(inst.dueDate) : null;
      return due && !Number.isNaN(due.getTime()) && due.getTime() < now.getTime();
    })
    .reduce((sum, inst) => sum + money(inst.amount), 0));

async function buildAttendancePaymentLink(prisma, companyId, { months = 3 } = {}) {
  const safeMonths = Math.min(24, Math.max(1, Number(months) || 3));
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (safeMonths - 1), 1);

  const attendanceRows = await prisma.$queryRawUnsafe(`
    SELECT a."studentId",
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE a."status" = 'PRESENT')::int AS present,
           COUNT(*) FILTER (WHERE a."status" = 'ABSENT')::int AS absent
    FROM "education_group_attendance" a
    JOIN "education_group_sessions" gs ON gs."id" = a."sessionId" AND gs."companyId" = a."companyId"
    WHERE a."companyId" = $1 AND gs."sessionDate" >= $2
    GROUP BY a."studentId"
    LIMIT 2000
  `, companyId, rangeStart).catch(() => []);

  if (!attendanceRows || attendanceRows.length === 0) {
    return {
      period: { from: rangeStart, to: now, months: safeMonths },
      summary: {
        students: 0, lowAttendance: 0, withDues: 0, overlap: 0,
        avgDuesLowAttendance: 0, avgDuesOthers: 0, riskAmount: 0, rate: null,
      },
      buckets: [],
      risky: [],
    };
  }

  const studentIds = attendanceRows.map((row) => row.studentId);
  const enrollments = await prisma.educationEnrollment.findMany({
    where: { companyId, studentId: { in: studentIds }, isActive: true },
    select: {
      studentId: true, finalAmount: true, amountPaid: true, installments: true,
      package: { select: { price: true } },
    },
    take: 5000,
  }).catch(() => []);

  const students = await prisma.educationStudent.findMany({
    where: { companyId, id: { in: studentIds } },
    select: { id: true, firstName: true, lastName: true, phone: true },
    take: 2000,
  }).catch(() => []);
  const studentMap = new Map((students || []).map((row) => [row.id, row]));

  const duesMap = new Map();
  for (const enrollment of enrollments || []) {
    const charge = money(enrollment.finalAmount || enrollment.package?.price || 0);
    const remaining = Math.max(0, money(charge - money(enrollment.amountPaid)));
    const entry = duesMap.get(enrollment.studentId) || { dues: 0, overdue: 0 };
    entry.dues = money(entry.dues + remaining);
    entry.overdue = money(entry.overdue + overdueAmountOf(enrollment.installments, now));
    duesMap.set(enrollment.studentId, entry);
  }

  const bucketMap = new Map();
  const risky = [];
  let lowAttendance = 0;
  let withDues = 0;
  let overlap = 0;
  let lowAttendanceDuesSum = 0;
  let lowAttendanceCount = 0;
  let othersDuesSum = 0;
  let othersCount = 0;
  let riskAmount = 0;

  for (const row of attendanceRows) {
    const total = Number(row.total) || 0;
    const present = Number(row.present) || 0;
    const rate = pct(present, total);
    const band = bandOf(rate);
    const dues = duesMap.get(row.studentId) || { dues: 0, overdue: 0 };
    const student = studentMap.get(row.studentId);

    const bucket = bucketMap.get(band) || { band, students: 0, duesStudents: 0, totalDues: 0 };
    bucket.students += 1;
    if (dues.dues > 0) bucket.duesStudents += 1;
    bucket.totalDues = money(bucket.totalDues + dues.dues);
    bucketMap.set(band, bucket);

    if (rate !== null && rate < LOW_ATTENDANCE) {
      lowAttendance += 1;
      lowAttendanceDuesSum = money(lowAttendanceDuesSum + dues.dues);
      lowAttendanceCount += 1;
    } else {
      othersDuesSum = money(othersDuesSum + dues.dues);
      othersCount += 1;
    }

    if (dues.dues > 0) withDues += 1;
    if (rate !== null && rate < LOW_ATTENDANCE && dues.dues > 0) {
      overlap += 1;
      riskAmount = money(riskAmount + dues.dues);
      risky.push({
        studentId: row.studentId,
        studentName: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : null,
        phone: student?.phone || null,
        attendanceRate: rate,
        absent: Number(row.absent) || 0,
        totalSessions: total,
        dues: dues.dues,
        overdue: dues.overdue,
      });
    }
  }

  risky.sort((a, b) => b.dues - a.dues);

  return {
    period: { from: rangeStart, to: now, months: safeMonths },
    summary: {
      students: attendanceRows.length,
      lowAttendance,
      withDues,
      overlap,
      avgDuesLowAttendance: lowAttendanceCount ? money(lowAttendanceDuesSum / lowAttendanceCount) : 0,
      avgDuesOthers: othersCount ? money(othersDuesSum / othersCount) : 0,
      riskAmount,
      rate: pct(overlap, lowAttendance),
    },
    buckets: ['LOW', 'MEDIUM', 'HIGH']
      .map((band) => bucketMap.get(band) || { band, students: 0, duesStudents: 0, totalDues: 0 }),
    risky: risky.slice(0, 50),
  };
}

module.exports = { buildAttendancePaymentLink, LOW_ATTENDANCE };

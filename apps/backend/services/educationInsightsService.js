/**
 * Retention & revenue insights for the education module:
 * revenue by branch/package/group/teacher, at-risk students, and cohort repeat rates.
 */

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

const monthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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

const hasOverdueInstallment = (enrollment, now) =>
  parseInstallments(enrollment.installments).some((inst) => {
    if (String(inst?.status || '').toUpperCase() === 'PAID') return false;
    const due = inst?.dueDate ? new Date(inst.dueDate) : null;
    return due && !Number.isNaN(due.getTime()) && due.getTime() < now.getTime();
  });

async function buildInsights(prisma, companyId, {
  months = 6,
  lowHoursThreshold = 2,
  inactiveDays = 21,
} = {}) {
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const [payments, enrollments, recentSessions, packages, branchRows, groupRows, teacherSessions, teachers, groupSessionRows, attendanceRows] = await Promise.all([
    prisma.educationPayment.findMany({
      where: { companyId, status: 'COMPLETED', paidAt: { gte: rangeStart } },
      select: {
        amount: true, branchId: true, packageId: true, groupId: true,
        enrollmentId: true, studentId: true, paidAt: true,
      },
      take: 20000,
    }),
    prisma.educationEnrollment.findMany({
      where: { companyId },
      select: {
        id: true, studentId: true, teacherId: true, packageId: true, branchId: true,
        remainingHours: true, totalHours: true, expiresAt: true, createdAt: true,
        isActive: true, finalAmount: true, amountPaid: true, installments: true,
        student: { select: { firstName: true, lastName: true, phone: true } },
        package: { select: { name: true } },
        teacher: { select: { name: true } },
      },
      take: 5000,
    }),
    prisma.educationSession.findMany({
      where: {
        companyId,
        status: 'CONFIRMED',
        scheduledAt: { gte: new Date(now.getTime() - inactiveDays * 86400000) },
      },
      select: { studentId: true },
      take: 20000,
    }),
    prisma.educationPackage.findMany({ where: { companyId }, select: { id: true, name: true } }),
    prisma.$queryRawUnsafe(
      `SELECT id, name FROM "branches" WHERE "companyId" = $1`,
      companyId
    ).catch(() => []),
    prisma.$queryRawUnsafe(`
      SELECT g.id, g."name", g."teacherId", g."branchId", g."feeAmount",
             COALESCE(COUNT(m.id) FILTER (WHERE m."status" = 'ACTIVE'), 0) AS active_members
      FROM "education_groups" g
      LEFT JOIN "education_group_members" m ON m."groupId" = g.id AND m."companyId" = g."companyId"
      WHERE g."companyId" = $1
      GROUP BY g.id, g."name", g."teacherId", g."branchId", g."feeAmount"
    `, companyId).catch(() => []),
    prisma.educationSession.findMany({
      where: { companyId, scheduledAt: { gte: rangeStart } },
      select: {
        teacherId: true, studentId: true, status: true,
        actualDuration: true, plannedDuration: true, sessionType: true,
      },
      take: 50000,
    }).catch(() => []),
    prisma.educationTeacher.findMany({
      where: { companyId },
      select: { id: true, name: true },
    }).catch(() => []),
    prisma.$queryRawUnsafe(`
      SELECT gs."teacherId", COUNT(*)::int AS sessions,
             COUNT(*) FILTER (WHERE gs."status" = 'CANCELLED')::int AS cancelled,
             COUNT(DISTINCT gs."groupId")::int AS groups
      FROM "education_group_sessions" gs
      WHERE gs."companyId" = $1 AND gs."sessionDate" >= $2 AND gs."teacherId" IS NOT NULL
      GROUP BY gs."teacherId"
    `, companyId, rangeStart).catch(() => []),
    prisma.$queryRawUnsafe(`
      SELECT gs."teacherId",
             COUNT(*) FILTER (WHERE a."status" = 'PRESENT')::int AS present,
             COUNT(*) FILTER (WHERE a."status" = 'ABSENT')::int AS absent,
             COUNT(DISTINCT a."studentId")::int AS students
      FROM "education_group_attendance" a
      JOIN "education_group_sessions" gs ON gs.id = a."sessionId" AND gs."companyId" = a."companyId"
      WHERE a."companyId" = $1 AND gs."sessionDate" >= $2 AND gs."teacherId" IS NOT NULL
      GROUP BY gs."teacherId"
    `, companyId, rangeStart).catch(() => []),
  ]);

  const packageNames = new Map((packages || []).map((pkg) => [pkg.id, pkg.name]));
  const branchNames = new Map((branchRows || []).map((branch) => [branch.id, branch.name]));
  const groupNames = new Map((groupRows || []).map((group) => [group.id, group.name]));

  const byBranchMap = new Map();
  const byPackageMap = new Map();
  const byGroupMap = new Map();
  const byTeacherMap = new Map();
  const enrollmentById = new Map(enrollments.map((e) => [e.id, e]));
  let revenue = 0;

  for (const payment of payments) {
    const amount = money(payment.amount);
    revenue = money(revenue + amount);

    if (payment.branchId) {
      const row = byBranchMap.get(payment.branchId) || { id: payment.branchId, amount: 0, count: 0 };
      row.amount = money(row.amount + amount);
      row.count += 1;
      byBranchMap.set(payment.branchId, row);
    }
    if (payment.packageId) {
      const row = byPackageMap.get(payment.packageId) || { id: payment.packageId, amount: 0, count: 0 };
      row.amount = money(row.amount + amount);
      row.count += 1;
      byPackageMap.set(payment.packageId, row);
    }
    if (payment.groupId) {
      const row = byGroupMap.get(payment.groupId) || { id: payment.groupId, amount: 0, count: 0 };
      row.amount = money(row.amount + amount);
      row.count += 1;
      byGroupMap.set(payment.groupId, row);
    }

    let teacherId = null;
    if (payment.enrollmentId && enrollmentById.get(payment.enrollmentId)) {
      teacherId = enrollmentById.get(payment.enrollmentId).teacherId;
    } else if (payment.groupId) {
      const group = (groupRows || []).find((item) => item.id === payment.groupId);
      teacherId = group?.teacherId || null;
    }
    if (teacherId) {
      const row = byTeacherMap.get(teacherId) || { id: teacherId, amount: 0, count: 0 };
      row.amount = money(row.amount + amount);
      row.count += 1;
      byTeacherMap.set(teacherId, row);
    }
  }

  const revenueByBranch = [...byBranchMap.values()]
    .map((row) => ({ ...row, name: branchNames.get(row.id) || row.id }))
    .sort((a, b) => b.amount - a.amount);
  const revenueByPackage = [...byPackageMap.values()]
    .map((row) => ({ ...row, name: packageNames.get(row.id) || row.id }))
    .sort((a, b) => b.amount - a.amount);
  const revenueByGroup = [...byGroupMap.values()]
    .map((row) => ({ ...row, name: groupNames.get(row.id) || row.id }))
    .sort((a, b) => b.amount - a.amount);
  const revenueByTeacher = [...byTeacherMap.values()]
    .sort((a, b) => b.amount - a.amount)
    .map((row) => {
      const teacherEnrollment = enrollments.find((e) => e.teacherId === row.id);
      return { ...row, name: teacherEnrollment?.teacher?.name || row.id };
    });

  // Teacher performance: sessions delivered, cancellations, hours, attendance
  const teacherNameMap = new Map((teachers || []).map((teacher) => [teacher.id, teacher.name]));
  const groupSessionMap = new Map((groupSessionRows || []).map((row) => [row.teacherId, row]));
  const attendanceMap = new Map((attendanceRows || []).map((row) => [row.teacherId, row]));
  const performanceMap = new Map();
  const baseRow = (teacherId) => {
    if (!performanceMap.has(teacherId)) {
      performanceMap.set(teacherId, {
        teacherId,
        name: teacherNameMap.get(teacherId) || null,
        privateSessions: 0,
        groupSessions: 0,
        cancelledSessions: 0,
        hoursTaught: 0,
        presentCount: 0,
        absentCount: 0,
        students: new Set(),
        revenue: 0,
      });
    }
    return performanceMap.get(teacherId);
  };

  for (const session of teacherSessions || []) {
    if (!session.teacherId) continue;
    const row = baseRow(session.teacherId);
    if (session.status === 'CANCELLED') {
      row.cancelledSessions += 1;
      continue;
    }
    if (session.status === 'CONFIRMED' || session.status === 'COMPLETED') {
      row.privateSessions += 1;
      const minutes = Number(session.actualDuration) || Number(session.plannedDuration) || 0;
      row.hoursTaught += minutes / 60;
      if (session.studentId) row.students.add(session.studentId);
    }
  }

  for (const group of groupSessionRows || []) {
    const row = baseRow(group.teacherId);
    row.groupSessions += Number(group.sessions) || 0;
    row.cancelledSessions += Number(group.cancelled) || 0;
  }

  for (const attendance of attendanceRows || []) {
    const row = baseRow(attendance.teacherId);
    row.presentCount += Number(attendance.present) || 0;
    row.absentCount += Number(attendance.absent) || 0;
    row.studentsCount = Number(attendance.students) || 0;
  }

  for (const revenueRow of revenueByTeacher) {
    baseRow(revenueRow.id).revenue = revenueRow.amount;
  }

  const teacherPerformance = [...performanceMap.values()]
    .map((row) => {
      const attended = row.presentCount + row.absentCount;
      return {
        teacherId: row.teacherId,
        name: row.name || revenueByTeacher.find((entry) => entry.id === row.teacherId)?.name || row.teacherId,
        privateSessions: row.privateSessions,
        groupSessions: row.groupSessions,
        sessions: row.privateSessions + row.groupSessions,
        cancelledSessions: row.cancelledSessions,
        hoursTaught: Math.round(row.hoursTaught * 10) / 10,
        attendanceRate: attended > 0 ? Math.round((row.presentCount / attended) * 1000) / 10 : null,
        absentCount: row.absentCount,
        students: Math.max(row.students.size, row.studentsCount || 0),
        revenue: money(row.revenue),
      };
    })
    .filter((row) => row.sessions > 0 || row.cancelledSessions > 0 || row.revenue > 0)
    .sort((a, b) => (b.revenue - a.revenue) || (b.sessions - a.sessions));

  // Cohort retention: first enrollment month + repeat purchases
  const studentStats = new Map();
  for (const enrollment of enrollments) {
    const entry = studentStats.get(enrollment.studentId) || {
      studentId: enrollment.studentId,
      firstEnrollment: enrollment.createdAt,
      count: 0,
      active: false,
    };
    entry.count += 1;
    if (new Date(enrollment.createdAt) < new Date(entry.firstEnrollment)) {
      entry.firstEnrollment = enrollment.createdAt;
    }
    if (enrollment.isActive) entry.active = true;
    studentStats.set(enrollment.studentId, entry);
  }

  const cohortMap = new Map();
  let repeatStudents = 0;
  let activeStudents = 0;
  for (const stats of studentStats.values()) {
    if (stats.active) activeStudents += 1;
    const repeat = stats.count > 1;
    if (repeat) repeatStudents += 1;
    const key = monthKey(stats.firstEnrollment);
    const cohort = cohortMap.get(key) || { month: key, students: 0, repeatStudents: 0 };
    cohort.students += 1;
    if (repeat) cohort.repeatStudents += 1;
    cohortMap.set(key, cohort);
  }
  const cohorts = [...cohortMap.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((cohort) => ({
      ...cohort,
      retentionRate: cohort.students > 0
        ? Math.round((cohort.repeatStudents / cohort.students) * 1000) / 10
        : 0,
    }));

  const recentStudentIds = new Set(recentSessions.map((session) => session.studentId));
  const atRisk = [];
  const seen = new Set();

  for (const enrollment of enrollments) {
    if (!enrollment.isActive) continue;
    const reasons = [];
    const remaining = Number(enrollment.remainingHours) || 0;
    const total = Number(enrollment.totalHours) || 0;
    if (remaining <= lowHoursThreshold || (total > 0 && remaining / total <= 0.2)) {
      reasons.push({ code: 'LOW_HOURS', label: 'رصيد ساعات منخفض' });
    }
    if (enrollment.expiresAt) {
      const daysToExpiry = (new Date(enrollment.expiresAt).getTime() - now.getTime()) / 86400000;
      if (daysToExpiry >= 0 && daysToExpiry <= 14) {
        reasons.push({ code: 'EXPIRING', label: 'الباقة تنتهي خلال أسبوعين' });
      }
    }
    if (hasOverdueInstallment(enrollment, now)) {
      reasons.push({ code: 'OVERDUE_INSTALLMENT', label: 'قسط متأخر' });
    }
    if (!recentStudentIds.has(enrollment.studentId)) {
      reasons.push({ code: 'INACTIVE', label: `لا حضور منذ ${inactiveDays} يوم` });
    }
    if (reasons.length === 0) continue;

    const key = enrollment.studentId;
    if (seen.has(key)) continue;
    seen.add(key);
    atRisk.push({
      studentId: enrollment.studentId,
      studentName: `${enrollment.student?.firstName || ''} ${enrollment.student?.lastName || ''}`.trim(),
      phone: enrollment.student?.phone || null,
      packageName: enrollment.package?.name || null,
      teacherName: enrollment.teacher?.name || null,
      remainingHours: remaining,
      expiresAt: enrollment.expiresAt,
      overdueAmount: parseInstallments(enrollment.installments)
        .filter((inst) => String(inst?.status || '').toUpperCase() !== 'PAID'
          && inst?.dueDate && new Date(inst.dueDate).getTime() < now.getTime())
        .reduce((sum, inst) => sum + money(inst.amount), 0),
      reasons,
    });
  }

  // Group members whose renewal is due or unpaid
  let groupDue = [];
  try {
    groupDue = await prisma.$queryRawUnsafe(`
      SELECT m."id", m."studentId", m."paymentStatus", m."amountPaid", m."nextRenewalDate",
             g."id" AS "groupId", g."name" AS "groupName", g."feeAmount",
             s."firstName", s."lastName", s."phone"
      FROM "education_group_members" m
      JOIN "education_groups" g ON g.id = m."groupId" AND g."companyId" = m."companyId"
      JOIN "education_students" s ON s.id = m."studentId" AND s."companyId" = m."companyId"
      WHERE m."companyId" = $1 AND m."status" = 'ACTIVE'
        AND (m."paymentStatus" <> 'PAID' OR (m."nextRenewalDate" IS NOT NULL AND m."nextRenewalDate" <= $2))
      LIMIT 500
    `, companyId, now);
  } catch (_) {
    groupDue = [];
  }

  const groupDueItems = (groupDue || []).map((row) => ({
    studentId: row.studentId,
    studentName: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
    phone: row.phone || null,
    groupName: row.groupName,
    groupId: row.groupId,
    remaining: money(money(row.feeAmount) - money(row.amountPaid)),
    nextRenewalDate: row.nextRenewalDate,
    reasons: [{ code: 'GROUP_DUE', label: 'تجديد رسوم المجموعة مستحق' }],
  }));

  return {
    period: { from: rangeStart, to: now, months, inactiveDays },
    summary: {
      revenue,
      payments: payments.length,
      average: payments.length ? money(revenue / payments.length) : 0,
      activeStudents,
      repeatStudents,
      repeatRate: activeStudents > 0 ? Math.round((repeatStudents / activeStudents) * 1000) / 10 : 0,
      atRisk: atRisk.length,
      groupDue: groupDueItems.length,
    },
    revenueByBranch,
    revenueByPackage,
    revenueByGroup,
    revenueByTeacher,
    teacherPerformance,
    atRisk,
    groupDue: groupDueItems,
    cohorts,
  };
}

module.exports = { buildInsights };

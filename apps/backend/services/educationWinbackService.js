/**
 * Win-back worklist: turns at-risk signals into staff follow-up actions.
 *
 * Risk = low group attendance OR unpaid dues OR inactivity, ranked by money at risk.
 * Actions live in `education_winback_actions`, one OPEN row per student, so the
 * same student is never queued twice while the case is being handled.
 */

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;
const DAY_MS = 24 * 3600 * 1000;

const LOW_ATTENDANCE = 70;
const MIN_RECORDS = 3;

const parseInstallments = (value) => {
  try {
    if (Array.isArray(value)) return value;
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
};

const overdueOf = (installments, now) =>
  money(parseInstallments(installments)
    .filter((inst) => String(inst?.status || '').toUpperCase() !== 'PAID')
    .filter((inst) => {
      const due = inst?.dueDate ? new Date(inst.dueDate) : null;
      return due && !Number.isNaN(due.getTime()) && due.getTime() < now.getTime();
    })
    .reduce((sum, inst) => sum + money(inst.amount), 0));

async function findCandidates(prisma, companyId, { months = 3, inactiveDays = 21 } = {}) {
  const safeMonths = Math.min(24, Math.max(1, Number(months) || 3));
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (safeMonths - 1), 1);

  const attendance = await prisma.$queryRawUnsafe(`
    SELECT a."studentId",
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE a."status" = 'PRESENT')::int AS present,
           MAX(gs."sessionDate") AS "lastSessionAt"
    FROM "education_group_attendance" a
    JOIN "education_group_sessions" gs ON gs."id" = a."sessionId" AND gs."companyId" = a."companyId"
    WHERE a."companyId" = $1 AND gs."sessionDate" >= $2
    GROUP BY a."studentId"
    LIMIT 2000
  `, companyId, rangeStart).catch(() => []);

  const attendanceMap = new Map((attendance || []).map((row) => [row.studentId, row]));
  const studentIds = [...attendanceMap.keys()];

  const enrollments = studentIds.length
    ? await prisma.educationEnrollment.findMany({
      where: { companyId, studentId: { in: studentIds }, isActive: true },
      select: {
        studentId: true, finalAmount: true, amountPaid: true, installments: true,
        package: { select: { price: true } },
      },
      take: 5000,
    }).catch(() => [])
    : [];

  const students = studentIds.length
    ? await prisma.educationStudent.findMany({
      where: { companyId, id: { in: studentIds } },
      select: {
        id: true, firstName: true, lastName: true, phone: true,
        customer: { select: { phone: true } },
      },
      take: 2000,
    }).catch(() => [])
    : [];
  const studentMap = new Map((students || []).map((row) => [row.id, row]));

  const duesMap = new Map();
  for (const enrollment of enrollments || []) {
    const charge = money(enrollment.finalAmount || enrollment.package?.price || 0);
    const remaining = Math.max(0, money(charge - money(enrollment.amountPaid)));
    const entry = duesMap.get(enrollment.studentId) || { dues: 0, overdue: 0 };
    entry.dues = money(entry.dues + remaining);
    entry.overdue = money(entry.overdue + overdueOf(enrollment.installments, now));
    duesMap.set(enrollment.studentId, entry);
  }

  const candidates = [];
  for (const [studentId, row] of attendanceMap.entries()) {
    const total = Number(row.total) || 0;
    if (total < MIN_RECORDS) continue;
    const rate = Math.round(((Number(row.present) || 0) / total) * 1000) / 10;
    const dues = duesMap.get(studentId) || { dues: 0, overdue: 0 };
    const lastSessionAt = row.lastSessionAt ? new Date(row.lastSessionAt) : null;
    const inactive = !lastSessionAt || (now.getTime() - lastSessionAt.getTime()) > inactiveDays * DAY_MS;

    const reasons = [];
    if (rate < LOW_ATTENDANCE) reasons.push('LOW_ATTENDANCE');
    if (dues.dues > 0) reasons.push('OPEN_DUES');
    if (dues.overdue > 0) reasons.push('OVERDUE');
    if (inactive) reasons.push('INACTIVE');
    if (reasons.length === 0) continue;

    const student = studentMap.get(studentId);
    candidates.push({
      studentId,
      studentName: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : null,
      phone: student?.phone || student?.customer?.phone || null,
      attendanceRate: rate,
      dues: dues.dues,
      overdue: dues.overdue,
      reasons,
      lastSessionAt,
      // Money first, then attendance: a paying-but-absent student still matters, just less.
      priority: Math.min(100, Math.round(dues.dues / 10) + (rate < LOW_ATTENDANCE ? 20 : 0) + (dues.overdue > 0 ? 15 : 0) + (inactive ? 10 : 0)),
    });
  }

  return candidates.sort((a, b) => b.priority - a.priority);
}

async function syncActions(prisma, companyId, candidates, { createdBy = null } = {}) {
  const open = await prisma.educationWinbackAction.findMany({
    where: { companyId, status: 'OPEN' },
    select: { studentId: true },
  }).catch(() => []);
  const openIds = new Set((open || []).map((row) => row.studentId));

  let created = 0;
  let skipped = 0;
  for (const candidate of candidates) {
    if (openIds.has(candidate.studentId)) {
      skipped += 1;
      continue;
    }
    await prisma.educationWinbackAction.create({
      data: {
        companyId,
        studentId: candidate.studentId,
        studentName: candidate.studentName,
        phone: candidate.phone,
        status: 'OPEN',
        priority: candidate.priority,
        attendanceRate: candidate.attendanceRate,
        dues: candidate.dues,
        overdue: candidate.overdue,
        reasons: candidate.reasons,
        notes: createdBy ? `أُنشئت تلقائيًا بواسطة ${createdBy}` : 'أُنشئت تلقائيًا',
      },
    });
    created += 1;
  }

  return { detected: candidates.length, created, skipped };
}

async function listActions(prisma, companyId, { status = 'OPEN', limit = 100 } = {}) {
  const safeLimit = Math.min(300, Math.max(1, Number(limit) || 100));
  return prisma.educationWinbackAction.findMany({
    where: { companyId, ...(status && status !== 'ALL' ? { status: String(status).toUpperCase() } : {}) },
    orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    take: safeLimit,
  });
}

async function completeAction(prisma, companyId, actionId, { status = 'DONE', handledBy = null, notes = null } = {}) {
  const action = await prisma.educationWinbackAction.findFirst({
    where: { id: actionId, companyId },
  });
  if (!action) return null;

  const normalized = ['DONE', 'IGNORED', 'OPEN'].includes(String(status).toUpperCase())
    ? String(status).toUpperCase()
    : 'DONE';

  return prisma.educationWinbackAction.update({
    where: { id: action.id },
    data: {
      status: normalized,
      handledAt: normalized === 'OPEN' ? null : new Date(),
      handledBy: normalized === 'OPEN' ? null : handledBy,
      ...(notes ? { notes: String(notes).slice(0, 500) } : {}),
    },
  });
}

async function runWinbackSync(prisma, { companyId = null, months = 3, inactiveDays = 21 } = {}) {
  let companyIds = [];
  if (companyId) {
    companyIds = [companyId];
  } else {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT DISTINCT "companyId" FROM "education_group_attendance" LIMIT 2000`
    ).catch(() => []);
    companyIds = (rows || []).map((row) => row.companyId).filter(Boolean);
  }

  const summary = { companies: companyIds.length, detected: 0, created: 0, skipped: 0 };
  for (const cid of companyIds) {
    const candidates = await findCandidates(prisma, cid, { months, inactiveDays });
    const result = await syncActions(prisma, cid, candidates);
    summary.detected += result.detected;
    summary.created += result.created;
    summary.skipped += result.skipped;
  }
  return summary;
}

module.exports = {
  findCandidates,
  syncActions,
  listActions,
  completeAction,
  runWinbackSync,
  LOW_ATTENDANCE,
  MIN_RECORDS,
};

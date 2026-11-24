/**
 * Weekly group alerts: loss-making groups, low occupancy, growth-blocking dues
 * and teacher-cost outliers — each with a concrete suggestion.
 *
 * Alerts are keyed by ISO week (`YYYY-Www`) so the same group is never nudged
 * twice in the same week, and a resolved alert stays resolved.
 */

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

const LOW_OCCUPANCY = 50;
const HIGH_TEACHER_SHARE = 60;

function weekKeyOf(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

const suggestFor = (group) => {
  const reasons = [];
  if (group.net < 0) {
    if (group.occupancy !== null && group.occupancy < LOW_OCCUPANCY) {
      reasons.push('دمج المجموعة مع مجموعة أخرى أو تخفيض عدد الحصص');
    } else {
      reasons.push('مراجعة السعر أو إعادة التفاوض على نسبة المدرّس');
    }
  }
  if (group.occupancy !== null && group.occupancy < LOW_OCCUPANCY && group.net >= 0) {
    reasons.push('حملة تسويق للمجموعة أو تحويل طلاب من قائمة الانتظار');
  }
  if (group.dues > 0 && group.revenue > 0 && group.dues > group.revenue * 0.5) {
    reasons.push('تحصيل المتأخرات قبل إضافة التزامات جديدة');
  }
  if (group.revenue > 0 && group.teacherCost / group.revenue > HIGH_TEACHER_SHARE / 100) {
    reasons.push('مراجعة نسبة المدرّس — التكلفة تتجاوز 60% من المحصّل');
  }
  return reasons.length ? reasons.join(' · ') : null;
};

function detectAlerts(groups) {
  const alerts = [];
  for (const group of groups || []) {
    const base = {
      groupId: group.groupId,
      groupName: group.name,
      metrics: {
        revenue: group.revenue,
        dues: group.dues,
        teacherCost: group.teacherCost,
        net: group.net,
        occupancy: group.occupancy,
        members: group.members,
        capacity: group.capacity,
      },
      suggestion: suggestFor(group),
    };

    if (group.net < 0) {
      alerts.push({
        ...base,
        type: 'LOSS',
        severity: group.net < -1000 ? 'HIGH' : 'MEDIUM',
        message: `المجموعة تعمل بخسارة ${money(Math.abs(group.net))} ج.م في الفترة`,
      });
    }

    if (group.occupancy !== null && group.occupancy < LOW_OCCUPANCY) {
      alerts.push({
        ...base,
        type: 'LOW_OCCUPANCY',
        severity: group.occupancy < 30 ? 'HIGH' : 'MEDIUM',
        message: `الإشغال ${group.occupancy}% (${group.members}/${group.capacity})`,
      });
    }

    if (group.dues > 0 && group.revenue > 0 && group.dues > group.revenue * 0.5) {
      alerts.push({
        ...base,
        type: 'HIGH_DUES',
        severity: 'MEDIUM',
        message: `مستحقات ${money(group.dues)} ج.م تعادل أكثر من نصف المحصّل`,
      });
    }

    if (group.revenue > 0 && group.teacherCost / group.revenue > HIGH_TEACHER_SHARE / 100) {
      alerts.push({
        ...base,
        type: 'HIGH_TEACHER_COST',
        severity: 'LOW',
        message: `تكلفة المدرّس ${money(group.teacherCost)} ج.م (${Math.round((group.teacherCost / group.revenue) * 100)}% من المحصّل)`,
      });
    }
  }
  return alerts;
}

async function syncAlerts(prisma, companyId, { months = 3, weekKey = weekKeyOf() } = {}) {
  const pnlService = require('./educationGroupPnlService');
  const report = await pnlService.buildGroupPnl(prisma, companyId, { months });
  const detected = detectAlerts(report.groups);

  let created = 0;
  let skipped = 0;

  for (const alert of detected) {
    const existing = await prisma.educationGroupAlert.findFirst({
      where: { companyId, groupId: alert.groupId, type: alert.type, weekKey },
      select: { id: true },
    }).catch(() => null);
    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.educationGroupAlert.create({
      data: {
        companyId,
        groupId: alert.groupId,
        groupName: alert.groupName,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        suggestion: alert.suggestion,
        metrics: alert.metrics,
        weekKey,
        status: 'OPEN',
      },
    });
    created += 1;
  }

  return { weekKey, groups: (report.groups || []).length, detected: detected.length, created, skipped };
}

async function listAlerts(prisma, companyId, { status = 'OPEN', limit = 100 } = {}) {
  const safeLimit = Math.min(300, Math.max(1, Number(limit) || 100));
  return prisma.educationGroupAlert.findMany({
    where: { companyId, ...(status && status !== 'ALL' ? { status: String(status).toUpperCase() } : {}) },
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    take: safeLimit,
  });
}

async function resolveAlert(prisma, companyId, alertId, { status = 'RESOLVED', resolvedBy = null } = {}) {
  const alert = await prisma.educationGroupAlert.findFirst({ where: { id: alertId, companyId } });
  if (!alert) return null;

  const normalized = ['RESOLVED', 'IGNORED', 'OPEN'].includes(String(status).toUpperCase())
    ? String(status).toUpperCase()
    : 'RESOLVED';

  return prisma.educationGroupAlert.update({
    where: { id: alert.id },
    data: {
      status: normalized,
      resolvedAt: normalized === 'OPEN' ? null : new Date(),
      resolvedBy: normalized === 'OPEN' ? null : resolvedBy,
    },
  });
}

async function runWeeklyGroupAlerts(prisma, { companyId = null, months = 3 } = {}) {
  let companyIds = [];
  if (companyId) {
    companyIds = [companyId];
  } else {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT DISTINCT "companyId" FROM "education_groups" LIMIT 2000`
    ).catch(() => []);
    companyIds = (rows || []).map((row) => row.companyId).filter(Boolean);
  }

  const weekKey = weekKeyOf();
  const summary = { companies: companyIds.length, detected: 0, created: 0, skipped: 0, weekKey };
  for (const cid of companyIds) {
    const result = await syncAlerts(prisma, cid, { months, weekKey });
    summary.detected += result.detected;
    summary.created += result.created;
    summary.skipped += result.skipped;
  }
  return summary;
}

module.exports = {
  detectAlerts,
  syncAlerts,
  listAlerts,
  resolveAlert,
  runWeeklyGroupAlerts,
  weekKeyOf,
  suggestFor,
  LOW_OCCUPANCY,
  HIGH_TEACHER_SHARE,
};

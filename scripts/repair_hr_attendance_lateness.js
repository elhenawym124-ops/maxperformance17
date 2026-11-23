#!/usr/bin/env node
/**
 * إصلاح احتساب التأخير في بصمة الموظفين (hr_attendances).
 *
 * السبب الجذري: مسار البصمة كان يمرّر employee.id بدل userId لمنازلة المناوبة
 * فما يلقاش أي تعيين، ويرجع لوقت ثابت 10:00 (أو 09:00 في كرون الإغلاق التلقائي).
 * النتيجة: كل موظف في شيفت مسائي يظهر متأخراً ساعات، وأحياناً الانصراف يسبق الحضور.
 *
 * الاستخدام:
 *   node scripts/repair_hr_attendance_lateness.js --company=<slug|id> [--days=60] [--apply]
 * بدون --apply = محاكاة فقط.
 */
const { getSharedPrismaClient } = require('../apps/backend/services/sharedDatabase');
const { combineDateAndTime, normalizeDateForDb } = require('../apps/backend/utils/dateUtils');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const companyArg = (args.find((a) => a.startsWith('--company=')) || '').split('=')[1] || null;
const daysArg = parseInt((args.find((a) => a.startsWith('--days=')) || '').split('=')[1], 10);
const DAYS = Number.isNaN(daysArg) ? 60 : Math.max(1, Math.min(365, daysArg));

const minutesBetween = (a, b) => Math.round((a.getTime() - b.getTime()) / 60000);

async function resolveShift(prisma, companyId, userId, date, timezone) {
  const targetDate = normalizeDateForDb(date, timezone);
  const assignment = await prisma.shiftAssignment.findFirst({
    where: { companyId, userId, date: { lte: targetDate } },
    include: { shift: true },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
  if (assignment?.shift) return assignment.shift;
  return prisma.shift.findFirst({
    where: { companyId, isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
}

function resolveAllowance(shift, latenessRules, settings) {
  if (latenessRules?.latestAllowedTime && latenessRules?.workStartTime) {
    const [lh, lm] = String(latenessRules.latestAllowedTime).split(':').map(Number);
    const [wh, wm] = String(latenessRules.workStartTime).split(':').map(Number);
    const diff = lh * 60 + lm - (wh * 60 + wm);
    if (!Number.isNaN(diff) && diff >= 0) return diff;
  }
  const raw = settings?.lateGracePeriod ?? settings?.lateThresholdMinutes;
  const parsed = Number(raw);
  return Number.isNaN(parsed) || parsed < 0 ? 10 : parsed;
}

const HHMM = (mins) =>
  `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

async function main() {
  const prisma = getSharedPrismaClient();
  const companies = await prisma.company.findMany({
    where: companyArg ? { OR: [{ id: companyArg }, { slug: companyArg }] } : undefined,
    select: { id: true, name: true, slug: true, timezone: true },
  });
  if (companyArg && companies.length === 0) {
    console.error(`Company not found: ${companyArg}`);
    process.exit(1);
  }

  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);

  for (const company of companies) {
    const timezone = company.timezone || 'Africa/Cairo';
    const settings = await prisma.hRSettings.findUnique({ where: { companyId: company.id } });
    const latenessRules = await prisma.latenessRules
      ?.findUnique({ where: { companyId: company.id } })
      .catch(() => null);
    const allowance = resolveAllowance(null, latenessRules, settings);

    const rows = await prisma.attendance.findMany({
      where: { companyId: company.id, date: { gte: since } },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { date: 'desc' },
      take: 10000,
    });

    if (rows.length === 0) continue;
    console.log(`\n=== ${company.name} (${company.slug || company.id}) — ${rows.length} سجل ===`);

    let changed = 0;
    for (const row of rows) {
      if (!row.checkIn) continue;
      const shift =
        (await resolveShift(prisma, company.id, row.userId, row.checkIn, timezone)) ||
        (latenessRules?.workStartTime ? { startTime: latenessRules.workStartTime, endTime: null } : null);
      const startTime = shift?.startTime || latenessRules?.workStartTime || '10:00';
      const endTime = shift?.endTime || null;

      const dayStart = normalizeDateForDb(row.checkIn, timezone);
      const workStart = combineDateAndTime(dayStart, startTime, timezone);
      if (!workStart) continue;
      const graceTime = new Date(workStart.getTime() + allowance * 60000);

      const checkIn = new Date(row.checkIn);
      const lateMinutes = checkIn > graceTime ? Math.max(0, minutesBetween(checkIn, graceTime)) : 0;
      const status = lateMinutes > 0 ? 'LATE' : (row.status === 'WEEKEND' ? 'WEEKEND' : 'PRESENT');

      let earlyLeaveMinutes = null;
      let overtimeHours = null;
      let scheduledEnd = null;
      if (endTime) {
        scheduledEnd = combineDateAndTime(dayStart, endTime, timezone);
        const [eh, em] = endTime.split(':').map(Number);
        const [sh, sm] = startTime.split(':').map(Number);
        const overnight = eh < sh || (eh === sh && em < sm);
        if (overnight && scheduledEnd) scheduledEnd = new Date(scheduledEnd.getTime() + 24 * 60 * 60 * 1000);
      }

      const isAutoClosed = String(row.checkOutMethod || '') === 'auto_system';
      let effectiveCheckOut = row.checkOut ? new Date(row.checkOut) : null;

      // انصراف تلقائي اتكتب على 17:00 الثابتة القديمة بدل نهاية الشيفت الحقيقي
      if (isAutoClosed && scheduledEnd && effectiveCheckOut &&
          Math.abs(effectiveCheckOut.getTime() - scheduledEnd.getTime()) > 60000 &&
          scheduledEnd.getTime() >= checkIn.getTime()) {
        effectiveCheckOut = scheduledEnd;
      }

      if (scheduledEnd && effectiveCheckOut) {
        const early = minutesBetween(scheduledEnd, effectiveCheckOut);
        earlyLeaveMinutes = early > 0 ? early : 0;
        const over = -early / 60;
        overtimeHours = over > 0 ? Math.round(over * 100) / 100 : 0;
      }

      const canCorrectAutoCheckout =
        isAutoClosed && scheduledEnd && scheduledEnd.getTime() >= checkIn.getTime();
      const invalidCheckout =
        row.checkOut && new Date(row.checkOut).getTime() < checkIn.getTime() && !canCorrectAutoCheckout;
      const checkoutNeedsFix =
        effectiveCheckOut && row.checkOut &&
        Math.abs(effectiveCheckOut.getTime() - new Date(row.checkOut).getTime()) > 60000;

      const workHours = effectiveCheckOut
        ? Math.max(0, Math.round((minutesBetween(effectiveCheckOut, checkIn) / 60) * 100) / 100)
        : null;

      const diffLate = (row.lateMinutes || 0) !== lateMinutes;
      const diffStatus = row.status !== status;
      const diffEarly = earlyLeaveMinutes !== null && (row.earlyLeaveMinutes || 0) !== earlyLeaveMinutes;
      const diffOvertime = overtimeHours !== null && Number(row.overtimeHours || 0) !== overtimeHours;
      if (!diffLate && !diffStatus && !diffEarly && !diffOvertime && !invalidCheckout && !checkoutNeedsFix) continue;

      const label = `${row.user?.firstName || ''} ${row.user?.lastName || ''}`.trim() || row.userId;
      const day = dayStart.toISOString().slice(0, 10);
      console.log(
        `  ${day} ${label}: شيفت ${startTime}${endTime ? `-${endTime}` : ''} | ` +
        `تأخير ${row.lateMinutes || 0}→${lateMinutes} | ${row.status}→${status}` +
        `${invalidCheckout ? ' | انصراف غير صالح' : ''}` +
        `${checkoutNeedsFix ? ` | انصراف تلقائي ${new Date(row.checkOut).toISOString().slice(11, 16)}→${effectiveCheckOut.toISOString().slice(11, 16)}Z` : ''}`
      );

      if (APPLY) {
        const data = { lateMinutes, status };
        if (invalidCheckout) {
          data.checkOut = null;
          data.workHours = 0;
          data.earlyLeaveMinutes = 0;
          data.overtimeHours = 0;
          data.notes = row.notes
            ? `${row.notes} (أُلغي انصراف تلقائي غير صالح)`
            : 'أُلغي انصراف تلقائي غير صالح';
        } else {
          if (checkoutNeedsFix) {
            data.checkOut = effectiveCheckOut;
            data.workHours = workHours || 0;
            data.notes = row.notes && !row.notes.includes('صُحّح انصراف')
              ? `${row.notes} (صُحّح انصراف تلقائي على نهاية الشيفت)`
              : row.notes || 'صُحّح انصراف تلقائي على نهاية الشيفت';
          }
          if (earlyLeaveMinutes !== null) data.earlyLeaveMinutes = earlyLeaveMinutes;
          if (overtimeHours !== null) data.overtimeHours = overtimeHours;
        }
        await prisma.attendance.update({ where: { id: row.id }, data });
      }
      changed += 1;
    }

    console.log(
      APPLY
        ? `  ✅ تم إصلاح ${changed} سجل`
        : `  [dry] ${changed} سجل يحتاج إصلاح — أضف --apply للتنفيذ`
    );
    console.log(`  (بداية الشيفت المستخدمة: ${HHMM(0)} + سماح ${allowance} دقيقة)`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('repair failed:', err);
    process.exit(1);
  });

/**
 * التحقق من توفر المدرس (W5)
 * ─────────────────────────────────────────────────────────────────────────────
 * قبل كده كان النظام يفحص تعارض الحصص فقط، ولا يفحص ساعات توفر المدرس.
 * القاعدة: لو المدرس لديه صفوف توفر مسجّلة → يجب أن تقع الحصة داخل أحدها.
 * لو لا توجد صفوف → يُسمح (توافق خلفي).
 */
const TZ = 'Africa/Cairo';

const DAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const getDayIndex = (date) => {
  const short = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(date);
  return DAY_INDEX[short] ?? date.getDay();
};

const getMinutes = (date) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date);
  const h = Number(parts.find(p => p.type === 'hour')?.value || 0);
  const m = Number(parts.find(p => p.type === 'minute')?.value || 0);
  return h * 60 + m;
};

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm || '').split(':').map(Number);
  if (Number.isNaN(h)) return null;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
};

/**
 * @returns {Promise<{ok: boolean, message?: string, code?: string}>}
 */
const checkTeacherAvailability = async (prisma, companyId, teacherId, start, end) => {
  if (!teacherId) return { ok: true };

  let slots = [];
  try {
    slots = await prisma.educationTeacherAvailability.findMany({
      where: { companyId, teacherId, isAvailable: true },
      select: { dayOfWeek: true, startTime: true, endTime: true },
    });
  } catch (_) {
    return { ok: true };
  }

  if (!Array.isArray(slots) || slots.length === 0) return { ok: true };

  const day = getDayIndex(start);
  const startMin = getMinutes(start);
  const endMin = getMinutes(end);
  const daySlots = slots.filter(s => Number(s.dayOfWeek) === day);

  if (daySlots.length === 0) {
    return { ok: false, code: 'TEACHER_NOT_AVAILABLE_DAY', message: 'المدرس غير متاح في هذا اليوم حسب جدول توفره' };
  }

  const inside = daySlots.some(slot => {
    const from = toMinutes(slot.startTime);
    const to = toMinutes(slot.endTime);
    if (from === null || to === null) return false;
    return startMin >= from && endMin <= to;
  });

  if (!inside) {
    const windows = daySlots.map(s => `${s.startTime}-${s.endTime}`).join(' · ');
    return {
      ok: false,
      code: 'OUTSIDE_AVAILABILITY',
      message: `موعد الحصة خارج ساعات توفر المدرس (${windows})`,
    };
  }

  return { ok: true };
};

module.exports = { checkTeacherAvailability };

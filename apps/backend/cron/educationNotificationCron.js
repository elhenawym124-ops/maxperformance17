/**
 * Education notification scheduler.
 *
 * يتبع نفس سلوك المنصة المعتمد في باقي الأنشطة:
 * - الجدول الفعّال بيقرأ من `customerNotificationSchedule` (enabled / delayValue / delayUnit)
 *   يعني تشغيل/إطفاء وتأخير الإشعار من اللوحة له تأثير حقيقي.
 * - الإرسال عبر `educationNotificationService` فقط (قوالب Meta المعتمدة + Push-first + quiet hours من الخدمة المركزية).
 * - منع التكرار بالاعتماد على سجل الإرسال (rawEventType + رقم المستلم) داخل نافذة زمنية،
 *   والاعتماد على السجل مش على علامة في الصف عشان مفيش marker columns في موديلات التعليم.
 * - كل مهمة ليها isRunning guard زي باقي الـ crons (booking/dental/wholesale).
 */

const cron = require('node-cron');
const { getSharedPrismaClient } = require('../services/sharedDatabase');
const educationNotificationService = require('../services/educationNotificationService');

const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;
const SENT_STATES = ['SENT', 'DELIVERED', 'READ'];

// افتراضيات الكتالوج لو مفيش صف في الجدول (بالساعات)
const DEFAULT_DELAYS = {
  education_session_reminder: 24,
  education_demo_day_reminder_24h: 24,
  education_demo_day_reminder_2h: 2,
  education_enrollment_expiring: 7 * 24,
};

// حد "الرصيد المنخفض" الافتراضي (ساعات)
const LOW_HOURS_THRESHOLD = 3;

let sessionRemindersRunning = false;
let balanceAlertsRunning = false;
let demoRemindersRunning = false;

const toHours = (row, fallbackHours) => {
  if (!row) return fallbackHours;
  const value = Number(row.delayValue);
  if (!Number.isFinite(value)) return fallbackHours;
  return String(row.delayUnit || 'HOURS').toUpperCase() === 'DAYS' ? value * 24 : value;
};

const loadScheduleMap = async (prisma, companyId, eventTypes) => {
  try {
    const rows = await prisma.customerNotificationSchedule.findMany({
      where: { companyId, eventType: { in: eventTypes } },
    });
    return new Map(rows.map((r) => [r.eventType, r]));
  } catch (error) {
    console.warn('[EDU-CRON] schedule read failed:', error.message);
    return new Map();
  }
};

const alreadyNotified = async (prisma, { companyId, eventType, phone, since, until = null }) => {
  if (!phone) return false;
  try {
    const row = await prisma.whatsAppNotificationLog.findFirst({
      where: {
        companyId,
        rawEventType: eventType,
        recipientPhone: phone,
        createdAt: until ? { gte: since, lte: until } : { gte: since },
        status: { in: SENT_STATES },
      },
      select: { id: true },
    });
    return Boolean(row);
  } catch {
    return false;
  }
};

/** تذكير الحصص (ولي الأمر + المعلم) — كل 30 دقيقة. */
async function runSessionReminders(now = new Date()) {
  if (sessionRemindersRunning) return { skipped: true };
  sessionRemindersRunning = true;
  try {
    const prisma = getSharedPrismaClient();
    const sessions = await prisma.educationSession.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { gte: new Date(now.getTime() + 1 * HOUR_MS), lte: new Date(now.getTime() + 30 * DAY_MS) },
      },
      select: {
        id: true,
        companyId: true,
        scheduledAt: true,
        student: { select: { customerId: true, customer: { select: { phone: true } } } },
      },
      take: 500,
    });

    const schedules = new Map();
    let sent = 0;

    for (const session of sessions) {
      if (!schedules.has(session.companyId)) {
        schedules.set(
          session.companyId,
          await loadScheduleMap(prisma, session.companyId, ['education_session_reminder', 'education_session_reminder_teacher'])
        );
      }
      const map = schedules.get(session.companyId);
      const parentRow = map.get('education_session_reminder');
      if (parentRow && parentRow.enabled === false) continue;

      const delayHours = toHours(parentRow, DEFAULT_DELAYS.education_session_reminder);
      const hoursToSession = (new Date(session.scheduledAt).getTime() - now.getTime()) / HOUR_MS;
      if (hoursToSession < delayHours - 1 || hoursToSession > delayHours + 1) continue;

      const phone = session.student?.customer?.phone || null;
      const since = new Date(new Date(session.scheduledAt).getTime() - (delayHours + 2) * HOUR_MS);
      if (await alreadyNotified(prisma, {
        companyId: session.companyId,
        eventType: 'education_session_reminder',
        phone,
        since,
        until: new Date(session.scheduledAt),
      })) continue;

      try {
        await educationNotificationService.notifySessionReminder(session.companyId, session.id);
        sent++;
      } catch (error) {
        console.warn(`[EDU-CRON] session reminder failed (${session.id}):`, error.message);
      }
    }

    return { sent };
  } finally {
    sessionRemindersRunning = false;
  }
}

/** تنبيهات الرصيد (منخفض / قرب الانتهاء) — يومياً 10:00. */
async function runBalanceAlerts(now = new Date()) {
  if (balanceAlertsRunning) return { skipped: true };
  balanceAlertsRunning = true;
  try {
    const prisma = getSharedPrismaClient();
    const enrollments = await prisma.educationEnrollment.findMany({
      where: { isActive: true, remainingHours: { gt: 0 } },
      select: {
        id: true,
        companyId: true,
        remainingHours: true,
        totalHours: true,
        expiresAt: true,
        student: { select: { customerId: true, customer: { select: { phone: true } } } },
      },
      take: 2000,
    });

    const schedules = new Map();
    let lowHoursSent = 0;
    let expiringSent = 0;

    for (const enrollment of enrollments) {
      if (!schedules.has(enrollment.companyId)) {
        schedules.set(
          enrollment.companyId,
          await loadScheduleMap(prisma, enrollment.companyId, [
            'education_enrollment_low_hours',
            'education_enrollment_expiring',
          ])
        );
      }
      const map = schedules.get(enrollment.companyId);
      const phone = enrollment.student?.customer?.phone || null;
      if (!phone) continue;

      // 1) رصيد منخفض
      const lowRow = map.get('education_enrollment_low_hours');
      const lowEnabled = !lowRow || lowRow.enabled !== false;
      if (lowEnabled && Number(enrollment.remainingHours) <= LOW_HOURS_THRESHOLD) {
        const lowNotified = await alreadyNotified(prisma, {
          companyId: enrollment.companyId,
          eventType: 'education_enrollment_low_hours',
          phone,
          since: new Date(now.getTime() - 3 * DAY_MS),
        });
        if (!lowNotified) {
          try {
            await educationNotificationService.notifyEnrollmentLowHours(enrollment.companyId, enrollment);
            lowHoursSent++;
          } catch (error) {
            console.warn(`[EDU-CRON] low hours failed (${enrollment.id}):`, error.message);
          }
        }
      }

      // 2) قرب انتهاء الباقة
      if (!enrollment.expiresAt) continue;
      const expRow = map.get('education_enrollment_expiring');
      if (expRow && expRow.enabled === false) continue;
      const windowMs = toHours(expRow, DEFAULT_DELAYS.education_enrollment_expiring) * HOUR_MS;
      const msToExpiry = new Date(enrollment.expiresAt).getTime() - now.getTime();
      if (msToExpiry < 0 || msToExpiry > windowMs) continue;

      const expiryNotified = await alreadyNotified(prisma, {
        companyId: enrollment.companyId,
        eventType: 'education_enrollment_expiring',
        phone,
        since: new Date(now.getTime() - 7 * DAY_MS),
      });
      if (!expiryNotified) {
        try {
          await educationNotificationService.notifyEnrollmentExpiring(enrollment.companyId, enrollment);
          expiringSent++;
        } catch (error) {
          console.warn(`[EDU-CRON] expiring failed (${enrollment.id}):`, error.message);
        }
      }
    }

    return { lowHoursSent, expiringSent };
  } finally {
    balanceAlertsRunning = false;
  }
}

/** تذكير الديمو داي (24 ساعة / ساعتين) — كل 15 دقيقة. */
async function runDemoDayReminders(now = new Date()) {
  if (demoRemindersRunning) return { skipped: true };
  demoRemindersRunning = true;
  try {
    const prisma = getSharedPrismaClient();
    const demoDays = await prisma.educationDemoDay.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { gte: new Date(now.getTime() + 1 * HOUR_MS), lte: new Date(now.getTime() + 30 * HOUR_MS) },
      },
      select: { id: true, companyId: true, scheduledAt: true },
    });

    let sent = 0;
    for (const demoDay of demoDays) {
      const hoursToEvent = (new Date(demoDay.scheduledAt).getTime() - now.getTime()) / HOUR_MS;
      const schedules = await loadScheduleMap(prisma, demoDay.companyId, [
        'education_demo_day_reminder_24h',
        'education_demo_day_reminder_2h',
      ]);

      const candidates = [
        { type: '24h', eventType: 'education_demo_day_reminder_24h' },
        { type: '2h', eventType: 'education_demo_day_reminder_2h' },
      ];

      for (const candidate of candidates) {
        const row = schedules.get(candidate.eventType);
        if (row && row.enabled === false) continue;
        const delayHours = toHours(row, DEFAULT_DELAYS[candidate.eventType]);
        if (hoursToEvent < delayHours - 0.5 || hoursToEvent > delayHours + 1) continue;

        const attendees = await prisma.educationDemoAttendee.findMany({
          where: {
            demoDayId: demoDay.id,
            companyId: demoDay.companyId,
            attendanceStatus: { in: ['REGISTERED', 'CONFIRMED'] },
          },
          select: { id: true, phone: true, guardianName: true, studentName: true },
          take: 500,
        });

        for (const attendee of attendees) {
          const recently = await alreadyNotified(prisma, {
            companyId: demoDay.companyId,
            eventType: candidate.eventType,
            phone: attendee.phone,
            since: new Date(now.getTime() - 20 * HOUR_MS),
          });
          if (recently) continue;
          try {
            await educationNotificationService.notifyDemoDayReminder({
              companyId: demoDay.companyId,
              demoDay,
              attendee,
              type: candidate.type,
            });
            sent++;
          } catch (error) {
            console.warn(`[EDU-CRON] demo ${candidate.type} failed (${attendee.id}):`, error.message);
          }
        }
      }
    }

    return { sent };
  } finally {
    demoRemindersRunning = false;
  }
}

function startEducationNotificationScheduler() {
  console.log('[EDU-CRON] Registering education notification scheduler...');
  cron.schedule('*/30 * * * *', () => {
    runSessionReminders().catch((error) => console.error('[EDU-CRON] session reminders job failed:', error.message));
  });
  cron.schedule('0 10 * * *', () => {
    runBalanceAlerts().catch((error) => console.error('[EDU-CRON] balance alerts job failed:', error.message));
  });
  cron.schedule('*/15 * * * *', () => {
    runDemoDayReminders().catch((error) => console.error('[EDU-CRON] demo reminders job failed:', error.message));
  });
  console.log('[EDU-CRON] Education notification scheduler registered (session */30, balance daily 10:00, demo */15).');
}

module.exports = {
  startEducationNotificationScheduler,
  runSessionReminders,
  runBalanceAlerts,
  runDemoDayReminders,
  LOW_HOURS_THRESHOLD,
};

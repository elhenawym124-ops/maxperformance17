/**
 * Outstanding-balance reminders ("كشف حساب" nudge) for education packages.
 *
 * Source: enrollments with finalAmount − amountPaid > threshold, grouped per student.
 * Dedupe: one WhatsApp per parent phone per `dedupeDays` window.
 */

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;
const DAY_MS = 24 * 3600 * 1000;
const SENT_STATES = ['SENT', 'DELIVERED', 'READ'];

async function findOutstanding(prisma, companyId, { months = 12, minAmount = 1 } = {}) {
  const safeMonths = Math.min(36, Math.max(1, Number(months) || 12));
  const from = new Date(Date.now() - safeMonths * 30 * DAY_MS);

  const rows = await prisma.$queryRawUnsafe(`
    SELECT e."id" AS "enrollmentId", e."studentId", e."finalAmount", e."amountPaid",
           COALESCE(p."price", 0) AS "packagePrice", p."name" AS "packageName",
           s."firstName", s."lastName", s."phone" AS "studentPhone", s."customerId",
           c."phone" AS "parentPhone", c."firstName" AS "parentFirstName", c."lastName" AS "parentLastName"
    FROM "education_enrollments" e
    JOIN "education_students" s ON s."id" = e."studentId" AND s."companyId" = e."companyId"
    LEFT JOIN "education_packages" p ON p."id" = e."packageId" AND p."companyId" = e."companyId"
    LEFT JOIN "customers" c ON c."id" = s."customerId"
    WHERE e."companyId" = $1
      AND e."isActive" = true
      AND e."enrollmentDate" >= $2
      AND (COALESCE(e."finalAmount", p."price", 0) - COALESCE(e."amountPaid", 0)) > $3
    ORDER BY (COALESCE(e."finalAmount", p."price", 0) - COALESCE(e."amountPaid", 0)) DESC
    LIMIT 500
  `, companyId, from, money(minAmount)).catch(() => []);

  const byStudent = new Map();
  for (const row of rows || []) {
    const remaining = money(money(row.finalAmount || row.packagePrice || 0) - money(row.amountPaid));
    if (remaining <= 0) continue;

    const entry = byStudent.get(row.studentId) || {
      companyId,
      studentId: row.studentId,
      studentName: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
      customerId: row.customerId || null,
      parentName: `${row.parentFirstName || ''} ${row.parentLastName || ''}`.trim() || 'وليّ الأمر',
      parentPhone: row.parentPhone || row.studentPhone || null,
      balance: 0,
      enrollments: 0,
      packages: [],
    };
    entry.balance = money(entry.balance + remaining);
    entry.enrollments += 1;
    if (row.packageName) entry.packages.push(row.packageName);
    byStudent.set(row.studentId, entry);
  }

  return [...byStudent.values()].sort((a, b) => b.balance - a.balance);
}

async function wasRecentlyNotified(prisma, { companyId, phone, days = 7, now = new Date() }) {
  if (!phone) return false;
  try {
    const row = await prisma.whatsAppNotificationLog.findFirst({
      where: {
        companyId,
        rawEventType: 'education_statement_due',
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

async function notifyOutstanding(prisma, students, { notifier = null, dedupeDays = 7, now = new Date() } = {}) {
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
      days: dedupeDays,
      now,
    });
    if (already) {
      results.skipped += 1;
      continue;
    }

    try {
      await notificationService.notifyStatementDue({
        companyId: student.companyId,
        customerId: student.customerId,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        studentName: student.studentName,
        amount: student.balance,
        studentId: student.studentId,
      });
      results.sent += 1;
      results.items.push({ studentId: student.studentId, balance: student.balance });
    } catch (error) {
      results.failed += 1;
      console.warn('[StatementDue] send failed:', error.message);
    }
  }

  return results;
}

async function runStatementReminders(prisma, { companyId = null, months = 12, minAmount = 1, dedupeDays = 7, notifier = null } = {}) {
  let companyIds = [];
  if (companyId) {
    companyIds = [companyId];
  } else {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT DISTINCT "companyId" FROM "education_enrollments" WHERE "isActive" = true LIMIT 2000`
    ).catch(() => []);
    companyIds = (rows || []).map((row) => row.companyId).filter(Boolean);
  }

  const summary = { companies: companyIds.length, detected: 0, sent: 0, skipped: 0, failed: 0 };
  for (const cid of companyIds) {
    const students = await findOutstanding(prisma, cid, { months, minAmount });
    summary.detected += students.length;
    const result = await notifyOutstanding(prisma, students, { notifier, dedupeDays });
    summary.sent += result.sent;
    summary.skipped += result.skipped;
    summary.failed += result.failed;
  }
  return summary;
}

module.exports = { findOutstanding, notifyOutstanding, runStatementReminders };

/**
 * Parent engagement: WhatsApp funnel, activation and best send window.
 *
 * Sources:
 * - `whatsAppNotificationLog` for the delivery funnel (SENT/DELIVERED/READ/FAILED).
 * - `customers.password` for portal activation among guardians of active students.
 */

const DAY_MS = 24 * 3600 * 1000;
const SENT_STATES = ['SENT', 'DELIVERED', 'READ'];

const pct = (part, total) => {
  if (!total || total <= 0) return null;
  return Math.round((part / total) * 1000) / 10;
};

const hourOf = (date) => {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? null : d.getHours();
};

async function buildEngagement(prisma, companyId, { months = 3, minSample = 5 } = {}) {
  const safeMonths = Math.min(12, Math.max(1, Number(months) || 3));
  const now = new Date();
  const rangeStart = new Date(now.getTime() - safeMonths * 30 * DAY_MS);

  const [logs, guardianRows] = await Promise.all([
    prisma.whatsAppNotificationLog.findMany({
      where: { companyId, createdAt: { gte: rangeStart } },
      select: { status: true, rawEventType: true, recipientPhone: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 20000,
    }).catch(() => []),
    prisma.$queryRawUnsafe(`
      SELECT COUNT(DISTINCT s."customerId")::int AS "guardians",
             COUNT(DISTINCT CASE WHEN c."password" IS NOT NULL AND c."password" <> ''
                                 THEN s."customerId" END)::int AS "activated"
      FROM "education_students" s
      LEFT JOIN "customers" c ON c."id" = s."customerId" AND c."companyId" = s."companyId"
      WHERE s."companyId" = $1 AND s."isActive" = true AND s."customerId" IS NOT NULL
    `, companyId).catch(() => []),
  ]);

  const summary = {
    messages: logs.length,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    readRate: null,
    deliveryRate: null,
    guardians: Number(guardianRows?.[0]?.guardians || 0),
    activated: Number(guardianRows?.[0]?.activated || 0),
    activationRate: null,
  };

  const byEventMap = new Map();
  const byHourMap = new Map();
  const byPhoneMap = new Map();

  for (const log of logs) {
    const status = String(log.status || '').toUpperCase();
    if (status === 'READ') summary.read += 1;
    else if (status === 'DELIVERED') summary.delivered += 1;
    else if (status === 'FAILED') summary.failed += 1;
    else if (status === 'SENT') summary.sent += 1;

    const eventType = log.rawEventType || 'other';
    const event = byEventMap.get(eventType) || { eventType, total: 0, read: 0, failed: 0 };
    event.total += 1;
    if (status === 'READ') event.read += 1;
    if (status === 'FAILED') event.failed += 1;
    byEventMap.set(eventType, event);

    const hour = hourOf(log.createdAt);
    if (hour !== null) {
      const bucket = byHourMap.get(hour) || { hour, total: 0, read: 0 };
      bucket.total += 1;
      if (status === 'READ') bucket.read += 1;
      byHourMap.set(hour, bucket);
    }

    if (log.recipientPhone) {
      const phone = byPhoneMap.get(log.recipientPhone) || { phone: log.recipientPhone, total: 0, read: 0 };
      phone.total += 1;
      if (status === 'READ') phone.read += 1;
      byPhoneMap.set(log.recipientPhone, phone);
    }
  }

  const reached = summary.sent + summary.delivered + summary.read;
  summary.deliveryRate = pct(reached, logs.length);
  summary.readRate = pct(summary.read, logs.length);
  summary.activationRate = pct(summary.activated, summary.guardians);

  const byEventType = [...byEventMap.values()]
    .map((row) => ({ ...row, readRate: pct(row.read, row.total) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);

  const byHour = [...byHourMap.values()]
    .sort((a, b) => a.hour - b.hour)
    .map((row) => ({ ...row, readRate: pct(row.read, row.total) }));

  const eligibleHours = byHour.filter((row) => row.total >= Math.max(1, Number(minSample) || 5));
  const candidates = eligibleHours.length ? eligibleHours : byHour;
  const bestHour = candidates.length
    ? [...candidates].sort((a, b) => (b.readRate || 0) - (a.readRate || 0) || b.total - a.total)[0]
    : null;

  const ignored = [...byPhoneMap.values()]
    .filter((row) => row.total >= 3 && row.read === 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  return {
    period: { from: rangeStart, to: now, months: safeMonths },
    summary,
    byEventType,
    byHour,
    bestHour: bestHour
      ? { hour: bestHour.hour, readRate: bestHour.readRate, total: bestHour.total }
      : null,
    ignored: {
      count: ignored.length,
      phones: ignored,
    },
  };
}

module.exports = { buildEngagement, SENT_STATES };

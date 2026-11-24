/**
 * Education group-session rollover.
 *
 * Group sessions are generated once for the group period (startDate → endDate).
 * Without this job the generated schedule simply runs out and the calendar goes
 * empty for every running group. This job extends the schedule of groups that are
 * still running (OPEN / IN_PROGRESS / FULL) and still have active members, so the
 * horizon is always ≥ 4 weeks ahead.
 *
 * Safety:
 * - never touches groups without ACTIVE members (finished / abandoned groups stay closed)
 * - keeps the original group startDate (only endDate advances)
 * - clearFutureScheduled=false → existing session dates are never deleted/recreated
 * - singleton owner only (one PM2 worker) + isRunning guard
 */

const cron = require('node-cron');
const { getSharedPrismaClient } = require('../services/sharedDatabase');
const { shouldOwnSingletonWork } = require('../utils/processOwnership');

const HORIZON_DAYS = 7; // extend groups whose range ends within a week
const EXTEND_DAYS = 28; // add four more weeks of sessions
const MAX_GROUPS_PER_RUN = 200;

let running = false;

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

async function runGroupSessionRollover({ dryRun = false } = {}) {
  if (running) {
    return { skipped: true, reason: 'already-running' };
  }
  running = true;

  const summary = {
    scanned: 0,
    extended: 0,
    skippedNoMembers: 0,
    skippedNoSchedule: 0,
    failed: 0,
    groups: [],
  };

  try {
    const prisma = getSharedPrismaClient();

    const rows = await prisma.$queryRawUnsafe(
      `
      SELECT
        g.id,
        g."companyId",
        g.name,
        g."endDate",
        g."scheduleSlots",
        g."scheduleDays",
        (SELECT COUNT(*)::int FROM "education_group_members" m
           WHERE m."groupId" = g.id
             AND m."companyId" = g."companyId"
             AND m.status = 'ACTIVE') AS "membersCount"
      FROM "education_groups" g
      WHERE g.status IN ('OPEN', 'IN_PROGRESS', 'FULL')
        AND g."endDate" IS NOT NULL
        AND g."endDate" <= NOW() + ($1::int * INTERVAL '1 day')
      ORDER BY g."endDate" ASC
      LIMIT $2
      `,
      HORIZON_DAYS,
      MAX_GROUPS_PER_RUN,
    );

    summary.scanned = (rows || []).length;

    if (summary.scanned === 0) return summary;

    // Lazy require: avoids a circular require at module load (groups controller → no cron).
    const { generateGroupSessionsInternal } = require('../controller/educationGroupsController');

    const today = startOfDay(new Date());

    for (const group of rows) {
      if (Number(group.membersCount || 0) <= 0) {
        summary.skippedNoMembers += 1;
        continue;
      }

      let hasSchedule = false;
      if (Array.isArray(group.scheduleSlots)) {
        hasSchedule = group.scheduleSlots.length > 0;
      } else if (typeof group.scheduleSlots === 'string' && group.scheduleSlots.trim()) {
        try {
          hasSchedule = JSON.parse(group.scheduleSlots).length > 0;
        } catch (_) {
          hasSchedule = false;
        }
      }
      if (!hasSchedule) {
        const days = Array.isArray(group.scheduleDays)
          ? group.scheduleDays
          : (() => {
              try {
                return JSON.parse(group.scheduleDays || '[]');
              } catch (_) {
                return [];
              }
            })();
        hasSchedule = Array.isArray(days) && days.length > 0;
      }
      if (!hasSchedule) {
        summary.skippedNoSchedule += 1;
        continue;
      }

      const currentEnd = startOfDay(group.endDate);
      // Start the new range the day after the current horizon, never in the past.
      let rangeStart = addDays(currentEnd, 1);
      if (rangeStart < today) rangeStart = today;
      const rangeEnd = addDays(rangeStart, EXTEND_DAYS);

      if (dryRun) {
        summary.extended += 1;
        summary.groups.push({
          id: group.id,
          name: group.name,
          companyId: group.companyId,
          rangeStart,
          rangeEnd,
          dryRun: true,
        });
        continue;
      }

      try {
        const result = await generateGroupSessionsInternal({
          prisma,
          companyId: group.companyId,
          groupId: group.id,
          startDate: rangeStart,
          endDate: rangeEnd,
          clearFutureScheduled: false,
          preserveGroupStart: true,
        });

        summary.extended += 1;
        summary.groups.push({
          id: group.id,
          name: group.name,
          companyId: group.companyId,
          rangeStart,
          rangeEnd,
          created: result?.count ?? null,
        });
      } catch (error) {
        summary.failed += 1;
        console.error(
          `[EDU-ROLLOVER] failed for group ${group.name} (${group.id}):`,
          error.message,
        );
      }
    }

    if (summary.extended > 0) {
      console.log(
        `[EDU-ROLLOVER] extended ${summary.extended} group(s) by ${EXTEND_DAYS} days ` +
          `(scanned ${summary.scanned}, no-members ${summary.skippedNoMembers}, ` +
          `no-schedule ${summary.skippedNoSchedule}, failed ${summary.failed})`,
      );
    }

    return summary;
  } finally {
    running = false;
  }
}

function startEducationGroupSessionRolloverCron() {
  if (!shouldOwnSingletonWork()) {
    console.log('[EDU-ROLLOVER] skipped on this worker (not singleton owner)');
    return null;
  }

  console.log('[EDU-ROLLOVER] Registering group-session rollover (daily 03:10)...');
  const task = cron.schedule('10 3 * * *', () => {
    runGroupSessionRollover().catch((error) =>
      console.error('[EDU-ROLLOVER] job failed:', error.message),
    );
  });

  console.log('[EDU-ROLLOVER] Group-session rollover registered (keeps a 4-week session horizon).');
  return task;
}

module.exports = {
  runGroupSessionRollover,
  startEducationGroupSessionRolloverCron,
};

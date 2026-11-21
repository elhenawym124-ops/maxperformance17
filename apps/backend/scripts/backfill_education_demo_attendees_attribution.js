'use strict';

/**
 * Idempotent Backfill for education_demo_attendees attribution and registration fields.
 * Extracts data from legacy [ATTR: {...}] tag in notes.
 * STRICT SAFETY RULE: NEVER edits or deletes the notes column!
 */

const path = require('path');
const {
  normalizeSourceChannel,
  extractAttributionFromNotes,
} = require('../services/educationAttributionHelper');

async function runBackfill(options = {}) {
  const logger = options.logger || console;
  let prisma = options.prisma;

  if (!prisma) {
    const { getSharedPrismaClient } = require('../services/sharedDatabase');
    prisma = getSharedPrismaClient();
  }

  // Ensure table columns and indexes exist
  const { ensureTablesExist } = require('../services/educationDemoDayService');
  await ensureTablesExist(prisma);

  // 1. Select only rows that haven't been backfilled yet
  const eligibleRows = await prisma.$queryRawUnsafe(`
    SELECT 
      "id", "companyId", "demoDayId", "studentName", "notes",
      "registeredByType", "sourceChannel", "campaignName", "adRef", "postRef"
    FROM "education_demo_attendees"
    WHERE "sourceChannel" IS NULL OR "registeredByType" IS NULL
    ORDER BY "createdAt" ASC
  `);

  logger.log(`[BackfillAttribution] Found ${eligibleRows.length} eligible rows requiring backfill.`);

  const auditLog = [];
  let updatedCount = 0;
  let skippedCount = 0;

  for (const row of eligibleRows) {
    try {
      const parsed = extractAttributionFromNotes(row.notes);
      let channel = null;
      let rawSource = null;
      let campaign = null;
      let adRef = null;
      let postRef = null;
      let registeredByType = row.registeredByType || null;

      if (parsed) {
        const norm = normalizeSourceChannel(parsed.source, 'WEBSITE');
        channel = norm.channel;
        rawSource = norm.raw;
        campaign = parsed.campaign || 'الموقع العام';
        adRef = parsed.adId ? String(parsed.adId).trim() : null;
        postRef = parsed.postId ? String(parsed.postId).trim() : null;

        if (!registeredByType) {
          // Identify if it was self or employee
          const notesText = String(row.notes || '');
          if (notesText.includes('تسجيل ذاتي') || campaign === 'الموقع العام' || channel === 'WEBSITE') {
            registeredByType = 'SELF';
          } else {
            registeredByType = 'SELF'; // Default legacy rows to SELF unless specified
          }
        }
      } else {
        // Fallback for rows without [ATTR: ...] tag
        channel = 'OTHER';
        rawSource = null;
        campaign = 'حملة عامة / غير محددة';
        if (!registeredByType) {
          registeredByType = 'OTHER';
        }
      }

      // Execute atomic update without touching notes
      await prisma.$executeRawUnsafe(`
        UPDATE "education_demo_attendees"
        SET 
          "registeredByType" = COALESCE("registeredByType", $1),
          "sourceChannel" = COALESCE("sourceChannel", $2),
          "sourceRaw" = COALESCE("sourceRaw", $3),
          "campaignName" = COALESCE("campaignName", $4),
          "adRef" = COALESCE("adRef", $5),
          "postRef" = COALESCE("postRef", $6)
        WHERE "id" = $7 AND ("sourceChannel" IS NULL OR "registeredByType" IS NULL)
      `, registeredByType, channel, rawSource, campaign, adRef, postRef, row.id);

      updatedCount++;
      const auditEntry = {
        attendeeId: row.id,
        companyId: row.companyId,
        studentName: row.studentName,
        registeredByType,
        sourceChannel: channel,
        campaignName: campaign,
        adRef,
        postRef,
        notesUntouched: true,
        timestamp: new Date().toISOString()
      };
      auditLog.push(auditEntry);
      logger.log(`[BackfillAttribution] Backfilled row ${row.id} (${row.studentName}): type=${registeredByType}, channel=${channel}, campaign=${campaign}`);
    } catch (err) {
      skippedCount++;
      logger.error(`[BackfillAttribution] Error backfilling attendee ${row.id}:`, err.message);
    }
  }

  const summary = {
    totalEligible: eligibleRows.length,
    updatedCount,
    skippedCount,
    alreadyBackfilledCount: 0,
    timestamp: new Date().toISOString(),
    auditLog
  };

  logger.log(`[BackfillAttribution] Completed: updated=${updatedCount}, skipped=${skippedCount}`);
  return summary;
}

if (require.main === module) {
  runBackfill()
    .then((result) => {
      console.log('Backfill result:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Backfill failed:', err);
      process.exit(1);
    });
}

module.exports = { runBackfill };

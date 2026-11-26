#!/usr/bin/env node

/**
 * sync_ad_budget_planner_app.js
 *
 * Ensures the Ad Budget Planner app (ad-budget-planner) is active and public
 * in the marketplace database with mainRoute/adminRoute configured to /tools/ad-budget-planner.
 */

const { getSharedPrismaClientAsync, closeSharedDatabase } = require('../../services/sharedDatabase');

const SLUG = 'ad-budget-planner';

async function main() {
  const prisma = await getSharedPrismaClientAsync();

  const app = await prisma.marketplaceApp.findUnique({ where: { slug: SLUG } });

  if (!app) {
    console.log(`[sync:${SLUG}] App not found in database — will be created by catalog:sync-target.`);
    await closeSharedDatabase();
    return;
  }

  console.log(`[sync:${SLUG}] Current state: isActive=${app.isActive}, isPublic=${app.isPublic}, mainRoute=${app.mainRoute}`);

  const updated = await prisma.marketplaceApp.update({
    where: { slug: SLUG },
    data: {
      isActive: true,
      isPublic: true,
      mainRoute: '/tools/ad-budget-planner',
      adminRoute: '/tools/ad-budget-planner',
    },
  });

  console.log(`✅ [sync:${SLUG}] Updated successfully: isActive=${updated.isActive}, isPublic=${updated.isPublic}, mainRoute=${updated.mainRoute}`);

  await closeSharedDatabase();
  process.exit(0);
}

main().catch((err) => {
  console.error(`❌ [sync:${SLUG}] Failed:`, err);
  process.exit(1);
});

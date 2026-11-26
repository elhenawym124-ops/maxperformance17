#!/usr/bin/env node

/**
 * sync_marketplace_hub_app.js
 *
 * Syncs the Marketplace Hub (OmniSeller) brand name in the database
 * to match apps/backend/catalog/marketplace/apps.json so catalog:diff stays clean.
 */

const { getSharedPrismaClientAsync, closeSharedDatabase } = require('../../services/sharedDatabase');

const SLUG = 'marketplace-hub';
const TARGET_NAME = 'أفق التجارة | OmniSeller';

async function main() {
  const prisma = await getSharedPrismaClientAsync();

  const app = await prisma.marketplaceApp.findUnique({ where: { slug: SLUG } });

  if (!app) {
    console.log(`[sync:${SLUG}] App not found in database — will be created by catalog:sync-target.`);
    await closeSharedDatabase();
    return;
  }

  console.log(`[sync:${SLUG}] Current name: ${app.name}`);

  if (app.name !== TARGET_NAME) {
    const updated = await prisma.marketplaceApp.update({
      where: { slug: SLUG },
      data: { name: TARGET_NAME },
    });
    console.log(`✅ [sync:${SLUG}] Updated name successfully: ${updated.name}`);
  } else {
    console.log(`✅ [sync:${SLUG}] Name already up to date.`);
  }

  await closeSharedDatabase();
  process.exit(0);
}

main().catch((err) => {
  console.error(`❌ [sync:${SLUG}] Failed:`, err);
  process.exit(1);
});

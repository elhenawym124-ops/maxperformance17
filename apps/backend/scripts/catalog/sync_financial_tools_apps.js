#!/usr/bin/env node

/**
 * sync_financial_tools_apps.js
 *
 * Ensures all financial-pricing-suite calculator apps are active and public
 * in the marketplace database with their canonical routes configured.
 */

const { getSharedPrismaClientAsync, closeSharedDatabase } = require('../../services/sharedDatabase');

const TARGET_APPS = [
  { slug: 'product-break-even', route: '/tools/product-break-even' },
  { slug: 'campaign-calculator', route: '/campaign-calculator' },
  { slug: 'monthly-pnl', route: '/tools/monthly-pnl' },
  { slug: 'upsell-planner', route: '/tools/upsell-planner' },
];

async function main() {
  const prisma = await getSharedPrismaClientAsync();

  for (const { slug, route } of TARGET_APPS) {
    const app = await prisma.marketplaceApp.findUnique({ where: { slug } });
    if (!app) {
      console.log(`[sync:${slug}] App not found in database — will be created by catalog:sync-target.`);
      continue;
    }

    const updated = await prisma.marketplaceApp.update({
      where: { slug },
      data: {
        isActive: true,
        isPublic: true,
        mainRoute: route,
        adminRoute: route,
      },
    });

    console.log(`✅ [sync:${slug}] Active=${updated.isActive}, Public=${updated.isPublic}, Route=${updated.mainRoute}`);
  }

  await closeSharedDatabase();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ [sync:financial-tools] Failed:', err);
  process.exit(1);
});

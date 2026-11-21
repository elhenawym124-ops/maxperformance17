#!/usr/bin/env node

/**
 * seed_lg_all_companies.js
 *
 * Ensures shipping company "LG Express (Accurate Logistics)" exists for ALL accounts/companies.
 * Safe to re-run (idempotent).
 */

const { getSharedPrismaClientAsync, closeSharedDatabase } = require('../services/sharedDatabase');

async function main() {
  console.log('🚀 [SEED-LG] Starting LG Express seeding for all accounts...');

  let prisma;
  try {
    prisma = await getSharedPrismaClientAsync();
  } catch (err) {
    console.error('❌ [SEED-LG] Failed to initialize Prisma client:', err.message);
    process.exit(1);
  }

  try {
    const companies = await prisma.company.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`🏢 [SEED-LG] Found ${companies.length} company account(s) to inspect.`);

    let addedCount = 0;
    let existingCount = 0;

    for (const company of companies) {
      const existing = await prisma.shippingCompany.findFirst({
        where: {
          companyId: company.id,
          OR: [
            { providerKey: 'LG_EXPRESS' },
            { slug: 'lg-express' },
            { slug: 'lg_express' },
          ],
        },
        select: { id: true, name: true },
      });

      if (existing) {
        existingCount++;
      } else {
        await prisma.shippingCompany.create({
          data: {
            companyId: company.id,
            name: 'LG Express (Accurate Logistics)',
            slug: 'lg-express',
            providerKey: 'LG_EXPRESS',
            integrationMode: 'LIVE',
            website: 'https://accuratess.com',
            apiUrl: 'https://a2x.lg.accuratess.com:8443/graphql',
            phone: '',
            isActive: false,
          },
        }).catch((err) => {
          console.warn(`⚠️ [SEED-LG] Could not create for company ${company.name} (${company.id}):`, err.message);
        });
        addedCount++;
        console.log(`✅ [SEED-LG] Added LG Express for company: ${company.name} (${company.slug || company.id})`);
      }
    }

    console.log(`\n🎉 [SEED-LG] Finished! Total companies: ${companies.length}, Added: ${addedCount}, Already had LG Express: ${existingCount}`);
  } catch (error) {
    console.error('❌ [SEED-LG] Error during seeding:', error);
  } finally {
    await closeSharedDatabase().catch(() => {});
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { main };

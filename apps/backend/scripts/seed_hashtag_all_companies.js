#!/usr/bin/env node

/**
 * seed_hashtag_all_companies.js
 *
 * Ensures shipping company "هاشتاج إكسبريس (Hashtag Express)" exists for ALL accounts/companies.
 * Safe to re-run (idempotent).
 */

const { getSharedPrismaClientAsync, closeSharedDatabase } = require('../services/sharedDatabase');

async function main() {
  console.log('🚀 [SEED-HASHTAG] Starting Hashtag Express seeding for all accounts...');

  let prisma;
  try {
    prisma = await getSharedPrismaClientAsync();
  } catch (err) {
    console.error('❌ [SEED-HASHTAG] Failed to initialize Prisma client:', err.message);
    process.exit(1);
  }

  try {
    const companies = await prisma.company.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`🏢 [SEED-HASHTAG] Found ${companies.length} company account(s) to inspect.`);

    let addedCount = 0;
    let existingCount = 0;

    for (const company of companies) {
      const existing = await prisma.shippingCompany.findFirst({
        where: {
          companyId: company.id,
          OR: [
            { providerKey: 'HASHTAG' },
            { slug: 'hashtag' },
            { slug: 'hashtag-express' },
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
            name: 'هاشتاج إكسبريس (Hashtag Express)',
            slug: 'hashtag',
            providerKey: 'HASHTAG',
            integrationMode: 'LIVE',
            website: 'https://hashtag-express.com',
            apiUrl: 'https://hashtag-express.com/app',
            phone: '',
            isActive: false,
          },
        }).catch((err) => {
          console.warn(`⚠️ [SEED-HASHTAG] Could not create for company ${company.name} (${company.id}):`, err.message);
        });
        addedCount++;
        console.log(`✅ [SEED-HASHTAG] Added Hashtag Express for company: ${company.name} (${company.slug || company.id})`);
      }
    }

    console.log(`\n🎉 [SEED-HASHTAG] Finished! Total companies: ${companies.length}, Added: ${addedCount}, Already had Hashtag: ${existingCount}`);
  } catch (error) {
    console.error('❌ [SEED-HASHTAG] Error during seeding:', error);
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

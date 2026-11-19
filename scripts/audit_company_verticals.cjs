const path = require('path');
const { getSharedPrismaClient } = require(path.join(__dirname, '../apps/backend/services/sharedDatabase'));
const { resolveVertical } = require(path.join(__dirname, '../apps/backend/controller/conversation/verticalContextController'));

async function main() {
  const prisma = getSharedPrismaClient();
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      businessSpecialty: { select: { slug: true, nameAr: true, nameEn: true } },
      installedApps: { select: { app: { select: { slug: true } } } },
    },
  });

  console.log(`Total companies audited: ${companies.length}\n`);

  const results = [];
  for (const c of companies) {
    const apps = (c.installedApps || []).map((a) => a?.app?.slug).filter(Boolean);
    const vertical = resolveVertical({
      specialtySlug: c.businessSpecialty?.slug,
      specialtyName: c.businessSpecialty?.nameAr || c.businessSpecialty?.nameEn,
      companyName: c.name,
      companySlug: c.slug,
      activeApps: apps,
    });

    results.push({
      name: c.name,
      slug: c.slug,
      specialty: c.businessSpecialty ? `${c.businessSpecialty.slug} (${c.businessSpecialty.nameAr})` : 'NULL',
      appsCount: apps.length,
      hasBookingApp: apps.includes('booking-app'),
      apps: apps,
      resolvedVertical: vertical,
    });
  }

  // Print summary by vertical
  const byVertical = {};
  for (const r of results) {
    byVertical[r.resolvedVertical] = (byVertical[r.resolvedVertical] || 0) + 1;
  }
  console.log('Vertical distribution:', byVertical);

  // Print all companies with booking-app or medical or education or null specialty
  console.log('\n--- Companies with booking-app or potential vertical edge cases ---');
  for (const r of results) {
    if (r.hasBookingApp || r.resolvedVertical === 'medical' || r.resolvedVertical === 'education' || r.specialty === 'NULL') {
      console.log(`- [${r.resolvedVertical.toUpperCase()}] "${r.name}" (${r.slug}) | Specialty: ${r.specialty} | Apps: [${r.apps.join(', ')}]`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);

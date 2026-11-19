const { PrismaClient } = require('./apps/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({
    where: {
      OR: [
        { name: { contains: 'h2m', mode: 'insensitive' } },
        { customDomain: { contains: 'h2m', mode: 'insensitive' } },
        { subDomain: { contains: 'h2m', mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, subDomain: true, activeApps: true, users: { select: { email: true, role: true } } },
  });
  console.log('H2M Companies:', JSON.stringify(companies, null, 2));

  const tester = await prisma.user.findFirst({
    where: { email: 'tester@maxp.com' },
    select: { id: true, email: true, companyId: true, company: { select: { id: true, name: true, activeApps: true } } },
  });
  console.log('Tester:', JSON.stringify(tester, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

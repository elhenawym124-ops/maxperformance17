const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const r = await prisma.returnRequest.findUnique({
    where: { id: 'cmrx6d55500obju2sa9kdowe8' },
    include: {
      returnActivityLogs: true,
      order: {
        include: { orderNotes: true, statusHistory: true }
      }
    }
  });
  console.log(JSON.stringify(r, null, 2));

  // Also check why 71 requests have responsibleParty != null but isReviewed == false
  const unreviewedWithParty = await prisma.returnRequest.findMany({
    where: {
      companyId: 'cmleybpf70028juo2wwpmp8rt',
      isReviewed: false,
      responsibleParty: { not: null }
    },
    select: {
      id: true,
      responsibleParty: true,
      isReviewed: true,
      status: true,
      adminNotes: true,
      createdAt: true,
      updatedAt: true,
      order: {
        select: { orderNumber: true, status: true, turboShipmentStatus: true }
      }
    }
  });
  console.log(`\nUnreviewed requests with responsibleParty count: ${unreviewedWithParty.length}`);
  console.log('Sample:', unreviewedWithParty.slice(0, 10));
}

main().catch(console.error).finally(() => prisma.$disconnect());

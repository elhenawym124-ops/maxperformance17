const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = 'cmleybpf70028juo2wwpmp8rt'; // Swan
  const yesterday = new Date(Date.now() - 48 * 60 * 60 * 1000);

  // Return requests updated in the last 48 hours
  const updatedRecently = await prisma.returnRequest.findMany({
    where: {
      companyId,
      updatedAt: { gte: yesterday }
    },
    include: {
      order: {
        select: { orderNumber: true, status: true, turboShipmentStatus: true }
      },
      returnActivityLogs: {
        orderBy: { createdAt: 'desc' },
        take: 3
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  console.log(`Return requests updated in last 48h: ${updatedRecently.length}`);
  updatedRecently.forEach(r => {
    console.log(`Req #${r.id} | Order #${r.order?.orderNumber} | isReviewed: ${r.isReviewed} | Party: ${r.responsibleParty} | Status: ${r.status} | Created: ${r.createdAt.toISOString()} | Updated: ${r.updatedAt.toISOString()} | AdminNotes: ${r.adminNotes?.slice(0, 80)}`);
    if (r.returnActivityLogs?.length) {
      r.returnActivityLogs.forEach(l => {
        console.log(`   Log: action=${l.action} | notes=${l.notes} | at=${l.createdAt.toISOString()}`);
      });
    }
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());

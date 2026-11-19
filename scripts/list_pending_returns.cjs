const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = 'cmleybpf70028juo2wwpmp8rt'; // Swan
  
  // Fetch pending return requests for Swan
  const pending = await prisma.returnRequest.findMany({
    where: { companyId, isReviewed: false },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          turboShipmentStatus: true,
          createdAt: true
        }
      },
      returnActivityLogs: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log('Total unreviewed for Swan in DB:', pending.length);
  for (const r of pending) {
    const logSummary = r.returnActivityLogs.map(l => l.action).join(', ');
    console.log(`${r.id} | ${r.order?.orderNumber} | reqCreated: ${r.createdAt.toISOString()} | orderCreated: ${r.order?.createdAt?.toISOString()} | party: ${r.responsibleParty} | logs: [${logSummary}] | notes: ${(r.adminNotes || '').slice(0, 60)}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

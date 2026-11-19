const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = 'cmleybpf70028juo2wwpmp8rt'; // Swan
  
  const pending = await prisma.returnRequest.findMany({
    where: { companyId, isReviewed: false },
    include: {
      order: {
        include: {
          orderNotes: true,
          statusHistory: { orderBy: { createdAt: 'desc' } }
        }
      },
      returnActivityLogs: true
    }
  });

  console.log(`Total unreviewed: ${pending.length}`);
  
  let withNotesCount = 0;
  let withHistoryCount = 0;
  let withActivityLogsCount = 0;

  for (const r of pending) {
    const hasOrderNotes = r.order?.orderNotes?.length > 0;
    const hasHistory = r.order?.statusHistory?.length > 0;
    const hasLogs = r.returnActivityLogs?.length > 0;
    
    if (hasOrderNotes) withNotesCount++;
    if (hasHistory) withHistoryCount++;
    if (hasLogs) withActivityLogsCount++;

    if (hasOrderNotes || hasLogs || (r.order && new Date(r.order.createdAt) < new Date('2026-10-01'))) {
      console.log(`Req #${r.id} | Order #${r.order?.orderNumber} | OrdDate: ${r.order?.createdAt?.toISOString().slice(0, 10)} | OrdStatus: ${r.order?.status} | OrdNotes: ${r.order?.orderNotes?.map(n => n.content).join('; ')} | Logs: ${r.returnActivityLogs?.map(l => l.action).join(', ')}`);
    }
  }

  console.log({ withNotesCount, withHistoryCount, withActivityLogsCount });
}

main().catch(console.error).finally(() => prisma.$disconnect());

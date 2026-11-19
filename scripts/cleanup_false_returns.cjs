const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = 'cmleybpf70028juo2wwpmp8rt'; // Swan
  const yesterday = new Date(Date.now() - 36 * 60 * 60 * 1000);

  // Find unreviewed return requests created in the last 36 hours for orders created before 2026-10-01
  const targets = await prisma.returnRequest.findMany({
    where: {
      companyId,
      createdAt: { gte: yesterday },
      isReviewed: false,
      responsibleParty: null,
      adminNotes: { contains: 'تلقائي' },
      order: {
        createdAt: { lt: new Date('2026-10-01T00:00:00.000Z') }
      }
    },
    select: { id: true, order: { select: { orderNumber: true, createdAt: true } } }
  });

  console.log(`Found ${targets.length} falsely auto-created return requests for old orders (< Oct 1).`);
  for (const t of targets) {
    console.log(`  Deleting auto-created Req #${t.id} for Order #${t.order?.orderNumber} (OrderDate: ${t.order?.createdAt})`);
  }

  if (targets.length > 0) {
    const ids = targets.map(t => t.id);
    await prisma.returnActivityLog.deleteMany({
      where: { returnRequestId: { in: ids } }
    });
    const delResult = await prisma.returnRequest.deleteMany({
      where: { id: { in: ids } }
    });
    console.log(`Successfully deleted ${delResult.count} false return requests.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

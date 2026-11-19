const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const companyId = 'cmleybpf70028juo2wwpmp8rt'; // Swan

  // Get the 67 return requests created today
  const yesterday = new Date(Date.now() - 36 * 60 * 60 * 1000);
  const recentReqs = await prisma.returnRequest.findMany({
    where: {
      companyId,
      createdAt: { gte: yesterday }
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          notes: true,
          turboShipmentStatus: true,
          turboReturnReason: true,
          createdAt: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Found ${recentReqs.length} return requests created in the last 36h.`);

  // For each of these orders, check if there is a twin guestOrder, and check both order.notes and guestOrder.notes
  for (const r of recentReqs) {
    const orderNumber = r.order?.orderNumber;
    const guest = await prisma.guestOrder.findFirst({
      where: { companyId, orderNumber },
      select: { id: true, status: true, notes: true, metadata: true }
    });

    const hasTeamNote = (r.order?.notes && !r.order.notes.includes('Bulk status update') && !r.order.notes.includes('تلقائي')) ||
                        (guest?.notes && !guest.notes.includes('Bulk status update') && !guest.notes.includes('تلقائي'));

    console.log(`\nOrder #${orderNumber} (Req #${r.id}, isReviewed=${r.isReviewed}, party=${r.responsibleParty}):`);
    console.log(`  Order Status: ${r.order?.status} | TurboStatus: ${r.order?.turboShipmentStatus} | TurboReturnReason: ${r.order?.turboReturnReason}`);
    console.log(`  Order Notes: "${r.order?.notes}"`);
    console.log(`  Guest Notes: "${guest?.notes}"`);
    console.log(`  ReturnReq AdminNotes: "${r.adminNotes}"`);
    if (hasTeamNote) {
      console.log(`  🌟 [TEAM NOTE FOUND!]`);
    }
  }

  await prisma.$disconnect();
}

run().catch(console.error);

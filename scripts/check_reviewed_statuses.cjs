const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = 'cmleybpf70028juo2wwpmp8rt'; // Swan

  // Find all return requests where the team took a stance (responsibleParty is set or isReviewed is true)
  // but let's see if there are any issues with them:
  // 1. Return requests where isReviewed is true
  const reviewed = await prisma.returnRequest.findMany({
    where: { companyId, isReviewed: true },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          turboShipmentStatus: true,
          notes: true
        }
      },
      returnReason: true
    },
    orderBy: { updatedAt: 'desc' }
  });

  console.log('Total reviewed return requests:', reviewed.length);

  // Group reviewed by order status
  const byStatus = {};
  reviewed.forEach(r => {
    const st = r.order?.status || 'NO_ORDER';
    byStatus[st] = (byStatus[st] || 0) + 1;
  });
  console.log('Reviewed return requests grouped by order.status:', byStatus);

  // Check if any reviewed orders are NOT in RETURNED status!
  // If order.status is NOT RETURNED, and the frontend or backend filters by order.status === RETURNED,
  // then those reviewed orders DISAPPEAR from the list!
  const notReturned = reviewed.filter(r => r.order?.status !== 'RETURNED');
  console.log(`\nReviewed return requests where order.status is NOT 'RETURNED': ${notReturned.length}`);
  notReturned.slice(0, 10).forEach(r => {
    console.log(`Req #${r.id} | Order #${r.order?.orderNumber} | OrderStatus: ${r.order?.status} | TurboStatus: ${r.order?.turboShipmentStatus} | Party: ${r.responsibleParty} | Notes: ${r.adminNotes}`);
  });

  // Also check orders that have multiple return requests or where an unreviewed request exists for an order that had updates
  const allReqs = await prisma.returnRequest.findMany({
    where: { companyId },
    select: { id: true, orderId: true, isReviewed: true, status: true, responsibleParty: true }
  });
  console.log(`\nTotal return requests for Swan: ${allReqs.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

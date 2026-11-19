const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const reqsByCompany = await prisma.returnRequest.groupBy({
    by: ['companyId'],
    _count: true
  });
  console.log('Return requests by companyId:');
  for (const r of reqsByCompany) {
    const comp = await prisma.company.findUnique({
      where: { id: r.companyId },
      select: { id: true, name: true }
    });
    console.log(`Company ${r.companyId} (${comp?.name} - ${comp?.domain}): ${r._count} requests`);
  }

  // Also check orders with status RETURNED or turboShipmentStatus returned across companies
  const returnedOrdersByCompany = await prisma.order.groupBy({
    by: ['companyId'],
    where: {
      OR: [
        { status: 'RETURNED' },
        { turboShipmentStatus: { in: ['returned_to_company', 'status_5', '5', 'status_14', '14', 'returned'] } }
      ]
    },
    _count: true
  });
  console.log('\nReturned orders by company:');
  for (const r of returnedOrdersByCompany) {
    const comp = await prisma.company.findUnique({
      where: { id: r.companyId },
      select: { id: true, name: true }
    });
    console.log(`Company ${r.companyId} (${comp?.name} - ${comp?.domain}): ${r._count} returned orders`);
  }

  // Let's inspect the active return requests for the company that has return requests
  for (const r of reqsByCompany) {
    const companyId = r.companyId;
    console.log(`\n=== Inspecting Company ${companyId} ===`);
    const byReviewed = await prisma.returnRequest.groupBy({
      by: ['isReviewed', 'status', 'responsibleParty'],
      where: { companyId },
      _count: true
    });
    console.log('Breakdown by isReviewed, status, responsibleParty:', JSON.stringify(byReviewed, null, 2));

    // Show sample of reviewed requests vs non-reviewed
    const reviewedSample = await prisma.returnRequest.findMany({
      where: { companyId, isReviewed: true },
      take: 5,
      include: {
        order: { select: { orderNumber: true, status: true, turboShipmentStatus: true, notes: true } },
        returnReason: true
      },
      orderBy: { updatedAt: 'desc' }
    });
    console.log(`Sample of reviewed requests (total count with isReviewed=true):`, reviewedSample.length);
    reviewedSample.forEach(req => {
      console.log(`  Req #${req.id} | Order #${req.order?.orderNumber} | Status: ${req.status} | Reviewed: ${req.isReviewed} | Party: ${req.responsibleParty} | Reason: ${req.returnReason?.reason} | AdminNotes: ${req.adminNotes} | OrderNotes: ${req.order?.notes}`);
    });

    const unreviewedSample = await prisma.returnRequest.findMany({
      where: { companyId, isReviewed: false },
      take: 5,
      include: {
        order: { select: { orderNumber: true, status: true, turboShipmentStatus: true, notes: true } },
        returnReason: true
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log(`Sample of UNreviewed requests (total count with isReviewed=false):`, unreviewedSample.length);
    unreviewedSample.forEach(req => {
      console.log(`  Req #${req.id} | Order #${req.order?.orderNumber} | Status: ${req.status} | Reviewed: ${req.isReviewed} | Party: ${req.responsibleParty} | Reason: ${req.returnReason?.reason} | AdminNotes: ${req.adminNotes} | OrderNotes: ${req.order?.notes}`);
    });
  }

  await prisma.$disconnect();
}

run().catch(console.error);

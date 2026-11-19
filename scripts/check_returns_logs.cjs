const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ordersToCheck = ['ORD-978645-663', 'ORD-422372-334', 'ORD-860031-088'];
  for (const num of ordersToCheck) {
    console.log('=== Checking ' + num + ' ===');
    const o = await prisma.order.findFirst({
      where: { orderNumber: num },
      include: {
        returnRequests: {
          include: { returnReason: true, returnActivityLogs: true }
        },
        orderNotes: true,
        statusHistory: true
      }
    });
    const g = await prisma.guestOrder.findFirst({ where: { orderNumber: num } });
    console.log('Order:', {
      id: o?.id,
      status: o?.status,
      notes: o?.notes,
      turboShipmentStatus: o?.turboShipmentStatus,
      reqCount: o?.returnRequests?.length
    });
    if (o?.returnRequests?.length) {
      o.returnRequests.forEach(r => {
        console.log('ReturnRequest:', {
          id: r.id,
          isReviewed: r.isReviewed,
          status: r.status,
          responsibleParty: r.responsibleParty,
          reason: r.returnReason?.reason,
          adminNotes: r.adminNotes,
          createdAt: r.createdAt
        });
      });
    }
    console.log('GuestOrder:', {
      id: g?.id,
      status: g?.status,
      notes: g?.notes,
      adminNotes: g?.adminNotes,
      statusReason: g?.statusReason,
      trackingStatus: g?.trackingStatus
    });
    if (o?.orderNotes?.length) {
      console.log('orderNotes:', o.orderNotes);
    }
    if (o?.statusHistory?.length) {
      console.log('statusHistory:', o.statusHistory.map(s => ({ from: s.fromStatus, to: s.toStatus, reason: s.reason, notes: s.notes, date: s.createdAt })));
    }
  }

  // Also search for recent ReturnActivityLogs across company
  const swan = await prisma.company.findFirst({ where: { name: { contains: 'Swan', mode: 'insensitive' } } });
  const companyId = swan.id;
  const recentUpdates = await prisma.returnActivityLog.findMany({
    where: {
      returnRequest: { companyId }
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { returnRequest: { include: { order: true } }, user: true }
  });
  console.log('\n=== Recent Return Activity Logs ===');
  recentUpdates.forEach(l => {
    console.log({
      orderNum: l.returnRequest?.order?.orderNumber,
      action: l.action,
      notes: l.notes,
      user: l.user?.firstName,
      createdAt: l.createdAt
    });
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());

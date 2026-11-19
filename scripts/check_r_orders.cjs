const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rOrders = await prisma.order.findMany({
    where: { orderNumber: { startsWith: 'R-ORD-' } },
    take: 5
  });
  console.log('R-ORD sample count:', rOrders.length);
  for (const o of rOrders) {
    const origNum = o.orderNumber.replace(/^R-/, '');
    const origOrder = await prisma.order.findFirst({ where: { orderNumber: origNum } });
    const origGuest = await prisma.guestOrder.findFirst({ where: { orderNumber: origNum } });
    console.log({
      rOrderNum: o.orderNumber,
      rStatus: o.status,
      rNotes: o.notes,
      rTurboStatus: o.turboShipmentStatus,
      origNum,
      origOrderExists: !!origOrder,
      origOrderStatus: origOrder?.status,
      origOrderTurboStatus: origOrder?.turboShipmentStatus,
      origGuestExists: !!origGuest,
      origGuestStatus: origGuest?.status
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

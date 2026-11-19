const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const [
    guestOrdersTotal,
    guestsWithTurbo,
    regularOrdersTotal,
    ordersWithTurbo
  ] = await Promise.all([
    prisma.guestOrder.count(),
    prisma.guestOrder.count({ where: { turboTrackingNumber: { not: null } } }),
    prisma.order.count(),
    prisma.order.count({ where: { turboTrackingNumber: { not: null } } })
  ]);

  console.log('--- TURBO COUNTS ---');
  console.log('Total guest orders:', guestOrdersTotal);
  console.log('Guest orders with turboTrackingNumber:', guestsWithTurbo);
  console.log('Total regular orders:', regularOrdersTotal);
  console.log('Regular orders with turboTrackingNumber:', ordersWithTurbo);

  // Check sample twin differences
  const sampleGuestsWithTurbo = await prisma.guestOrder.findMany({
    where: { turboTrackingNumber: { not: null } },
    take: 10,
    select: {
      orderNumber: true,
      turboTrackingNumber: true,
      turboShipmentStatus: true,
      status: true
    }
  });

  console.log('\n--- SAMPLE GUEST ORDERS WITH TURBO ---');
  for (const g of sampleGuestsWithTurbo) {
    const twin = await prisma.order.findFirst({
      where: { orderNumber: g.orderNumber },
      select: {
        id: true,
        orderNumber: true,
        turboTrackingNumber: true,
        turboShipmentStatus: true,
        status: true
      }
    });
    console.log(`Guest #${g.orderNumber}: turbo=${g.turboTrackingNumber} | status=${g.status}`);
    console.log(`  Twin in orders: turbo=${twin?.turboTrackingNumber} | status=${twin?.status} | exists=${!!twin}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);

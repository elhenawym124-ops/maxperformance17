const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function run() {
  const companyId = 'cmu5iix000aa6juwmmqcrls8i';
  const start = new Date('2026-10-11T21:00:00.000Z');
  const end = new Date('2026-10-12T20:59:59.999Z');

  console.log('=== DEEP CHECK FOR RED LINE YESTERDAY ===');

  // 1. All orders with confirmedAt between start and end in Red Line
  const confirmedAtOrders = await p.order.findMany({
    where: {
      companyId,
      confirmedAt: { gte: start, lte: end }
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      createdBy: true,
      confirmedBy: true,
      confirmedAt: true,
      createdAt: true
    }
  });
  console.log(`\n1. Orders with confirmedAt in range: ${confirmedAtOrders.length}`);
  for (const o of confirmedAtOrders) {
    console.log(` - ${o.orderNumber}: status=${o.status}, confirmedBy=${o.confirmedBy}, confirmedAt=${o.confirmedAt?.toISOString()}`);
  }

  // 2. All orders with statusHistory where status = CONFIRMED between start and end
  const historyConfirmed = await p.orderStatusHistory.findMany({
    where: {
      order: { companyId },
      status: 'CONFIRMED',
      createdAt: { gte: start, lte: end }
    },
    include: {
      order: {
        select: { orderNumber: true, total: true, status: true, createdBy: true, confirmedBy: true }
      }
    }
  });
  console.log(`\n2. StatusHistory transitions to CONFIRMED in range: ${historyConfirmed.length}`);
  for (const h of historyConfirmed) {
    console.log(` - Order ${h.order?.orderNumber}: changedBy=${h.changedBy}, reason="${h.reason}" at ${h.createdAt.toISOString()}`);
  }

  // 3. All WhatsApp bot confirmations in Red Line ever / recently
  const waConfirmations = await p.orderStatusHistory.findMany({
    where: {
      order: { companyId },
      changedBy: { contains: 'WHATSAPP' }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log(`\n3. Recent WhatsApp bot transitions in Red Line: ${waConfirmations.length}`);
  for (const h of waConfirmations) {
    console.log(` - Order ${h.orderId}: status=${h.status}, changedBy=${h.changedBy}, reason="${h.reason}", at=${h.createdAt.toISOString()}`);
  }

  // 4. Check WhatsAppMessages table or conversation table for Red Line on Oct 12
  try {
    const waMsgs = await p.whatsAppMessage.findMany({
      where: {
        createdAt: { gte: start, lte: end }
      },
      take: 10
    });
    console.log(`\n4. WhatsApp messages count on Oct 12: ${waMsgs.length}`);
  } catch (e) {
    console.log('WhatsAppMessage table:', e.message);
  }

  // 5. Check if there are other companies that the user might have orders in, or if Red Line has guest orders or other tables
  const guestOrders = await p.guestOrder.findMany({
    where: {
      companyId,
      createdAt: { gte: start, lte: end }
    }
  });
  console.log(`\n5. Guest orders in Red Line on Oct 12: ${guestOrders.length}`);

  // 6. Check what user means by: "والانشاء عشان مفيش اوردر الا لو فيه تدخل بشري"
  // Let's see how many orders were created in Red Line on Oct 11, Oct 12, Oct 13:
  const ordersOct11_13 = await p.order.findMany({
    where: {
      companyId,
      createdAt: { gte: new Date('2026-10-10T00:00:00Z'), lte: new Date('2026-10-13T23:59:59Z') }
    },
    select: {
      orderNumber: true,
      status: true,
      createdBy: true,
      createdByName: true,
      confirmedBy: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });
  console.log(`\n6. Orders created Oct 10-13 in Red Line: ${ordersOct11_13.length}`);
  for (const o of ordersOct11_13) {
    console.log(` - ${o.orderNumber}: created=${o.createdAt?.toISOString()}, createdBy=${o.createdBy} (${o.createdByName || ''}), confirmedBy=${o.confirmedBy}, status=${o.status}`);
  }

  await p.$disconnect();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});

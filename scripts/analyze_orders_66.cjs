const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function run() {
  const companyId = 'cmu5iix000aa6juwmmqcrls8i';
  const start = new Date('2026-10-11T21:00:00.000Z');
  const end = new Date('2026-10-12T20:59:59.999Z');

  const orders = await p.order.findMany({
    where: {
      companyId,
      OR: [
        { createdAt: { gte: start, lte: end } },
        { confirmedAt: { gte: start, lte: end } },
        { statusHistory: { some: { createdAt: { gte: start, lte: end } } } }
      ]
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      createdBy: true,
      createdByName: true,
      confirmedBy: true,
      confirmedAt: true,
      createdAt: true,
      metadata: true,
      notes: true,
      orderSource: true,
      sourceType: true,
      statusHistory: {
        where: { createdAt: { gte: start, lte: end } }
      }
    }
  });

  console.log('=== ORDERS BREAKDOWN FOR YESTERDAY ===');
  console.log('Total orders in query:', orders.length);

  // Group by confirmedBy
  const byConfirmer = {};
  orders.forEach(o => {
    const c = o.confirmedBy || 'NULL';
    if (!byConfirmer[c]) byConfirmer[c] = [];
    byConfirmer[c].push(o);
  });

  console.log('\nConfirmedBy groups:');
  for (const [confirmer, list] of Object.entries(byConfirmer)) {
    console.log(`\n>> Confirmer: ${confirmer} (${list.length} orders)`);
    for (const o of list.slice(0, 5)) {
      console.log(`   Order ${o.orderNumber}: status=${o.status}, created=${o.createdAt?.toISOString()}, confirmedAt=${o.confirmedAt?.toISOString()}, historyCount=${o.statusHistory?.length}`);
    }
  }

  // Check how many orders had confirmedAt in yesterday
  const confirmedAtInRange = orders.filter(o => o.confirmedAt && o.confirmedAt >= start && o.confirmedAt <= end);
  console.log(`\nOrders with confirmedAt in yesterday window: ${confirmedAtInRange.length}`);
  for (const o of confirmedAtInRange) {
    console.log(` - ${o.orderNumber}: confirmedBy=${o.confirmedBy}, confirmedAt=${o.confirmedAt?.toISOString()}`);
  }

  // Check orders where confirmedBy is SYSTEM_WHATSAPP: when were they confirmed?
  const waOrders = orders.filter(o => o.confirmedBy === 'SYSTEM_WHATSAPP');
  console.log(`\nSYSTEM_WHATSAPP orders count: ${waOrders.length}`);
  for (const o of waOrders.slice(0, 10)) {
    console.log(` - ${o.orderNumber}: created=${o.createdAt?.toISOString()}, confirmedAt=${o.confirmedAt?.toISOString()}, status=${o.status}, statusHistory:`, o.statusHistory?.map(h => `${h.status} by ${h.changedBy} at ${h.createdAt?.toISOString()}`));
  }

  await p.$disconnect();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});

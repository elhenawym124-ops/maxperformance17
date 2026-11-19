const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function run() {
  const companyId = 'cmu5iix000aa6juwmmqcrls8i';
  const start = new Date('2026-10-11T21:00:00.000Z');
  const end = new Date('2026-10-12T20:59:59.999Z');

  console.log('=== INSPECTING 52 GUEST ORDERS ===');

  const guestOrders = await p.guestOrder.findMany({
    where: { companyId, createdAt: { gte: start, lte: end } }
  });

  console.log('GuestOrders count:', guestOrders.length);
  
  const guestCreators = {};
  const guestStatuses = {};
  const guestTotals = [];

  for (const g of guestOrders) {
    const creator = g.createdBy || 'NULL_CUSTOMER';
    guestCreators[creator] = (guestCreators[creator] || 0) + 1;
    guestStatuses[g.status] = (guestStatuses[g.status] || 0) + 1;
    guestTotals.push(parseFloat(g.total) || 0);
  }

  console.log('Guest Creators:', guestCreators);
  console.log('Guest Statuses:', guestStatuses);
  console.log('Sample Guest Orders:');
  for (const g of guestOrders.slice(0, 5)) {
    console.log(` - ID: ${g.id}, OrderNumber: ${g.orderNumber}, Total: ${g.total}, Status: ${g.status}, Customer: ${g.customerName} (${g.customerPhone}), City: ${g.city}, CreatedAt: ${g.createdAt.toISOString()}`);
  }

  // Check if any of these guest orders were converted to Order
  const converted = guestOrders.filter(g => g.convertedToOrderId);
  console.log('Converted to regular Order count:', converted.length);

  await p.$disconnect();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});

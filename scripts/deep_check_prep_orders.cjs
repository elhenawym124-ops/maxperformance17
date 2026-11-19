const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const company = await p.company.findFirst({
    where: { name: { contains: 'red', mode: 'insensitive' } }
  });

  const orders = await p.order.findMany({
    where: { companyId: company.id, status: 'PREPARING' },
    take: 10,
    include: {
      statusHistory: true,
      orderItems: true
    }
  });

  console.log(`Deep inspecting 10 PREPARING orders:`);
  for (const o of orders) {
    console.log(`\n================= ${o.orderNumber} =================`);
    console.log('Customer:', o.customerName, o.customerPhone);
    console.log('Notes:', o.notes);
    console.log('Status history:');
    for (const h of o.statusHistory) {
      console.log(` - ${h.status} (${h.oldStatus}) reason="${h.reason}" changedBy=${h.changedBy}`);
    }
    
    // Check guestOrder
    const g = await p.guestOrder.findFirst({
      where: { orderNumber: o.orderNumber }
    });
    console.log('Guest order:', g ? { notes: g.notes, items: g.items } : 'None');

    // Check if customer made any other orders that DID have a car model!
    const otherOrders = await p.order.findMany({
      where: {
        companyId: company.id,
        customerPhone: o.customerPhone,
        id: { not: o.id }
      },
      select: { orderNumber: true, notes: true }
    });
    console.log('Other orders from same phone:', otherOrders);
  }
}

main().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect(); });

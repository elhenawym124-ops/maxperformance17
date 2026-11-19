const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const o = await p.order.findFirst({
    where: { orderNumber: 'ORD-541201-924' },
    include: { orderItems: true }
  });
  console.log('Order ORD-541201-924:', {
    createdAt: o?.createdAt,
    customerName: o?.customerName,
    customerPhone: o?.customerPhone,
    sourceType: o?.sourceType,
    orderSource: o?.orderSource,
    notes: o?.notes,
    metadata: o?.metadata,
    items: o?.orderItems
  });

  const g = await p.guestOrder.findFirst({
    where: { orderNumber: 'ORD-541201-924' }
  });
  console.log('Guest:', g);
}

main().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect(); });

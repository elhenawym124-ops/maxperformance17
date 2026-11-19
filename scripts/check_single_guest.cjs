const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const g = await p.guestOrder.findUnique({
    where: { id: 'cmv2bw0h501snju6uoilaivyg' }
  });
  console.log('Original guest by id cmv2bw0h501snju6uoilaivyg:', g ? { id: g.id, orderNumber: g.orderNumber, notes: g.notes } : 'NOT FOUND');

  // Let's check status history of order ORD-764260-090
  const o = await p.order.findFirst({
    where: { orderNumber: 'ORD-764260-090' },
    include: { statusHistory: true }
  });
  console.log('Status history:');
  for (const h of o.statusHistory) {
    console.log(` - ${h.status} (old: ${h.oldStatus}) by ${h.changedBy} at ${h.createdAt.toISOString()}: reason="${h.reason}"`);
  }
}

main().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect(); });

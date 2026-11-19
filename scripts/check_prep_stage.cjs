const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const nums = ['ORD-410414-534', 'ORD-793833-556', 'ORD-556722-701', 'ORD-323988-603'];
  const guests = await p.guestOrder.findMany({ where: { orderNumber: { in: nums } } });
  for (const g of guests) {
    console.log('\n--- Guest Order:', g.orderNumber);
    console.log('Notes:', g.notes);
    console.log('Items:', g.items);
    console.log('Meta:', g.metadata);
    console.log('Address:', g.shippingAddress);
  }
}

main().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect(); });

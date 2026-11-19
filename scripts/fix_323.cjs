const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const o = await p.order.findFirst({ where: { orderNumber: 'ORD-323988-603' } });
  console.log('Order:', o.id, o.orderNumber, o.customerPhone);
  
  const guests = await p.$queryRawUnsafe(`
    SELECT "orderNumber", phone, notes, metadata 
    FROM guest_orders 
    WHERE notes LIKE '%لانسر بومه 2008%' OR "orderNumber" = 'ORD-323988-603'
  `);
  console.log('Guests found:', guests);
  
  if (guests.length > 0 && guests[0].notes) {
    await p.order.update({
      where: { id: o.id },
      data: { notes: guests[0].notes }
    });
    console.log('Updated order notes to:', guests[0].notes);
  }
}

main().then(() => p.$disconnect());

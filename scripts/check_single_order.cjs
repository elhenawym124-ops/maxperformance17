const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const o = await p.order.findFirst({
    where: { orderNumber: 'ORD-323988-603' },
    include: { orderItems: true }
  });
  console.log('Order:', o?.orderNumber, 'Notes:', o?.notes, 'Phone:', o?.customerPhone);

  const logs = await p.$queryRawUnsafe(`
    SELECT content, "eventType", "sentAt" 
    FROM "whatsapp_notification_logs" 
    WHERE content LIKE '%ORD-323988-603%' OR "orderId" = $1
    ORDER BY "sentAt" DESC
  `, o?.id || '');

  console.log(`Found ${logs.length} logs:`);
  for (const l of logs) {
    console.log(`[${l.eventType}] ${l.content}`);
  }

  // Check guest orders by phone or orderNumber
  const guests = await p.$queryRawUnsafe(`
    SELECT notes, metadata FROM "guest_orders" 
    WHERE "orderNumber" = 'ORD-323988-603' OR phone = $1
  `, o?.customerPhone || '');
  console.log('Guest orders:', guests);
}

main().then(() => p.$disconnect()).catch(err => {
  console.error(err);
  p.$disconnect();
});

const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

const targets = [
  "ORD-454235-832",
  "ORD-631546-450",
  "ORD-519112-053",
  "ORD-103997-110",
  "ORD-TEST-374965",
  "ORD-018896-713",
  "ORD-633814-458",
  "ORD-460789-117",
  "ORD-273448-954",
  "ORD-288092-267",
  "ORD-345343-447",
  "ORD-283898-102",
  "ORD-826309-042",
  "ORD-323988-603"
];

async function main() {
  console.log('=== Checking 14 remaining orders across all data sources ===');

  for (const num of targets) {
    console.log(`\n---------------- ${num} ----------------`);
    
    // 1. Check Order
    const ord = await p.order.findFirst({
      where: { orderNumber: num },
      include: { orderItems: true }
    });
    
    // 2. Check Guest Order
    const guest = await p.guestOrder.findFirst({
      where: { orderNumber: num }
    });
    
    // 3. Check WhatsApp logs by orderNumber or digits
    const digits = num.replace(/\D/g, '');
    const logs = await p.$queryRawUnsafe(`
      SELECT content, "eventType", "sentAt"
      FROM "whatsapp_notification_logs"
      WHERE content LIKE '%' || $1 || '%'
         OR ("orderId" = $2 AND "orderId" IS NOT NULL)
      LIMIT 3
    `, num, ord?.id || 'none');

    // 4. Check if guest order items have details or car info
    let guestItemMeta = null;
    if (guest?.items) {
      try {
        const itms = typeof guest.items === 'string' ? JSON.parse(guest.items) : guest.items;
        guestItemMeta = itms.map(i => ({ name: i.productName, details: i.metadata?.details, attrs: i.metadata?.attributeValues }));
      } catch (e) {}
    }

    // 5. Check if order items have details
    const orderItemsMeta = (ord?.orderItems || []).map(i => ({
      name: i.productName,
      meta: i.metadata
    }));

    console.log({
      customer: ord?.customerName,
      phone: ord?.customerPhone,
      orderNotes: ord?.notes,
      guestNotes: guest?.notes,
      guestItemMeta,
      orderItemsMeta,
      waLogsCount: logs.length,
      waFirstLog: logs[0]?.content?.slice(0, 200)
    });
  }
}

main().then(() => p.$disconnect()).catch(err => {
  console.error(err);
  p.$disconnect();
});

const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log('=== Deep Investigation for ORD-519112-053 ===');

  // 1. Order details
  const o = await p.order.findFirst({
    where: { orderNumber: 'ORD-519112-053' },
    include: { orderItems: true }
  });
  console.log('Order:');
  console.log({
    id: o?.id,
    orderNumber: o?.orderNumber,
    customerName: o?.customerName,
    customerPhone: o?.customerPhone,
    status: o?.status,
    notes: o?.notes,
    metadata: o?.metadata,
    shippingAddress: o?.shippingAddress
  });

  console.log('Order Items:');
  for (const it of o?.orderItems || []) {
    console.log({
      productName: it.productName,
      productSku: it.productSku,
      metadata: it.metadata
    });
  }

  // 2. Guest Order
  const guest = await p.guestOrder.findFirst({
    where: {
      OR: [
        { orderNumber: 'ORD-519112-053' },
        { guestPhone: o?.customerPhone || '01102387122' },
        { guestName: { contains: 'ضياء' } }
      ]
    }
  });
  console.log('Guest Order:');
  console.log(guest ? {
    id: guest.id,
    orderNumber: guest.orderNumber,
    guestName: guest.guestName,
    guestPhone: guest.guestPhone,
    notes: guest.notes,
    metadata: guest.metadata,
    items: guest.items
  } : 'NOT FOUND');

  // 3. Search WhatsApp Logs by phone or name or order number
  const wa = await p.$queryRawUnsafe(`
    SELECT content, "eventType", "sentAt"
    FROM "whatsapp_notification_logs"
    WHERE content LIKE '%519112%'
       OR content LIKE '%01102387122%'
       OR content LIKE '%ضياء%'
       OR "orderId" = $1
    ORDER BY "sentAt" DESC
  `, o?.id || '');
  console.log('WhatsApp Logs count:', wa.length);
  for (const l of wa) {
    console.log(`[${l.eventType}] ${l.content}`);
  }

  // 4. Search conversations / messages
  const msgs = await p.$queryRawUnsafe(`
    SELECT m.content, m."senderType", m."createdAt"
    FROM messages m
    JOIN conversations c ON m."conversationId" = c.id
    WHERE c.metadata::text LIKE '%519112%'
       OR c.metadata::text LIKE '%01102387122%'
       OR c."customerPhone" LIKE '%01102387122%'
    ORDER BY m."createdAt" ASC
  `).catch(e => { console.log('conv err:', e.message); return []; });
  console.log('Messages count:', msgs.length);
  for (const m of msgs) {
    console.log(`[${m.senderType}]: ${m.content}`);
  }

  // 5. Search audit logs or status history
  if (o?.statusHistory) {
    console.log('Order statusHistory:', JSON.stringify(o.statusHistory, null, 2));
  }
}

main().then(() => p.$disconnect()).catch(err => {
  console.error(err);
  p.$disconnect();
});

const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const guest = await p.guestOrder.findFirst({
    where: { orderNumber: 'ORD-323988-603' }
  });
  console.log('Guest Order for 323:', JSON.stringify(guest, null, 2));

  if (guest?.notes && guest.notes !== 'Bulk status update') {
    await p.order.updateMany({
      where: { orderNumber: 'ORD-323988-603' },
      data: { notes: guest.notes }
    });
    console.log('Updated order notes to:', guest.notes);
  } else if (guest?.metadata?.items?.[0]?.variation_attributes) {
    const attrs = guest.metadata.items[0].variation_attributes;
    const car = attrs['نوع وموديل وسنة صنع السيارة'] || attrs['نوع وموديل السيارة'] || attrs['موديل السيارة'];
    if (car) {
      const note = `تفاصيل الطلب: نوع وموديل وسنة صنع السيارة: ${car}`;
      await p.order.updateMany({
        where: { orderNumber: 'ORD-323988-603' },
        data: { notes: note }
      });
      console.log('Updated order notes from meta to:', note);
    }
  } else {
    // Check conversation messages
    const conv = await p.$queryRawUnsafe(`
      SELECT m.content FROM messages m
      JOIN conversations c ON m."conversationId" = c.id
      WHERE c.metadata::text LIKE '%ORD-323988-603%' OR c.metadata::text LIKE '%323988%'
      ORDER BY m."createdAt" ASC
      LIMIT 10
    `).catch(() => []);
    console.log('Conv messages:', conv);
  }
}

main().then(() => p.$disconnect());

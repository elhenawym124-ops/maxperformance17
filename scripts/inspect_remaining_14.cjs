const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const company = await p.company.findFirst({
    where: { name: { contains: 'red', mode: 'insensitive' } }
  });

  const orders = await p.order.findMany({
    where: {
      companyId: company.id,
      OR: [
        { status: 'PREPARING' },
        { status: 'PROCESSING' }
      ]
    },
    include: { orderItems: true }
  });

  console.log(`Auditing all orders in PREPARING / PROCESSING:`);
  const missing = [];

  for (const o of orders) {
    let meta = o.metadata;
    if (typeof meta === 'string') {
      try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
    }
    const prepStatus = meta?.preparationStatus || o.status;
    if (prepStatus !== 'PREPARING') continue;

    let car = null;
    if (o.notes && o.notes !== 'Bulk status update') {
      const match = o.notes.match(/(?:سيارة|عربية|نوع وموديل)[^:\n]*:?\s*([^\n\r]+)/i);
      if (match) car = match[1].trim();
    }
    for (const item of o.orderItems) {
      let im = item.metadata;
      if (typeof im === 'string') {
        try { im = JSON.parse(im); } catch (e) { im = {}; }
      }
      if (im?.attributeValues?.car_model) car = im.attributeValues.car_model;
      if (im?.car_model) car = im.car_model;
      if (im?.details && im.details.trim()) car = im.details.trim();
    }

    if (!car) {
      missing.push({
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        notes: o.notes,
        createdAt: o.createdAt
      });
    }
  }

  console.log(`Total missing car model: ${missing.length}`);
  console.log(JSON.stringify(missing, null, 2));
}

main().then(() => p.$disconnect()).catch(err => {
  console.error(err);
  p.$disconnect();
});

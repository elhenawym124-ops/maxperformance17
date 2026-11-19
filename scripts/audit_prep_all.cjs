const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const company = await p.company.findFirst({
    where: { name: { contains: 'red', mode: 'insensitive' } }
  });

  const orders = await p.$queryRawUnsafe(`
    SELECT 
      o.id, 
      o."orderNumber", 
      o.status, 
      o.notes, 
      o.metadata,
      o."createdAt",
      COALESCE(NULLIF(o."metadata"::jsonb->>'preparationStatus', ''), NULLIF(o."customStatusCode", ''), o."status"::text) as effective_status
    FROM "orders" o
    WHERE o."companyId" = $1
      AND COALESCE(NULLIF(o."metadata"::jsonb->>'preparationStatus', ''), NULLIF(o."customStatusCode", ''), o."status"::text) IN ('PROCESSING', 'PREPARING')
    ORDER BY o."createdAt" DESC;
  `, company.id);

  console.log(`Total orders in PREPARING for Red Line: ${orders.length}`);

  let withCarModel = 0;
  let withoutCarModel = 0;
  const sampleWithCars = [];
  const sampleWithoutCars = [];

  for (const o of orders) {
    const items = await p.orderItem.findMany({ where: { orderId: o.id } });
    let foundCar = null;

    // Check notes
    if (o.notes && !o.notes.includes('Bulk status update')) {
      foundCar = o.notes;
    }

    // Check items
    for (const it of items) {
      let m = it.metadata;
      if (typeof m === 'string') {
        try { m = JSON.parse(m); } catch (e) { m = null; }
      }
      if (m?.attributeValues?.car_model || m?.attributeValues?.carModel || m?.carModel || m?.car_model) {
        foundCar = m?.attributeValues?.car_model || m?.attributeValues?.carModel || m?.carModel || m?.car_model;
      }
      if (m?.details && m.details.trim()) {
        foundCar = m.details.trim();
      }
    }

    // Check guest order
    const g = await p.guestOrder.findFirst({
      where: {
        companyId: company.id,
        OR: [{ orderNumber: o.orderNumber }, { id: o.id }]
      }
    });
    if (g) {
      if (g.notes && !g.notes.includes('Bulk status update')) {
        foundCar = foundCar || g.notes;
      }
      let gItems = [];
      try { gItems = typeof g.items === 'string' ? JSON.parse(g.items) : (g.items || []); } catch(e){}
      for (const gi of gItems) {
        if (gi?.metadata?.attributeValues?.car_model) foundCar = foundCar || gi.metadata.attributeValues.car_model;
        if (gi?.metadata?.details && gi.metadata.details.trim()) foundCar = foundCar || gi.metadata.details.trim();
        if (gi?.details && gi.details.trim()) foundCar = foundCar || gi.details.trim();
      }
    }

    if (foundCar) {
      withCarModel++;
      if (sampleWithCars.length < 5) sampleWithCars.push({ order: o.orderNumber, car: foundCar });
    } else {
      withoutCarModel++;
      if (sampleWithoutCars.length < 5) sampleWithoutCars.push(o.orderNumber);
    }
  }

  console.log(`Summary of PREPARING:`);
  console.log(`- Orders WITH car model: ${withCarModel}`);
  console.log(`- Orders WITHOUT car model: ${withoutCarModel}`);
  console.log(`Sample WITH car:`, sampleWithCars);
  console.log(`Sample WITHOUT car:`, sampleWithoutCars);
}

main().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect(); });

const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const company = await p.company.findFirst({
    where: { name: { contains: 'red', mode: 'insensitive' } }
  });

  const orders = await p.order.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: 'desc' },
    include: { orderItems: true }
  });

  console.log(`Total orders in Red Line: ${orders.length}`);

  let carInNotes = 0;
  let carInItems = 0;
  let carInGuest = 0;
  let noCarAnywhere = 0;

  const ordersWithCar = [];

  for (const o of orders) {
    let car = null;
    let source = '';

    // 1. check notes
    if (o.notes && o.notes !== 'Bulk status update') {
      const match = o.notes.match(/(?:سيارة|عربية|نوع وموديل)[^:\n]*:?\s*([^\n\r]+)/i);
      if (match) {
        car = match[1].trim();
        source = 'order.notes';
        carInNotes++;
      }
    }

    // 2. check items
    if (!car) {
      for (const item of o.orderItems) {
        let im = item.metadata;
        if (typeof im === 'string') {
          try { im = JSON.parse(im); } catch (e) { im = {}; }
        }
        if (im?.attributeValues?.car_model) {
          car = im.attributeValues.car_model;
          source = 'item.metadata.attributeValues.car_model';
          carInItems++;
          break;
        }
        if (im?.car_model) {
          car = im.car_model;
          source = 'item.metadata.car_model';
          carInItems++;
          break;
        }
      }
    }

    // 3. check guestOrder
    if (!car) {
      let meta = o.metadata;
      if (typeof meta === 'string') {
        try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
      }
      const guestId = meta?.backfilledFromGuestOrder?.guestOrderId;
      const guest = await p.guestOrder.findFirst({
        where: {
          companyId: company.id,
          OR: [
            { orderNumber: o.orderNumber },
            ...(guestId ? [{ id: guestId }] : [])
          ]
        }
      });
      if (guest) {
        if (guest.notes && guest.notes !== 'Bulk status update') {
          const match = guest.notes.match(/(?:سيارة|عربية|نوع وموديل)[^:\n]*:?\s*([^\n\r]+)/i);
          if (match) {
            car = match[1].trim();
            source = 'guest.notes';
            carInGuest++;
          }
        }
        if (!car && guest.items) {
          let gItems = typeof guest.items === 'string' ? JSON.parse(guest.items) : guest.items;
          for (const gi of (Array.isArray(gItems) ? gItems : [])) {
            if (gi?.attributes?.car_model) {
              car = gi.attributes.car_model;
              source = 'guest.items.attributes.car_model';
              carInGuest++;
              break;
            }
          }
        }
      }
    }

    let meta = o.metadata;
    if (typeof meta === 'string') {
      try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
    }
    const stage = meta?.preparationStatus || o.status;

    if (car) {
      ordersWithCar.push({ orderNumber: o.orderNumber, stage, status: o.status, car, source });
    } else {
      noCarAnywhere++;
    }
  }

  console.log(`\nResults: Total with car = ${ordersWithCar.length}, Without car = ${noCarAnywhere}`);
  console.log(` - In order.notes: ${carInNotes}`);
  console.log(` - In item.metadata: ${carInItems}`);
  console.log(` - In guestOrder: ${carInGuest}`);

  console.log('\nSample orders with car:');
  for (const oc of ordersWithCar.slice(0, 20)) {
    console.log(`Order ${oc.orderNumber} (stage: ${oc.stage}, status: ${oc.status}): "${oc.car}" [source: ${oc.source}]`);
  }
}

main().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect(); });

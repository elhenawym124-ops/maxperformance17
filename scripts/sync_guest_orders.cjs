const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const resultGuest = await p.$executeRawUnsafe(`
    UPDATE guest_orders g
    SET notes = o.notes
    FROM orders o
    WHERE (g."orderId" = o.id OR g."orderNumber" = o."orderNumber")
      AND o.notes LIKE '%نوع وموديل وسنة صنع السيارة:%'
      AND (g.notes IS NULL OR g.notes = 'Bulk status update' OR g.notes NOT LIKE '%سيارة%');
  `);

  console.log('guest_orders successfully updated:', resultGuest);
}

main().then(() => p.$disconnect()).catch(err => {
  console.error(err);
  p.$disconnect();
});

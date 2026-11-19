const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log('=== Step 1: Restoring from guest_orders via orderNumber ===');
  const res1 = await p.$executeRawUnsafe(`
    UPDATE orders o
    SET notes = g.notes
    FROM guest_orders g
    WHERE g."orderNumber" = o."orderNumber"
      AND (o.notes IS NULL OR o.notes = 'Bulk status update' OR o.notes NOT LIKE '%سيارة%')
      AND g.notes LIKE '%نوع وموديل وسنة صنع السيارة:%';
  `);
  console.log('Restored from guest_orders.notes:', res1);

  // Check sample order ORD-323988-603
  const sample = await p.$queryRawUnsafe(`
    SELECT "orderNumber", status, notes FROM orders WHERE "orderNumber" = 'ORD-323988-603'
  `);
  console.log('ORD-323988-603 now:', sample);
}

main().then(() => p.$disconnect()).catch(e => {
  console.error(e);
  p.$disconnect();
});

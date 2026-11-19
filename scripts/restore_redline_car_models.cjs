const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const companyId = 'cmu5iix000aa6juwmmqcrls8i';
  console.log('=== Step 1: Executing Direct SQL Restoration for Red Line Orders ===');
  
  const result = await p.$executeRawUnsafe(`
    UPDATE orders o
    SET notes = 'تفاصيل الطلب: نوع وموديل وسنة صنع السيارة: ' || trim(substring(w.content from 'نوع وموديل السيارة: ([^\\n|]+)'))
    FROM whatsapp_notification_logs w
    WHERE (w."orderId" = o.id OR w.content LIKE '%' || o."orderNumber" || '%')
      AND o."companyId" = 'cmu5iix000aa6juwmmqcrls8i'
      AND (o.notes IS NULL OR o.notes = 'Bulk status update' OR o.notes NOT LIKE '%سيارة%')
      AND w.content LIKE '%نوع وموديل السيارة:%';
  `);
  
  console.log('Successfully updated orders count:', result);

  // Check sample orders
  const sample = await p.$queryRawUnsafe(`
    SELECT "orderNumber", status, notes 
    FROM orders 
    WHERE "orderNumber" IN ('ORD-410414-534', 'ORD-793833-556', 'ORD-556722-701', 'ORD-323988-603')
  `);
  console.log('Sample verified orders:', JSON.stringify(sample, null, 2));
}

main()
  .then(() => p.$disconnect())
  .catch(err => {
    console.error('Error during restoration:', err);
    p.$disconnect();
    process.exit(1);
  });

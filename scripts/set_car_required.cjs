const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  // Update product customFields to required: true
  const res = await p.$executeRawUnsafe(`
    UPDATE products
    SET metadata = jsonb_set(
      metadata::jsonb,
      '{customFields,0,required}',
      'true'::jsonb,
      false
    )
    WHERE "companyId" = 'cmu5iix000aa6juwmmqcrls8i'
      AND metadata::jsonb ? 'customFields';
  `).catch(e => console.log('Update err:', e.message));

  console.log('Product customFields updated:', res);
}

main().then(() => p.$disconnect());

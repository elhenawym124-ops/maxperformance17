const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const company = await p.company.findFirst({ where: { name: { contains: 'red', mode: 'insensitive' } } });
  console.log('Company:', company.id, company.name);

  const products = await p.product.findMany({
    where: { companyId: company.id },
    select: { id: true, name: true, metadata: true, enableCheckoutForm: true }
  });
  console.log('\n--- Products ---');
  for (const pr of products) {
    console.log(pr.name);
    console.log('  metadata:', pr.metadata);
    console.log('  enableCheckoutForm:', pr.enableCheckoutForm);
  }

  const invSettings = await p.orderInvoiceSettings.findFirst({
    where: { companyId: company.id }
  });
  console.log('\n--- InvoiceSettings ---', invSettings);
}

main().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect(); });

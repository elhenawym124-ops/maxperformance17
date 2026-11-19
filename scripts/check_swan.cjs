const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const swan = await p.company.findFirst({ where: { name: { contains: 'swan', mode: 'insensitive' } } });
  if (swan) {
    const sInv = await p.orderInvoiceSettings.findFirst({ where: { companyId: swan.id } });
    console.log('Swan company ID:', swan.id);
    console.log('Swan invoice settings showCustomFields:', sInv ? sInv.showCustomFields : 'None');
  }
}

main().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect(); });

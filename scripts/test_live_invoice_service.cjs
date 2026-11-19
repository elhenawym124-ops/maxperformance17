const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();
const { bulkGenerateInvoicesOptimized } = require('/var/www/backend2/services/orderInvoiceServiceOptimized');
const { getInvoiceById } = require('/var/www/backend2/services/orderInvoiceService');
const tenantContext = require('/var/www/backend2/services/tenantContext');

async function main() {
  const company = await p.company.findFirst({
    where: { name: { contains: 'red', mode: 'insensitive' } }
  });
  console.log('Testing for company:', company.name, company.id);

  await tenantContext.run(company.id, async () => {
    // Find 2 orders: one with car model (e.g. from CONFIRMED or READY) and one from PREPARING
    const orderWithCar = await p.order.findFirst({
      where: {
        companyId: company.id,
        notes: { contains: 'نوع وموديل' }
      }
    });

    const orderPrep = await p.order.findFirst({
      where: {
        companyId: company.id,
        status: 'PREPARING'
      }
    });

    console.log('Order with car:', orderWithCar ? orderWithCar.orderNumber : 'None');
    console.log('Order in PREPARING:', orderPrep ? orderPrep.orderNumber : 'None');

    const testIds = [orderWithCar?.id, orderPrep?.id].filter(Boolean);
    console.log('\nRunning bulkGenerateInvoicesOptimized for:', testIds);

    const bulkRes = await bulkGenerateInvoicesOptimized(testIds);
    console.log('Bulk generate result:');
    console.log(` - Success: ${bulkRes.success.length}`);
    console.log(` - Existing: ${bulkRes.existing.length}`);
    console.log(` - Failed: ${bulkRes.failed.length}`);

    const allInvoices = [...bulkRes.success, ...bulkRes.existing].map(r => r.invoice).filter(Boolean);
    for (const inv of allInvoices) {
      console.log(`\n--- Invoice ${inv.invoiceNumber} (order: ${inv.order?.orderNumber}) ---`);
      console.log(`Invoice notes: "${inv.notes}"`);
      for (const item of (inv.order?.orderItems || [])) {
        console.log(`  Item: ${item.productName}`);
        console.log(`    carModel: "${item.carModel}"`);
        console.log(`    customAttributes:`, item.customAttributes);
      }

      // Now test single getInvoiceById
      console.log('Testing getInvoiceById:');
      const singleInv = await getInvoiceById(inv.id);
      console.log(`  Single invoice notes: "${singleInv.notes}"`);
      for (const item of (singleInv.order?.orderItems || [])) {
        console.log(`  Single item carModel: "${item.carModel}"`);
      }
    }
  });
}

main().then(() => p.$disconnect()).catch(e => { console.error('Error in test:', e); p.$disconnect(); });

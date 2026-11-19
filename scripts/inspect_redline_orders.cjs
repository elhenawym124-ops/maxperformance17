const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const company = await p.company.findFirst({
    where: { name: { contains: 'red', mode: 'insensitive' } }
  });
  if (!company) return;

  const orders = await p.order.findMany({
    where: { companyId: company.id },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      metadata: true,
      notes: true,
      orderInvoice: { select: { id: true, invoiceNumber: true, notes: true } }
    }
  });

  console.log(`Total orders for ${company.name}: ${orders.length}`);

  const byStage = {};
  for (const o of orders) {
    let meta = o.metadata;
    if (typeof meta === 'string') {
      try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
    }
    const stage = meta?.preparationStatus || o.status;
    if (!byStage[stage]) byStage[stage] = [];
    byStage[stage].push(o);
  }

  console.log('\nOrders grouped by stage / status:');
  for (const [st, list] of Object.entries(byStage)) {
    console.log(`\nStage: [${st}] count: ${list.length}`);
    for (const o of list.slice(0, 5)) {
      console.log(`  Order ${o.orderNumber}: status=${o.status}, notes="${o.notes?.slice(0, 80)}", hasInvoice=${!!o.orderInvoice}`);
    }
  }
}

main().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect(); });

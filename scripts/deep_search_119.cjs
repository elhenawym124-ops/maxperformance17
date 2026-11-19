const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const company = await p.company.findFirst({ where: { name: { contains: 'red', mode: 'insensitive' } } });
  
  // Take 5 orders from PREPARING
  const orders = await p.order.findMany({
    where: {
      companyId: company.id,
      notes: { contains: 'Bulk status update' }
    },
    take: 5
  });

  console.log('Inspecting 5 PREPARING orders across all tables:');
  for (const o of orders) {
    console.log(`\n=== Checking ${o.orderNumber} (Phone: ${o.customerPhone}) ===`);
    
    // Check StatusHistory
    const hist = await p.orderStatusHistory.findMany({ where: { orderId: o.id } });
    console.log('  StatusHistory count:', hist.length, hist.map(h => ({ status: h.status, reason: h.reason })));

    // Check WhatsApp logs
    const wa = await p.whatsapp_notification_logs?.findMany?.({
      where: { recipientPhone: { contains: o.customerPhone.slice(-8) } }
    }).catch(() => []);
    console.log('  WhatsApp logs count:', wa?.length || 0);

    // Check if customer has any notes in Customer model
    if (o.customerId) {
      const cust = await p.customer.findUnique({ where: { id: o.customerId } });
      console.log('  Customer notes:', cust?.notes, cust?.metadata);
    }
  }
}

main().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect(); });

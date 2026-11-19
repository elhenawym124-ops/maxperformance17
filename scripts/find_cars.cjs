const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const company = await p.company.findFirst({
    where: { name: { contains: 'red', mode: 'insensitive' } }
  });

  const orders = await p.order.findMany({
    where: {
      companyId: company.id,
      notes: { not: { contains: 'Bulk status update' } }
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      orderNumber: true,
      status: true,
      notes: true,
      orderItems: {
        select: {
          productName: true,
          productColor: true,
          productSize: true,
          productDetails: true,
          metadata: true
        }
      }
    }
  });

  console.log(`Found ${orders.length} orders with custom notes:`);
  for (const o of orders) {
    console.log(`\nOrder: ${o.orderNumber} | Status: ${o.status}`);
    console.log('Notes:', o.notes);
    console.log('Items:', JSON.stringify(o.orderItems));
  }
}

main().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect(); });

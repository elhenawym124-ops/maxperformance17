const { execSync } = require('child_process');

const remoteJs = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const companyId = 'cmu5iix000aa6juwmmqcrls8i';
  
  // 1. Shipment table status distribution
  const shipmentCounts = await prisma.shipment.groupBy({
    by: ['status'],
    where: { companyId },
    _count: true
  });
  console.log('=== SHIPMENT TABLE (Red Line) ===');
  console.log(JSON.stringify(shipmentCounts, null, 2));

  // 2. Order table turboShipmentStatus distribution
  const orderCounts = await prisma.order.groupBy({
    by: ['turboShipmentStatus'],
    where: { companyId, turboShipmentStatus: { not: null } },
    _count: true
  });
  console.log('=== ORDER TABLE (Red Line) ===');
  console.log(JSON.stringify(orderCounts, null, 2));

  // 3. Are there ANY shipments in 'created'?
  const stuckCreated = await prisma.shipment.count({
    where: { companyId, status: 'created' }
  });
  console.log('=== SHIPMENTS WITH STATUS created ===', stuckCreated);

  // 4. Any orders with turboShipmentStatus 'created'?
  const stuckOrders = await prisma.order.count({
    where: { companyId, turboShipmentStatus: 'created' }
  });
  console.log('=== ORDERS WITH TURBO STATUS created ===', stuckOrders);

  // 5. Check last 5 shipments and their order status
  const recent = await prisma.shipment.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      trackingNumber: true,
      status: true,
      order: {
        select: {
          orderNumber: true,
          turboShipmentStatus: true
        }
      }
    }
  });
  console.log('=== RECENT 5 SHIPMENTS ===');
  console.log(JSON.stringify(recent, null, 2));

  await prisma.$disconnect();
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
`;

const b64 = Buffer.from(remoteJs).toString('base64');
const out = execSync(`ssh maxp "cd /var/www/backend2 && node -e \\"eval(Buffer.from('${b64}', 'base64').toString('utf8'))\\""`, {
  encoding: 'utf8',
  timeout: 30000
});
console.log(out);

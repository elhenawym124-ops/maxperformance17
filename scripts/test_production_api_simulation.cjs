const { execSync } = require('child_process');

const remoteJs = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkApiSimulation() {
  const companyId = 'cmu5iix000aa6juwmmqcrls8i';
  
  // Test query what GET /api/v1/shipments?status=processing returns:
  const processingShipments = await prisma.shipment.findMany({
    where: {
      companyId,
      status: { in: ['processing', 'underway', 'accepted', 'status_3', '3'] }
    },
    select: {
      id: true,
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

  console.log('=== PROCESSING SHIPMENTS COUNT ===', processingShipments.length);
  console.log('Sample processing shipment:', JSON.stringify(processingShipments[0] || null, null, 2));

  // Test query what GET /api/v1/shipments?status=pending / turbo_sent returns:
  const waitingShipments = await prisma.shipment.count({
    where: {
      companyId,
      status: { in: ['turbo_sent', 'sent', 'waiting', 'pending', 'status_1', 'status_2', '1', '2'] }
    }
  });
  console.log('=== WAITING SHIPMENTS (turbo_sent) COUNT ===', waitingShipments);

  // Test query true incomplete shipments
  const incompleteShipments = await prisma.shipment.count({
    where: {
      companyId,
      status: { in: ['incomplete', 'status_18', 'status_99', '18', '99'] }
    }
  });
  console.log('=== TRUE INCOMPLETE SHIPMENTS COUNT (codes 18 & 99) ===', incompleteShipments);

  await prisma.$disconnect();
}

checkApiSimulation().catch(err => {
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

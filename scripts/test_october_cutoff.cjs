const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = 'cmleybpf70028juo2wwpmp8rt'; // Swan
  const startDate = new Date('2026-10-01T00:00:00.000Z');

  // Count unreviewed return requests where order createdAt >= 2026-10-01
  const count = await prisma.returnRequest.count({
    where: {
      companyId,
      isReviewed: false,
      OR: [
        { createdAt: { gte: startDate } },
        { order: { createdAt: { gte: startDate } } }
      ],
      order: {
        createdAt: { gte: startDate }
      }
    }
  });

  const orders = await prisma.returnRequest.findMany({
    where: {
      companyId,
      isReviewed: false,
      order: {
        createdAt: { gte: startDate }
      }
    },
    include: {
      order: {
        select: { orderNumber: true, createdAt: true, status: true, turboShipmentStatus: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`With startDate = 2026-10-01: Pending count = ${orders.length}`);
  orders.forEach((r, idx) => {
    console.log(`${idx + 1}. Req #${r.id} | Order #${r.order?.orderNumber} | OrderDate: ${r.order?.createdAt?.toISOString().slice(0, 10)} | Status: ${r.order?.status} | Turbo: ${r.order?.turboShipmentStatus}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());

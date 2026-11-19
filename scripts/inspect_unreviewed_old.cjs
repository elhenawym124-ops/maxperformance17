const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = 'cmleybpf70028juo2wwpmp8rt'; // Swan
  const yesterday = new Date(Date.now() - 36 * 60 * 60 * 1000);

  // Return requests created in last 36h that are unreviewed
  const unreviewedRecent = await prisma.returnRequest.findMany({
    where: {
      companyId,
      createdAt: { gte: yesterday },
      isReviewed: false
    },
    include: {
      order: {
        include: {
          orderNotes: true,
          statusHistory: { orderBy: { createdAt: 'desc' } }
        }
      }
    }
  });

  console.log(`Unreviewed return requests created in last 36h: ${unreviewedRecent.length}`);
  
  let oldOrderCount = 0;
  for (const r of unreviewedRecent) {
    const isOldOrder = r.order && new Date(r.order.createdAt) < new Date('2026-10-01');
    if (isOldOrder) {
      oldOrderCount++;
      console.log(`Old Order ReturnRequest: Req #${r.id} | Order #${r.order?.orderNumber} | OrderDate: ${r.order?.createdAt} | OrderStatus: ${r.order?.status} | Notes: ${r.adminNotes}`);
    }
  }
  console.log(`Total old orders (< Oct 1) in unreviewed returns: ${oldOrderCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

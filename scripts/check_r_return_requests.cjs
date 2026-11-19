const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = 'cmleybpf70028juo2wwpmp8rt'; // Swan
  const rReqs = await prisma.returnRequest.findMany({
    where: {
      companyId,
      order: { orderNumber: { startsWith: 'R-ORD-' } }
    },
    include: { order: true }
  });

  console.log(`ReturnRequests for R-ORD-: ${rReqs.length}`);
  for (const r of rReqs) {
    const origNum = r.order.orderNumber.replace(/^R-/, '');
    const origOrder = await prisma.order.findFirst({
      where: { orderNumber: origNum },
      include: { returnRequests: true }
    });
    console.log({
      rReqId: r.id,
      rOrderNum: r.order.orderNumber,
      rIsReviewed: r.isReviewed,
      rParty: r.responsibleParty,
      origNum,
      origExists: !!origOrder,
      origStatus: origOrder?.status,
      origReqsCount: origOrder?.returnRequests?.length,
      origReviewed: origOrder?.returnRequests?.map(x => ({ id: x.id, isReviewed: x.isReviewed, party: x.responsibleParty }))
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const companyId = 'cmleybpf70028juo2wwpmp8rt'; // Swan

  // 1. Check if there are orders with multiple return requests (or return requests sharing orderNumber)
  const reqs = await prisma.returnRequest.findMany({
    where: { companyId },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          turboShipmentStatus: true,
          notes: true,
          createdAt: true
        }
      },
      returnReason: true,
      returnActivityLogs: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Total return requests for Swan: ${reqs.length}`);

  // Check for duplicate orderNumbers in returnRequests
  const byOrderNum = new Map();
  reqs.forEach(r => {
    const num = r.order?.orderNumber;
    if (num) {
      if (!byOrderNum.has(num)) byOrderNum.set(num, []);
      byOrderNum.get(num).push(r);
    }
  });

  const duplicates = [...byOrderNum.entries()].filter(([num, list]) => list.length > 1);
  console.log(`Number of order numbers with MULTIPLE return requests: ${duplicates.length}`);
  if (duplicates.length > 0) {
    console.log('Sample of duplicates:');
    duplicates.slice(0, 5).forEach(([num, list]) => {
      console.log(`\nOrder #${num}: ${list.length} return requests:`);
      list.forEach(r => {
        console.log(`  Req #${r.id} | isReviewed: ${r.isReviewed} | Status: ${r.status} | Party: ${r.responsibleParty} | Reason: ${r.returnReason?.reason} | AdminNotes: ${r.adminNotes} | CreatedAt: ${r.createdAt}`);
      });
    });
  }

  // 2. Check return requests created in the last 24-48 hours
  const yesterday = new Date(Date.now() - 36 * 60 * 60 * 1000);
  const createdRecently = reqs.filter(r => new Date(r.createdAt) >= yesterday);
  console.log(`\nReturn requests created in last 36h: ${createdRecently.length}`);
  createdRecently.slice(0, 10).forEach(r => {
    console.log(`Req #${r.id} | Order #${r.order?.orderNumber} | isReviewed: ${r.isReviewed} | Party: ${r.responsibleParty} | Reason: ${r.returnReason?.reason} | AdminNotes: ${r.adminNotes} | OrderDate: ${r.order?.createdAt} | ReqCreated: ${r.createdAt}`);
  });

  // 3. Check orders that have notes with team updates / stances, but their ReturnRequest is unreviewed
  const unreviewedWithStance = reqs.filter(r => !r.isReviewed && (r.responsibleParty || r.reasonId || (r.adminNotes && !r.adminNotes.includes('تلقائي'))));
  console.log(`\nUnreviewed requests with existing party/reason/custom notes: ${unreviewedWithStance.length}`);
  unreviewedWithStance.slice(0, 10).forEach(r => {
    console.log(`Req #${r.id} | Order #${r.order?.orderNumber} | isReviewed: ${r.isReviewed} | Party: ${r.responsibleParty} | Reason: ${r.returnReason?.reason} | AdminNotes: ${r.adminNotes}`);
  });

  // 4. Check if there are orders with returnActivityLogs
  const withLogs = reqs.filter(r => r.returnActivityLogs && r.returnActivityLogs.length > 0);
  console.log(`\nReturn requests with activity logs: ${withLogs.length}`);

  // 5. Check returnSettings reviewDisplayConfig
  const settings = await prisma.returnSettings.findUnique({ where: { companyId } });
  console.log('\nReturnSettings reviewDisplayConfig:', JSON.stringify(settings?.reviewDisplayConfig, null, 2));

  await prisma.$disconnect();
}

run().catch(console.error);

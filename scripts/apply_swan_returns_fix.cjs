const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = 'cmleybpf70028juo2wwpmp8rt'; // Swan

  // 1. Update ReturnSettings for Swan to set ordersStartDate = '2026-10-01'
  const settings = await prisma.returnSettings.findUnique({ where: { companyId } });
  let config = {};
  if (settings?.reviewDisplayConfig) {
    config = typeof settings.reviewDisplayConfig === 'string'
      ? JSON.parse(settings.reviewDisplayConfig)
      : settings.reviewDisplayConfig;
  }
  config.ordersStartDate = '2026-10-01';

  await prisma.returnSettings.update({
    where: { companyId },
    data: { reviewDisplayConfig: config }
  });
  console.log('✅ Updated Swan returnSettings.reviewDisplayConfig.ordersStartDate to 2026-10-01');

  // 2. Delete the 27 falsely auto-created return requests for orders before 2026-10-01
  const targets = await prisma.returnRequest.findMany({
    where: {
      companyId,
      isReviewed: false,
      responsibleParty: null,
      adminNotes: { contains: 'تلقائي' },
      order: {
        createdAt: { lt: new Date('2026-10-01T00:00:00.000Z') }
      }
    },
    select: { id: true, order: { select: { orderNumber: true, createdAt: true } } }
  });

  console.log(`Found ${targets.length} false return requests for orders < Oct 1 to clean up.`);
  if (targets.length > 0) {
    const ids = targets.map(t => t.id);
    await prisma.returnActivityLog.deleteMany({
      where: { returnRequestId: { in: ids } }
    });
    const del = await prisma.returnRequest.deleteMany({
      where: { id: { in: ids } }
    });
    console.log(`✅ Deleted ${del.count} false return requests.`);
  }

  // 3. Check new pending return requests count in DB
  const pendingCount = await prisma.returnRequest.count({
    where: {
      companyId,
      isReviewed: false,
      OR: [
        { createdAt: { gte: new Date('2026-10-01T00:00:00.000Z') } },
        { order: { createdAt: { gte: new Date('2026-10-01T00:00:00.000Z') } } }
      ],
      order: {
        createdAt: { gte: new Date('2026-10-01T00:00:00.000Z') }
      }
    }
  });
  console.log(`\n🎉 New active pending returns count for Swan: ${pendingCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

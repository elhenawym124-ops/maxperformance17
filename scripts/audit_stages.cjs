const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  const company = await p.company.findFirst({
    where: { name: { contains: 'red', mode: 'insensitive' } }
  });

  const stages = await p.$queryRawUnsafe(`
    SELECT 
      COALESCE(NULLIF(o."metadata"::jsonb->>'preparationStatus', ''), NULLIF(o."customStatusCode", ''), o."status"::text) as stage,
      COUNT(*) as count
    FROM "orders" o
    WHERE o."companyId" = $1
    GROUP BY 1
    ORDER BY 2 DESC;
  `, company.id);

  console.log('Stages breakdown in Red Line:', stages);

  // Check how many orders in each stage have car models
  const allOrders = await p.order.findMany({
    where: { companyId: company.id },
    select: {
      orderNumber: true,
      status: true,
      notes: true,
      metadata: true
    }
  });

  const stageCarMap = {};
  for (const o of allOrders) {
    let meta = o.metadata;
    if (typeof meta === 'string') { try { meta = JSON.parse(meta); } catch(e){} }
    const st = meta?.preparationStatus || o.status || 'UNKNOWN';
    if (!stageCarMap[st]) stageCarMap[st] = { total: 0, withCar: 0 };
    stageCarMap[st].total++;
    if (o.notes && !o.notes.includes('Bulk status update') && (o.notes.includes('السيارة') || o.notes.includes('سيارة') || o.notes.includes('موديل') || o.notes.includes('تفاصيل'))) {
      stageCarMap[st].withCar++;
    }
  }

  console.log('\nCar models by stage:', stageCarMap);
}

main().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect(); });

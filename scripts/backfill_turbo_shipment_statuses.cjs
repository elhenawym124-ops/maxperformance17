/**
 * Idempotent Backfill Script: Turbo Shipment Statuses & Dual-Table Alignment
 * Company: Red Line (cmu5iix000aa6juwmmqcrls8i) & System-wide
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const REDLINE_COMPANY_ID = 'cmu5iix000aa6juwmmqcrls8i';

async function main() {
  console.log('🚀 [BACKFILL] Starting Turbo Shipment Status Alignment for Red Line...');

  // 1. Backfill Order.turboShipmentStatus: 'created' -> 'turbo_sent' when tracking exists
  const ordersWithCreated = await prisma.order.findMany({
    where: {
      companyId: REDLINE_COMPANY_ID,
      turboShipmentStatus: 'created',
      OR: [
        { turboTrackingNumber: { not: null } },
        { turboShipmentId: { not: null } },
      ],
    },
    select: { id: true, orderNumber: true, turboTrackingNumber: true },
  });

  console.log(`📦 Found ${ordersWithCreated.length} orders with turboShipmentStatus = 'created' and tracking code.`);

  if (ordersWithCreated.length > 0) {
    const orderIds = ordersWithCreated.map(o => o.id);
    const updatedOrders = await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { turboShipmentStatus: 'turbo_sent' },
    });
    console.log(`✅ Updated ${updatedOrders.count} orders from 'created' to 'turbo_sent'.`);
  }

  // Also do guest orders
  const guestOrdersWithCreated = await prisma.guestOrder.findMany({
    where: {
      companyId: REDLINE_COMPANY_ID,
      turboShipmentStatus: 'created',
      OR: [
        { turboTrackingNumber: { not: null } },
        { turboShipmentId: { not: null } },
      ],
    },
    select: { id: true, orderNumber: true },
  });
  if (guestOrdersWithCreated.length > 0) {
    const guestIds = guestOrdersWithCreated.map(g => g.id);
    const updatedGuests = await prisma.guestOrder.updateMany({
      where: { id: { in: guestIds } },
      data: { turboShipmentStatus: 'turbo_sent' },
    });
    console.log(`✅ Updated ${updatedGuests.count} guest orders from 'created' to 'turbo_sent'.`);
  }

  // 2. Fetch Turbo carrier for Red Line
  const turboCarrier = await prisma.shippingCompany.findFirst({
    where: { companyId: REDLINE_COMPANY_ID, providerKey: 'TURBO' },
    select: { id: true },
  });

  // 3. Find any Red Line orders with Turbo tracking that lack a Shipment record
  const ordersWithoutShipment = await prisma.order.findMany({
    where: {
      companyId: REDLINE_COMPANY_ID,
      OR: [
        { turboTrackingNumber: { not: null } },
        { turboShipmentId: { not: null } },
      ],
      shipments: { none: {} },
    },
    select: {
      id: true,
      orderNumber: true,
      turboTrackingNumber: true,
      turboShipmentId: true,
      turboShipmentStatus: true,
      turboLabelUrl: true,
      turboMetadata: true,
      governorate: true,
      city: true,
      customerAddress: true,
      shippingAddress: true,
      shipping: true,
      currency: true,
      createdAt: true,
    },
  });

  console.log(`🔍 Found ${ordersWithoutShipment.length} orders lacking a Shipment record.`);

  if (ordersWithoutShipment.length > 0) {
    const toCreate = ordersWithoutShipment.map(ord => ({
      companyId: REDLINE_COMPANY_ID,
      orderId: ord.id,
      shippingCompanyId: turboCarrier?.id || null,
      carrierType: 'TURBO',
      status: (ord.turboShipmentStatus && ord.turboShipmentStatus !== 'created') ? ord.turboShipmentStatus : 'turbo_sent',
      trackingNumber: ord.turboTrackingNumber || null,
      externalShipmentId: ord.turboShipmentId || null,
      labelUrl: ord.turboLabelUrl || null,
      destinationGovernorate: ord.governorate || null,
      destinationCity: ord.city || null,
      destinationAddress: ord.customerAddress || ord.shippingAddress || null,
      cost: ord.shipping !== null && ord.shipping !== undefined ? Number(ord.shipping) : null,
      currency: ord.currency || 'EGP',
      createdAt: ord.createdAt || new Date(),
      metadata: ord.turboMetadata ? JSON.stringify(ord.turboMetadata) : null,
    }));

    await prisma.shipment.createMany({
      data: toCreate,
      skipDuplicates: true,
    });
    console.log(`✅ Created ${toCreate.length} missing Shipment records.`);
  }

  // 4. Align existing Shipment.status with Order.turboShipmentStatus
  const existingShipments = await prisma.shipment.findMany({
    where: {
      companyId: REDLINE_COMPANY_ID,
    },
    select: {
      id: true,
      status: true,
      orderId: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
          turboShipmentStatus: true,
          status: true,
        },
      },
    },
  });

  console.log(`📊 Auditing ${existingShipments.length} existing shipments for Red Line...`);

  let updatedCount = 0;
  let alreadyAligned = 0;

  for (const s of existingShipments) {
    let desiredStatus = s.order?.turboShipmentStatus;
    if (!desiredStatus || desiredStatus === 'created') {
      desiredStatus = 'turbo_sent';
    }

    if (s.status !== desiredStatus) {
      await prisma.shipment.update({
        where: { id: s.id },
        data: { status: desiredStatus },
      });
      updatedCount++;
    } else {
      alreadyAligned++;
    }
  }

  console.log(`✅ Shipments alignment complete: ${updatedCount} updated, ${alreadyAligned} already aligned.`);

  // 5. Final Stage Distribution Count
  const finalShipments = await prisma.shipment.findMany({
    where: { companyId: REDLINE_COMPANY_ID },
    select: { status: true },
  });

  const counts = {};
  for (const s of finalShipments) {
    counts[s.status] = (counts[s.status] || 0) + 1;
  }

  console.log('\n📊 [FINAL SHIPMENT STATUS DISTRIBUTION IN DB]:');
  console.table(counts);
}

main()
  .catch(err => {
    console.error('❌ [BACKFILL ERROR]:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

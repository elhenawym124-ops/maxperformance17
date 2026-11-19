const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function run() {
  const g = await p.guestOrder.findFirst();
  console.log('GuestOrder keys:', Object.keys(g || {}));
  
  // Also check if GuestOrder has statusHistory relation
  try {
    const withHistory = await p.guestOrder.findFirst({
      include: {
        statusHistory: true
      }
    });
    console.log('GuestOrder has statusHistory:', Boolean(withHistory));
  } catch (e) {
    console.log('GuestOrder statusHistory relation error:', e.message);
  }

  // Also check if OrderStatusHistory has guestOrderId
  const shWithGuest = await p.orderStatusHistory.findFirst({
    where: { guestOrderId: { not: null } }
  });
  console.log('OrderStatusHistory with guestOrderId:', shWithGuest ? true : false);

  await p.$disconnect();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});

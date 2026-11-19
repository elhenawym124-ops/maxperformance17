const { PrismaClient } = require("./apps/backend/node_modules/@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const guest = await prisma.guestOrder.findUnique({
    where: { id: "cmv6la9is00x6juh9tkvumm9n" }
  });
  console.log("=== Guest Order ===");
  console.log(JSON.stringify(guest, null, 2));

  // Also check if there's any LandingLead or Order or AuditLog for ORD-410414-534
  const order = await prisma.order.findFirst({
    where: { orderNumber: "ORD-410414-534" },
    include: {
      orderItems: true,
      customer: true
    }
  });
  console.log("=== Order in DB ===");
  console.log(JSON.stringify(order, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

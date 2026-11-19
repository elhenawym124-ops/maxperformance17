const path = require('path');
const { PrismaClient } = require(path.resolve(__dirname, '../apps/backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

(async () => {
  const users = await prisma.user.findMany({
    where: { email: 'tester@maxp.com' },
    select: { id: true, email: true, companyId: true }
  });
  console.log('User:', users);

  if (users.length > 0) {
    const companyId = users[0].companyId;
    const pos = await prisma.purchaseOrder.findMany({
      where: { companyId },
      select: { id: true, orderNumber: true, totalAmount: true, status: true },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log('POs for company:', pos);

    const invs = await prisma.purchaseInvoice.findMany({
      where: { companyId },
      select: { id: true, invoiceNumber: true, totalAmount: true, status: true },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log('Invoices for company:', invs);
  }
})().finally(() => prisma.$disconnect());

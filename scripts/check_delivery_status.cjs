const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { phone: { contains: '1123087745' } },
        { phoneNormalized: { contains: '1123087745' } }
      ]
    }
  });
  console.log('Customer:', customer);

  if (customer) {
    const messages = await prisma.message.findMany({
      where: {
        conversation: { customerId: customer.id }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    console.log('Messages for customer:', JSON.stringify(messages, null, 2));
  }

  // Check broadcast recipient for campaign cmpl08r678c3f9efkpmp
  const recipients = await prisma.broadcastRecipient.findMany({
    where: {
      OR: [
        { campaignId: 'cmpl08r678c3f9efkpmp' },
        { customerPhone: { contains: '1123087745' } }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('Broadcast recipients:', JSON.stringify(recipients, null, 2));

  // Check recent whatsapp webhook logs or errors in database
  // Check whatsAppSession for swan
  const session = await prisma.whatsAppSession.findFirst({
    where: { id: 'cms1o1o9u00imjucwqdih3lpj' }
  });
  console.log('Session config:', {
    phoneNumber: session?.phoneNumber,
    phoneNumberId: session?.phoneNumberId,
    displayPhoneNumber: session?.displayPhoneNumber,
    wabaId: session?.wabaId,
    status: session?.status
  });
}

check().catch(console.error).finally(() => prisma.$disconnect());

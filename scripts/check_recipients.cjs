const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const recipients = await prisma.broadcastRecipient.findMany({
    where: {
      campaignId: { in: ['cmpl08r678c3f9efkpmp', 'cmtpso09k8ztf5tibbg8', 'cmm0vuwtn411kpl1o83y'] }
    }
  });
  console.log('Recipients:', JSON.stringify(recipients, null, 2));

  // Also let's check recent messages with messageId
  for (const r of recipients) {
    if (r.messageId) {
      console.log('Checking message for wamid:', r.messageId);
      const msg = await prisma.message.findFirst({
        where: { id: r.messageId }
      }).catch(() => null);
      console.log('Msg found by id:', msg);
    }
  }
}

main().catch(console.error).finally(() => { prisma.$disconnect(); process.exit(0); });

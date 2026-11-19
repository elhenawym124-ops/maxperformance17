const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log('=== Checking all conversations for Diaa Salah 01102387122 ===');
  
  // Find customer
  const customer = await p.customer.findFirst({
    where: { phone: { contains: '01102387122' } }
  });
  console.log('Customer:', customer);

  // Search messages containing the phone or 'براجيل' or 'ضياء'
  const messages = await p.$queryRawUnsafe(`
    SELECT m.content, m."senderType", m."createdAt"
    FROM messages m
    WHERE m.content LIKE '%01102387122%'
       OR m.content LIKE '%ضياء صلاح%'
       OR m.content LIKE '%ORD-519112%'
    ORDER BY m."createdAt" DESC
  `);
  console.log('Messages mentioning Diaa:', messages);

  // Check call attempt logs
  const callLogs = await p.callAttemptLog.findMany({
    where: { orderId: 'cmu6i700u0005jutpo07593c6' }
  }).catch(() => []);
  console.log('Call logs:', callLogs);

  // Check order audit logs or order notes
  const orderNotes = await p.orderNote.findMany({
    where: { orderId: 'cmu6i700u0005jutpo07593c6' }
  }).catch(() => []);
  console.log('Order notes table:', orderNotes);
}

main().then(() => p.$disconnect()).catch(err => {
  console.error(err);
  p.$disconnect();
});

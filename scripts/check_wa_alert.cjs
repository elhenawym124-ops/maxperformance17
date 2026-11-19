const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
const p = new PrismaClient();
const fs = require('fs');

async function main() {
  console.log('=== 1. RECENT WHATSAPP NOTIFICATION LOGS ===');
  try {
    const logs = await p.$queryRawUnsafe(`
      SELECT id, "companyId", "eventType", "recipientPhone", status, "failureReason", "createdAt"
      FROM whatsapp_notification_logs
      ORDER BY "createdAt" DESC
      LIMIT 10;
    `);
    console.log(JSON.stringify(logs, null, 2));
  } catch (e) {
    console.error('Error fetching logs:', e.message);
  }

  console.log('\n=== 2. SWAN / CONFIRMED TEMPLATES IN DB ===');
  try {
    const templates = await p.$queryRawUnsafe(`
      SELECT id, "companyId", name, "eventType", channel, "metaTemplateName", "metaTemplateStatus", variables, "updatedAt"
      FROM whatsapp_notification_templates
      WHERE "metaTemplateName" ILIKE '%swan%'
         OR "metaTemplateName" ILIKE '%confirm%'
         OR "eventType" = 'ORDER_CONFIRMED';
    `);
    console.log(JSON.stringify(templates, null, 2));
  } catch (e) {
    console.error('Error fetching templates:', e.message);
  }

  console.log('\n=== 3. PM2 ERROR LOG SNIPPET FOR WHATSAPP ===');
  try {
    const errLog = fs.readFileSync('/root/.pm2/logs/maxp-backend-error.log', 'utf8');
    const lines = errLog.split('\n').filter(l => l.includes('WHATSAPP') || l.includes('swan_confirmed') || l.includes('Meta template'));
    console.log(lines.slice(-30).join('\n'));
  } catch (e) {
    console.log('Could not read error log:', e.message);
  }

  console.log('\n=== 4. PM2 OUT LOG SNIPPET FOR WHATSAPP ===');
  try {
    const outLog = fs.readFileSync('/root/.pm2/logs/maxp-backend-out.log', 'utf8');
    const lines = outLog.split('\n').filter(l => l.includes('WHATSAPP') || l.includes('swan_confirmed') || l.includes('Meta template'));
    console.log(lines.slice(-30).join('\n'));
  } catch (e) {
    console.log('Could not read out log:', e.message);
  }
}

main()
  .then(() => p.$disconnect())
  .catch(e => {
    console.error('Error:', e);
    p.$disconnect();
  });

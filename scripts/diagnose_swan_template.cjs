const fs = require('fs');

async function main() {
  console.log('=== CHECKING PM2 ERROR LOG ===');
  try {
    const errData = fs.readFileSync('/root/.pm2/logs/maxp-backend-error-16.log', 'utf8');
    const matches = errData.split('\n').filter(l => l.includes('swan_confirmed') || l.includes('META_PARAM_COUNT_MISMATCH') || l.includes('expects') || l.includes('WHATSAPP-DEBUG'));
    console.log('Last 20 matching error lines:');
    console.log(matches.slice(-20).join('\n'));
  } catch (e) {
    console.log('Error reading error log:', e.message);
  }

  console.log('\n=== CHECKING PM2 OUT LOG ===');
  try {
    const outData = fs.readFileSync('/root/.pm2/logs/maxp-backend-out-16.log', 'utf8');
    const matches = outData.split('\n').filter(l => l.includes('swan_confirmed') || l.includes('META_PARAM_COUNT_MISMATCH') || l.includes('expects') || l.includes('WHATSAPP-DEBUG'));
    console.log('Last 20 matching out lines:');
    console.log(matches.slice(-20).join('\n'));
  } catch (e) {
    console.log('Error reading out log:', e.message);
  }

  console.log('\n=== INSPECTING META TEMPLATE FROM PROVIDER ===');
  try {
    const { PrismaClient } = require('/var/www/backend2/node_modules/@prisma/client');
    const p = new PrismaClient();
    
    // Find Swan's Meta session
    const swanCompanyId = 'cmleybpf70028juo2wwpmp8rt';
    const session = await p.whatsAppSession.findFirst({
      where: {
        companyId: swanCompanyId,
        provider: 'META_CLOUD'
      }
    });
    console.log('Swan session:', session ? { id: session.id, status: session.status, phoneNumberId: session.phoneNumberId } : 'NONE');

    if (session) {
      const MetaCloudProvider = require('/var/www/backend2/services/whatsapp/providers/MetaCloudProvider');
      const templates = await MetaCloudProvider.listTemplates(session.id);
      const swanConfirmed = (templates || []).find(t => t.name.includes('swan_confirmed'));
      console.log('swan_confirmed template from Meta:', JSON.stringify(swanConfirmed, null, 2));
    }
    await p.$disconnect();
  } catch (e) {
    console.log('Error checking meta provider:', e.message, e.stack);
  }
}

main().catch(console.error);

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

async function main() {
  console.log('=== 1. Checking Broadcast Campaigns & Recipients for swan ===');
  const company = await prisma.company.findFirst({
    where: { name: { contains: 'swan', mode: 'insensitive' } }
  });
  console.log('Company:', company ? { id: company.id, name: company.name } : 'Not found');

  const campaigns = await prisma.broadcastCampaign.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      broadcastRecipients: true
    }
  });

  for (const c of campaigns) {
    console.log(`Campaign ${c.id}: name="${c.name}", status=${c.status}, total=${c.totalRecipients}, sent=${c.sentCount}, failed=${c.failedCount}`);
    for (const r of c.broadcastRecipients) {
      console.log(`  Recipient ${r.id}: phone=${r.phone}, status=${r.status}, sentAt=${r.sentAt}, deliveredAt=${r.deliveredAt}, error=${r.error}`);
    }
  }

  console.log('\n=== 2. Checking WhatsApp Sessions for Company ===');
  const sessions = await prisma.whatsAppSession.findMany({
    where: { companyId: company.id }
  });
  for (const s of sessions) {
    console.log(`Session ${s.id}: name=${s.name}, status=${s.status}, provider=${s.provider}, phone=${s.phoneNumber}`);
    console.log('  Config:', {
      phoneNumberId: s.config?.phoneNumberId,
      wabaId: s.config?.wabaId,
      apiVersion: s.config?.apiVersion,
      hasToken: !!(s.config?.token || s.config?.accessToken || s.config?.systemUserToken)
    });
  }

  const activeSession = sessions.find(s => s.status === 'CONNECTED' || s.provider === 'meta_cloud');
  if (!activeSession) {
    console.log('No active Meta session!');
    return;
  }

  const token = activeSession.config?.systemUserToken || activeSession.config?.token || activeSession.config?.accessToken;
  const phoneNumberId = activeSession.config?.phoneNumberId;
  const wabaId = activeSession.config?.wabaId;

  console.log('\n=== 3. Querying Meta Graph API for Phone & WABA status ===');
  try {
    const phoneRes = await axios.get(`https://graph.facebook.com/v22.0/${phoneNumberId}`, {
      params: {
        fields: 'id,display_phone_number,verified_name,quality_rating,code_verification_status,status,messaging_limit_tier,account_mode,name_status',
        access_token: token
      }
    });
    console.log('Phone details:', phoneRes.data);
  } catch (err) {
    console.error('Phone query failed:', err.response?.data || err.message);
  }

  if (wabaId) {
    try {
      const wabaRes = await axios.get(`https://graph.facebook.com/v22.0/${wabaId}`, {
        params: {
          fields: 'id,name,currency,timezone_id,message_template_namespace,account_review_status,payment_method,primary_funding_id,purchase_order_number',
          access_token: token
        }
      });
      console.log('WABA details:', wabaRes.data);
    } catch (err) {
      console.error('WABA query failed:', err.response?.data || err.message);
    }
  }

  console.log('\n=== 4. Checking recent Message records in DB ===');
  const recentMsgs = await prisma.message.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  for (const m of recentMsgs) {
    console.log(`Msg ${m.id}: wamid=${m.externalId || m.metaMsgId}, status=${m.status}, to=${m.toPhone || m.recipientId}, error=${m.error || m.metadata?.error}`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const MetaCloudProvider = require('./services/whatsapp/providers/MetaCloudProvider');
const axios = require('axios');

async function checkPhone() {
  const session = await prisma.whatsAppSession.findFirst({
    where: { id: 'cms1o1o9u00imjucwqdih3lpj' }
  });

  const { apiVersion, accessToken, phoneNumberId } = MetaCloudProvider.resolveConfig(session);
  console.log('Using config:', { apiVersion, phoneNumberId, hasToken: !!accessToken });

  // 1. Check Phone Number details on Graph API
  try {
    const res = await axios.get(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        fields: 'id,display_phone_number,verified_name,quality_rating,code_verification_status,status,messaging_limit_tier'
      }
    });
    console.log('Phone details from Meta:', res.data);
  } catch (err) {
    console.error('Phone details error:', err.response?.data || err.message);
  }

  // 2. Check WABA details
  const sessionFull = await MetaCloudProvider.getSession('cms1o1o9u00imjucwqdih3lpj');
  const baseConfig = MetaCloudProvider.resolveBaseConfig(sessionFull);
  const wabaId = baseConfig.wabaId;
  console.log('WABA ID:', wabaId);
  if (wabaId) {
    try {
      const res = await axios.get(`https://graph.facebook.com/${apiVersion}/${wabaId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          fields: 'id,name,account_review_status,business_verification_status,currency,timezone_id,message_template_namespace'
        }
      });
      console.log('WABA details from Meta:', res.data);
    } catch (err) {
      console.error('WABA details error:', err.response?.data || err.message);
    }
  }

  // 3. Test sending a simple text or utility template to 201123087745
  // Also check if 201123087745 is a registered WhatsApp user
  try {
    const contactRes = await axios.post(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/contacts`, {
      blocking: 'wait',
      contacts: ['+201123087745'],
      force_check: true
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('Contacts check on Meta:', JSON.stringify(contactRes.data, null, 2));
  } catch (err) {
    console.error('Contacts check error:', err.response?.data || err.message);
  }
}

checkPhone().catch(console.error).finally(() => prisma.$disconnect());

const axios = require('/var/www/backend2/node_modules/axios');

async function test() {
  console.log('🧪 Testing Turbo Webhook Endpoints on localhost:5000...');
  
  const endpoints = [
    'http://localhost:3007/api/v1/turbo/webhook',
    'http://localhost:3007/api/v1/turbo-webhook/webhook',
    'http://localhost:3007/api/v1/shipments/webhook',
    'http://localhost:3007/api/v1/turbo-webhook'
  ];

  for (const url of endpoints) {
    try {
      const res = await axios.post(url, {
        order_number: 'TEST-ORDER-NONEXISTENT',
        status: '1'
      });
      console.log(`✅ [${res.status}] ${url} ->`, res.data);
    } catch (e) {
      console.log(`❌ [${e.response?.status || 'ERR'}] ${url} ->`, e.response?.data || e.message);
    }
  }
}

test();

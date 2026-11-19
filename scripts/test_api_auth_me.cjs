const dns = require('dns');
const https = require('https');

const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

function customLookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  resolver.resolve4(hostname, (err, addresses) => {
    if (err) return callback(err);
    if (!addresses || addresses.length === 0) {
      return callback(new Error('No address found for ' + hostname));
    }
    if (options && options.all) {
      return callback(null, addresses.map(addr => ({ address: addr, family: 4 })));
    }
    return callback(null, addresses[0], 4);
  });
}

function postJson(urlStr, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const body = JSON.stringify(data);
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      lookup: customLookup,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    }, res => {
      let resBody = '';
      res.on('data', d => resBody += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resBody), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resBody, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function postJsonWithToken(urlStr, token, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const body = JSON.stringify(data);
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      lookup: customLookup,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    }, res => {
      let resBody = '';
      res.on('data', d => resBody += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resBody), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resBody, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getJson(urlStr, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname + (url.search || ''),
      method: 'GET',
      lookup: customLookup,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    }, res => {
      let resBody = '';
      res.on('data', d => resBody += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resBody) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resBody });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('Logging in via API...');
  const res = await postJson('https://maxp.online/api/v1/auth/login', {
    email: 'tester@maxp.com',
    password: 'tester@maxp.com'
  });
  console.log('Login status:', res.status);
  const token = res.data?.data?.token;
  console.log('Token acquired:', Boolean(token));

  console.log('Fetching /api/v1/procurement/purchase-orders ...');
  const poRes = await getJson('https://maxp.online/api/v1/procurement/purchase-orders', token);
  console.log('PO status:', poRes.status);
  const firstId = poRes.data?.orders?.[0]?.id;
  console.log('Testing single PO fetch for ID:', firstId);

  const singlePo = await getJson(`https://maxp.online/api/v1/procurement/purchase-orders/${firstId}`, token);
  console.log('Single PO Status:', singlePo.status);
  const orderObj = singlePo.data?.order || singlePo.data;
  console.log('Testing creation of new Purchase Order via API...');
  const newPoPayload = {
    supplierId: 'cmvfa9f5m01b5jukuoulxb89e',
    orderDate: new Date().toISOString(),
    expectedDelivery: new Date(Date.now() + 86400000 * 3).toISOString(),
    items: [
      {
        itemName: 'قماش كتان درجة أولى',
        itemSku: 'FAB-LINEN-01',
        quantity: 10,
        unitPrice: 100,
        discountAmount: 50,
      },
      {
        itemName: 'خيوط حياكة تركية',
        itemSku: 'FAB-THREAD-02',
        quantity: 5,
        unitPrice: 50,
        discountAmount: 0,
      }
    ],
    // Subtotal: (10*100) + (5*50) = 1000 + 250 = 1250
    // Total item discounts: 50
    // Net items: 1250 - 50 = 1200
    // Tax 14%: 1200 * 0.14 = 168
    // Shipping: 82
    // Global discount: 50
    // Expected Total: 1200 + 168 + 82 - 50 = 1400
    taxRate: 14,
    shippingCost: 82,
    discountAmount: 50,
    notes: 'أمر توريد تجريبي رسمي لاختبار الحسابات والطباعة'
  };

  const createRes = await postJsonWithToken('https://maxp.online/api/v1/procurement/purchase-orders', token, newPoPayload);
  console.log('Create PO Status:', createRes.status);
  console.log('Create PO Body:', JSON.stringify(createRes.data, null, 2));
}

main().catch(console.error);

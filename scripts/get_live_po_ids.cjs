const https = require('https');

function request(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: '153.92.223.119',
      port: 443,
      path: '/api/v1' + path,
      method: method,
      rejectUnauthorized: false,
      headers: {
        'Host': 'maxp.online',
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

(async () => {
  const login = await request('/auth/login', 'POST', { email: 'tester@maxp.com', password: 'tester@maxp.com' });
  const token = login.json?.data?.token || login.json?.token;
  console.log('Token received:', !!token);

  const poList = await request('/procurement/purchase-orders', 'GET', null, token);
  console.log('PO status:', poList.status);
  const orders = poList.json?.orders || poList.json?.data || poList.json?.items || poList.json;
  console.log('Orders found:', Array.isArray(orders) ? orders.map(o => ({ id: o.id, number: o.orderNumber, status: o.status })) : orders);

  const invList = await request('/procurement/purchase-invoices', 'GET', null, token);
  console.log('Invoice status:', invList.status);
  const invoices = invList.json?.invoices || invList.json?.data || invList.json?.items || invList.json;
  console.log('Invoices found:', Array.isArray(invoices) ? invoices.map(i => ({ id: i.id, number: i.invoiceNumber, status: i.status })) : invoices);
})();

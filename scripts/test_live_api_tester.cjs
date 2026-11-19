const https = require('https');

function request(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'maxp.online',
      port: 443,
      path: '/api/v1' + path,
      method: method,
      headers: {
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
  console.log('1. Logging in as tester@maxp.com ...');
  const login = await request('/auth/login', 'POST', { email: 'tester@maxp.com', password: 'tester@maxp.com' });
  console.log('Login status:', login.status, 'Success:', !!login.json?.data?.token);

  const token = login.json?.data?.token;
  if (!token) {
    console.error('Failed to get token:', login);
    return;
  }

  console.log('2. Fetching /procurement/catalog-items ...');
  const catalog = await request('/procurement/catalog-items?limit=50', 'GET', null, token);
  console.log('Catalog status:', catalog.status);
  console.log('Total catalog items returned:', catalog.json?.items?.length);

  if (catalog.json?.items) {
    catalog.json.items.forEach((it, i) => {
      console.log(`[Item ${i+1}]: ${it.name} | Variant: ${it.variantName || 'None'} | SKU: ${it.sku} | Cost: ${it.cost} | Stock: ${it.stock} | Image: ${it.imageUrl}`);
    });
  }

  console.log('3. Fetching /procurement/suppliers ...');
  const suppliers = await request('/procurement/suppliers?limit=10', 'GET', null, token);
  console.log('Suppliers status:', suppliers.status, 'Count:', suppliers.json?.suppliers?.length);
})();

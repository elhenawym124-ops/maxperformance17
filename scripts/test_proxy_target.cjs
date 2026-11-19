const https = require('https');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXZoOHNmcG4wMW5janVyOXAxMDBoaGpuIiwiZW1haWwiOiJ0ZXN0ZXJAbWF4cC5jb20iLCJyb2xlIjoiQ09NUEFOWV9BRE1JTiIsImNvbXBhbnlJZCI6ImNtdXV4cmZwejA4Y2RqdTB3YXF3emZyZjAiLCJpYXQiOjE3OTI1NDAwMjksImV4cCI6MTc5MzE0NDgyOX0.9A_9kLvj4p00lb8wYGK6HH_1Uu6lME_lZkghw3e8wBg';

const options = {
  hostname: '153.92.223.119',
  port: 443,
  path: '/api/v1/products?limit=5',
  method: 'GET',
  rejectUnauthorized: false,
  headers: {
    'Host': 'maxp.online',
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'Node-Test'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    const parsed = JSON.parse(data);
    console.log('PRODUCTS FOUND:', (parsed.data || parsed.products || []).length);
    if (parsed.data && parsed.data[0]) {
      console.log('First product name:', parsed.data[0].name);
      console.log('First product variants count:', (parsed.data[0].productVariants || []).length);
    }
  });
});

req.on('error', (e) => {
  console.error('ERROR:', e.message);
});

req.end();

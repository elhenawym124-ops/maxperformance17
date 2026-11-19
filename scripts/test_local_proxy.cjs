const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXZoOHNmcG4wMW5janVyOXAxMDBoaGpuIiwiZW1haWwiOiJ0ZXN0ZXJAbWF4cC5jb20iLCJyb2xlIjoiQ09NUEFOWV9BRE1JTiIsImNvbXBhbnlJZCI6ImNtdXV4cmZwejA4Y2RqdTB3YXF3emZyZjAiLCJpYXQiOjE3OTI1NDAwMjksImV4cCI6MTc5MzE0NDgyOX0.9A_9kLvj4p00lb8wYGK6HH_1Uu6lME_lZkghw3e8wBg';

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/v1/products?limit=1',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('DATA:', data.substring(0, 200));
  });
});

req.on('error', (e) => {
  console.error('ERROR:', e.message);
});

req.end();

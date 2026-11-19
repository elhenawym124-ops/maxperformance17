const dns = require('dns');
const https = require('https');
const { execSync } = require('child_process');

const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

const token = execSync('C:\\Users\\mokhtar\\AppData\\Local\\Programs\\gh\\gh.exe auth token').toString().trim();

resolver.resolve4('api.github.com', (err, addrs) => {
  if (err || !addrs || !addrs.length) {
    console.error('DNS failed:', err);
    return;
  }
  const payload = JSON.stringify({
    ref: 'main',
    inputs: { force_rebuild_all: true }
  });

  const req = https.request({
    hostname: addrs[0],
    path: '/repos/elhenawym124-ops/maxperformance17/actions/workflows/deploy.yml/dispatches',
    method: 'POST',
    headers: {
      'Host': 'api.github.com',
      'User-Agent': 'Node-Agent',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    console.log('Dispatch status:', res.statusCode);
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => {
      if (raw) console.log('Response:', raw);
    });
  });
  req.on('error', (e) => console.error('Req error:', e.message));
  req.write(payload);
  req.end();
});

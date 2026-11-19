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
  const req = https.request({
    hostname: addrs[0],
    path: '/repos/elhenawym124-ops/maxperformance17/actions/runs?per_page=3',
    headers: {
      'Host': 'api.github.com',
      'User-Agent': 'Node-Agent',
      'Authorization': `Bearer ${token}`
    }
  }, (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(raw);
        (json.workflow_runs || []).forEach(r => {
          console.log(`[${r.status}] [${r.conclusion || 'running'}] ${r.id} - ${r.head_commit?.message?.split('\n')[0]}`);
        });
      } catch (e) {
        console.error('Parse error:', e.message);
      }
    });
  });
  req.on('error', (e) => console.error('Req error:', e.message));
  req.end();
});

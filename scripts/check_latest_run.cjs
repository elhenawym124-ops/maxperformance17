const https = require('https');
const { execSync } = require('child_process');
const dns = require('dns');

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
    callback(null, addresses[0], 4);
  });
}

let token = process.env.GITHUB_TOKEN;
if (!token) {
  try {
    token = execSync('C:\\Users\\mokhtar\\AppData\\Local\\Programs\\gh\\gh.exe auth token', { encoding: 'utf8' }).trim();
  } catch (e) {
    console.error('Failed to get token:', e.message);
  }
}

const req = https.get({
  hostname: 'api.github.com',
  path: '/repos/elhenawym124-ops/maxperformance17/actions/runs?per_page=5',
  lookup: customLookup,
  headers: {
    'User-Agent': 'NodeJS',
    'Authorization': 'token ' + token,
    'Accept': 'application/vnd.github.v3+json'
  }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    try {
      const data = JSON.parse(d);
      if (!data.workflow_runs) {
        console.log('No workflow runs found:', data);
        return;
      }
      console.log(data.workflow_runs.map(r => ({
        id: r.id,
        head_sha: r.head_sha.substring(0, 9),
        name: r.name,
        status: r.status,
        conclusion: r.conclusion,
        created_at: r.created_at
      })));
    } catch (e) {
      console.error('Parse error:', e);
    }
  });
});
req.on('error', err => console.error('Req error:', err));

const dns = require('dns');
const https = require('https');
const { execSync } = require('child_process');

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
    console.error('Failed to get gh token:', e.message);
  }
}

const runId = process.argv[2] || '39524147378';

const options = {
  hostname: 'api.github.com',
  path: `/repos/elhenawym124-ops/maxperformance17/actions/runs/${runId}/rerun-failed-jobs`,
  method: 'POST',
  lookup: customLookup,
  headers: {
    'User-Agent': 'NodeJS',
    'Authorization': 'token ' + token,
    'Accept': 'application/vnd.github.v3+json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`RERUN RESPONSE: ${res.statusCode} ${res.statusMessage}`);
    if (data) console.log(data);
  });
});

req.on('error', (err) => console.error('Error:', err.message));
req.end();

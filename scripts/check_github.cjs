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

const options = {
  hostname: 'api.github.com',
  path: '/repos/elhenawym124-ops/maxperformance17/actions/runs?per_page=10',
  lookup: customLookup,
  headers: {
    'User-Agent': 'NodeJS',
    'Authorization': 'token ' + token,
    'Accept': 'application/vnd.github.v3+json'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.workflow_runs) {
        console.log('Total runs:', json.total_count);
        json.workflow_runs.forEach(r => {
          console.log(`[ID: ${r.id}] ${r.name} | Status: ${r.status} | Conclusion: ${r.conclusion} | Branch: ${r.head_branch} | SHA: ${r.head_sha.slice(0, 9)} | Title: ${r.head_commit ? r.head_commit.message.split('\n')[0].slice(0, 60) : ''} | URL: ${r.html_url}`);
        });
      } else {
        console.log(json);
      }
    } catch(e) {
      console.error(e, data.slice(0, 300));
    }
  });
}).on('error', err => console.error('Request error:', err));

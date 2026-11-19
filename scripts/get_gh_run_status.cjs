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

// Get repo name from git remote
let repo = 'elhenawym124-ops/maxperformance17';

console.log('Repo:', repo);

const options = {
  hostname: 'api.github.com',
  path: `/repos/${repo}/actions/runs?per_page=3`,
  lookup: customLookup,
  headers: {
    'User-Agent': 'NodeJS',
    ...(token ? { 'Authorization': 'token ' + token } : {}),
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
        for (const run of json.workflow_runs) {
          console.log(`Run #${run.id}: ${run.name} | Status: ${run.status} | Conclusion: ${run.conclusion} | Commit: ${run.head_sha.slice(0, 9)} - "${run.head_commit?.message?.slice(0, 50)}"`);
        }
      } else {
        console.log('Response:', data.slice(0, 300));
      }
    } catch (e) {
      console.error('Parse error:', e.message, data.slice(0, 200));
    }
  });
}).on('error', err => {
  console.error('HTTP error:', err.message);
});

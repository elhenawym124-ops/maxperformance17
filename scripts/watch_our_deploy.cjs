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

const runId = '40072161884';
const repo = 'elhenawym124-ops/maxperformance17';

function checkRun() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${repo}/actions/runs/${runId}`,
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
          resolve(json);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

(async () => {
  for (let i = 0; i < 30; i++) {
    const run = await checkRun();
    if (run) {
      console.log(`[${new Date().toLocaleTimeString()}] Status: ${run.status} | Conclusion: ${run.conclusion}`);
      if (run.status === 'completed') {
        if (run.conclusion === 'success') {
          console.log('🚀 Workflow completed successfully!');
          process.exit(0);
        } else {
          console.error('❌ Workflow failed with conclusion:', run.conclusion);
          process.exit(1);
        }
      }
    }
    await new Promise(r => setTimeout(r, 8000));
  }
  console.log('Timeout waiting for workflow.');
})();

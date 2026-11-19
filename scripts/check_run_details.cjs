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

const runId = '40086706803';
const repo = 'elhenawym124-ops/maxperformance17';

const options = {
  hostname: 'api.github.com',
  path: `/repos/${repo}/actions/runs/${runId}/jobs`,
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
      for (const job of json.jobs || []) {
        console.log(`Job: ${job.name} -> ${job.status} (${job.conclusion})`);
        for (const step of job.steps || []) {
          console.log(`   Step: ${step.name} -> ${step.status} (${step.conclusion})`);
        }
      }
    } catch (e) {
      console.error(e.message);
    }
  });
});

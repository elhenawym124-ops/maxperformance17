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

const jobId = process.argv[2] || '132273750731';

function fetchUrl(url, cb, isRedirect = false) {
  const parsed = new URL(url);
  const headers = {
    'User-Agent': 'NodeJS',
  };
  if (!isRedirect && token) {
    headers['Authorization'] = 'token ' + token;
  }
  const options = {
    hostname: parsed.hostname,
    path: parsed.pathname + parsed.search,
    lookup: customLookup,
    headers,
  };
  https.get(options, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      fetchUrl(res.headers.location, cb, true);
    } else {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => cb(d));
    }
  }).on('error', err => console.error(err));
}

fetchUrl(`https://api.github.com/repos/elhenawym124-ops/maxperformance17/actions/jobs/${jobId}/logs`, logs => {
  const lines = logs.split('\n');
  const errLines = lines.filter(l => l.includes('error') || l.includes('Error') || l.includes('FAIL') || l.includes('vite v'));
  console.log('--- RELEVANT LINES ---');
  console.log(lines.slice(-40).join('\n'));
});

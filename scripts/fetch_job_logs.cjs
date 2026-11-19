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

const jobId = process.argv[2] || '118968929865';

function fetchUrl(url, isRedirect = false) {
  const parsed = new URL(url);
  const headers = {
    'User-Agent': 'NodeJS',
  };
  if (!isRedirect) {
    headers['Authorization'] = 'token ' + token;
    headers['Accept'] = 'application/vnd.github.v3+json';
  }
  const options = {
    hostname: parsed.hostname,
    path: parsed.pathname + parsed.search,
    lookup: customLookup,
    headers: headers
  };

  https.get(options, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      // Follow redirect without Auth header
      fetchUrl(res.headers.location, true);
      return;
    }
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(data.slice(-4000)); // Print last 4000 chars of logs
    });
  }).on('error', err => console.error('Error:', err.message));
}

fetchUrl(`https://api.github.com/repos/elhenawym124-ops/maxperformance17/actions/jobs/${jobId}/logs`);

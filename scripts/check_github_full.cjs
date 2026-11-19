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

function get(path, cb) {
  const options = {
    hostname: 'api.github.com',
    path: path,
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
        cb(null, JSON.parse(data));
      } catch (e) {
        cb(e, data);
      }
    });
  }).on('error', cb);
}

// Check open PRs
get('/repos/elhenawym124-ops/maxperformance17/pulls?state=open', (err, prs) => {
  if (err) console.error('PR error:', err);
  else {
    console.log(`\n=== Open Pull Requests (${prs.length}) ===`);
    prs.forEach(p => console.log(`#${p.number} ${p.title} (${p.head.ref} -> ${p.base.ref})`));
  }

  // Check recent runs across all workflows
  get('/repos/elhenawym124-ops/maxperformance17/actions/runs?per_page=5', (err, runs) => {
    if (err) console.error('Runs error:', err);
    else {
      console.log(`\n=== Recent Actions Runs ===`);
      runs.workflow_runs.forEach(r => {
        console.log(`[${r.id}] ${r.name} | ${r.status} | ${r.conclusion} | ${r.head_branch} | ${r.head_sha.slice(0, 7)}`);
      });
    }
  });
});

const dns = require('dns');
const https = require('https');

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

https.get('https://swan.maxp.online/shop', { lookup: customLookup, headers: { 'Cache-Control': 'no-cache', 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const matches = data.match(/src="\/assets\/[^"]+"/g);
    console.log('Scripts:', matches);
  });
});

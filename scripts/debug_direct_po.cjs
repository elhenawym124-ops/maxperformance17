const { chromium } = require('playwright');
const path = require('path');
const dns = require('dns');
const https = require('https');

const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

function customLookup(hostname, options, callback) {
  if (typeof options === 'function') { callback = options; options = {}; }
  resolver.resolve4(hostname, (err, addresses) => {
    if (err) return callback(err);
    if (!addresses || addresses.length === 0) return callback(new Error('No address found'));
    if (options && options.all) return callback(null, addresses.map(addr => ({ address: addr, family: 4 })));
    return callback(null, addresses[0], 4);
  });
}

function postJson(urlStr, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const body = JSON.stringify(data);
    const req = https.request({
      hostname: url.hostname, port: 443, path: url.pathname, method: 'POST',
      lookup: customLookup,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(b || '{}') }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  const loginRes = await postJson('https://maxp.online/api/v1/auth/login', {
    email: 'tester@maxp.com',
    password: 'tester@maxp.com'
  });
  const token = loginRes.data?.data?.token;
  const user = loginRes.data?.data?.user;

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu',
      '--host-resolver-rules=MAP maxp.online 104.21.52.106, MAP *.maxp.online 104.21.52.106',
      '--ignore-certificate-errors', '--disable-features=DnsOverHttps'
    ]
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(({ token, user }) => {
    window.localStorage.setItem('token', token);
    window.localStorage.setItem('accessToken', token);
    window.localStorage.setItem('user', JSON.stringify(user));
  }, { token, user });

  const page = await context.newPage();
  page.on('console', msg => console.log(`[CONSOLE ${msg.type()}]:`, msg.text().slice(0, 200)));

  const targetOrderId = 'cmvldzlkq007xju9ss348z8zv';
  await page.goto(`https://maxp.online/procurement/purchase-orders/${targetOrderId}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  console.log('Final URL:', page.url());
  const bodyText = await page.innerText('body');
  console.log('Body Text Snippet:\n', bodyText.slice(0, 500).replace(/\n+/g, ' '));

  await page.screenshot({ path: 'screenshots/debug_direct_po.png', fullPage: true });
  console.log('Screenshot saved to screenshots/debug_direct_po.png');

  await browser.close();
})();

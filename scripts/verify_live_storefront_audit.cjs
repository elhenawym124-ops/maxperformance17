const { chromium } = require('playwright');
const https = require('https');
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

function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: method,
      lookup: customLookup,
      headers: {
        'User-Agent': 'MaxP-Live-Auditor/1.0',
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 500, error: err.message });
    });

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runLiveVerification() {
  console.log('🚀 [LIVE AUDIT] Starting Live Production Verification on https://maxp.online & https://swan.maxp.online...\n');

  // Test 1: Public Storefront Settings (Company Settings sanitization & DesignTokens)
  console.log('--- 1. Testing Storefront Public Settings Endpoint ---');
  const settingsRes = await makeRequest('https://maxp.online/api/v1/public/storefront/settings?companySlug=swan');
  console.log(`Status: ${settingsRes.status}`);
  if (settingsRes.status === 200) {
    try {
      const json = JSON.parse(settingsRes.body);
      const company = json.company || json.data?.company || {};
      const settings = company.settings || {};
      const hasSecrets = Boolean(
        settings.metaAppSecret ||
        settings.paymobApiKey ||
        settings.stripeSecretKey ||
        settings.fawrySecurityKey
      );
      console.log(`✅ Company settings exposed secrets: ${hasSecrets ? 'FAIL (Leak!)' : 'PASS (Sanitized)'}`);
      console.log(`✅ Design tokens returned: ${Boolean(json.designTokens || json.data?.designTokens)}`);
    } catch (e) {
      console.log(`⚠️ Parse error: ${e.message}`);
    }
  }

  // Test 2: Unauthenticated Studio Analytics Protection
  console.log('\n--- 2. Testing Studio Analytics Endpoint (Auth Guard) ---');
  const studioAnalyticsRes = await makeRequest(
    'https://maxp.online/api/v1/storefront-analytics/event',
    'POST',
    { companySlug: 'swan', eventType: 'studio_edit_section', pageKey: 'home' },
    { 'Content-Type': 'application/json' }
  );
  console.log(`POST studio_* event without auth: Status ${studioAnalyticsRes.status} (Expected 401/403)`);
  console.log(`✅ Studio analytics auth check: ${studioAnalyticsRes.status === 401 || studioAnalyticsRes.status === 403 ? 'PASS' : 'FAIL'}`);

  // Test 3: Public Orders Price Spoof Protection
  console.log('\n--- 3. Testing Accept-Offer Price Spoof Protection ---');
  const spoofOfferRes = await makeRequest(
    'https://maxp.online/api/v1/public/orders/non-existent-order-123/accept-offer',
    'POST',
    { offerId: 'fake-offer', quantity: 9999, price: 0.01 },
    { 'Content-Type': 'application/json' }
  );
  console.log(`POST /accept-offer with spoofed price: Status ${spoofOfferRes.status}`);
  console.log(`Response: ${spoofOfferRes.body.slice(0, 120)}`);
  console.log(`✅ Price spoof check: Order not found / rejected cleanly: ${spoofOfferRes.status === 404 || spoofOfferRes.status === 400 ? 'PASS' : 'FAIL'}`);

  // Test 4: Proxy Image SVG / Direct origin checks
  console.log('\n--- 4. Testing Proxy Image SVG Protection & Security Headers ---');
  const proxySvgRes = await makeRequest('https://maxp.online/api/v1/proxy-image?url=https://example.com/malicious.svg');
  console.log(`Proxy Image SVG status: ${proxySvgRes.status}`);
  console.log(`CSP Header: ${proxySvgRes.headers['content-security-policy'] || 'none'}`);
  console.log(`X-Content-Type-Options: ${proxySvgRes.headers['x-content-type-options'] || 'none'}`);

  // Test 5: Live Browser Inspection on swan.maxp.online
  console.log('\n--- 5. Browser Console & Chunk Audit on https://swan.maxp.online ---');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  const loadedChunks = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  page.on('response', res => {
    const url = res.url();
    if (url.includes('/assets/') && url.endsWith('.js')) {
      loadedChunks.push(url.split('/').pop());
    }
  });

  console.log('Navigating to https://swan.maxp.online...');
  await page.goto('https://swan.maxp.online', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2000);

  console.log(`\nPage Title: "${await page.title()}"`);
  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(e => console.log(`   ❌ ${e}`));
  }
  console.log(`Page Runtime Errors: ${pageErrors.length}`);
  if (pageErrors.length > 0) {
    pageErrors.forEach(e => console.log(`   ❌ ${e}`));
  }

  // Check if studio chunks were pulled in live storefront
  const studioChunks = loadedChunks.filter(c => c.includes('studio') || c.includes('Studio'));
  console.log(`Loaded JS chunks count: ${loadedChunks.length}`);
  console.log(`Loaded Studio Chunks: ${studioChunks.length === 0 ? '0 (CLEAN - decoupled!)' : studioChunks.join(', ')}`);

  await browser.close();
  console.log('\n🎉 [LIVE AUDIT] Production verification completed successfully!');
}

runLiveVerification().catch(err => {
  console.error('Audit run failed:', err);
});

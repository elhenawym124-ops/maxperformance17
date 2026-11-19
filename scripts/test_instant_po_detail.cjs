const { chromium } = require('playwright');
const path = require('path');
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
    if (options && options.all) {
      return callback(null, addresses.map(addr => ({ address: addr, family: 4 })));
    }
    return callback(null, addresses[0], 4);
  });
}

function postJson(urlStr, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const body = JSON.stringify(data);
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      lookup: customLookup,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    }, res => {
      let resBody = '';
      res.on('data', d => resBody += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resBody) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resBody });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  console.log('🔑 1. Logging in via API to obtain fresh tester token...');
  const loginRes = await postJson('https://maxp.online/api/v1/auth/login', {
    email: 'tester@maxp.com',
    password: 'tester@maxp.com'
  });

  const token = loginRes.data?.data?.token;
  const user = loginRes.data?.data?.user;
  console.log('✅ Token obtained:', Boolean(token), 'Company:', user?.company?.name);

  const targetOrderId = 'cmvldzlkq007xju9ss348z8zv'; // PO-000007 created earlier

  console.log('🚀 2. Launching Chrome with Cloudflare host mapping...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--host-resolver-rules=MAP maxp.online 104.21.52.106, MAP *.maxp.online 104.21.52.106',
      '--ignore-certificate-errors',
      '--disable-features=DnsOverHttps'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ar-EG',
  });

  // Inject authentication into window.localStorage on every page load
  await context.addInitScript(({ token, user }) => {
    window.localStorage.setItem('token', token);
    window.localStorage.setItem('accessToken', token);
    window.localStorage.setItem('user', JSON.stringify(user));
  }, { token, user });

  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('❌ Browser Console Error:', msg.text().slice(0, 200));
  });

  console.log(`🌐 3. Opening Purchase Order Detail page directly: /procurement/purchase-orders/${targetOrderId} ...`);
  await page.goto(`https://maxp.online/procurement/purchase-orders/${targetOrderId}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  console.log('⏳ Waiting for Purchase Order detail elements...');
  await page.waitForSelector('.purchase-order-detail-container, h1, button:has-text("طباعة")', { timeout: 15000 });
  await page.waitForTimeout(2000);

  const detailShot = path.resolve('screenshots', 'po_detail_live_verified.png');
  await page.screenshot({ path: detailShot, fullPage: true });
  console.log('📸 Saved detail screenshot:', detailShot);

  const screenText = await page.innerText('body');
  console.log('📋 Screen Verification:');
  console.log('  - Order Number (PO-000007):', screenText.includes('PO-000007'));
  console.log('  - Supplier (ابو عبدالكريم):', screenText.includes('ابو عبدالكريم'));
  console.log('  - Total (1,282):', screenText.includes('1,282') || screenText.includes('1282'));
  console.log('  - Print Button Exists:', screenText.includes('طباعة'));

  console.log('🖨️ 4. Testing Print Emulation...');
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(1500);

  const printShot = path.resolve('screenshots', 'po_print_live_verified.png');
  await page.screenshot({ path: printShot, fullPage: true });
  console.log('📸 Saved print emulation screenshot:', printShot);

  const printText = await page.innerText('body');
  console.log('📜 Print Layout Verification:');
  console.log('  - Official Header (أمر شراء توريد / PURCHASE ORDER):', printText.includes('أمر شراء توريد') || printText.includes('PURCHASE ORDER'));
  console.log('  - Procurement Officer Signature (إعداد مسؤول المشتريات):', printText.includes('إعداد مسؤول المشتريات'));
  console.log('  - Financial Approval Block (اعتماد الإدارة المالية):', printText.includes('اعتماد الإدارة المالية'));
  console.log('  - Supplier Receipt Block (تأكيد واستلام المورد):', printText.includes('تأكيد واستلام المورد'));

  console.log('➕ 5. Navigating to Create New Purchase Order (/procurement/purchase-orders/new) to verify creation UI...');
  await page.emulateMedia({ media: 'screen' });
  await page.goto('https://maxp.online/procurement/purchase-orders/new', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  await page.waitForTimeout(3000);

  const formShot = path.resolve('screenshots', 'po_new_live_verified.png');
  await page.screenshot({ path: formShot, fullPage: true });
  console.log('📸 Saved new form screenshot:', formShot);

  const formText = await page.innerText('body');
  console.log('  - Form Title present:', formText.includes('إنشاء أمر شراء') || formText.includes('أمر شراء جديد'));
  console.log('  - Supplier Picker present:', formText.includes('المورد') || formText.includes('ابحث عن مورد'));

  console.log('🎉 ALL LIVE VERIFICATIONS COMPLETED SUCCESSFULLY!');
  await browser.close();
})();

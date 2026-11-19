const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const screenshotsDir = path.resolve('screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('🚀 [TEST] Launching browser for tester@maxp.com verification...');

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

  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Browser Console Error:', msg.text().slice(0, 300));
    }
  });

  page.on('pageerror', err => {
    console.log('❌ Browser Page Uncaught Error:', err.message);
  });

  const BASE_URL = 'https://maxp.online';

  console.log('🌐 1. Navigating to Login...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'tester@maxp.com');
  await page.fill('input[type="password"]', 'tester@maxp.com');
  await page.click('button[type="submit"]');

  console.log('⏳ 2. Waiting for /apps ...');
  await page.waitForURL('**/apps**', { timeout: 20000 });
  console.log('✅ Landed on /apps:', page.url());
  await page.waitForTimeout(2000);

  console.log('📦 3. Navigating to /procurement/purchase-orders ...');
  // Use client-side navigation or direct goto with networkidle/domcontentloaded
  await page.goto(`${BASE_URL}/procurement/purchase-orders`, { waitUntil: 'domcontentloaded' });
  
  // Wait for React to render the Procurement component
  console.log('⏳ Waiting for Purchase Orders UI...');
  try {
    await page.waitForSelector('button:has-text("أمر شراء جديد"), h1, table', { timeout: 15000 });
    console.log('✅ Procurement UI elements loaded successfully!');
  } catch (e) {
    console.log('⚠️ Timed out waiting for specific selector, inspecting body...');
  }

  await page.waitForTimeout(3000);
  const listShot = path.join(screenshotsDir, 'live_tester_po_list.png');
  await page.screenshot({ path: listShot, fullPage: true });
  console.log('📸 Saved list screenshot:', listShot);

  const bodySnippet = await page.innerText('body');
  console.log('📄 Body Text Snippet:\n', bodySnippet.slice(0, 400).replace(/\n+/g, ' '));

  console.log('➕ 4. Navigating to Create New Purchase Order (/procurement/purchase-orders/new)...');
  const createBtn = await page.$('button:has-text("أمر شراء جديد")');
  if (createBtn) {
    await createBtn.click();
  } else {
    await page.goto(`${BASE_URL}/procurement/purchase-orders/new`, { waitUntil: 'domcontentloaded' });
  }

  await page.waitForTimeout(3000);
  const formShot = path.join(screenshotsDir, 'live_tester_po_form.png');
  await page.screenshot({ path: formShot, fullPage: true });
  console.log('📸 Saved form screenshot:', formShot);

  console.log('🔍 5. Selecting supplier and adding item...');
  // Check supplier combobox
  const supplierBox = await page.$('input[placeholder*="مورد"], div:has-text("اختر المورد"), button:has-text("اختر المورد")');
  if (supplierBox) {
    console.log('Found supplier element, clicking...');
    await supplierBox.click();
    await page.waitForTimeout(1000);
  }

  console.log('🖨️ 6. Checking Print functionality on real PO (PO-000007: cmvldzlkq007xju9ss348z8zv)...');
  const targetPoId = 'cmvldzlkq007xju9ss348z8zv';
  await page.goto(`${BASE_URL}/procurement/purchase-orders/${targetPoId}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const detailShot = path.join(screenshotsDir, 'live_tester_po_detail.png');
  await page.screenshot({ path: detailShot, fullPage: true });
  console.log('📸 Saved detail screenshot:', detailShot);

  const detailText = await page.innerText('body');
  console.log('  - Has Order Number PO-000007:', detailText.includes('PO-000007'));
  console.log('  - Has Supplier Name (ابو عبدالكريم):', detailText.includes('ابو عبدالكريم'));
  console.log('  - Has Total (1,282):', detailText.includes('1,282') || detailText.includes('1282'));

  // Emulate print media query
  console.log('🖨️ Emulating print media...');
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(1500);

  const printShot = path.join(screenshotsDir, 'live_tester_po_print.png');
  await page.screenshot({ path: printShot, fullPage: true });
  console.log('📸 Saved print emulation screenshot:', printShot);

  const printText = await page.innerText('body');
  const hasHeader = printText.includes('أمر شراء') || printText.includes('PURCHASE ORDER');
  const hasSignatures = printText.includes('إعداد مسؤول المشتريات') && printText.includes('اعتماد الإدارة المالية');
  const hasSupplierConfirm = printText.includes('تأكيد واستلام المورد');
  console.log('📜 Printout verification:', { hasHeader, hasSignatures, hasSupplierConfirm });

  console.log('🎉 Done testing!');
  await browser.close();
})();

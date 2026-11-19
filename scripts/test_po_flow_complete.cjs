const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const screenshotsDir = path.resolve('screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('🚀 [TEST] Complete Purchase Order & Print Verification for tester@maxp.com');

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--host-rules=MAP maxp.online 104.21.52.106, MAP *.maxp.online 104.21.52.106',
      '--ignore-certificate-errors'
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
    console.log('❌ Browser Page Error:', err.message);
  });

  const BASE_URL = 'https://maxp.online';

  console.log('🌐 1. Logging in with tester@maxp.com...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'tester@maxp.com');
  await page.fill('input[type="password"]', 'tester@maxp.com');
  await page.click('button[type="submit"]');

  console.log('⏳ 2. Waiting for /apps ...');
  await page.waitForURL('**/apps**', { timeout: 20000 });
  console.log('✅ Landed on /apps:', page.url());

  console.log('📦 3. Navigating to /procurement/purchase-orders ...');
  await page.goto(`${BASE_URL}/procurement/purchase-orders`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button:has-text("أمر شراء جديد")', { timeout: 15000 });
  console.log('✅ Purchase orders list loaded!');

  // Look for View Details (Eye) button in the first row
  console.log('👁️ 4. Clicking View Details button on the first order...');
  const viewDetailsBtn = await page.$('table tbody tr:first-child button:has(svg.lucide-eye), button[title*="تفاصيل"]');
  if (viewDetailsBtn) {
    await viewDetailsBtn.click();
    console.log('Clicked Eye button, waiting for detail page...');
    await page.waitForTimeout(3000);
    console.log('Current URL:', page.url());

    const detailShot = path.join(screenshotsDir, 'live_po_detail_screen.png');
    await page.screenshot({ path: detailShot, fullPage: true });
    console.log('📸 Saved detail screenshot:', detailShot);

    // Verify detail screen content
    const detailText = await page.innerText('body');
    console.log('📄 Detail Page Snippet:\n', detailText.slice(0, 500).replace(/\n+/g, ' '));

    // Verify print button
    const printBtn = await page.$('button:has-text("طباعة")');
    console.log('🖨️ Print button exists:', Boolean(printBtn));

    // Emulate print media
    console.log('🖨️ 5. Emulating print media...');
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(1500);

    const printShot = path.join(screenshotsDir, 'live_po_print_emulated.png');
    await page.screenshot({ path: printShot, fullPage: true });
    console.log('📸 Saved print emulation screenshot:', printShot);

    const printText = await page.innerText('body');
    const hasHeader = printText.includes('أمر شراء') || printText.includes('PURCHASE ORDER');
    const hasSignatures = printText.includes('إعداد مسؤول المشتريات') && printText.includes('اعتماد الإدارة المالية');
    const hasItemsTable = printText.includes('الصنف') || printText.includes('الكمية');

    console.log('📋 Print Verification Results:');
    console.log('  - Header present:', hasHeader);
    console.log('  - Signatures present:', hasSignatures);
    console.log('  - Items table present:', hasItemsTable);
  } else {
    console.log('⚠️ Could not find Eye button in table!');
  }

  console.log('🎉 Test finished!');
  await browser.close();
})();

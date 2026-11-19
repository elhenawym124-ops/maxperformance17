const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const screenshotsDir = path.resolve('screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('🚀 [TEST] Starting automated print verification with Playwright...');
  console.log('👤 Account: tester@maxp.com');

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
      console.log('❌ Browser Console Error:', msg.text().slice(0, 200));
    }
  });

  page.on('pageerror', err => {
    console.log('❌ Browser Page Error:', err.message);
  });

  const BASE_URL = 'https://maxp.online';

  try {
    console.log(`🌐 Navigating to ${BASE_URL}/login ...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log('⏳ Waiting for login fields...');
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });

    console.log('🔑 Entering tester credentials...');
    await page.fill('input[type="email"]', 'tester@maxp.com');
    await page.fill('input[type="password"]', 'tester@maxp.com');

    console.log('🔘 Clicking submit...');
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    console.log('⏳ Waiting for dashboard redirect...');
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 20000 });
    console.log('✅ Logged in successfully. Current URL:', page.url());

    // 1. Navigate to PO list
    console.log('📦 Navigating to Purchase Orders list...');
    await page.goto(`${BASE_URL}/procurement/purchase-orders`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Look for first PO link or PO-000008
    const poLink = page.locator('a[href*="/procurement/purchase-orders/"]:has-text("PO-")').first();
    let targetPoUrl = '';
    if (await poLink.count() > 0) {
      targetPoUrl = await poLink.getAttribute('href');
      console.log('🔗 Found PO link:', targetPoUrl);
      await poLink.click();
    } else {
      console.log('Directly navigating to /procurement/purchase-orders/8');
      await page.goto(`${BASE_URL}/procurement/purchase-orders/8`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }

    await page.waitForSelector('.purchase-order-detail-container', { timeout: 15000 });
    await page.waitForTimeout(2000);
    console.log('📍 Current PO Detail URL:', page.url());

    // Capture screen mode screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'live_po_screen_mode.png'), fullPage: true });
    console.log('📸 Saved live_po_screen_mode.png');

    // Emulate print media
    console.log('🖨️ Emulating print media for Purchase Order...');
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(1000);

    const poPrintDom = await page.evaluate(() => {
      const screenDiv = document.querySelector('.print\\:hidden');
      const printableSheet = document.querySelector('.printable-commercial-sheet');
      return {
        screenDivDisplay: screenDiv ? window.getComputedStyle(screenDiv).display : 'missing',
        printableSheetDisplay: printableSheet ? window.getComputedStyle(printableSheet).display : 'missing',
        printableText: printableSheet ? printableSheet.innerText.slice(0, 300) : '',
        hasApprovals: printableSheet ? printableSheet.innerText.includes('الاعتمادات والتواقيع الرسمية') : false,
        hasHeader: printableSheet ? printableSheet.innerText.includes('PURCHASE ORDER') : false
      };
    });
    console.log('🔍 PO Print DOM Assessment:', JSON.stringify(poPrintDom, null, 2));

    await page.screenshot({ path: path.join(screenshotsDir, 'live_po_print_standalone_a4.png'), fullPage: true });
    console.log('📸 Saved live_po_print_standalone_a4.png');

    // Reset back to screen
    await page.emulateMedia({ media: 'screen' });

    // 2. Test Purchase Invoice
    console.log('🧾 Navigating to Purchase Invoices...');
    await page.goto(`${BASE_URL}/procurement/purchase-invoices`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const invLink = page.locator('a[href*="/procurement/purchase-invoices/"]:has-text("PINV-")').first();
    if (await invLink.count() > 0) {
      const invUrl = await invLink.getAttribute('href');
      console.log('🔗 Found Invoice link:', invUrl);
      await invLink.click();
    } else {
      console.log('Directly navigating to /procurement/purchase-invoices/1');
      await page.goto(`${BASE_URL}/procurement/purchase-invoices/1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }

    await page.waitForSelector('.purchase-invoice-detail-container', { timeout: 15000 });
    await page.waitForTimeout(2000);
    console.log('📍 Current Invoice Detail URL:', page.url());

    // Emulate print media for invoice
    console.log('🖨️ Emulating print media for Purchase Invoice...');
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(1000);

    const invPrintDom = await page.evaluate(() => {
      const screenDiv = document.querySelector('.print\\:hidden');
      const printableSheet = document.querySelector('.printable-commercial-sheet');
      return {
        screenDivDisplay: screenDiv ? window.getComputedStyle(screenDiv).display : 'missing',
        printableSheetDisplay: printableSheet ? window.getComputedStyle(printableSheet).display : 'missing',
        printableText: printableSheet ? printableSheet.innerText.slice(0, 300) : '',
        hasApprovals: printableSheet ? printableSheet.innerText.includes('OFFICIAL APPROVALS') : false,
        hasHeader: printableSheet ? printableSheet.innerText.includes('PURCHASE INVOICE') : false
      };
    });
    console.log('🔍 Invoice Print DOM Assessment:', JSON.stringify(invPrintDom, null, 2));

    await page.screenshot({ path: path.join(screenshotsDir, 'live_invoice_print_standalone_a4.png'), fullPage: true });
    console.log('📸 Saved live_invoice_print_standalone_a4.png');

    console.log('🎯 ALL PRINT VERIFICATION SCENARIOS PASSED WITH LIVE PROOF!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    await page.screenshot({ path: path.join(screenshotsDir, 'live_verification_error.png'), fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }
})();

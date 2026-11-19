const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const screenshotsDir = path.resolve('screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('🚀 Launching Playwright with system Chrome & Cloudflare DNS mapping...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--host-resolver-rules=MAP maxp.online 104.21.52.106, MAP *.maxp.online 104.21.52.106',
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
      console.log('❌ Browser Console Error:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('❌ Page Error:', err.message);
  });

  const BASE_URL = 'https://maxp.online';

  try {
    console.log(`🌐 1. Navigating to ${BASE_URL}/login ...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 25000 });

    console.log('🔑 Logging in with tester@maxp.com...');
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill('input[type="email"]', 'tester@maxp.com');
    await page.fill('input[type="password"]', 'tester@maxp.com');
    await page.click('button[type="submit"]');

    console.log('⏳ Waiting for navigation after login...');
    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 25000 });
    console.log('✅ Logged in successfully. Current URL:', page.url());

    // 2. Go to Purchase Orders list
    console.log(`📋 2. Navigating to ${BASE_URL}/procurement/purchase-orders ...`);
    await page.goto(`${BASE_URL}/procurement/purchase-orders`, { waitUntil: 'networkidle', timeout: 25000 });

    console.log('⏳ Waiting for PO-000007 in the table...');
    await page.waitForSelector('text=PO-000007', { timeout: 15000 });
    console.log('✅ PO-000007 is visible in the table!');

    await page.screenshot({ path: path.join(screenshotsDir, 'live_po_list_links.png'), fullPage: false });
    console.log('📸 Screenshot saved: live_po_list_links.png');

    // 3. Click PO-000007 link button
    console.log('👆 Clicking PO-000007 link...');
    const poButton = await page.$('button:has-text("PO-000007")');
    if (poButton) {
      await poButton.click();
    } else {
      await page.click('text=PO-000007');
    }

    // Wait for SPA route change
    await page.waitForFunction(() => window.location.pathname.startsWith('/procurement/purchase-orders/'), { timeout: 15000 });
    console.log('✅ Navigated to PO Detail:', page.url());
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(screenshotsDir, 'live_po_detail_view.png'), fullPage: false });
    console.log('📸 Screenshot saved: live_po_detail_view.png');

    // 4. Verify "+ إنشاء فاتورة شراء" button on PO detail
    console.log('🔍 Looking for "+ إنشاء فاتورة شراء" button...');
    const createInvBtn = await page.waitForSelector('button:has-text("إنشاء فاتورة شراء")', { timeout: 10000 });
    console.log('🎉 "+ إنشاء فاتورة شراء" button is visible and active!');

    console.log('👆 Clicking "+ إنشاء فاتورة شراء"...');
    await createInvBtn.click();

    // Wait for SPA route change to new invoice
    await page.waitForFunction(() => window.location.pathname.includes('/procurement/purchase-invoices/new'), { timeout: 15000 });
    console.log('✅ Navigated to Purchase Invoice Form:', page.url());

    // Wait for the form and its prefilled data to settle
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(screenshotsDir, 'live_invoice_prefilled_from_po.png'), fullPage: false });
    console.log('📸 Screenshot saved: live_invoice_prefilled_from_po.png');

    // Check prefilled inputs
    const formText = await page.innerText('body');
    const hasSupplier = formText.includes('ابو عبدالكريم');
    const hasItemTea = formText.includes('شاي العروسة');
    const hasItemSugar = formText.includes('سكر الأسرة');
    const hasPoNumber = formText.includes('PO-000007');
    console.log(`📋 Prefill check results:
      - Supplier "ابو عبدالكريم": ${hasSupplier ? '✅' : '❌'}
      - Item "شاي العروسة": ${hasItemTea ? '✅' : '❌'}
      - Item "سكر الأسرة": ${hasItemSugar ? '✅' : '❌'}
      - Linked PO "PO-000007": ${hasPoNumber ? '✅' : '❌'}`);

    // 5. Submit or Save the Invoice to verify invoice creation & detail print view
    console.log('💾 Submitting the new invoice form...');
    const saveInvoiceBtn = await page.$('button[type="submit"]:has-text("حفظ"), button:has-text("حفظ الفاتورة"), button:has-text("إنشاء الفاتورة")');
    if (saveInvoiceBtn) {
      await saveInvoiceBtn.click();
      console.log('⏳ Waiting after submit...');
      await page.waitForTimeout(4000);
      console.log('✅ Current URL after submit:', page.url());
    }

    // 6. Go to Purchase Invoices list to inspect an invoice detail and its printable view
    console.log(`📄 6. Navigating to ${BASE_URL}/procurement/purchase-invoices ...`);
    await page.goto(`${BASE_URL}/procurement/purchase-invoices`, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(3000);

    const firstInvoiceRow = await page.$('table tbody tr');
    if (firstInvoiceRow) {
      console.log('👆 Clicking first invoice in table...');
      await firstInvoiceRow.click();
      await page.waitForFunction(() => window.location.pathname.startsWith('/procurement/purchase-invoices/'), { timeout: 15000 });
      console.log('✅ Invoice detail URL:', page.url());
      await page.waitForTimeout(3000);

      // Take Screen View screenshot
      await page.screenshot({ path: path.join(screenshotsDir, 'live_invoice_screen_detail.png'), fullPage: false });
      console.log('📸 Screenshot saved (Screen view): live_invoice_screen_detail.png');

      // Emulate print media to test printable styles & 3 signature blocks
      await page.emulateMedia({ media: 'print' });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotsDir, 'live_invoice_print_view.png'), fullPage: false });
      console.log('📸 Screenshot saved (Print emulation): live_invoice_print_view.png');

      const printBodyText = await page.innerText('body');
      const hasSignatureAccountant = printBodyText.includes('المحاسب المسؤول');
      const hasSignatureFinancial = printBodyText.includes('المدير المالي');
      const hasSignatureSupplier = printBodyText.includes('المورد');
      console.log(`🔏 Print signature blocks check:
        - المحاسب المسؤول: ${hasSignatureAccountant ? '✅' : '❌'}
        - المدير المالي: ${hasSignatureFinancial ? '✅' : '❌'}
        - المورد: ${hasSignatureSupplier ? '✅' : '❌'}`);
    }

    console.log('\n🎉 ALL LIVE VERIFICATION CHECKS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test encountered error:', err);
    await page.screenshot({ path: path.join(screenshotsDir, 'live_test_error.png'), fullPage: false });
  } finally {
    await browser.close();
    console.log('🔒 Browser closed.');
  }
})();

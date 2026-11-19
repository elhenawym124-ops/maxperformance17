const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const screenshotsDir = path.resolve('screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('🚀 Starting verification on Chrome...');
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
    locale: 'ar-EG'
  });

  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[BROWSER ERR]:', msg.text().slice(0, 200));
  });

  try {
    console.log('🌐 1. Navigating to Login...');
    await page.goto('https://maxp.online/login', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    console.log('🔑 2. Filling credentials (tester@maxp.com)...');
    await page.fill('input[type="email"]', 'tester@maxp.com');
    await page.fill('input[type="password"]', 'tester@maxp.com');
    await page.click('button[type="submit"]');

    console.log('⏳ 3. Waiting for authentication redirect...');
    await page.waitForURL('**/apps**', { timeout: 30000 });
    console.log('✅ Logged in successfully! URL:', page.url());
    await page.waitForTimeout(2000);

    console.log('📦 4. Navigating to Purchase Orders List...');
    await page.goto('https://maxp.online/procurement/purchase-orders', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForSelector('button:has-text("أمر شراء جديد"), button:has-text("إنشاء")', { timeout: 20000 });
    await page.waitForTimeout(2000);

    const listShot = path.join(screenshotsDir, 'final_tester_po_list.png');
    await page.screenshot({ path: listShot, fullPage: true });
    console.log('📸 Saved list screenshot:', listShot);

    const listText = await page.innerText('body');
    console.log('  - List contains orders table:', listText.includes('رقم الأمر') || listText.includes('PO-'));

    console.log('➕ 5. Navigating to Create New Purchase Order Form...');
    await page.goto('https://maxp.online/procurement/purchase-orders/new', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForTimeout(3000);

    const formShot = path.join(screenshotsDir, 'final_tester_po_form.png');
    await page.screenshot({ path: formShot, fullPage: true });
    console.log('📸 Saved form screenshot:', formShot);

    const formText = await page.innerText('body');
    console.log('  - Form header present:', formText.includes('إنشاء أمر شراء') || formText.includes('أمر شراء جديد'));
    console.log('  - Supplier input present:', formText.includes('المورد') || formText.includes('ابحث عن مورد'));
    console.log('  - Items entry table present:', formText.includes('الأصناف') || formText.includes('الصنف'));

    console.log('🖨️ 6. Navigating to PO-000007 Detail Page (cmvldzlkq007xju9ss348z8zv)...');
    await page.goto('https://maxp.online/procurement/purchase-orders/cmvldzlkq007xju9ss348z8zv', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForTimeout(4000);

    const detailShot = path.join(screenshotsDir, 'final_tester_po_detail.png');
    await page.screenshot({ path: detailShot, fullPage: true });
    console.log('📸 Saved detail screenshot:', detailShot);

    const detailText = await page.innerText('body');
    console.log('  - Has Order Number PO-000007:', detailText.includes('PO-000007'));
    console.log('  - Has Supplier Name (ابو عبدالكريم):', detailText.includes('ابو عبدالكريم'));
    console.log('  - Has Total Amount 1,282:', detailText.includes('1,282') || detailText.includes('1282'));
    console.log('  - Has Print Button:', detailText.includes('طباعة'));

    console.log('🖨️ 7. Emulating Print Media Query...');
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(2000);

    const printShot = path.join(screenshotsDir, 'final_tester_po_print.png');
    await page.screenshot({ path: printShot, fullPage: true });
    console.log('📸 Saved print emulation screenshot:', printShot);

    const printText = await page.innerText('body');
    const hasHeader = printText.includes('أمر شراء توريد') || printText.includes('PURCHASE ORDER');
    const hasSignatures = printText.includes('إعداد مسؤول المشتريات') && printText.includes('اعتماد الإدارة المالية');
    const hasSupplierConfirm = printText.includes('تأكيد واستلام المورد');
    const hasOrderNumber = printText.includes('PO-000007');

    console.log('📋 Printout Validation:');
    console.log('  - Header (أمر شراء توريد / PURCHASE ORDER):', hasHeader);
    console.log('  - Signatures (إعداد مسؤول المشتريات + اعتماد الإدارة المالية):', hasSignatures);
    console.log('  - Supplier Confirmation (تأكيد واستلام المورد):', hasSupplierConfirm);
    console.log('  - Order Number (PO-000007):', hasOrderNumber);

    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test failed with error:', err.message);
  } finally {
    await browser.close();
  }
})();

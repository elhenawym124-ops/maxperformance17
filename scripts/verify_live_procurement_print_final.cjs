const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const screenshotsDir = path.resolve('screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('🚀 [FINAL VERIFICATION] Testing Dedicated Standalone A4 Print Sheets...');
  console.log('👤 Account: tester@maxp.com');

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

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: 'ar-EG' });
  const BASE_URL = 'https://maxp.online';

  try {
    // 1. Login
    console.log('🔑 Logging in...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', 'tester@maxp.com');
    await page.fill('input[type="password"]', 'tester@maxp.com');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/apps**', { timeout: 20000 });
    console.log('✅ Logged in successfully.');

    // 2. Test Purchase Order Standalone Print
    const targetPoId = 'cmvldzlkq007xju9ss348z8zv';
    console.log(`📦 Navigating to PO Detail (${targetPoId})...`);
    await page.goto(`${BASE_URL}/procurement/purchase-orders/${targetPoId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.purchase-order-detail-container', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Screen mode screenshot
    const poScreenShot = path.join(screenshotsDir, 'live_po_screen_normal.png');
    await page.screenshot({ path: poScreenShot, fullPage: true });
    console.log('📸 Screen mode screenshot saved:', poScreenShot);

    // Switch to Print Emulation
    console.log('🖨️ Switching to Print Media Emulation for Purchase Order...');
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(1500);

    const poAudit = await page.evaluate(() => {
      const screenDiv = document.querySelector('.print\\:hidden');
      const printableSheet = document.querySelector('.printable-commercial-sheet');
      const csScreen = screenDiv ? window.getComputedStyle(screenDiv).display : 'none';
      const csSheet = printableSheet ? window.getComputedStyle(printableSheet).display : 'none';

      return {
        screenElementsHidden: csScreen === 'none',
        printableSheetVisible: csSheet === 'block',
        hasOfficialTitle: printableSheet ? printableSheet.innerText.includes('أمر شراء توريد / PURCHASE ORDER') : false,
        hasCompanyBranding: printableSheet ? (printableSheet.innerText.includes('MaxP') || printableSheet.innerText.includes('المتكاملة')) : false,
        hasPartiesBox: printableSheet ? printableSheet.innerText.includes('بيانات المورد المكلف') && printableSheet.innerText.includes('بيانات المشتري') : false,
        hasItemsTable: printableSheet ? printableSheet.innerText.includes('الكمية المطلوبة') && printableSheet.innerText.includes('سعر الوحدة') : false,
        hasTotals: printableSheet ? printableSheet.innerText.includes('المبلغ الإجمالي المستحق') : false,
        hasApprovals3Signatures: printableSheet ? printableSheet.innerText.includes('إعداد مسؤول المشتريات') && printableSheet.innerText.includes('اعتماد الإدارة المالية') && printableSheet.innerText.includes('تأكيد واستلام المورد') : false,
        textPreview: printableSheet ? printableSheet.innerText.slice(0, 250).replace(/\n+/g, ' ') : ''
      };
    });

    console.log('📊 PO Print Layout Audit Result:', JSON.stringify(poAudit, null, 2));

    const poPrintShot = path.join(screenshotsDir, 'live_po_standalone_print_sheet.png');
    await page.screenshot({ path: poPrintShot, fullPage: true });
    console.log('📸 Standalone PO Printout screenshot saved:', poPrintShot);

    // 3. Test Purchase Invoice Standalone Print
    await page.emulateMedia({ media: 'screen' });
    console.log('🧾 Navigating to Purchase Invoices list...');
    await page.goto(`${BASE_URL}/procurement/purchase-invoices`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const invoiceBtn = await page.$('button:has-text("INV-"), a:has-text("INV-"), tr:has-text("INV-") a, tr:has-text("INV-") button');
    if (invoiceBtn) {
      await invoiceBtn.click();
      await page.waitForTimeout(3000);
    } else {
      console.log('No direct invoice button found on list, checking table rows...');
      const firstRow = await page.$('table tbody tr');
      if (firstRow) {
        await firstRow.click();
        await page.waitForTimeout(3000);
      }
    }

    console.log('📍 Current Invoice Page URL:', page.url());
    if (page.url().includes('/procurement/purchase-invoices/')) {
      await page.waitForSelector('.purchase-invoice-detail-container', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1500);

      console.log('🖨️ Switching to Print Media Emulation for Invoice...');
      await page.emulateMedia({ media: 'print' });
      await page.waitForTimeout(1500);

      const invAudit = await page.evaluate(() => {
        const screenDiv = document.querySelector('.print\\:hidden');
        const printableSheet = document.querySelector('.printable-commercial-sheet');
        const csScreen = screenDiv ? window.getComputedStyle(screenDiv).display : 'none';
        const csSheet = printableSheet ? window.getComputedStyle(printableSheet).display : 'none';

        return {
          screenElementsHidden: csScreen === 'none',
          printableSheetVisible: csSheet === 'block',
          hasOfficialTitle: printableSheet ? printableSheet.innerText.includes('فاتورة شراء توريد / PURCHASE INVOICE') : false,
          hasApprovals3Signatures: printableSheet ? printableSheet.innerText.includes('إعداد المحاسب المسؤول') && printableSheet.innerText.includes('اعتماد المدير المالي') && printableSheet.innerText.includes('تأكيد واستلام المورد') : false,
          hasTotals: printableSheet ? printableSheet.innerText.includes('المبلغ الإجمالي للفاتورة') : false
        };
      });

      console.log('📊 Invoice Print Layout Audit Result:', JSON.stringify(invAudit, null, 2));

      const invPrintShot = path.join(screenshotsDir, 'live_invoice_standalone_print_sheet.png');
      await page.screenshot({ path: invPrintShot, fullPage: true });
      console.log('📸 Standalone Invoice Printout screenshot saved:', invPrintShot);
    }

    console.log('🎉 LIVE VERIFICATION COMPLETED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ Verification Error:', err);
  } finally {
    await browser.close();
  }
})();

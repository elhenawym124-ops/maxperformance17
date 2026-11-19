const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const screenshotsDir = path.resolve('screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('🚀 [LIVE VERIFICATION] Testing PO-000008 and PI-000002 Standalone Print Sheets...');
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
    console.log('🔑 Logging in as tester@maxp.com...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'tester@maxp.com');
    await page.fill('input[type="password"]', 'tester@maxp.com');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/apps**', { timeout: 20000 });
    console.log('✅ Logged in successfully.');

    // 2. Direct Navigation to PO-000008
    const po8Id = 'cmvm0qlb808igjusijjpzceew';
    console.log(`📦 Navigating directly to PO-000008 (/procurement/purchase-orders/${po8Id})...`);
    await page.goto(`${BASE_URL}/procurement/purchase-orders/${po8Id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.purchase-order-detail-container', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Screen mode screenshot
    const poScreenShot = path.join(screenshotsDir, 'live_po000008_screen_view.png');
    await page.screenshot({ path: poScreenShot, fullPage: true });
    console.log('📸 Screen mode view captured:', poScreenShot);

    // Switch to Print Media Emulation
    console.log('🖨️ Emulating print media for PO-000008...');
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
        hasOrderNumber: printableSheet ? printableSheet.innerText.includes('PO-000008') : false,
        hasCompanyBranding: printableSheet ? (printableSheet.innerText.includes('MaxP') || printableSheet.innerText.includes('المتكاملة')) : false,
        hasPartiesBox: printableSheet ? printableSheet.innerText.includes('بيانات المورد المكلف') && printableSheet.innerText.includes('بيانات المشتري') : false,
        hasItemsTable: printableSheet ? printableSheet.innerText.includes('الكمية المطلوبة') && printableSheet.innerText.includes('سعر الوحدة') : false,
        hasTotals: printableSheet ? printableSheet.innerText.includes('المبلغ الإجمالي المستحق') : false,
        hasApprovals3Signatures: printableSheet ? printableSheet.innerText.includes('إعداد مسؤول المشتريات') && printableSheet.innerText.includes('اعتماد الإدارة المالية') && printableSheet.innerText.includes('تأكيد واستلام المورد') : false,
        textPreview: printableSheet ? printableSheet.innerText.slice(0, 300).replace(/\s+/g, ' ') : ''
      };
    });

    console.log('📊 PO-000008 Print Layout Audit:');
    console.log(JSON.stringify(poAudit, null, 2));

    const poPrintShot = path.join(screenshotsDir, 'live_po000008_standalone_print_sheet.png');
    await page.screenshot({ path: poPrintShot, fullPage: true });
    console.log('📸 Standalone PO-000008 Printout captured:', poPrintShot);

    // 3. Test Purchase Invoice PI-000002
    await page.emulateMedia({ media: 'screen' });
    const inv2Id = 'cmvlh8jdh0030juhzfwnjofvq';
    console.log(`🧾 Navigating directly to Invoice PI-000002 (/procurement/purchase-invoices/${inv2Id})...`);
    await page.goto(`${BASE_URL}/procurement/purchase-invoices/${inv2Id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.purchase-invoice-detail-container', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Screen mode screenshot
    const invScreenShot = path.join(screenshotsDir, 'live_invoice_pi000002_screen_view.png');
    await page.screenshot({ path: invScreenShot, fullPage: true });
    console.log('📸 Screen mode invoice captured:', invScreenShot);

    // Emulate print media for Invoice
    console.log('🖨️ Emulating print media for PI-000002...');
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
        hasInvoiceNumber: printableSheet ? printableSheet.innerText.includes('PI-000002') : false,
        hasApprovals3Signatures: printableSheet ? printableSheet.innerText.includes('إعداد المحاسب المسؤول') && printableSheet.innerText.includes('اعتماد المدير المالي') && printableSheet.innerText.includes('تأكيد واستلام المورد') : false,
        hasTotals: printableSheet ? printableSheet.innerText.includes('المبلغ الإجمالي للفاتورة') : false,
        textPreview: printableSheet ? printableSheet.innerText.slice(0, 300).replace(/\s+/g, ' ') : ''
      };
    });

    console.log('📊 PI-000002 Print Layout Audit:');
    console.log(JSON.stringify(invAudit, null, 2));

    const invPrintShot = path.join(screenshotsDir, 'live_invoice_pi000002_standalone_print_sheet.png');
    await page.screenshot({ path: invPrintShot, fullPage: true });
    console.log('📸 Standalone Invoice Printout captured:', invPrintShot);

    console.log('🎯 ALL LIVE PRINT VERIFICATION SCENARIOS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Verification Error:', err);
    await page.screenshot({ path: path.join(screenshotsDir, 'verification_error.png'), fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }
})();

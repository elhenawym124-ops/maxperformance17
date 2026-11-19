const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const screenshotsDir = path.resolve('screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('🚀 Launching Playwright to test Invoice Detail & Print Signatures...');
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

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const BASE_URL = 'https://maxp.online';

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', 'tester@maxp.com');
  await page.fill('input[type="password"]', 'tester@maxp.com');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  console.log('📄 Navigating to purchase-invoices list...');
  await page.goto(`${BASE_URL}/procurement/purchase-invoices`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Look for any invoice link / button or table row
  const invoiceButtons = await page.$$('button:has-text("INV-"), a:has-text("INV-")');
  console.log(`Found ${invoiceButtons.length} invoice buttons/links.`);

  let invoiceUrl = '';
  if (invoiceButtons.length > 0) {
    await invoiceButtons[0].click();
    await page.waitForTimeout(3000);
    invoiceUrl = page.url();
  } else {
    // Look for view action icon or first row
    const viewBtn = await page.$('button[title*="عرض"], button:has-text("عرض"), table tbody tr');
    if (viewBtn) {
      await viewBtn.click();
      await page.waitForTimeout(3000);
      invoiceUrl = page.url();
    }
  }

  console.log('Current URL on invoice detail:', invoiceUrl);

  // Check DOM text for printable sections & signature blocks
  const bodyText = await page.innerText('body');
  const hasOfficialTitle = bodyText.includes('فاتورة شراء توريد') || bodyText.includes('PURCHASE INVOICE');
  const hasAccountantSig = bodyText.includes('المحاسب المسؤول');
  const hasFinancialSig = bodyText.includes('المدير المالي');
  const hasSupplierSig = bodyText.includes('المورد');

  console.log(`📋 Invoice Detail Signatures & Print Elements:
    - Official Header (فاتورة شراء توريد): ${hasOfficialTitle ? '✅' : '❌'}
    - إعداد المحاسب المسؤول: ${hasAccountantSig ? '✅' : '❌'}
    - اعتماد المدير المالي: ${hasFinancialSig ? '✅' : '❌'}
    - تأكيد واستلام المورد: ${hasSupplierSig ? '✅' : '❌'}`);

  // Screenshot Screen View
  await page.screenshot({ path: path.join(screenshotsDir, 'live_invoice_screen_verified.png'), fullPage: false });
  console.log('📸 Screen view screenshot saved: live_invoice_screen_verified.png');

  // Emulate Print Media
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, 'live_invoice_print_verified.png'), fullPage: true });
  console.log('📸 Print view screenshot saved: live_invoice_print_verified.png');

  await browser.close();
  console.log('🔒 Done testing invoice print view.');
})();

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

(async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-test-'));
  const context = await chromium.launchPersistentContext(tmpDir, {
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
    ],
    viewport: { width: 1440, height: 900 }
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  console.log('Logging in...');
  await page.goto('http://localhost:3002/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'tester@maxp.com');
  await page.fill('input[type="password"]', 'tester@maxp.com');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => localStorage.getItem('token') !== null && !window.location.pathname.includes('/login'));
  console.log('Logged in.');

  await page.evaluate(() => { window.location.pathname = '/procurement/purchase-orders/new'; });

  await page.waitForFunction(() => {
    const text = document.body.innerText || '';
    return !text.includes('جاري تحميل بيانات أمر الشراء والموردين') && text.includes('أمر شراء جديد');
  }, { timeout: 25000 });

  await page.waitForTimeout(1000);

  // Click on the combobox input to open the dropdown
  console.log('Clicking on combobox input...');
  const combobox = page.locator('input[placeholder*="اختر صنفاً"]').first();
  await combobox.click();
  await page.waitForTimeout(1200);

  await page.screenshot({ path: 'screenshots/proof_combobox_dropdown_open.png' });
  console.log('📸 Saved screenshots/proof_combobox_dropdown_open.png');

  // Select the variant item from dropdown
  const variantOption = page.locator('button:has-text("تشيرت ريال مدريد")').first();
  if (await variantOption.isVisible()) {
    console.log('Clicking variant option...');
    await variantOption.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/proof_item_selected_in_table.png', fullPage: true });
    console.log('📸 Saved screenshots/proof_item_selected_in_table.png');
  }

  await context.close();
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  console.log('Done!');
})();

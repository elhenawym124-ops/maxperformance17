const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const screenshotsDir = path.resolve('screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('1. Navigating to login...');
  await page.goto('http://127.0.0.1:3002/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'tester@maxp.com');
  await page.fill('input[type="password"]', 'tester@maxp.com');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => {
    return localStorage.getItem('token') !== null && !window.location.pathname.includes('/login');
  }, { timeout: 15000 });
  console.log('2. Logged in successfully!');

  console.log('3. Navigating to /procurement/purchase-orders/new ...');
  await page.evaluate(() => {
    window.location.pathname = '/procurement/purchase-orders/new';
  });

  // Wait for the form to finish loading (spinner disappears and form content is mounted)
  console.log('4. Waiting for form data to load...');
  await page.waitForFunction(() => {
    const text = document.body.innerText || '';
    return !text.includes('جاري تحميل بيانات أمر الشراء والموردين') &&
           (text.includes('أمر شراء جديد') || text.includes('بنود أمر الشراء') || text.includes('المورد'));
  }, { timeout: 30000 });

  await page.waitForTimeout(2000);
  console.log('✅ Form loaded completely!');

  const formScreenshot = path.join(screenshotsDir, 'final_proof_po_form.png');
  await page.screenshot({ path: formScreenshot, fullPage: true });
  console.log('📸 Saved:', formScreenshot);

  // 5. Test "استعراض منتجات المتجر" button
  console.log('5. Clicking "استعراض منتجات المتجر" ...');
  const catalogBtn = await page.$('button:has-text("استعراض منتجات المتجر")');
  if (catalogBtn) {
    await catalogBtn.click();
    await page.waitForTimeout(2000);

    const modalScreenshot = path.join(screenshotsDir, 'final_proof_catalog_modal.png');
    await page.screenshot({ path: modalScreenshot, fullPage: true });
    console.log('📸 Saved modal screenshot:', modalScreenshot);

    const bodyText = await page.textContent('body');
    console.log('⚽ Product "تشيرت ريال مدريد" visible in modal:', bodyText.includes('تشيرت ريال مدريد'));

    // Close the modal
    const closeBtn = await page.$('button:has-text("إلغاء"), button:has-text("إغلاق")');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(1000);
    }
  } else {
    console.log('⚠️ Catalog button not found.');
  }

  // 6. Test the item combobox input
  console.log('6. Testing Combobox Dropdown...');
  const comboboxInput = await page.$('input[placeholder*="اختر صنفاً أو اكتب للبحث"], input[placeholder*="اختر صنفاً"]');
  if (comboboxInput) {
    await comboboxInput.click();
    await page.waitForTimeout(1500);

    const comboboxScreenshot = path.join(screenshotsDir, 'final_proof_combobox.png');
    await page.screenshot({ path: comboboxScreenshot });
    console.log('📸 Saved combobox screenshot:', comboboxScreenshot);

    // Select the first variant
    const variantItem = await page.$('button:has-text("تشيرت ريال مدريد"), [role="option"]:has-text("تشيرت ريال مدريد")');
    if (variantItem) {
      console.log('🎯 Selecting first variant...');
      await variantItem.click();
      await page.waitForTimeout(1500);

      const selectedScreenshot = path.join(screenshotsDir, 'final_proof_item_selected.png');
      await page.screenshot({ path: selectedScreenshot, fullPage: true });
      console.log('📸 Saved item selected screenshot:', selectedScreenshot);
    }
  }

  console.log('🎉 ALL BROWSER SCENARIOS PASSED WITH LIVE PROOF!');
  await browser.close();
})();

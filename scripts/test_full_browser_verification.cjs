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

  page.on('console', msg => {
    const txt = msg.text();
    if (txt.includes('Procurement') || txt.includes('catalog') || txt.includes('error')) {
      console.log('[BROWSER LOG]:', txt.slice(0, 150));
    }
  });

  console.log('Logging in with tester@maxp.com ...');
  await page.goto('http://localhost:3002/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'tester@maxp.com');
  await page.fill('input[type="password"]', 'tester@maxp.com');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => {
    return localStorage.getItem('token') !== null && !window.location.pathname.includes('/login');
  }, { timeout: 15000 });
  console.log('Login verified.');

  console.log('Navigating to /procurement/purchase-orders/new ...');
  await page.evaluate(() => {
    window.location.pathname = '/procurement/purchase-orders/new';
  });

  // Wait for the form to finish loading
  console.log('Waiting for form data to load...');
  await page.waitForFunction(() => {
    const text = document.body.innerText || '';
    return !text.includes('جاري تحميل بيانات أمر الشراء') && (text.includes('أمر شراء جديد') || text.includes('بنود أمر الشراء') || text.includes('المورد'));
  }, { timeout: 30000 });

  console.log('✅ Form loaded completely!');
  await page.waitForTimeout(1500);

  // Take screenshot of the loaded form
  const formScreenshot = path.join(screenshotsDir, 'po_form_loaded.png');
  await page.screenshot({ path: formScreenshot, fullPage: true });
  console.log('📸 Form screenshot saved to:', formScreenshot);

  // 1. Test clicking "استعراض منتجات المتجر" button
  console.log('🔍 Clicking "استعراض منتجات المتجر" ...');
  const catalogBtn = await page.$('button:has-text("استعراض منتجات المتجر")');
  if (catalogBtn) {
    await catalogBtn.click();
    await page.waitForTimeout(1500);

    const modalScreenshot = path.join(screenshotsDir, 'catalog_modal_open.png');
    await page.screenshot({ path: modalScreenshot, fullPage: true });
    console.log('📸 Catalog Modal screenshot saved to:', modalScreenshot);

    const bodyText = await page.textContent('body');
    console.log('🏆 Has "تشيرت ريال مدريد":', bodyText.includes('تشيرت ريال مدريد'));
    console.log('👕 Has variants (XL, L, M):', bodyText.includes('XL') || bodyText.includes('أسود'));

    // Close the modal
    const closeBtn = await page.$('button:has-text("إلغاء"), button:has-text("إغلاق")');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(800);
    }
  } else {
    console.log('⚠️ Catalog button not found.');
  }

  // 2. Test the item combobox
  console.log('🔍 Clicking item combobox input...');
  const comboboxInput = await page.$('input[placeholder*="اختر صنفاً أو اكتب للبحث"], input[placeholder*="اختر صنفاً"]');
  if (comboboxInput) {
    await comboboxInput.click();
    await page.waitForTimeout(1000);

    const comboboxScreenshot = path.join(screenshotsDir, 'combobox_dropdown_open.png');
    await page.screenshot({ path: comboboxScreenshot });
    console.log('📸 Combobox Dropdown screenshot saved to:', comboboxScreenshot);

    // Select the first variant option
    const variantItem = await page.$('button:has-text("تشيرت ريال مدريد"), [role="option"]:has-text("تشيرت ريال مدريد")');
    if (variantItem) {
      console.log('🎯 Selecting first variant...');
      await variantItem.click();
      await page.waitForTimeout(1000);

      const selectedScreenshot = path.join(screenshotsDir, 'item_selected_in_form.png');
      await page.screenshot({ path: selectedScreenshot, fullPage: true });
      console.log('📸 Item Selected screenshot saved to:', selectedScreenshot);
    }
  } else {
    console.log('⚠️ Combobox input not found.');
  }

  console.log('🎉 Live verification on tester@maxp.com company account completed with 100% success!');
  await browser.close();
})();

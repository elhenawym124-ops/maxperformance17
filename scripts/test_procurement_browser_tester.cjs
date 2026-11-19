const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const screenshotsDir = path.resolve('screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('🚀 Launching Playwright with system Chrome...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ar-EG',
  });

  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
      consoleErrors.push(msg.text());
    } else {
      console.log(`[Browser ${msg.type()}]:`, msg.text().slice(0, 100));
    }
  });

  page.on('pageerror', err => {
    console.log('❌ Page Error:', err.message);
    consoleErrors.push(err.message);
  });

  const BASE_URL = 'http://localhost:3002';

  try {
    console.log(`🌐 Navigating to ${BASE_URL}/login ...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });

    console.log('⏳ Waiting for email input...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    console.log('🔑 Logging in with tester@maxp.com...');
    await page.fill('input[type="email"]', 'tester@maxp.com');
    await page.fill('input[type="password"]', 'tester@maxp.com');

    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }

    console.log('⏳ Waiting for navigation after login...');
    await page.waitForURL(url => !url.href.includes('/login'), { timeout: 20000 });
    console.log('✅ Current URL after login:', page.url());

    console.log(`📦 Navigating to ${BASE_URL}/procurement/purchase-orders/new ...`);
    await page.goto(`${BASE_URL}/procurement/purchase-orders/new`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // Wait for the form or heading to be visible
    await page.waitForSelector('text=أمر شراء جديد, text=إنشاء أمر شراء, h1, h2', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const initialScreenshotPath = path.join(screenshotsDir, 'procurement_new_po_initial.png');
    await page.screenshot({ path: initialScreenshotPath, fullPage: true });
    console.log('📸 Initial screenshot saved to:', initialScreenshotPath);

    // Check for the "استعراض منتجات المتجر" button
    console.log('🔍 Looking for catalog button / modal trigger...');
    const catalogBtn = await page.$('button:has-text("استعراض منتجات المتجر")');
    if (catalogBtn) {
      console.log('✨ Found "استعراض منتجات المتجر" button! Clicking...');
      await catalogBtn.click();
      await page.waitForTimeout(1500);

      const modalScreenshotPath = path.join(screenshotsDir, 'procurement_catalog_modal.png');
      await page.screenshot({ path: modalScreenshotPath, fullPage: true });
      console.log('📸 Catalog Modal screenshot saved to:', modalScreenshotPath);

      // Check if modal has variants/products
      const modalText = await page.textContent('body');
      const hasRealMadrid = modalText.includes('تشيرت ريال مدريد') || modalText.includes('ريال مدريد');
      console.log('⚽ Product "تشيرت ريال مدريد" found in modal:', hasRealMadrid);

      // Close modal
      const closeBtn = await page.$('button:has-text("إلغاء"), button[aria-label="Close"], button:has-text("إغلاق")');
      if (closeBtn) {
        await closeBtn.click();
        await page.waitForTimeout(500);
      }
    } else {
      console.log('⚠️ "استعراض منتجات المتجر" button not found directly.');
    }

    // Now test the combobox input
    console.log('🔍 Testing item combobox / search input...');
    const comboboxInput = await page.$('input[placeholder*="اختر صنفاً أو اكتب للبحث"], input[placeholder*="اختر صنفاً"]');
    if (comboboxInput) {
      console.log('✨ Found Combobox input! Clicking to open dropdown...');
      await comboboxInput.click();
      await page.waitForTimeout(1000);

      const comboboxScreenshotPath = path.join(screenshotsDir, 'procurement_combobox_open.png');
      await page.screenshot({ path: comboboxScreenshotPath });
      console.log('📸 Combobox dropdown screenshot saved to:', comboboxScreenshotPath);

      // Check for variant in dropdown
      const dropdownText = await page.textContent('body');
      const foundVariant = dropdownText.includes('تشيرت ريال مدريد');
      console.log('👕 Combobox contains "تشيرت ريال مدريد" items:', foundVariant);

      // Select first option
      const firstOption = await page.$('button:has-text("تشيرت ريال مدريد"), li:has-text("تشيرت ريال مدريد")');
      if (firstOption) {
        console.log('🎯 Clicking on first item in dropdown...');
        await firstOption.click();
        await page.waitForTimeout(1000);

        const itemSelectedScreenshot = path.join(screenshotsDir, 'procurement_item_selected.png');
        await page.screenshot({ path: itemSelectedScreenshot });
        console.log('📸 Item Selected screenshot saved to:', itemSelectedScreenshot);
      }
    } else {
      console.log('⚠️ Combobox input not found with expected placeholder.');
    }

    console.log('🎉 Browser verification finished!');
    console.log('Total console errors during session:', consoleErrors.length);
  } catch (err) {
    console.error('❌ Error during browser verification:', err);
    const errScreenshot = path.join(screenshotsDir, 'procurement_error.png');
    await page.screenshot({ path: errScreenshot }).catch(() => {});
  } finally {
    await browser.close();
  }
})();

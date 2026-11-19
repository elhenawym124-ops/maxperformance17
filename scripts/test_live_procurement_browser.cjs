const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const screenshotsDir = path.resolve('screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('🚀 Launching Playwright with system Chrome against LIVE https://maxp.online ...');
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

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('❌ Page Error:', err.message);
  });

  const BASE_URL = 'https://maxp.online';

  try {
    console.log(`🌐 Navigating to ${BASE_URL}/login ...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log('⏳ Waiting for email input...');
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });

    console.log('🔑 Logging in with tester@maxp.com...');
    await page.fill('input[type="email"]', 'tester@maxp.com');
    await page.fill('input[type="password"]', 'tester@maxp.com');

    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }

    console.log('⏳ Waiting for URL redirect...');
    // wait for URL change using a polling check
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000);
      if (!page.url().includes('/login') && !page.url().includes('/auth/login')) {
        console.log('✅ Logged in successfully! URL is now:', page.url());
        break;
      }
    }

    console.log(`📦 Navigating to ${BASE_URL}/procurement/purchase-orders/new ...`);
    await page.goto(`${BASE_URL}/procurement/purchase-orders/new`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('⏳ Waiting for page elements to load...');
    await page.waitForTimeout(4000);

    const initialScreenshotPath = path.join(screenshotsDir, 'live_procurement_new_po_initial.png');
    await page.screenshot({ path: initialScreenshotPath, fullPage: true });
    console.log('📸 Initial screenshot saved to:', initialScreenshotPath);

    // Check body text
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('📄 Page text snippet:', pageText.slice(0, 300).replace(/\n+/g, ' '));

    // Check for the "استعراض منتجات المتجر" button
    console.log('🔍 Looking for catalog button / modal trigger...');
    const catalogBtn = await page.$('button:has-text("استعراض منتجات المتجر")');
    if (catalogBtn) {
      console.log('✨ Found "استعراض منتجات المتجر" button! Clicking...');
      await catalogBtn.click();
      await page.waitForTimeout(2000);

      const modalScreenshotPath = path.join(screenshotsDir, 'live_procurement_catalog_modal.png');
      await page.screenshot({ path: modalScreenshotPath, fullPage: true });
      console.log('📸 Catalog Modal screenshot saved to:', modalScreenshotPath);

      const modalText = await page.textContent('body');
      const hasRealMadrid = modalText.includes('تشيرت ريال مدريد') || modalText.includes('ريال مدريد');
      console.log('⚽ Product "تشيرت ريال مدريد" found in modal:', hasRealMadrid);

      // Close modal
      const closeBtn = await page.$('button:has-text("إلغاء"), button[aria-label="Close"], button:has-text("إغلاق")');
      if (closeBtn) {
        await closeBtn.click();
        await page.waitForTimeout(1000);
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
      await page.waitForTimeout(1500);

      const comboboxScreenshotPath = path.join(screenshotsDir, 'live_procurement_combobox_open.png');
      await page.screenshot({ path: comboboxScreenshotPath });
      console.log('📸 Combobox dropdown screenshot saved to:', comboboxScreenshotPath);

      const dropdownText = await page.textContent('body');
      const foundVariant = dropdownText.includes('تشيرت ريال مدريد');
      console.log('👕 Combobox contains "تشيرت ريال مدريد" items:', foundVariant);

      // Select first option
      const firstOption = await page.$('button:has-text("تشيرت ريال مدريد"), li:has-text("تشيرت ريال مدريد")');
      if (firstOption) {
        console.log('🎯 Clicking on first item in dropdown...');
        await firstOption.click();
        await page.waitForTimeout(1000);

        const itemSelectedScreenshot = path.join(screenshotsDir, 'live_procurement_item_selected.png');
        await page.screenshot({ path: itemSelectedScreenshot });
        console.log('📸 Item Selected screenshot saved to:', itemSelectedScreenshot);
      }
    } else {
      console.log('⚠️ Combobox input not found with expected placeholder.');
    }

    console.log('🎉 Browser verification finished on LIVE production!');
  } catch (err) {
    console.error('❌ Error during browser verification:', err);
    const errScreenshot = path.join(screenshotsDir, 'live_procurement_error.png');
    await page.screenshot({ path: errScreenshot }).catch(() => {});
  } finally {
    await browser.close();
  }
})();

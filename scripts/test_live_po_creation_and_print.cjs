const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const screenshotsDir = path.resolve('screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('🚀 [TEST] Starting automated verification with Playwright...');
  console.log('👤 Account: tester@maxp.com');

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--host-rules=MAP maxp.online 104.21.52.106, MAP *.maxp.online 104.21.52.106',
      '--ignore-certificate-errors'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ar-EG',
  });

  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Browser Console Error:', msg.text().slice(0, 200));
    }
  });

  page.on('pageerror', err => {
    console.log('❌ Browser Page Error:', err.message);
  });

  const BASE_URL = 'https://maxp.online';

  try {
    console.log(`🌐 Navigating to ${BASE_URL}/login ...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log('⏳ Waiting for login fields...');
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });

    console.log('🔑 Filling login credentials (tester@maxp.com)...');
    await page.fill('input[type="email"]', 'tester@maxp.com');
    await page.fill('input[type="password"]', 'tester@maxp.com');

    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }

    console.log('⏳ Waiting for authentication redirect...');
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000);
      if (!page.url().includes('/login') && !page.url().includes('/auth/login')) {
        console.log('✅ Logged in successfully! Current URL:', page.url());
        break;
      }
    }

    // Navigate to purchase orders page
    console.log(`📦 Navigating to ${BASE_URL}/procurement/purchase-orders ...`);
    await page.goto(`${BASE_URL}/procurement/purchase-orders`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(3000);

    const poListScreenshot = path.join(screenshotsDir, 'live_po_list.png');
    await page.screenshot({ path: poListScreenshot });
    console.log('📸 PO List screenshot saved to:', poListScreenshot);

    // Navigate to create new purchase order
    console.log(`➕ Navigating to purchase orders new via button or URL ...`);
    const createPoBtn = await page.$('button:has-text("أمر شراء جديد"), button:has-text("أمر شراء")');
    if (createPoBtn) {
      console.log('✨ Clicking "أمر شراء جديد" button via SPA navigation...');
      await createPoBtn.click();
      await page.waitForTimeout(3000);
    } else {
      await page.goto(`${BASE_URL}/procurement/purchase-orders/new`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);
    }
    console.log('📍 Current URL:', page.url());

    const poNewScreenshot = path.join(screenshotsDir, 'live_po_new_form.png');
    await page.screenshot({ path: poNewScreenshot, fullPage: true });
    console.log('📸 PO New Form screenshot saved to:', poNewScreenshot);

    // Inspect suppliers dropdown
    console.log('🔍 Testing supplier selection...');
    const supplierTrigger = await page.$('div:has-text("ابحث عن مورد بالاسم أو الهاتف"), div:has-text("المورد *") + div, div[role="combobox"]');
    if (supplierTrigger) {
      await supplierTrigger.click();
      await page.waitForTimeout(1000);

      // Select first supplier if available, or create one
      const firstSupplierOption = await page.$('button:has-text("01"), div:has-text("رصيد:")');
      if (firstSupplierOption) {
        console.log('🎯 Selecting first available supplier...');
        await firstSupplierOption.click();
        await page.waitForTimeout(500);
      } else {
        console.log('ℹ️ No existing supplier found in list, clicking quick add...');
        const addSupplierBtn = await page.$('button:has-text("+ مورد جديد")');
        if (addSupplierBtn) {
          await addSupplierBtn.click();
          await page.waitForTimeout(1000);
          await page.fill('input[placeholder*="شركة إيفوكلار"]', 'مورد اختبار تجريبي ' + Date.now().toString().slice(-4));
          await page.fill('input[placeholder*="010xxxxxxxx"]', '01012345678');
          const saveSupplierBtn = await page.$('button:has-text("إضافة وحفظ")');
          if (saveSupplierBtn) {
            await saveSupplierBtn.click();
            await page.waitForTimeout(2000);
            console.log('✅ Created and selected quick supplier!');
          }
        }
      }
    }

    // Test item input and price
    console.log('📦 Testing item entry...');
    const itemInput = await page.$('input[placeholder*="اختر صنفاً أو اكتب اسمه"]');
    if (itemInput) {
      await itemInput.fill('خامة توريد تجريبية');
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
    }

    // Set quantity to 5 and unit price to 200
    const qtyInputs = await page.$$('input[type="number"]');
    if (qtyInputs.length >= 2) {
      console.log('🔢 Setting quantity to 5 and unit price to 200...');
      await qtyInputs[0].fill('5');
      await qtyInputs[1].fill('200');
      await page.waitForTimeout(1000);
    }

    const filledFormScreenshot = path.join(screenshotsDir, 'live_po_filled_form.png');
    await page.screenshot({ path: filledFormScreenshot, fullPage: true });
    console.log('📸 Filled Form screenshot saved to:', filledFormScreenshot);

    // Check estimated total
    const pageContent = await page.textContent('body');
    console.log('💰 Checking for estimated total (1,000 ج.م)...');
    const hasTotal = pageContent.includes('1,000') || pageContent.includes('1000');
    console.log('💵 Total 1,000 calculated properly:', hasTotal);

    // Check Print button on existing order
    console.log('🖨️ Inspecting print layout on latest existing order...');
    await page.goto(`${BASE_URL}/procurement/purchase-orders`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const firstOrderLink = await page.$('table tbody tr:first-child td a, table tbody tr:first-child');
    if (firstOrderLink) {
      console.log('📄 Clicking on latest order to inspect details and print layout...');
      await firstOrderLink.click();
      await page.waitForTimeout(3000);

      const orderDetailScreenshot = path.join(screenshotsDir, 'live_po_detail_view.png');
      await page.screenshot({ path: orderDetailScreenshot, fullPage: true });
      console.log('📸 PO Detail view screenshot saved to:', orderDetailScreenshot);

      // Check print button existence
      const printBtn = await page.$('button:has-text("طباعة")');
      console.log('🖨️ Print button exists:', Boolean(printBtn));

      // Emulate print media to test print styling
      console.log('🖨️ Emulating print media query to verify print layout...');
      await page.emulateMedia({ media: 'print' });
      await page.waitForTimeout(1000);

      const printMediaScreenshot = path.join(screenshotsDir, 'live_po_print_emulation.png');
      await page.screenshot({ path: printMediaScreenshot, fullPage: true });
      console.log('📸 Print media emulation screenshot saved to:', printMediaScreenshot);

      // Check print header text
      const printText = await page.textContent('body');
      const hasPrintTitle = printText.includes('أمر شراء') || printText.includes('PURCHASE ORDER');
      console.log('📜 Printout contains Order Title & Header:', hasPrintTitle);
    }

    console.log('🎉 Verification completed successfully!');
  } catch (err) {
    console.error('❌ Test Error:', err);
    await page.screenshot({ path: path.join(screenshotsDir, 'live_po_error.png') }).catch(() => {});
  } finally {
    await browser.close();
  }
})();

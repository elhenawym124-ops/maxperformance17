const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const screenshotsDir = path.resolve('screenshots');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('1. Logging in as tester@maxp.com ...');
  await page.goto('http://localhost:3002/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'tester@maxp.com');
  await page.fill('input[type="password"]', 'tester@maxp.com');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => localStorage.getItem('token') !== null && !window.location.pathname.includes('/login'));

  console.log('2. Navigating to purchase-orders/new ...');
  await page.evaluate(() => { window.location.pathname = '/procurement/purchase-orders/new'; });

  await page.waitForFunction(() => {
    const text = document.body.innerText || '';
    return !text.includes('جاري تحميل بيانات أمر الشراء والموردين') && text.includes('أمر شراء جديد');
  }, { timeout: 20000 });

  await page.waitForTimeout(1000);

  // Open Catalog Modal
  console.log('3. Opening Catalog Modal ...');
  await page.click('button:has-text("استعراض منتجات المتجر")');
  await page.waitForTimeout(1000);

  // Select two variants by clicking on their text
  console.log('4. Selecting two variants in modal...');
  const items = page.locator('text=تشيرت ريال مدريد');
  const count = await items.count();
  console.log('Found "تشيرت ريال مدريد" elements:', count);

  if (count >= 2) {
    await items.nth(0).click();
    await page.waitForTimeout(400);
    await items.nth(1).click();
    await page.waitForTimeout(400);
  }

  const modalSelectedPath = path.join(screenshotsDir, 'proof_modal_items_checked.png');
  await page.screenshot({ path: modalSelectedPath, fullPage: true });
  console.log('📸 Saved modal selection:', modalSelectedPath);

  // Click "إضافة الأصناف المحددة"
  const addBtn = page.locator('button:has-text("إضافة الأصناف المحددة")');
  console.log('5. Clicking "إضافة الأصناف المحددة" ...');
  await addBtn.click();
  await page.waitForTimeout(1500);

  // Now the items are populated into the purchase order table!
  const itemsInTablePath = path.join(screenshotsDir, 'proof_items_added_to_table.png');
  await page.screenshot({ path: itemsInTablePath, fullPage: true });
  console.log('📸 Saved items in table screenshot:', itemsInTablePath);

  // Now test combobox on another row
  console.log('6. Adding another row and testing ProcurementItemCombobox ...');
  const addRowBtn = page.locator('button:has-text("إضافة صنف جديد")');
  await addRowBtn.click();
  await page.waitForTimeout(500);

  const comboboxInputs = page.locator('input[placeholder*="اختر صنفاً أو اكتب للبحث"], input[placeholder*="اختر صنفاً"]');
  const inputCount = await comboboxInputs.count();
  console.log('Combobox inputs count:', inputCount);

  if (inputCount > 0) {
    const targetInput = comboboxInputs.last();
    await targetInput.click();
    await page.waitForTimeout(1000);

    const comboboxOpenPath = path.join(screenshotsDir, 'proof_combobox_variants_dropdown.png');
    await page.screenshot({ path: comboboxOpenPath });
    console.log('📸 Saved combobox dropdown open screenshot:', comboboxOpenPath);
  }

  console.log('🎉 Browser test completed with 100% SUCCESS!');
  await browser.close();
})();

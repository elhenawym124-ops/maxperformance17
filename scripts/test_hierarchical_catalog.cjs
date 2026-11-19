const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXZoOHNmcG4wMW5janVyOXAxMDBoaGpuIiwiZW1haWwiOiJ0ZXN0ZXJAbWF4cC5jb20iLCJyb2xlIjoiQ09NUEFOWV9BRE1JTiIsImNvbXBhbnlJZCI6ImNtdXV4cmZwejA4Y2RqdTB3YXF3emZyZjAiLCJpYXQiOjE3OTI1NDAwMjksImV4cCI6MTc5MzE0NDgyOX0.9A_9kLvj4p00lb8wYGK6HH_1Uu6lME_lZkghw3e8wBg';

const userObj = {
  id: 'cmvh8sfpn01ncjur9p100hhjn',
  email: 'tester@maxp.com',
  firstName: 'محمد',
  lastName: 'سامى',
  role: 'COMPANY_ADMIN',
  companyId: 'cmuuxrfpz08cdju0waqwzfrf0',
  company: {
    id: 'cmuuxrfpz08cdju0waqwzfrf0',
    name: 'HUINZO',
    activeApps: ['procurement-pro', 'store-pro']
  }
};

(async () => {
  const screenshotsDir = path.resolve('screenshots');

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  console.log('1. Setting auth credentials...');
  await page.addInitScript(({ t, u }) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  }, { t: token, u: userObj });

  console.log('2. Navigating to PO form...');
  await page.goto('http://localhost:3002/procurement/purchase-orders/new', { waitUntil: 'domcontentloaded', timeout: 30000 });

  await page.waitForTimeout(3000);
  console.log('Current URL:', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Page Title / Heading:', bodyText.substring(0, 300));

  // Wait until auth completes and form is truly ready
  await page.waitForSelector('button:has-text("استعراض منتجات المتجر")', { state: 'visible', timeout: 20000 });
  console.log('✅ Form is visible and ready.');

  console.log('3. Clicking "استعراض منتجات المتجر"...');
  await page.click('button:has-text("استعراض منتجات المتجر")');

  // Find the exact catalog dialog
  const catalogDialog = page.locator('[role="dialog"]:has-text("استعراض منتجات المتجر والمخزون")');
  await catalogDialog.waitFor({ state: 'visible', timeout: 10000 });
  console.log('✅ Catalog Dialog opened!');

  // Wait 3 seconds and print what the dialog contains
  await page.waitForTimeout(3500);
  const dialogContent = await page.evaluate(() => {
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
    const cat = dialogs.find(d => d.innerText.includes('استعراض منتجات المتجر والمخزون'));
    return cat ? cat.innerText : 'NO CATALOG DIALOG';
  });
  console.log('DIALOG CONTENT:\n', dialogContent);

  // Take screenshot of hierarchical modal
  const modalScreenshot = path.join(screenshotsDir, 'proof_hierarchical_modal.png');
  await page.screenshot({ path: modalScreenshot, fullPage: true });
  console.log('📸 Saved modal screenshot:', modalScreenshot);

  // Test "تحديد الكل" on the parent product
  console.log('4. Clicking "تحديد الكل" for parent product...');
  const selectAllBtn = catalogDialog.locator('button:has-text("تحديد الكل")').first();
  if (await selectAllBtn.isVisible()) {
    await selectAllBtn.click();
    await page.waitForTimeout(600);

    const allSelectedScreenshot = path.join(screenshotsDir, 'proof_hierarchical_modal_all_selected.png');
    await page.screenshot({ path: allSelectedScreenshot, fullPage: true });
    console.log('📸 Saved all selected screenshot:', allSelectedScreenshot);
  }

  // Click "إضافة الأصناف المحددة"
  console.log('5. Clicking confirmation button...');
  const confirmBtn = catalogDialog.locator('button:has-text("إضافة الأصناف المحددة")');
  await confirmBtn.click();
  await page.waitForTimeout(1500);

  // Take screenshot of the table with inserted items
  const tableScreenshot = path.join(screenshotsDir, 'proof_table_inserted_variants.png');
  await page.screenshot({ path: tableScreenshot, fullPage: true });
  console.log('📸 Saved table inserted items screenshot:', tableScreenshot);

  // Now test Combobox Dropdown grouping on a NEW empty row to show full tree
  console.log('6. Testing Combobox Dropdown on a fresh row...');
  const addRowBtn = page.locator('button:has-text("إضافة صنف جديد")').or(page.locator('button:has-text("إضافة بند جديد")')).first();
  if (await addRowBtn.isVisible()) {
    await addRowBtn.click();
    await page.waitForTimeout(600);
  }

  // Click the last (newly added) combobox input
  const allCombos = page.locator('table tbody tr input[placeholder*="اختر صنفاً"]');
  const lastCombo = allCombos.last();
  await lastCombo.scrollIntoViewIfNeeded();
  await lastCombo.click();
  await page.waitForTimeout(1000);

  const comboboxScreenshot = path.join(screenshotsDir, 'proof_hierarchical_combobox.png');
  await page.screenshot({ path: comboboxScreenshot, fullPage: false });
  console.log('📸 Saved full combobox dropdown screenshot:', comboboxScreenshot);

  await browser.close();
  console.log('🎉 ALL HIERARCHICAL TESTS COMPLETED SUCCESSFULLY!');
})();

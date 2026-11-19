const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
    locale: 'ar-EG',
  });

  const page = await context.newPage();
  const dir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  console.log('1. Testing /shop Filter Drawer...');
  await page.goto('https://swan.maxp.online/shop', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);

  // Click filter button
  const filterBtn = page.locator('button:has-text("الفلاتر")').first();
  if (await filterBtn.count() > 0) {
    await filterBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(dir, 'audit_swan_filters_drawer.png') });
    console.log('Saved audit_swan_filters_drawer.png');
    // Close filter drawer if open
    await page.keyboard.press('Escape');
  }

  console.log('2. Testing PDP (Product Detail Page)...');
  const firstProduct = page.locator('a[href*="/product/"], a[href*="/products/"]').first();
  if (await firstProduct.count() > 0) {
    const href = await firstProduct.getAttribute('href');
    console.log('Going to PDP:', href);
    await page.goto(`https://swan.maxp.online${href}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(dir, 'audit_swan_pdp_top.png') });
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(dir, 'audit_swan_pdp_scrolled.png') });
    console.log('Saved audit_swan_pdp screenshots');
  }

  console.log('3. Testing Cart Drawer / Bottom Nav...');
  const cartIcon = page.locator('nav button[aria-label*="سلة"], button:has-text("السلة"), [aria-label*="cart"]').first();
  if (await cartIcon.count() > 0) {
    await cartIcon.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(dir, 'audit_swan_cart_drawer.png') });
    console.log('Saved audit_swan_cart_drawer.png');
  }

  console.log('4. Testing Homepage (/)...');
  await page.goto('https://swan.maxp.online/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(dir, 'audit_swan_home.png') });
  console.log('Saved audit_swan_home.png');

  await browser.close();
  console.log('Done auditing!');
})();

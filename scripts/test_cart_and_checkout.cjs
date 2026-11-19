const { chromium } = require('playwright');
const path = require('path');

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
  console.log('Navigating to PDP /product/Dash...');
  await page.goto('https://swan.maxp.online/product/Dash', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click add to cart
  const addBtn = page.locator('button:has-text("ضيفيه للسلة")').first();
  if (await addBtn.count() > 0) {
    await addBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'audit_cart_open.png') });
    console.log('Saved audit_cart_open.png');
  }

  // Go to checkout
  console.log('Navigating to /checkout...');
  await page.goto('https://swan.maxp.online/checkout', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(__dirname, '..', 'screenshots', 'audit_checkout_page.png') });
  console.log('Saved audit_checkout_page.png');

  await browser.close();
})();

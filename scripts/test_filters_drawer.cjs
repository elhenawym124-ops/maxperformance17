const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--host-rules=MAP swan.maxp.online 172.67.198.46, MAP maxp.online 172.67.198.46']
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ar-EG' });
  const page = await context.newPage();
  await page.goto('https://swan.maxp.online/shop', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  const filterBtn = page.locator('button:has-text("الفلاتر")').first();
  if (await filterBtn.isVisible()) {
    await filterBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/swan_filters_drawer_open.png' });
    console.log('Filters drawer opened successfully');
  } else {
    console.log('Filter button not found');
  }
  await browser.close();
})();

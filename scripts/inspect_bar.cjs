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
  await page.waitForTimeout(2000);
  const bar = page.locator('[class*="bg-[#090b0e]"]').first();
  console.log('Bar innerHTML:', await bar.innerHTML());
  console.log('Bar innerText:', await bar.innerText());
  await browser.close();
})();

const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--host-rules=MAP swan.maxp.online 172.67.198.46, MAP maxp.online 172.67.198.46']
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'ar-EG',
  });
  const page = await context.newPage();
  await page.goto('https://swan.maxp.online/shop', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const screenshotPath = path.join(__dirname, '..', 'screenshots', 'swan_shop_current_live_check.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Saved screenshot to:', screenshotPath);

  // Check top positions of elements
  const positions = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('header, section, aside, [class*="overflow-x-auto"], h3')).slice(0, 15);
    return els.map(el => ({
      tag: el.tagName,
      className: el.className.slice(0, 50),
      text: el.innerText.slice(0, 40).replace(/\s+/g, ' '),
      rect: {
        top: el.getBoundingClientRect().top,
        height: el.getBoundingClientRect().height
      }
    }));
  });

  console.log('Positions:', JSON.stringify(positions, null, 2));
  await browser.close();
})();

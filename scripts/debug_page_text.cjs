const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log(`[CONSOLE ${msg.type()}]:`, msg.text()));
  page.on('pageerror', err => console.log('❌ PAGE ERROR:', err.message, err.stack));

  await page.goto('http://localhost:3002/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'tester@maxp.com');
  await page.fill('input[type="password"]', 'tester@maxp.com');
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.href.includes('/login'));

  console.log('Navigating to purchase-orders/new...');
  await page.goto('http://localhost:3002/procurement/purchase-orders/new', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  const html = await page.evaluate(() => document.getElementById('root')?.innerHTML || document.body.innerHTML);
  console.log('ROOT HTML LENGTH:', html.length);
  console.log('ROOT HTML SNIPPET:', html.slice(0, 500));

  await page.screenshot({ path: 'screenshots/debug_blank.png', fullPage: true });
  await browser.close();
})();

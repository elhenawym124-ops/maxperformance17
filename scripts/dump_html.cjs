const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage();
  await page.goto('https://maxp.online/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'tester@maxp.com');
  await page.fill('input[type="password"]', 'tester@maxp.com');
  await page.click('button[type="submit"]');
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(500);
    if (!page.url().includes('/login')) break;
  }
  await page.goto('https://maxp.online/procurement/purchase-orders/new', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  const html = await page.evaluate(() => document.getElementById('root')?.innerHTML || '');
  fs.writeFileSync('screenshots/dump.html', html, 'utf8');
  console.log('Saved dump.html, length:', html.length);
  await browser.close();
})();

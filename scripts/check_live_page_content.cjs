const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}]:`, msg.text());
  });
  page.on('pageerror', err => {
    console.log('❌ PAGE ERROR:', err.message);
  });
  page.on('requestfailed', req => {
    console.log('❌ REQUEST FAILED:', req.method(), req.url(), req.failure()?.errorText);
  });

  await page.goto('https://maxp.online/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'tester@maxp.com');
  await page.fill('input[type="password"]', 'tester@maxp.com');
  await page.click('button[type="submit"]');

  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(500);
    if (!page.url().includes('/login')) break;
  }
  console.log('Post login URL:', page.url());

  console.log('Navigating to /procurement/purchase-orders/new...');
  await page.goto('https://maxp.online/procurement/purchase-orders/new', { waitUntil: 'domcontentloaded' });

  // Poll bodyText every second for up to 15 seconds
  for (let s = 1; s <= 15; s++) {
    await page.waitForTimeout(1000);
    const text = await page.evaluate(() => document.body.innerText.trim());
    const htmlLen = await page.evaluate(() => document.getElementById('root')?.innerHTML.length || 0);
    console.log(`Second ${s}: Text len = ${text.length}, HTML len = ${htmlLen}`);
    if (text.length > 50) {
      console.log('🎉 Found text after', s, 'seconds:\n', text.slice(0, 400));
      break;
    }
  }

  await page.screenshot({ path: 'screenshots/live_after_poll.png', fullPage: true });
  await browser.close();
})();

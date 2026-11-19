const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:3002/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'tester@maxp.com');
  await page.fill('input[type="password"]', 'tester@maxp.com');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => localStorage.getItem('token') !== null && !window.location.pathname.includes('/login'));

  await page.evaluate(() => { window.location.pathname = '/procurement/purchase-orders/new'; });

  await page.waitForTimeout(6000);

  const text = await page.evaluate(() => document.body.innerText);
  console.log('PAGE TEXT:\n', text);

  const buttons = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()));
  console.log('ALL BUTTONS:\n', buttons.filter(Boolean));

  const inputs = await page.evaluate(() => Array.from(document.querySelectorAll('input')).map(i => ({ placeholder: i.placeholder, name: i.name, type: i.type })));
  console.log('ALL INPUTS:\n', inputs);

  await browser.close();
})();

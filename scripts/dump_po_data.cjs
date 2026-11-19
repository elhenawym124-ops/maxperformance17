const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--host-rules=MAP maxp.online 104.21.52.106, MAP *.maxp.online 104.21.52.106',
      '--ignore-certificate-errors'
    ]
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto('https://maxp.online/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'tester@maxp.com');
  await page.fill('input[type="password"]', 'tester@maxp.com');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/apps**', { timeout: 20000 });

  const poData = await page.evaluate(async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    const res = await fetch('/api/v1/procurement/purchase-orders', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    return await res.json();
  });
  console.log('PO Data:', JSON.stringify(poData, null, 2));
  await browser.close();
})();

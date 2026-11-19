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

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('Browser Error:', msg.text());
  });

  console.log('Logging in...');
  await page.goto('https://maxp.online/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'tester@maxp.com');
  await page.fill('input[type="password"]', 'tester@maxp.com');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(4000);
  console.log('After login URL:', page.url());

  console.log('Navigating to PO page...');
  await page.goto('https://maxp.online/procurement/purchase-orders', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  console.log('PO URL:', page.url());

  const bodyText = await page.innerText('body');
  console.log('Body snippet:\n', bodyText.slice(0, 500));

  await page.screenshot({ path: 'screenshots/inspect_po_live.png' });
  console.log('Screenshot saved to screenshots/inspect_po_live.png');

  await browser.close();
})();

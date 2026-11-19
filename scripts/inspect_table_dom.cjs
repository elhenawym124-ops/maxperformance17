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
  await page.goto('https://maxp.online/procurement/purchase-orders', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button:has-text("أمر شراء جديد")', { timeout: 15000 });
  await page.waitForTimeout(2000);

  const rowHtml = await page.evaluate(() => {
    const tr = document.querySelector('table tbody tr');
    return tr ? tr.innerHTML : 'No TR found!';
  });
  console.log('TR InnerHTML:\n', rowHtml);

  // Also check if mobile cards are displayed instead of table
  const cardsHtml = await page.evaluate(() => {
    const cards = document.querySelectorAll('.grid.md\\:hidden > *');
    return Array.from(cards).map(c => c.outerHTML.slice(0, 150));
  });
  console.log('Mobile Cards found:', cardsHtml.length);

  await browser.close();
})();

const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu',
      '--host-resolver-rules=MAP maxp.online 104.21.52.106, MAP *.maxp.online 104.21.52.106',
      '--disable-features=DnsOverHttps'
    ]
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://maxp.online/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', 'tester@maxp.com');
  await page.fill('input[type="password"]', 'tester@maxp.com');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  
  await page.goto('https://maxp.online/procurement/purchase-orders', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=PO-000007');
  console.log('Before click URL:', page.url());
  
  const el = await page.$('text=PO-000007');
  console.log('Element found:', !!el);
  console.log('Element tag:', await el.evaluate(e => e.tagName));
  console.log('Element parent tag:', await el.evaluate(e => e.parentElement.tagName));
  await el.click();
  await page.waitForTimeout(3000);
  console.log('After click URL:', page.url());
  await browser.close();
})();

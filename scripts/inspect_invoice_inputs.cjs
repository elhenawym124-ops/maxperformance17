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
  
  await page.goto('https://maxp.online/procurement/purchase-invoices/new?purchaseOrderId=cmvldzlkq007xju9ss348z8zv', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  const values = await page.$$eval('input, textarea', inputs => inputs.map(i => ({ tag: i.tagName, name: i.name, value: i.value, placeholder: i.placeholder })));
  console.log('INPUT VALUES IN INVOICE FORM:');
  console.log(JSON.stringify(values.filter(v => v.value), null, 2));
  await browser.close();
})();

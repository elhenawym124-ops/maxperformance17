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
  
  await page.goto('https://maxp.online/procurement/purchase-invoices/cmvlh8jdh0030juhzfwnjofvq', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  const allPrintOnly = await page.$$eval('.print-only', els => els.map(e => e.textContent.trim()));
  console.log('PRINT-ONLY ELEMENTS COUNT:', allPrintOnly.length);
  allPrintOnly.forEach((t, i) => console.log(`[#${i}]: ${t}`));
  await browser.close();
})();

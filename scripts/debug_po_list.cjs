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

  page.on('response', res => {
    if (res.url().includes('/api/')) {
      console.log(`API [${res.status()}] ${res.url()}`);
    }
  });

  await page.goto('https://maxp.online/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', 'tester@maxp.com');
  await page.fill('input[type="password"]', 'tester@maxp.com');
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 20000 });
  console.log('Logged in. Current URL:', page.url());

  console.log('Navigating to purchase-orders...');
  await page.goto('https://maxp.online/procurement/purchase-orders', { waitUntil: 'networkidle', timeout: 25000 });
  const text = await page.innerText('body');
  console.log('BODY TEXT PREVIEW:\n', text.slice(0, 1500));
  await browser.close();
})();

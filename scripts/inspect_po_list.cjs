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

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('https://maxp.online/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'tester@maxp.com');
  await page.fill('input[type="password"]', 'tester@maxp.com');
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.pathname.includes('/login'));

  await page.goto('https://maxp.online/procurement/purchase-orders', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Capture list screenshot
  await page.screenshot({ path: 'screenshots/po_list_page.png', fullPage: true });

  const rows = await page.evaluate(() => {
    const trs = Array.from(document.querySelectorAll('tr, [role="row"], table tbody tr'));
    return trs.map(tr => ({
      text: tr.innerText.trim().replace(/\s+/g, ' ').slice(0, 100),
      links: Array.from(tr.querySelectorAll('a')).map(a => a.href)
    }));
  });

  console.log('Found table rows:', JSON.stringify(rows.slice(0, 10), null, 2));

  // Also query API directly in browser
  const apiData = await page.evaluate(async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const res = await fetch('/api/procurement/purchase-orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      return json;
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log('API response purchase-orders:', JSON.stringify(apiData).slice(0, 500));

  await browser.close();
})();

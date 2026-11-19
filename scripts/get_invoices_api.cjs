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
  
  // Go to purchase invoices so React app initializes
  await page.goto('https://maxp.online/procurement/purchase-invoices', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const invoices = await page.evaluate(async () => {
    // Get token from localStorage
    const keys = Object.keys(localStorage);
    let token = '';
    for (const k of keys) {
      if (k.toLowerCase().includes('token')) {
        token = localStorage.getItem(k);
        break;
      }
    }
    const r = await fetch('/api/v1/procurement/purchase-invoices', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    return await r.json();
  });

  console.log('API RESPONSE:', JSON.stringify(invoices, null, 2));

  // If there are invoices, navigate to the first one
  const list = invoices.invoices || invoices.data || [];
  if (Array.isArray(list) && list.length > 0) {
    const first = list[0];
    console.log(`Directly navigating to invoice detail: https://maxp.online/procurement/purchase-invoices/${first.id}`);
    await page.goto(`https://maxp.online/procurement/purchase-invoices/${first.id}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const bodyText = await page.innerText('body');
    console.log('HAS فاتورة شراء توريد:', bodyText.includes('فاتورة شراء توريد'));
    console.log('HAS المحاسب المسؤول:', bodyText.includes('المحاسب المسؤول'));
    console.log('HAS المدير المالي:', bodyText.includes('المدير المالي'));
    console.log('HAS المورد:', bodyText.includes('المورد'));

    await page.screenshot({ path: 'screenshots/live_invoice_direct_detail.png', fullPage: false });
    console.log('Saved screenshot: screenshots/live_invoice_direct_detail.png');

    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/live_invoice_direct_print.png', fullPage: true });
    console.log('Saved print screenshot: screenshots/live_invoice_direct_print.png');
  } else {
    console.log('No invoices returned from API.');
  }

  await browser.close();
})();

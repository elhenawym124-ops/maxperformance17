const { chromium } = require('playwright');
const path = require('path');

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

  console.log('1. Logging in...');
  await page.goto('https://maxp.online/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'tester@maxp.com');
  await page.fill('input[type="password"]', 'tester@maxp.com');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/apps**', { timeout: 20000 });
  console.log('2. Landed on /apps!');

  console.log('3. Fetching purchase orders from API in browser context...');
  const ordersResponse = await page.evaluate(async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    const res = await fetch('/api/v1/procurement/purchase-orders', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return { status: res.status, json: await res.json() };
  });

  console.log('API Status:', ordersResponse.status);
  const orders = ordersResponse.json?.data?.orders || ordersResponse.json?.data || [];
  console.log('Orders found in API:', orders.length);

  const targetPoId = 'cmvldzlkq007xju9ss348z8zv';
  console.log(`4. Navigating to detail page of PO-000007: /procurement/purchase-orders/${targetPoId} ...`);
  await page.goto(`https://maxp.online/procurement/purchase-orders/${targetPoId}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const detailShot = path.resolve('screenshots', 'verified_po_detail.png');
  await page.screenshot({ path: detailShot, fullPage: true });
  console.log('📸 Detail screenshot saved:', detailShot);

  const detailText = await page.innerText('body');
  console.log('Detail Screen has Order Number PO-000007:', detailText.includes('PO-000007'));
  console.log('Detail Screen has Supplier Name (ابو عبدالكريم):', detailText.includes('ابو عبدالكريم'));
  console.log('Detail Screen has Total Amount (1,282):', detailText.includes('1,282') || detailText.includes('1282'));

  console.log('5. Emulating print media...');
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(2000);

  const printShot = path.resolve('screenshots', 'verified_po_print.png');
  await page.screenshot({ path: printShot, fullPage: true });
  console.log('📸 Print emulation screenshot saved:', printShot);

  const printText = await page.innerText('body');
  console.log('Printed Document Header Present:', printText.includes('أمر شراء توريد') || printText.includes('PURCHASE ORDER'));
  console.log('Signatures Block Present:', printText.includes('إعداد مسؤول المشتريات') && printText.includes('اعتماد الإدارة المالية'));
  console.log('Supplier Confirmation Block Present:', printText.includes('تأكيد واستلام المورد'));
  console.log('Order Number in Printout:', printText.includes('PO-000007'));
  console.log('Total Amount in Printout:', printText.includes('1,282') || printText.includes('1282'));

  // Now test creating a new purchase order
  console.log('6. Navigating to /procurement/purchase-orders/new to test creation...');
  await page.emulateMedia({ media: 'screen' });
  await page.goto('https://maxp.online/procurement/purchase-orders/new', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const newFormShot = path.resolve('screenshots', 'verified_po_new_form.png');
  await page.screenshot({ path: newFormShot, fullPage: true });
  console.log('📸 New form screenshot saved:', newFormShot);

  const formText = await page.innerText('body');
  console.log('Form Header Present:', formText.includes('إنشاء أمر شراء') || formText.includes('طلب شراء جديد'));

  console.log('🎉 Verification run completed successfully!');
  await browser.close();
})();

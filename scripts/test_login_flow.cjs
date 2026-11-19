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

  page.on('console', msg => console.log(`[PAGE LOG ${msg.type()}]:`, msg.text()));
  page.on('response', res => {
    if (res.url().includes('/auth') || res.url().includes('/login') || res.status() >= 400) {
      console.log(`[NET ${res.status()}]:`, res.url());
    }
  });

  console.log('Navigating to /login ...');
  await page.goto('https://maxp.online/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  console.log('Initial URL:', page.url());
  console.log('Waiting for login inputs to render...');
  await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 20000 });

  const inputs = await page.$$eval('input', els => els.map(e => ({ name: e.name, type: e.type, placeholder: e.placeholder, id: e.id })));
  console.log('Inputs found:', inputs);

  const buttons = await page.$$eval('button', els => els.map(e => ({ text: e.innerText.trim(), type: e.type })));
  console.log('Buttons found:', buttons);

  if (inputs.some(i => i.type === 'email' || i.name === 'email')) {
    await page.fill('input[type="email"], input[name="email"]', 'tester@maxp.com');
    await page.fill('input[type="password"], input[name="password"]', 'tester@maxp.com');
    await page.screenshot({ path: 'screenshots/login_filled.png' });

    const submitBtn = await page.$('button[type="submit"], button:has-text("دخول"), button:has-text("تسجيل الدخول")');
    if (submitBtn) {
      console.log('Clicking submit button...');
      await submitBtn.click();
    } else {
      console.log('Pressing Enter...');
      await page.keyboard.press('Enter');
    }

    await page.waitForTimeout(5000);
    console.log('URL after submit:', page.url());
    await page.screenshot({ path: 'screenshots/login_after_submit.png' });

    console.log('📦 Navigating to /procurement/purchase-orders ...');
    await page.goto('https://maxp.online/procurement/purchase-orders', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'screenshots/tester_verified_list.png', fullPage: true });
    const listText = await page.innerText('body');
    console.log('List loaded successfully! Items present:', listText.includes('PO-000007') || listText.includes('PO-000005'));

    console.log('➕ Navigating to /procurement/purchase-orders/new ...');
    await page.goto('https://maxp.online/procurement/purchase-orders/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'screenshots/tester_verified_form.png', fullPage: true });
    const formText = await page.innerText('body');
    console.log('Form loaded successfully! Form title present:', formText.includes('إنشاء أمر شراء') || formText.includes('طلب شراء جديد'));

    console.log('🖨️ Navigating to /procurement/purchase-orders/cmvldzlkq007xju9ss348z8zv ...');
    await page.goto('https://maxp.online/procurement/purchase-orders/cmvldzlkq007xju9ss348z8zv', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'screenshots/tester_verified_detail.png', fullPage: true });
    const detailText = await page.innerText('body');
    console.log('Detail loaded successfully! Order Number present:', detailText.includes('PO-000007'));
    console.log('Detail Total present:', detailText.includes('1,282') || detailText.includes('1282'));

    console.log('🖨️ Emulating print media...');
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/tester_verified_print.png', fullPage: true });

    const printText = await page.innerText('body');
    console.log('Print verified:', {
      hasHeader: printText.includes('أمر شراء توريد') || printText.includes('PURCHASE ORDER'),
      hasSignatures: printText.includes('إعداد مسؤول المشتريات') && printText.includes('اعتماد الإدارة المالية'),
      hasSupplierConfirm: printText.includes('تأكيد واستلام المورد'),
      hasOrderNumber: printText.includes('PO-000007'),
      hasTotal: printText.includes('1,282') || printText.includes('1282')
    });

    const cookies = await context.cookies();
    console.log('Cookies:', cookies.map(c => c.name));
    const localStorageData = await page.evaluate(() => JSON.stringify(window.localStorage));
    console.log('LocalStorage keys:', Object.keys(JSON.parse(localStorageData || '{}')));
  }

  await browser.close();
})();

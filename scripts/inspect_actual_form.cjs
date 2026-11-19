const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://127.0.0.1:3002/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'tester@maxp.com');
  await page.fill('input[type="password"]', 'tester@maxp.com');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => localStorage.getItem('token') !== null && !window.location.pathname.includes('/login'));
  console.log('Logged in successfully!');

  await page.evaluate(() => { window.location.pathname = '/procurement/purchase-orders/new'; });

  // wait until the loading text is gone
  console.log('Waiting for loading to finish...');
  await page.waitForFunction(() => {
    const text = document.body.innerText || '';
    return !text.includes('جاري تحميل بيانات أمر الشراء');
  }, { timeout: 20000 });

  await page.waitForTimeout(2000);

  const text = await page.evaluate(() => document.body.innerText);
  console.log('--- PAGE TEXT ---');
  console.log(text.slice(0, 1500));
  console.log('-----------------');

  const buttons = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).map(b => ({
      text: b.innerText.trim(),
      classes: b.className
    })).filter(b => b.text)
  );
  console.log('BUTTONS FOUND:', buttons);

  const inputs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
      tag: el.tagName,
      placeholder: el.placeholder,
      name: el.name,
      value: el.value
    }))
  );
  console.log('INPUTS FOUND:', inputs);

  await page.screenshot({ path: 'screenshots/actual_form_state.png', fullPage: true });
  await browser.close();
})();

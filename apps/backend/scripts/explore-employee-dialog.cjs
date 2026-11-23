const { chromium } = require('playwright');
const BASE = 'https://maxp.online';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#email', 'trial.hr@maxp.test');
  await page.fill('#password', 'Maxp@2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(9000);
  await page.goto(`${BASE}/hr/employees`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4500);
  await page.locator('main button:has-text("إضافة موظف")').first().click();
  await page.waitForTimeout(2500);
  const dlg = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    return {
      buttons: [...d.querySelectorAll('button')].map((b) => ({
        t: (b.innerText || '').trim(),
        type: b.type,
        cls: b.className.slice(0, 40),
      })),
      selects: [...d.querySelectorAll('select')].map((s, i) => ({
        i,
        opts: [...s.options].slice(0, 3).map((o) => o.text.slice(0, 24)),
        prev: (s.previousElementSibling?.textContent || '').slice(0, 24),
      })),
    };
  });
  console.log(JSON.stringify(dlg, null, 1).slice(0, 2500));
  await browser.close();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

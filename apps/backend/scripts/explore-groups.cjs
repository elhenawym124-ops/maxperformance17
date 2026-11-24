const { chromium } = require('playwright');
const BASE = 'https://maxp.online';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#email', 'trial.owner@maxp.test');
  await page.fill('#password', 'Maxp@2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(9000);

  for (const p of ['/admin/education/groups', '/admin/education/sessions']) {
    await page.goto(BASE + p, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    const info = await page.evaluate(() => {
      const main = document.querySelector('main');
      return {
        head: (main?.innerText || '').replace(/\s+/g, ' ').slice(0, 240),
        buttons: [...(main?.querySelectorAll('button') ?? [])].map((b) => (b.innerText || '').trim()).filter(Boolean).slice(0, 14),
      };
    });
    console.log('=== ' + p + ' ===');
    console.log(JSON.stringify(info, null, 1).slice(0, 1000));
  }

  // افتح نافذة إنشاء مجموعة
  await page.goto(BASE + '/admin/education/groups', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4500);
  const add = page.locator('main button').filter({ hasText: /مجموعة|جديد/ }).first();
  if (await add.count()) {
    await add.click();
    await page.waitForTimeout(2500);
    const dlg = await page.evaluate(() => {
      const ds = [...document.querySelectorAll('[role="dialog"]')];
      const ov = [...document.querySelectorAll('[class*="fixed"]')].find((e) => /مجموعة/.test(e.innerText || '') && e.querySelector('input,select'));
      const d = ds[ds.length - 1] || ov;
      if (!d) return { none: true };
      return {
        text: d.innerText.replace(/\s+/g, ' ').slice(0, 320),
        fields: [...d.querySelectorAll('input,select,textarea')].map((e, i) => ({ i, tag: e.tagName, type: e.type, ph: e.placeholder })),
        buttons: [...d.querySelectorAll('button')].map((b) => (b.innerText || '').trim()).filter(Boolean),
      };
    });
    console.log('GROUP DIALOG:', JSON.stringify(dlg).slice(0, 1500));
  } else console.log('no add group button');

  await browser.close();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

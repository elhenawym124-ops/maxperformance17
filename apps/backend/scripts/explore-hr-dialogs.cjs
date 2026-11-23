const { chromium } = require('playwright');
const BASE = 'https://maxp.online';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.fill('#email', 'trial.hr@maxp.test');
  await page.fill('#password', 'Maxp@2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(9000);

  for (const path of ['/hr/departments', '/hr/positions', '/hr/employees']) {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4500);
    const info = await page.evaluate(() => {
      const main = document.querySelector('main');
      const buttons = [...(main?.querySelectorAll('button') ?? [])]
        .map((b) => (b.innerText || b.getAttribute('aria-label') || '').trim())
        .filter(Boolean)
        .slice(0, 14);
      return {
        head: (main?.innerText || '').replace(/\s+/g, ' ').slice(0, 220),
        buttons,
        dialogs: document.querySelectorAll('[role="dialog"]').length,
      };
    });
    console.log('=== ' + path + ' ===');
    console.log(JSON.stringify(info, null, 1));

    // click the "add" button (first primary) and dump dialog
    const addBtn = page.locator('main button').filter({ hasText: /إضافة|جديد/ }).first();
    if (await addBtn.count()) {
      await addBtn.click();
      await page.waitForTimeout(2500);
      const dlg = await page.evaluate(() => {
        const d = document.querySelector('[role="dialog"]');
        if (!d) return { found: false };
        return {
          found: true,
          text: d.innerText.replace(/\s+/g, ' ').slice(0, 300),
          fields: [...d.querySelectorAll('input,select,textarea')].map((e, i) => ({
            i,
            tag: e.tagName,
            type: e.type || '',
            ph: e.placeholder || '',
            name: e.name || '',
          })),
          buttons: [...d.querySelectorAll('button')].map((b) => (b.innerText || '').trim()).filter(Boolean),
        };
      });
      console.log('dialog:', JSON.stringify(dlg).slice(0, 1600));
      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);
    } else {
      console.log('no add button found');
    }
  }

  await browser.close();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

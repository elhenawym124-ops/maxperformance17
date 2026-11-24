const { chromium } = require('playwright');
const BASE = 'https://maxp.online';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 120)));

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#email', 'trial.marketing@maxp.test');
  await page.fill('#password', 'Maxp@2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(9000);

  const txt = () => page.evaluate(() => (document.querySelector('main')?.innerText || '').replace(/\s+/g, ' '));

  await page.goto(`${BASE}/advertising/facebook-ads/campaigns`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  const list = await txt();
  const listInfo = {
    rows: await page.locator('main table tbody tr').count(),
    hasAccountWarning: /اربط|اختر حساب|لا يوجد حساب|حساب إعلاني/.test(list),
    head: list.slice(0, 260),
  };

  await page.goto(`${BASE}/advertising/facebook-ads/campaigns/create`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  const createTxt = await txt();
  const form = await page.evaluate(() => {
    const main = document.querySelector('main');
    return {
      fields: [...(main?.querySelectorAll('input,select,textarea') ?? [])].slice(0, 16).map((e, i) => ({ i, tag: e.tagName, type: e.type, ph: e.placeholder })),
      buttons: [...(main?.querySelectorAll('button') ?? [])].map((b) => (b.innerText || '').trim()).filter(Boolean).slice(0, 14),
      text: (main?.innerText || '').replace(/\s+/g, ' ').slice(0, 300),
    };
  });

  console.log(JSON.stringify({ listInfo, form, consoleErrors: errors.slice(0, 5) }, null, 1).slice(0, 2600));
  await page.screenshot({ path: 'docs/qa/trial-14d/evidence/55-day8-campaign-create.png' });
  await browser.close();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

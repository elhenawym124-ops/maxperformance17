const { chromium } = require('playwright');
const BASE = 'https://maxp.online';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const reqs = [];
  page.on('request', (r) => {
    if (r.url().includes('/education/groups') && r.method() === 'POST') reqs.push({ url: r.url(), body: (r.postData() || '').slice(0, 200) });
  });
  page.on('response', async (r) => {
    if (r.url().includes('/education/groups') && r.request().method() === 'POST') {
      reqs.push({ status: r.status(), body: (await r.text().catch(() => '')).slice(0, 200) });
    }
  });

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#email', 'trial.owner@maxp.test');
  await page.fill('#password', 'Maxp@2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(9000);
  await page.goto(`${BASE}/admin/education/groups`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  await page.locator('main button:has-text("إنشاء مجموعة جديدة")').first().click();
  await page.waitForTimeout(2500);
  const preset = page.locator('button:has-text("سبت وثلاثاء")').first();
  if (await preset.count()) { await preset.click({ force: true }); await page.waitForTimeout(1200); }

  await page.evaluate(() => {
    const ov = [...document.querySelectorAll('[class*="fixed"]')].find((e) => /إنشاء مجموعة/.test(e.innerText || '') && e.querySelector('input'));
    const setVal = (el, v) => {
      const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set;
      setter.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const inputs = [...ov.querySelectorAll('input')];
    setVal(inputs[0], 'مجموعة اختبار 2');
    setVal(inputs[1], 'GRP-' + Date.now().toString().slice(-4));
    const cap = inputs.find((i) => i.type === 'number');
    if (cap) setVal(cap, '10');
  });
  await page.waitForTimeout(800);

  const state = await page.evaluate(() => {
    const ov = [...document.querySelectorAll('[class*="fixed"]')].find((e) => /إنشاء مجموعة/.test(e.innerText || '') && e.querySelector('input'));
    const btns = [...ov.querySelectorAll('button')].map((b) => ({ t: (b.innerText || '').trim(), disabled: b.disabled, type: b.type }));
    return { btns: btns.slice(-6) };
  });

  const btn = page.locator('button:has-text("إنشاء المجموعة")').last();
  await btn.click({ force: true });
  await page.waitForTimeout(6000);
  console.log(JSON.stringify({ state, reqs }, null, 1).slice(0, 1400));
  await browser.close();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

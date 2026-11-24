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
  await page.goto(`${BASE}/admin/education/groups`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  await page.locator('main button:has-text("إنشاء مجموعة جديدة")').first().click();
  await page.waitForTimeout(2500);

  // اضغط قالب المواعيد الجاهز
  const preset = page.locator('button:has-text("سبت وثلاثاء")').first();
  if (await preset.count()) {
    await preset.click({ force: true });
    await page.waitForTimeout(1500);
  }

  const filled = await page.evaluate(() => {
    const ov = [...document.querySelectorAll('[class*="fixed"]')].find((e) => /إنشاء مجموعة/.test(e.innerText || '') && e.querySelector('input'));
    if (!ov) return { ok: false };
    const setVal = (el, v) => {
      const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set;
      setter.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const inputs = [...ov.querySelectorAll('input')];
    setVal(inputs[0], 'مجموعة اختبار المواعيد');
    setVal(inputs[1], 'GRP-' + Date.now().toString().slice(-4));
    const cap = inputs.find((i) => i.type === 'number');
    if (cap) setVal(cap, '10');
    const sels = [...ov.querySelectorAll('select')];
    const teacher = sels[0];
    if (teacher?.options[1]) {
      teacher.value = teacher.options[1].value;
      teacher.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return { times: [...ov.querySelectorAll('input[type="time"]')].map((t) => t.value), dates: [...ov.querySelectorAll('input[type="date"]')].map((d) => d.value) };
  });
  await page.waitForTimeout(1000);

  const btn = page.locator('button:has-text("إنشاء المجموعة")').last();
  await btn.scrollIntoViewIfNeeded().catch(() => {});
  await btn.click({ force: true });
  await page.waitForTimeout(5000);

  const res = await page.evaluate(() => {
    const ov = [...document.querySelectorAll('[class*="fixed"]')].find((e) => /إنشاء مجموعة/.test(e.innerText || '') && e.querySelector('input'));
    const t = (document.body.innerText || '').replace(/\s+/g, ' ');
    const errs = [...document.querySelectorAll('.text-destructive, [class*="text-red"]')].map((e) => e.textContent?.trim()).filter(Boolean).slice(0, 6);
    const toasts = [...document.querySelectorAll('[data-sonner-toast]')].map((e) => e.innerText.replace(/\s+/g, ' ').slice(0, 90));
    return { dialogOpen: Boolean(ov), errs, toasts, created: t.includes('مجموعة اختبار المواعيد') };
  });
  console.log(JSON.stringify({ filled, res }, null, 1).slice(0, 1200));
  await browser.close();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

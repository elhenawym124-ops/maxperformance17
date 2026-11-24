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

  // groups dialog: required fields + validation after submit
  await page.goto(`${BASE}/admin/education/groups`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  await page.locator('main button:has-text("إنشاء مجموعة جديدة")').first().click();
  await page.waitForTimeout(2500);
  const required = await page.evaluate(() => {
    const ov = [...document.querySelectorAll('[class*="fixed"]')].find((e) => /إنشاء مجموعة/.test(e.innerText || '') && e.querySelector('input'));
    if (!ov) return 'no dialog';
    const labels = [...ov.querySelectorAll('label')].map((l) => l.innerText.replace(/\s+/g, ' ').trim()).slice(0, 14);
    const requiredMarks = [...ov.querySelectorAll('label')].filter((l) => /\\*/.test(l.innerText)).map((l) => l.innerText.replace(/\s+/g, ' ').trim());
    const texts = ov.innerText.replace(/\s+/g, ' ').slice(0, 400);
    return { labels, requiredMarks, texts };
  });
  console.log('GROUP REQUIRED:', JSON.stringify(required).slice(0, 900));

  // sessions: visibility of confirm buttons
  await page.goto(`${BASE}/admin/education/sessions`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const vis = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button[aria-label="تأكيد الحصة"]')];
    return btns.slice(0, 4).map((b) => ({
      visible: Boolean(b.offsetParent),
      rect: b.getBoundingClientRect().toJSON(),
      rowText: (b.closest('tr')?.innerText || '').replace(/\s+/g, ' ').slice(0, 60),
    }));
  });
  console.log('CONFIRM BUTTONS:', JSON.stringify(vis, null, 1).slice(0, 900));

  await browser.close();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

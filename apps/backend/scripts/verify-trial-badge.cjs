const { chromium } = require('playwright');
const BASE = 'https://maxp.online';

const readBadge = () =>
  [...document.querySelectorAll('a[href="/subscription"]')]
    .map((a) => (a.textContent || '').replace(/\s+/g, ' ').trim())
    .find((t) => t.includes('التجربة')) || null;

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.fill('#email', 'trial.owner@maxp.test');
  await page.fill('#password', 'Maxp@2026');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/apps|company-dashboard/, { timeout: 60000 });
  await page.waitForTimeout(6000);

  const results = {};
  for (const [path, shot] of [
    ['/apps', 'docs/qa/trial-14d/evidence/42-day1-trial-badge.png'],
    ['/hr', 'docs/qa/trial-14d/evidence/43-trial-badge-hr.png'],
  ]) {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);
    results[path] = await page.evaluate(readBadge);
    await page.screenshot({ path: shot });
  }

  // موبايل: الشارة مخفية تحت sm (توفير مساحة) — نتأكد فقط لا يوجد تمرير أفقي
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(2500);
  results.mobileOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 2,
  );

  console.log(JSON.stringify(results, null, 1));
  await browser.close();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

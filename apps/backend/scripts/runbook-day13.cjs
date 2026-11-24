/**
 * Runbook Day 13 — الأداء والموبايل
 *   node apps/backend/scripts/runbook-day13.cjs
 * لكل شاشة: 390px overflow · LCP · RTL · أخطاء Console
 */
const { chromium } = require('playwright');

const BASE = 'https://maxp.online';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PAGES = [
  ['/apps', 'لوحة التطبيقات'],
  ['/hr', 'لوحة HR'],
  ['/hr/employees', 'الموظفون'],
  ['/hr/attendance', 'الحضور'],
  ['/hr/payroll', 'الرواتب'],
  ['/admin/education/dashboard', 'لوحة التعليم'],
  ['/admin/education/students', 'الطلاب'],
  ['/coupons', 'الكوبونات'],
  ['/tasks', 'المهام'],
  ['/customers', 'العملاء'],
];

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => {
    window.__lcp = 0;
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) window.__lcp = Math.round(last.startTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      /* unsupported */
    }
  });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#email', 'trial.owner@maxp.test');
  await page.fill('#password', 'Maxp@2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(9000);

  const results = [];
  for (const [path, label] of PAGES) {
    const errors = [];
    const onErr = (m) => m.type() === 'error' && errors.push(m.text().slice(0, 80));
    page.on('console', onErr);
    const started = Date.now();
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4500);
    const loadMs = Date.now() - started;

    const m = await page.evaluate(() => {
      const doc = document.documentElement;
      const lcp = performance.getEntriesByType('largest-contentful-paint').slice(-1)[0];
      const nav = performance.getEntriesByType('navigation')[0];
      return {
        overflowX: doc.scrollWidth > window.innerWidth + 2,
        scrollW: doc.scrollWidth,
        vw: window.innerWidth,
        dir: doc.getAttribute('dir'),
        lcp: window.__lcp || (lcp ? Math.round(lcp.startTime) : null),
        domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
        tabular: document.querySelectorAll('.tabular-nums, [class*="tabular-nums"]').length,
      };
    });
    page.off('console', onErr);
    results.push({ path, label, ...m, loadMs, errors: errors.length });
    console.log(
      `${m.overflowX ? 'OVERFLOW' : 'OK'} · ${path} · ${label} · LCP ${m.lcp ?? '-'}ms · DOM ${m.domContentLoaded ?? '-'}ms · tabular ${m.tabular} · errors ${errors.length}`,
    );
  }

  const overflow = results.filter((r) => r.overflowX);
  const errs = results.filter((r) => r.errors > 0);
  const noRtl = results.filter((r) => r.dir !== 'rtl');
  const slowLcp = results.filter((r) => (r.lcp ?? 0) > 2500);

  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify({
    pages: results.length,
    overflowPages: overflow.map((r) => r.path),
    consoleErrorPages: errs.map((r) => `${r.path}(${r.errors})`),
    nonRtlPages: noRtl.map((r) => r.path),
    lcpOver2500: slowLcp.map((r) => `${r.path}:${r.lcp}ms`),
    avgLcp: Math.round(results.reduce((a, r) => a + (r.lcp || 0), 0) / results.length),
  }, null, 1));

  await page.screenshot({ path: 'docs/qa/trial-14d/evidence/59-day13-mobile.png' });
  await ctx.close();
  await browser.close();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

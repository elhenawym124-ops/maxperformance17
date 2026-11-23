const { chromium } = require('playwright');
const BASE = 'https://maxp.online';

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
  await page.waitForTimeout(7000);

  const info = await page.evaluate(async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    const res = await fetch('/api/v1/companies/current?_ts=' + Date.now(), {
      headers: { Authorization: 'Bearer ' + token },
    });
    const j = await res.json();
    const text = (document.body.innerText || '').replace(/\s+/g, ' ');
    return {
      header: /شحن المحفظة/.test(text),
      subscribeLinks: [...document.querySelectorAll('a[href="/subscription"]')].length,
      trialWords: (text.match(/التجربة[^|]{0,20}/g) || []).slice(0, 3),
      api: {
        trialEndsAt: j?.data?.trialEndsAt,
        days: j?.data?.trialDaysRemaining,
        mode: j?.data?.trialModeEnabled,
      },
    };
  });

  console.log(JSON.stringify(info, null, 1));
  await browser.close();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

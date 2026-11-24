const { chromium } = require('playwright');
const BASE = 'https://maxp.online';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 90)));

  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#email', 'trial.owner@maxp.test');
  await page.fill('#password', 'Maxp@2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(9000);

  const shots = [
    ['/admin/education/dashboard', '60-final-education-dashboard.png'],
    ['/admin/education/students', '61-final-students.png'],
    ['/hr', '62-final-hr-dashboard.png'],
    ['/hr/employees', '63-final-employees.png'],
  ];
  const results = [];
  for (const [path, file] of shots) {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6000);
    const txt = await page.evaluate(() => (document.querySelector('main')?.innerText || '').replace(/\s+/g, ' ').slice(0, 160));
    await page.screenshot({ path: `docs/qa/trial-14d/evidence/${file}` });
    results.push({ path, head: txt });
  }
  console.log(JSON.stringify({ results, consoleErrors: errors.slice(0, 4) }, null, 1).slice(0, 1400));
  await browser.close();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

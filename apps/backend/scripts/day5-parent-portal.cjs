/**
 * Day 5 — تحقق بوابة ولي الأمر للطالب الجديد
 *   node apps/backend/scripts/day5-parent-portal.cjs
 */
const { chromium } = require('playwright');

const BASE = 'https://maxp.online';
const API = `${BASE}/api/v1`;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function api(path, token, method = 'GET', body) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: r.status, json: await r.json().catch(() => null) };
}

(async () => {
  const login = await api('/auth/login', null, 'POST', {
    email: 'trial.owner@maxp.test',
    password: 'Maxp@2026',
  });
  const token = login.json.data.token;

  const students = await api('/education/students?limit=50', token);
  const list = students.json.data || students.json.students || [];
  const target = list.find((s) => /اليوم٥/.test(s.lastName || ''));
  if (!target) {
    console.log(JSON.stringify({ error: 'student not found' }));
    process.exit(1);
  }

  const link = await api('/education/parent-portal/activation-link', token, 'POST', {
    customerId: target.customerId,
  });
  const url = link.json?.data?.url || '';
  const actToken = url.split('token=')[1];
  const act = await api('/education/parent-portal/activate', null, 'POST', {
    token: actToken,
    password: 'Parent@2026',
  });

  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/parent/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#email', target.phone || '');
  await page.fill('#password', 'Parent@2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(9000);
  const txt = await page.evaluate(() => (document.querySelector('main')?.innerText || document.body.innerText || '').replace(/\s+/g, ' '));
  const childrenMatch = txt.match(/الأبناء المسجلين\s*(\d+)/);
  await page.screenshot({ path: 'docs/qa/trial-14d/evidence/52-day5-parent-portal.png' });

  console.log(
    JSON.stringify(
      {
        activateStatus: act.status,
        childSeen: /اليوم٥/.test(txt) || (childrenMatch ? Number(childrenMatch[1]) > 0 : false),
        children: childrenMatch?.[1] ?? 'n/a',
        url: page.url(),
      },
      null,
      1,
    ),
  );
  await browser.close();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

/**
 * Runbook Day 7 — مراجعة منتصف التجربة: مطابقة الأرقام بين 3 شاشات + الـAPI
 *   node apps/backend/scripts/runbook-day7.cjs
 */
const { chromium } = require('playwright');

const BASE = 'https://maxp.online';
const API = `${BASE}/api/v1`;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function token() {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'trial.owner@maxp.test', password: 'Maxp@2026' }),
  });
  return (await r.json())?.data?.token;
}
async function api(path, t) {
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${t}` } });
  return { status: r.status, json: await r.json().catch(() => null) };
}
const txt = (page) =>
  page.evaluate(() => (document.querySelector('main')?.innerText || '').replace(/\s+/g, ' '));

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#email', 'trial.owner@maxp.test');
  await page.fill('#password', 'Maxp@2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(9000);
  const t = await token();

  const out = { students: {}, sessions: {}, revenue: {} };

  // ---- الطلاب ----
  const apiStudents = await api('/education/students?limit=200', t);
  out.students.api = (apiStudents.json?.data || apiStudents.json?.students || []).length;

  await page.goto(`${BASE}/admin/education/students`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const sText = await txt(page);
  out.students.listPage = Number(sText.match(/من\s*(\d+)\s*طالب/)?.[1] ?? NaN);

  await page.goto(`${BASE}/admin/education/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const dText = await txt(page);
  out.students.dashboard = Number(dText.match(/الطلاب المسجلين\s*(\d+)/)?.[1] ?? NaN);

  // ---- الحصص ----
  const apiSessions = await api('/education/sessions?limit=200', t);
  out.sessions.api = (apiSessions.json?.data || apiSessions.json?.sessions || []).length;
  await page.goto(`${BASE}/admin/education/sessions`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const sesText = await txt(page);
  out.sessions.page = Number(sesText.match(/(\d+)\s*حصة/)?.[1] ?? NaN);
  await page.goto(`${BASE}/admin/education/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  const dText2 = await txt(page);
  out.sessions.dashboard = Number(dText2.match(/الحصص[^0-9]{0,20}(\d+)/)?.[1] ?? NaN);

  // ---- التحصيل ----
  const apiPay = await api('/education/payments?limit=200', t);
  const payRows = apiPay.json?.data || apiPay.json?.payments || [];
  out.revenue.apiPayments = payRows.length;
  out.revenue.apiSum = payRows.reduce((a, p) => a + Number(p.amount || 0), 0);

  const enr = await api('/education/enrollments?limit=200', t);
  const enrRows = enr.json?.data || enr.json?.enrollments || [];
  out.revenue.enrollments = enrRows.length;
  out.revenue.enrollmentPaid = enrRows.reduce((a, e) => a + Number(e.amountPaid || 0), 0);

  await page.goto(`${BASE}/admin/education/payments`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const payText = await txt(page);
  out.revenue.paymentsPage = (payText.match(/إجمالي[^0-9]{0,25}([\d,\.]+)/) || [])[1] ?? 'n/a';

  // ---- أخطاء الكونسول في الشاشات الثلاث ----
  const errs = [];
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 90)));
  for (const p of ['/admin/education/dashboard', '/admin/education/students', '/admin/education/sessions', '/admin/education/payments']) {
    await page.goto(BASE + p, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3500);
  }
  out.consoleErrors = errs.slice(0, 5);

  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

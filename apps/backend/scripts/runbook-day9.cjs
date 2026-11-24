/**
 * Runbook Day 9 — الكوبونات والبث (المسارات الصحيحة: /api/v1/coupons)
 *   node apps/backend/scripts/runbook-day9.cjs
 */
const { chromium } = require('playwright');

const BASE = 'https://maxp.online';
const API = `${BASE}/api/v1`;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const steps = [];
const record = (id, name, ok, detail) => {
  steps.push({ id, name, result: ok ? 'PASS' : 'FAIL', detail: String(detail ?? '').slice(0, 170) });
  console.log(`${ok ? 'PASS' : 'FAIL'} · ${id} · ${name} · ${String(detail ?? '').slice(0, 130)}`);
};

async function api(path, t, method = 'GET', body) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: r.status, json: await r.json().catch(() => null) };
}

(async () => {
  const login = await api('/auth/login', null, 'POST', {
    email: 'trial.marketing@maxp.test',
    password: 'Maxp@2026',
  });
  const t = login.json?.data?.token;

  // D9-1: القائمة
  const list = await api('/coupons?limit=20', t);
  const coupons = list.json?.data || [];
  record('D9-1', 'قائمة الكوبونات تعمل', list.status === 200, `${list.status} · ${coupons.length} كوبون`);

  // D9-2: إنشاء كوبون 10% بحد استخدام 1
  const code = `DAY9${Date.now().toString().slice(-5)}`;
  const now = new Date();
  const validTo = new Date(now.getTime() + 30 * 864e5);
  const created = await api('/coupons', t, 'POST', {
    code,
    name: 'كوبون اليوم التاسع',
    type: 'PERCENTAGE',
    value: 10,
    minOrderAmount: 100,
    usageLimit: 1,
    validFrom: now.toISOString(),
    validTo: validTo.toISOString(),
    isActive: true,
  });
  const couponId = created.json?.data?.id;
  record(
    'D9-2',
    'إنشاء كوبون (10% · حد استخدام 1)',
    created.status < 300 && Boolean(couponId),
    `${created.status} · ${code} · ${(created.json?.error || '').slice(0, 50)}`,
  );

  // D9-3: تطبيق (يحتاج couponId)
  const apply = await api('/coupons/apply', t, 'POST', { couponId, orderAmount: 500 });
  record(
    'D9-3',
    'تطبيق الكوبون على طلب 500 ج.م',
    apply.status < 300,
    `${apply.status} · ${JSON.stringify(apply.json?.data || apply.json).slice(0, 90)}`,
  );

  // D9-4: حد الاستخدام (usageLimit = 1)
  const over = await api('/coupons/apply', t, 'POST', { couponId, orderAmount: 500 });
  record(
    'D9-4',
    'الكوبون يحترم حد الاستخدام',
    over.status >= 400,
    `${over.status} · ${(over.json?.error || over.json?.message || 'قُبل رغم تجاوز الحد').slice(0, 70)}`,
  );

  // D9-5: معرّف غير موجود
  const bad = await api('/coupons/apply', t, 'POST', { couponId: 'does-not-exist', orderAmount: 500 });
  record('D9-5', 'كوبون غير موجود يعطي خطأ واضح', bad.status >= 400, `${bad.status} · ${(bad.json?.error || bad.json?.message || '').slice(0, 60)}`);

  // D9-6: الواجهة تعرض الكوبونات
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 110)));
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#email', 'trial.marketing@maxp.test');
  await page.fill('#password', 'Maxp@2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(9000);
  await page.goto(`${BASE}/coupons`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  const txt = await page.evaluate(() => (document.querySelector('main')?.innerText || '').replace(/\s+/g, ' '));
  record('D9-6', 'شاشة الكوبونات تعرض الكوبون الجديد', txt.includes(code), txt.slice(0, 110));

  // D9-7: البث
  await page.goto(`${BASE}/broadcast`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  const bTxt = await page.evaluate(() => (document.querySelector('main')?.innerText || '').replace(/\s+/g, ' '));
  record(
    'D9-7',
    'شاشة البث تعمل وتعرض حالة القنوات',
    /حملة جديدة|الحملات|الجمهور|واتساب|فيسبوك/.test(bTxt),
    bTxt.slice(0, 130),
  );

  record('D9-8', 'صفر أخطاء Console (كوبونات + بث)', errors.length === 0, `${errors.length} خطأ`);
  await page.screenshot({ path: 'docs/qa/trial-14d/evidence/56-day9-coupons-broadcast.png' });
  await ctx.close();
  await browser.close();

  const fails = steps.filter((s) => s.result === 'FAIL');
  console.log(`\nTOTAL ${steps.length} — PASS ${steps.length - fails.length} — FAIL ${fails.length}`);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

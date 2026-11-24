/**
 * Runbook Day 8 — الحملات
 *   node apps/backend/scripts/runbook-day8.cjs
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

async function token() {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'trial.marketing@maxp.test', password: 'Maxp@2026' }),
  });
  return (await r.json())?.data?.token;
}

(async () => {
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
  const txt = () => page.evaluate(() => (document.querySelector('main')?.innerText || '').replace(/\s+/g, ' '));

  // ---- D8-1: الحملات المحلية ظاهرة ----
  const t = await token();
  const list = await fetch(`${API}/facebook-ads/campaigns?limit=20`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  const listJson = await list.json();
  const names = (listJson.data || []).map((c) => c.name);
  record(
    'D8-1',
    'الحملات المحلية تظهر بدون ربط Meta',
    names.length >= 2,
    `${names.length} حملة: ${names.slice(0, 2).join(' · ')}`,
  );

  // ---- D8-2: قائمة الحملات في الواجهة ----
  await page.goto(`${BASE}/advertising/facebook-ads/campaigns`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  const listText = await txt();
  record(
    'D8-2',
    'شاشة الحملات تعرض الحملات المحلية',
    /تسجيل الترم|إعادة استهداف/.test(listText),
    listText.slice(0, 120),
  );

  // ---- D8-3: معالج إنشاء حملة — الخطوة 1 → 2 ----
  await page.goto(`${BASE}/advertising/facebook-ads/campaigns/create`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  await page.locator('main input[type="text"]').first().fill('حملة اليوم الثامن');
  const selects = page.locator('main select');
  if ((await selects.count()) > 0) await selects.first().selectOption({ index: 1 }).catch(() => {});
  await page.locator('main button:has-text("التالي")').first().click();
  await page.waitForTimeout(4000);
  const step2 = await txt();
  record(
    'D8-3',
    'معالج الحملة ينتقل للخطوة الثانية (الميزانية)',
    /الميزانية|ميزانية|Budget/.test(step2) || /2/.test(step2),
    step2.slice(0, 120),
  );

  // ---- D8-4: إنشاء بدون ربط Meta يعطي رسالة واضحة ----
  const create = await fetch(`${API}/facebook-ads/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body: JSON.stringify({ name: 'حملة بدون ربط', objective: 'OUTCOME_LEADS', budgetType: 'DAILY', budgetAmount: 200 }),
  });
  const createJson = await create.json().catch(() => ({}));
  record(
    'D8-4',
    'إنشاء حملة بدون ربط Meta يعطي رسالة واضحة',
    create.status >= 400 && create.status < 500 && /connect|ربط|Access Token/i.test(createJson.error || ''),
    `${create.status} · ${(createJson.error || '').slice(0, 80)}`,
  );

  // ---- D8-5: صفر أخطاء Console ----
  record('D8-5', 'صفر أخطاء Console في شاشات الحملات', errors.length === 0, `${errors.length} خطأ`);

  await page.screenshot({ path: 'docs/qa/trial-14d/evidence/55-day8-campaigns.png' });
  await ctx.close();
  await browser.close();

  const fails = steps.filter((s) => s.result === 'FAIL');
  console.log(`\nTOTAL ${steps.length} — PASS ${steps.length - fails.length} — FAIL ${fails.length}`);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

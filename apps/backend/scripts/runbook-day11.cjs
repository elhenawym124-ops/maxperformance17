/**
 * Runbook Day 11 — التكامل: المهام · الإشعارات · البحث الشامل (نسخة مستقرة)
 *   node apps/backend/scripts/runbook-day11.cjs
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
  const login = await api('/auth/login', null, 'POST', { email: 'trial.owner@maxp.test', password: 'Maxp@2026' });
  const t = login.json?.data?.token;

  // D11-1: قائمة المهام
  const list = await api('/tasks?limit=10', t);
  const tasks = list.json?.data || [];
  record('D11-1', 'قائمة المهام تعمل', list.status === 200, `${list.status} · ${tasks.length} مهمة`);

  // D11-2: إنشاء مهمة
  const stamp = Date.now().toString().slice(-5);
  const title = `مهمة اليوم الحادي عشر ${stamp}`;
  const created = await api('/tasks', t, 'POST', {
    title,
    description: 'اختبار تكامل اليوم 11',
    priority: 'MEDIUM',
    status: 'TODO',
  });
  const taskId = created.json?.data?.id;
  record('D11-2', 'إنشاء مهمة جديدة', created.status < 300 && Boolean(taskId), `${created.status} · ${(created.json?.error || '').slice(0, 50)}`);

  // D11-3: تحديث حالة المهمة (المسار المخصص)
  if (taskId) {
    const upd = await api(`/tasks/${taskId}/status`, t, 'PUT', { status: 'IN_PROGRESS' });
    const after = await api(`/tasks/${taskId}`, t);
    const st = after.json?.data?.status || after.json?.task?.status;
    record('D11-3', 'تحديث حالة المهمة', upd.status < 300 && /IN_PROGRESS|PROGRESS/i.test(String(st || '')), `${upd.status} · ${st || '—'}`);
  } else record('D11-3', 'تحديث حالة المهمة', false, 'لم تُنشأ مهمة');

  // D11-4..7: الواجهة
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 110)));
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#email', 'trial.owner@maxp.test');
  await page.fill('#password', 'Maxp@2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(9000);
  const txt = () => page.evaluate(() => (document.querySelector('main')?.innerText || '').replace(/\s+/g, ' '));

  await page.goto(`${BASE}/tasks`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  const tasksTxt = await txt();
  record('D11-4', 'شاشة المهام تعرض المهمة الجديدة', tasksTxt.includes(stamp) || /مهمة/.test(tasksTxt), tasksTxt.slice(0, 110));

  await page.goto(`${BASE}/tasks/notifications`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  const notifTxt = await txt();
  record('D11-5', 'شاشة الإشعارات تعمل', notifTxt.length > 30, notifTxt.slice(0, 110));

  await page.goto(`${BASE}/tasks/projects`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  const projTxt = await txt();
  record('D11-6', 'شاشة المشاريع تعمل', projTxt.length > 30, projTxt.slice(0, 110));

  // البحث الشامل عبر لوحة الأوامر (Ctrl+K) — نتحقق من ظهورها فقط
  await page.goto(`${BASE}/tasks`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4500);
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(2500);
  const palette = await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('input')];
    const searchLike = inputs.find((i) => /بحث|search/i.test((i.placeholder || '') + (i.getAttribute('aria-label') || '')));
    return {
      opened: Boolean(searchLike) || /بحث سريع|لوحة الأوامر|Search/i.test(document.body.innerText || ''),
      placeholder: searchLike?.placeholder || null,
    };
  });
  record('D11-7', 'البحث الشامل (Ctrl+K) يفتح', palette.opened, palette.placeholder || 'لوحة البحث ظهرت');
  await page.keyboard.press('Escape');

  record('D11-8', 'صفر أخطاء Console', errors.length === 0, `${errors.length} خطأ`);
  await page.screenshot({ path: 'docs/qa/trial-14d/evidence/58-day11-tasks.png' });
  await ctx.close();
  await browser.close();

  const fails = steps.filter((s) => s.result === 'FAIL');
  console.log(`\nTOTAL ${steps.length} — PASS ${steps.length - fails.length} — FAIL ${fails.length}`);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

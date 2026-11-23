/**
 * Runbook Day 4 — الرواتب
 *   node apps/backend/scripts/runbook-day4.cjs
 * 1) إنشاء/احتساب مسير 11/2026  2) إعادة الاحتساب (Overwrite) بلا تكرار
 * 3) الموظف يفتح كشف راتبه  4) التحقق اليدوي من صافي الراتب
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

async function apiLogin(email, password = 'Maxp@2026') {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const j = await r.json();
  return j?.data?.token;
}

async function session(browser, email) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.fill('#email', email);
  await page.fill('#password', 'Maxp@2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(9000);
  return { ctx, page };
}

const mainText = (page) =>
  page.evaluate(() => (document.querySelector('main')?.innerText || '').replace(/\s+/g, ' '));

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const SKIP_GEN = process.env.SKIP_GEN === '1';

  // ===== 1) مدير HR يحتسب المسير =====
  const hr = await session(browser, 'trial.hr@maxp.test');
  await hr.page.goto(`${BASE}/hr/payroll`, { waitUntil: 'domcontentloaded' });
  await hr.page.waitForTimeout(5000);
  const beforeText = await mainText(hr.page);
  const countBefore = Number(beforeText.match(/(\d+)\s*مسير/)?.[1] ?? 0);

  let countAfter = countBefore;
  if (!SKIP_GEN) {
    await hr.page.locator('main button:has-text("إنشاء مسير")').first().click();
    await hr.page.waitForTimeout(2500);
    const dlg = hr.page.locator('[role="dialog"]').first();
    if (await dlg.count()) {
      const startBtn = dlg.locator('button:has-text("بدء عملية الإعداد")').first();
      if (await startBtn.count()) await startBtn.click();
      await hr.page.waitForTimeout(12000);
    }
    const afterText = await mainText(hr.page);
    countAfter = Number(afterText.match(/(\d+)\s*مسير/)?.[1] ?? 0);
    record('D4-1', 'إنشاء/احتساب مسير 11/2026', countAfter > 0, `كشوف الرواتب: ${countBefore} → ${countAfter}`);

    // ===== 2) إعادة الاحتساب بلا تكرار =====
    const autoBtn = hr.page.locator('main button:has-text("احتساب تلقائي")').first();
    let retryDetail = 'لا يوجد زر احتساب تلقائي';
    if (await autoBtn.count()) {
      await autoBtn.click();
      await hr.page.waitForTimeout(3000);
      const d2 = hr.page.locator('[role="dialog"]').first();
      if (await d2.count()) {
        const run = d2.locator('button').filter({ hasText: /احتساب|بدء|تنفيذ|تشغيل/ }).last();
        if (await run.count()) await run.click();
        await hr.page.waitForTimeout(12000);
      }
      retryDetail = 'أُعيد الاحتساب';
    }
    const afterRetry = await mainText(hr.page);
    const countRetry = Number(afterRetry.match(/(\d+)\s*مسير/)?.[1] ?? 0);
    record('D4-2', 'إعادة الاحتساب لا تُنشئ كشوفًا مكررة', countRetry === countAfter, `${retryDetail} · كشوف: ${countAfter} → ${countRetry}`);
  }

  await hr.page.screenshot({ path: 'docs/qa/trial-14d/evidence/49-day4-payroll-run.png' });
  await hr.ctx.close();

  // ===== 3) الموظف يفتح كشف راتبه =====
  const emp = await session(browser, 'trial.agent@maxp.test');
  await emp.page.goto(`${BASE}/my-payroll`, { waitUntil: 'domcontentloaded' });
  await emp.page.waitForTimeout(6000);
  const myPay = await mainText(emp.page);
  const hasSlip = /صافي|الأساسي|كشف|راتب/.test(myPay);
  record('D4-3', 'الموظف يفتح كشف راتبه', hasSlip, myPay.slice(0, 120));

  // فتح أول كشف إن وُجد زر عرض
  const viewBtn = emp.page.locator('main button').filter({ hasText: /عرض|تفاصيل|الكشف/ }).first();
  if (await viewBtn.count()) {
    await viewBtn.click();
    await emp.page.waitForTimeout(3500);
  }
  const slipText = await mainText(emp.page);
  record(
    'D4-4',
    'كشف الراتب يعرض المكوّنات بلا مفاتيح خام',
    /أساسي/.test(slipText) && /إجمالي/.test(slipText) && /استقطاع/.test(slipText) &&
      !/myPayroll\.|employee\.payroll\.|absenceDetails|deficitAmount/.test(slipText),
    slipText.slice(0, 140),
  );
  await emp.page.screenshot({ path: 'docs/qa/trial-14d/evidence/50-day4-my-payroll.png' });
  await emp.ctx.close();

  // ===== 4) التحقق اليدوي من الصافي =====
  const token = await apiLogin('trial.owner@maxp.test');
  const res = await fetch(`${API}/hr/payroll?limit=50`, { headers: { Authorization: `Bearer ${token}` } });
  const json = await res.json();
  const rows = json.payrolls || json.data || [];
  const bad = [];
  rows.forEach((p) => {
    // نستخدم baseSalary (المحتسب فعليًا) لا fullMonthBaseSalary — للكشوف الجزئية
    const base = Number(p.baseSalary || 0);
    const allow = Number(p.totalAllowances || 0);
    const ot = Number(p.overtimeAmount || 0);
    const deduct = Number(p.totalDeductions || 0);
    const net = Number(p.netSalary || 0);
    const expected = Math.round((base + allow + ot - deduct) * 100) / 100;
    if (Math.abs(expected - net) > 0.5) {
      bad.push({ id: p.id.slice(-5), base, allow, ot, deduct, net, expected });
    }
  });
  record(
    'D4-5',
    'التحقق اليدوي: الصافي = الأساسي + البدلات + الإضافي − الخصومات',
    bad.length === 0,
    bad.length ? JSON.stringify(bad.slice(0, 2)) : `${rows.length} كشفًا كلها مطابقة`,
  );

  await browser.close();
  const fails = steps.filter((s) => s.result === 'FAIL');
  console.log(`\nTOTAL ${steps.length} — PASS ${steps.length - fails.length} — FAIL ${fails.length}`);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

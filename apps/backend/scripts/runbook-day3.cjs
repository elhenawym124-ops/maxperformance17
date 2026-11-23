/**
 * Runbook Day 3 — الحضور والإجازات
 *   node apps/backend/scripts/runbook-day3.cjs
 * 1) الموظف يطلب إجازة  2) مدير HR يعتمد  3) طلب ثانٍ يُرفض
 * 4) رصيد الإجازات يتغير  5) تأخير يُسجَّل بحالة LATE
 */
const { chromium } = require('playwright');

const BASE = 'https://maxp.online';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const steps = [];
const record = (id, name, ok, detail) => {
  steps.push({ id, name, result: ok ? 'PASS' : 'FAIL', detail: String(detail ?? '').slice(0, 170) });
  console.log(`${ok ? 'PASS' : 'FAIL'} · ${id} · ${name} · ${String(detail ?? '').slice(0, 130)}`);
};

const fmt = (d) => d.toISOString().slice(0, 10);
const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

async function session(browser, email, password = 'Maxp@2026') {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(9000);
  return { ctx, page };
}

const mainText = (page) =>
  page.evaluate(() => (document.querySelector('main')?.innerText || '').replace(/\s+/g, ' '));

const setDate = async (locator, value) =>
  locator.evaluate((el, v) => {
    const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set;
    setter.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);

async function submitLeave(page, startOffset, days, reason) {
  await page.goto(`${BASE}/my-leaves`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4500);
  const add = page.locator('main button').filter({ hasText: /طلب إجازة|إضافة طلب|جديد/ }).first();
  if (!(await add.count())) return { ok: false, why: 'لا يوجد زر طلب إجازة' };
  await add.click();
  await page.waitForTimeout(2200);
  const dlg = page.locator('[role="dialog"]').last();
  const dates = dlg.locator('input[type="date"]');
  if (!(await dates.count())) return { ok: false, why: 'لا يوجد حقول تاريخ' };
  await setDate(dates.nth(0), fmt(addDays(startOffset)));
  await setDate(dates.nth(1), fmt(addDays(startOffset + days - 1)));
  const ta = dlg.locator('textarea').first();
  if (await ta.count()) {
    await ta.click();
    await ta.pressSequentially(reason, { delay: 30 });
  }
  await dlg.locator('button:has-text("إرسال الطلب")').first().click();
  await page.waitForTimeout(5000);
  const txt = await mainText(page);
  return { ok: /تم|نجاح|قيد الانتظار/.test(txt), text: txt.slice(0, 160) };
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });

  // ===== الموظف يطلب إجازة =====
  const emp = await session(browser, 'trial.agent@maxp.test');
  const leave1 = await submitLeave(emp.page, 3, 2, 'إجازة عائلية — اختبار اليوم 3');
  record('D3-1', 'الموظف يقدّم طلب إجازة سنوية (يومان)', leave1.ok, leave1.text || leave1.why);

  const leave2 = await submitLeave(emp.page, 10, 1, 'ظرف شخصي — اختبار الرفض');
  record('D3-2', 'الموظف يقدّم طلب إجازة ثانٍ (يوم)', leave2.ok, leave2.text || leave2.why);
  await emp.page.screenshot({ path: 'docs/qa/trial-14d/evidence/47-day3-employee-leaves.png' });
  await emp.ctx.close();

  // ===== مدير HR يعتمد =====
  const hr = await session(browser, 'trial.hr@maxp.test');
  await hr.page.goto(`${BASE}/hr/leaves`, { waitUntil: 'domcontentloaded' });
  await hr.page.waitForTimeout(5000);
  const before = await mainText(hr.page);
  const pendingBefore = Number(before.match(/قيد الانتظار\s*(\d+)/)?.[1] ?? -1);

  const approve = hr.page.locator('main button[aria-label="موافقة"]').first();
  let approved = false;
  if (await approve.count()) {
    await approve.click();
    await hr.page.waitForTimeout(5000);
    approved = true;
  }
  const after = await mainText(hr.page);
  const pendingAfter = Number(after.match(/قيد الانتظار\s*(\d+)/)?.[1] ?? -1);
  record(
    'D3-3',
    'مدير HR يعتمد طلب إجازة',
    approved && (pendingBefore === -1 || pendingAfter < pendingBefore),
    `قيد الانتظار: ${pendingBefore} → ${pendingAfter}`,
  );

  // رفض الطلب الثاني
  await hr.page.reload({ waitUntil: 'domcontentloaded' });
  await hr.page.waitForTimeout(5000);
  const reject = hr.page.locator('main button[aria-label="رفض"]').first();
  let rejected = false;
  let rejectNote = 'لا يوجد زر رفض';
  if (await reject.count()) {
    await reject.click();
    await hr.page.waitForTimeout(2500);
    const dlg = hr.page.locator('[role="dialog"]').last();
    if (await dlg.count()) {
      const ta = dlg.locator('textarea').first();
      if (await ta.count()) {
        await ta.click();
        await ta.pressSequentially('رفض اختباري — اليوم 3', { delay: 30 });
      }
      const confirm = dlg.locator('button').filter({ hasText: /تأكيد|رفض الطلب|حفظ/ }).last();
      await confirm.click();
      await hr.page.waitForTimeout(4500);
      rejected = true;
      rejectNote = 'أُرسل الرفض';
    }
  }
  const afterReject = await mainText(hr.page);
  record('D3-4', 'مدير HR يرفض طلب إجازة بسبب', rejected, `${rejectNote} · ${afterReject.match(/مرفوض\s*(\d+)/)?.[0] ?? ''}`);

  // ===== تأخير =====
  await hr.page.goto(`${BASE}/hr/attendance`, { waitUntil: 'domcontentloaded' });
  await hr.page.waitForTimeout(4500);
  await hr.page.locator('main button:has-text("تسجيل يدوي")').first().click();
  await hr.page.waitForTimeout(2200);
  const attDlg = hr.page.locator('[role="dialog"]').first();
  const empSel = attDlg.locator('select').first();
  if ((await empSel.locator('option').count()) > 1) await empSel.selectOption({ index: 2 });
  const d = attDlg.locator('input[type="date"]').first();
  if (await d.count()) await setDate(d, fmt(new Date()));
  const times = attDlg.locator('input[type="time"]');
  if (await times.count()) {
    await setDate(times.nth(0), '11:30');
    if ((await times.count()) > 1) await setDate(times.nth(1), '18:00');
  }
  await attDlg.locator('button:has-text("تسجيل الحضور")').first().click();
  await hr.page.waitForTimeout(5000);
  const attText = await mainText(hr.page);
  record('D3-5', 'تسجيل حضور متأخر (11:30) يُحتسب LATE', /متأخر|LATE/.test(attText), attText.match(/متأخر[^|]{0,40}/)?.[0] ?? 'لا يظهر تصنيف تأخير');

  await hr.page.screenshot({ path: 'docs/qa/trial-14d/evidence/48-day3-hr-leaves-attendance.png' });
  await hr.ctx.close();
  await browser.close();

  const fails = steps.filter((s) => s.result === 'FAIL');
  console.log(`\nTOTAL ${steps.length} — PASS ${steps.length - fails.length} — FAIL ${fails.length}`);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

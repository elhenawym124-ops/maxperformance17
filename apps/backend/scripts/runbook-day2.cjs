/**
 * Runbook Day 2 — الفريق (نسخة مُصحّحة بعد فحص الـDOM الحقيقي)
 *   node apps/backend/scripts/runbook-day2.cjs
 */
const { chromium } = require('playwright');

const BASE = 'https://maxp.online';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const steps = [];
const record = (id, name, ok, detail) => {
  steps.push({ id, name, result: ok ? 'PASS' : 'FAIL', detail: String(detail ?? '').slice(0, 160) });
  console.log(`${ok ? 'PASS' : 'FAIL'} · ${id} · ${name} · ${String(detail ?? '').slice(0, 120)}`);
};

async function newSession(browser, email, password = 'Maxp@2026') {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 120)));
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(9000);
  return { ctx, page, errors };
}

const mainText = (page) =>
  page.evaluate(() => (document.querySelector('main')?.innerText || '').replace(/\s+/g, ' '));

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const hr = await newSession(browser, 'trial.hr@maxp.test');
  const page = hr.page;

  // ---- 1) الوظائف (المسميات) ----
  await page.goto(`${BASE}/hr/positions`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4500);
  const posName = `أخصائي جودة ${Date.now().toString().slice(-4)}`;
  await page.locator('main button:has-text("إضافة مسمى وظيفي")').first().click();
  await page.waitForTimeout(2000);
  const posDialog = page.locator('[role="dialog"]').first();
  await posDialog.locator('input[name="title"]').fill(posName);
  await posDialog.locator('input[name="code"]').fill(`QA-${Date.now().toString().slice(-4)}`);
  await posDialog.locator('button:has-text("حفظ المنصب")').first().click();
  await page.waitForTimeout(4000);
  record('D2-1', 'إضافة مسمى وظيفي', (await mainText(page)).includes(posName), posName);

  // ---- 2) موظف جديد ----
  await page.goto(`${BASE}/hr/employees`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4500);
  const stamp = Date.now().toString().slice(-4);
  const empFirst = 'سلمى';
  const empLast = `تجربة${stamp}`;
  await page.locator('main button:has-text("إضافة موظف")').first().click();
  await page.waitForTimeout(2500);
  const empDialog = page.locator('[role="dialog"]').first();
  await empDialog.locator('input[type="email"]').first().fill(`emp${stamp}@trial.maxp.test`);
  // ملاحظة: في هذا النموذج fill() لا يُحدّث الحالة — الكتابة الحقيقية (pressSequentially) تعمل
  const typeInto = async (locator, value) => {
    await locator.click();
    await locator.pressSequentially(String(value), { delay: 45 });
  };
  await typeInto(empDialog.locator('input[placeholder="أدخل الاسم الأول"]').first(), empFirst);
  await typeInto(empDialog.locator('input[placeholder="أدخل الاسم الأخير"]').first(), empLast);
  await typeInto(empDialog.locator('input[placeholder="01xxxxxxxxx"]').first(), '01099887766');
  await typeInto(empDialog.locator('input[type="password"]').first(), 'Maxp@2026');

  // القوائم هنا مكوّن Select مخصّص (Radix) لا <select> — نفتحها ونختار أول خيار
  const pickFirstOption = async (triggerText) => {
    const trigger = empDialog.locator('button').filter({ hasText: triggerText }).first();
    if (!(await trigger.count())) return false;
    await trigger.click();
    await page.waitForTimeout(900);
    // Radix: عناصر الخيارات تُعرض في portal؛ الاختيار بالكيبورد أكثر ثباتًا
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
    return true;
  };
  await pickFirstOption('اختر قسم');
  await pickFirstOption('وكيل');
  const hireDate = empDialog.locator('input[type="date"]').first();
  if (await hireDate.count()) {
    await hireDate.evaluate((el) => {
      const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set;
      setter.call(el, new Date().toISOString().slice(0, 10));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  const salary = empDialog.locator('input[type="number"]').first();
  await typeInto(salary, '7000');
  const saveBtn = empDialog.locator('button').filter({ hasText: /^إضافة موظف$|حفظ الموظف|^حفظ$/ }).last();
  await saveBtn.click();
  await page.waitForTimeout(6000);
  const empText = await mainText(page);
  record('D2-2', 'إضافة موظف جديد', empText.includes(empLast), empText.includes(empLast) ? `${empFirst} ${empLast}` : empText.slice(-120));

  // ---- 3) صفحة الأقسام: هل يوجد زر إضافة؟ ----
  await page.goto(`${BASE}/hr/departments`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4500);
  const deptInfo = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('button')]
      .map((b) => (b.innerText || b.getAttribute('aria-label') || '').trim())
      .filter((t) => /إضافة|قسم جديد|جديد/.test(t));
    return { addButtons: buttons.slice(0, 6), count: buttons.length };
  });
  record(
    'D2-3',
    'شاشة الأقسام فيها زر إضافة واضح',
    deptInfo.count > 0,
    deptInfo.count ? deptInfo.addButtons.join(' | ') : 'لا يوجد زر إضافة قسم في الشاشة',
  );

  // ---- 4) الصلاحيات لمدير HR ----
  await page.goto(`${BASE}/hr/permissions`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4500);
  const permText = await mainText(page);
  record('D2-4', 'صفحة الصلاحيات تفتح لمدير HR', permText.length > 80 && !/ليس لديك صلاحية/.test(permText), permText.slice(0, 80));

  // ---- 5) حضور يدوي ----
  await page.goto(`${BASE}/hr/attendance`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4500);
  await page.locator('main button:has-text("تسجيل يدوي")').first().click();
  await page.waitForTimeout(2200);
  const attDialog = page.locator('[role="dialog"]').first();
  const attSel = attDialog.locator('select').first();
  const attOpts = await attSel.locator('option').count();
  if (attOpts > 1) await attSel.selectOption({ index: 1 });
  const dateInput = attDialog.locator('input[type="date"]').first();
  if (await dateInput.count()) {
    await dateInput.evaluate((el) => {
      const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set;
      setter.call(el, new Date().toISOString().slice(0, 10));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  const times = attDialog.locator('input[type="time"]');
  const setTime = async (n, v) =>
    times.nth(n).evaluate((el, value) => {
      const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set;
      setter.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, v);
  if (await times.count()) {
    await setTime(0, '09:00');
    if ((await times.count()) > 1) await setTime(1, '17:00');
  }
  await attDialog.locator('button:has-text("تسجيل الحضور")').first().click();
  await page.waitForTimeout(4500);
  record('D2-5', 'تسجيل حضور يدوي من شاشة HR', !(await attDialog.isVisible().catch(() => false)), 'أُغلقت النافذة بعد الحفظ');

  await page.screenshot({ path: 'docs/qa/trial-14d/evidence/44-day2-hr-attendance.png' });
  await hr.ctx.close();

  // ---- 6) الموظف: الحضور الذاتي ----
  const emp = await newSession(browser, 'trial.agent@maxp.test');
  await emp.page.goto(`${BASE}/my-attendance`, { waitUntil: 'domcontentloaded' });
  await emp.page.waitForTimeout(6000);
  const myText = await mainText(emp.page);
  record('D2-6', 'الموظف يفتح حضوره الذاتي', /الحضور/.test(myText) && myText.length > 80, myText.slice(0, 90));

  const buttons = await emp.page.evaluate(() =>
    [...document.querySelectorAll('main button')]
      .map((b) => (b.innerText || '').trim())
      .filter(Boolean)
      .slice(0, 12),
  );
  const checkin = emp.page.locator('main button').filter({ hasText: /تسجيل الحضور|بصمة الحضور|حضور الآن/ }).first();
  let clicked = false;
  if (await checkin.count()) {
    await checkin.click();
    clicked = true;
    await emp.page.waitForTimeout(5000);
  }
  const afterText = await mainText(emp.page);
  record(
    'D2-7',
    'أول بصمة حضور للموظف',
    clicked ? /تم|سجل|حاضر/.test(afterText) : /تم تسجيل|حاضر|الانصراف/.test(afterText),
    clicked ? afterText.slice(0, 110) : `أزرار الصفحة: ${buttons.join(' | ')}`,
  );

  await emp.page.screenshot({ path: 'docs/qa/trial-14d/evidence/45-day2-my-attendance.png' });
  await emp.ctx.close();
  await browser.close();

  const fails = steps.filter((s) => s.result === 'FAIL');
  console.log(`\nTOTAL ${steps.length} — PASS ${steps.length - fails.length} — FAIL ${fails.length}`);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

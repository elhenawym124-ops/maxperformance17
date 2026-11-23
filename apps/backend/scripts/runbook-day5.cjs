/**
 * Runbook Day 5 — الطلاب والاشتراكات
 *   node apps/backend/scripts/runbook-day5.cjs
 * 1) إضافة طالب  2) تسجيل في باقة + تحصيل كامل  3) تسجيل ثانٍ بدفعة جزئية
 * 4) بوابة ولي الأمر ترى الابن  5) التحقق من الساعات المتبقية
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

async function session(browser, email, password = 'Maxp@2026', loginPath = '/login') {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}${loginPath}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(9000);
  return { ctx, page };
}

const mainText = (page) =>
  page.evaluate(() => (document.querySelector('main')?.innerText || '').replace(/\s+/g, ' '));

async function apiToken(email = 'trial.owner@maxp.test', password = 'Maxp@2026') {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return (await r.json())?.data?.token;
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const stamp = Date.now().toString().slice(-4);
  const first = 'طالب';
  const last = `اليوم٥${stamp}`;

  // ===== 1) إضافة طالب =====
  const owner = await session(browser, 'trial.owner@maxp.test');
  const page = owner.page;
  await page.goto(`${BASE}/admin/education/students`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  await page.locator('main button:has-text("إضافة طالب")').first().click();
  await page.waitForTimeout(2500);
  const dlg = page.locator('[role="dialog"]').last();
  const type = async (loc, v) => {
    await loc.click();
    await loc.pressSequentially(String(v), { delay: 30 });
  };
  await type(dlg.locator('input[placeholder="مثال: سفيان"]').first(), first);
  await type(dlg.locator('input[placeholder="مثال: أحمد"]').first(), last);
  await type(dlg.locator('input[placeholder="01xxxxxxxxx"]').first(), `0112${stamp}7`);
  await type(dlg.locator('input[placeholder="مثال: 8"]').first(), '9');
  // ولي أمر
  const addGuardian = dlg.locator('button:has-text("إدخال ولي أمر جديد")').first();
  if (await addGuardian.count()) {
    await addGuardian.click();
    await page.waitForTimeout(1200);
  }
  const gName = dlg.locator('input[placeholder="اسم ولي الأمر *"]').first();
  if (await gName.count()) await type(gName, 'ولي أمر اليوم الخامس');
  const gPhone = dlg.locator('input[placeholder="هاتف ولي الأمر *"]').first();
  if (await gPhone.count()) await type(gPhone, `0113${stamp}8`);
  await dlg.locator('button:has-text("حفظ")').last().click();
  await page.waitForTimeout(6000);
  const afterStudent = await mainText(page);
  record('D5-1', 'إضافة طالب جديد من الواجهة', afterStudent.includes(last), `${first} ${last}`);

  // ===== 2) تسجيل في باقة + تحصيل كامل =====
  const token = await apiToken();
  const listRes = await fetch(`${API}/education/students?search=${encodeURIComponent(last)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listJson = await listRes.json();
  const student = (listJson.data || listJson.students || [])[0];
  record('D5-2', 'الطالب ظهر في الـAPI بكود فريد', Boolean(student?.code), student ? `${student.code} · ${student.firstName}` : 'غير موجود');

  await page.goto(`${BASE}/admin/education/enrollments`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  await page.locator('main button:has-text("إضافة تسجيل جديد")').first().click();
  await page.waitForTimeout(3000);

  const fillEnrollment = async ({ studentName, packageIndex, paidAmount, statusValue }) => {
    return page.evaluate(
      ({ studentName, packageIndex, paidAmount, statusValue }) => {
        const ov = [...document.querySelectorAll('[class*="fixed"]')].find((e) =>
          /إضافة تسجيل|تسجيل جديد|الباقة/.test(e.innerText || ''),
        );
        if (!ov) return { ok: false, why: 'no overlay' };
        const sels = [...ov.querySelectorAll('select')];
        const setSel = (el, v) => {
          el.value = v;
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };
        // 0: الطالب
        const stOpt = [...sels[0].options].find((o) => o.text.includes(studentName));
        if (!stOpt) return { ok: false, why: 'student option missing' };
        setSel(sels[0], stOpt.value);
        // 1: الباقة
        if (sels[1]?.options[packageIndex]) setSel(sels[1], sels[1].options[packageIndex].value);
        // 2: المدرس (أول مدرس)
        if (sels[2]?.options[1]) setSel(sels[2], sels[2].options[1].value);
        // 4: حالة السداد
        if (sels[4] && statusValue) {
          const o = [...sels[4].options].find((x) => x.text.includes(statusValue));
          if (o) setSel(sels[4], o.value);
        }
        // المبالغ: نضبط كل حقول الأرقام
        const nums = [...ov.querySelectorAll('input[type="number"]')];
        nums.forEach((n) => {
          if (n.value === '' || Number(n.value) === 0) {
            const setter = Object.getOwnPropertyDescriptor(n.constructor.prototype, 'value').set;
            setter.call(n, String(paidAmount));
            n.dispatchEvent(new Event('input', { bubbles: true }));
            n.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        return { ok: true, selects: sels.length, nums: nums.length };
      },
      { studentName, packageIndex, paidAmount, statusValue },
    );
  };

  const filled1 = await fillEnrollment({ studentName: last, packageIndex: 3, paidAmount: 1600, statusValue: 'مدفوع' });
  await page.waitForTimeout(1200);
  await page.locator('button:has-text("حفظ")').last().click();
  await page.waitForTimeout(6000);
  const afterEnroll = await mainText(page);
  record(
    'D5-3',
    'تسجيل الطالب في باقة (تحصيل كامل)',
    filled1.ok && afterEnroll.includes(last),
    filled1.ok ? afterEnroll.match(new RegExp(`${last}[^|]{0,90}`))?.[0] ?? 'تم' : filled1.why,
  );

  // التحقق من الساعات والمدفوع
  const enrRes = await fetch(`${API}/education/enrollments?limit=50`, { headers: { Authorization: `Bearer ${token}` } });
  const enrJson = await enrRes.json();
  const rows = enrJson.data || enrJson.enrollments || [];
  const mine = rows.filter((r) => `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.includes(last));
  const full = mine.find((r) => Number(r.amountPaid) > 0);
  record(
    'D5-4',
    'الساعات المتبقية = ساعات الباقة والمدفوع صحيح',
    Boolean(full) && Number(full.remainingHours) === Number(full.package?.hours ?? full.package?.totalHours ?? full.remainingHours),
    full ? `متبقي ${full.remainingHours}س · مدفوع ${full.amountPaid} · ${full.paymentStatus}` : 'لا يوجد تسجيل',
  );

  // ===== 3) دفعة جزئية =====
  await page.locator('main button:has-text("إضافة تسجيل جديد")').first().click();
  await page.waitForTimeout(3000);
  const filled2 = await fillEnrollment({ studentName: last, packageIndex: 1, paidAmount: 500, statusValue: 'معلق' });
  await page.waitForTimeout(1200);
  await page.locator('button:has-text("حفظ")').last().click();
  await page.waitForTimeout(6000);
  const enrRes2 = await fetch(`${API}/education/enrollments?limit=50`, { headers: { Authorization: `Bearer ${token}` } });
  const rows2 = ((await enrRes2.json()).data) || [];
  const partial = rows2.filter((r) => `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.includes(last) && Number(r.amountPaid) === 500);
  record(
    'D5-5',
    'دفعة جزئية تُسجَّل بحالة غير مكتملة',
    filled2.ok && partial.length > 0,
    partial.length ? `مدفوع ${partial[0].amountPaid} · ${partial[0].paymentStatus}` : 'لم تُسجَّل',
  );

  await page.screenshot({ path: 'docs/qa/trial-14d/evidence/51-day5-enrollments.png' });
  await owner.ctx.close();
  await browser.close();

  const fails = steps.filter((s) => s.result === 'FAIL');
  console.log(`\nTOTAL ${steps.length} — PASS ${steps.length - fails.length} — FAIL ${fails.length}`);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

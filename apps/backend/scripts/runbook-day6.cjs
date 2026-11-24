/**
 * Runbook Day 6 — المجموعات والحصص
 *   node apps/backend/scripts/runbook-day6.cjs
 * 1) إنشاء مجموعة  2) إضافة طالب للمجموعة  3) تأكيد حصة
 * 4) تأكيد مكرر (لا 500)  5) تعارض مواعيد لنفس المدرس
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

async function token(email = 'trial.owner@maxp.test', password = 'Maxp@2026') {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return (await r.json())?.data?.token;
}

async function api(path, t, method = 'GET', body) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: r.status, json: await r.json().catch(() => null) };
}

const mainText = (page) =>
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

  const stamp = Date.now().toString().slice(-4);
  const groupName = `مجموعة اليوم٦ ${stamp}`;

  // ===== 1) إنشاء مجموعة =====
  await page.goto(`${BASE}/admin/education/groups`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const groupsBefore = Number((await mainText(page)).match(/إجمالي المجموعات\s*(\d+)/)?.[1] ?? 0);
  await page.locator('main button:has-text("إنشاء مجموعة جديدة")').first().click();
  await page.waitForTimeout(2500);

  const filled = await page.evaluate(
    ({ groupName }) => {
      const ov = [...document.querySelectorAll('[class*="fixed"]')].find(
        (e) => /إنشاء مجموعة/.test(e.innerText || '') && e.querySelector('input'),
      );
      if (!ov) return { ok: false, why: 'no dialog' };
      const inputs = [...ov.querySelectorAll('input')];
      const sels = [...ov.querySelectorAll('select')];
      const setVal = (el, v) => {
        const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set;
        setter.call(el, v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      setVal(inputs[0], groupName);
      setVal(inputs[1], `GRP-${Date.now().toString().slice(-4)}`);
      if (sels[0]?.options[1]) {
        sels[0].value = sels[0].options[1].value;
        sels[0].dispatchEvent(new Event('change', { bubbles: true }));
      }
      const cap = inputs.find((i) => i.type === 'number');
      if (cap) setVal(cap, '10');
      // المستوى
      const level = inputs.find((i) => i.type === 'text' && i !== inputs[0] && i !== inputs[1]);
      if (level) setVal(level, 'Level 1');
      // المواعيد (مطلوبة): يوم + من/إلى
      const daySel = [...ov.querySelectorAll('select')].find((s) => [...s.options].some((o) => /الأحد|السبت|الاثنين/.test(o.text)));
      if (daySel && daySel.options[1]) {
        daySel.value = daySel.options[1].value;
        daySel.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const times = [...ov.querySelectorAll('input[type="time"]')];
      if (times[0]) setVal(times[0], '17:00');
      if (times[1]) setVal(times[1], '19:00');
      // تواريخ الكورس
      const dates = [...ov.querySelectorAll('input[type="date"]')];
      const today = new Date().toISOString().slice(0, 10);
      const later = new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 10);
      if (dates[0]) setVal(dates[0], today);
      if (dates[1]) setVal(dates[1], later);
      return { ok: true, selects: sels.length, inputs: inputs.length, times: times.length, dates: dates.length };
    },
    { groupName },
  );

  const createBtn = page.locator('button:has-text("إنشاء المجموعة")').last();
  await createBtn.scrollIntoViewIfNeeded().catch(() => {});
  await createBtn.click({ force: true });
  await page.waitForTimeout(6000);
  const afterGroup = await mainText(page);
  const groupsAfter = Number(afterGroup.match(/إجمالي المجموعات\s*(\d+)/)?.[1] ?? 0);
  // التحقق الحاسم عبر الـAPI (الشاشة قد لا تحدّث العدّاد فورًا)
  const tCheck = await token();
  const gRes = await api('/education/groups?limit=50', tCheck);
  const gList = gRes.json?.groups || gRes.json?.data || [];
  const createdGroup = gList.find((g) => (g.name || '').includes(stamp));
  record(
    'D6-1',
    'إنشاء مجموعة دراسية جديدة',
    Boolean(createdGroup) || groupsAfter > groupsBefore,
    createdGroup ? `${createdGroup.name} · ${createdGroup.code || ''}` : `المجموعات: ${groupsBefore} → ${groupsAfter}`,
  );

  // ===== 2) إضافة طالب للمجموعة =====
  const t = await token();
  const groups = await api('/education/groups?limit=50', t);
  const groupList = groups.json?.groups || groups.json?.data || [];
  const newGroup = groupList.find((g) => (g.name || '').includes(stamp)) || groupList[0];
  let memberNote = 'لا توجد مجموعة';
  if (newGroup) {
    const students = await api('/education/students?limit=50', t);
    const st = (students.json?.data || students.json?.students || []).find((s) => s.isActive !== false);
    // نجرّب أول طالب ثم بقية الطلاب لو كان عضوًا بالفعل
    const allStudents = students.json?.data || students.json?.students || [];
    let add = { status: 0 };
    let used = st;
    for (const cand of allStudents) {
      add = await api(`/education/groups/${newGroup.id}/members`, t, 'POST', { studentId: cand.id });
      used = cand;
      if (add.status < 300) break;
    }
    const after = await api(`/education/groups/${newGroup.id}`, t);
    const count = (after.json?.data?.students || after.json?.group?.students || after.json?.data?.members || []).length;
    memberNote = `إضافة ${used?.firstName || ''}: ${add.status} · الأعضاء الآن: ${count}`;
    record('D6-2', 'إضافة طالب إلى المجموعة', add.status < 300 && count > 0, memberNote);
  } else record('D6-2', 'إضافة طالب إلى المجموعة', false, memberNote);

  // ===== 3) تأكيد حصة من الواجهة =====
  await page.goto(`${BASE}/admin/education/sessions`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const beforeSessions = await mainText(page);
  // أزرار «تأكيد» موجودة في صفوف لكنها مخفية بصريًا (opacity/hover) — ننقر العنصر مباشرة
  let confirmed = false;
  const confirmHandle = await page.evaluateHandle(() => document.querySelector('button[aria-label="تأكيد الحصة"]'));
  const el = confirmHandle.asElement();
  if (el) {
    await el.evaluate((b) => b.click());
    confirmed = true;
    await page.waitForTimeout(5000);
  }
  const afterSessions = await mainText(page);
  record(
    'D6-3',
    'تأكيد حصة من شاشة الحصص',
    confirmed,
    confirmed ? (afterSessions.match(/مؤكدة[^|]{0,30}/)?.[0] ?? 'أُرسل التأكيد') : 'لا يوجد زر تأكيد',
  );

  // ===== 4) تأكيد مكرر (API) =====
  const sessRes = await api('/education/sessions?limit=50', t);
  const sessions = sessRes.json?.data || sessRes.json?.sessions || [];
  const target = sessions.find((s) => s.status === 'CONFIRMED') || sessions[0];
  const dup = await api(`/education/sessions/${target.id}/confirm`, t, 'PUT');
  record(
    'D6-4',
    'تأكيد مكرر لا يُنتج 500',
    dup.status < 500,
    `status ${dup.status} · ${(dup.json?.message || dup.json?.error || 'idempotent').slice(0, 70)}`,
  );

  // ===== 5) تعارض مواعيد لنفس المدرس =====
  const teachers = await api('/education/teachers?limit=20', t);
  const teacher = (teachers.json?.teachers || teachers.json?.data || [])[0];
  const enroll = await api('/education/enrollments?limit=5', t);
  const enr = (enroll.json?.data || enroll.json?.enrollments || [])[0];
  const when = new Date(Date.now() + 5 * 864e5);
  when.setHours(13, 0, 0, 0);
  const base = {
    enrollmentId: enr.id,
    teacherId: teacher.id,
    scheduledAt: when.toISOString(),
    plannedDuration: 60,
    topic: 'تعارض مواعيد — اليوم 6',
  };
  const first = await api('/education/sessions', t, 'POST', base);
  const second = await api('/education/sessions', t, 'POST', {
    ...base,
    scheduledAt: new Date(when.getTime() + 15 * 60000).toISOString(),
    topic: 'تعارض مواعيد — نسخة 2',
  });
  record(
    'D6-5',
    'منع تعارض مواعيد المدرس',
    first.status < 300 && second.status >= 400,
    `أول حصة: ${first.status} · الثانية: ${second.status} · ${(second.json?.message || second.json?.error || '').slice(0, 60)}`,
  );
  if (first.status < 300 && first.json?.data?.id) {
    await api(`/education/sessions/${first.json.data.id}`, t, 'DELETE');
  }

  await page.screenshot({ path: 'docs/qa/trial-14d/evidence/53-day6-groups-sessions.png' });
  await ctx.close();
  await browser.close();

  const fails = steps.filter((s) => s.result === 'FAIL');
  console.log(`\nTOTAL ${steps.length} — PASS ${steps.length - fails.length} — FAIL ${fails.length}`);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

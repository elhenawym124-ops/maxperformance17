/**
 * Runbook Day 10 — يوم التجربة التعليمي (Demo Day)
 *   node apps/backend/scripts/runbook-day10.cjs
 * 1) قراءة أيام التجربة  2) تسجيل حاضر جديد  3) تعليم الحضور  4) تحويل لطالب  5) الواجهة
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

  // D10-1: أيام التجربة
  const days = await api('/education/demo-day?limit=20', t);
  const dayList = days.json?.data || days.json?.demoDays || [];
  record('D10-1', 'قائمة أيام التجربة تعمل', days.status === 200 && dayList.length > 0, `${days.status} · ${dayList.length} يوم`);

  const day = dayList[0];
  if (!day) {
    console.log('TOTAL 1 — PASS 0 — FAIL 1');
    return;
  }
  const before = await api(`/education/demo-day/${day.id}`, t);
  const attendeesBefore = (before.json?.data?.attendees || before.json?.attendees || []).length;

  // D10-2: تسجيل حاضر جديد
  const stamp = Date.now().toString().slice(-5);
  const reg = await api(`/education/demo-day/${day.id}/attendees`, t, 'POST', {
    studentName: `حاضر اليوم١٠ ${stamp}`,
    guardianName: 'ولي أمر اليوم العاشر',
    phone: `010${stamp}12`,
    age: 9,
    notes: 'اختبار اليوم العاشر',
  });
  const attendeeId = reg.json?.data?.id || reg.json?.attendee?.id;
  record('D10-2', 'تسجيل حاضر جديد في يوم التجربة', reg.status < 300 && Boolean(attendeeId), `${reg.status} · ${(reg.json?.error || '').slice(0, 50)}`);

  // D10-3: تعليم الحضور
  if (attendeeId) {
    const mark = await api(`/education/demo-day/attendees/${attendeeId}/status`, t, 'PUT', { attendanceStatus: 'ATTENDED' });
    const afterMark = await api(`/education/demo-day/${day.id}`, t);
    const rows = afterMark.json?.data?.attendees || afterMark.json?.attendees || [];
    const mine = rows.find((a) => a.id === attendeeId);
    record(
      'D10-3',
      'تعليم الحضور (ATTENDED)',
      mark.status < 300 && mine?.attendanceStatus === 'ATTENDED',
      `${mark.status} · الحالة: ${mine?.attendanceStatus || '—'}`,
    );

    // D10-4: التحويل إلى طالب
    const convert = await api(`/education/demo-day/attendees/${attendeeId}/convert`, t, 'POST', {
      createEnrollment: false,
    });
    const afterConvert = await api(`/education/demo-day/${day.id}`, t);
    const rows2 = afterConvert.json?.data?.attendees || afterConvert.json?.attendees || [];
    const mine2 = rows2.find((a) => a.id === attendeeId);
    record(
      'D10-4',
      'تحويل الحاضر إلى طالب',
      convert.status < 300 && (mine2?.conversionStatus === 'CONVERTED' || Boolean(convert.json?.data?.studentId)),
      `${convert.status} · ${mine2?.conversionStatus || ''} · ${(convert.json?.error || '').slice(0, 50)}`,
    );
  }

  // D10-5: إحصاءات قبل/بعد
  const after = await api(`/education/demo-day/${day.id}`, t);
  const attendeesAfter = (after.json?.data?.attendees || after.json?.attendees || []).length;
  record('D10-5', 'عدّاد الحضور يزيد بعد التسجيل', attendeesAfter > attendeesBefore, `${attendeesBefore} → ${attendeesAfter}`);

  // D10-6: الواجهة
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
  await page.goto(`${BASE}/admin/education/demo-day`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8000);
  const txt = await page.evaluate(() => (document.querySelector('main')?.innerText || '').replace(/\s+/g, ' '));
  record('D10-6', 'شاشة يوم التجربة تعرض الحاضرين', /حاضر|مسجل|ديمو/.test(txt) && txt.length > 120, txt.slice(0, 130));
  record('D10-7', 'صفر أخطاء Console', errors.length === 0, `${errors.length} خطأ`);

  await page.screenshot({ path: 'docs/qa/trial-14d/evidence/57-day10-demo-day.png' });
  await ctx.close();
  await browser.close();

  const fails = steps.filter((s) => s.result === 'FAIL');
  console.log(`\nTOTAL ${steps.length} — PASS ${steps.length - fails.length} — FAIL ${fails.length}`);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

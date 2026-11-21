/**
 * بوابة المدرس + تحليلات الإسناد (قراءة).
 * node apps/backend/scripts/edu-teacher-portal-scenarios.cjs
 */
const B = 'https://maxp.online/api/v1';
const results = [];
const rec = (id, name, ok, detail) => results.push({ id, name, ok, detail: String(detail ?? '').slice(0, 200) });

const call = async (m, p, t, b) => {
  if (/\/auth\/login$/.test(p)) await new Promise((res) => setTimeout(res, 1200));
  const r = await fetch(B + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, ...(b !== undefined ? { body: JSON.stringify(b) } : {}) });
  let d = null; try { d = await r.json(); } catch { }
  return { status: r.status, d };
};

(async () => {
  const owner = await call('POST', '/auth/login', null, { email: 'trial.owner@maxp.test', password: 'Maxp@2026' });
  const ownerToken = owner.d?.data?.token;

  // ── Teacher portal ──
  const bad = await call('POST', '/education/teacher-portal/login', null, { email: 'teacher1@trial.maxp.test', password: 'wrong-pass' });
  rec('TP1', 'رفض كلمة مرور خاطئة للمدرس', [400, 401, 403].includes(bad.status), `${bad.status}`);

  const login = await call('POST', '/education/teacher-portal/login', null, { email: 'teacher1@trial.maxp.test', password: 'Maxp@2026' });
  const teacherToken = login.d?.data?.token || login.d?.token;
  const teacherId = login.d?.data?.teacher?.id;
  rec('TP2', 'دخول المدرس', login.status === 200 && Boolean(teacherToken), `${login.status} teacher=${teacherId || '-'}`);

  const me = await call('GET', '/education/teacher-portal/me', teacherToken);
  rec('TP3', 'بيانات المدرس (/me)', me.status === 200, `${me.status}`);

  const sessions = await call('GET', '/education/teacher-portal/sessions', teacherToken);
  const rows = sessions.d?.sessions || sessions.d?.data || [];
  const mine = rows.every(s => !s.teacherId || s.teacherId === teacherId);
  rec('TP4', 'جدول المدرس يعرض حصصه فقط', sessions.status === 200 && mine, `${sessions.status} sessions=${rows.length}`);

  const adminWithTeacherToken = await call('GET', '/education/students', teacherToken);
  rec('TP5', 'توكن المدرس لا يفتح إدارة الطلاب', [401, 403].includes(adminWithTeacherToken.status), `${adminWithTeacherToken.status}`);

  // ── Attribution analytics (read) ──
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const attr = await call('GET', `/analytics/campaign-attribution?startDate=${from}&endDate=${to}`, ownerToken);
  rec('AT1', 'تحليلات إسناد الحملات', attr.status === 200, `${attr.status} ${JSON.stringify(attr.d).slice(0, 90)}`);

  const eduAttr = await call('GET', `/education/demo-day/analytics/attribution?startDate=${from}&endDate=${to}`, ownerToken);
  rec('AT2', 'إسناد أيام التجربة التعليمية', eduAttr.status === 200, `${eduAttr.status} ${JSON.stringify(eduAttr.d).slice(0, 90)}`);

  const pass = results.filter(r => r.ok).length;
  console.log('| ID | case | result | detail |');
  console.log('|---|---|---|---|');
  results.forEach(r => console.log(`| ${r.id} | ${r.name} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.detail} |`));
  console.log(`\nTOTAL ${results.length} — PASS ${pass} — FAIL ${results.length - pass}`);
})();

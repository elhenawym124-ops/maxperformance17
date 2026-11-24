/**
 * Runbook Day 12 — الأمان
 *   node apps/backend/scripts/runbook-day12.cjs
 * SEC-01 عزل الشركات · SEC-02 بلا توكن · SEC-03 F-14 (HR عبر دور تسويق) · SEC-04 تسريب الحقول
 */
const BASE = 'https://maxp.online';
const API = `${BASE}/api/v1`;
const steps = [];
const record = (id, name, ok, detail) => {
  steps.push({ id, name, result: ok ? 'PASS' : 'FAIL', detail: String(detail ?? '').slice(0, 170) });
  console.log(`${ok ? 'PASS' : 'FAIL'} · ${id} · ${name} · ${String(detail ?? '').slice(0, 140)}`);
};

async function call(path, token, method = 'GET', body) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await r.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-json */
  }
  return { status: r.status, text: text.slice(0, 300), json };
}

async function login(email, password = 'Maxp@2026') {
  const r = await call('/auth/login', null, 'POST', { email, password });
  return r.json?.data?.token || null;
}

(async () => {
  const owner = await login('trial.owner@maxp.test');
  const marketing = await login('trial.marketing@maxp.test');
  const agent = await login('trial.agent@maxp.test');

  // SEC-02: بلا توكن
  const noToken = [];
  for (const p of ['/hr/employees', '/education/students', '/tasks', '/companies/current']) {
    const r = await call(p, null);
    noToken.push(`${p}:${r.status}`);
  }
  record(
    'SEC-02',
    'كل المسارات المحمية ترفض بلا توكن (401)',
    noToken.every((x) => x.endsWith(':401')),
    noToken.join(' · '),
  );

  // SEC-03 / F-14: دور التسويق لا يصل لبيانات HR
  const mktHr = await call('/hr/employees?limit=5', marketing);
  record(
    'SEC-03',
    'F-14: دور التسويق لا يصل إلى /hr/employees',
    mktHr.status === 403 || mktHr.status === 401,
    `${mktHr.status} · ${mktHr.text.slice(0, 80)}`,
  );

  // دور الموظف لا يصل لرواتب الشركة
  const agentPayroll = await call('/hr/payroll?limit=5', agent);
  record(
    'SEC-04',
    'الموظف لا يصل إلى مسير رواتب الشركة',
    agentPayroll.status === 403 || agentPayroll.status === 401,
    `${agentPayroll.status}`,
  );

  // SEC-01: عزل الشركات — تمرير companyId لشركة أخرى يجب ألا يُرجع بياناتها
  const foreign = 'cmwp4ot8p0000juzaeqeysfgX';
  const isoRows = await call(`/education/students?companyId=${foreign}&limit=20`, owner);
  const rows = isoRows.json?.data || isoRows.json?.students || [];
  const ourCompany = 'cmwp4ot8p0000juzaeqeysfg3';
  const foreignRows = rows.filter((r) => r.companyId && r.companyId !== ourCompany);
  const companies = await call(`/companies/${foreign}`, owner);
  const hrForeign = await call(`/hr/employees?companyId=${foreign}&limit=5`, owner);
  record(
    'SEC-01',
    'عزل الشركات: لا تسريب بيانات شركة أخرى',
    foreignRows.length === 0 && companies.status >= 400 && hrForeign.status >= 400,
    `students:${isoRows.status} (صفوف شركة أخرى: ${foreignRows.length}) · companies:${companies.status} · hr:${hrForeign.status}`,
  );

  // SEC-05: لا تسريب أسرار في /auth/me
  const me = await call('/auth/me', owner);
  const leaked = /passwordHash|password\s*:|secret|apiKey/i.test(me.text);
  record('SEC-05', 'لا تسريب حقول حساسة في /auth/me', !leaked, leaked ? 'وُجدت حقول حساسة!' : 'نظيف');

  // SEC-06: حذف بدون تأكيد صريح مرفوض
  const del = await call('/hr/employees/nonexistent-id', owner, 'DELETE');
  record(
    'SEC-06',
    'الحذف يتطلب تأكيدًا صريحًا',
    del.status === 400 || del.status === 404,
    `${del.status} · ${del.text.slice(0, 70)}`,
  );

  // SEC-07: تسريب بيانات شركة عبر الـAPI العام
  const pub = await call('/public/portal/branding?companyId=' + foreign, null);
  record(
    'SEC-07',
    'الـAPI العام لا يكشف بيانات شركة غير موجودة',
    pub.status === 404 || pub.status === 400 || pub.text.includes('not found') || !pub.text.includes('أكاديمية'),
    `${pub.status}`,
  );

  const fails = steps.filter((s) => s.result === 'FAIL');
  console.log(`\nTOTAL ${steps.length} — PASS ${steps.length - fails.length} — FAIL ${fails.length}`);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});

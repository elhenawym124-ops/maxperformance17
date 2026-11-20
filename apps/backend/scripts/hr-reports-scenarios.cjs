/**
 * HR reports scenarios — Package 7.
 * node apps/backend/scripts/hr-reports-scenarios.cjs
 */
const B = 'https://maxp.online/api/v1';
const results = [];
const rec = (id, name, ok, detail) => results.push({ id, name, ok, detail: String(detail ?? '').slice(0, 180) });

const call = async (m, p, t, b) => {
  const r = await fetch(B + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, ...(b ? { body: JSON.stringify(b) } : {}) });
  let d = null; try { d = await r.json(); } catch { }
  return { status: r.status, d };
};
const login = async (e) => (await call('POST', '/auth/login', null, { email: e, password: 'Maxp@2026' })).d?.data?.token;

(async () => {
  const hr = await login('trial.hr@maxp.test');
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const period = `year=${year}&month=${month}`;

  const att = await call('GET', `/hr/reports/attendance?${period}`, hr);
  rec('P7-1', 'تقرير الحضور الشهري', att.status === 200 && att.d?.report?.totalEmployees > 0,
    `${att.status} employees=${att.d?.report?.totalEmployees} present=${att.d?.report?.presentDays}`);

  const attDefault = await call('GET', '/hr/reports/attendance', hr);
  rec('P7-2', 'تقرير الحضور بدون باراميترات (افتراضي الشهر الحالي)', attDefault.status === 200, `${attDefault.status}`);

  const sheet = await call('GET', `/hr/reports/attendance-sheet?${period}`, hr);
  rec('P7-3', 'كشف الحضور الشهري (موظف × يوم)', sheet.status === 200, `${sheet.status}`);

  const absent = await call('GET', `/hr/reports/absent-days?${period}`, hr);
  rec('P7-4', 'تقرير أيام الغياب', absent.status === 200 && absent.d?.report?.totalEmployees > 0,
    `${absent.status} employees=${absent.d?.report?.totalEmployees} absentDays=${absent.d?.report?.totalAbsentDays}`);

  const leaves = await call('GET', `/hr/reports/leaves?${period}`, hr);
  const lr = leaves.d?.report || {};
  rec('P7-5', 'تقرير الإجازات', leaves.status === 200 && Number(lr.totalRequests) >= 0,
    `${leaves.status} total=${lr.totalRequests} approved=${lr.approved} pending=${lr.pending} rejected=${lr.rejected}`);

  const pay = await call('GET', `/hr/reports/payroll?${period}`, hr);
  const pr = pay.d?.report || {};
  const sum = await call('GET', `/hr/payroll/summary?${period}`, hr);
  const sr = sum.d?.summary || {};
  rec('P7-6', 'تقرير الرواتب يطابق ملخص المسير',
    pay.status === 200 && String(pr.totalPayroll) === String(sr.totalNet),
    `report=${pr.totalPayroll} summary=${sr.totalNet}`);

  const perf = await call('GET', `/hr/reports/performance?year=${year}`, hr);
  rec('P7-7', 'تقرير الأداء السنوي', perf.status === 200, `${perf.status} reviews=${perf.d?.report?.totalReviews}`);

  const emps = (await call('GET', '/hr/employees?limit=5', hr)).d?.employees || [];
  const uid = emps[0]?.userId || emps[0]?.id;
  const er = await call('GET', `/hr/reports/employee?employeeId=${uid}&${period}`, hr);
  rec('P7-8', 'تقرير موظف بـ year/month', er.status === 200 && Boolean(er.d?.report || er.d?.employee), `${er.status}`);

  const erNoId = await call('GET', `/hr/reports/employee?${period}`, hr);
  rec('P7-9', 'تقرير موظف بدون معرّف → 400', erNoId.status === 400, `${erNoId.status}`);

  const annual = await call('GET', `/hr/payroll/annual-report?year=${year}`, hr);
  rec('P7-10', 'التقرير السنوي للرواتب', annual.status === 200, `${annual.status}`);

  const pass = results.filter(r => r.ok).length;
  console.log('| ID | case | result | detail |');
  console.log('|---|---|---|---|');
  results.forEach(r => console.log(`| ${r.id} | ${r.name} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.detail} |`));
  console.log(`\nTOTAL ${results.length} — PASS ${pass} — FAIL ${results.length - pass}`);
})();

/**
 * HR rewards scenarios — types, apply, approve, reports.
 * node apps/backend/scripts/hr-rewards-scenarios.cjs
 */
const B = 'https://maxp.online/api/v1';
const results = [];
const rec = (id, name, ok, detail) => results.push({ id, name, ok, detail: String(detail ?? '').slice(0, 220) });

const call = async (m, p, t, b) => {
  // RATE-LIMIT-GUARD: مسافة بين محاولات الدخول
  if (/\/auth\/login$/.test(p)) await new Promise((res) => setTimeout(res, 1200));
  const r = await fetch(B + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, ...(b !== undefined ? { body: JSON.stringify(b) } : {}) });
  let d = null; try { d = await r.json(); } catch { }
  return { status: r.status, d };
};
const login = async (e) => (await call('POST', '/auth/login', null, { email: e, password: 'Maxp@2026' })).d?.data?.token;
const plus = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

(async () => {
  const hr = await login('trial.hr@maxp.test');
  const stamp = Date.now().toString(36);

  const seed = await call('POST', '/hr/rewards/types/seed', hr, {});
  rec('RW1', 'تهيئة أنواع المكافآت الافتراضية', seed.status === 200 && Number(seed.d?.count) > 0,
    `${seed.status} count=${seed.d?.count} ${seed.d?.error || ''}`);

  const oneTime = await call('POST', '/hr/rewards/types', hr, {
    name: `مكافأة QA ${stamp}`, category: 'TARGET_ACHIEVEMENT', calculationMethod: 'FIXED_AMOUNT',
    value: 500, triggerType: 'MANUAL', frequency: 'ONE_TIME',
  });
  const typeId = oneTime.d?.data?.id || oneTime.d?.type?.id;
  rec('RW2', 'إنشاء نوع مكافأة (ONE_TIME)', oneTime.status === 201, `${oneTime.status} ${oneTime.d?.error || ''}`);

  const emps = (await call('GET', '/hr/employees?limit=50', hr)).d?.employees || [];
  const agent = emps.find(e => (e.email || '').includes('agent')) || emps[0];
  const apply = await call('POST', '/hr/rewards/apply', hr, {
    employeeId: agent?.employeeRecordId || agent?.id,
    rewardTypeId: typeId,
    periodStart: plus(-10), periodEnd: plus(0),
    reason: `QA مكافأة ${stamp}`, skipEligibilityCheck: true,
  });
  const recordId = apply.d?.data?.id || apply.d?.reward?.id;
  rec('RW3', 'تطبيق مكافأة بـ Employee.id', apply.status === 201, `${apply.status} ${apply.d?.error || ''}`);

  const approve = recordId ? await call('PATCH', `/hr/rewards/approve/${recordId}`, hr, {}) : { status: 0 };
  rec('RW4', 'اعتماد المكافأة', approve.status === 200, `${approve.status} ${approve.d?.error || ''}`);

  const records = await call('GET', '/hr/rewards/records', hr);
  const rows = records.d?.records || records.d?.data || [];
  rec('RW5', 'المكافأة تظهر في السجلات', records.status === 200 && rows.some(r => r.id === recordId), `rows=${rows.length}`);

  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const report = await call('GET', `/hr/rewards/reports/monthly?month=${month}&year=${year}`, hr);
  rec('RW6', 'تقرير المكافآت الشهري', report.status === 200 && Number(report.d?.data?.stats?.totalCount) >= 0,
    `${report.status} count=${report.d?.data?.stats?.totalCount} amount=${report.d?.data?.stats?.totalAmount}`);

  const cost = await call('GET', `/hr/rewards/reports/cost-analysis?startDate=${year}-01-01&endDate=${year}-12-31`, hr);
  rec('RW7', 'تحليل تكلفة المكافآت', cost.status === 200, `${cost.status} ${cost.d?.error || ''}`);

  const costNoDates = await call('GET', '/hr/rewards/reports/cost-analysis', hr);
  rec('RW8', 'تحليل التكلفة بدون تواريخ', costNoDates.status === 200, `${costNoDates.status}`);

  // reject flow
  const apply2 = await call('POST', '/hr/rewards/apply', hr, {
    userId: agent?.userId, rewardTypeId: typeId, periodStart: plus(-5), periodEnd: plus(0), reason: `QA رفض ${stamp}`,
  });
  const record2 = apply2.d?.data?.id;
  const reject = record2 ? await call('PATCH', `/hr/rewards/reject/${record2}`, hr, { reason: 'QA' }) : { status: 0 };
  rec('RW9', 'رفض المكافأة', reject.status === 200, `${reject.status}`);

  // cleanup
  for (const id of [recordId, record2].filter(Boolean)) {
    await call('DELETE', `/hr/rewards/records/${id}`, hr).catch(() => { });
  }
  if (typeId) await call('DELETE', `/hr/rewards/types/${typeId}`, hr).catch(() => { });

  const pass = results.filter(r => r.ok).length;
  console.log('| ID | case | result | detail |');
  console.log('|---|---|---|---|');
  results.forEach(r => console.log(`| ${r.id} | ${r.name} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.detail} |`));
  console.log(`\nTOTAL ${results.length} — PASS ${pass} — FAIL ${results.length - pass}`);
})();

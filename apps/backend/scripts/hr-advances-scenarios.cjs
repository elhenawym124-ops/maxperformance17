/**
 * HR advances lifecycle — request → approve → pay → payroll deduction.
 * node apps/backend/scripts/hr-advances-scenarios.cjs
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

(async () => {
  const owner = await login('trial.owner@maxp.test');
  const hr = await login('trial.hr@maxp.test');
  const agent = await login('trial.agent@maxp.test');
  const stamp = Date.now().toString(36);

  const cfg = await call('GET', '/hr/advances/my-config', agent);
  const maxAllowed = cfg.d?.settings?.maxAllowedAmount || 0;
  rec('P8-1', 'قراءة إعدادات السلف', cfg.status === 200 && maxAllowed > 0, `max=${maxAllowed}`);

  const create = await call('POST', '/hr/advances', agent, {
    amount: 1000, reason: `QA سلفة ${stamp}`, repaymentType: 'MONTHLY', installmentsCount: 2, monthlyAmount: 500,
  });
  const advance = create.d?.data || create.d?.advance;
  rec('P8-2', 'موظف يطلب سلفة', create.status === 201, `${create.status} ${create.d?.error || ''}`);
  rec('P8-3', 'السلفة تُرفض فوق الحد الأقصى', (await call('POST', '/hr/advances', agent, { amount: maxAllowed + 5000, reason: 'QA فوق الحد', repaymentType: 'MONTHLY' })).status === 400, '');

  const selfApprove = advance?.id ? await call('POST', `/hr/advances/${advance.id}/approve`, agent, {}) : { status: 0 };
  rec('P8-4', 'الموظف لا يعتمد سلفته', selfApprove.status === 403, `${selfApprove.status}`);

  const approve = advance?.id ? await call('POST', `/hr/advances/${advance.id}/approve`, hr, {}) : { status: 0 };
  rec('P8-5', 'اعتماد السلفة', [200, 201].includes(approve.status), `${approve.status} ${approve.d?.error || ''}`);

  const paid = advance?.id ? await call('POST', `/hr/advances/${advance.id}/mark-paid`, hr, {}) : { status: 0 };
  rec('P8-6', 'صرف السلفة', [200, 201].includes(paid.status), `${paid.status} ${paid.d?.error || ''}`);

  // payroll deduction
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  await call('POST', '/hr/payroll/generate', hr, { month, year, forceRegenerate: true });
  const rows = (await call('GET', `/hr/payroll?month=${month}&year=${year}&limit=100`, hr)).d?.payrolls || [];
  const empsList = (await call('GET', '/hr/employees?limit=100', hr)).d?.employees || [];
  const agentEmp = empsList.find(e => (e.email || '').includes('agent')) || empsList[0];
  const myRow = rows.find(r => r.userId === agentEmp?.userId);

  let advanceInPayroll = 0;
  try {
    const d = JSON.parse(myRow?.deductions || '{}');
    const details = Array.isArray(d.advanceDetails) ? d.advanceDetails : [];
    advanceInPayroll = details.reduce((s, x) => s + (Number(x.amount) || 0), 0) || Number(d['سلف'] || 0);
  } catch { advanceInPayroll = 0; }

  rec('P8-7', 'السلفة تُخصم في المسير', Boolean(myRow) && advanceInPayroll > 0,
    `advanceDeduction=${advanceInPayroll} net=${myRow?.netSalary} totalDeductions=${myRow?.totalDeductions}`);

  // reject flow
  const create2 = await call('POST', '/hr/advances', agent, { amount: 400, reason: `QA سلفة مرفوضة ${stamp}`, repaymentType: 'MONTHLY' });
  const adv2 = create2.d?.data || create2.d?.advance;
  const reject = adv2?.id ? await call('POST', `/hr/advances/${adv2.id}/reject`, hr, { reason: 'QA رفض' }) : { status: 0 };
  rec('P8-8', 'رفض السلفة', [200, 201].includes(reject.status), `${reject.status} ${reject.d?.error || ''}`);

  // cleanup
  for (const r of rows) await call('DELETE', `/hr/payroll/${r.id}`, owner).catch(() => { });
  if (advance?.id) await call('DELETE', `/hr/advances/${advance.id}`, hr).catch(() => { });
  if (adv2?.id) await call('DELETE', `/hr/advances/${adv2.id}`, hr).catch(() => { });

  const pass = results.filter(r => r.ok).length;
  console.log('| ID | case | result | detail |');
  console.log('|---|---|---|---|');
  results.forEach(r => console.log(`| ${r.id} | ${r.name} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.detail} |`));
  console.log(`\nTOTAL ${results.length} — PASS ${pass} — FAIL ${results.length - pass}`);
})();

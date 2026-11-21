/**
 * HR admin scenarios — Package 5 (shifts, benefits, deductions, rewards).
 * node apps/backend/scripts/hr-admin-scenarios.cjs
 */
const B = 'https://maxp.online/api/v1';
const TAG = 'QA5';
const results = [];
const rec = (id, area, name, ok, detail) => results.push({ id, area, name, ok, detail: String(detail ?? '').slice(0, 200) });

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
  const owner = await login('trial.owner@maxp.test');
  const hr = await login('trial.hr@maxp.test');
  const agent = await login('trial.agent@maxp.test');
  const stamp = Date.now().toString(36);

  const emps = (await call('GET', '/hr/employees?limit=50', hr)).d?.employees || [];
  const target = emps.find(e => e.role === 'AGENT' || e.email?.includes('agent')) || emps[0];
  const targetUserId = target?.userId || target?.id;
  rec('SETUP', 'setup', 'تحديد موظف هدف', Boolean(targetUserId), target?.email || '');

  // ── Shifts ──
  const sBody = { name: `وردية ${TAG} ${stamp}`, startTime: '09:00', endTime: '17:00', workDays: [1, 2, 3, 4, 5] };
  const sCreate = await call('POST', '/hr/shifts', hr, sBody);
  const shift = sCreate.d?.shift || sCreate.d?.data || null;
  rec('P5-S1', 'shifts', 'إنشاء وردية', [200, 201].includes(sCreate.status), `${sCreate.status} ${sCreate.d?.error || ''}`);

  const sBad = await call('POST', '/hr/shifts', hr, { ...sBody, name: `وردية سيئة ${stamp}`, startTime: '25:00', endTime: '09:00' });
  rec('P5-S2', 'shifts', 'رفض وقت وردية غير صالح', [400, 422].includes(sBad.status), `${sBad.status} ${sBad.d?.error || ''}`);

  const sList = await call('GET', '/hr/shifts', hr);
  const sRows = sList.d?.shifts || sList.d?.data || [];
  rec('P5-S3', 'shifts', 'الوردية تظهر في القائمة', sList.status === 200 && sRows.some(r => (r.name || '') === sBody.name), `rows=${sRows.length}`);

  const sUpd = shift?.id ? await call('PUT', `/hr/shifts/${shift.id}`, hr, { endTime: '18:00' }) : { status: 0 };
  rec('P5-S4', 'shifts', 'تعديل وردية', sUpd.status === 200, `${sUpd.status} ${sUpd.d?.error || ''}`);

  const assignDate = plus(20 + (Date.now() % 7));
  const sAssign = shift?.id ? await call('POST', '/hr/shifts/assign', hr, { shiftId: shift.id, employeeId: targetUserId, date: assignDate }) : { status: 0 };
  const assignmentId = sAssign.d?.assignment?.id;
  rec('P5-S5', 'shifts', 'إسناد وردية لموظف', [200, 201].includes(sAssign.status), `${sAssign.status} ${sAssign.d?.error || ''}`);
  if (assignmentId) await call('DELETE', `/hr/shifts/assignments/${assignmentId}`, hr).catch(() => { });

  // ── Benefits ──
  const bBody = { name: `ميزة ${TAG} ${stamp}`, type: 'INSURANCE', cost: 1200, description: 'QA' };
  const bCreate = await call('POST', '/hr/benefits', hr, bBody);
  const benefit = bCreate.d?.benefit || bCreate.d?.data || null;
  rec('P5-B1', 'benefits', 'إنشاء ميزة', [200, 201].includes(bCreate.status), `${bCreate.status} ${bCreate.d?.error || ''}`);

  const bEnroll = benefit?.id ? await call('POST', '/hr/benefits/enroll', hr, { benefitId: benefit.id, employeeId: targetUserId }) : { status: 0 };
  rec('P5-B2', 'benefits', 'تسجيل موظف في الميزة', [200, 201].includes(bEnroll.status), `${bEnroll.status} ${bEnroll.d?.error || ''}`);

  const bEnrollAgain = benefit?.id ? await call('POST', '/hr/benefits/enroll', hr, { benefitId: benefit.id, employeeId: targetUserId }) : { status: 0 };
  rec('P5-B3', 'benefits', 'منع تسجيل نفس الموظف مرتين', [400, 409].includes(bEnrollAgain.status), `${bEnrollAgain.status} ${bEnrollAgain.d?.error || ''}`);

  const bList = await call('GET', '/hr/benefits', hr);
  const bRows = bList.d?.benefits || bList.d?.data || [];
  rec('P5-B4', 'benefits', 'الميزة تظهر في القائمة', bList.status === 200 && bRows.some(r => (r.name || '') === bBody.name), `rows=${bRows.length}`);

  // ── Deductions ──
  const dBody = { employeeId: targetUserId, amount: 250, reason: `${TAG} خصم اختباري`, date: plus(-1), type: 'OTHER' };  const dCreate = await call('POST', '/hr/deductions', hr, dBody);
  const deduction = dCreate.d?.deduction || dCreate.d?.data || null;
  rec('P5-D1', 'deductions', 'إنشاء خصم', [200, 201].includes(dCreate.status), `${dCreate.status} ${dCreate.d?.error || ''}`);

  const dApprove = deduction?.id ? await call('POST', `/hr/deductions/${deduction.id}/approve`, hr, {}) : { status: 0 };
  rec('P5-D2', 'deductions', 'اعتماد خصم', dApprove.status === 200, `${dApprove.status} ${dApprove.d?.error || ''}`);

  const dApproveAgain = deduction?.id ? await call('POST', `/hr/deductions/${deduction.id}/approve`, hr, {}) : { status: 0 };
  rec('P5-D3', 'deductions', 'منع اعتماد الخصم مرتين', [400, 409].includes(dApproveAgain.status), `${dApproveAgain.status} ${dApproveAgain.d?.error || ''}`);

  const dList = await call('GET', `/hr/deductions?employeeId=${targetUserId}`, hr);
  const dRows = dList.d?.deductions || dList.d?.data || [];
  rec('P5-D4', 'deductions', 'الخصم يظهر في القائمة', dList.status === 200 && dRows.length > 0, `rows=${dRows.length}`);

  // ── Rewards ──
  const rTypes = await call('GET', '/hr/rewards/types', hr);
  rec('P5-R1', 'rewards', 'قراءة أنواع المكافآت', rTypes.status === 200, `${rTypes.status}`);

  const rRecords = await call('GET', '/hr/rewards/records', hr);
  rec('P5-R2', 'rewards', 'قراءة سجلات المكافآت', rRecords.status === 200, `${rRecords.status}`);

  const myRewards = await call('GET', '/hr/rewards/my-rewards', agent);
  rec('P5-R3', 'rewards', 'الموظف يرى مكافآته فقط', myRewards.status === 200, `${myRewards.status}`);

  // ── Training / Warnings (read + create) ──
  const tCreate = await call('POST', '/hr/trainings', hr, { trainingName: `${TAG} تدريب`, type: 'INTERNAL', startDate: plus(3), employeeId: targetUserId });
  rec('P5-T1', 'training', 'إنشاء تدريب', [200, 201].includes(tCreate.status), `${tCreate.status} ${tCreate.d?.error || ''}`);

  const wCreate = await call('POST', '/hr/warnings', hr, { employeeId: targetUserId, type: 'VERBAL', title: `${TAG} إنذار`, description: 'QA', incidentDate: plus(-1), severity: 'LOW' });
  rec('P5-W1', 'warnings', 'إنشاء إنذار', [200, 201].includes(wCreate.status), `${wCreate.status} ${wCreate.d?.error || ''}`);

  // ── cleanup ──
  const shiftId = shift?.id;
  if (shiftId) await call('DELETE', `/hr/shifts/${shiftId}`, hr).catch(() => { });
  if (benefit?.id) await call('DELETE', `/hr/benefits/${benefit.id}`, hr).catch(() => { });
  if (deduction?.id) await call('DELETE', `/hr/deductions/${deduction.id}`, hr).catch(() => { });
  if (tCreate.d?.training?.id || tCreate.d?.data?.id) await call('DELETE', `/hr/trainings/${tCreate.d.training?.id || tCreate.d.data.id}`, hr).catch(() => { });
  if (wCreate.d?.warning?.id || wCreate.d?.data?.id) await call('DELETE', `/hr/warnings/${wCreate.d.warning?.id || wCreate.d.data.id}`, hr).catch(() => { });

  const pass = results.filter(r => r.ok).length;
  console.log('| ID | area | case | result | detail |');
  console.log('|---|---|---|---|---|');
  results.forEach(r => console.log(`| ${r.id} | ${r.area} | ${r.name} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.detail} |`));
  console.log(`\nTOTAL ${results.length} — PASS ${pass} — FAIL ${results.length - pass}`);
})();

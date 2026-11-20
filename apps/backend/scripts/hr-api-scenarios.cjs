/**
 * HR API scenarios — Packages 1..4 against the 14-day trial tenant.
 * Read + write paths, executed through the public API (no DB access).
 *
 *   node scripts/hr-api-scenarios.cjs
 *
 * Safety: writes only rows named/dated as CLEARLY test data, and removes what
 * the API allows removing at the end. Never touches other companies.
 */
const BASE = 'https://maxp.online/api/v1';
const PASSWORD = 'Maxp@2026';
const TAG = 'QA';
const STAMP = Date.now().toString(36);

const results = [];
const record = (id, area, name, ok, detail) => {
  results.push({ id, area, name, ok, detail: String(detail ?? '').slice(0, 220) });
};

const login = async (email) => {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, token: j?.data?.token, user: j?.data?.user };
};

const call = async (method, path, token, body) => {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  let data = null;
  try { data = await r.json(); } catch { }
  return { status: r.status, data };
};

const iso = (d) => new Date(d).toISOString().slice(0, 10);
const plus = (days) => iso(Date.now() + days * 86400000);

(async () => {
  // ── auth ──
  const owner = await login('trial.owner@maxp.test');
  const hr = await login('trial.hr@maxp.test');
  const agent = await login('trial.agent@maxp.test');
  record('SETUP-1', 'setup', 'تسجيل دخول الأدوار الثلاثة', Boolean(owner.token && hr.token && agent.token),
    `owner=${owner.status} hr=${hr.status} agent=${agent.status}`);

  // ── shared fixtures ──
  const deps = await call('GET', '/hr/departments', owner.token);
  const deptList = deps.data?.departments || deps.data?.data || [];
  const departmentId = deptList?.[0]?.id;
  const poss = await call('GET', '/hr/positions', owner.token);
  const posList = poss.data?.positions || poss.data?.data || [];
  const positionId = posList?.[0]?.id;
  record('SETUP-2', 'setup', 'قراءة الأقسام والوظائف', Boolean(departmentId), `dept=${deps.status}/${deptList.length} pos=${poss.status}/${posList.length}`);

  // ══════════════ Package 1 — Employees ══════════════
  const newEmail = `qa-emp-${STAMP}@trial.maxp.test`;
  const employeeBody = {
    firstName: 'موظف',
    lastName: `اختبار ${TAG}`,
    email: newEmail,
    password: 'QaTest@2026',
    phone: '01099887700',
    hireDate: plus(-1),
    departmentId,
    positionId,
    baseSalary: 9500,    contractType: 'FULL_TIME',
    role: 'AGENT',
  };

  const create = await call('POST', '/hr/employees', owner.token, employeeBody);
  const created = create.data?.employee || create.data?.data || null;
  const createdUserId = created?.userId || created?.id || null;
  record('HR-01', 'employees', 'إضافة موظف جديد (بيانات صحيحة)', create.status === 201,
    `${create.status} ${created?.employeeNumber || create.data?.error || ''}`);

  const dup = await call('POST', '/hr/employees', owner.token, employeeBody);
  record('HR-03', 'employees', 'منع نفس البريد مرتين', dup.status === 409 || dup.status === 400,
    `${dup.status} ${dup.data?.error || ''}`);

  const badEmail = await call('POST', '/hr/employees', owner.token, { ...employeeBody, email: 'not-an-email' });
  record('HR-02', 'employees', 'رفض بريد غير صحيح', badEmail.status === 400,
    `${badEmail.status} ${badEmail.data?.error || ''}`);

  const escalation = await call('POST', '/hr/employees', owner.token, { ...employeeBody, email: `qa-esc-${STAMP}@trial.maxp.test`, role: 'SUPER_ADMIN' });
  record('HR-04', 'employees', 'منع تصعيد الدور إلى SUPER_ADMIN', [400, 403].includes(escalation.status),
    `${escalation.status} ${escalation.data?.error || ''}`);

  const agentCreate = await call('POST', '/hr/employees', agent.token, { ...employeeBody, email: `qa-agent-${STAMP}@trial.maxp.test` });
  record('HR-05', 'employees', 'الموظف AGENT لا يضيف موظفين', agentCreate.status === 403,
    `${agentCreate.status}`);

  const list = await call('GET', '/hr/employees', owner.token);
  const listRows = list.data?.employees || list.data?.data || [];
  record('HR-06', 'employees', 'الموظف الجديد يظهر في القائمة', listRows.some(e => (e.email || '').toLowerCase() === newEmail),
    `rows=${listRows.length}`);

  const upd = created?.id
    ? await call('PUT', `/hr/employees/${created.id}`, owner.token, { phone: '01099887711', baseSalary: 10100 })
    : { status: 0 };
  record('HR-07', 'employees', 'تعديل بيانات الموظف', upd.status === 200, `${upd.status} ${upd.data?.error || ''}`);

  // ══════════════ Package 2 — Attendance ══════════════
  const checkIn = await call('POST', '/hr/attendance/check-in', agent.token, { method: 'MANUAL', workMode: 'OFFICE' });
  const alreadyIn = /مسبق|already/i.test(JSON.stringify(checkIn.data || {}));
  record('HR-08', 'attendance', 'تسجيل حضور (check-in)', [200, 201].includes(checkIn.status) || (checkIn.status === 400 && alreadyIn),
    `${checkIn.status} ${checkIn.data?.error || checkIn.data?.message || ''}${alreadyIn ? ' (مسجّل مسبقًا — سلوك صحيح)' : ''}`);

  const checkIn2 = await call('POST', '/hr/attendance/check-in', agent.token, { method: 'MANUAL', workMode: 'OFFICE' });
  record('HR-09', 'attendance', 'منع تسجيل حضور مكرر', [400, 409].includes(checkIn2.status),
    `${checkIn2.status} ${checkIn2.data?.error || checkIn2.data?.message || ''}`);

  const checkOut = await call('POST', '/hr/attendance/check-out', agent.token, { method: 'MANUAL' });
  record('HR-10', 'attendance', 'تسجيل انصراف (check-out)', [200, 201].includes(checkOut.status),
    `${checkOut.status} ${checkOut.data?.error || checkOut.data?.message || ''}`);

  const manual = await call('POST', '/hr/attendance/manual', hr.token, {
    employeeId: createdUserId,
    date: plus(-2),
    status: 'PRESENT',
    checkIn: '09:00',
    checkOut: '17:00',
    notes: `${TAG} manual entry`,
  });
  const manualHasTimes = Boolean(manual.data?.attendance?.checkIn && manual.data?.attendance?.checkOut);
  record('HR-11', 'attendance', 'تسجيل حضور يدوي لموظف (بوقت دخول/خروج)', [200, 201].includes(manual.status) && manualHasTimes,
    `${manual.status} in=${manual.data?.attendance?.checkIn || '-'} out=${manual.data?.attendance?.checkOut || '-'}`);

  const badManual = await call('POST', '/hr/attendance/manual', hr.token, {
    userId: createdUserId, date: plus(-3), status: 'NOT_A_STATUS',
  });
  record('HR-12', 'attendance', 'رفض حالة حضور غير صحيحة', badManual.status === 400,
    `${badManual.status} ${badManual.data?.error || ''}`);

  const attList = await call('GET', `/hr/attendance?startDate=${plus(-3)}&endDate=${plus(1)}`, hr.token);
  const attRows = attList.data?.records || attList.data?.data || [];
  record('HR-13', 'attendance', 'سجلات الحضور ترجع للفترة المطلوبة', attList.status === 200 && attRows.length > 0,
    `${attList.status} rows=${attRows.length}`);

  // ══════════════ Package 3 — Leaves ══════════════
  const leaveBody = {
    employeeId: (await call('GET', '/hr/employees/me', agent.token)).data?.employee?.id || undefined,
    type: 'ANNUAL',
    startDate: plus(10),
    endDate: plus(12),
    reason: `${TAG} إجازة اختبارية`,
  };
  const leaveCreate = await call('POST', '/hr/leaves', agent.token, leaveBody);
  const leave = leaveCreate.data?.leave || leaveCreate.data?.data || null;
  record('HR-14', 'leaves', 'الموظف يقدّم طلب إجازة', leaveCreate.status === 201,
    `${leaveCreate.status} ${leaveCreate.data?.error || leave?.status || ''}`);

  const badLeave = await call('POST', '/hr/leaves', agent.token, { ...leaveBody, type: 'NOT_A_TYPE' });
  record('HR-15', 'leaves', 'رفض نوع إجازة غير صحيح', badLeave.status === 400,
    `${badLeave.status} ${badLeave.data?.error || ''}`);

  const reversed = await call('POST', '/hr/leaves', agent.token, { ...leaveBody, startDate: plus(20), endDate: plus(18) });
  record('HR-16', 'leaves', 'رفض تاريخ نهاية قبل البداية', [400, 422].includes(reversed.status),
    `${reversed.status} ${reversed.data?.error || ''}`);

  const overBalance = await call('POST', '/hr/leaves', agent.token, {
    employeeId: leaveBody.employeeId, type: 'ANNUAL', startDate: plus(30), endDate: plus(89), reason: `${TAG} رصيد غير كافٍ`,
  });
  record('HR-17', 'leaves', 'رفض إجازة تتجاوز الرصيد', [400, 422].includes(overBalance.status),
    `${overBalance.status} ${overBalance.data?.error || ''}`);

  let balanceBefore = null;
  if (leaveBody.employeeId) {
    const b = await call('GET', `/hr/leaves/balance/${leaveBody.employeeId}`, hr.token);
    balanceBefore = b.data?.balance?.annual?.balance ?? null;
  }

  const approve = leave?.id
    ? await call('POST', `/hr/leaves/${leave.id}/approve`, hr.token, {})
    : { status: 0 };
  record('HR-18', 'leaves', 'اعتماد الإجازة', approve.status === 200,
    `${approve.status} ${approve.data?.error || approve.data?.leave?.status || ''}`);

  const approveAgain = leave?.id
    ? await call('POST', `/hr/leaves/${leave.id}/approve`, hr.token, {})
    : { status: 0 };
  record('HR-19', 'leaves', 'منع اعتماد نفس الطلب مرتين', [400, 409].includes(approveAgain.status),
    `${approveAgain.status} ${approveAgain.data?.error || ''}`);

  let balanceAfter = null;
  if (leaveBody.employeeId) {
    const b = await call('GET', `/hr/leaves/balance/${leaveBody.employeeId}`, hr.token);
    balanceAfter = b.data?.balance?.annual?.balance ?? null;
  }
  record('HR-20', 'leaves', 'رصيد الإجازات ينقص بعد الاعتماد',
    balanceBefore !== null && balanceAfter !== null && Number(balanceAfter) < Number(balanceBefore),
    `before=${balanceBefore} after=${balanceAfter}`);

  const agentApprove = leave?.id
    ? await call('POST', `/hr/leaves/${leave.id}/approve`, agent.token, {})
    : { status: 0 };
  record('HR-21', 'leaves', 'الموظف لا يعتمد إجازته', agentApprove.status === 403,
    `${agentApprove.status}`);

  // ══════════════ Package 4 — Payroll ══════════════
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + 1, 1); // next month — keeps current month intact
  const pMonth = target.getMonth() + 1;
  const pYear = target.getFullYear();

  const gen = await call('POST', '/hr/payroll/generate', hr.token, { month: pMonth, year: pYear });
  record('HR-22', 'payroll', 'توليد مسير شهر جديد', [200, 201].includes(gen.status),
    `${gen.status} ${JSON.stringify(gen.data?.result || gen.data?.error || '').slice(0, 120)}`);

  const summary = await call('GET', `/hr/payroll/summary?month=${pMonth}&year=${pYear}`, hr.token);
  const sum = summary.data?.summary || {};
  record('HR-23', 'payroll', 'ملخص المسير يرجع أرقامًا', summary.status === 200 && Number(sum.totalEmployees) >= 0,
    `${summary.status} employees=${sum.totalEmployees} net=${sum.totalNet}`);

  const genAgain = await call('POST', '/hr/payroll/generate', hr.token, { month: pMonth, year: pYear });
  const summaryAgain = await call('GET', `/hr/payroll/summary?month=${pMonth}&year=${pYear}`, hr.token);
  const sum2 = summaryAgain.data?.summary || {};
  record('HR-24', 'payroll', 'إعادة التوليد لا تُضاعف المسير',
    String(sum2.totalEmployees) === String(sum.totalEmployees) && String(sum2.totalNet) === String(sum.totalNet),
    `again=${genAgain.status} before=${sum.totalEmployees}/${sum.totalNet} after=${sum2.totalEmployees}/${sum2.totalNet}`);

  const payList = await call('GET', `/hr/payroll?month=${pMonth}&year=${pYear}`, hr.token);
  const payRows = payList.data?.payrolls || payList.data?.data || [];
  const firstRow = payRows[0];

  const approvePay = firstRow
    ? await call('POST', `/hr/payroll/${firstRow.id}/approve`, owner.token, {})
    : { status: 0 };
  record('HR-25', 'payroll', 'اعتماد مسير راتب', approvePay.status === 200,
    `${approvePay.status} ${approvePay.data?.error || ''}`);

  const payPay = firstRow
    ? await call('POST', `/hr/payroll/${firstRow.id}/pay`, owner.token, { paymentMethod: 'CASH' })
    : { status: 0 };
  record('HR-26', 'payroll', 'صرف مسير راتب', payPay.status === 200,
    `${payPay.status} ${payPay.data?.error || ''}`);

  const agentGen = await call('POST', '/hr/payroll/generate', agent.token, { month: pMonth, year: pYear });
  record('HR-27', 'payroll', 'الموظف لا يولّد مسير رواتب', agentGen.status === 403,
    `${agentGen.status}`);

  const myPay = await call('GET', '/hr/payroll/my-history', agent.token);
  record('HR-28', 'payroll', 'الموظف يرى سجل رواتبه فقط', myPay.status === 200,
    `${myPay.status}`);

  // ── cleanup (best effort) ──
  for (const row of payRows) {
    await call('DELETE', `/hr/payroll/${row.id}`, owner.token).catch(() => { });
  }
  if (leave?.id) await call('DELETE', `/hr/leaves/${leave.id}`, owner.token, { confirmationText: 'DELETE' }).catch(() => { });
  if (created?.id) await call('DELETE', `/hr/employees/${created.id}`, owner.token, { confirmationText: 'DELETE' }).catch(() => { });

  // ── report ──
  const pass = results.filter(r => r.ok).length;
  console.log('\n| ID | المجال | السيناريو | النتيجة | تفاصيل |');
  console.log('|---|---|---|---|---|');
  for (const r of results) {
    console.log(`| ${r.id} | ${r.area} | ${r.name} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.detail} |`);
  }
  console.log(`\nTOTAL ${results.length} — PASS ${pass} — FAIL ${results.length - pass}`);
  const fails = results.filter(r => !r.ok);
  if (fails.length) {
    console.log('\nFAILURES:');
    fails.forEach(f => console.log(`- ${f.id} ${f.name} :: ${f.detail}`));
  }
})();

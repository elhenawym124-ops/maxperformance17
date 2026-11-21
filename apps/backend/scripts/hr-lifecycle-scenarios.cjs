/**
 * HR employee lifecycle scenarios — Package 1 gaps.
 * node apps/backend/scripts/hr-lifecycle-scenarios.cjs
 */
const B = 'https://maxp.online/api/v1';
const results = [];
const rec = (id, name, ok, detail) => results.push({ id, name, ok, detail: String(detail ?? '').slice(0, 200) });

const call = async (m, p, t, b) => {
  const r = await fetch(B + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, ...(b !== undefined ? { body: JSON.stringify(b) } : {}) });
  let d = null; try { d = await r.json(); } catch { }
  return { status: r.status, d };
};
const login = async (e, pw = 'Maxp@2026') => {
  const r = await call('POST', '/auth/login', null, { email: e, password: pw });
  return { status: r.status, token: r.d?.data?.token };
};

(async () => {
  const owner = await login('trial.owner@maxp.test');
  const hr = await login('trial.hr@maxp.test');
  const stamp = Date.now().toString(36);
  const email = `qa-life-${stamp}@trial.maxp.test`;
  const password = 'QaTest@2026';

  const created = await call('POST', '/hr/employees', owner.token, {
    firstName: 'دورة', lastName: 'حياة', email, password,
    phone: '01099887799', hireDate: '2026-09-01', baseSalary: 12000,
    contractType: 'FULL_TIME', role: 'AGENT',
  });
  const empId = created.d?.employee?.id;
  rec('L0', 'إنشاء موظف للاختبار', created.status === 201 && Boolean(empId), `${created.status}`);

  const firstLogin = await login(email, password);
  rec('L1', 'الموظف يقدر يدخل بكلمة السر', firstLogin.status === 200, `${firstLogin.status}`);

  const freeze = await call('POST', `/hr/employees/${empId}/toggle-user-status`, hr.token, { isActive: false });
  rec('L2', 'تجميد حساب الموظف', freeze.status === 200, `${freeze.status} ${freeze.d?.error || freeze.d?.message || ''}`);

  const afterFreeze = await login(email, password);
  rec('L3', 'الحساب المجمّد لا يستطيع الدخول', [401, 403].includes(afterFreeze.status), `${afterFreeze.status}`);

  const unfreeze = await call('POST', `/hr/employees/${empId}/toggle-user-status`, hr.token, { isActive: true });
  rec('L4', 'إعادة تفعيل الحساب', unfreeze.status === 200, `${unfreeze.status} ${unfreeze.d?.error || ''}`);

  const afterUnfreeze = await login(email, password);
  rec('L5', 'الحساب يعود للدخول بعد التفعيل', afterUnfreeze.status === 200, `${afterUnfreeze.status}`);

  const reset = await call('POST', `/hr/employees/${empId}/reset-password`, hr.token, {});
  const tempPw = reset.d?.data?.temporaryPassword || reset.d?.temporaryPassword || reset.d?.tempPassword;
  rec('L6', 'إعادة تعيين كلمة المرور', reset.status === 200, `${reset.status} ${reset.d?.error || (tempPw ? 'temp password returned' : '')}`);

  let activePassword = password;
  if (tempPw) {
    const loginTemp = await login(email, tempPw);
    rec('L7', 'الدخول بكلمة السر المؤقتة', loginTemp.status === 200, `${loginTemp.status}`);
    if (loginTemp.status === 200) activePassword = tempPw;
  } else {
    rec('L7', 'الدخول بكلمة السر المؤقتة', false, 'temp password not returned by API');
  }

  const terminate = await call('POST', `/hr/employees/${empId}/terminate`, hr.token, { terminationDate: new Date().toISOString().slice(0, 10), reason: 'QA إنهاء اختباري' });
  rec('L8', 'إنهاء خدمة الموظف', terminate.status === 200, `${terminate.status} ${terminate.d?.error || ''}`);

  const terminateAgain = await call('POST', `/hr/employees/${empId}/terminate`, hr.token, { terminationDate: new Date().toISOString().slice(0, 10), reason: 'again' });
  rec('L9', 'إنهاء الخدمة مرتين لا يرمي 500', [400, 409].includes(terminateAgain.status), `${terminateAgain.status} ${terminateAgain.d?.error || ''}`);

  const reactivate = await call('POST', `/hr/employees/${empId}/reactivate`, hr.token, {});
  rec('L10', 'إعادة تفعيل الموظف المنتهي', reactivate.status === 200, `${reactivate.status} ${reactivate.d?.error || ''}`);

  const relogin = await login(email, activePassword);
  rec('L11', 'الموظف يعود للدخول بعد إعادة التفعيل', relogin.status === 200, `${relogin.status}`);

  // link existing user without employee record
  const newUserEmail = `qa-link-${stamp}@trial.maxp.test`;
  const linkTarget = await call('POST', '/hr/employees', owner.token, {
    firstName: 'ربط', lastName: 'حساب', email: newUserEmail, password: 'QaTest@2026',
    phone: '01099887711', hireDate: '2026-09-01', baseSalary: 9000, contractType: 'FULL_TIME', role: 'AGENT',
  });
  const linkEmpId = linkTarget.d?.employee?.id;
  const linkUserId = null; // link endpoint expects an existing user id; covered separately if available
  rec('L12', 'إنشاء موظف للربط', linkTarget.status === 201, `${linkTarget.status}`);

  const delNoConfirm = await call('DELETE', `/hr/employees/${empId}`, owner.token);
  rec('L13', 'الحذف بدون تأكيد → 400', delNoConfirm.status === 400, `${delNoConfirm.status}`);

  const del = await call('DELETE', `/hr/employees/${empId}`, owner.token, { confirmationText: 'DELETE' });
  rec('L14', 'حذف الموظف بتأكيد', del.status === 200, `${del.status} ${del.d?.error || ''}`);

  if (linkEmpId) await call('DELETE', `/hr/employees/${linkEmpId}`, owner.token, { confirmationText: 'DELETE' }).catch(() => { });

  const pass = results.filter(r => r.ok).length;
  console.log('| ID | case | result | detail |');
  console.log('|---|---|---|---|');
  results.forEach(r => console.log(`| ${r.id} | ${r.name} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.detail} |`));
  console.log(`\nTOTAL ${results.length} — PASS ${pass} — FAIL ${results.length - pass}`);
})();

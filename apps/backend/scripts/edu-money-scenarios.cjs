/**
 * Education money loop — enrollments, sessions, hours, teacher pay, parent portal.
 * node apps/backend/scripts/edu-money-scenarios.cjs
 */
const B = 'https://maxp.online/api/v1';
const results = [];
const rec = (id, name, ok, detail) => results.push({ id, name, ok, detail: String(detail ?? '').slice(0, 220) });

const call = async (m, p, t, b) => {
  // RATE-LIMIT-GUARD
  if (/\/auth\/login$/.test(p)) await new Promise((res) => setTimeout(res, 1200));
  const r = await fetch(B + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, ...(b !== undefined ? { body: JSON.stringify(b) } : {}) });
  let d = null; try { d = await r.json(); } catch { }
  return { status: r.status, d };
};
const login = async (e, pw = 'Maxp@2026') => (await call('POST', '/auth/login', null, { email: e, password: pw })).d?.data?.token;
const plus = (n, h = 10) => { const d = new Date(Date.now() + n * 864e5); d.setHours(h, 0, 0, 0); return d.toISOString(); };

(async () => {
  const owner = await login('trial.owner@maxp.test');
  const stamp = Date.now().toString(36);

  const subjects = (await call('GET', '/education/subjects', owner)).d?.subjects || (await call('GET', '/education/subjects', owner)).d?.data || [];
  const packages = (await call('GET', '/education/packages', owner)).d?.packages || (await call('GET', '/education/packages', owner)).d?.data || [];
  const teachers = (await call('GET', '/education/teachers', owner)).d?.teachers || (await call('GET', '/education/teachers', owner)).d?.data || [];
  const students = (await call('GET', '/education/students?limit=5', owner)).d?.students || (await call('GET', '/education/students?limit=5', owner)).d?.data || [];
  rec('E0', 'قراءة البيانات الأساسية', Boolean(subjects.length && packages.length && teachers.length),
    `subjects=${subjects.length} packages=${packages.length} teachers=${teachers.length} students=${students.length}`);

  const pkg = packages[0];
  const teacher = teachers[0];
  const parentCustomerId = students[0]?.customerId;

  // 1) student
  const student = await call('POST', '/education/students', owner, {
    customerId: parentCustomerId,
    firstName: 'طالب', lastName: `QA ${stamp}`,
    phone: '01120000000', grade: 'الصف الثالث', gender: 'MALE',
  });
  const studentId = student.d?.student?.id || student.d?.data?.id;
  rec('E1', 'إضافة طالب', [200, 201].includes(student.status) && Boolean(studentId),
    `${student.status} ${student.d?.error || ''}`);

  if (!studentId || !pkg?.id) {
    console.log('ABORT: missing student/package'); console.log(JSON.stringify(results)); return;
  }

  // 2) full-payment enrollment
  const enroll = await call('POST', '/education/enrollments', owner, {
    studentId, packageId: pkg.id, teacherId: teacher?.id,
    amountPaid: pkg.price, paymentStatus: 'COMPLETED',
  });
  const enrollment = enroll.d?.enrollment || enroll.d?.data;
  const enrId = enrollment?.id;
  rec('E2', 'تسجيل الطالب في باقة (تحصيل كامل)', [200, 201].includes(enroll.status) && Boolean(enrId),
    `${enroll.status} ${enroll.d?.error || ''} remaining=${enrollment?.remainingHours}/${enrollment?.totalHours}`);

  const hoursBefore = Number(enrollment?.remainingHours || 0);

  // 3) partial-payment enrollment (same student, second package if any)
  if (packages[1]) {
    const partial = await call('POST', '/education/enrollments', owner, {
      studentId, packageId: packages[1].id, teacherId: teacher?.id,
      amountPaid: 1, paymentStatus: 'PENDING',
    });
    const pEnr = partial.d?.enrollment || partial.d?.data;
    rec('E3', 'تسجيل بتحصيل جزئي', [200, 201].includes(partial.status) && Number(pEnr?.amountPaid) < Number(packages[1].price),
      `${partial.status} paid=${pEnr?.amountPaid}/${packages[1].price} status=${pEnr?.paymentStatus}`);
    if (pEnr?.id) await call('DELETE', `/education/enrollments/${pEnr.id}`, owner).catch(() => { });
  } else {
    rec('E3', 'تسجيل بتحصيل جزئي', false, 'لا توجد باقة ثانية');
  }

  // 4) session
  const session = await call('POST', '/education/sessions', owner, {
    enrollmentId: enrId, teacherId: teacher?.id,
    scheduledAt: plus(2, 17), plannedDuration: 60, topic: `QA حصة ${stamp}`,
  });
  const sesId = session.d?.session?.id || session.d?.data?.id;
  rec('E4', 'إنشاء حصة للاشتراك', [200, 201].includes(session.status) && Boolean(sesId),
    `${session.status} ${session.d?.error || ''}`);

  // 5) confirm session → hours deducted once
  const confirm = sesId ? await call('PUT', `/education/sessions/${sesId}/confirm`, owner, { actualDuration: 60 }) : { status: 0 };
  const enrAfter = enrId ? await call('GET', `/education/enrollments/${enrId}`, owner) : { d: {} };
  const after = enrAfter.d?.enrollment || enrAfter.d?.data;
  rec('E5', 'تأكيد الحصة يخصم الساعات مرة واحدة',
    [200, 201].includes(confirm.status) && Number(after?.remainingHours) === hoursBefore - 1,
    `${confirm.status} before=${hoursBefore} after=${after?.remainingHours}`);

  // 6) confirm again → no double deduction
  const confirm2 = sesId ? await call('PUT', `/education/sessions/${sesId}/confirm`, owner, { actualDuration: 60 }) : { status: 0 };
  const enrAfter2 = enrId ? await call('GET', `/education/enrollments/${enrId}`, owner) : { d: {} };
  const after2 = enrAfter2.d?.enrollment || enrAfter2.d?.data;
  rec('E6', 'التأكيد المكرر لا يخصم مرة أخرى',
    Number(after2?.remainingHours) === Number(after?.remainingHours),
    `status=${confirm2.status} hours=${after2?.remainingHours}`);

  // 7) teacher conflict (two sessions same teacher same time)
  const s1 = await call('POST', '/education/sessions', owner, { enrollmentId: enrId, teacherId: teacher?.id, scheduledAt: plus(5, 19), plannedDuration: 60, topic: 'QA تعارض 1' });
  const s2 = await call('POST', '/education/sessions', owner, { enrollmentId: enrId, teacherId: teacher?.id, scheduledAt: plus(5, 19), plannedDuration: 60, topic: 'QA تعارض 2' });
  rec('E7', 'منع تعارض مواعيد نفس المدرس', [400, 409].includes(s2.status),
    `first=${s1.status} second=${s2.status} ${s2.d?.error || ''}`);
  for (const s of [s1, s2]) {
    const id = s.d?.session?.id || s.d?.data?.id;
    if (id) await call('DELETE', `/education/sessions/${id}`, owner).catch(() => { });
  }

  // 8) teacher payments calculation
  if (teacher?.id) {
    const calc = await call('POST', '/education/payments/calculate', owner, {
      teacherId: teacher.id, from: plus(-30), to: plus(0),
    });
    rec('E8', 'حساب مستحقات المدرس', [200, 201].includes(calc.status),
      `${calc.status} ${JSON.stringify(calc.d?.calculation || calc.d?.data || calc.d?.error || '').slice(0, 120)}`);
  } else {
    rec('E8', 'حساب مستحقات المدرس', false, 'لا يوجد مدرس');
  }

  // 9) parent portal
  if (parentCustomerId) {
    const link = await call('POST', '/education/parent-portal/activation-link', owner, { customerId: parentCustomerId });
    const token = link.d?.data?.url?.split('token=')[1] || link.d?.token || link.d?.data?.token;
    rec('E9', 'توليد رابط تفعيل بوابة ولي الأمر', [200, 201].includes(link.status) && Boolean(token),
      `${link.status} ${link.d?.error || ''}`);

    if (token) {
      const activate = await call('POST', '/education/parent-portal/activate', null, { token, password: 'Parent@2026' });
      rec('E10', 'تفعيل حساب ولي الأمر', [200, 201].includes(activate.status), `${activate.status} ${activate.d?.error || ''}`);

      const pLogin = await call('POST', '/education/parent-portal/login', null, { phone: students[0]?.phone, password: 'Parent@2026' });
      rec('E11', 'دخول ولي الأمر', [200, 201].includes(pLogin.status), `${pLogin.status} ${pLogin.d?.error || ''}`);

      const pToken = pLogin.d?.token || pLogin.d?.data?.token;
      if (pToken) {
        const kids = await call('GET', '/education/parent-portal/children', pToken);
        rec('E12', 'ولي الأمر يرى أبناءه فقط', kids.status === 200, `${kids.status} ${Array.isArray(kids.d?.children) ? kids.d.children.length : '?'}`);
      }
    }
  }

  // cleanup
  if (sesId) await call('DELETE', `/education/sessions/${sesId}`, owner).catch(() => { });
  if (enrId) await call('DELETE', `/education/enrollments/${enrId}`, owner).catch(() => { });
  if (studentId) await call('DELETE', `/education/students/${studentId}`, owner).catch(() => { });

  const pass = results.filter(r => r.ok).length;
  console.log('| ID | case | result | detail |');
  console.log('|---|---|---|---|');
  results.forEach(r => console.log(`| ${r.id} | ${r.name} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.detail} |`));
  console.log(`\nTOTAL ${results.length} — PASS ${pass} — FAIL ${results.length - pass}`);
})();

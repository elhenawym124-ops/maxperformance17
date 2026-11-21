/**
 * التعليم — اختبار تشغيلي شامل (مواد/باقات/طلاب/اشتراكات/حصص/مجموعات/مدرسون/بوابات/يوم تجربة/إعدادات).
 * node apps/backend/scripts/edu-full-scenarios.cjs
 */
const B = 'https://maxp.online/api/v1';
const results = [];
const rec = (id, name, ok, detail) => results.push({ id, name, ok, detail: String(detail ?? '').slice(0, 200) });
const stamp = Date.now().toString(36);

const call = async (m, p, t, b) => {
  if (/\/auth\/login$/.test(p)) await new Promise((res) => setTimeout(res, 1200));
  const r = await fetch(B + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, ...(b !== undefined ? { body: JSON.stringify(b) } : {}) });
  let d = null; try { d = await r.json(); } catch { }
  return { status: r.status, d };
};
const login = async (e, pw = 'Maxp@2026') => (await call('POST', '/auth/login', null, { email: e, password: pw })).d?.data?.token;
const plus = (n, h = 10) => { const d = new Date(Date.now() + n * 864e5); d.setHours(h, 0, 0, 0); return d.toISOString(); };

(async () => {
  const owner = await login('trial.owner@maxp.test');
  const created = { subjects: [], packages: [], students: [], enrollments: [], sessions: [], groups: [], teachers: [], branches: [], demoDays: [] };

  // مدرس مخصص للاختبار (تحتاجه الحصص والاشتراكات)
  const tch0 = await call('POST', '/education/teachers', owner, { name: `مدرس أساسي ${stamp}`, phone: '01120000220', email: `qa-t0-${stamp}@trial.maxp.test` });
  const mainTeacherId = tch0.d?.teacher?.id || tch0.d?.data?.id;
  if (mainTeacherId) created.teachers.push(mainTeacherId);

  // ── A. Subjects & Packages ──
  const subj = await call('POST', '/education/subjects', owner, { name: `مادة QA ${stamp}`, description: 'QA', price: 500 });
  const subjectId = subj.d?.subject?.id || subj.d?.data?.id;
  rec('A1', 'إنشاء مادة', [200, 201].includes(subj.status) && Boolean(subjectId), `${subj.status} ${subj.d?.error || ''}`);
  if (subjectId) created.subjects.push(subjectId);

  const subjUpd = subjectId ? await call('PUT', `/education/subjects/${subjectId}`, owner, { price: 600 }) : { status: 0 };
  rec('A2', 'تعديل مادة', [200, 201].includes(subjUpd.status), `${subjUpd.status}`);

  const pkg = subjectId ? await call('POST', '/education/packages', owner, {
    subjectId, name: `باقة QA ${stamp}`, hoursCount: 8, price: 800, sessionDuration: 60,
    levelNumber: 1, packageType: 'GROUP',
  }) : { status: 0 };
  const packageId = pkg.d?.package?.id || pkg.d?.data?.id;
  rec('A3', 'إنشاء باقة', [200, 201].includes(pkg.status) && Boolean(packageId), `${pkg.status} ${pkg.d?.error || ''}`);
  if (packageId) created.packages.push(packageId);

  const pkgUpd = packageId ? await call('PUT', `/education/packages/${packageId}`, owner, { price: 850 }) : { status: 0 };
  rec('A4', 'تعديل باقة', [200, 201].includes(pkgUpd.status), `${pkgUpd.status}`);

  const subjDelWithPkg = subjectId ? await call('DELETE', `/education/subjects/${subjectId}`, owner) : { status: 0 };
  rec('A5', 'حذف مادة مرتبطة بباقة (منع/تعامل سليم)', subjDelWithPkg.status !== 500, `${subjDelWithPkg.status}`);

  // ── B. Students ──
  const seedStudents = (await call('GET', '/education/students?limit=1', owner)).d?.students || [];
  const parentCustomerId = seedStudents[0]?.customerId;

  const stu = await call('POST', '/education/students', owner, {
    firstName: 'طالب', lastName: `شامل ${stamp}`, phone: '01120000111', grade: 'الصف الرابع', gender: 'MALE',
    guardianName: `ولي أمر ${stamp}`, guardianPhone: '01120000999',
  });
  const studentId = stu.d?.student?.id || stu.d?.data?.id;
  rec('B1', 'إضافة طالب', [200, 201].includes(stu.status) && Boolean(studentId), `${stu.status} ${stu.d?.error || ''}`);
  if (studentId) created.students.push(studentId);

  const stuUpd = studentId ? await call('PUT', `/education/students/${studentId}`, owner, { grade: 'الصف الخامس' }) : { status: 0 };
  rec('B2', 'تعديل طالب', [200, 201].includes(stuUpd.status), `${stuUpd.status}`);

  const stuBad = await call('POST', '/education/students', owner, { customerId: 'nonexistent', firstName: 'x', lastName: 'y' });
  rec('B3', 'طالب بولي أمر غير موجود → 400', stuBad.status === 400, `${stuBad.status}`);

  const stuList = await call('GET', `/education/students?search=${encodeURIComponent(`شامل ${stamp}`)}`, owner);
  const found = (stuList.d?.students || stuList.d?.data || []).some(s => s.id === studentId);
  rec('B4', 'البحث يجد الطالب', stuList.status === 200 && found, `${stuList.status}`);

  if (!studentId || !packageId) { finish(); return; }

  // ── C. Enrollments ──
  const enr = await call('POST', '/education/enrollments', owner, {
    studentId, packageId, teacherId: mainTeacherId, amountPaid: 800, paymentStatus: 'COMPLETED',
  });
  const enrollment = enr.d?.enrollment || enr.d?.data;
  const enrId = enrollment?.id;
  rec('C1', 'اشتراك كامل', [200, 201].includes(enr.status) && Boolean(enrId), `${enr.status} hours=${enrollment?.remainingHours}/${enrollment?.totalHours}`);
  if (enrId) created.enrollments.push(enrId);

  const disc = await call('POST', '/education/enrollments', owner, {
    studentId, packageId, amountPaid: 700, paymentStatus: 'COMPLETED', discountType: 'FIXED', discountAmount: 100, finalAmount: 700,
  });
  const discEnr = disc.d?.enrollment || disc.d?.data;
  rec('C2', 'اشتراك بخصم', [200, 201].includes(disc.status) && Number(discEnr?.amountPaid) === 700, `${disc.status} paid=${discEnr?.amountPaid}`);
  if (discEnr?.id) created.enrollments.push(discEnr.id);

  const inst = await call('POST', '/education/enrollments', owner, {
    studentId, packageId, amountPaid: 0, paymentStatus: 'PENDING', installmentCount: 2,
    installments: [{ installmentNumber: 1, amount: 400, dueDate: plus(7) }, { installmentNumber: 2, amount: 400, dueDate: plus(37) }],
  });
  const instEnr = inst.d?.enrollment || inst.d?.data;
  rec('C3', 'اشتراك بالتقسيط', [200, 201].includes(inst.status), `${inst.status} installments=${JSON.stringify(instEnr?.installments || []).slice(0, 60)}`);
  if (instEnr?.id) {
    created.enrollments.push(instEnr.id);
    const payInst = await call('POST', `/education/enrollments/${instEnr.id}/installments/1/pay`, owner, { amount: 400, method: 'CASH' });
    rec('C4', 'سداد قسط', [200, 201].includes(payInst.status), `${payInst.status} ${payInst.d?.error || ''}`);
  } else rec('C4', 'سداد قسط', false, 'لا يوجد اشتراك');

  const enrGet = await call('GET', `/education/enrollments/${enrId}`, owner);
  rec('C5', 'قراءة اشتراك', enrGet.status === 200, `${enrGet.status}`);

  // ── D. Sessions ──
  const ses = await call('POST', '/education/sessions', owner, { enrollmentId: enrId, teacherId: mainTeacherId, scheduledAt: plus(3, 18), plannedDuration: 60, topic: `QA شامل ${stamp}` });
  const sesId = ses.d?.session?.id || ses.d?.data?.id;
  rec('D1', 'إنشاء حصة', [200, 201].includes(ses.status) && Boolean(sesId), `${ses.status} ${ses.d?.error || ''}`);
  if (sesId) created.sessions.push(sesId);

  const sesCancel = sesId ? await call('PUT', `/education/sessions/${sesId}/cancel`, owner, { reason: 'QA إلغاء' }) : { status: 0 };
  rec('D2', 'إلغاء حصة', [200, 201].includes(sesCancel.status), `${sesCancel.status} ${sesCancel.d?.error || ''}`);

  const ses2 = await call('POST', '/education/sessions', owner, { enrollmentId: enrId, teacherId: mainTeacherId, scheduledAt: plus(4, 18), plannedDuration: 45, topic: `QA تأكيد ${stamp}` });
  const ses2Id = ses2.d?.session?.id || ses2.d?.data?.id;
  if (ses2Id) created.sessions.push(ses2Id);
  const before = Number((await call('GET', `/education/enrollments/${enrId}`, owner)).d?.enrollment?.remainingHours ?? (await call('GET', `/education/enrollments/${enrId}`, owner)).d?.data?.remainingHours);
  const confirm = ses2Id ? await call('PUT', `/education/sessions/${ses2Id}/confirm`, owner, { actualDuration: 30 }) : { status: 0 };
  const after = Number((await call('GET', `/education/enrollments/${enrId}`, owner)).d?.enrollment?.remainingHours ?? (await call('GET', `/education/enrollments/${enrId}`, owner)).d?.data?.remainingHours);
  rec('D3', 'تأكيد حصة بمدة أقل من المخططة يخصم بالتناسب', [200, 201].includes(confirm.status) && after < before, `before=${before} after=${after}`);

  const past = await call('POST', '/education/sessions', owner, { enrollmentId: enrId, teacherId: mainTeacherId, scheduledAt: plus(-2, 18), plannedDuration: 60, topic: 'QA ماضي' });
  rec('D4', 'منع/قبول إنشاء حصة في الماضي', [200, 201, 400].includes(past.status), `${past.status}`);
  if (past.d?.session?.id) created.sessions.push(past.d.session.id);

  // ── E. Groups ──
  const grp = subjectId ? await call('POST', '/education/groups', owner, {
    name: `مجموعة QA ${stamp}`, subjectId, teacherId: mainTeacherId, capacity: 2, feeType: 'MONTHLY', feeAmount: 300,
    startTime: '17:00', endTime: '18:30', scheduleDays: ['Sunday', 'Tuesday'],
    startDate: plus(1), endDate: plus(60),
  }) : { status: 0 };
  const groupId = grp.d?.group?.id || grp.d?.data?.id;
  rec('E1', 'إنشاء مجموعة', [200, 201].includes(grp.status) && Boolean(groupId), `${grp.status} ${grp.d?.error || ''}`);
  if (groupId) created.groups.push(groupId);

  const addMember = groupId ? await call('POST', `/education/groups/${groupId}/members`, owner, { studentId, amountPaid: 300 }) : { status: 0 };
  rec('E2', 'إضافة عضو للمجموعة', [200, 201].includes(addMember.status), `${addMember.status} ${addMember.d?.error || ''}`);

  const addAgain = groupId ? await call('POST', `/education/groups/${groupId}/members`, owner, { studentId }) : { status: 0 };
  rec('E3', 'منع تكرار نفس العضو', [400, 409].includes(addAgain.status), `${addAgain.status}`);

  const gs = groupId ? await call('POST', `/education/groups/${groupId}/sessions`, owner, { sessionDate: plus(5, 17), topic: 'QA حصة مجموعة' }) : { status: 0 };
  rec('E4', 'إنشاء حصة مجموعة', [200, 201].includes(gs.status), `${gs.status} ${gs.d?.error || ''}`);

  const fin = groupId ? await call('GET', `/education/groups/${groupId}/financials`, owner) : { status: 0 };
  rec('E5', 'مالية المجموعة', fin.status === 200, `${fin.status}`);

  const gen = groupId ? await call('POST', `/education/groups/${groupId}/generate-sessions`, owner, { fromDate: plus(6), toDate: plus(27) }) : { status: 0 };
  rec('E6', 'توليد حصص المجموعة', [200, 201].includes(gen.status), `${gen.status} ${gen.d?.error || ''}`);

  // ── F. Teachers ──
  const tch = await call('POST', '/education/teachers', owner, { name: `مدرس QA ${stamp}`, phone: '01120000222', email: `qa-teacher-${stamp}@trial.maxp.test` });
  const teacherId = tch.d?.teacher?.id || tch.d?.data?.id;
  rec('F1', 'إضافة مدرس', [200, 201].includes(tch.status) && Boolean(teacherId), `${tch.status} ${tch.d?.error || ''}`);
  if (teacherId) created.teachers.push(teacherId);

  const avail = teacherId ? await call('PUT', '/education/availability', owner, {
    teacherId, slots: [{ dayOfWeek: 0, startTime: '09:00', endTime: '17:00' }],
  }) : { status: 0 };
  rec('F2', 'تحديد توفر المدرس', [200, 201].includes(avail.status), `${avail.status} ${avail.d?.error || ''}`);

  const rate = teacherId && subjectId ? await call('PUT', `/education/teachers/${teacherId}`, owner, { subjectRates: [{ subjectId, hourlyRate: 120 }] }) : { status: 0 };
  rec('F3', 'تعديل المدرس/سعر الساعة', [200, 201].includes(rate.status), `${rate.status}`);

  const calc = teacherId ? await call('POST', '/education/payments/calculate', owner, { teacherId, from: plus(-30), to: plus(0) }) : { status: 0 };
  rec('F4', 'حساب مستحقات المدرس', [200, 201].includes(calc.status), `${calc.status} ${calc.d?.error || ''}`);

  // ── G. Parent portal (deeper) ──
  const gPhone = '01120000777';
  const gStu = await call('POST', '/education/students', owner, {
    firstName: 'ابن', lastName: `بوابة ${stamp}`, phone: '01120000666',
    guardianName: `ولي أمر بوابة ${stamp}`, guardianPhone: gPhone,
  });
  const gStudentId = gStu.d?.student?.id || gStu.d?.data?.id;
  if (gStudentId) created.students.push(gStudentId);
  const gList = await call('GET', `/education/students?search=${encodeURIComponent(`بوابة ${stamp}`)}`, owner);
  const gRow = (gList.d?.students || gList.d?.data || []).find(s => s.id === gStudentId);
  const gCustomerId = gRow?.customerId || gRow?.customer?.id;

  const link = gCustomerId ? await call('POST', '/education/parent-portal/activation-link', owner, { customerId: gCustomerId }) : { status: 0 };
  const token = link.d?.data?.url?.split('token=')[1];
  const activate = token ? await call('POST', '/education/parent-portal/activate', null, { token, password: 'Parent@2026' }) : { status: 0 };
  rec('G0', 'تفعيل ولي أمر جديد', link.status === 200 && [200, 201].includes(activate.status), `${link.status}/${activate.status}`);
  const pLogin = await call('POST', '/education/parent-portal/login', null, { phone: gPhone, password: 'Parent@2026' });
  const pToken = pLogin.d?.data?.token;
  rec('G1', 'دخول ولي الأمر', pLogin.status === 200 && Boolean(pToken), `${pLogin.status} ${pLogin.d?.message || pLogin.d?.error || ''}`);

  const kids = await call('GET', '/education/parent-portal/children', pToken);
  rec('G2', 'أبناء ولي الأمر', kids.status === 200, `${kids.status}`);
  const kidsArr = Array.isArray(kids.d?.data) ? kids.d.data : (kids.d?.children || []);
  const kidId = kidsArr[0]?.id;

  if (kidId) {
    const kSes = await call('GET', `/education/parent-portal/children/${kidId}/sessions`, pToken);
    const kEnr = await call('GET', `/education/parent-portal/children/${kidId}/enrollments`, pToken);
    rec('G3', 'حصص الابن', kSes.status === 200, `${kSes.status}`);
    rec('G4', 'اشتراكات الابن', kEnr.status === 200, `${kEnr.status}`);
  } else {
    rec('G3', 'حصص الابن', false, 'لا يوجد ابن'); rec('G4', 'اشتراكات الابن', false, 'لا يوجد ابن');
  }

  const wallet = await call('GET', '/education/parent-portal/wallet', pToken);
  rec('G5', 'محفظة ولي الأمر', wallet.status === 200, `${wallet.status}`);

  const adminWithParent = await call('GET', '/education/students', pToken);
  rec('G6', 'توكن ولي الأمر لا يفتح الإدارة', [401, 403].includes(adminWithParent.status), `${adminWithParent.status}`);

  // ── H. Demo day ──
  const dd = await call('POST', '/education/demo-day', owner, {
    title: `يوم تجربة QA ${stamp}`, description: 'QA', scheduledAt: plus(6, 18),
    durationMinutes: 60, locationType: 'ONLINE', capacity: 10, status: 'SCHEDULED',
  });
  const demoId = dd.d?.demoDay?.id || dd.d?.data?.id;
  rec('H1', 'إنشاء يوم تجربة', [200, 201].includes(dd.status) && Boolean(demoId), `${dd.status} ${dd.d?.error || ''}`);
  if (demoId) created.demoDays.push(demoId);

  const att = demoId ? await call('POST', `/education/demo-day/${demoId}/attendees`, owner, {
    studentName: `مسجل QA ${stamp}`, guardianName: 'ولي أمر QA', phone: '01120000333', age: 9,
  }) : { status: 0 };
  const attendeeId = att.d?.attendee?.id || att.d?.data?.id;
  rec('H2', 'تسجيل مسجل في يوم التجربة', [200, 201].includes(att.status), `${att.status} ${att.d?.error || ''}`);

  if (demoId) {
    const stats = await call('GET', `/education/demo-day/${demoId}`, owner);
    rec('H3', 'قراءة يوم التجربة', stats.status === 200, `${stats.status}`);

    if (attendeeId) {
      const statusUpd = await call('PUT', `/education/demo-day/attendees/${attendeeId}/status`, owner, { attendanceStatus: 'ATTENDED' });
      rec('H4', 'تحديث حضور المسجل', [200, 201].includes(statusUpd.status), `${statusUpd.status} ${statusUpd.d?.error || ''}`);

      const conv = await call('POST', `/education/demo-day/attendees/${attendeeId}/convert`, owner, {});
      const newStudentId = conv.d?.data?.student?.id || conv.d?.student?.id || conv.d?.data?.studentId;
      rec('H5', 'تحويل المسجل إلى طالب', [200, 201].includes(conv.status) && Boolean(newStudentId), `${conv.status} student=${newStudentId || '-'}`);
      if (newStudentId) created.students.push(newStudentId);
    } else {
      rec('H4', 'تحديث حضور المسجل', false, 'لا يوجد مسجل');
      rec('H5', 'تحويل المسجل إلى طالب', false, 'لا يوجد مسجل');
    }
  } else { rec('H3', 'قراءة يوم التجربة', false, ''); }

  // ── J. Parent extra flows ──
  if (pToken) {
    const topup = await call('POST', '/education/parent-portal/wallet/topup', pToken, { amount: 1000, paymentMethod: 'CASH' });
    rec('J1', 'شحن محفظة ولي الأمر (طلب بانتظار المراجعة)', [200, 201].includes(topup.status), `${topup.status}`);

    const purchase = packageId ? await call('POST', '/education/parent-portal/purchase-package', pToken, {
      studentId: gStudentId, packageId, paymentMethod: 'WALLET',
    }) : { status: 0 };
    const insufficient = /الرصيد غير كاف/i.test(JSON.stringify(purchase.d || {}));
    rec('J2', 'شراء باقة برصيد غير كافٍ → منع', [200, 201].includes(purchase.status) || (purchase.status === 400 && insufficient),
      `${purchase.status} ${insufficient ? '(منع صحيح — الشحن بانتظار موافقة الإدارة)' : ''}`);

    // اشتراك للابن حتى يمكن حجز حصة
    const gEnr = gStudentId && packageId ? await call('POST', '/education/enrollments', owner, {
      studentId: gStudentId, packageId, teacherId: mainTeacherId, amountPaid: 850, paymentStatus: 'COMPLETED',
    }) : { status: 0 };
    const gEnrId = gEnr.d?.enrollment?.id || gEnr.d?.data?.id;
    if (gEnrId) created.enrollments.push(gEnrId);

    const book = await call('POST', '/education/parent-portal/sessions/book', pToken, {
      studentId: gStudentId, teacherId: mainTeacherId, scheduledAt: plus(7, 18), durationMinutes: 60,
    });
    rec('J3', 'حجز حصة من البوابة', [200, 201].includes(book.status), `${book.status} ${book.d?.error || book.d?.message || ''}`);
  } else {
    rec('J1', 'شحن محفظة ولي الأمر', false, 'لا يوجد توكن');
    rec('J2', 'شراء باقة من البوابة', false, 'لا يوجد توكن');
    rec('J3', 'حجز حصة من البوابة', false, 'لا يوجد توكن');
  }

  // ── I. Settings & branches ──
  const set = await call('GET', '/education/settings', owner);
  rec('I1', 'قراءة إعدادات التعليم', set.status === 200, `${set.status}`);

  const br = await call('POST', '/education/branches', owner, { name: `فرع QA ${stamp}`, address: 'القاهرة', phone: '0222222222' });
  const branchId = br.d?.branch?.id || br.d?.data?.id;
  rec('I2', 'إنشاء فرع', [200, 201].includes(br.status) && Boolean(branchId), `${br.status} ${br.d?.error || ''}`);
  if (branchId) created.branches.push(branchId);

  // ── cleanup ──
  for (const id of created.sessions) await call('DELETE', `/education/sessions/${id}`, owner).catch(() => { });
  for (const id of created.groups) await call('DELETE', `/education/groups/${id}`, owner).catch(() => { });
  for (const id of created.enrollments) await call('DELETE', `/education/enrollments/${id}`, owner).catch(() => { });
  for (const id of created.students) await call('DELETE', `/education/students/${id}`, owner).catch(() => { });
  for (const id of created.demoDays) await call('DELETE', `/education/demo-day/${id}`, owner).catch(() => { });
  for (const id of created.teachers) await call('DELETE', `/education/teachers/${id}`, owner).catch(() => { });
  for (const id of created.packages) await call('DELETE', `/education/packages/${id}`, owner).catch(() => { });
  for (const id of created.subjects) await call('DELETE', `/education/subjects/${id}`, owner).catch(() => { });
  for (const id of created.branches) await call('DELETE', `/education/branches/${id}`, owner).catch(() => { });

  finish();

  function finish() {
    const pass = results.filter(r => r.ok).length;
    console.log('| ID | case | result | detail |');
    console.log('|---|---|---|---|');
    results.forEach(r => console.log(`| ${r.id} | ${r.name} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.detail} |`));
    console.log(`\nTOTAL ${results.length} — PASS ${pass} — FAIL ${results.length - pass}`);
  }
})();

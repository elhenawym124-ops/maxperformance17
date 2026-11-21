/**
 * HR package 6 scenarios — performance, goals, promotions, resignations, feedback.
 * node apps/backend/scripts/hr-talent-scenarios.cjs
 */
const B = 'https://maxp.online/api/v1';
const results = [];
const rec = (id, name, ok, detail) => results.push({ id, name, ok, detail: String(detail ?? '').slice(0, 200) });

const call = async (m, p, t, b) => {
  const r = await fetch(B + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, ...(b !== undefined ? { body: JSON.stringify(b) } : {}) });
  let d = null; try { d = await r.json(); } catch { }
  return { status: r.status, d };
};
const plus = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

(async () => {
  const hr = (await call('POST', '/auth/login', null, { email: 'trial.hr@maxp.test', password: 'Maxp@2026' })).d.data.token;
  const emps = (await call('GET', '/hr/employees?limit=50', hr)).d.employees || [];
  const a = emps.find(e => e.email?.includes('agent')) || emps[0];
  const b = emps.find(e => e.email?.includes('hr')) || emps[1];
  const empId = a.userId || a.id;
  const reviewerId = b.userId || b.id;
  const positions = (await call('GET', '/hr/positions', hr)).d.positions || [];
  const stamp = Date.now().toString(36);

  // ── Goals ──
  const goal = await call('POST', '/hr/goals', hr, {
    title: `هدف QA ${stamp}`, description: 'وصف', goalType: 'EMPLOYEE', priority: 'MEDIUM',
    targetValue: 10, unit: 'مهمة', startDate: plus(0), endDate: plus(30), employeeId: empId,
  });
  const goalId = goal.d?.goal?.id;
  rec('P6-G1', 'إنشاء هدف', goal.status === 201, `${goal.status} ${goal.d?.error || ''}`);

  const goalsList = await call('GET', '/hr/goals', hr);
  rec('P6-G2', 'الهدف يظهر في القائمة', goalsList.status === 200 && (goalsList.d?.goals || []).some(g => g.id === goalId), `rows=${(goalsList.d?.goals || []).length}`);

  const goalUpd = goalId ? await call('PUT', `/hr/goals/${goalId}`, hr, { progress: 50, currentValue: 5 }) : { status: 0 };
  rec('P6-G3', 'تحديث تقدم الهدف', goalUpd.status === 200, `${goalUpd.status} ${goalUpd.d?.error || ''}`);

  const goalDel = goalId ? await call('DELETE', `/hr/goals/${goalId}`, hr) : { status: 0 };
  rec('P6-G4', 'حذف الهدف', [200, 204].includes(goalDel.status), `${goalDel.status}`);

  // ── Performance reviews ──
  const review = await call('POST', '/hr/performance-reviews', hr, {
    employeeId: empId, reviewerId, reviewPeriod: `QA-${stamp}`,
    periodStart: plus(-30), periodEnd: plus(0), overallRating: 4.2,
    ratings: { communication: 4, quality: 4 }, strengths: 'QA', improvements: 'QA',
  });
  const reviewId = review.d?.review?.id || review.d?.data?.id;
  rec('P6-R1', 'إنشاء تقييم أداء', review.status === 201, `${review.status} ${review.d?.error || ''}`);

  const reviewsList = await call('GET', '/hr/performance-reviews', hr);
  rec('P6-R2', 'قائمة التقييمات تعمل', reviewsList.status === 200, `${reviewsList.status} rows=${(reviewsList.d?.reviews || []).length}`);

  const reviewGet = reviewId ? await call('GET', `/hr/performance-reviews/${reviewId}`, hr) : { status: 0 };
  const ratingsObj = reviewGet.d?.review?.ratings;
  rec('P6-R3', 'قراءة تقييم ونص JSON صالح', reviewGet.status === 200 && ratingsObj !== null,
    `${reviewGet.status} ratings=${typeof ratingsObj}`);

  const reviewDel = reviewId ? await call('DELETE', `/hr/performance-reviews/${reviewId}`, hr) : { status: 0 };
  rec('P6-R4', 'حذف التقييم', [200, 204].includes(reviewDel.status), `${reviewDel.status}`);

  // ── Promotions ──
  const promo = await call('POST', '/hr/promotions', hr, {
    employeeId: empId, toPositionId: positions[0]?.id,
    promotionDate: plus(0), effectiveDate: plus(7),
    reason: `QA ترقية ${stamp}`, newSalary: 15000,
  });
  const promoId = promo.d?.promotion?.id;
  rec('P6-PR1', 'إنشاء ترقية', [200, 201].includes(promo.status), `${promo.status} ${promo.d?.error || ''}`);

  const promoBad = await call('POST', '/hr/promotions', hr, { employeeId: empId, effectiveDate: plus(7) });
  rec('P6-PR2', 'ترقية بدون منصب → 400', promoBad.status === 400, `${promoBad.status} ${promoBad.d?.error || ''}`);

  const promoList = await call('GET', '/hr/promotions', hr);
  rec('P6-PR3', 'قائمة الترقيات', promoList.status === 200, `${promoList.status} rows=${(promoList.d?.promotions || []).length}`);

  const promoDel = promoId ? await call('DELETE', `/hr/promotions/${promoId}`, hr) : { status: 0 };
  rec('P6-PR4', 'حذف الترقية', [200, 204].includes(promoDel.status), `${promoDel.status}`);

  // ── Resignations ──
  const resign = await call('POST', '/hr/resignations', hr, {
    employeeId: empId, resignationDate: plus(0), lastWorkingDay: plus(30), reason: `QA استقالة ${stamp}`,
  });
  const resignId = resign.d?.resignation?.id;
  rec('P6-RS1', 'إنشاء استقالة', resign.status === 201, `${resign.status} ${resign.d?.error || ''}`);

  const resignList = await call('GET', '/hr/resignations', hr);
  rec('P6-RS2', 'قائمة الاستقالات', resignList.status === 200, `${resignList.status} rows=${(resignList.d?.resignations || []).length}`);

  const clearance = resignId ? await call('GET', `/hr/resignations/${resignId}/clearance`, hr) : { status: 0 };
  rec('P6-RS3', 'مخالصة الاستقالة', clearance.status === 200, `${clearance.status}`);

  const settlement = resignId ? await call('GET', `/hr/resignations/${resignId}/settlement`, hr) : { status: 0 };
  rec('P6-RS4', 'تصفية مستحقات الاستقالة', settlement.status === 200, `${settlement.status}`);

  // ── Feedback ──
  const fb = await call('POST', '/hr/feedback', hr, { employeeId: empId, type: 'SUGGESTION', content: `QA اقتراح ${stamp}` });
  const fbId = fb.d?.feedback?.id;
  rec('P6-F1', 'إنشاء تغذية راجعة', fb.status === 201, `${fb.status} ${fb.d?.error || ''}`);

  const fbList = await call('GET', '/hr/feedback', hr);
  rec('P6-F2', 'قائمة التغذية الراجعة', fbList.status === 200, `${fbList.status}`);

  const fbReply = fbId ? await call('POST', `/hr/feedback/${fbId}/reply`, hr, { reply: 'QA رد إداري' }) : { status: 0 };
  rec('P6-F3', 'الرد على التغذية الراجعة', [200, 201].includes(fbReply.status), `${fbReply.status} ${fbReply.d?.error || ''}`);

  const fbDel = fbId ? await call('DELETE', `/hr/feedback/${fbId}`, hr) : { status: 0 };
  rec('P6-F4', 'حذف التغذية الراجعة', [200, 204].includes(fbDel.status), `${fbDel.status}`);

  const pass = results.filter(r => r.ok).length;
  console.log('| ID | case | result | detail |');
  console.log('|---|---|---|---|');
  results.forEach(r => console.log(`| ${r.id} | ${r.name} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.detail} |`));
  console.log(`\nTOTAL ${results.length} — PASS ${pass} — FAIL ${results.length - pass}`);
})();

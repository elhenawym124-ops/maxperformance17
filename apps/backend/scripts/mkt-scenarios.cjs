/**
 * Marketing scenarios (بدون حسابات خارجية): كوبونات + بث.
 * node apps/backend/scripts/mkt-scenarios.cjs
 */
const B = 'https://maxp.online/api/v1';
const results = [];
const rec = (id, name, ok, detail) => results.push({ id, name, ok, detail: String(detail ?? '').slice(0, 200) });

const call = async (m, p, t, b) => {
  if (/\/auth\/login$/.test(p)) await new Promise((res) => setTimeout(res, 1200));
  const r = await fetch(B + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, ...(b !== undefined ? { body: JSON.stringify(b) } : {}) });
  let d = null; try { d = await r.json(); } catch { }
  return { status: r.status, d };
};
const login = async (e) => (await call('POST', '/auth/login', null, { email: e, password: 'Maxp@2026' })).d?.data?.token;
const plus = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

(async () => {
  const mkt = await login('trial.marketing@maxp.test');
  const stamp = Date.now().toString(36).toUpperCase();

  const list = await call('GET', '/coupons', mkt);
  const rows = list.d?.data || list.d?.coupons || [];
  rec('M1', 'قائمة الكوبونات', list.status === 200 && rows.length >= 3, `${list.status} rows=${rows.length}`);

  const code = `QA${stamp}`;
  const create = await call('POST', '/coupons', mkt, {
    code, name: `كوبون QA ${stamp}`, type: 'PERCENTAGE', value: 10,
    validFrom: plus(-1), validTo: plus(10), usageLimit: 50, minOrderAmount: 100,
  });
  const coupon = create.d?.data || create.d?.coupon;
  rec('M2', 'إنشاء كوبون نسبة', [200, 201].includes(create.status) && Boolean(coupon?.id),
    `${create.status} ${create.d?.error || ''}`);

  const dup = await call('POST', '/coupons', mkt, {
    code, name: 'تكرار QA', type: 'PERCENTAGE', value: 5, validFrom: plus(-1), validTo: plus(5),
  });
  rec('M3', 'منع تكرار كود الكوبون', [400, 409].includes(dup.status), `${dup.status} ${dup.d?.error || ''}`);

  const bad = await call('POST', '/coupons', mkt, {
    code: `QAB${stamp}`, name: 'كوبون غير صالح', type: 'PERCENTAGE', value: 150,
    validFrom: plus(-1), validTo: plus(5),
  });
  rec('M4', 'رفض نسبة خصم > 100%', [400, 422].includes(bad.status), `${bad.status} ${bad.d?.error || ''}`);

  const validate = await call('POST', '/coupons/validate', mkt, { code, orderAmount: 500 });
  const validatedCouponId = validate.d?.data?.coupon?.id || coupon?.id;
  const discount = validate.d?.discount ?? validate.d?.discountAmount;
  rec('M5', 'التحقق من صلاحية الكوبون', validate.status === 200 && Number(discount) === 50,
    `${validate.status} discount=${discount}`);

  const apply = await call('POST', '/coupons/apply', mkt, {
    couponId: validatedCouponId, orderAmount: 500, discountAmount: discount,
  });
  rec('M6', 'تسجيل استخدام الكوبون', apply.status === 200, `${apply.status} ${apply.d?.error || ''}`);

  const applyNoId = await call('POST', '/coupons/apply', mkt, { orderAmount: 500, discountAmount: 50 });
  rec('M6b', 'تطبيق بدون معرّف كوبون → 400', applyNoId.status === 400, `${applyNoId.status} ${applyNoId.d?.error || ''}`);

  const update = coupon?.id ? await call('PUT', `/coupons/${coupon.id}`, mkt, { isActive: false }) : { status: 0 };
  rec('M7', 'تعطيل الكوبون', [200, 201].includes(update.status), `${update.status} ${update.d?.error || ''}`);

  const validateOff = await call('POST', '/coupons/validate', mkt, { code, orderAmount: 500 });
  rec('M8', 'الكوبون المعطّل غير صالح', validateOff.status !== 200 || validateOff.d?.valid === false,
    `${validateOff.status} valid=${validateOff.d?.valid}`);

  const camps = await call('GET', '/broadcast/campaigns', mkt);
  const campRows = camps.d?.campaigns || camps.d?.data || [];
  rec('M9', 'قائمة حملات البث', camps.status === 200 && campRows.length >= 2, `${camps.status} rows=${campRows.length}`);

  const preview = await call('POST', '/broadcast/campaigns/preview-audience', mkt, { targetAudience: 'ALL_CUSTOMERS', audienceMode: 'ALL' });
  const count = preview.d?.data?.willSendCount ?? preview.d?.count ?? preview.d?.data?.count;
  rec('M10', 'معاينة جمهور الحملة', preview.status === 200 && count !== undefined, `${preview.status} count=${count}`);

  if (coupon?.id) await call('DELETE', `/coupons/${coupon.id}`, mkt).catch(() => { });

  const pass = results.filter(r => r.ok).length;
  console.log('| ID | case | result | detail |');
  console.log('|---|---|---|---|');
  results.forEach(r => console.log(`| ${r.id} | ${r.name} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.detail} |`));
  console.log(`\nTOTAL ${results.length} — PASS ${pass} — FAIL ${results.length - pass}`);
})();

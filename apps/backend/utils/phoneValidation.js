/**
 * التحقق من صحة أرقام الهاتف المصرية (محمول 11 رقمًا يبدأ بـ 010/011/012/015، أو أرضي 8-9).
 * يُستخدم في مسارات الإدخال لتقليل البيانات غير الصالحة التي تُعطّل رسائل الواتساب لاحقًا.
 */
const EG_MOBILE = /^01[0125]\d{8}$/;
const EG_LANDLINE = /^0[2-9]\d{7,8}$/;

function normalizePhone(raw) {
  if (raw === null || raw === undefined) return null;
  const digits = String(raw).replace(/[^\d]/g, '').trim();
  return digits || null;
}

function isValidEgyptianPhone(raw) {
  const digits = normalizePhone(raw);
  if (!digits) return false;
  // نقبل الصيغة الدولية 20xxxxxxxxxx أيضًا
  const local = digits.startsWith('20') ? `0${digits.slice(2)}` : digits;
  return EG_MOBILE.test(local) || EG_LANDLINE.test(local);
}

module.exports = { normalizePhone, isValidEgyptianPhone, EG_MOBILE, EG_LANDLINE };

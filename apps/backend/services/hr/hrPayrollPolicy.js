/**
 * سياسة خصومات الرواتب (HR Payroll Policy)
 * ─────────────────────────────────────────────────────────────────────────────
 * تُحفظ داخل `companies.settings.hrPayrollPolicy` (JSON) — بدون أي migration.
 *
 * treatMissingAsAbsent:
 *   true  (افتراضي — السلوك الحالي) = أي يوم عمل بدون سجل حضور يُحسب غيابًا كاملًا
 *   false = الغياب يُحسب فقط عند وجود سجل حضور بحالة ABSENT
 *
 * latePenaltyMode:
 *   'DEFICIT' (افتراضي) = خصم عجز ساعات العمل فقط
 *   'LATE'              = خصم التأخير/الخروج المبكر فقط
 *   'BOTH'              = الاثنان
 */
const DEFAULTS = Object.freeze({
  treatMissingAsAbsent: true,
  latePenaltyMode: 'DEFICIT',
});

const LATE_MODES = ['DEFICIT', 'LATE', 'BOTH'];

const parseSettings = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const normalize = (input = {}) => {
  const policy = { ...DEFAULTS, ...(input || {}) };
  policy.treatMissingAsAbsent = policy.treatMissingAsAbsent !== false;
  const mode = String(policy.latePenaltyMode || '').toUpperCase();
  policy.latePenaltyMode = LATE_MODES.includes(mode) ? mode : DEFAULTS.latePenaltyMode;
  return policy;
};

const getPolicy = async (prisma, companyId) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { settings: true },
    });
    const settings = parseSettings(company?.settings);
    return normalize(settings.hrPayrollPolicy);
  } catch (error) {
    console.warn('[HR-PAYROLL-POLICY] read failed:', error.message);
    return { ...DEFAULTS };
  }
};

const setPolicy = async (prisma, companyId, patch = {}) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { settings: true },
  });
  const settings = parseSettings(company?.settings);
  const nextPolicy = normalize({ ...(settings.hrPayrollPolicy || {}), ...(patch || {}) });
  settings.hrPayrollPolicy = nextPolicy;

  await prisma.company.update({
    where: { id: companyId },
    data: { settings: JSON.stringify(settings) },
  });

  return nextPolicy;
};

module.exports = { DEFAULTS, LATE_MODES, getPolicy, setPolicy, normalize };

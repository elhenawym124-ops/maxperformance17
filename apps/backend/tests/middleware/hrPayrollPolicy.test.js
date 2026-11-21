/**
 * hrPayrollPolicy — سياسة خصومات الرواتب (F-31 / F-33)
 */
const policy = require('../../services/hr/hrPayrollPolicy');

const makePrisma = (settings) => ({
  company: {
    findUnique: jest.fn().mockResolvedValue({ settings }),
    update: jest.fn().mockResolvedValue({}),
  },
});

describe('hrPayrollPolicy', () => {
  it('القيم الافتراضية: الشركات الجديدة لا تُحسب الناقص غيابًا', async () => {
    const prisma = makePrisma(null);
    const p = await policy.getPolicy(prisma, 'c1');
    expect(p).toEqual({ treatMissingAsAbsent: false, latePenaltyMode: 'DEFICIT' });
  });

  it('يقرأ السياسة من companies.settings (نص JSON)', async () => {
    const prisma = makePrisma(JSON.stringify({ hrPayrollPolicy: { treatMissingAsAbsent: false, latePenaltyMode: 'BOTH' } }));
    const p = await policy.getPolicy(prisma, 'c1');
    expect(p.treatMissingAsAbsent).toBe(false);
    expect(p.latePenaltyMode).toBe('BOTH');
  });

  it('يرفض latePenaltyMode غير معروف ويرجع للافتراضي', async () => {
    const prisma = makePrisma(JSON.stringify({ hrPayrollPolicy: { latePenaltyMode: 'WHATEVER' } }));
    const p = await policy.getPolicy(prisma, 'c1');
    expect(p.latePenaltyMode).toBe('DEFICIT');
  });

  it('setPolicy يدمج ولا يمسح مفاتيح أخرى في settings', async () => {
    const prisma = makePrisma(JSON.stringify({ storefrontTheme: 'x', hrPayrollPolicy: { latePenaltyMode: 'LATE' } }));
    const next = await policy.setPolicy(prisma, 'c1', { treatMissingAsAbsent: false });
    expect(next).toEqual({ treatMissingAsAbsent: false, latePenaltyMode: 'LATE' });
    const written = JSON.parse(prisma.company.update.mock.calls[0][0].data.settings);
    expect(written.storefrontTheme).toBe('x');
    expect(written.hrPayrollPolicy.treatMissingAsAbsent).toBe(false);
  });
});

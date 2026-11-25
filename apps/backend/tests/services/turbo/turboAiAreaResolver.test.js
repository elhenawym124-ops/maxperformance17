jest.mock('../../../services/radiologyAiDraftService', () => ({
  resolveAiKey: jest.fn(),
  callChatCompletion: jest.fn(),
}));

const { resolveAiKey, callChatCompletion } = require('../../../services/radiologyAiDraftService');
const {
  resolveTurboLocation,
  resolveAndApplyTurboLocation,
  isGenericOrEmptyLocation,
} = require('../../../services/turbo/turboAiAreaResolver');

function createMockTurboService({ areasByGov = {}, searchMatches = [] } = {}) {
  const governments = [
    { id: '1', name: 'القاهرة' },
    { id: '2', name: 'الجيزة' },
    { id: '4', name: 'الدقهلية' },
    { id: '28', name: 'أطراف القاهرة والجيزة' },
  ];
  return {
    getGovernments: jest.fn().mockResolvedValue({ success: true, governments }),
    getAreas: jest.fn().mockImplementation(async (govId) => ({
      success: true,
      areas: areasByGov[String(govId)] || [],
    })),
    searchAreaByText: jest.fn().mockResolvedValue({ success: true, matches: searchMatches }),
  };
}

function createMockPrisma() {
  return {
    storefrontSettings: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    order: {
      update: jest.fn().mockResolvedValue({}),
    },
    guestOrder: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
}

describe('turboAiAreaResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('skips AI call when order address directly matches Turbo area map', async () => {
    const turboService = createMockTurboService({
      areasByGov: {
        '2': [{ id: '201', name: 'جزيرة الدهب' }, { id: '202', name: 'العمرانية' }],
      },
    });
    const prisma = createMockPrisma();

    const result = await resolveTurboLocation({
      prisma,
      turboService,
      companyId: 'comp_1',
      order: { governorate: 'الجيزة', city: 'Giza' },
      orderData: {
        governorate: 'الجيزة',
        city: 'Giza',
        shippingAddress: 'جزيرة الدهب شارع 5 - جيزة',
      },
    });

    expect(result.resolved).toBe(true);
    expect(result.source).toBe('direct_map');
    expect(result.governorate).toBe('الجيزة');
    expect(result.area).toBe('جزيرة الدهب');
    expect(callChatCompletion).not.toHaveBeenCalled();
  });

  test('uses AI to guess Turbo area for English address, verifies against Turbo map, and persists result', async () => {
    const turboService = createMockTurboService({
      areasByGov: {
        '2': [{ id: '201', name: 'جزيرة الدهب' }, { id: '202', name: 'العمرانية' }],
        '28': [{ id: '281', name: 'حدائق الاهرام' }],
        '1': [{ id: '101', name: 'مدينة نصر' }],
      },
    });
    const prisma = createMockPrisma();

    resolveAiKey.mockResolvedValue({
      provider: 'GOOGLE',
      apiKey: 'db-key',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      model: 'gemini-2.5-flash',
    });
    callChatCompletion.mockResolvedValue(
      JSON.stringify({
        area: 'العمرانية',
        governorate: 'الجيزة',
        confidence: 0.9,
        reason: 'شارع وهبة الريفي يقع في العمرانية بالجيزة',
      })
    );

    const order = { id: 'ord_1', orderNumber: 'ORD-200042-281', governorate: 'الجيزة', city: 'Giza', metadata: '{}' };
    const orderData = {
      governorate: 'الجيزة',
      city: 'Giza',
      shippingAddress: 'Wahba Al Refiy Street 17L, Giza',
    };

    const result = await resolveAndApplyTurboLocation({
      prisma,
      turboService,
      companyId: 'comp_1',
      order,
      orderData,
    });

    expect(result.resolved).toBe(true);
    expect(result.source).toBe('ai_turbo_map');
    expect(result.area).toBe('العمرانية');
    expect(result.governorate).toBe('الجيزة');
    expect(orderData.area).toBe('العمرانية');
    expect(orderData.verifiedTurboArea).toBe('العمرانية');
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ord_1' },
        data: expect.objectContaining({ city: 'العمرانية' }),
      })
    );
  });

  test('auto-corrects governorate when AI guesses an area that belongs to أطراف القاهرة والجيزة', async () => {
    const turboService = createMockTurboService({
      areasByGov: {
        '2': [{ id: '202', name: 'العمرانية' }],
        '28': [{ id: '281', name: 'حدائق الاهرام' }],
        '1': [{ id: '101', name: 'مدينة نصر' }],
      },
    });
    const prisma = createMockPrisma();

    resolveAiKey.mockResolvedValue({
      provider: 'GOOGLE',
      apiKey: 'db-key',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      model: 'gemini-2.5-flash',
    });
    // AI returned area='حدائق الاهرام' with governorate='الجيزة' — code must auto-correct governorate to 'أطراف القاهرة والجيزة'
    callChatCompletion.mockResolvedValue(
      JSON.stringify({
        area: 'حدائق الاهرام',
        governorate: 'الجيزة',
        confidence: 0.88,
        reason: 'بوابة خفرع تتبع حدائق الأهرام',
      })
    );

    const orderData = {
      governorate: 'الجيزة',
      city: 'Giza',
      shippingAddress: 'بوابة خفرع عمارة 12',
    };

    const result = await resolveTurboLocation({
      prisma,
      turboService,
      companyId: 'comp_1',
      order: { governorate: 'الجيزة', city: 'Giza' },
      orderData,
    });

    expect(result.resolved).toBe(true);
    expect(result.area).toBe('حدائق الاهرام');
    expect(result.governorate).toBe('أطراف القاهرة والجيزة');
  });

  test('rejects AI guess when guessed area does not exist in Turbo map', async () => {
    const turboService = createMockTurboService({
      areasByGov: {
        '2': [{ id: '202', name: 'العمرانية' }],
        '28': [{ id: '281', name: 'حدائق الاهرام' }],
        '1': [{ id: '101', name: 'مدينة نصر' }],
      },
    });
    const prisma = createMockPrisma();

    resolveAiKey.mockResolvedValue({
      provider: 'GOOGLE',
      apiKey: 'db-key',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      model: 'gemini-2.5-flash',
    });
    callChatCompletion.mockResolvedValue(
      JSON.stringify({
        area: 'منطقة وهمية غير موجودة',
        governorate: 'الجيزة',
        confidence: 0.9,
        reason: 'تخمين',
      })
    );

    const result = await resolveTurboLocation({
      prisma,
      turboService,
      companyId: 'comp_1',
      order: { governorate: 'الجيزة', city: 'Giza' },
      orderData: { governorate: 'الجيزة', city: 'Giza', shippingAddress: 'الثالث' },
    });

    expect(result.resolved).toBe(false);
    expect(result.reason).toBe('AI_AREA_NOT_IN_TURBO_MAP');
  });

  test('isGenericOrEmptyLocation flags governorate-only values', () => {
    expect(isGenericOrEmptyLocation('Giza')).toBe(true);
    expect(isGenericOrEmptyLocation('الجيزة')).toBe(true);
    expect(isGenericOrEmptyLocation('')).toBe(true);
    expect(isGenericOrEmptyLocation('العمرانية')).toBe(false);
  });

  test('skips AI cleanly when standalone service toggle is disabled on ShippingCompany', async () => {
    const turboService = createMockTurboService({
      areasByGov: { '2': [{ id: '202', name: 'العمرانية' }] },
    });
    const prisma = createMockPrisma();
    prisma.shippingCompany = {
      findFirst: jest.fn().mockResolvedValue({
        settings: JSON.stringify({ aiAreaResolverEnabled: false }),
      }),
    };

    const result = await resolveTurboLocation({
      prisma,
      turboService,
      companyId: 'comp_1',
      order: { governorate: 'الجيزة', city: 'Giza' },
      orderData: { governorate: 'الجيزة', city: 'Giza', shippingAddress: 'Wahba Al Refiy Street 17L, Giza' },
    });

    expect(result.skipped).toBe(true);
    expect(result.resolved).toBe(false);
    expect(result.reason).toBe('AI_DISABLED');
    expect(callChatCompletion).not.toHaveBeenCalled();
  });

  test('skips AI cleanly when standalone service toggle is disabled on Company.settings', async () => {
    const turboService = createMockTurboService({
      areasByGov: { '2': [{ id: '202', name: 'العمرانية' }] },
    });
    const prisma = createMockPrisma();
    prisma.company = {
      findUnique: jest.fn().mockResolvedValue({
        settings: JSON.stringify({ turboAiAreaResolverEnabled: false }),
      }),
    };

    const result = await resolveTurboLocation({
      prisma,
      turboService,
      companyId: 'comp_1',
      order: { governorate: 'الجيزة', city: 'Giza' },
      orderData: { governorate: 'الجيزة', city: 'Giza', shippingAddress: 'Wahba Al Refiy Street 17L, Giza' },
    });

    expect(result.skipped).toBe(true);
    expect(result.resolved).toBe(false);
    expect(result.reason).toBe('AI_DISABLED');
    expect(callChatCompletion).not.toHaveBeenCalled();
  });
});

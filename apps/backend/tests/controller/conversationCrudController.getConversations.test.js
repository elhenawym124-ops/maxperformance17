jest.mock('../../services/sharedDatabase', () => ({
  getSharedPrismaClient: jest.fn(),
  executeWithRetry: jest.fn(async (operation) => operation())
}));

jest.mock('../../services/socketService', () => ({}));
jest.mock('../../utils/messageHealthChecker', () => jest.fn());
jest.mock('../../utils/cachingUtils', () => ({
  conversationCache: {
    invalidateConversation: jest.fn()
  }
}));
jest.mock('../../utils/facebookMediaProxy', () => ({
  proxyCustomerAvatarUrl: jest.fn((_customerId, url) => url)
}));

const { getSharedPrismaClient, executeWithRetry } = require('../../services/sharedDatabase');
const { getConversations } = require('../../controller/conversation/conversationCrudController');

const createResponse = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const createPrismaMock = (overrides = {}) => ({
  conversation: {
    findMany: jest.fn().mockResolvedValue(overrides.conversations || []),
    count: jest.fn().mockResolvedValue(overrides.totalCount || 0),
    findFirst: jest.fn(),
  },
  message: {
    findMany: jest.fn().mockResolvedValue(overrides.messageRows || []),
    findFirst: jest.fn().mockResolvedValue(overrides.lastInboundMessage || null),
    count: jest.fn().mockResolvedValue(0),
  },
  ...overrides.extra
});

describe('conversationCrudController.getConversations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects without company ID', async () => {
    const req = { query: {}, user: {} };
    const res = createResponse();

    await getConversations(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  test('returns conversations without search filter', async () => {
    const mockConversations = [
      {
        id: 'conv_1',
        customerId: 'cust_1',
        channel: 'FACEBOOK',
        status: 'ACTIVE',
        lastMessagePreview: 'مرحبا',
        lastMessageAt: new Date(),
        updatedAt: new Date(),
        unreadCount: 1,
        assignedUserId: null,
        priority: 1,
        metadata: null,
        customer: { id: 'cust_1', firstName: 'أحمد', lastName: 'السيد' },
        user: null,
        messages: [{ isFromCustomer: true, isRead: false, content: 'مرحبا', type: 'text' }]
      }
    ];

    const prisma = createPrismaMock({
      conversations: mockConversations,
      totalCount: 1
    });
    getSharedPrismaClient.mockReturnValue(prisma);

    const req = {
      query: { page: '1', limit: '20' },
      user: { companyId: 'company_1' }
    };
    const res = createResponse();

    await getConversations(req, res);

    expect(prisma.conversation.findMany).toHaveBeenCalled();
    expect(prisma.conversation.count).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'conv_1', customerName: 'أحمد السيد' })
        ]),
        pagination: expect.objectContaining({ total: 1 })
      })
    );
  });

  test('filters by search query matching customer firstName', async () => {
    const prisma = createPrismaMock({
      conversations: [
        {
          id: 'conv_1',
          customerId: 'cust_1',
          channel: 'FACEBOOK',
          status: 'ACTIVE',
          lastMessagePreview: 'مرحبا',
          lastMessageAt: new Date(),
          updatedAt: new Date(),
          unreadCount: 0,
          assignedUserId: null,
          priority: 1,
          metadata: null,
          customer: { id: 'cust_1', firstName: 'محمد', lastName: 'العلي' },
          user: null,
          messages: [{ isFromCustomer: true, isRead: false, content: 'مرحبا', type: 'text' }]
        }
      ],
      totalCount: 1
    });
    getSharedPrismaClient.mockReturnValue(prisma);

    const req = {
      query: { page: '1', limit: '20', search: 'محمد' },
      user: { companyId: 'company_1' }
    };
    const res = createResponse();

    await getConversations(req, res);

    // Verify search was passed to Prisma where clause
    const findManyCall = prisma.conversation.findMany.mock.calls[0][0];
    expect(findManyCall.where.AND).toBeDefined();
    expect(findManyCall.where.AND[0].OR).toBeDefined();
    expect(findManyCall.where.AND[0].OR).toContainEqual(
      { customer: { firstName: { contains: 'محمد', mode: 'insensitive' } } }
    );

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  test('filters by search query matching lastMessagePreview', async () => {
    const prisma = createPrismaMock({
      conversations: [
        {
          id: 'conv_2',
          customerId: 'cust_2',
          channel: 'FACEBOOK',
          status: 'ACTIVE',
          lastMessagePreview: 'طلب جديد',
          lastMessageAt: new Date(),
          updatedAt: new Date(),
          unreadCount: 0,
          assignedUserId: null,
          priority: 1,
          metadata: null,
          customer: { id: 'cust_2', firstName: 'سارة', lastName: 'خالد' },
          user: null,
          messages: [{ isFromCustomer: true, isRead: false, content: 'طلب جديد', type: 'text' }]
        }
      ],
      totalCount: 1
    });
    getSharedPrismaClient.mockReturnValue(prisma);

    const req = {
      query: { page: '1', limit: '20', search: 'طلب' },
      user: { companyId: 'company_1' }
    };
    const res = createResponse();

    await getConversations(req, res);

    const findManyCall = prisma.conversation.findMany.mock.calls[0][0];
    expect(findManyCall.where.AND[0].OR).toContainEqual(
      { lastMessagePreview: { contains: 'طلب', mode: 'insensitive' } }
    );

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  test('count uses the same search-filtered where clause', async () => {
    const prisma = createPrismaMock({
      conversations: [],
      totalCount: 0
    });
    getSharedPrismaClient.mockReturnValue(prisma);

    const req = {
      query: { search: 'test' },
      user: { companyId: 'company_1' }
    };
    const res = createResponse();

    await getConversations(req, res);

    const countCall = prisma.conversation.count.mock.calls[0][0];
    expect(countCall.where.AND).toBeDefined();
    expect(countCall.where.AND[0].OR).toBeDefined();
  });

  test('returns empty results when search matches nothing', async () => {
    const prisma = createPrismaMock({
      conversations: [],
      totalCount: 0
    });
    getSharedPrismaClient.mockReturnValue(prisma);

    const req = {
      query: { search: ' nonexistent_zzzz ' },
      user: { companyId: 'company_1' }
    };
    const res = createResponse();

    await getConversations(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: [],
        pagination: expect.objectContaining({ total: 0 })
      })
    );
  });

  test('filters by priority when priority=true is requested', async () => {
    const prisma = createPrismaMock({
      conversations: [
        {
          id: 'conv_starred',
          customerId: 'cust_1',
          channel: 'FACEBOOK',
          status: 'ACTIVE',
          lastMessagePreview: 'مهم جدا',
          lastMessageAt: new Date(),
          updatedAt: new Date(),
          unreadCount: 0,
          assignedUserId: null,
          priority: 2,
          metadata: null,
          customer: { id: 'cust_1', firstName: 'عميل', lastName: 'مميز' },
          user: null,
          messages: []
        }
      ],
      totalCount: 1
    });
    getSharedPrismaClient.mockReturnValue(prisma);

    const req = {
      query: { priority: 'true' },
      user: { companyId: 'company_1' }
    };
    const res = createResponse();

    await getConversations(req, res);

    const findManyCall = prisma.conversation.findMany.mock.calls[0][0];
    expect(findManyCall.where.priority).toEqual({ gt: 1 });

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'conv_starred', priority: true })
        ])
      })
    );
  });

  test('fetches all priority conversations even when tab is unreplied (ignores status and lastMessageIsFromCustomer)', async () => {
    const prisma = createPrismaMock({
      conversations: [
        {
          id: 'conv_starred_replied',
          customerId: 'cust_2',
          channel: 'FACEBOOK',
          status: 'RESOLVED',
          lastMessagePreview: 'تم الرد',
          lastMessageAt: new Date(),
          updatedAt: new Date(),
          unreadCount: 0,
          assignedUserId: null,
          priority: 3,
          metadata: null,
          customer: { id: 'cust_2', firstName: 'سارة', lastName: 'علي' },
          user: null,
          messages: []
        }
      ],
      totalCount: 1
    });
    getSharedPrismaClient.mockReturnValue(prisma);

    const req = {
      query: { priority: 'true', tab: 'unreplied' },
      user: { companyId: 'company_1' }
    };
    const res = createResponse();

    await getConversations(req, res);

    const findManyCall = prisma.conversation.findMany.mock.calls[0][0];
    expect(findManyCall.where.priority).toEqual({ gt: 1 });
    expect(findManyCall.where.status).toBeUndefined();
    expect(findManyCall.where.lastMessageIsFromCustomer).toBeUndefined();

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'conv_starred_replied', priority: true })
        ])
      })
    );
  });

  // --- latency regressions (task eea5c862) -------------------------------

  test('does not run the message-content search unless searchInMessages/searchScope=all is requested', async () => {
    const prisma = createPrismaMock({ conversations: [], totalCount: 0 });
    prisma.$queryRawUnsafe = jest.fn().mockResolvedValue([]);
    getSharedPrismaClient.mockReturnValue(prisma);

    const req = { query: { search: 'سناء' }, user: { companyId: 'company_1' } };
    const res = createResponse();

    await getConversations(req, res);

    // name search must stay on the fast path: no messages-table content scan at all
    const contentSearches = prisma.$queryRawUnsafe.mock.calls
      .map((c) => String(c[0]))
      .filter((sql) => sql.includes('m.content ILIKE'));
    expect(contentSearches).toHaveLength(0);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        searchMeta: expect.objectContaining({ scope: 'fields', contentMatchCount: 0 })
      })
    );
  });

  test('badge counts do not carry the search predicate (searching a name must not zero the badges)', async () => {
    const prisma = createPrismaMock({ conversations: [], totalCount: 0 });
    prisma.conversation.count = jest.fn()
      .mockResolvedValueOnce(4)   // total (search filtered)
      .mockResolvedValueOnce(7)   // unreplied badge
      .mockResolvedValueOnce(2);  // priority badge
    getSharedPrismaClient.mockReturnValue(prisma);

    const req = { query: { search: 'سناء' }, user: { companyId: 'company_1' } };
    const res = createResponse();

    await getConversations(req, res);

    const wheres = prisma.conversation.count.mock.calls.map((c) => c[0].where);
    expect(wheres).toHaveLength(3);
    expect(wheres[0].AND).toBeDefined();          // total keeps the search
    expect(wheres[1].AND).toBeUndefined();        // unreplied badge = channel stats
    expect(wheres[2].AND).toBeUndefined();        // priority badge = channel stats
    expect(wheres[1].lastMessageIsFromCustomer).toBe(true);
    expect(wheres[2].priority).toEqual({ gt: 1 });

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        counts: expect.objectContaining({ unreplied: 7, priority: 2 })
      })
    );
  });

  test('resolves last-inbound timestamps with one batched DISTINCT ON query, not one query per conversation', async () => {
    const conversations = [1, 2, 3].map((n) => ({
      id: `conv_${n}`,
      customerId: `cust_${n}`,
      channel: 'FACEBOOK',
      status: 'ACTIVE',
      lastMessagePreview: 'رسالة',
      lastMessageAt: new Date(),
      updatedAt: new Date(),
      unreadCount: 0,
      assignedUserId: null,
      priority: 1,
      metadata: null,
      customer: { id: `cust_${n}`, firstName: 'عميل', lastName: `${n}` },
      user: null,
      messages: [{ isFromCustomer: false, isRead: true, content: 'رد', type: 'TEXT', createdAt: new Date() }]
    }));

    const prisma = createPrismaMock({ conversations, totalCount: 3 });
    const lastInbound = new Date(Date.now() - 3600000);
    prisma.$queryRawUnsafe = jest.fn().mockResolvedValue([
      { conversationId: 'conv_1', createdAt: lastInbound }
    ]);
    getSharedPrismaClient.mockReturnValue(prisma);

    const req = { query: { limit: '20' }, user: { companyId: 'company_1' } };
    const res = createResponse();

    await getConversations(req, res);

    expect(prisma.$queryRawUnsafe.mock.calls
      .filter((c) => String(c[0]).includes('DISTINCT ON ("conversationId")'))).toHaveLength(1);
    const lastInboundCall = prisma.$queryRawUnsafe.mock.calls
      .find((c) => String(c[0]).includes('DISTINCT ON ("conversationId")'));
    expect(lastInboundCall[0]).toContain('"isFromCustomer" = true');
    expect(lastInboundCall[1]).toEqual(['conv_1', 'conv_2', 'conv_3']);
    expect(prisma.message.findFirst).not.toHaveBeenCalled();

    const payload = res.json.mock.calls[0][0];
    expect(payload.data.find((c) => c.id === 'conv_1').lastInboundAt).toBe(lastInbound.toISOString());
  });
});

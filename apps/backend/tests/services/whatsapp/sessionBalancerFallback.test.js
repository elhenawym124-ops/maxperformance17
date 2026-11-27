const mockPrisma = {
  whatsAppSession: {
    findFirst: jest.fn()
  },
  whatsAppContact: {
    findFirst: jest.fn()
  },
  whatsAppNotificationSettings: {
    upsert: jest.fn(async () => ({}))
  }
};

jest.mock('../../../services/sharedDatabase', () => ({
  getSharedPrismaClient: jest.fn(() => mockPrisma),
  safeQuery: jest.fn((op) => op())
}));

jest.mock('../../../services/whatsapp/WhatsAppManager', () => ({
  getSession: jest.fn(() => null),
  createSession: jest.fn()
}));

const { getOrAssignSession } = require('../../../services/whatsapp/sessionBalancer');

describe('Session Balancer Fallback to Single/Default DB Session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns single connected or default session when connectedSessions is empty', async () => {
    mockPrisma.whatsAppSession.findFirst.mockResolvedValueOnce({ id: 'sess-single-default' });

    const sessionId = await getOrAssignSession({
      companyId: 'comp-single',
      connectedSessions: [],
      settings: {}
    });

    expect(sessionId).toBe('sess-single-default');
    expect(mockPrisma.whatsAppSession.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'comp-single', isDefault: true })
      })
    );
  });

  test('honors explicit META_CLOUD defaultSessionId even when a Baileys QR session is connected in memory', async () => {
    mockPrisma.whatsAppSession.findFirst.mockResolvedValueOnce({
      id: 'sess-meta-default',
      provider: 'META_CLOUD',
      status: 'CONNECTED'
    });

    const sessionId = await getOrAssignSession({
      companyId: 'comp-dual',
      recipientPhone: '201000000001',
      connectedSessions: [{ sessionId: 'sess-qr-1', status: 'connected', isDefault: false }],
      settings: { defaultSessionId: 'sess-meta-default', stickySessionEnabled: true }
    });

    expect(sessionId).toBe('sess-meta-default');
  });

  test('honors explicit Baileys defaultSessionId when multiple QR sessions are connected', async () => {
    const sessionId = await getOrAssignSession({
      companyId: 'comp-dual',
      recipientPhone: '201000000002',
      connectedSessions: [
        { sessionId: 'sess-qr-other', status: 'connected', isDefault: false },
        { sessionId: 'sess-qr-default', status: 'connected', isDefault: true }
      ],
      settings: { defaultSessionId: 'sess-qr-default', stickySessionEnabled: true }
    });

    expect(sessionId).toBe('sess-qr-default');
  });

  test('falls back to connected QR session when explicit META_CLOUD defaultSessionId is disconnected', async () => {
    mockPrisma.whatsAppSession.findFirst.mockResolvedValueOnce({
      id: 'sess-meta-down',
      provider: 'META_CLOUD',
      status: 'DISCONNECTED'
    });
    mockPrisma.whatsAppContact.findFirst.mockResolvedValueOnce(null);

    const sessionId = await getOrAssignSession({
      companyId: 'comp-dual',
      recipientPhone: '201000000003',
      connectedSessions: [{ sessionId: 'sess-qr-live', status: 'connected', isDefault: false }],
      settings: { defaultSessionId: 'sess-meta-down', stickySessionEnabled: true }
    });

    expect(sessionId).toBe('sess-qr-live');
  });
});

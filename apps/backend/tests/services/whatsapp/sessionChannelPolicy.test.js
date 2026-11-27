const {
  getSessionChannelPolicy,
  isSessionInboundEnabled,
  isSessionOutboundEnabled,
  isSessionNotificationEligible,
  assertSessionOutboundAllowed,
  applyChannelPolicyToMetadata,
} = require('../../../services/whatsapp/sessionChannelPolicy');

const mockPrisma = {
  whatsAppSession: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  whatsAppContact: {
    findFirst: jest.fn(),
  },
  whatsAppNotificationSettings: {
    upsert: jest.fn(async () => ({})),
  },
};

jest.mock('../../../services/sharedDatabase', () => ({
  getSharedPrismaClient: jest.fn(() => mockPrisma),
  safeQuery: jest.fn((op) => op()),
}));

jest.mock('../../../services/whatsapp/WhatsAppManager', () => ({
  getSession: jest.fn(() => null),
  createSession: jest.fn(),
}));

const WhatsAppManager = require('../../../services/whatsapp/WhatsAppManager');
const { getOrAssignSession, findAlternativeBaileysSession } = require('../../../services/whatsapp/sessionBalancer');

describe('WhatsApp sessionChannelPolicy', () => {
  test('defaults all flags to true when metadata or direct fields are absent', () => {
    expect(getSessionChannelPolicy(null)).toEqual({
      inboundEnabled: true,
      outboundEnabled: true,
      notificationsEnabled: true,
    });
    expect(isSessionInboundEnabled({ metadata: null })).toBe(true);
    expect(isSessionOutboundEnabled({ metadata: '{}' })).toBe(true);
    expect(isSessionNotificationEligible({})).toBe(true);
  });

  test('reads policy flags from JSON string metadata and direct fields', () => {
    const session = {
      metadata: JSON.stringify({
        inboundEnabled: false,
        outboundEnabled: true,
        notificationsEnabled: false,
      }),
    };
    expect(getSessionChannelPolicy(session)).toEqual({
      inboundEnabled: false,
      outboundEnabled: true,
      notificationsEnabled: false,
    });
    expect(isSessionInboundEnabled(session)).toBe(false);
    expect(isSessionOutboundEnabled(session)).toBe(true);
    expect(isSessionNotificationEligible(session)).toBe(false);
  });

  test('outboundEnabled=false blocks notification eligibility even if notificationsEnabled=true', () => {
    const session = {
      metadata: JSON.stringify({
        inboundEnabled: true,
        outboundEnabled: false,
        notificationsEnabled: true,
      }),
    };
    expect(isSessionOutboundEnabled(session)).toBe(false);
    expect(isSessionNotificationEligible(session)).toBe(false);
    expect(() => assertSessionOutboundAllowed(session, 'sess-1')).toThrow(/الإرسال موقوف/);

    try {
      assertSessionOutboundAllowed(session, 'sess-1');
    } catch (err) {
      expect(err.code).toBe('WA_SESSION_OUTBOUND_DISABLED');
      expect(err.statusCode).toBe(403);
    }
  });

  test('inboundEnabled=false does not block outbound or notifications', () => {
    const session = {
      metadata: JSON.stringify({
        inboundEnabled: false,
        outboundEnabled: true,
        notificationsEnabled: true,
      }),
    };
    expect(isSessionInboundEnabled(session)).toBe(false);
    expect(isSessionOutboundEnabled(session)).toBe(true);
    expect(isSessionNotificationEligible(session)).toBe(true);
    expect(() => assertSessionOutboundAllowed(session, 'sess-2')).not.toThrow();
  });

  test('applyChannelPolicyToMetadata merges updates without erasing unrelated metadata', () => {
    const { metadata, changed } = applyChannelPolicyToMetadata(
      { agentId: 'ag-1', callShieldEnabled: true },
      { notificationsEnabled: false, inboundEnabled: false }
    );
    expect(changed).toBe(true);
    expect(metadata).toEqual({
      agentId: 'ag-1',
      callShieldEnabled: true,
      inboundEnabled: false,
      notificationsEnabled: false,
    });
  });
});

describe('sessionBalancer respects channel notification/outbound policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    WhatsAppManager.getSession.mockReturnValue(null);
  });

  test('skips explicit defaultSessionId when notificationsEnabled is false and picks eligible channel', async () => {
    mockPrisma.whatsAppSession.findMany.mockResolvedValueOnce([
      { id: 'sess-no-notif', metadata: JSON.stringify({ notificationsEnabled: false }) },
      { id: 'sess-ok', metadata: JSON.stringify({ notificationsEnabled: true }) },
    ]);
    mockPrisma.whatsAppSession.findFirst.mockResolvedValueOnce({
      id: 'sess-no-notif',
      provider: 'META_CLOUD',
      status: 'CONNECTED',
      metadata: JSON.stringify({ notificationsEnabled: false }),
    });
    mockPrisma.whatsAppContact.findFirst.mockResolvedValueOnce(null);

    const picked = await getOrAssignSession({
      companyId: 'comp-1',
      recipientPhone: '201001112233',
      connectedSessions: [
        { sessionId: 'sess-no-notif', status: 'connected' },
        { sessionId: 'sess-ok', status: 'connected' },
      ],
      settings: { defaultSessionId: 'sess-no-notif', stickySessionEnabled: true },
    });

    expect(picked).toBe('sess-ok');
  });

  test('returns null when all sessions have notificationsEnabled=false or outboundEnabled=false', async () => {
    mockPrisma.whatsAppSession.findMany
      .mockResolvedValueOnce([
        { id: 'sess-1', metadata: JSON.stringify({ notificationsEnabled: false }) },
      ])
      .mockResolvedValueOnce([
        { id: 'sess-1', metadata: JSON.stringify({ notificationsEnabled: false }) },
      ])
      .mockResolvedValueOnce([
        { id: 'sess-1', metadata: JSON.stringify({ notificationsEnabled: false }) },
      ]);
    mockPrisma.whatsAppSession.findFirst.mockResolvedValueOnce({
      id: 'sess-1',
      metadata: JSON.stringify({ notificationsEnabled: false }),
    });

    const picked = await getOrAssignSession({
      companyId: 'comp-2',
      connectedSessions: [{ sessionId: 'sess-1', status: 'connected' }],
      settings: {},
    });

    expect(picked).toBeNull();
  });

  test('findAlternativeBaileysSession skips channels with notificationsEnabled=false', async () => {
    mockPrisma.whatsAppSession.findMany.mockResolvedValueOnce([
      {
        id: 'baileys-muted',
        name: 'Muted',
        phoneNumber: '201000000001',
        metadata: JSON.stringify({ notificationsEnabled: false }),
      },
      {
        id: 'baileys-allowed',
        name: 'Allowed',
        phoneNumber: '201000000002',
        metadata: JSON.stringify({ notificationsEnabled: true }),
      },
    ]);
    WhatsAppManager.getSession.mockImplementation((id) => ({ id, status: 'connected' }));

    const alt = await findAlternativeBaileysSession('comp-3', 'meta-1');
    expect(alt).toEqual({
      sessionId: 'baileys-allowed',
      name: 'Allowed',
      phoneNumber: '201000000002',
    });
  });
});

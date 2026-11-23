const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const state = {
  sessions: [],
  enrollment: null,
  created: [],
  enrollmentUpdates: [],
  audits: [],
  notifications: [],
};

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

const mockPrisma = {
  educationSession: {
    findFirst: async ({ where }) => {
      if (where.makeupForSessionId) {
        return state.sessions.find((session) => session.makeupForSessionId === where.makeupForSessionId) || null;
      }
      return state.sessions.find((session) => session.id === where.id && session.companyId === where.companyId) || null;
    },
    create: async ({ data }) => {
      const row = { id: `sess-${state.sessions.length + 1}`, ...clone(data) };
      state.sessions.push(row);
      state.created.push(row);
      return clone(row);
    },
  },
  educationEnrollment: {
    findFirst: async () => state.enrollment,
    update: async ({ where, data }) => {
      state.enrollmentUpdates.push({ where, data });
      Object.assign(state.enrollment, data);
      return clone(state.enrollment);
    },
  },
  $transaction: async (fn) => fn(mockPrisma),
};

const sharedDbPath = require.resolve('../../services/sharedDatabase');
require.cache[sharedDbPath] = { id: sharedDbPath, filename: sharedDbPath, loaded: true, exports: { getSharedPrismaClient: () => mockPrisma } };

const auditPath = require.resolve('../../services/educationAuditService');
require.cache[auditPath] = {
  id: auditPath, filename: auditPath, loaded: true,
  exports: { logEducationEvent: async (event) => { state.audits.push(event); return null; } },
};

const notificationPath = require.resolve('../../services/educationNotificationService');
require.cache[notificationPath] = {
  id: notificationPath, filename: notificationPath, loaded: true,
  exports: { notifySessionScheduled: async (companyId, session) => { state.notifications.push(session); return null; } },
};

const controller = require('../../controller/educationSessionsController');

const makeRes = () => ({
  statusCode: 200,
  payload: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.payload = body; return this; },
});

const makeReq = (body = {}, params = {}) => ({
  body, params,
  user: { id: 'u-1', companyId: 'comp-1' },
  headers: {},
});

const confirmedSession = (overrides = {}) => ({
  id: 'sess-original',
  companyId: 'comp-1',
  enrollmentId: 'enr-1',
  teacherId: 'tea-1',
  studentId: 'stu-1',
  subjectId: 'sub-1',
  scheduledAt: new Date('2026-11-10T15:00:00Z'),
  plannedDuration: 60,
  actualDuration: 60,
  status: 'CONFIRMED',
  sessionType: 'PRIVATE',
  student: { id: 'stu-1', firstName: 'سارة', lastName: 'محمد' },
  teacher: { id: 'tea-1', name: 'أحمد' },
  subject: { id: 'sub-1', name: 'رياضيات' },
  ...overrides,
});

beforeEach(() => {
  state.sessions = [confirmedSession()];
  state.enrollment = { id: 'enr-1', remainingHours: 7, totalHours: 10 };
  state.created = [];
  state.enrollmentUpdates = [];
  state.audits = [];
  state.notifications = [];
});

describe('makeup sessions', () => {
  it('restores the consumed hour and schedules a linked make-up session', async () => {
    const res = makeRes();
    await controller.createMakeup(
      makeReq({ scheduledAt: '2026-11-25T16:00:00Z' }, { id: 'sess-original' }),
      res
    );

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.enrollment.remainingHours, 8);
    assert.strictEqual(state.created.length, 1);
    assert.strictEqual(state.created[0].makeupForSessionId, 'sess-original');
    assert.strictEqual(state.created[0].status, 'SCHEDULED');
    assert.strictEqual(state.created[0].studentId, 'stu-1');
    assert.strictEqual(state.created[0].teacherId, 'tea-1');
    assert.strictEqual(state.notifications.length, 1);
    assert.strictEqual(state.audits[0].action, 'CREATE_MAKEUP_SESSION');
  });

  it('never restores more hours than the package total', async () => {
    state.enrollment = { id: 'enr-1', remainingHours: 10, totalHours: 10 };
    const res = makeRes();
    await controller.createMakeup(makeReq({ scheduledAt: '2026-11-26T10:00:00Z' }, { id: 'sess-original' }), res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.enrollment.remainingHours, 10);
  });

  it('rejects a second make-up for the same session', async () => {
    state.sessions.push({
      id: 'sess-makeup', companyId: 'comp-1', makeupForSessionId: 'sess-original',
      scheduledAt: new Date('2026-11-25T16:00:00Z'),
    });

    const res = makeRes();
    await controller.createMakeup(makeReq({ scheduledAt: '2026-11-27T16:00:00Z' }, { id: 'sess-original' }), res);

    assert.strictEqual(res.statusCode, 409);
    assert.strictEqual(res.payload.code, 'MAKEUP_ALREADY_SCHEDULED');
    assert.strictEqual(state.enrollment.remainingHours, 7);
    assert.strictEqual(state.created.length, 0);
  });

  it('rejects unconfirmed, cancelled and group-only sessions', async () => {
    state.sessions = [confirmedSession({ status: 'SCHEDULED' })];
    let res = makeRes();
    await controller.createMakeup(makeReq({ scheduledAt: '2026-11-25T16:00:00Z' }, { id: 'sess-original' }), res);
    assert.strictEqual(res.statusCode, 409);

    state.sessions = [confirmedSession({ status: 'CANCELLED' })];
    res = makeRes();
    await controller.createMakeup(makeReq({ scheduledAt: '2026-11-25T16:00:00Z' }, { id: 'sess-original' }), res);
    assert.strictEqual(res.statusCode, 409);

    state.sessions = [confirmedSession({ enrollmentId: null })];
    res = makeRes();
    await controller.createMakeup(makeReq({ scheduledAt: '2026-11-25T16:00:00Z' }, { id: 'sess-original' }), res);
    assert.strictEqual(res.statusCode, 400);

    assert.strictEqual(state.created.length, 0);
    assert.strictEqual(state.enrollmentUpdates.length, 0);
  });

  it('requires a valid date and an existing session', async () => {
    let res = makeRes();
    await controller.createMakeup(makeReq({}, { id: 'sess-original' }), res);
    assert.strictEqual(res.statusCode, 400);

    res = makeRes();
    await controller.createMakeup(makeReq({ scheduledAt: '2026-11-25T16:00:00Z' }, { id: 'missing' }), res);
    assert.strictEqual(res.statusCode, 404);
  });
});

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const state = {
  groupRow: null,
  existingMembers: [],
  waiting: [],
  promotedRow: null,
  executions: [],
  notifications: [],
  groupConflicts: [],
};

const mockPrisma = {
  $transaction: async (fn) => fn(mockPrisma),
  $queryRawUnsafe: async (sql) => {
    if (/active_count/i.test(sql)) return state.groupRow ? [state.groupRow] : [];
    if (/SELECT id, status FROM "education_group_members"/i.test(sql)) return state.existingMembers;
    if (/SELECT id FROM "education_group_members"/i.test(sql)) return state.waiting;
    if (/SELECT m\."studentId", s\."firstName"/i.test(sql)) return state.promotedRow ? [state.promotedRow] : [];
    return [];
  },
  $executeRawUnsafe: async (sql, ...params) => {
    state.executions.push({ sql, params });
    return 1;
  },
  educationStudent: {
    findFirst: async () => ({ id: 'stu-1', companyId: 'comp-1' }),
    findUnique: async () => ({ firstName: 'سارة', lastName: 'محمد' }),
  },
};

const sharedDbPath = require.resolve('../../services/sharedDatabase');
require.cache[sharedDbPath] = {
  id: sharedDbPath, filename: sharedDbPath, loaded: true,
  exports: { getSharedPrismaClient: () => mockPrisma },
};

const conflictPath = require.resolve('../../services/educationScheduleConflictService');
require.cache[conflictPath] = {
  id: conflictPath, filename: conflictPath, loaded: true,
  exports: {
    normalizeGroupSlots: () => [{ dayIdx: 0, start: 1020, end: 1110 }],
    findStudentGroupConflicts: async () => state.groupConflicts,
    findStudentPrivateSlotConflicts: async () => [],
    findStudentPrivateConflicts: async () => [],
    findStudentGroupConflictAtTime: async () => [],
    findGroupMembersOverlapConflicts: async () => [],
  },
};

const notificationPath = require.resolve('../../services/educationNotificationService');
require.cache[notificationPath] = {
  id: notificationPath, filename: notificationPath, loaded: true,
  exports: {
    notifyWaitingListPromoted: async (payload) => { state.notifications.push(payload); return { success: true }; },
  },
};

const controller = require('../../controller/educationGroupsController');

const makeRes = () => ({
  statusCode: 200,
  payload: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.payload = body; return this; },
});

const makeReq = (body = {}, params = {}, user = { id: 'u-1', companyId: 'comp-1', role: 'COMPANY_ADMIN' }) => ({
  body, params, user, headers: {}, query: {},
});

beforeEach(() => {
  state.groupRow = {
    id: 'grp-1', name: 'مجموعة أ', feeType: 'MONTHLY', feeAmount: 400, branchId: null,
    capacity: 10, scheduleDays: '["SUNDAY"]', scheduleSlots: '[]',
    startTime: '17:00', endTime: '18:30', active_count: 0,
  };
  state.existingMembers = [];
  state.waiting = [];
  state.promotedRow = null;
  state.executions = [];
  state.notifications = [];
  state.groupConflicts = [];
});

describe('group member student schedule guard', () => {
  it('rejects adding a student to an overlapping group', async () => {
    state.groupConflicts = [{ type: 'STUDENT_GROUP', groupId: 'grp-2', groupName: 'مجموعة ب', startTime: '17:30', endTime: '19:00' }];

    const req = makeReq({ studentId: 'stu-1', paymentStatus: 'PENDING', amountPaid: 0 });
    req.params = { id: 'grp-1' };
    const res = makeRes();
    await controller.addMember(req, res);

    assert.strictEqual(res.statusCode, 409);
    assert.strictEqual(res.payload.code, 'STUDENT_SCHEDULE_CONFLICT');
    assert.strictEqual(res.payload.conflicts.length, 1);
    assert.strictEqual(state.executions.filter((item) => /INSERT INTO "education_group_members"/i.test(item.sql)).length, 0);
  });

  it('allows the same addition when allowConflicts is true', async () => {
    state.groupConflicts = [{ type: 'STUDENT_GROUP', groupId: 'grp-2' }];

    const req = makeReq({ studentId: 'stu-1', paymentStatus: 'PENDING', amountPaid: 0, allowConflicts: true });
    req.params = { id: 'grp-1' };
    const res = makeRes();
    await controller.addMember(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.executions.filter((item) => /INSERT INTO "education_group_members"/i.test(item.sql)).length, 1);
  });

  it('notifies the parent when a waiting student is promoted', async () => {
    state.waiting = [{ id: 'm-wait' }];
    state.promotedRow = {
      studentId: 'stu-1', firstName: 'سارة', lastName: 'محمد',
      phone: '01001234567', customerId: 'cust-1', groupName: 'مجموعة أ',
    };

    const req = makeReq({}, { id: 'grp-1', studentId: 'stu-remove' });
    const res = makeRes();
    await controller.removeMember(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.notifications.length, 1);
    assert.strictEqual(state.notifications[0].parentPhone, '01001234567');
    assert.strictEqual(state.notifications[0].studentName, 'سارة محمد');
    assert.strictEqual(state.notifications[0].groupName, 'مجموعة أ');
  });
});

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const state = {
  branches: [],
  groups: [],
  sessions: [],
};

const mockPrisma = {
  $executeRawUnsafe: async () => 1,
  $queryRawUnsafe: async (sql) => {
    if (/FROM branches/i.test(sql)) return state.branches;
    if (/FROM "education_groups"/i.test(sql)) return state.groups;
    if (/FROM "education_group_sessions"/i.test(sql)) return state.sessions;
    return [];
  },
};

const sharedDbPath = require.resolve('../../services/sharedDatabase');
require.cache[sharedDbPath] = {
  id: sharedDbPath, filename: sharedDbPath, loaded: true,
  exports: { getSharedPrismaClient: () => mockPrisma },
};

const controller = require('../../controller/educationGroupsController');

const makeRes = () => ({
  statusCode: 200,
  payload: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.payload = body; return this; },
});

const makeReq = (query = {}) => ({
  query, params: {}, body: {}, headers: {},
  user: { id: 'u-1', companyId: 'comp-1' },
});

beforeEach(() => {
  state.branches = [{
    id: 'b1',
    name: 'فرع مدينة نصر',
    city: 'القاهرة',
    address: 'عباس العقاد',
    classrooms: JSON.stringify([
      { id: 'room-1', name: 'قاعة أ', type: 'THEORY', capacity: 20, isActive: true },
      { id: 'room-2', name: 'قاعة ب', type: 'LAB', capacity: 12, isActive: true },
    ]),
  }];
  state.groups = [{
    id: 'grp-1', name: 'مجموعة الرياضيات', room: 'قاعة أ', classroomId: 'room-1',
    capacity: 20, branchId: 'b1',
    scheduleDays: '["TUESDAY"]', scheduleSlots: '[]',
    startTime: '17:00', endTime: '18:30', status: 'OPEN',
    teacherName: 'أحمد',
  }];
  state.sessions = [];
});

describe('rooms availability', () => {
  it('splits a room into busy blocks and free windows', async () => {
    // 2026-11-24 is a Tuesday
    const res = makeRes();
    await controller.getRoomsAvailability(
      makeReq({ date: '2026-11-24', from: '16:00', to: '20:00' }),
      res
    );

    assert.strictEqual(res.statusCode, 200);
    const branch = res.payload.data.branches[0];
    const roomA = branch.rooms.find((room) => room.id === 'room-1');

    assert.strictEqual(roomA.busy.length, 1);
    assert.strictEqual(roomA.busy[0].startTime, '17:00');
    assert.strictEqual(roomA.busy[0].endTime, '18:30');

    assert.deepStrictEqual(roomA.free.map((slot) => `${slot.startTime}-${slot.endTime}`), [
      '16:00-17:00',
      '18:30-20:00',
    ]);
    assert.strictEqual(roomA.freeMinutes, 150);
    assert.strictEqual(roomA.busyMinutes, 90);
    assert.strictEqual(roomA.utilization, 37.5);
    assert.strictEqual(roomA.firstFree, '16:00');
  });

  it('marks a room with no schedule as fully free', async () => {
    const res = makeRes();
    await controller.getRoomsAvailability(
      makeReq({ date: '2026-11-24', from: '16:00', to: '20:00' }),
      res
    );

    const roomB = res.payload.data.branches[0].rooms.find((room) => room.id === 'room-2');
    assert.strictEqual(roomB.busy.length, 0);
    assert.strictEqual(roomB.free.length, 1);
    assert.strictEqual(roomB.free[0].startTime, '16:00');
    assert.strictEqual(roomB.free[0].endTime, '20:00');
    assert.strictEqual(roomB.utilization, 0);
  });

  it('ignores groups that only meet on another weekday', async () => {
    const res = makeRes();
    await controller.getRoomsAvailability(
      makeReq({ date: '2026-11-25', from: '16:00', to: '20:00' }),
      res
    );

    const roomA = res.payload.data.branches[0].rooms.find((room) => room.id === 'room-1');
    assert.strictEqual(roomA.busy.length, 0);
    assert.strictEqual(res.payload.data.summary.fullyFree, 2);
  });

  it('adds an extra same-day session that is not in the weekly schedule', async () => {
    state.sessions = [{
      id: 'sess-extra', groupId: 'grp-1',
      sessionDate: new Date('2026-11-24T12:00:00'), status: 'SCHEDULED',
    }];

    const res = makeRes();
    await controller.getRoomsAvailability(
      makeReq({ date: '2026-11-24', from: '11:00', to: '20:00' }),
      res
    );

    const roomA = res.payload.data.branches[0].rooms.find((room) => room.id === 'room-1');
    const starts = roomA.busy.map((block) => block.startTime);
    assert.ok(starts.includes('12:00'));
    assert.ok(starts.includes('17:00'));
    assert.strictEqual(roomA.busy.length, 2);
  });

  it('merges overlapping blocks instead of double counting', async () => {
    state.groups.push({
      id: 'grp-2', name: 'مجموعة الفيزياء', room: 'قاعة أ', classroomId: 'room-1',
      capacity: 15, branchId: 'b1',
      scheduleDays: '["TUESDAY"]', scheduleSlots: '[]',
      startTime: '18:00', endTime: '19:00', status: 'OPEN',
      teacherName: 'منى',
    });

    const res = makeRes();
    await controller.getRoomsAvailability(
      makeReq({ date: '2026-11-24', from: '16:00', to: '20:00' }),
      res
    );

    const roomA = res.payload.data.branches[0].rooms.find((room) => room.id === 'room-1');
    assert.strictEqual(roomA.busy.length, 1);
    assert.strictEqual(roomA.busy[0].startTime, '17:00');
    assert.strictEqual(roomA.busy[0].endTime, '19:00');
    assert.strictEqual(roomA.busy[0].groups.length, 2);
  });

  it('reports fully booked rooms in the summary', async () => {
    state.groups = [{
      id: 'grp-full', name: 'مجموعة ممتلئة', room: 'قاعة أ', classroomId: 'room-1',
      capacity: 20, branchId: 'b1',
      scheduleDays: '["TUESDAY"]', scheduleSlots: '[]',
      startTime: '08:00', endTime: '22:00', status: 'OPEN',
      teacherName: 'أحمد',
    }];

    const res = makeRes();
    await controller.getRoomsAvailability(makeReq({ date: '2026-11-24' }), res);

    assert.strictEqual(res.payload.data.summary.fullyBooked, 1);
    const roomA = res.payload.data.branches[0].rooms.find((room) => room.id === 'room-1');
    assert.strictEqual(roomA.free.length, 0);
  });
});

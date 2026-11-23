const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const state = {
  exams: [],
  results: [],
  students: [],
  groupRows: [],
  notifications: [],
  audits: [],
};

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

const mockPrisma = {
  educationExam: {
    findMany: async () => state.exams,
    count: async () => state.exams.length,
    findFirst: async ({ where }) => state.exams.find((exam) =>
      exam.id === where.id && (!where.companyId || exam.companyId === where.companyId)
    ) || null,
    create: async ({ data }) => {
      const exam = { id: `exam-${state.exams.length + 1}`, createdAt: new Date().toISOString(), ...clone(data) };
      state.exams.push(exam);
      return clone(exam);
    },
    update: async ({ where, data }) => {
      const exam = state.exams.find((item) => item.id === where.id);
      Object.assign(exam, clone(data));
      return clone(exam);
    },
    delete: async ({ where }) => {
      state.exams = state.exams.filter((item) => item.id !== where.id);
      return { id: where.id };
    },
  },
  educationExamResult: {
    groupBy: async () => [],
    findMany: async ({ where = {} }) => state.results.filter((row) =>
      (!where.examId || row.examId === where.examId) &&
      (!where.studentId || row.studentId === where.studentId) &&
      (!where.companyId || row.companyId === where.companyId)
    ),
    findFirst: async ({ where }) => state.results.find((row) =>
      row.examId === where.examId && row.studentId === where.studentId
    ) || null,
    create: async ({ data }) => {
      const row = { id: `res-${state.results.length + 1}`, ...clone(data) };
      state.results.push(row);
      return clone(row);
    },
    update: async ({ where, data }) => {
      const row = state.results.find((item) => item.id === where.id);
      Object.assign(row, clone(data));
      return clone(row);
    },
    updateMany: async ({ where, data }) => {
      for (const row of state.results) {
        if (row.examId === where.examId) Object.assign(row, clone(data));
      }
      return { count: state.results.length };
    },
    deleteMany: async ({ where }) => {
      state.results = state.results.filter((row) => row.examId !== where.examId);
      return { count: 1 };
    },
  },
  educationStudent: {
    findMany: async () => state.students,
    findFirst: async ({ where }) => state.students.find((student) =>
      student.id === where.id && (!where.companyId || student.companyId === where.companyId)
    ) || null,
  },
  educationPackage: { findFirst: async () => ({ id: 'pkg-1' }) },
  educationTeacher: { findFirst: async () => ({ id: 'tea-1' }) },
  educationCertificate: { findMany: async () => [] },
  $queryRawUnsafe: async (sql) => {
    if (/FROM "education_groups"/i.test(sql) && /SELECT id/i.test(sql)) return [{ id: 'grp-1' }];
    if (/FROM "education_group_members"/i.test(sql)) return state.groupRows;
    return [];
  },
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
  exports: { notifyExamResult: async (payload) => { state.notifications.push(payload); return { success: true }; } },
};

const controller = require('../../controller/educationExamsController');

const makeRes = () => ({
  statusCode: 200,
  payload: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.payload = body; return this; },
});

const makeReq = (body = {}, params = {}, query = {}, user = { id: 'u-1', companyId: 'comp-1', name: 'مدير' }) => ({
  body, params, query, user, headers: {},
});

beforeEach(() => {
  state.exams = [];
  state.results = [];
  state.students = [
    { id: 'stu-1', companyId: 'comp-1', customerId: 'cust-1', firstName: 'سارة', lastName: 'محمد', code: 'S-1', phone: '0100', customer: { firstName: 'أحمد', lastName: 'علي', phone: '0100' } },
  ];
  state.groupRows = [{ id: 'stu-1', firstName: 'سارة', lastName: 'محمد', code: 'S-1', phone: '0100' }];
  state.notifications = [];
  state.audits = [];
});

describe('education exams', () => {
  it('creates an exam with validation', async () => {
    let res = makeRes();
    await controller.createExam(makeReq({ title: 'اختبار الوحدة', maxScore: 50, type: 'QUIZ', groupId: 'grp-1' }), res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.exams.length, 1);
    assert.strictEqual(state.exams[0].maxScore, 50);

    res = makeRes();
    await controller.createExam(makeReq({ title: '', maxScore: 50 }), res);
    assert.strictEqual(res.statusCode, 400);

    res = makeRes();
    await controller.createExam(makeReq({ title: 'اختبار', maxScore: 0 }), res);
    assert.strictEqual(res.statusCode, 400);
  });

  it('loads candidates for a group and maps existing results', async () => {
    state.exams.push({ id: 'exam-1', companyId: 'comp-1', title: 'اختبار', maxScore: 100, groupId: 'grp-1' });
    state.results.push({ id: 'res-1', companyId: 'comp-1', examId: 'exam-1', studentId: 'stu-1', score: 90, maxScore: 100, grade: 'A' });

    const res = makeRes();
    const req = makeReq({}, { id: 'exam-1' });
    await controller.getExam(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload.data.students.length, 1);
    assert.strictEqual(res.payload.data.students[0].studentName, 'سارة محمد');
    assert.strictEqual(res.payload.data.students[0].score, 90);
    assert.strictEqual(res.payload.data.students[0].grade, 'A');
  });

  it('saves results with computed grades and rejects out-of-range scores', async () => {
    state.exams.push({ id: 'exam-1', companyId: 'comp-1', title: 'اختبار', maxScore: 100, status: 'DRAFT' });

    let res = makeRes();
    await controller.saveResults(makeReq({ results: [{ studentId: 'stu-1', score: 55 }] }, { id: 'exam-1' }), res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.results[0].grade, 'F');
    assert.strictEqual(state.results[0].score, 55);

    res = makeRes();
    await controller.saveResults(makeReq({ results: [{ studentId: 'stu-1', score: 120 }] }, { id: 'exam-1' }), res);
    assert.strictEqual(res.statusCode, 400);
  });

  it('publishes results and notifies parents', async () => {
    state.exams.push({ id: 'exam-1', companyId: 'comp-1', title: 'اختبار', maxScore: 100, status: 'DRAFT' });
    state.results.push({ id: 'res-1', companyId: 'comp-1', examId: 'exam-1', studentId: 'stu-1', score: 80, maxScore: 100, grade: 'B' });

    const res = makeRes();
    await controller.publishExam(makeReq({}, { id: 'exam-1' }), res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.exams[0].status, 'PUBLISHED');
    assert.strictEqual(state.notifications.length, 1);
    assert.strictEqual(state.notifications[0].studentName, 'سارة محمد');
    assert.strictEqual(state.notifications[0].grade, 'B');
  });

  it('refuses to edit results after closing and deletes cascading rows', async () => {
    state.exams.push({ id: 'exam-1', companyId: 'comp-1', title: 'اختبار', maxScore: 100, status: 'CLOSED' });
    let res = makeRes();
    await controller.saveResults(makeReq({ results: [{ studentId: 'stu-1', score: 50 }] }, { id: 'exam-1' }), res);
    assert.strictEqual(res.statusCode, 409);

    state.results.push({ id: 'res-1', examId: 'exam-1', studentId: 'stu-1', score: 50 });
    res = makeRes();
    await controller.deleteExam(makeReq({}, { id: 'exam-1' }), res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.exams.length, 0);
    assert.strictEqual(state.results.length, 0);
  });
});

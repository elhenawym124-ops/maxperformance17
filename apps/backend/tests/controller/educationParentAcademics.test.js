const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const state = {
  students: [{ id: 'stu-1', companyId: 'comp-1', customerId: 'cust-1', firstName: 'سارة', lastName: 'محمد', code: 'S-1' }],
  results: [],
  exams: [],
  certificates: [],
};

const mockPrisma = {
  educationStudent: {
    findMany: async ({ where }) => state.students.filter((student) => student.customerId === where.customerId),
    findFirst: async ({ where }) => state.students.find((student) =>
      student.id === where.id && student.customerId === where.customerId
    ) || null,
  },
  educationExamResult: {
    findMany: async ({ where }) => state.results.filter((row) =>
      row.studentId === where.studentId && (where.publishedAt?.not === null ? row.publishedAt !== null : true)
    ),
  },
  educationExam: {
    findMany: async ({ where }) => state.exams.filter((exam) => where.id.in.includes(exam.id)),
  },
  educationCertificate: {
    findMany: async ({ where }) => state.certificates.filter((row) => row.studentId === where.studentId),
  },
};

const sharedDbPath = require.resolve('../../services/sharedDatabase');
require.cache[sharedDbPath] = { id: sharedDbPath, filename: sharedDbPath, loaded: true, exports: { getSharedPrismaClient: () => mockPrisma } };

const controller = require('../../controller/educationParentAcademicsController');

const makeRes = () => ({
  statusCode: 200,
  payload: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.payload = body; return this; },
});

const makeReq = (params = {}, parent = { id: 'cust-1', companyId: 'comp-1' }) => ({ params, parent, headers: {} });

beforeEach(() => {
  state.results = [
    { id: 'r1', examId: 'exam-1', studentId: 'stu-1', score: 88, maxScore: 100, grade: 'B', notes: null, publishedAt: new Date('2026-11-20') },
    { id: 'r2', examId: 'exam-2', studentId: 'stu-1', score: 50, maxScore: 100, grade: 'F', notes: null, publishedAt: null },
  ];
  state.exams = [
    { id: 'exam-1', title: 'امتحان نوفمبر', type: 'EXAM', maxScore: 100, scheduledAt: null, createdAt: new Date() },
    { id: 'exam-2', title: 'مسودة', type: 'QUIZ', maxScore: 100, scheduledAt: null, createdAt: new Date() },
  ];
  state.certificates = [
    { id: 'cert-1', studentId: 'stu-1', title: 'شهادة تفوق', type: 'ACHIEVEMENT', serialNumber: 'CERT-1', issuedAt: new Date() },
  ];
});

describe('parent academics portal', () => {
  it('returns only published results for the parent child', async () => {
    const res = makeRes();
    await controller.getChildExams(makeReq({ studentId: 'stu-1' }), res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload.data.length, 1);
    assert.strictEqual(res.payload.data[0].examTitle, 'امتحان نوفمبر');
    assert.strictEqual(res.payload.data[0].grade, 'B');
  });

  it('blocks a parent from reading another guardian\u2019s child', async () => {
    const res = makeRes();
    await controller.getChildExams(makeReq({ studentId: 'stu-999' }), res);
    assert.strictEqual(res.statusCode, 404);
  });

  it('lists the child certificates', async () => {
    const res = makeRes();
    await controller.getChildCertificates(makeReq({ studentId: 'stu-1' }), res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload.data.length, 1);
    assert.strictEqual(res.payload.data[0].serialNumber, 'CERT-1');
  });
});

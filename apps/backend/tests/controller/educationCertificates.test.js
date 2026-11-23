const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const state = {
  certificates: [],
  exams: [],
  students: [],
  company: { name: 'مركز النخبة', phone: '01000000000' },
  audits: [],
};

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

const mockPrisma = {
  educationCertificate: {
    findMany: async ({ where = {} } = {}) => state.certificates.filter((row) =>
      (!where.companyId || row.companyId === where.companyId) &&
      (!where.studentId || row.studentId === where.studentId)
    ),
    count: async () => state.certificates.length,
    findFirst: async ({ where = {} }) => state.certificates.find((row) =>
      (!where.id || row.id === where.id) &&
      (!where.companyId || row.companyId === where.companyId)
    ) || null,
    create: async ({ data }) => {
      const row = { id: `cert-${state.certificates.length + 1}`, issuedAt: new Date(), ...clone(data) };
      state.certificates.push(row);
      return clone(row);
    },
    update: async ({ where, data }) => {
      const row = state.certificates.find((item) => item.id === where.id);
      Object.assign(row, clone(data));
      return clone(row);
    },
    delete: async ({ where }) => {
      state.certificates = state.certificates.filter((row) => row.id !== where.id);
      return { id: where.id };
    },
  },
  educationExam: {
    findFirst: async ({ where }) => state.exams.find((exam) => exam.id === where.id) || null,
  },
  educationExamResult: {
    findFirst: async ({ where }) => ({
      score: 88,
      maxScore: 100,
      grade: 'B',
      examId: where.examId,
      studentId: where.studentId,
    }),
  },
  educationEnrollment: { findFirst: async () => null },
  educationStudent: {
    findMany: async () => state.students,
    findFirst: async ({ where }) => state.students.find((student) => student.id === where.id) || null,
  },
  company: { findUnique: async () => state.company },
};

const sharedDbPath = require.resolve('../../services/sharedDatabase');
require.cache[sharedDbPath] = { id: sharedDbPath, filename: sharedDbPath, loaded: true, exports: { getSharedPrismaClient: () => mockPrisma } };

const auditPath = require.resolve('../../services/educationAuditService');
require.cache[auditPath] = {
  id: auditPath, filename: auditPath, loaded: true,
  exports: { logEducationEvent: async (event) => { state.audits.push(event); return null; } },
};

const controller = require('../../controller/educationCertificatesController');

const makeRes = () => ({
  statusCode: 200,
  payload: null,
  headers: {},
  sent: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.payload = body; return this; },
  setHeader(key, value) { this.headers[key] = value; },
  send(body) { this.sent = body; return this; },
});

const makeReq = (body = {}, params = {}, query = {}, user = { id: 'u-1', companyId: 'comp-1' }) => ({
  body, params, query, user, headers: {},
});

beforeEach(() => {
  state.certificates = [];
  state.exams = [{ id: 'exam-1', companyId: 'comp-1', title: 'امتحان نصف العام', maxScore: 100 }];
  state.students = [{
    id: 'stu-1', companyId: 'comp-1', customerId: 'cust-1',
    firstName: 'سارة', lastName: 'محمد', code: 'S-1',
  }];
  state.audits = [];
});

describe('education certificates', () => {
  it('issues a certificate with a sequential serial number', async () => {
    const res = makeRes();
    await controller.issueCertificate(makeReq({ studentId: 'stu-1', examId: 'exam-1' }), res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.certificates.length, 1);
    assert.match(state.certificates[0].serialNumber, /^CERT-\d{6}-\d{4}$/);
    assert.strictEqual(state.certificates[0].title, 'امتحان نصف العام');

    const res2 = makeRes();
    await controller.issueCertificate(makeReq({ studentId: 'stu-1', type: 'level' }), res2);
    assert.strictEqual(state.certificates.length, 2);
    assert.notStrictEqual(state.certificates[0].serialNumber, state.certificates[1].serialNumber);
    assert.strictEqual(state.certificates[1].type, 'LEVEL');
  });

  it('rejects issuing for a student outside the company', async () => {
    const res = makeRes();
    await controller.issueCertificate(makeReq({ studentId: 'stu-404' }), res);
    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(state.certificates.length, 0);
  });

  it('lists certificates with resolved student names', async () => {
    state.certificates.push({
      id: 'cert-1', companyId: 'comp-1', studentId: 'stu-1', title: 'شهادة تفوق',
      type: 'ACHIEVEMENT', serialNumber: 'CERT-202611-0001', issuedAt: new Date(),
    });

    const res = makeRes();
    await controller.listCertificates(makeReq({}, {}, { page: 1, limit: 25 }), res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload.data.length, 1);
    assert.strictEqual(res.payload.data[0].studentName, 'سارة محمد');
    assert.strictEqual(res.payload.data[0].studentCode, 'S-1');
  });

  it('renders an Arabic certificate PDF and caches the file path', async () => {
    state.certificates.push({
      id: 'cert-1', companyId: 'comp-1', studentId: 'stu-1', examId: 'exam-1',
      title: 'إتمام مستوى الحروف', type: 'LEVEL', level: 'المستوى الثاني',
      serialNumber: 'CERT-202611-0001', issuedAt: new Date(),
    });

    const res = makeRes();
    await controller.downloadCertificatePdf(makeReq({}, { id: 'cert-1' }), res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['Content-Type'], 'application/pdf');
    assert.ok(Buffer.isBuffer(res.sent));
    assert.strictEqual(res.sent.subarray(0, 5).toString(), '%PDF-');
    assert.ok(res.sent.length > 5000);
    assert.ok(String(state.certificates[0].pdfPath).endsWith('.pdf'));

    const cleanup = require('../../services/educationCertificatePdfService');
    const fs = require('fs');
    const path = require('path');
    const file = path.join(process.cwd(), state.certificates[0].pdfPath);
    if (fs.existsSync(file)) fs.unlinkSync(file);
    const dir = path.dirname(file);
    try {
      if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
      if (fs.readdirSync(path.dirname(dir)).length === 0) fs.rmdirSync(path.dirname(dir));
    } catch (_) {}
    assert.ok(cleanup.certificatesRoot());
  });

  it('deletes a certificate', async () => {
    state.certificates.push({ id: 'cert-1', companyId: 'comp-1', studentId: 'stu-1', serialNumber: 'CERT-X' });
    const res = makeRes();
    await controller.deleteCertificate(makeReq({}, { id: 'cert-1' }), res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(state.certificates.length, 0);
  });
});

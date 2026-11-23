const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const state = {
  students: [],
  payments: [],
};

const mockPrisma = {
  educationStudent: {
    findMany: async ({ where }) =>
      state.students.filter(
        (student) => student.companyId === where.companyId && student.customerId === where.customerId
      ),
    findFirst: async ({ where }) =>
      state.students.find((student) => student.id === where.id && student.companyId === where.companyId) || null,
  },
  educationPayment: {
    findMany: async ({ where }) =>
      state.payments.filter(
        (payment) =>
          payment.companyId === where.companyId &&
          (!where.studentId?.in || where.studentId.in.includes(payment.studentId))
      ),
    findFirst: async ({ where }) =>
      state.payments.find(
        (payment) =>
          payment.id === where.id &&
          payment.companyId === where.companyId &&
          (!where.studentId?.in || where.studentId.in.includes(payment.studentId))
      ) || null,
  },
  educationEnrollment: {
    findFirst: async ({ where }) =>
      where.id === 'enr-1'
        ? { id: 'enr-1', package: { name: 'باقة 10 ساعات', hoursCount: 10 } }
        : null,
  },
  company: {
    findUnique: async () => ({ name: 'مركز ماكس', phone: '0100', address: 'القاهرة' }),
  },
};

const sharedDbPath = require.resolve('../../services/sharedDatabase');
require.cache[sharedDbPath] = {
  id: sharedDbPath, filename: sharedDbPath, loaded: true,
  exports: { getSharedPrismaClient: () => mockPrisma },
};

const pdfCalls = [];
const pdfServicePath = require.resolve('../../services/educationReceiptPdfService');
require.cache[pdfServicePath] = {
  id: pdfServicePath, filename: pdfServicePath, loaded: true,
  exports: {
    getOrCreateReceiptPdf: async (_prisma, args) => {
      pdfCalls.push(args);
      if (args.studentIds && !args.studentIds.includes('stu-1')) return null;
      return { buffer: Buffer.from('%PDF-1.4 parent'), payment: { id: args.paymentId, paymentNumber: 'EDU-PAY-1' } };
    },
  },
};

const controller = require('../../controller/educationParentPortalPaymentsController');
const makeRes = () => ({
  statusCode: 200,
  payload: null,
  headers: {},
  body: null,
  setHeader(key, value) { this.headers[key] = value; return this; },
  send(body) { this.body = body; return this; },
  status(code) { this.statusCode = code; return this; },
  json(body) { this.payload = body; return this; },
});

const makeReq = (parent = { id: 'cust-1', companyId: 'comp-1' }, params = {}) => ({ parent, params, headers: {} });

beforeEach(() => {
  state.students = [
    { id: 'stu-1', companyId: 'comp-1', customerId: 'cust-1', code: 'S-1', firstName: 'سارة', lastName: 'محمد', phone: '0111' },
    { id: 'stu-2', companyId: 'comp-2', customerId: 'cust-1', code: 'S-2', firstName: 'عمر', lastName: 'محمد' },
  ];
  state.payments = [
    {
      id: 'pay-1', companyId: 'comp-1', studentId: 'stu-1', enrollmentId: 'enr-1',
      paymentNumber: 'EDU-PAY-202611-0001', receiptNumber: 'RCP-202611-0001',
      studentName: 'سارة محمد', amount: 500, method: 'CASH', status: 'COMPLETED',
      paidAt: new Date().toISOString(),
    },
    {
      id: 'pay-2', companyId: 'comp-1', studentId: 'stu-other', enrollmentId: null,
      paymentNumber: 'EDU-PAY-202611-0002', receiptNumber: 'RCP-202611-0002',
      studentName: 'طالب آخر', amount: 300, method: 'CASH', status: 'COMPLETED',
      paidAt: new Date().toISOString(),
    },
  ];
});

describe('parent portal payments', () => {
  it('lists only payments for the parent own children within the same tenant', async () => {
    const res = makeRes();
    await controller.listPayments(makeReq(), res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload.data.length, 1);
    assert.strictEqual(res.payload.data[0].id, 'pay-1');
  });

  it('returns an empty list when the parent has no children', async () => {
    const res = makeRes();
    await controller.listPayments(makeReq({ id: 'cust-none', companyId: 'comp-1' }), res);
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.payload.data, []);
  });

  it('refuses a receipt that belongs to another family', async () => {
    const req = makeReq(undefined, { id: 'pay-2' });
    const res = makeRes();
    await controller.getReceipt(req, res);
    assert.strictEqual(res.statusCode, 404);
  });

  it('returns a printable receipt payload for the parent own child', async () => {
    const req = makeReq(undefined, { id: 'pay-1' });
    const res = makeRes();
    await controller.getReceipt(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload.data.payment.receiptNumber, 'RCP-202611-0001');
    assert.strictEqual(res.payload.data.company.name, 'مركز ماكس');
    assert.strictEqual(res.payload.data.student.firstName, 'سارة');
    assert.strictEqual(res.payload.data.package.name, 'باقة 10 ساعات');
  });

  it('streams a family-scoped receipt PDF', async () => {
    const req = makeReq(undefined, { id: 'pay-1' });
    const res = makeRes();
    await controller.downloadReceiptPdf(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.match(res.headers['Content-Type'], /application\/pdf/);
    assert.strictEqual(res.body.subarray(0, 4).toString(), '%PDF');
    assert.deepStrictEqual(pdfCalls[0].studentIds, ['stu-1']);
  });

  it('rejects requests without parent context', async () => {
    const res = makeRes();
    await controller.listPayments({ parent: null, params: {}, headers: {} }, res);
    assert.strictEqual(res.statusCode, 403);
  });
});

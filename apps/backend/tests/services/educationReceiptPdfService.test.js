const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const state = {
  payment: null,
  company: { name: 'مركز ماكس', phone: '0100', address: 'القاهرة', email: 'a@b.c' },
  student: { id: 'stu-1', code: 'S-1', firstName: 'سارة', lastName: 'محمد' },
  enrollment: { id: 'enr-1', package: { name: 'باقة 10 ساعات', hoursCount: 10 } },
  updates: [],
};

const mockPrisma = {
  educationPayment: {
    findFirst: async ({ where }) => {
      const payment = state.payment;
      if (!payment) return null;
      if (where.id && payment.id !== where.id) return null;
      if (where.companyId && payment.companyId !== where.companyId) return null;
      if (where.studentId?.in && !where.studentId.in.includes(payment.studentId)) return null;
      return payment;
    },
    update: async ({ where, data }) => {
      state.updates.push({ where, data });
      Object.assign(state.payment, data);
      return state.payment;
    },
  },
  company: { findUnique: async () => state.company },
  educationStudent: { findFirst: async () => state.student },
  educationEnrollment: { findFirst: async () => state.enrollment },
};

const tmpDir = path.join(os.tmpdir(), `edu-receipts-${Date.now()}`);

beforeEach(() => {
  process.env.EDUCATION_RECEIPTS_DIR = tmpDir;
  state.payment = {
    id: 'pay-1',
    companyId: 'comp-1',
    paymentNumber: 'EDU-PAY-202611-0001',
    receiptNumber: 'RCP-202611-0001',
    studentId: 'stu-1',
    enrollmentId: 'enr-1',
    studentName: 'سارة محمد',
    amount: 500,
    reversedAmount: 0,
    method: 'CASH',
    status: 'COMPLETED',
    paidAt: new Date().toISOString(),
    cashierName: 'منى',
    notes: null,
  };
  state.updates = [];
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.EDUCATION_RECEIPTS_DIR;
});

const service = require('../../services/educationReceiptPdfService');

describe('educationReceiptPdfService', () => {
  it('generates a real PDF file and stores its path on the payment', async () => {
    const result = await service.getOrCreateReceiptPdf(mockPrisma, { companyId: 'comp-1', paymentId: 'pay-1' });

    assert.ok(result);
    assert.ok(Buffer.isBuffer(result.buffer));
    assert.strictEqual(result.buffer.subarray(0, 4).toString(), '%PDF');
    assert.ok(fs.existsSync(result.path));
    assert.strictEqual(result.cached, false);
    assert.strictEqual(state.updates.length, 1);
    assert.match(state.updates[0].data.receiptPdfPath, /EDU-PAY-202611-0001\.pdf$/);
  });

  it('reuses the archived file on the next request', async () => {
    const first = await service.getOrCreateReceiptPdf(mockPrisma, { companyId: 'comp-1', paymentId: 'pay-1' });
    const second = await service.getOrCreateReceiptPdf(mockPrisma, { companyId: 'comp-1', paymentId: 'pay-1' });

    assert.strictEqual(second.cached, true);
    assert.strictEqual(second.path, first.path);
    assert.strictEqual(state.updates.length, 1);
  });

  it('regenerates the file when forced', async () => {
    await service.getOrCreateReceiptPdf(mockPrisma, { companyId: 'comp-1', paymentId: 'pay-1' });
    const forced = await service.getOrCreateReceiptPdf(mockPrisma, { companyId: 'comp-1', paymentId: 'pay-1', force: true });

    assert.strictEqual(forced.cached, false);
    assert.strictEqual(state.updates.length, 2);
  });

  it('returns null for cross-family or cross-tenant requests', async () => {
    const wrongFamily = await service.getOrCreateReceiptPdf(mockPrisma, {
      companyId: 'comp-1', paymentId: 'pay-1', studentIds: ['stu-other'],
    });
    assert.strictEqual(wrongFamily, null);

    const wrongTenant = await service.getOrCreateReceiptPdf(mockPrisma, { companyId: 'comp-2', paymentId: 'pay-1' });
    assert.strictEqual(wrongTenant, null);
  });

  it('renders partially reversed and refunded receipts without errors', async () => {
    state.payment.status = 'PARTIALLY_REVERSED';
    state.payment.reversedAmount = 100;
    state.payment.notes = 'دفعة أولى';
    const result = await service.getOrCreateReceiptPdf(mockPrisma, { companyId: 'comp-1', paymentId: 'pay-1' });
    assert.strictEqual(result.buffer.subarray(0, 4).toString(), '%PDF');

    state.payment.status = 'REVERSED';
    state.payment.reversedAmount = 500;
    state.payment.reversalReason = 'انسحاب';
    const reversed = await service.getOrCreateReceiptPdf(mockPrisma, {
      companyId: 'comp-1', paymentId: 'pay-1', force: true,
    });
    assert.strictEqual(reversed.buffer.subarray(0, 4).toString(), '%PDF');
  });
});

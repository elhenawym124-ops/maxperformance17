const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const { buildStatement } = require('../../services/educationStatementService');
const { buildStatementPdf, buildStatementExcel } = require('../../services/educationStatementExportService');

const state = {};

const prisma = {
  educationStudent: {
    findFirst: async () => ({
      id: 'stu-1', code: 'S-1', firstName: 'سارة', lastName: 'محمد', phone: '0100',
      customer: { firstName: 'أحمد', lastName: 'علي', phone: '0111' },
    }),
  },
  company: { findUnique: async () => ({ name: 'مركز النخبة', phone: '01000000000', address: 'القاهرة' }) },
  educationEnrollment: {
    findMany: async () => ([
      {
        id: 'enr-1', enrollmentDate: new Date('2026-10-05'), finalAmount: 1000, discountAmount: 100,
        discountType: 'COUPON', amountPaid: 400, package: { name: 'باقة 10 ساعات', price: 1000 },
      },
      {
        id: 'enr-2', enrollmentDate: new Date('2026-11-02'), finalAmount: null, discountAmount: 0,
        discountType: 'NONE', amountPaid: 600, package: { name: 'باقة 6 ساعات', price: 600 },
      },
    ]),
  },
  educationPayment: {
    findMany: async () => ([
      { id: 'p1', paymentNumber: 'EDU-PAY-202610-0001', amount: 400, reversedAmount: 0, method: 'CASH', paidAt: new Date('2026-10-06'), enrollmentId: 'enr-1' },
      { id: 'p2', paymentNumber: 'EDU-PAY-202611-0002', amount: 650, reversedAmount: 50, method: 'TRANSFER', paidAt: new Date('2026-11-03'), enrollmentId: 'enr-2' },
    ]),
  },
};

beforeEach(() => {
  state.statement = null;
});

describe('educationStatementService', () => {
  it('builds charges, discounts, payments and a running balance', async () => {
    const statement = await buildStatement(prisma, { companyId: 'comp-1', studentId: 'stu-1', months: 12 });

    assert.strictEqual(statement.student.name, 'سارة محمد');
    assert.strictEqual(statement.student.guardianName, 'أحمد علي');
    assert.strictEqual(statement.totals.charges, 1600);
    assert.strictEqual(statement.totals.discounts, 100);
    // p1 400 + p2 net 600
    assert.strictEqual(statement.totals.paid, 1000);
    assert.strictEqual(statement.totals.refunded, 50);
    assert.strictEqual(statement.totals.balance, 500);

    const types = statement.lines.map((line) => line.type);
    assert.deepStrictEqual(types, ['CHARGE', 'DISCOUNT', 'PAYMENT', 'CHARGE', 'PAYMENT']);

    assert.strictEqual(statement.lines[0].balance, 1000);
    assert.strictEqual(statement.lines[1].balance, 900);
    assert.strictEqual(statement.lines[2].balance, 500);
    assert.strictEqual(statement.lines[3].balance, 1100);
    assert.strictEqual(statement.lines[4].balance, 500);
  });

  it('returns null for a student outside the company', async () => {
    const missing = { ...prisma, educationStudent: { findFirst: async () => null } };
    const statement = await buildStatement(missing, { companyId: 'comp-2', studentId: 'nope' });
    assert.strictEqual(statement, null);
  });

  it('renders a valid Arabic PDF', async () => {
    const statement = await buildStatement(prisma, { companyId: 'comp-1', studentId: 'stu-1', months: 12 });
    const buffer = await buildStatementPdf(statement);

    assert.ok(Buffer.isBuffer(buffer));
    assert.strictEqual(buffer.subarray(0, 5).toString(), '%PDF-');
    assert.ok(buffer.length > 3000);
  });

  it('renders a valid Excel workbook', async () => {
    const statement = await buildStatement(prisma, { companyId: 'comp-1', studentId: 'stu-1', months: 12 });
    const buffer = await buildStatementExcel(statement);

    assert.ok(Buffer.isBuffer(buffer));
    // xlsx is a zip archive
    assert.strictEqual(buffer.subarray(0, 2).toString(), 'PK');
    assert.ok(buffer.length > 3000);
  });
});

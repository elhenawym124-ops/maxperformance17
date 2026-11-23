const { describe, it } = require('node:test');
const assert = require('node:assert');

const state = { calls: [], failFor: null, lastWhere: null };

const pdfServicePath = require.resolve('../../services/educationReceiptPdfService');
require.cache[pdfServicePath] = {
  id: pdfServicePath,
  filename: pdfServicePath,
  loaded: true,
  exports: {
    getOrCreateReceiptPdf: async (_prisma, args) => {
      state.calls.push(args);
      if (state.failFor && args.paymentId === state.failFor) throw new Error('boom');
      return { buffer: Buffer.from('%PDF'), payment: { id: args.paymentId } };
    },
  },
};

const { runReceiptBackfill } = require('../../services/educationReceiptsBackfill');

const mockPrisma = {
  educationPayment: {
    findMany: async ({ where }) => {
      state.lastWhere = where;
      return [
        { id: 'pay-1', companyId: 'comp-1', paymentNumber: 'EDU-PAY-1' },
        { id: 'pay-2', companyId: 'comp-1', paymentNumber: 'EDU-PAY-2' },
      ];
    },
  },
};

describe('educationReceiptsBackfill', () => {
  it('dry-run counts candidates without generating', async () => {
    state.calls = [];
    const summary = await runReceiptBackfill(mockPrisma, { apply: false });
    assert.strictEqual(summary.candidates, 2);
    assert.strictEqual(summary.generated, 0);
    assert.strictEqual(state.calls.length, 0);
    assert.strictEqual(state.lastWhere.receiptPdfPath, null);
  });

  it('apply generates receipts for payments missing a PDF', async () => {
    state.calls = [];
    const summary = await runReceiptBackfill(mockPrisma, { apply: true });
    assert.strictEqual(summary.generated, 2);
    assert.strictEqual(state.calls.length, 2);
    assert.strictEqual(state.calls[0].companyId, 'comp-1');
  });

  it('force regenerates even when a path already exists', async () => {
    state.calls = [];
    await runReceiptBackfill(mockPrisma, { apply: true, force: true });
    assert.strictEqual(state.lastWhere.receiptPdfPath, undefined);
    assert.strictEqual(state.calls.length, 2);
  });

  it('records failures without aborting the rest', async () => {
    state.calls = [];
    state.failFor = 'pay-1';
    const summary = await runReceiptBackfill(mockPrisma, { apply: true });
    state.failFor = null;
    assert.strictEqual(summary.failures.length, 1);
    assert.match(summary.failures[0], /boom/);
  });
});

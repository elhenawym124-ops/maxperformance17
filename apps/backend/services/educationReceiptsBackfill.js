/**
 * Generates and archives PDF receipts for education payments that do not have one.
 */

const receiptPdfService = require('./educationReceiptPdfService');

async function runReceiptBackfill(prisma, { companyId = null, apply = false, force = false, limit = 1000 } = {}) {
  const where = { ...(companyId ? { companyId } : {}) };
  if (!force) where.receiptPdfPath = null;

  const payments = await prisma.educationPayment.findMany({
    where,
    select: { id: true, companyId: true, paymentNumber: true },
    orderBy: { paidAt: 'asc' },
    take: limit,
  });

  const summary = { candidates: payments.length, generated: 0, skipped: 0, failures: [] };
  if (!apply) return summary;

  for (const payment of payments) {
    try {
      const result = await receiptPdfService.getOrCreateReceiptPdf(prisma, {
        companyId: payment.companyId,
        paymentId: payment.id,
        force,
      });
      if (result) summary.generated += 1;
      else summary.skipped += 1;
    } catch (error) {
      summary.failures.push(`${payment.paymentNumber || payment.id}: ${error.message}`);
    }
  }

  return summary;
}

module.exports = { runReceiptBackfill };

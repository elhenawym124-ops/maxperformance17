const { describe, it } = require('node:test');
const assert = require('node:assert');
const { buildEngagement } = require('../../services/educationEngagementService');

const now = new Date();
const atHour = (hoursAgo, hour) => {
  const d = new Date(now.getTime() - hoursAgo * 3600 * 1000);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const prisma = {
  whatsAppNotificationLog: {
    findMany: async () => [
      // 10:00 bucket → 1 read of 2
      { status: 'READ', rawEventType: 'education_statement_due', recipientPhone: '0111', createdAt: atHour(20, 10) },
      { status: 'SENT', rawEventType: 'education_statement_due', recipientPhone: '0111', createdAt: atHour(21, 10) },
      // 18:00 bucket → 2 reads of 2 (best)
      { status: 'READ', rawEventType: 'education_exam_result', recipientPhone: '0122', createdAt: atHour(2, 18) },
      { status: 'READ', rawEventType: 'education_exam_result', recipientPhone: '0122', createdAt: atHour(3, 18) },
      // failures and ignored parent
      { status: 'FAILED', rawEventType: 'education_statement_due', recipientPhone: '0133', createdAt: atHour(5, 9) },
      { status: 'SENT', rawEventType: 'education_statement_due', recipientPhone: '0133', createdAt: atHour(6, 9) },
      { status: 'DELIVERED', rawEventType: 'education_statement_due', recipientPhone: '0133', createdAt: atHour(7, 9) },
    ],
  },
  $queryRawUnsafe: async () => ([{ guardians: 40, activated: 10 }]),
};

describe('educationEngagementService', () => {
  it('computes the delivery funnel, read rate and activation', async () => {
    const report = await buildEngagement(prisma, 'comp-1', { months: 3 });

    assert.strictEqual(report.summary.messages, 7);
    assert.strictEqual(report.summary.read, 3);
    assert.strictEqual(report.summary.sent, 2);
    assert.strictEqual(report.summary.delivered, 1);
    assert.strictEqual(report.summary.failed, 1);
    assert.strictEqual(report.summary.deliveryRate, 85.7);
    assert.strictEqual(report.summary.readRate, 42.9);
    assert.strictEqual(report.summary.guardians, 40);
    assert.strictEqual(report.summary.activated, 10);
    assert.strictEqual(report.summary.activationRate, 25);
  });

  it('breaks the funnel down by event type', async () => {
    const report = await buildEngagement(prisma, 'comp-1', { months: 3 });

    const statement = report.byEventType.find((row) => row.eventType === 'education_statement_due');
    assert.strictEqual(statement.total, 5);
    assert.strictEqual(statement.read, 1);
    assert.strictEqual(statement.readRate, 20);

    const exam = report.byEventType.find((row) => row.eventType === 'education_exam_result');
    assert.strictEqual(exam.readRate, 100);
  });

  it('identifies the best send hour using the sample threshold', async () => {
    const report = await buildEngagement(prisma, 'comp-1', { months: 3, minSample: 2 });

    assert.strictEqual(report.bestHour.hour, 18);
    assert.strictEqual(report.bestHour.readRate, 100);
  });

  it('lists parents who never read anything', async () => {
    const report = await buildEngagement(prisma, 'comp-1', { months: 3 });

    assert.strictEqual(report.ignored.count, 1);
    assert.strictEqual(report.ignored.phones[0].phone, '0133');
    assert.strictEqual(report.ignored.phones[0].read, 0);
  });

  it('returns null rates instead of dividing by zero', async () => {
    const empty = {
      whatsAppNotificationLog: { findMany: async () => [] },
      $queryRawUnsafe: async () => [],
    };
    const report = await buildEngagement(empty, 'comp-1', { months: 1 });

    assert.strictEqual(report.summary.messages, 0);
    assert.strictEqual(report.summary.readRate, null);
    assert.strictEqual(report.summary.activationRate, null);
    assert.strictEqual(report.bestHour, null);
    assert.deepStrictEqual(report.byEventType, []);
  });
});

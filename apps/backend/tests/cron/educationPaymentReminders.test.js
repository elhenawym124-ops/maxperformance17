const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const state = {
  enrollments: [],
  members: [],
  schedules: [],
  logs: [],
  installmentCalls: [],
  renewalCalls: [],
};

const mockPrisma = {
  educationEnrollment: {
    findMany: async () => state.enrollments,
  },
  customerNotificationSchedule: {
    findMany: async () => state.schedules,
  },
  whatsAppNotificationLog: {
    findFirst: async ({ where }) => {
      const match = state.logs.find(
        (log) =>
          log.rawEventType === where.rawEventType &&
          log.recipientPhone === where.recipientPhone &&
          log.companyId === where.companyId
      );
      return match ? { id: 'log-1' } : null;
    },
  },
  $queryRawUnsafe: async () => state.members,
};

const sharedDbPath = require.resolve('../../services/sharedDatabase');
require.cache[sharedDbPath] = {
  id: sharedDbPath, filename: sharedDbPath, loaded: true,
  exports: { getSharedPrismaClient: () => mockPrisma },
};

const notificationPath = require.resolve('../../services/educationNotificationService');
require.cache[notificationPath] = {
  id: notificationPath, filename: notificationPath, loaded: true,
  exports: {
    notifyInstallmentDue: async (payload) => { state.installmentCalls.push(payload); return { success: true }; },
    notifyGroupRenewalDue: async (payload) => { state.renewalCalls.push(payload); return { success: true }; },
  },
};

const { runPaymentReminders } = require('../../cron/educationNotificationCron');

const now = new Date('2026-11-22T11:00:00.000Z');
const daysAgo = (days) => new Date(now.getTime() - days * 86400000).toISOString();

const makeEnrollment = (overrides = {}) => ({
  id: 'enr-1',
  companyId: 'comp-1',
  installments: [
    { installmentNumber: 1, amount: 100, status: 'PAID', dueDate: daysAgo(30) },
    { installmentNumber: 2, amount: 200, status: 'PENDING', dueDate: daysAgo(2) },
    { installmentNumber: 3, amount: 200, status: 'PENDING', dueDate: new Date(now.getTime() + 5 * 86400000).toISOString() },
  ],
  package: { name: 'باقة 10 ساعات' },
  student: {
    firstName: 'سارة', lastName: 'محمد', customerId: 'cust-1',
    customer: { firstName: 'أحمد', lastName: 'علي', phone: '01001234567' },
  },
  ...overrides,
});

beforeEach(() => {
  state.enrollments = [];
  state.members = [];
  state.schedules = [];
  state.logs = [];
  state.installmentCalls = [];
  state.renewalCalls = [];
});

describe('education notification cron — payment reminders', () => {
  it('notifies the parent about the earliest overdue unpaid installment only', async () => {
    state.enrollments = [makeEnrollment()];
    const result = await runPaymentReminders(now);

    assert.strictEqual(result.installmentsSent, 1);
    assert.strictEqual(state.installmentCalls.length, 1);
    const call = state.installmentCalls[0];
    assert.strictEqual(call.amount, 200);
    assert.strictEqual(call.packageName, 'باقة 10 ساعات');
    assert.strictEqual(call.parentPhone, '01001234567');
    assert.strictEqual(call.daysLate, 2);
  });

  it('skips enrollments without a parent phone or without overdue installments', async () => {
    state.enrollments = [
      makeEnrollment({ id: 'enr-no-phone', student: { firstName: 'سارة', lastName: 'محمد', customerId: null, customer: null } }),
      makeEnrollment({
        id: 'enr-future',
        installments: [{ installmentNumber: 1, amount: 100, status: 'PENDING', dueDate: new Date(now.getTime() + 86400000).toISOString() }],
      }),
    ];
    const result = await runPaymentReminders(now);
    assert.strictEqual(result.installmentsSent, 0);
    assert.strictEqual(state.installmentCalls.length, 0);
  });

  it('deduplicates reminders sent within the last 3 days', async () => {
    state.enrollments = [makeEnrollment()];
    state.logs = [{
      companyId: 'comp-1',
      rawEventType: 'education_installment_due',
      recipientPhone: '01001234567',
      createdAt: now.toISOString(),
    }];
    const result = await runPaymentReminders(now);
    assert.strictEqual(result.installmentsSent, 0);
    assert.strictEqual(state.installmentCalls.length, 0);
  });

  it('respects a disabled notification schedule row', async () => {
    state.enrollments = [makeEnrollment()];
    state.schedules = [{ eventType: 'education_installment_due', enabled: false }];
    const result = await runPaymentReminders(now);
    assert.strictEqual(result.installmentsSent, 0);
    assert.strictEqual(state.installmentCalls.length, 0);
  });

  it('notifies a paid monthly member whose renewal date passed with a full fee', async () => {
    state.members = [{
      id: 'gm-1', companyId: 'comp-1', studentId: 'stu-1',
      amountPaid: 400, paymentStatus: 'PAID', nextRenewalDate: daysAgo(4),
      groupName: 'مجموعة أ', feeAmount: 400,
      firstName: 'سارة', lastName: 'محمد',
      parentPhone: '01001234567', parentFirstName: 'أحمد', parentLastName: 'علي',
    }];
    const result = await runPaymentReminders(now);

    assert.strictEqual(result.renewalsSent, 1);
    assert.strictEqual(state.renewalCalls.length, 1);
    assert.strictEqual(state.renewalCalls[0].amount, 400);
    assert.strictEqual(state.renewalCalls[0].daysLate, 4);
    assert.strictEqual(state.renewalCalls[0].groupName, 'مجموعة أ');
  });

  it('notifies an unpaid member with the remaining balance', async () => {
    state.members = [{
      id: 'gm-1', companyId: 'comp-1', studentId: 'stu-1',
      amountPaid: 150, paymentStatus: 'PARTIAL', nextRenewalDate: null,
      groupName: 'مجموعة أ', feeAmount: 400,
      firstName: 'سارة', lastName: 'محمد',
      parentPhone: '01001234567', parentFirstName: 'أحمد', parentLastName: 'علي',
    }];
    await runPaymentReminders(now);
    assert.strictEqual(state.renewalCalls[0].amount, 250);
    assert.strictEqual(state.renewalCalls[0].daysLate, 0);
  });
});

/**
 * Backfill the education payment ledger from historical balances.
 *
 * Historical enrollments / group members were collected before the ledger existed.
 * This creates traceable ledger rows for reporting only — it never moves money and
 * never posts treasury transactions (those were posted by the legacy flow).
 */

const LEDGER_METHODS = ['CASH', 'TRANSFER', 'WALLET', 'CARD', 'INSTAPAY', 'OTHER'];

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

const mapMethod = (paymentMethod) => {
  const value = String(paymentMethod || '').toUpperCase();
  return LEDGER_METHODS.includes(value) ? value : 'CASH';
};

const monthPrefix = (date) => {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  return `EDU-PAY-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-`;
};

const parseDate = (value, fallback) => {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : fallback;
};

/**
 * Pure planner: decides which ledger rows are missing.
 * @param {object} input
 * @param {Array} input.enrollments
 * @param {Array} input.groupMembers
 * @param {Array} input.existingPayments
 * @param {Date} [input.now]
 */
function planBackfill({ enrollments = [], groupMembers = [], existingPayments = [], now = new Date() }) {
  const coveredEnrollments = new Set(
    existingPayments.filter((p) => p.enrollmentId).map((p) => p.enrollmentId)
  );
  const coveredMembers = new Set(
    existingPayments.filter((p) => p.groupMemberId).map((p) => p.groupMemberId)
  );

  const sequences = new Map();
  for (const payment of existingPayments) {
    const number = String(payment.paymentNumber || '');
    if (!number.startsWith('EDU-PAY-')) continue;
    const prefix = number.slice(0, 15);
    const seq = parseInt(number.split('-').pop(), 10);
    if (!Number.isNaN(seq)) sequences.set(prefix, Math.max(sequences.get(prefix) || 0, seq));
  }

  const nextNumber = (date) => {
    const prefix = monthPrefix(date);
    const seq = (sequences.get(prefix) || 0) + 1;
    sequences.set(prefix, seq);
    return `${prefix}${String(seq).padStart(4, '0')}`;
  };

  const payments = [];

  for (const enrollment of enrollments) {
    if (coveredEnrollments.has(enrollment.id)) continue;
    const amount = money(enrollment.amountPaid);
    if (amount <= 0) continue;

    const paidAt = parseDate(enrollment.enrollmentDate || enrollment.createdAt, now);
    const paymentNumber = nextNumber(paidAt);
    const reversed = String(enrollment.paymentStatus || '').toUpperCase() === 'REFUNDED';
    const studentName = `${enrollment.student?.firstName || ''} ${enrollment.student?.lastName || ''}`.trim();

    payments.push({
      companyId: enrollment.companyId,
      paymentNumber,
      receiptNumber: paymentNumber.replace('EDU-PAY-', 'RCP-'),
      studentId: enrollment.studentId || null,
      enrollmentId: enrollment.id,
      branchId: enrollment.branchId || null,
      packageId: enrollment.packageId || null,
      studentName: studentName || null,
      amount,
      method: mapMethod(enrollment.paymentMethod),
      status: reversed ? 'REVERSED' : 'COMPLETED',
      source: 'BACKFILL',
      notes: 'ترحيل دفعة سابقة إلى دفتر المدفوعات (بدون حركة خزينة)',
      paidAt,
      reversedAt: reversed ? now : null,
      reversalReason: reversed ? 'مرحّلة كملغاة — الاسترداد سُجّل قبل الدفتر' : null,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const member of groupMembers) {
    if (coveredMembers.has(member.id)) continue;
    const amount = money(member.amountPaid);
    if (amount <= 0) continue;

    const paidAt = parseDate(member.joinedAt || member.createdAt, now);
    const paymentNumber = nextNumber(paidAt);
    const studentName = `${member.studentFirstName || ''} ${member.studentLastName || ''}`.trim();

    payments.push({
      companyId: member.companyId,
      paymentNumber,
      receiptNumber: paymentNumber.replace('EDU-PAY-', 'RCP-'),
      studentId: member.studentId || null,
      groupId: member.groupId || null,
      groupMemberId: member.id,
      branchId: member.groupBranchId || null,
      studentName: studentName || null,
      amount,
      method: 'CASH',
      status: 'COMPLETED',
      source: 'BACKFILL',
      notes: `ترحيل رسوم عضوية مجموعة${member.groupName ? ` (${member.groupName})` : ''} (بدون حركة خزينة)`,
      paidAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  return payments;
}

async function runBackfill(prisma, { companyId = null, apply = false, limit = 5000, now = new Date() } = {}) {
  const companyIds = companyId
    ? [companyId]
    : (await prisma.educationEnrollment.groupBy({ by: ['companyId'], _count: true }))
        .map((row) => row.companyId)
        .filter(Boolean);

  const summary = { companies: 0, planned: 0, created: 0, skippedCompanies: 0, failures: [] };

  for (const cid of companyIds) {
    summary.companies += 1;
    try {
      const [enrollments, existingPayments] = await Promise.all([
        prisma.educationEnrollment.findMany({
          where: { companyId: cid, amountPaid: { gt: 0 } },
          select: {
            id: true, companyId: true, studentId: true, enrollmentDate: true, createdAt: true,
            amountPaid: true, paymentMethod: true, paymentStatus: true, branchId: true, packageId: true,
            student: { select: { firstName: true, lastName: true } },
          },
          take: limit,
        }),
        prisma.educationPayment.findMany({
          where: { companyId: cid },
          select: { paymentNumber: true, enrollmentId: true, groupMemberId: true },
        }),
      ]);

      let groupMembers = [];
      try {
        groupMembers = await prisma.$queryRawUnsafe(`
          SELECT m."id", m."companyId", m."groupId", m."studentId", m."amountPaid", m."joinedAt",
                 g."name" AS "groupName", g."branchId" AS "groupBranchId",
                 s."firstName" AS "studentFirstName", s."lastName" AS "studentLastName"
          FROM "education_group_members" m
          JOIN "education_groups" g ON g."id" = m."groupId" AND g."companyId" = m."companyId"
          LEFT JOIN "education_students" s ON s."id" = m."studentId" AND s."companyId" = m."companyId"
          WHERE m."companyId" = $1 AND m."amountPaid" > 0
          LIMIT $2
        `, cid, limit);
      } catch (error) {
        summary.failures.push(`${cid}: group members skipped (${error.message})`);
      }

      const planned = planBackfill({ enrollments, groupMembers, existingPayments, now });
      summary.planned += planned.length;

      if (apply && planned.length > 0) {
        const result = await prisma.educationPayment.createMany({ data: planned, skipDuplicates: true });
        summary.created += result.count || 0;
      }
    } catch (error) {
      summary.failures.push(`${cid}: ${error.message}`);
    }
  }

  return summary;
}

module.exports = { planBackfill, runBackfill, mapMethod };

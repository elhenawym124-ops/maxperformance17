/**
 * Student account statement for the education module (packages + payments).
 *
 * Scope: enrollment charges of one student, their discounts, and the payments
 * linked to those enrollments. Group-fee collections are intentionally excluded
 * so the running balance never mixes recurring fees with package invoices.
 */

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

const formatDate = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

async function buildStatement(prisma, { companyId, studentId, months = 12 } = {}) {
  const safeMonths = Math.min(36, Math.max(1, Number(months) || 12));
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (safeMonths - 1), 1);

  const [student, company] = await Promise.all([
    prisma.educationStudent.findFirst({
      where: { id: studentId, companyId },
      select: {
        id: true, code: true, firstName: true, lastName: true, phone: true,
        customer: { select: { firstName: true, lastName: true, phone: true } },
      },
    }),
    prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, phone: true, address: true },
    }).catch(() => null),
  ]);

  if (!student) return null;

  const enrollments = await prisma.educationEnrollment.findMany({
    where: { companyId, studentId },
    orderBy: { enrollmentDate: 'asc' },
    select: {
      id: true, enrollmentDate: true, finalAmount: true, discountAmount: true,
      discountType: true, amountPaid: true, expiresAt: true,
      package: { select: { name: true, price: true } },
    },
  });

  const enrollmentIds = enrollments.map((row) => row.id);
  const payments = enrollmentIds.length
    ? await prisma.educationPayment.findMany({
      where: {
        companyId,
        enrollmentId: { in: enrollmentIds },
        status: { in: ['COMPLETED', 'PARTIALLY_REVERSED'] },
        paidAt: { gte: rangeStart },
      },
      orderBy: { paidAt: 'asc' },
      select: {
        id: true, paymentNumber: true, amount: true, reversedAmount: true,
        method: true, paidAt: true, enrollmentId: true, notes: true,
      },
      take: 2000,
    })
    : [];

  const events = [];
  let totalCharges = 0;
  let totalDiscounts = 0;

  for (const enrollment of enrollments) {
    const gross = money(enrollment.finalAmount || enrollment.package?.price || 0);
    const discount = money(enrollment.discountAmount);
    totalCharges = money(totalCharges + gross);
    totalDiscounts = money(totalDiscounts + discount);

    events.push({
      date: enrollment.enrollmentDate,
      type: 'CHARGE',
      label: `اشتراك ${enrollment.package?.name || 'باقة'}`,
      debit: gross,
      credit: 0,
      reference: enrollment.id,
    });

    if (discount > 0) {
      events.push({
        date: enrollment.enrollmentDate,
        type: 'DISCOUNT',
        label: `خصم${enrollment.discountType ? ` (${enrollment.discountType})` : ''}`,
        debit: 0,
        credit: discount,
        reference: enrollment.id,
      });
    }
  }

  let totalPaid = 0;
  let totalRefunded = 0;
  for (const payment of payments) {
    const amount = money(payment.amount);
    const reversed = money(payment.reversedAmount);
    const net = money(amount - reversed);
    totalPaid = money(totalPaid + net);
    if (reversed > 0) totalRefunded = money(totalRefunded + reversed);

    events.push({
      date: payment.paidAt,
      type: 'PAYMENT',
      label: `سداد ${payment.paymentNumber || ''}`.trim(),
      debit: 0,
      credit: net,
      reference: payment.id,
      method: payment.method || null,
    });
  }

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let running = 0;
  const lines = events.map((event) => {
    running = money(running + money(event.debit) - money(event.credit));
    return {
      date: event.date,
      dateLabel: formatDate(event.date),
      type: event.type,
      label: event.label,
      method: event.method || null,
      debit: money(event.debit),
      credit: money(event.credit),
      balance: running,
      reference: event.reference,
    };
  });

  return {
    student: {
      id: student.id,
      code: student.code || null,
      name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
      phone: student.phone || student.customer?.phone || null,
      guardianName: `${student.customer?.firstName || ''} ${student.customer?.lastName || ''}`.trim() || null,
    },
    company: {
      name: company?.name || 'المركز التعليمي',
      phone: company?.phone || null,
      address: company?.address || null,
    },
    period: { from: rangeStart, to: now, months: safeMonths },
    totals: {
      charges: totalCharges,
      discounts: totalDiscounts,
      paid: totalPaid,
      refunded: totalRefunded,
      balance: money(totalCharges - totalDiscounts - totalPaid),
    },
    lines,
  };
}

module.exports = { buildStatement, formatDate };

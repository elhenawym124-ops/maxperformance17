const { normalizeDateForDb } = require('../../utils/dateUtils');

/**
 * Resolve the effective shift assignment for a given calendar day.
 *
 * Business assumption:
 * - If an employee has a shift explicitly assigned for the requested day, use it.
 * - Otherwise, keep using the latest assigned shift before that day until a newer assignment replaces it.
 */
async function getEffectiveShiftAssignmentForDate(prisma, companyId, userId, date, timezone = 'Africa/Cairo') {
  const targetDate = normalizeDateForDb(date, timezone);

  const exactAssignment = await prisma.shiftAssignment.findFirst({
    where: {
      companyId,
      userId,
      date: targetDate
    },
    include: {
      shift: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (exactAssignment) {
    return exactAssignment;
  }

  return prisma.shiftAssignment.findFirst({
    where: {
      companyId,
      userId,
      date: {
        lte: targetDate
      }
    },
    include: {
      shift: true
    },
    orderBy: [
      { date: 'desc' },
      { createdAt: 'desc' }
    ]
  });
}

async function getEffectiveShiftForDate(prisma, companyId, userId, date, timezone = 'Africa/Cairo') {
  const assignment = await getEffectiveShiftAssignmentForDate(prisma, companyId, userId, date, timezone);
  return assignment?.shift || null;
}

/**
 * المناوبة السارية للموظف، وإن لم يوجد أي تعيين نرجع المناوبة الافتراضية للشركة.
 * بدون هذا السقوط كان احتساب التأخير يستخدم وقتاً ثابتاً (10:00) بدل مناوبة الفرع،
 * فيظهر كل موظف متأخذاً بساعات رغم حضوره في موعده.
 */
async function getEffectiveShiftForDateOrDefault(prisma, companyId, userId, date, timezone = 'Africa/Cairo') {
  const assigned = await getEffectiveShiftForDate(prisma, companyId, userId, date, timezone);
  if (assigned) return assigned;

  return prisma.shift.findFirst({
    where: { companyId, isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
  }).catch(() => null);
}

module.exports = {
  getEffectiveShiftAssignmentForDate,
  getEffectiveShiftForDate,
  getEffectiveShiftForDateOrDefault
};

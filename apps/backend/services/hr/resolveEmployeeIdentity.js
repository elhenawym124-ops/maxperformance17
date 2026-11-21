/**
 * توحيد هوية الموظف في مسارات HR
 * ─────────────────────────────────────────────────────────────────────────────
 * بعض المسارات تتوقع `User.id` وأخرى `Employee.id`، فيرجع «الموظف غير موجود»
 * عند تمرير المعرّف الآخر. هذه الدالة تقبل الاثنين وتُرجع سجل المستخدم.
 */
const findUserByAnyId = async (prisma, companyId, id, options = {}) => {
  if (!id || typeof id !== 'string') return null;

  const user = await prisma.user.findFirst({
    where: { id, companyId },
    ...options,
  });
  if (user) return user;

  const employee = await prisma.employee.findFirst({
    where: { id, companyId },
    select: { userId: true },
  });

  if (!employee?.userId) return null;

  return prisma.user.findFirst({
    where: { id: employee.userId, companyId },
    ...options,
  });
};

/** يرجع { userId, employeeId } لأي معرّف (User أو Employee) */
const resolveIdentity = async (prisma, companyId, id) => {
  if (!id) return { userId: null, employeeId: null };
  const user = await prisma.user.findFirst({ where: { id, companyId }, select: { id: true } });
  if (user) {
    const emp = await prisma.employee.findFirst({ where: { userId: user.id, companyId }, select: { id: true } });
    return { userId: user.id, employeeId: emp?.id || null };
  }
  const emp = await prisma.employee.findFirst({ where: { id, companyId }, select: { id: true, userId: true } });
  if (emp?.userId) return { userId: emp.userId, employeeId: emp.id };
  return { userId: null, employeeId: emp?.id || null };
};

module.exports = { findUserByAnyId, resolveIdentity };

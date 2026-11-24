const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const CID = 'cmwp4ot8p0000juzaeqeysfg3';
(async () => {
  try {
    const students = await p.educationStudent.findMany({
      where: { companyId: CID },
      select: { id: true, code: true, firstName: true, lastName: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const employees = await p.employee.findMany({
      where: { companyId: CID },
      select: { id: true, employeeNumber: true, firstName: true, lastName: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const groups = await p.educationGroup.findMany({
      where: { companyId: CID },
      select: { id: true, name: true, createdAt: true },
    });
    const leaves = await p.leaveRequest.findMany({
      where: { companyId: CID },
      select: { id: true, status: true, reason: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    console.log('STUDENTS', JSON.stringify(students.map((s) => `${s.code} | ${s.firstName} ${s.lastName}`)));
    console.log('EMPLOYEES', JSON.stringify(employees.map((e) => `${e.employeeNumber} | ${e.firstName} ${e.lastName}`)));
    console.log('GROUPS', JSON.stringify(groups.map((g) => g.name)));
    console.log('LEAVES', JSON.stringify(leaves.map((l) => `${l.status} | ${(l.reason || '').slice(0, 24)}`)));
  } catch (e) {
    console.log('ERR', e.message);
  } finally {
    await p.$disconnect();
  }
})();

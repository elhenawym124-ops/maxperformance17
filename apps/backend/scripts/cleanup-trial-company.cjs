/**
 * تنظيف بيانات الاختبار من شركة التجربة (مع إبقاء البيانات التجريبية الواقعية).
 * يُشغَّل على السيرفر حيث يتوفر Prisma Client.
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const CID = 'cmwp4ot8p0000juzaeqeysfg3';

const log = (...a) => console.log(...a);

(async () => {
  try {
    // 1) حضور الديمو داي الاختباري
    const attendees = await p.educationDemoAttendee.findMany({
      where: { companyId: CID, studentName: { contains: 'اليوم١٠' } },
      select: { id: true, studentName: true },
    });
    for (const a of attendees) {
      await p.educationDemoAttendee.delete({ where: { id: a.id } }).catch((e) => log('attendee err', e.message));
      log('deleted attendee:', a.studentName);
    }

    // 2) الطلاب الاختباريون
    const students = await p.educationStudent.findMany({
      where: {
        companyId: CID,
        OR: [{ lastName: { contains: 'اليوم٥' } }, { lastName: { contains: 'اليوم١٠' } }, { firstName: { contains: 'اليوم١٠' } }],
      },
      select: { id: true, code: true, firstName: true, lastName: true },
    });
    for (const s of students) {
      await p.educationStudent.delete({ where: { id: s.id } }).catch((e) => log('student err', e.message));
      log('deleted student:', s.code, s.firstName, s.lastName);
    }

    // 3) الموظف الاختباري
    const emps = await p.employee.findMany({
      where: { companyId: CID, lastName: { contains: 'تجربة' } },
      select: { id: true, employeeNumber: true, firstName: true, lastName: true },
    });
    for (const e of emps) {
      await p.employee.delete({ where: { id: e.id } }).catch((err) => log('employee err', err.message));
      log('deleted employee:', e.employeeNumber, e.firstName, e.lastName);
    }

    // 4) المجموعة الاختبارية (+حصصها)
    const groups = await p.educationGroup.findMany({
      where: { companyId: CID, name: { contains: 'اليوم٦' } },
      select: { id: true, name: true },
    });
    for (const g of groups) {
      await p.educationSession.deleteMany({ where: { companyId: CID, groupId: g.id } }).catch(() => {});
      await p.educationGroup.delete({ where: { id: g.id } }).catch((err) => log('group err', err.message));
      log('deleted group:', g.name);
    }

    // 5) الإجازات الاختبارية
    const leaves = await p.leaveRequest.findMany({
      where: { companyId: CID, reason: { contains: 'اختبار' } },
      select: { id: true, reason: true },
    });
    for (const l of leaves) {
      await p.leaveRequest.delete({ where: { id: l.id } }).catch((err) => log('leave err', err.message));
      log('deleted leave:', (l.reason || '').slice(0, 40));
    }

    // 6) القسم الاختباري
    const depts = await p.department.findMany({
      where: { companyId: CID, name: { contains: 'ضمان الجودة' } },
      select: { id: true, name: true },
    });
    for (const d of depts) {
      await p.department.delete({ where: { id: d.id } }).catch((err) => log('dept err', err.message));
      log('deleted department:', d.name);
    }

    // 7) طلب شحن المحفظة الاختباري (500 ج.م)
    const walletTx = await p.walletTransaction.findMany({
      where: { companyId: CID, amount: 500, status: 'PENDING' },
      select: { id: true, amount: true },
    }).catch(() => []);
    for (const w of walletTx) {
      await p.walletTransaction.delete({ where: { id: w.id } }).catch((err) => log('wallet err', err.message));
      log('deleted wallet txn:', w.amount);
    }

    // 8) تقرير نهائي
    const [st, emp, grp, lv, dp] = await Promise.all([
      p.educationStudent.count({ where: { companyId: CID } }),
      p.employee.count({ where: { companyId: CID } }),
      p.educationGroup.count({ where: { companyId: CID } }),
      p.leaveRequest.count({ where: { companyId: CID } }),
      p.department.count({ where: { companyId: CID } }),
    ]);
    log('REMAINING', JSON.stringify({ students: st, employees: emp, groups: grp, leaves: lv, departments: dp }));
  } catch (e) {
    log('FATAL', e.message);
  } finally {
    await p.$disconnect();
  }
})();

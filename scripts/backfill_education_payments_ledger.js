#!/usr/bin/env node
/**
 * ترحيل دفتر المدفوعات التعليمي (education_payments) من البيانات القديمة.
 *
 * المشكلة: تسجيلات الباقات وأعضاء المجموعات كانت بتتحصّل وتتسجل في خزنة الشركة،
 * لكن من غير صف في دفتر education_payments، فتقارير الحسابات والتسوية تطلع فاضية.
 *
 * الاستخدام:
 *   node scripts/backfill_education_payments_ledger.js --company=<slug|id> [--apply]
 * بدون --apply بيشتغل dry-run ويعرض اللي هيتضاف فقط.
 */
const { getSharedPrismaClient } = require('../apps/backend/services/sharedDatabase');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const companyArg = (args.find((a) => a.startsWith('--company=')) || '').split('=')[1] || null;

const money = (v) => Math.round((Number(v) || 0) * 100) / 100;

async function main() {
  const prisma = getSharedPrismaClient();

  let companies = await prisma.company.findMany({
    where: companyArg ? { OR: [{ id: companyArg }, { slug: companyArg }] } : undefined,
    select: { id: true, name: true, slug: true },
  });
  if (companyArg && companies.length === 0) {
    console.error(`Company not found: ${companyArg}`);
    process.exit(1);
  }

  for (const company of companies) {
    const companyId = company.id;
    console.log(`\n=== ${company.name} (${company.slug || companyId}) ===`);

    const payments = await prisma.educationPayment.findMany({
      where: { companyId, status: 'COMPLETED' },
      select: { enrollmentId: true, groupMemberId: true, amount: true },
    });
    const byEnrollment = new Map();
    const byMember = new Map();
    for (const p of payments) {
      if (p.enrollmentId) {
        byEnrollment.set(p.enrollmentId, (byEnrollment.get(p.enrollmentId) || 0) + money(p.amount));
      }
      if (p.groupMemberId) {
        byMember.set(p.groupMemberId, (byMember.get(p.groupMemberId) || 0) + money(p.amount));
      }
    }

    const prefixFor = (d) => `EDU-PAY-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-`;
    const nextNumber = async (date) => {
      const prefix = prefixFor(date);
      const last = await prisma.educationPayment.findFirst({
        where: { companyId, paymentNumber: { startsWith: prefix } },
        orderBy: { paymentNumber: 'desc' },
        select: { paymentNumber: true },
      });
      let seq = 1;
      if (last?.paymentNumber) {
        const parsed = parseInt(String(last.paymentNumber).split('-').pop(), 10);
        if (!Number.isNaN(parsed)) seq = parsed + 1;
      }
      return `${prefix}${String(seq).padStart(4, '0')}`;
    };

    const queue = [];

    const enrollments = await prisma.educationEnrollment.findMany({
      where: { companyId },
      select: {
        id: true, studentId: true, packageId: true, branchId: true,
        amountPaid: true, enrollmentDate: true,
        student: { select: { firstName: true, lastName: true } },
        package: { select: { name: true } },
      },
      take: 5000,
    });

    // حماية من العد المزدوج: نفس الطالب بنفس المبلغ في نفس اليوم
    // (رسوم مجموعة + تسجيل باقة) = دفعة واحدة اتسجلت في المكانين.
    const enrollmentPaidByStudent = new Map();
    for (const e of enrollments) {
      const paid = money(e.amountPaid);
      if (paid <= 0) continue;
      const key = `${e.studentId}|${paid}`;
      const list = enrollmentPaidByStudent.get(key) || [];
      list.push(new Date(e.enrollmentDate || 0).getTime());
      enrollmentPaidByStudent.set(key, list);
    }
    const isDuplicateOfEnrollment = (studentId, amount, when) => {
      const times = enrollmentPaidByStudent.get(`${studentId}|${money(amount)}`);
      if (!times || times.length === 0) return false;
      const ts = new Date(when || 0).getTime();
      return times.some((t) => Math.abs(t - ts) <= 24 * 60 * 60 * 1000);
    };

    for (const e of enrollments) {
      const paid = money(e.amountPaid);
      if (paid <= 0) continue;
      const recorded = money(byEnrollment.get(e.id) || 0);
      const delta = money(paid - recorded);
      if (delta <= 0.009) continue;
      queue.push({
        kind: 'ENROLLMENT',
        amount: delta,
        paidAt: e.enrollmentDate || new Date(),
        payload: {
          studentId: e.studentId,
          enrollmentId: e.id,
          branchId: e.branchId || null,
          packageId: e.packageId || null,
          studentName: `${e.student?.firstName || ''} ${e.student?.lastName || ''}`.trim() || null,
          notes: `ترحيل دفتر المدفوعات — باقة ${e.package?.name || ''}`.trim(),
        },
      });
    }

    // مجموعة الأعضاء مسجّلة بـ raw SQL لأن موديل EducationGroupMember غير متاح في Prisma client على الإنتاج
    const members = await prisma.$queryRawUnsafe(`
      SELECT m.id, m."groupId", m."studentId", m."amountPaid", m."joinedAt",
             s."firstName", s."lastName"
      FROM "education_group_members" m
      LEFT JOIN "education_students" s ON s.id = m."studentId" AND s."companyId" = m."companyId"
      WHERE m."companyId" = $1
      LIMIT 5000
    `, companyId);

    for (const m of members || []) {
      const paid = money(m.amountPaid);
      if (paid <= 0) continue;
      if (isDuplicateOfEnrollment(m.studentId, paid, m.joinedAt)) {
        console.log(`  [skip] ${m.firstName || ''} ${m.lastName || ''} — نفس الدفعة مسجلة كتسجيل باقة (منع عد مزدوج)`);
        continue;
      }
      const recorded = money(byMember.get(m.id) || 0);
      const delta = money(paid - recorded);
      if (delta <= 0.009) continue;
      queue.push({
        kind: 'GROUP_MEMBER',
        amount: delta,
        paidAt: m.joinedAt || new Date(),
        payload: {
          studentId: m.studentId,
          groupId: m.groupId,
          groupMemberId: m.id,
          studentName: `${m.firstName || ''} ${m.lastName || ''}`.trim() || null,
          notes: 'ترحيل دفتر المدفوعات — رسوم مجموعة',
        },
      });
    }

    if (queue.length === 0) {
      console.log('  لا توجد فروق للترحيل (الدفتر مطابق للبيانات).');
      continue;
    }

    let inserted = 0;
    let total = 0;
    for (const item of queue) {
      total += item.amount;
      const paidAt = new Date(item.paidAt);
      if (!APPLY) {
        console.log(`  [dry] ${item.kind} ${item.payload.studentName || ''} → ${item.amount} ج.م (${paidAt.toISOString().slice(0, 10)})`);
        continue;
      }
      const paymentNumber = await nextNumber(paidAt);
      await prisma.educationPayment.create({
        data: {
          companyId,
          paymentNumber,
          receiptNumber: paymentNumber.replace('EDU-PAY-', 'RCP-'),
          ...item.payload,
          amount: item.amount,
          method: 'CASH',
          status: 'COMPLETED',
          source: 'BACKFILL',
          paidAt,
        },
      });
      inserted += 1;
    }

    console.log(
      APPLY
        ? `  ✅ أُضيف ${inserted} صف بإجمالي ${money(total)} ج.م`
        : `  [dry] ${queue.length} صف بإجمالي ${money(total)} ج.م — أضف --apply للتنفيذ`
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('backfill failed:', err);
    process.exit(1);
  });

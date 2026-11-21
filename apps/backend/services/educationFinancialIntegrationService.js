const { getSharedPrismaClient } = require('./sharedDatabase');

/**
 * Education Financial Integration Service
 * Automatically connects educational activities (teacher payouts, package purchases, group fees)
 * to the core Treasury Accounts (treasury_accounts), Treasury Transactions (treasury_transactions),
 * and Expenses (company_expenses).
 */

/**
 * Resolves or creates the default active treasury account for a company
 */
async function getOrCreateDefaultTreasury(prisma, companyId) {
  let account = await prisma.treasuryAccount.findFirst({
    where: { companyId, isDefault: true, isActive: true }
  });

  if (!account) {
    account = await prisma.treasuryAccount.findFirst({
      where: { companyId, isActive: true },
      orderBy: { createdAt: 'asc' }
    });
  }

  if (!account) {
    account = await prisma.treasuryAccount.create({
      data: {
        companyId,
        name: 'الخزينة النقدية الرئيسية (الكاش)',
        type: 'CASH',
        isDefault: true,
        isActive: true,
        balance: 0,
        currency: 'EGP',
        description: 'الخزينة الافتراضية للسنتر والأنشطة التعليمية'
      }
    });
  }

  return account;
}

/**
 * Resolves or creates the OPEX expense category for teacher salaries
 */
async function getOrCreateSalaryExpenseCategory(prisma, companyId) {
  let category = await prisma.expenseCategory.findFirst({
    where: {
      companyId,
      OR: [
        { name: { contains: 'مرتبات' } },
        { nameEn: { contains: 'Salaries' } },
        { name: { contains: 'معلم' } }
      ]
    }
  });

  if (!category) {
    category = await prisma.expenseCategory.create({
      data: {
        companyId,
        name: 'مرتبات وأجور المعلمين',
        nameEn: 'Teachers Salaries & Payroll',
        type: 'OPEX',
        color: '#10b981',
        icon: 'Users',
        isSystem: true
      }
    });
  }

  return category;
}

/**
 * Records teacher salary payout into company_expenses and deducts from treasury_accounts
 */
async function recordTeacherSalaryPayout({
  companyId,
  paymentId,
  teacherName,
  teacherId,
  amount,
  periodFrom,
  periodTo,
  createdById
}) {
  try {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return null;

    const prisma = getSharedPrismaClient();

    // Idempotency guard: prevent duplicate postings
    const existingTx = await prisma.treasuryTransaction.findFirst({
      where: {
        companyId,
        referenceType: 'EDUCATION_TEACHER_PAYMENT',
        referenceId: String(paymentId)
      }
    });
    if (existingTx) {
      console.log(`[EducationFinance] Payment ${paymentId} already posted to treasury`);
      return existingTx;
    }

    const treasury = await getOrCreateDefaultTreasury(prisma, companyId);
    const category = await getOrCreateSalaryExpenseCategory(prisma, companyId);

    // Generate unique sequential expense number (e.g. EXP-EDU-202611-0001)
    const today = new Date();
    const yearMonth = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `EXP-EDU-${yearMonth}-`;
    const lastExpense = await prisma.companyExpense.findFirst({
      where: { companyId, expenseNumber: { startsWith: prefix } },
      orderBy: { createdAt: 'desc' },
      select: { expenseNumber: true }
    });

    let seq = 1;
    if (lastExpense?.expenseNumber) {
      const parts = lastExpense.expenseNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }
    const expenseNumber = `${prefix}${String(seq).padStart(4, '0')}`;

    const periodText = (periodFrom && periodTo)
      ? `عن الفترة من ${new Date(periodFrom).toLocaleDateString('ar-EG')} إلى ${new Date(periodTo).toLocaleDateString('ar-EG')}`
      : '';

    return await prisma.$transaction(async (tx) => {
      // 1. Create company_expense
      const expense = await tx.companyExpense.create({
        data: {
          companyId,
          expenseNumber,
          title: `صرف مرتب ${teacherName || 'المعلم'} ${periodText}`.trim(),
          amount: numAmount,
          categoryId: category.id,
          treasuryAccountId: treasury.id,
          type: 'OPEX',
          beneficiary: teacherName || 'معلم المادة',
          status: 'PAID',
          paymentDate: new Date(),
          notes: `صرف مستحقات تدريس معتمدة - معرف الدفعة: ${paymentId}`,
          createdById: createdById || null
        }
      });

      // 2. Decrement treasury balance
      const updatedTreasury = await tx.treasuryAccount.update({
        where: { id: treasury.id },
        data: { balance: { decrement: numAmount } }
      });

      // 3. Create treasury transaction
      const transaction = await tx.treasuryTransaction.create({
        data: {
          companyId,
          treasuryAccountId: treasury.id,
          amount: numAmount,
          type: 'EXPENSE',
          runningBalance: Number(updatedTreasury.balance),
          referenceType: 'EDUCATION_TEACHER_PAYMENT',
          referenceId: String(paymentId),
          description: `صرف مرتب ${teacherName || 'المعلم'} ${periodText} بمبلغ ${numAmount} ج.م`.trim(),
          createdById: createdById || null,
          date: new Date()
        }
      });

      console.log(`[EducationFinance] Successfully recorded teacher payout ${paymentId} (-${numAmount} EGP)`);
      return { expense, transaction, treasuryBalance: updatedTreasury.balance };
    });
  } catch (error) {
    console.error('[EducationFinance] Error recording teacher payout:', error);
    return null;
  }
}

/**
 * Records educational fee / package payment inflow into treasury_accounts as DEPOSIT
 */
async function recordEducationRevenue({
  companyId,
  sourceType, // 'EDUCATION_GROUP_FEE' or 'EDUCATION_PACKAGE_REVENUE'
  sourceId,
  studentName,
  title,
  amount,
  createdById
}) {
  try {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return null;

    const prisma = getSharedPrismaClient();

    // Idempotency guard: prevent duplicate postings
    const existingTx = await prisma.treasuryTransaction.findFirst({
      where: {
        companyId,
        referenceType: sourceType,
        referenceId: String(sourceId)
      }
    });
    if (existingTx) {
      console.log(`[EducationFinance] Revenue ${sourceType}/${sourceId} already posted`);
      return existingTx;
    }

    const treasury = await getOrCreateDefaultTreasury(prisma, companyId);

    return await prisma.$transaction(async (tx) => {
      // 1. Increment treasury balance
      const updatedTreasury = await tx.treasuryAccount.update({
        where: { id: treasury.id },
        data: { balance: { increment: numAmount } }
      });

      // 2. Create treasury transaction
      const transaction = await tx.treasuryTransaction.create({
        data: {
          companyId,
          treasuryAccountId: treasury.id,
          amount: numAmount,
          type: 'DEPOSIT',
          runningBalance: Number(updatedTreasury.balance),
          referenceType: sourceType,
          referenceId: String(sourceId),
          description: `${title} - الطالب: ${studentName || 'طالب'} بمبلغ ${numAmount} ج.م`,
          createdById: createdById || null,
          date: new Date()
        }
      });

      console.log(`[EducationFinance] Successfully recorded education revenue ${sourceType}/${sourceId} (+${numAmount} EGP)`);
      return { transaction, treasuryBalance: updatedTreasury.balance };
    });
  } catch (error) {
    console.error('[EducationFinance] Error recording education revenue:', error);
    return null;
  }
}

module.exports = {
  recordTeacherSalaryPayout,
  recordEducationRevenue
};

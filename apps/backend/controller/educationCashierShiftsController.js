const { getSharedPrismaClient } = require('../services/sharedDatabase');
const { logEducationEvent } = require('../services/educationAuditService');

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

const getCompanyId = (req) => req.user?.effectiveCompanyId || req.user?.companyId || null;

const cashierNameOf = (req) =>
  req.user?.name
  || [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ')
  || req.user?.email
  || 'كاشير';

const computeCashTotals = async (db, companyId, from, to) => {
    const [collectedRows, reversedRows] = await Promise.all([
    db.educationPayment.findMany({
      where: {
        companyId,
        method: 'CASH',
        status: { notIn: ['CANCELLED', 'FAILED'] },
        paidAt: { gte: from, lte: to },
      },
      select: { amount: true },
    }),
    db.educationPayment.findMany({
      where: { companyId, reversedAmount: { gt: 0 }, reversedAt: { gte: from, lte: to } },
      select: { reversedAmount: true },
    }),
  ]);

  const collected = money(collectedRows.reduce((sum, row) => sum + money(row.amount), 0));
  const reversed = money(reversedRows.reduce((sum, row) => sum + money(row.reversedAmount), 0));

  return {
    collected,
    reversed,
    net: money(collected - reversed),
  };
};

const computeMethodTotals = async (db, companyId, from, to) => {
  const [collectedRows, reversedRows] = await Promise.all([
    db.educationPayment.findMany({
      where: { companyId, paidAt: { gte: from, lte: to } },
      select: { amount: true, method: true, status: true, reversedAmount: true },
    }),
    db.educationPayment.findMany({
      where: { companyId, reversedAmount: { gt: 0 }, reversedAt: { gte: from, lte: to } },
      select: { reversedAmount: true, method: true },
    }),
  ]);

  const collected = new Map();
  for (const row of collectedRows || []) {
    if (['CANCELLED', 'FAILED'].includes(String(row.status || '').toUpperCase())) continue;
    const method = String(row.method || 'OTHER').toUpperCase();
    collected.set(method, money((collected.get(method) || 0) + money(row.amount)));
  }

  const reversed = new Map();
  for (const row of reversedRows || []) {
    const method = String(row.method || 'OTHER').toUpperCase();
    reversed.set(method, money((reversed.get(method) || 0) + money(row.reversedAmount)));
  }

  const methods = [...new Set([...collected.keys(), ...reversed.keys()])].sort();
  return methods.map((method) => ({
    method,
    collected: money(collected.get(method) || 0),
    reversed: money(reversed.get(method) || 0),
    net: money(money(collected.get(method) || 0) - money(reversed.get(method) || 0)),
  }));
};

const buildReconciliation = async (db, companyId, shift, until = null) => {
  const to = until || shift.closedAt || new Date();
  const rows = await computeMethodTotals(db, companyId, shift.openedAt, to);
  const declared = shift.declaredByMethod && typeof shift.declaredByMethod === 'object'
    ? shift.declaredByMethod
    : {};

  const byMethod = rows.map((row) => {
    const declaredValue = declared[row.method];
    const declaredAmount = declaredValue === undefined || declaredValue === null
      ? null
      : money(declaredValue);
    // The drawer count includes the opening float, so cash is compared to net + opening.
    const expected = row.method === 'CASH'
      ? money(money(shift.openingBalance) + row.net)
      : row.net;
    return {
      ...row,
      expected,
      declared: declaredAmount,
      difference: declaredAmount === null ? null : money(declaredAmount - expected),
    };
  });

  const cash = byMethod.find((row) => row.method === 'CASH');
  const expectedCash = money(money(shift.openingBalance) + (cash?.net || 0));

  return {
    shift: {
      id: shift.id,
      cashierName: shift.cashierName,
      status: shift.status,
      openedAt: shift.openedAt,
      closedAt: shift.closedAt,
      openingBalance: money(shift.openingBalance),
      closingBalance: shift.closingBalance === null || shift.closingBalance === undefined
        ? null
        : money(shift.closingBalance),
      difference: shift.difference === null || shift.difference === undefined
        ? null
        : money(shift.difference),
    },
    window: { from: shift.openedAt, to },
    openingBalance: money(shift.openingBalance),
    expectedCash,
    byMethod,
    totals: {
      collected: money(byMethod.reduce((sum, row) => sum + row.collected, 0)),
      reversed: money(byMethod.reduce((sum, row) => sum + row.reversed, 0)),
      net: money(byMethod.reduce((sum, row) => sum + row.net, 0)),
      declared: money(byMethod.reduce((sum, row) => sum + (row.declared || 0), 0)),
      difference: money(byMethod.reduce((sum, row) => sum + (row.difference || 0), 0)),
    },
  };
};

const getShiftReconciliation = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const shift = await prisma.educationCashierShift.findFirst({
      where: { id: req.params.id, companyId },
    });
    if (!shift) return res.status(404).json({ success: false, error: 'الشيفت غير موجود' });

    const data = await buildReconciliation(prisma, companyId, shift);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error building shift reconciliation:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في مطابقة الشيفت' });
  }
};

const getCurrentShift = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const cashierId = req.query.cashierId || req.user?.id;
    const shift = await prisma.educationCashierShift.findFirst({
      where: { companyId, cashierId, status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });

    if (!shift) return res.json({ success: true, data: { shift: null, live: null } });

    const totals = await computeCashTotals(prisma, companyId, shift.openedAt, new Date());
    const expected = money(money(shift.openingBalance) + totals.net);

    res.json({
      success: true,
      data: {
        shift,
        live: {
          collected: totals.collected,
          reversed: totals.reversed,
          net: totals.net,
          expected,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching current cashier shift:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب الشيفت الحالي' });
  }
};

const openShift = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const openingBalance = req.body?.openingBalance === undefined ? 0 : Number(req.body.openingBalance);
    if (!Number.isFinite(openingBalance) || openingBalance < 0) {
      return res.status(400).json({ success: false, error: 'رصيد الافتتاح غير صالح' });
    }

    const prisma = getSharedPrismaClient();
    const cashierId = req.user?.id || null;
    if (!cashierId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const existing = await prisma.educationCashierShift.findFirst({
      where: { companyId, cashierId, status: 'OPEN' },
    });
    if (existing) {
      return res.status(409).json({ success: false, error: 'يوجد شيفت مفتوح بالفعل لهذا الكاشير' });
    }

    const shift = await prisma.educationCashierShift.create({
      data: {
        companyId,
        cashierId,
        cashierName: cashierNameOf(req),
        openingBalance: money(openingBalance),
        expectedCash: money(openingBalance),
        status: 'OPEN',
      },
    });

    logEducationEvent({
      companyId,
      action: 'OPEN_CASHIER_SHIFT',
      entityType: 'PAYMENT',
      entityId: shift.id,
      entityName: `شيفت ${shift.cashierName}`,
      description: `تم فتح شيفت كاشير برصيد افتتاحي ${shift.openingBalance} ج.م`,
      details: { openingBalance: shift.openingBalance, cashierId },
      severity: 'LOW',
      req,
    }).catch((e) => console.error('[ShiftAudit]', e.message));

    res.json({ success: true, data: shift });
  } catch (error) {
    console.error('Error opening cashier shift:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في فتح الشيفت' });
  }
};

const closeShift = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const closingBalance = req.body?.closingBalance === undefined ? null : Number(req.body.closingBalance);
    if (closingBalance !== null && (!Number.isFinite(closingBalance) || closingBalance < 0)) {
      return res.status(400).json({ success: false, error: 'رصيد الإغلاق غير صالح' });
    }

    const prisma = getSharedPrismaClient();
    const shift = await prisma.educationCashierShift.findFirst({ where: { id, companyId } });
    if (!shift) return res.status(404).json({ success: false, error: 'الشيفت غير موجود' });
    if (shift.status === 'CLOSED') {
      return res.status(409).json({ success: false, error: 'الشيفت مغلق بالفعل' });
    }

    const closedAt = new Date();
    const totals = await computeCashTotals(prisma, companyId, shift.openedAt, closedAt);
    const expectedCash = money(money(shift.openingBalance) + totals.net);
    const actual = closingBalance === null ? expectedCash : money(closingBalance);
    const difference = money(actual - expectedCash);
    const notes = req.body?.notes ? String(req.body.notes).slice(0, 500) : shift.notes;

    // 📋 اختياري: مبالغ مُعدّة لكل طريقة دفع (مطابقة متعددة الطرق)
    let declaredByMethod = null;
    const rawDeclared = req.body?.declaredByMethod;
    if (rawDeclared && typeof rawDeclared === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(rawDeclared)) {
        const amount = Number(value);
        if (!Number.isFinite(amount) || amount < 0) {
          return res.status(400).json({ success: false, error: 'مبلغ مطابقة غير صالح' });
        }
        sanitized[String(key).toUpperCase()] = money(amount);
      }
      declaredByMethod = Object.keys(sanitized).length ? sanitized : null;
    }
    // الكاش المُعد يدويًا هو closingBalance دايمًا
    if (declaredByMethod) {
      declaredByMethod.CASH = actual;
    } else if (closingBalance !== null) {
      declaredByMethod = { CASH: actual };
    }

    const updated = await prisma.educationCashierShift.update({
      where: { id: shift.id },
      data: {
        status: 'CLOSED',
        closedAt,
        closingBalance: actual,
        cashCollected: totals.collected,
        cashReversed: totals.reversed,
        expectedCash,
        difference,
        notes,
        ...(declaredByMethod ? { declaredByMethod } : {}),
      },
    });

    let reconciliation = null;
    try {
      reconciliation = await buildReconciliation(prisma, companyId, updated);
    } catch (_) {}

    logEducationEvent({
      companyId,
      action: 'CLOSE_CASHIER_SHIFT',
      entityType: 'PAYMENT',
      entityId: updated.id,
      entityName: `شيفت ${updated.cashierName}`,
      description: `تم إغلاق شيفت الكاشير — المتوقع ${expectedCash} ج.م، الفعلي ${actual} ج.م، الفرق ${difference} ج.م`,
      details: {
        openingBalance: updated.openingBalance,
        cashCollected: totals.collected,
        cashReversed: totals.reversed,
        expectedCash,
        closingBalance: actual,
        difference,
      },
      severity: Math.abs(difference) > 0.009 ? 'MEDIUM' : 'LOW',
      req,
    }).catch((e) => console.error('[ShiftAudit]', e.message));

    res.json({ success: true, data: updated, reconciliation });
  } catch (error) {
    console.error('Error closing cashier shift:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في إغلاق الشيفت' });
  }
};

const listShifts = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const where = { companyId };
    if (req.query.status && ['OPEN', 'CLOSED'].includes(String(req.query.status).toUpperCase())) {
      where.status = String(req.query.status).toUpperCase();
    }
    if (req.query.cashierId) where.cashierId = req.query.cashierId;
    if (req.query.from || req.query.to) {
      where.openedAt = {};
      if (req.query.from) where.openedAt.gte = new Date(`${req.query.from}T00:00:00`);
      if (req.query.to) where.openedAt.lte = new Date(`${req.query.to}T23:59:59.999`);
    }

    const [items, total] = await Promise.all([
      prisma.educationCashierShift.findMany({
        where,
        orderBy: { openedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.educationCashierShift.count({ where }),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error('Error listing cashier shifts:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب الشيفتات' });
  }
};

const getShiftById = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const shift = await prisma.educationCashierShift.findFirst({
      where: { id: req.params.id, companyId },
    });
    if (!shift) return res.status(404).json({ success: false, error: 'الشيفت غير موجود' });

    const windowEnd = shift.closedAt || new Date();
    const [totals, payments] = await Promise.all([
      computeCashTotals(prisma, companyId, shift.openedAt, windowEnd),
      prisma.educationPayment.findMany({
        where: { companyId, method: 'CASH', paidAt: { gte: shift.openedAt, lte: windowEnd } },
        orderBy: { paidAt: 'desc' },
        take: 200,
        select: {
          id: true, paymentNumber: true, studentName: true, amount: true,
          reversedAmount: true, status: true, paidAt: true, cashierName: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        shift,
        live: {
          collected: totals.collected,
          reversed: totals.reversed,
          expected: money(money(shift.openingBalance) + totals.net),
        },
        payments,
      },
    });
  } catch (error) {
    console.error('Error fetching cashier shift:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب الشيفت' });
  }
};

module.exports = {
  getCurrentShift,
  openShift,
  closeShift,
  listShifts,
  getShiftById,
  getShiftReconciliation,
  computeCashTotals,
  computeMethodTotals,
  buildReconciliation,
};

const { getSharedPrismaClient } = require('../services/sharedDatabase');
const { logEducationEvent } = require('../services/educationAuditService');
const { buildDailyReport, parseDay, dateKey } = require('../services/educationDailyClosingService');

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

const getCompanyId = (req) => req.user?.effectiveCompanyId || req.user?.companyId || null;

const getDailyClosing = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const day = parseDay(req.query.date);
    const closing = await prisma.educationDailyClosing.findFirst({
      where: { companyId, date: day },
    });

    if (closing?.status === 'CLOSED' && closing.snapshot) {
      return res.json({
        success: true,
        data: {
          ...closing.snapshot,
          status: 'CLOSED',
          closing: {
            id: closing.id,
            status: closing.status,
            closedAt: closing.closedAt,
            closedByName: closing.closedByName,
            notes: closing.notes,
            reopenedAt: closing.reopenedAt,
            reopenReason: closing.reopenReason,
          },
        },
      });
    }

    const report = await buildDailyReport(prisma, companyId, day);
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error building daily closing:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب إغلاق اليوم' });
  }
};

const closeDay = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const day = parseDay(req.body?.date);
    const today = parseDay(new Date());
    if (day.getTime() > today.getTime()) {
      return res.status(400).json({ success: false, error: 'لا يمكن إغلاق يوم في المستقبل' });
    }

    const existing = await prisma.educationDailyClosing.findFirst({ where: { companyId, date: day } });
    if (existing?.status === 'CLOSED') {
      return res.status(409).json({ success: false, error: `يوم ${dateKey(day)} مغلق بالفعل` });
    }

    const report = await buildDailyReport(prisma, companyId, day);
    const notes = req.body?.notes ? String(req.body.notes).slice(0, 500) : null;
    const cashier = report.cashier;

    const data = {
      companyId,
      date: day,
      status: 'CLOSED',
      snapshot: report,
      cashTotal: money(report.payments.byMethod.CASH?.amount || 0),
      cardTotal: money(report.payments.byMethod.CARD?.amount || 0),
      transferTotal: money(report.payments.byMethod.TRANSFER?.amount || 0),
      walletTotal: money(report.payments.byMethod.WALLET?.amount || 0),
      otherTotal: money(
        Object.entries(report.payments.byMethod)
          .filter(([method]) => !['CASH', 'CARD', 'TRANSFER', 'WALLET'].includes(method))
          .reduce((sum, [, row]) => sum + money(row.amount), 0)
      ),
      totalGross: money(report.payments.gross),
      totalNet: money(report.payments.net),
      reversedTotal: money(report.payments.reversed),
      walletTopupsTotal: money(report.walletTopups.total),
      treasuryDeposits: money(report.treasury.deposits),
      treasuryExpenses: money(report.treasury.expenses),
      treasuryNet: money(report.treasury.net),
      cashierExpected: money(cashier.expected),
      cashierActual: money(cashier.actual),
      cashierDifference: money(cashier.difference),
      closedById: req.user?.id || null,
      closedByName: req.user?.name || [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ') || null,
      closedAt: new Date(),
      notes,
      reopenedAt: null,
      reopenedById: null,
      reopenReason: null,
    };

    const saved = existing
      ? await prisma.educationDailyClosing.update({ where: { id: existing.id }, data })
      : await prisma.educationDailyClosing.create({ data });

    logEducationEvent({
      companyId,
      action: 'CLOSE_DAILY',
      entityType: 'PAYMENT',
      entityId: saved.id,
      entityName: `إغلاق ${dateKey(day)}`,
      description: `تم إغلاق يوم ${dateKey(day)} — إجمالي ${report.payments.gross} ج.م، صافي ${report.payments.net} ج.م، فرق الدرج ${cashier.difference} ج.م`,
      details: {
        date: dateKey(day),
        gross: report.payments.gross,
        net: report.payments.net,
        reversed: report.payments.reversed,
        walletTopups: report.walletTopups.total,
        treasury: report.treasury,
        cashier: { expected: cashier.expected, actual: cashier.actual, difference: cashier.difference },
      },
      severity: Math.abs(cashier.difference) > 0.009 ? 'MEDIUM' : 'LOW',
      req,
    }).catch((e) => console.error('[DailyClosingAudit]', e.message));

    res.json({
      success: true,
      data: {
        ...report,
        status: 'CLOSED',
        closing: {
          id: saved.id,
          status: saved.status,
          closedAt: saved.closedAt,
          closedByName: saved.closedByName,
          notes: saved.notes,
        },
      },
    });
  } catch (error) {
    console.error('Error closing the day:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في إغلاق اليوم' });
  }
};

const reopenDay = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const { id } = req.params;
    const closing = await prisma.educationDailyClosing.findFirst({ where: { id, companyId } });
    if (!closing) return res.status(404).json({ success: false, error: 'الإغلاق غير موجود' });
    if (closing.status !== 'CLOSED') {
      return res.status(409).json({ success: false, error: 'اليوم مفتوح بالفعل' });
    }

    const reason = req.body?.reason ? String(req.body.reason).slice(0, 500) : null;
    const updated = await prisma.educationDailyClosing.update({
      where: { id: closing.id },
      data: {
        status: 'REOPENED',
        reopenedAt: new Date(),
        reopenedById: req.user?.id || null,
        reopenReason: reason,
      },
    });

    logEducationEvent({
      companyId,
      action: 'REOPEN_DAILY',
      entityType: 'PAYMENT',
      entityId: updated.id,
      entityName: `إعادة فتح ${dateKey(updated.date)}`,
      description: `تم إعادة فتح يوم ${dateKey(updated.date)}${reason ? ` — ${reason}` : ''}`,
      details: { date: dateKey(updated.date), reason },
      severity: 'HIGH',
      req,
    }).catch((e) => console.error('[DailyClosingAudit]', e.message));

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error reopening the day:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في إعادة فتح اليوم' });
  }
};

const listClosings = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const limit = Math.min(90, Math.max(1, parseInt(req.query.limit, 10) || 14));
    const items = await prisma.educationDailyClosing.findMany({
      where: { companyId },
      orderBy: { date: 'desc' },
      take: limit,
      select: {
        id: true, date: true, status: true, totalGross: true, totalNet: true,
        cashTotal: true, cardTotal: true, treasuryNet: true,
        cashierExpected: true, cashierActual: true, cashierDifference: true,
        closedAt: true, closedByName: true, reopenedAt: true, reopenReason: true, notes: true,
      },
    });

    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error listing daily closings:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب سجل الإغلاق' });
  }
};

module.exports = { getDailyClosing, closeDay, reopenDay, listClosings };

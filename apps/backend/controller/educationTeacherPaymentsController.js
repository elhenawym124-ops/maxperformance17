const { getSharedPrismaClient } = require('../services/sharedDatabase');
const { logEducationEvent } = require('../services/educationAuditService');
const { getSingularTeacherLabel } = require('../services/educationLabelService');

const getAll = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { teacherId, status } = req.query;
    const where = { companyId };
    if (teacherId) where.teacherId = teacherId;
    if (status) where.status = status;

    const data = await getSharedPrismaClient().educationTeacherPayment.findMany({
      where,
      include: { teacher: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب المدفوعات' });
  }
};

const calculate = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { teacherId, from, to, hourlyRate } = req.body;
    if (!teacherId || !from || !to) {
      return res.status(400).json({ success: false, error: 'المدرس والتاريخ مطلوبان' });
    }

    const prisma = getSharedPrismaClient();
    const rate = Number(hourlyRate) || 0;
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // 1. Private 1-on-1 Sessions
    const privateSessions = await prisma.educationSession.findMany({
      where: {
        companyId,
        teacherId,
        status: 'CONFIRMED',
        scheduledAt: {
          gte: fromDate,
          lte: toDate
        }
      },
      include: {
        subject: { select: { id: true, name: true } },
        enrollment: { select: { id: true } }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    const privateMinutes = privateSessions.reduce((sum, s) => sum + (s.actualDuration || s.plannedDuration || 60), 0);
    const privateHours = Math.round((privateMinutes / 60) * 100) / 100;
    const privateGross = Math.round(privateHours * rate * 100) / 100;

    // 2. Group Sessions (completed)
    let groupSessions = [];
    try {
      groupSessions = await prisma.$queryRawUnsafe(`
        SELECT 
          s.id,
          s."groupId",
          s."sessionDate",
          s."status",
          s."presentCount",
          s."absentCount",
          g.name AS "groupName",
          g."teacherRateType",
          g."teacherRateValue",
          g."feeType",
          g."feeAmount",
          g."startTime",
          g."endTime",
          sub.name AS "subjectName"
        FROM "education_group_sessions" s
        JOIN "education_groups" g ON g.id = s."groupId" AND g."companyId" = s."companyId"
        LEFT JOIN "education_subjects" sub ON sub.id = g."subjectId" AND sub."companyId" = s."companyId"
        WHERE s."companyId" = $1
          AND (s."teacherId" = $2 OR g."teacherId" = $2)
          AND s."status" = 'COMPLETED'
          AND s."sessionDate" >= $3
          AND s."sessionDate" <= $4
        ORDER BY s."sessionDate" ASC
      `, companyId, teacherId, fromDate, toDate);
    } catch (e) {
      console.warn('[TeacherPayment] Group sessions query bypassed:', e.message);
    }

    let groupMinutes = 0;
    let groupGross = 0;

    const mappedGroupSessions = (groupSessions || []).map((gs) => {
      // Calculate duration
      let durMinutes = 60;
      if (gs.startTime && gs.endTime) {
        const [sh, sm] = gs.startTime.split(':').map(Number);
        const [eh, em] = gs.endTime.split(':').map(Number);
        if (!isNaN(sh) && !isNaN(eh)) {
          durMinutes = Math.max(30, (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0)));
        }
      }
      groupMinutes += durMinutes;

      // Calculate earnings based on group teacherRateType
      let sessionPay = 0;
      const rateVal = Number(gs.teacherRateValue) || 0;
      const present = Number(gs.presentCount) || 0;

      if (gs.teacherRateType === 'FIXED') {
        sessionPay = rateVal;
      } else if (gs.teacherRateType === 'PER_STUDENT') {
        sessionPay = rateVal * (present > 0 ? present : 1);
      } else if (gs.teacherRateType === 'PERCENTAGE') {
        const fee = Number(gs.feeAmount) || 0;
        const feePerSession = gs.feeType === 'PER_SESSION' ? fee : (fee / 8);
        const sessionRev = feePerSession * (present > 0 ? present : 1);
        sessionPay = sessionRev * (rateVal / 100);
      } else {
        // Fallback to hourly rate
        sessionPay = (durMinutes / 60) * rate;
      }

      sessionPay = Math.round(sessionPay * 100) / 100;
      groupGross += sessionPay;

      return {
        id: gs.id,
        date: gs.sessionDate,
        subject: gs.subjectName || gs.groupName,
        groupName: gs.groupName,
        duration: durMinutes,
        status: gs.status,
        sessionType: 'GROUP',
        presentCount: present,
        rateType: gs.teacherRateType || 'HOURLY',
        rateValue: rateVal,
        amount: sessionPay
      };
    });

    const groupHours = Math.round((groupMinutes / 60) * 100) / 100;
    const totalSessions = privateSessions.length + mappedGroupSessions.length;
    const totalHours = Math.round((privateHours + groupHours) * 100) / 100;
    const grossAmount = Math.round((privateGross + groupGross) * 100) / 100;

    const mappedPrivateSessions = privateSessions.map(s => {
      const dur = s.actualDuration || s.plannedDuration || 60;
      const amt = Math.round((dur / 60) * rate * 100) / 100;
      return {
        id: s.id,
        date: s.scheduledAt,
        subject: s.subject?.name,
        duration: dur,
        status: s.status,
        sessionType: 'PRIVATE',
        amount: amt
      };
    });

    const combinedSessions = [...mappedPrivateSessions, ...mappedGroupSessions].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    res.json({
      success: true,
      data: {
        teacherId,
        periodFrom: from,
        periodTo: to,
        totalSessions,
        totalHours,
        hourlyRate: rate,
        grossAmount,
        privateBreakdown: {
          sessionsCount: privateSessions.length,
          hours: privateHours,
          amount: privateGross
        },
        groupBreakdown: {
          sessionsCount: mappedGroupSessions.length,
          hours: groupHours,
          amount: Math.round(groupGross * 100) / 100
        },
        sessions: combinedSessions
      }
    });
  } catch (error) {
    console.error('Error calculating payment:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في حساب المستحقات' });
  }
};

const create = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { teacherId, periodFrom, periodTo, totalSessions, totalHours, hourlyRate, grossAmount, deductions, notes } = req.body;
    if (!teacherId || !periodFrom || !periodTo) {
      return res.status(400).json({ success: false, error: 'بيانات الدفع مطلوبة' });
    }

    const netAmount = (grossAmount || 0) - (deductions || 0);

    const existingPayment = await getSharedPrismaClient().educationTeacherPayment.findFirst({
      where: { companyId, teacherId, periodFrom: new Date(periodFrom), periodTo: new Date(periodTo), status: 'PENDING' }
    });
    if (existingPayment) {
      const data = await getSharedPrismaClient().educationTeacherPayment.update({
        where: { id: existingPayment.id },
        data: {
          totalSessions: totalSessions || existingPayment.totalSessions,
          totalHours: totalHours || existingPayment.totalHours,
          hourlyRate: hourlyRate || existingPayment.hourlyRate,
          grossAmount: grossAmount || existingPayment.grossAmount,
          deductions: deductions !== undefined ? deductions : existingPayment.deductions,
          netAmount,
          notes: notes || existingPayment.notes
        },
        include: { teacher: { select: { id: true, name: true } } }
      });
      return res.json({ success: true, data });
    }

    const data = await getSharedPrismaClient().educationTeacherPayment.create({
      data: {
        companyId,
        teacherId,
        periodFrom: new Date(periodFrom),
        periodTo: new Date(periodTo),
        totalSessions: totalSessions || 0,
        totalHours: totalHours || 0,
        hourlyRate: hourlyRate || 0,
        grossAmount: grossAmount || 0,
        deductions: deductions || 0,
        netAmount,
        notes
      },
      include: { teacher: { select: { id: true, name: true } } }
    });

    const createTeacherLabel = await getSingularTeacherLabel(companyId, 'ar');
    logEducationEvent({
      companyId,
      action: 'CREATE_PAYMENT',
      entityType: 'PAYMENT',
      entityId: data.id,
      entityName: `مستحقات ${data.teacher?.name || createTeacherLabel}`,
      description: `تم إنشاء/تحديث مسير مستحقات ${createTeacherLabel} ${data.teacher?.name || ''} بمبلغ ${data.netAmount} ج.م (${data.totalHours} ساعة - ${data.totalSessions} حصة)`,
      details: {
        teacherId: data.teacherId,
        teacherName: data.teacher?.name,
        periodFrom: data.periodFrom,
        periodTo: data.periodTo,
        totalSessions: data.totalSessions,
        totalHours: data.totalHours,
        netAmount: data.netAmount,
      },
      severity: 'MEDIUM',
      req,
    }).catch(e => console.error('[PaymentAudit]', e.message));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في إنشاء الدفع' });
  }
};

const markPaid = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const existing = await getSharedPrismaClient().educationTeacherPayment.findFirst({
      where: { id, companyId }
    });
    if (!existing) return res.status(404).json({ success: false, error: 'مسير الرواتب غير موجود' });

    const data = await getSharedPrismaClient().educationTeacherPayment.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
      include: { teacher: { select: { id: true, name: true } } }
    });

    const payTeacherLabel = await getSingularTeacherLabel(companyId, 'ar');
    logEducationEvent({
      companyId,
      action: 'PAY_TEACHER',
      entityType: 'PAYMENT',
      entityId: data.id,
      entityName: `صرف مرتب ${data.teacher?.name || payTeacherLabel}`,
      description: `تم صرف وتأكيد دفع مرتب/استحقاق ${payTeacherLabel} ${data.teacher?.name || ''} بمبلغ ${data.netAmount} ج.م`,
      details: {
        teacherId: data.teacherId,
        teacherName: data.teacher?.name,
        netAmount: data.netAmount,
        paidAt: data.paidAt,
      },
      severity: 'HIGH',
      req,
    }).catch(e => console.error('[PaymentAudit]', e.message));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error marking payment:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في تحديث الدفع' });
  }
};

module.exports = { getAll, calculate, create, markPaid };

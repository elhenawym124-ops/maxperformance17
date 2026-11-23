const { getSharedPrismaClient } = require('../services/sharedDatabase');
const educationNotificationService = require('../services/educationNotificationService');
const { logEducationEvent } = require('../services/educationAuditService');
const { getSingularTeacherLabel } = require('../services/educationLabelService');

const getAll = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { studentId, teacherId, subjectId, enrollmentId, status, from, to, sessionType } = req.query;
    const where = { companyId };
    if (studentId) where.studentId = studentId;
    if (teacherId) where.teacherId = teacherId;
    if (subjectId) where.subjectId = subjectId;
    if (enrollmentId) where.enrollmentId = enrollmentId;
    if (status) where.status = status;
    if (sessionType) where.sessionType = sessionType;
    if (from || to) {
      where.scheduledAt = {};
      if (from) where.scheduledAt.gte = new Date(from);
      if (to) where.scheduledAt.lte = new Date(to);
    }

    const prisma = getSharedPrismaClient();
    const data = await prisma.educationSession.findMany({
      where,
      include: {
        student: { select: { id: true, code: true, firstName: true, lastName: true } },
        teacher: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        enrollment: { select: { id: true, remainingHours: true } }
      },
      orderBy: { scheduledAt: 'desc' }
    });

    const formattedPrivate = data.map((s) => ({
      ...s,
      sessionType: 'PRIVATE'
    }));

    // If query allows groups (not explicitly filtered to PRIVATE, and not filtering a specific enrollment)
    if (sessionType !== 'PRIVATE' && !enrollmentId) {
      try {
        let groupSql = `
          SELECT 
            s.id,
            s."groupId",
            s."sessionDate",
            s."status",
            s."notes",
            (SELECT COUNT(*)::int FROM "education_group_attendance" a WHERE a."sessionId" = s.id AND a."status" = 'PRESENT') AS "presentCount",
            (SELECT COUNT(*)::int FROM "education_group_attendance" a WHERE a."sessionId" = s.id AND a."status" = 'ABSENT') AS "absentCount",
            g.name AS "groupName",
            g.code AS "groupCode",
            g.room AS "groupRoom",
            g."startTime",
            g."endTime",
            g."subjectId",
            t.id AS "teacherId",
            t.name AS "teacherName",
            sub.name AS "subjectName"
          FROM "education_group_sessions" s
          JOIN "education_groups" g ON g.id = s."groupId" AND g."companyId" = s."companyId"
          LEFT JOIN "education_teachers" t ON t.id = COALESCE(s."teacherId", g."teacherId") AND t."companyId" = s."companyId"
          LEFT JOIN "education_subjects" sub ON sub.id = g."subjectId" AND sub."companyId" = s."companyId"
          WHERE s."companyId" = $1
        `;
        const params = [companyId];
        let pIdx = 2;

        if (teacherId) {
          groupSql += ` AND (s."teacherId" = $${pIdx} OR g."teacherId" = $${pIdx})`;
          params.push(teacherId);
          pIdx++;
        }
        if (subjectId) {
          groupSql += ` AND g."subjectId" = $${pIdx}`;
          params.push(subjectId);
          pIdx++;
        }
        if (status) {
          groupSql += ` AND s."status" = $${pIdx}`;
          params.push(status);
          pIdx++;
        }
        if (from) {
          groupSql += ` AND s."sessionDate" >= $${pIdx}`;
          params.push(new Date(from));
          pIdx++;
        }
        if (to) {
          groupSql += ` AND s."sessionDate" <= $${pIdx}`;
          params.push(new Date(to));
          pIdx++;
        }

        groupSql += ` ORDER BY s."sessionDate" DESC`;

        const groupRows = await prisma.$queryRawUnsafe(groupSql, ...params);

        const mappedGroups = (groupRows || []).map((gs) => {
          let plannedDuration = 60;
          if (gs.startTime && gs.endTime) {
            const [sh, sm] = gs.startTime.split(':').map(Number);
            const [eh, em] = gs.endTime.split(':').map(Number);
            if (!isNaN(sh) && !isNaN(eh)) {
              plannedDuration = Math.max(30, (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0)));
            }
          }

          return {
            id: gs.id,
            scheduledAt: gs.sessionDate,
            plannedDuration,
            actualDuration: plannedDuration,
            status: gs.status,
            sessionType: 'GROUP',
            groupName: gs.groupName,
            groupId: gs.groupId,
            room: gs.groupRoom,
            notes: gs.notes,
            presentCount: Number(gs.presentCount || 0),
            absentCount: Number(gs.absentCount || 0),
            student: null,
            teacher: gs.teacherId ? { id: gs.teacherId, name: gs.teacherName } : null,
            subject: gs.subjectId ? { id: gs.subjectId, name: gs.subjectName } : null,
            enrollment: null
          };
        });

        if (sessionType === 'GROUP') {
          return res.json({ success: true, data: mappedGroups });
        }

        const combined = [...formattedPrivate, ...mappedGroups].sort(
          (a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt)
        );
        return res.json({ success: true, data: combined });
      } catch (err) {
        console.warn('[Sessions] Group sessions query error:', err.message);
      }
    }

    res.json({ success: true, data: formattedPrivate });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب الحصص' });
  }
};

const getById = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const data = await getSharedPrismaClient().educationSession.findFirst({
      where: { id, companyId },
      include: {
        student: { select: { id: true, code: true, firstName: true, lastName: true, phone: true } },
        teacher: { select: { id: true, name: true, phone: true } },
        subject: { select: { id: true, name: true } },
        enrollment: { select: { id: true, remainingHours: true, totalHours: true } }
      }
    });
    if (!data) return res.status(404).json({ success: false, error: 'الحصة غير موجودة' });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب الحصة' });
  }
};

const create = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { enrollmentId, scheduledAt, plannedDuration, topic, notes, teacherId } = req.body;
    if (!enrollmentId) return res.status(400).json({ success: false, error: 'التسجيل مطلوب' });
    if (!scheduledAt) return res.status(400).json({ success: false, error: 'موعد الحصة مطلوب' });

    const enrollment = await getSharedPrismaClient().educationEnrollment.findFirst({
      where: { id: enrollmentId, companyId },
      include: { package: { select: { subjectId: true } } }
    });
    if (!enrollment) return res.status(400).json({ success: false, error: 'التسجيل غير موجود' });
    if (enrollment.remainingHours <= 0) return res.status(400).json({ success: false, error: 'رصيد الساعات منتهي' });

    const resolvedTeacherId = teacherId || enrollment.teacherId;
    if (!resolvedTeacherId) {
      return res.status(400).json({ success: false, error: 'يجب اختيار أو تعيين مدرس للحصة' });
    }

    const teacher = await getSharedPrismaClient().educationTeacher.findFirst({
      where: { id: resolvedTeacherId, companyId }
    });
    if (!teacher) {
      return res.status(400).json({ success: false, error: 'المدرس المحدد غير موجود' });
    }

    // Auto-link teacher to enrollment if enrollment didn't have one
    if (!enrollment.teacherId) {
      await getSharedPrismaClient().educationEnrollment.update({
        where: { id: enrollment.id },
        data: { teacherId: resolvedTeacherId }
      });
    }

    // Conflict detection: check if teacher has another session at the same time
    const sessionStart = new Date(scheduledAt);
    const sessionEnd = new Date(sessionStart.getTime() + (Number(plannedDuration) || 60) * 60000);

    // W5: التحقق من ساعات توفر المدرس (إن كانت مسجّلة)
    const availability = await require('../utils/educationAvailability').checkTeacherAvailability(
      getSharedPrismaClient(), companyId, resolvedTeacherId, sessionStart, sessionEnd,
    );
    if (!availability.ok) {
      return res.status(409).json({
        success: false,
        error: availability.message,
        code: availability.code,
      });
    }

    const conflicting = await getSharedPrismaClient().educationSession.findFirst({
      where: {
        companyId,
        teacherId: resolvedTeacherId,
        status: { not: 'CANCELLED' },
        scheduledAt: {
          gte: new Date(sessionStart.getTime() - 60 * 60000), // 1 hour buffer
          lte: new Date(sessionEnd.getTime() + 60 * 60000)
        }
      },
      include: {
        student: { select: { id: true, code: true, firstName: true, lastName: true } },
        subject: { select: { id: true, name: true } }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    if (conflicting) {
      const conflictStart = new Date(conflicting.scheduledAt);
      const conflictEnd = new Date(conflictStart.getTime() + (conflicting.plannedDuration || 60) * 60000);
      // Check actual overlap
      if (sessionStart < conflictEnd && sessionEnd > conflictStart) {
        const studentName = `${conflicting.student?.firstName || ''} ${conflicting.student?.lastName || ''}`.trim();
        return res.status(409).json({
          success: false,
          error: `المدرس لديه حصة أخرى في هذا الوقت مع الطالب ${studentName} (${conflicting.subject?.name || ''})`,
          conflict: {
            id: conflicting.id,
            studentName,
            subjectName: conflicting.subject?.name,
            scheduledAt: conflicting.scheduledAt
          }
        });
      }
    }

    // Student-level schedule guard: private session must not clash with another
    // private session or with any active group schedule.
    {
      const scheduleConflicts = require('../services/educationScheduleConflictService');
      const prisma = getSharedPrismaClient();
      const [privateConflicts, groupConflicts] = await Promise.all([
        scheduleConflicts.findStudentPrivateConflicts(prisma, {
          companyId,
          studentId: enrollment.studentId,
          start: sessionStart,
          end: sessionEnd,
        }),
        scheduleConflicts.findStudentGroupConflictAtTime(prisma, {
          companyId,
          studentId: enrollment.studentId,
          start: sessionStart,
          end: sessionEnd,
        }),
      ]);
      const conflicts = [...privateConflicts, ...groupConflicts];
      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'الطالب لديه موعد آخر متعارض في نفس الوقت',
          code: 'STUDENT_SCHEDULE_CONFLICT',
          conflicts,
        });
      }
    }

    const data = await getSharedPrismaClient().educationSession.create({
      data: {
        companyId,
        enrollmentId,
        teacherId: resolvedTeacherId,
        studentId: enrollment.studentId,
        subjectId: enrollment.package.subjectId,
        scheduledAt: new Date(scheduledAt),
        plannedDuration: Number(plannedDuration) || 60,
        topic: topic ? String(topic).trim() : null,
        notes: notes ? String(notes).trim() : null,
        sessionType: req.body.sessionType || 'PRIVATE'
      },
      include: {
        student: { select: { id: true, code: true, firstName: true, lastName: true } },
        teacher: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } }
      }
    });
    const studentName = `${data.student?.firstName || ''} ${data.student?.lastName || ''}`.trim();
    const teacherName = data.teacher?.name || 'مدرس غير محدد';
    const subjectName = data.subject?.name || '';
    const dateFormatted = new Date(data.scheduledAt).toLocaleString('ar-EG');
    const teacherLabel = await getSingularTeacherLabel(companyId, 'ar');
    logEducationEvent({
      companyId,
      action: 'SCHEDULE_SESSION',
      entityType: 'SESSION',
      entityId: data.id,
      entityName: `${subjectName} - ${studentName}`,
      description: `تم جدولة حصة ${subjectName} للطالب ${studentName} مع ${teacherLabel} ${teacherName} في ${dateFormatted}`,
      details: {
        scheduledAt: data.scheduledAt,
        plannedDuration: data.plannedDuration,
        studentName,
        teacherName,
        subjectName,
        topic: data.topic,
      },
      req,
    }).catch(e => console.error('[SessionAudit]', e.message));

    educationNotificationService.notifySessionScheduled(companyId, data).catch(e =>
      console.error('[SessionNotify]', e.message)
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في إنشاء الحصة' });
  }
};

const update = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const { scheduledAt, plannedDuration, topic, notes, teacherId } = req.body;

    const existing = await getSharedPrismaClient().educationSession.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ success: false, error: 'الحصة غير موجودة' });
    if (existing.status !== 'SCHEDULED') return res.status(400).json({ success: false, error: 'لا يمكن تعديل حصة غير مجدولة' });

    let safeTeacherId = undefined;
    if (teacherId) {
      const teacher = await getSharedPrismaClient().educationTeacher.findFirst({
        where: { id: teacherId, companyId }
      });
      if (!teacher) return res.status(400).json({ success: false, error: 'المدرس المحدد غير موجود' });
      safeTeacherId = teacherId;
    }

    const data = await getSharedPrismaClient().educationSession.update({
      where: { id },
      data: {
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        plannedDuration: plannedDuration ? Number(plannedDuration) : undefined,
        teacherId: safeTeacherId,
        topic: topic !== undefined ? (topic ? String(topic).trim() : null) : undefined,
        notes: notes !== undefined ? (notes ? String(notes).trim() : null) : undefined
      },
      include: {
        student: { select: { id: true, code: true, firstName: true, lastName: true } },
        teacher: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } }
      }
    });

    const studentName = `${data.student?.firstName || ''} ${data.student?.lastName || ''}`.trim();
    logEducationEvent({
      companyId,
      action: 'UPDATE_SESSION',
      entityType: 'SESSION',
      entityId: data.id,
      entityName: `${data.subject?.name || 'حصة'} - ${studentName}`,
      description: `تم تعديل بيانات الحصة للطالب ${studentName} (${data.subject?.name || ''})`,
      details: {
        before: { scheduledAt: existing.scheduledAt, plannedDuration: existing.plannedDuration },
        after: { scheduledAt: data.scheduledAt, plannedDuration: data.plannedDuration, teacher: data.teacher?.name }
      },
      req,
    }).catch(e => console.error('[SessionAudit]', e.message));

    // 📣 إبلاغ ولي الأمر والمعلم عند تغيير الموعد أو المدرس
    const scheduleChanged = Boolean(scheduledAt) && new Date(scheduledAt).getTime() !== new Date(existing.scheduledAt).getTime();
    const teacherChanged = Boolean(safeTeacherId) && safeTeacherId !== existing.teacherId;
    if ((scheduleChanged || teacherChanged) && typeof educationNotificationService.notifySessionScheduled === 'function') {
      educationNotificationService.notifySessionScheduled(companyId, data)
        .catch(e => console.error('[SessionUpdateNotify]', e.message));
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في تحديث الحصة' });
  }
};

const confirm = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const { actualDuration, notes } = req.body;

    const existing = await getSharedPrismaClient().educationSession.findFirst({
      where: { id, companyId },
      include: {
        enrollment: true,
        teacher: { include: { subjectRates: true } }
      }
    });
    if (!existing) return res.status(404).json({ success: false, error: 'الحصة غير موجودة' });
    if (existing.status !== 'SCHEDULED') return res.status(400).json({ success: false, error: 'يمكن تأكيد الحصص المجدولة فقط' });

    const duration = actualDuration || existing.plannedDuration;
    const hours = duration / 60;

    if (hours > existing.enrollment.remainingHours) {
      return res.status(400).json({ success: false, error: 'الساعات المتبقية غير كافية' });
    }

    // Calculate session payment amount
    const subjectRate = existing.teacher.subjectRates.find(sr => sr.subjectId === existing.subjectId);
    const hourlyRate = subjectRate?.hourlyRate || 0;
    const sessionAmount = Math.round(hours * hourlyRate * 100) / 100;

    // Determine monthly period from session date
    const sessionDate = new Date(existing.scheduledAt);
    const periodFrom = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), 1);
    const periodTo = new Date(sessionDate.getFullYear(), sessionDate.getMonth() + 1, 0, 23, 59, 59);

    const prisma = getSharedPrismaClient();
    const [session] = await prisma.$transaction(async (tx) => {
      const updatedSession = await tx.educationSession.update({
        where: { id },
        data: { status: 'CONFIRMED', actualDuration: duration, notes },
        include: {
          student: { select: { id: true, code: true, firstName: true, lastName: true } },
          teacher: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true } }
        }
      });

      await tx.educationEnrollment.update({
        where: { id: existing.enrollmentId },
        data: { remainingHours: { decrement: hours } }
      });

      // Auto-create or update pending payment for this teacher/period
      const existingPayment = await tx.educationTeacherPayment.findFirst({
        where: { companyId, teacherId: existing.teacherId, periodFrom, periodTo, status: 'PENDING' }
      });

      if (existingPayment) {
        await tx.educationTeacherPayment.update({
          where: { id: existingPayment.id },
          data: {
            totalSessions: { increment: 1 },
            totalHours: { increment: Math.round(hours * 100) / 100 },
            grossAmount: { increment: sessionAmount },
            netAmount: { increment: sessionAmount }
          }
        });
      } else {
        await tx.educationTeacherPayment.create({
          data: {
            companyId,
            teacherId: existing.teacherId,
            periodFrom,
            periodTo,
            totalSessions: 1,
            totalHours: Math.round(hours * 100) / 100,
            hourlyRate,
            grossAmount: sessionAmount,
            deductions: 0,
            netAmount: sessionAmount,
            status: 'PENDING'
          }
        });
      }

      return [updatedSession];
    });

    const studentName = `${session.student?.firstName || ''} ${session.student?.lastName || ''}`.trim();
    const teacherName = session.teacher?.name || '';
    const subjectName = session.subject?.name || '';
    const teacherLabel = await getSingularTeacherLabel(companyId, 'ar');
    logEducationEvent({
      companyId,
      action: 'CONFIRM_SESSION',
      entityType: 'SESSION',
      entityId: session.id,
      entityName: `${subjectName} - ${studentName}`,
      description: `تم تأكيد إتمام الحصة (${subjectName}) للطالب ${studentName} مع ${teacherLabel} ${teacherName}، خصم ${hours} ساعة واحتساب ${sessionAmount} ج.م استحقاق`,
      details: {
        actualDuration: duration,
        hoursDeducted: hours,
        sessionAmount,
        teacherId: existing.teacherId,
        studentName,
        teacherName,
        notes: notes || null,
      },
      severity: 'MEDIUM',
      req,
    }).catch(e => console.error('[SessionAudit]', e.message));

    educationNotificationService.notifySessionConfirmed(companyId, id).catch(e =>
      console.error('[SessionConfirmNotify]', e.message)
    );
    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Error confirming session:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في تأكيد الحصة' });
  }
};

const cancel = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;

    const existing = await getSharedPrismaClient().educationSession.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ success: false, error: 'الحصة غير موجودة' });
    if (existing.status !== 'SCHEDULED') return res.status(400).json({ success: false, error: 'يمكن إلغاء الحصص المجدولة فقط' });

    const data = await getSharedPrismaClient().educationSession.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        student: { select: { id: true, code: true, firstName: true, lastName: true } },
        teacher: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } }
      }
    });

    const studentName = `${data.student?.firstName || ''} ${data.student?.lastName || ''}`.trim();
    const teacherLabel = await getSingularTeacherLabel(companyId, 'ar');
    logEducationEvent({
      companyId,
      action: 'CANCEL_SESSION',
      entityType: 'SESSION',
      entityId: data.id,
      entityName: `${data.subject?.name || 'حصة'} - ${studentName}`,
      description: `تم إلغاء الحصة الدراسية للطالب ${studentName} (${data.subject?.name || ''}) مع ${teacherLabel} ${data.teacher?.name || ''}`,
      details: {
        scheduledAt: data.scheduledAt,
        studentName,
        teacherName: data.teacher?.name,
        subjectName: data.subject?.name,
      },
      severity: 'MEDIUM',
      req,
    }).catch(e => console.error('[SessionAudit]', e.message));

    educationNotificationService.notifySessionCancelled(companyId, data).catch(e =>
      console.error('[SessionCancelNotify]', e.message)
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error cancelling session:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في إلغاء الحصة' });
  }
};

const remove = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const existing = await getSharedPrismaClient().educationSession.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ success: false, error: 'الحصة غير موجودة' });

    const prisma = getSharedPrismaClient();
    await prisma.$transaction(async (tx) => {
      // حماية رصيد الطالب: إذا كانت الحصة مؤكدة ومخصومة، يتم استرجاع الساعات للباقة تلقائياً
      if (existing.status === 'CONFIRMED' && existing.enrollmentId) {
        const hours = (existing.actualDuration || existing.plannedDuration || 60) / 60;
        await tx.educationEnrollment.update({
          where: { id: existing.enrollmentId },
          data: { remainingHours: { increment: hours } }
        });
      }
      await tx.educationSession.delete({ where: { id } });
    });

    logEducationEvent({
      companyId,
      action: 'DELETE_SESSION',
      entityType: 'SESSION',
      entityId: id,
      entityName: `حصة #${id}`,
      description: `تم حذف الحصة الدراسية #${id}${existing.status === 'CONFIRMED' ? ' واسترجاع الساعات لرصيد الطالب' : ''}`,
      details: { deletedSession: existing },
      severity: 'HIGH',
      req,
    }).catch(e => console.error('[SessionAudit]', e.message));

    res.json({ success: true, message: 'تم حذف الحصة وتسوية رصيد الساعات بنجاح' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في حذف الحصة' });
  }
};

/**
 * GET /api/v1/education/sessions/missed
 * الحصص الفائتة: مجدولة/مؤكدة وموعدها مضى بلا تنفيذ.
 * لا تحتاج أي تغيير في المخطط — تُستنتج من الحالة والوقت.
 */
const getMissed = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'لا يوجد سياق شركة' });

    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const now = new Date();
    const since = new Date(now.getTime() - days * 864e5);

    const prisma = getSharedPrismaClient();
    const rows = await prisma.educationSession.findMany({
      where: {
        companyId,
        scheduledAt: { gte: since, lt: now },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      select: {
        id: true,
        scheduledAt: true,
        plannedDuration: true,
        status: true,
        topic: true,
        student: { select: { id: true, code: true, firstName: true, lastName: true } },
        teacher: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: 'desc' },
      take: 500,
    });

    const teacherMap = new Map();
    const studentMap = new Map();
    for (const r of rows) {
      const tKey = r.teacher?.id || 'unknown';
      const t = teacherMap.get(tKey) || {
        teacherId: tKey,
        name: r.teacher?.name || 'غير محدد',
        count: 0,
      };
      t.count += 1;
      teacherMap.set(tKey, t);

      const sKey = r.student?.id || 'unknown';
      const s = studentMap.get(sKey) || {
        studentId: sKey,
        code: r.student?.code || null,
        name: `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim() || 'غير محدد',
        count: 0,
      };
      s.count += 1;
      studentMap.set(sKey, s);
    }

    res.json({
      success: true,
      data: {
        days,
        total: rows.length,
        byTeacher: [...teacherMap.values()].sort((a, b) => b.count - a.count),
        byStudent: [...studentMap.values()].sort((a, b) => b.count - a.count),
        sessions: rows.map((r) => ({
          id: r.id,
          scheduledAt: r.scheduledAt,
          plannedDuration: r.plannedDuration,
          status: r.status,
          topic: r.topic,
          studentName: `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim(),
          studentCode: r.student?.code || null,
          teacherName: r.teacher?.name || null,
          subjectName: r.subject?.name || null,
        })),
      },
    });
  } catch (error) {
    console.error('[EducationSessions] getMissed error:', error.message);
    res.status(500).json({ success: false, error: 'تعذر جلب الحصص الفائتة' });
  }
};

/**
 * Creates a makeup session for an already-consumed session.
 *
 * Hours accounting: a confirmed session already deducted its hours. The makeup
 * credits those hours back to the enrollment, and the makeup session itself
 * deducts them again when confirmed → the student is charged exactly one hour
 * for one delivered lesson.
 */
const createMakeup = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const original = await prisma.educationSession.findFirst({
      where: { id: req.params.id, companyId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        teacher: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        enrollment: { select: { id: true, remainingHours: true, totalHours: true } },
      },
    });
    if (!original) return res.status(404).json({ success: false, error: 'الحصة غير موجودة' });
    if (!original.enrollmentId) {
      return res.status(400).json({ success: false, error: 'الحصة غير مرتبطة بباقة — لا يمكن جدولة تعويض' });
    }
    if (original.status === 'CANCELLED') {
      return res.status(409).json({ success: false, error: 'الحصة ملغاة ولم تُخصم من الرصيد — لا تحتاج تعويضًا' });
    }
    if (original.status !== 'CONFIRMED') {
      return res.status(409).json({ success: false, error: 'لا يمكن التعويض قبل تأكيد الحصة الأصلية' });
    }

    const scheduledAt = req.body?.scheduledAt ? new Date(req.body.scheduledAt) : null;
    if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
      return res.status(400).json({ success: false, error: 'موعد حصة التعويض مطلوب' });
    }

    const existingMakeup = await prisma.educationSession.findFirst({
      where: { companyId, makeupForSessionId: original.id },
      select: { id: true, scheduledAt: true },
    });
    if (existingMakeup) {
      return res.status(409).json({
        success: false,
        code: 'MAKEUP_ALREADY_SCHEDULED',
        error: 'توجد حصة تعويض مجدولة بالفعل لهذه الحصة',
        makeupSessionId: existingMakeup.id,
      });
    }

    const hours = (original.actualDuration || original.plannedDuration || 60) / 60;
    const plannedDuration = Number(req.body?.plannedDuration) || original.plannedDuration || 60;
    const teacherId = req.body?.teacherId || original.teacherId;

    const makeup = await prisma.$transaction(async (tx) => {
      const enrollment = await tx.educationEnrollment.findFirst({
        where: { id: original.enrollmentId, companyId },
        select: { id: true, remainingHours: true, totalHours: true },
      });
      if (!enrollment) {
        const error = new Error('التسجيل غير موجود');
        error.statusCode = 400;
        throw error;
      }

      const restored = Math.round((Number(enrollment.remainingHours) + hours) * 100) / 100;
      const capped = enrollment.totalHours
        ? Math.min(restored, Number(enrollment.totalHours))
        : restored;
      await tx.educationEnrollment.update({
        where: { id: enrollment.id },
        data: { remainingHours: capped },
      });

      return tx.educationSession.create({
        data: {
          companyId,
          enrollmentId: original.enrollmentId,
          teacherId,
          studentId: original.studentId,
          subjectId: original.subjectId,
          scheduledAt,
          plannedDuration,
          status: 'SCHEDULED',
          sessionType: original.sessionType || 'PRIVATE',
          topic: req.body?.topic || original.topic || null,
          notes: req.body?.notes || 'حصة تعويض',
          makeupForSessionId: original.id,
        },
      });
    });

    logEducationEvent({
      companyId,
      action: 'CREATE_MAKEUP_SESSION',
      entityType: 'SESSION',
      entityId: makeup.id,
      entityName: `${original.subject?.name || 'حصة'} - ${original.student?.firstName || ''} ${original.student?.lastName || ''}`.trim(),
      description: `تم جدولة حصة تعويض للطالب ${original.student?.firstName || ''} ${original.student?.lastName || ''} عن حصة ${new Date(original.scheduledAt).toISOString().slice(0, 10)}`,
      details: {
        originalSessionId: original.id,
        makeupSessionId: makeup.id,
        hoursRestored: hours,
        scheduledAt,
      },
      severity: 'LOW',
      req,
    }).catch(() => {});

    try {
      require('../services/educationNotificationService')
        .notifySessionScheduled(companyId, makeup)
        .catch(() => {});
    } catch (_) {}

    res.json({ success: true, data: makeup });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error('Error creating makeup session:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جدولة حصة التعويض' });
  }
};

module.exports = { getAll, getById, create, update, confirm, cancel, remove, getMissed, createMakeup };

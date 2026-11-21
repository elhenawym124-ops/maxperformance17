const express = require('express');
const router = express.Router();
const authController = require('../controller/educationTeacherAuthController');
const { authenticateTeacherToken } = require('../utils/verifyTeacherToken');
const { extractSubdomainMiddleware } = require('../middleware/subdomainMiddleware');
const { getSharedPrismaClient } = require('../services/sharedDatabase');

// 🌐 Multi-tenant Subdomain Resolution
router.use(extractSubdomainMiddleware);

// Teacher auth routes
router.post('/login', authController.login);
router.get('/me', authenticateTeacherToken, authController.me);
router.put('/me/password', authenticateTeacherToken, authController.changePassword);

// Teacher's sessions (Both private 1-on-1 and group classes)
router.get('/sessions', authenticateTeacherToken, async (req, res) => {
  try {
    const { id: teacherId, companyId } = req.teacher;
    const prisma = getSharedPrismaClient();

    const privateSessions = await prisma.educationSession.findMany({
      where: { teacherId, companyId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        subject: { select: { id: true, name: true } },
        enrollment: { select: { id: true, remainingHours: true } }
      },
      orderBy: { scheduledAt: 'desc' }
    });

    const mappedPrivate = privateSessions.map(s => {
      let homework = null;
      let cleanNotes = s.notes;
      if (cleanNotes && cleanNotes.includes('[الواجب]:')) {
        const parts = cleanNotes.split('[الواجب]:');
        cleanNotes = parts[0].trim();
        homework = parts[1].trim();
      }
      return {
        ...s,
        homework: homework || null,
        notes: cleanNotes || s.notes,
        sessionType: 'PRIVATE'
      };
    });

    let mappedGroups = [];
    try {
      const groupSessions = await prisma.$queryRawUnsafe(`
        SELECT 
          s.id,
          s."groupId",
          s."teacherId",
          s."sessionDate" AS "scheduledAt",
          s.topic,
          s.homework,
          s.status,
          s.notes,
          g.name AS "groupName",
          g.code AS "groupCode",
          g.room AS "room",
          sub.name AS "subjectName",
          COALESCE((
            SELECT COUNT(m.id) 
            FROM "education_group_members" m 
            WHERE m."groupId" = g.id AND m."companyId" = s."companyId" AND m.status = 'ACTIVE'
          ), 0) AS "studentCount"
        FROM "education_group_sessions" s
        INNER JOIN "education_groups" g ON g.id = s."groupId" AND g."companyId" = s."companyId"
        LEFT JOIN "education_subjects" sub ON sub.id = g."subjectId"
        WHERE s."teacherId" = $1 AND s."companyId" = $2
        ORDER BY s."sessionDate" DESC
      `, teacherId, companyId);

      mappedGroups = (groupSessions || []).map(g => ({
        id: g.id,
        groupId: g.groupId,
        scheduledAt: g.scheduledAt,
        plannedDuration: 90,
        actualDuration: null,
        status: g.status,
        sessionType: 'GROUP',
        topic: g.topic,
        homework: g.homework,
        notes: g.notes,
        groupName: g.groupName,
        room: g.room,
        student: {
          id: `grp_${g.groupId}`,
          firstName: `مجموعة: ${g.groupName}`,
          lastName: `(${Number(g.studentCount || 0)} طالب)`
        },
        subject: {
          name: g.subjectName || 'مجموعة دراسية'
        }
      }));
    } catch (gErr) {
      console.warn('[TeacherPortal] Group sessions fetch warning:', gErr.message);
    }

    const allSessions = [...mappedPrivate, ...mappedGroups].sort((a, b) => {
      const da = new Date(a.scheduledAt || 0).getTime();
      const db = new Date(b.scheduledAt || 0).getTime();
      return db - da;
    });

    res.json({ success: true, data: allSessions });
  } catch (error) {
    console.error('[TeacherPortal] Sessions error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب الحصص' });
  }
});

// Teacher's payments
router.get('/payments', authenticateTeacherToken, async (req, res) => {
  try {
    const { id: teacherId, companyId } = req.teacher;
    const data = await getSharedPrismaClient().educationTeacherPayment.findMany({
      where: { teacherId, companyId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('[TeacherPortal] Payments error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب المدفوعات' });
  }
});

// Teacher's availability
router.get('/availability', authenticateTeacherToken, async (req, res) => {
  try {
    const teacherId = req.teacher.id;
    const companyId = req.teacher.companyId;
    const data = await getSharedPrismaClient().educationTeacherAvailability.findMany({
      where: { teacherId, companyId },
      orderBy: { dayOfWeek: 'asc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('[TeacherPortal] Availability error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب الأوقات المتاحة' });
  }
});

router.put('/availability', authenticateTeacherToken, async (req, res) => {
  try {
    const teacherId = req.teacher.id;
    const companyId = req.teacher.companyId;
    const { slots } = req.body;
    if (!Array.isArray(slots)) {
      return res.status(400).json({ success: false, message: 'بيانات الأوقات غير صحيحة' });
    }

    const prisma = getSharedPrismaClient();
    await prisma.$transaction(async (tx) => {
      await tx.educationTeacherAvailability.deleteMany({
        where: { teacherId, companyId }
      });

      if (slots.length > 0) {
        await tx.educationTeacherAvailability.createMany({
          data: slots.map(s => ({
            companyId,
            teacherId,
            dayOfWeek: Number(s.dayOfWeek),
            startTime: s.startTime,
            endTime: s.endTime,
            isAvailable: s.isAvailable !== false
          }))
        });
      }
    });

    const data = await prisma.educationTeacherAvailability.findMany({
      where: { teacherId, companyId },
      orderBy: { dayOfWeek: 'asc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('[TeacherPortal] Update availability error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في تحديث الأوقات المتاحة' });
  }
});

// Teacher's schedule (upcoming sessions with week grouping, including both private & group sessions)
router.get('/schedule', authenticateTeacherToken, async (req, res) => {
  try {
    const { id: teacherId, companyId } = req.teacher;
    const { weekStart } = req.query;
    const startDate = weekStart ? new Date(weekStart) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const prisma = getSharedPrismaClient();

    const privateSessions = await prisma.educationSession.findMany({
      where: {
        teacherId,
        companyId,
        scheduledAt: { gte: startDate, lte: endDate }
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        subject: { select: { id: true, name: true } }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    const mappedPrivate = privateSessions.map(s => {
      let homework = null;
      let cleanNotes = s.notes;
      if (cleanNotes && cleanNotes.includes('[الواجب]:')) {
        const parts = cleanNotes.split('[الواجب]:');
        cleanNotes = parts[0].trim();
        homework = parts[1].trim();
      }
      return {
        ...s,
        homework: homework || null,
        notes: cleanNotes || s.notes,
        sessionType: 'PRIVATE'
      };
    });

    let mappedGroups = [];
    try {
      const groupSessions = await prisma.$queryRawUnsafe(`
        SELECT 
          s.id,
          s."groupId",
          s."teacherId",
          s."sessionDate" AS "scheduledAt",
          s.topic,
          s.homework,
          s.status,
          s.notes,
          g.name AS "groupName",
          g.code AS "groupCode",
          g.room AS "room",
          sub.name AS "subjectName",
          COALESCE((
            SELECT COUNT(m.id) 
            FROM "education_group_members" m 
            WHERE m."groupId" = g.id AND m."companyId" = s."companyId" AND m.status = 'ACTIVE'
          ), 0) AS "studentCount"
        FROM "education_group_sessions" s
        INNER JOIN "education_groups" g ON g.id = s."groupId" AND g."companyId" = s."companyId"
        LEFT JOIN "education_subjects" sub ON sub.id = g."subjectId"
        WHERE s."teacherId" = $1 AND s."companyId" = $2
          AND s."sessionDate" >= $3 AND s."sessionDate" <= $4
        ORDER BY s."sessionDate" ASC
      `, teacherId, companyId, startDate, endDate);

      mappedGroups = (groupSessions || []).map(g => ({
        id: g.id,
        groupId: g.groupId,
        scheduledAt: g.scheduledAt,
        plannedDuration: 90,
        actualDuration: null,
        status: g.status,
        sessionType: 'GROUP',
        topic: g.topic,
        homework: g.homework,
        notes: g.notes,
        groupName: g.groupName,
        room: g.room,
        student: {
          id: `grp_${g.groupId}`,
          firstName: `مجموعة: ${g.groupName}`,
          lastName: `(${Number(g.studentCount || 0)} طالب)`
        },
        subject: {
          name: g.subjectName || 'مجموعة دراسية'
        }
      }));
    } catch (gErr) {
      console.warn('[TeacherPortal] Schedule group sessions warning:', gErr.message);
    }

    const allSessions = [...mappedPrivate, ...mappedGroups].sort((a, b) => {
      const da = new Date(a.scheduledAt || 0).getTime();
      const db = new Date(b.scheduledAt || 0).getTime();
      return da - db;
    });

    res.json({ success: true, data: allSessions });
  } catch (error) {
    console.error('[TeacherPortal] Schedule error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب الجدول' });
  }
});

// Teacher dashboard stats (aggregating private & group sessions)
router.get('/dashboard', authenticateTeacherToken, async (req, res) => {
  try {
    const { id: teacherId, companyId } = req.teacher;
    const prisma = getSharedPrismaClient();

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const [
      upcomingPrivate,
      totalPrivate,
      thisWeekPrivate,
      totalPayments,
      studentPrivate
    ] = await Promise.all([
      prisma.educationSession.count({ where: { teacherId, companyId, status: 'SCHEDULED', scheduledAt: { gte: now } } }),
      prisma.educationSession.count({ where: { teacherId, companyId } }),
      prisma.educationSession.count({ where: { teacherId, companyId, scheduledAt: { gte: weekStart, lte: weekEnd } } }),
      prisma.educationTeacherPayment.aggregate({ where: { teacherId, companyId, status: 'PAID' }, _sum: { netAmount: true } }),
      prisma.educationSession.findMany({ where: { teacherId, companyId }, select: { studentId: true }, distinct: ['studentId'] })
    ]);

    let upcomingGroups = 0;
    let totalGroups = 0;
    let thisWeekGroups = 0;
    let groupStudentsCount = 0;

    try {
      const [upG, totG, twG, stG] = await Promise.all([
        prisma.$queryRawUnsafe(`
          SELECT COUNT(id) AS cnt FROM "education_group_sessions"
          WHERE "teacherId" = $1 AND "companyId" = $2 AND "status" = 'SCHEDULED' AND "sessionDate" >= $3
        `, teacherId, companyId, now),
        prisma.$queryRawUnsafe(`
          SELECT COUNT(id) AS cnt FROM "education_group_sessions"
          WHERE "teacherId" = $1 AND "companyId" = $2
        `, teacherId, companyId),
        prisma.$queryRawUnsafe(`
          SELECT COUNT(id) AS cnt FROM "education_group_sessions"
          WHERE "teacherId" = $1 AND "companyId" = $2 AND "sessionDate" >= $3 AND "sessionDate" <= $4
        `, teacherId, companyId, weekStart, weekEnd),
        prisma.$queryRawUnsafe(`
          SELECT COUNT(DISTINCT m."studentId") AS cnt
          FROM "education_group_members" m
          INNER JOIN "education_groups" g ON g.id = m."groupId" AND g."companyId" = m."companyId"
          WHERE g."teacherId" = $1 AND g."companyId" = $2 AND m.status = 'ACTIVE'
        `, teacherId, companyId)
      ]);

      upcomingGroups = Number(upG[0]?.cnt || 0);
      totalGroups = Number(totG[0]?.cnt || 0);
      thisWeekGroups = Number(twG[0]?.cnt || 0);
      groupStudentsCount = Number(stG[0]?.cnt || 0);
    } catch (gErr) {
      console.warn('[TeacherPortal] Dashboard group query warning:', gErr.message);
    }

    res.json({
      success: true,
      data: {
        upcomingSessions: upcomingPrivate + upcomingGroups,
        totalSessions: totalPrivate + totalGroups,
        thisWeekSessions: thisWeekPrivate + thisWeekGroups,
        totalPaid: totalPayments._sum.netAmount || 0,
        totalStudents: studentPrivate.length + groupStudentsCount
      }
    });
  } catch (error) {
    console.error('[TeacherPortal] Dashboard error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب الإحصائيات' });
  }
});

// Teacher completes a session (Private or Group) and records topic, homework, actual duration, and attendance
router.post('/sessions/:id/complete', authenticateTeacherToken, async (req, res) => {
  try {
    const { id: teacherId, companyId } = req.teacher;
    const { id: sessionId } = req.params;
    const { actualDuration, topic, homework, notes, attendanceList } = req.body;
    const prisma = getSharedPrismaClient();

    // 1. Check if private educationSession
    const privateSession = await prisma.educationSession.findFirst({
      where: { id: sessionId, teacherId, companyId },
      include: {
        enrollment: true,
        teacher: { include: { subjectRates: true } },
        student: { select: { id: true, firstName: true, lastName: true } },
        subject: { select: { id: true, name: true } }
      }
    });

    if (privateSession) {
      if (privateSession.status === 'CANCELLED') {
        return res.status(400).json({ success: false, message: 'لا يمكن إنهاء أو تأكيد حصة ملغية' });
      }

      const duration = Number(actualDuration) || privateSession.plannedDuration || 60;
      const hours = duration / 60;

      const wasAlreadyConfirmed = privateSession.status === 'CONFIRMED' || privateSession.status === 'COMPLETED';

      if (!wasAlreadyConfirmed && hours > (privateSession.enrollment?.remainingHours || 0)) {
        return res.status(400).json({ success: false, message: 'الساعات المتبقية للطالب غير كافية' });
      }

      // Build structured notes with homework
      let combinedNotes = notes ? notes.trim() : '';
      if (homework && homework.trim()) {
        combinedNotes = `[الواجب]: ${homework.trim()}${combinedNotes ? `\n${combinedNotes}` : ''}`;
      }

      // Calculate session payment amount
      const subjectRate = privateSession.teacher?.subjectRates?.find(sr => sr.subjectId === privateSession.subjectId);
      const hourlyRate = subjectRate?.hourlyRate || 0;
      const sessionAmount = Math.round(hours * hourlyRate * 100) / 100;

      const sessionDate = new Date(privateSession.scheduledAt);
      const periodFrom = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), 1);
      const periodTo = new Date(sessionDate.getFullYear(), sessionDate.getMonth() + 1, 0, 23, 59, 59);

      const [updated] = await prisma.$transaction(async (tx) => {
        const upSess = await tx.educationSession.update({
          where: { id: sessionId },
          data: {
            status: 'CONFIRMED',
            actualDuration: duration,
            topic: topic || privateSession.topic,
            notes: combinedNotes || privateSession.notes
          },
          include: {
            student: { select: { id: true, code: true, firstName: true, lastName: true } },
            teacher: { select: { id: true, name: true } },
            subject: { select: { id: true, name: true } }
          }
        });

        if (!wasAlreadyConfirmed && privateSession.enrollmentId) {
          await tx.educationEnrollment.update({
            where: { id: privateSession.enrollmentId },
            data: { remainingHours: { decrement: hours } }
          });

          const existingPayment = await tx.educationTeacherPayment.findFirst({
            where: { companyId, teacherId, periodFrom, periodTo, status: 'PENDING' }
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
                teacherId,
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
        }

        return [upSess];
      });

      // Notify parent
      try {
        const educationNotificationService = require('../services/educationNotificationService');
        educationNotificationService.notifySessionConfirmed(companyId, sessionId).catch(e =>
          console.warn('[TeacherPortal Complete Notify]', e.message)
        );
      } catch (ne) {}

      return res.json({
        success: true,
        message: 'تم تسجيل تفاصيل الحصة وتأكيدها بنجاح',
        data: updated
      });
    }

    // 2. Check group session
    const groupSessionRows = await prisma.$queryRawUnsafe(`
      SELECT s.*, g.name AS "groupName", g."teacherId" AS "groupTeacherId"
      FROM "education_group_sessions" s
      JOIN "education_groups" g ON g.id = s."groupId" AND g."companyId" = s."companyId"
      WHERE s.id = $1 AND s."companyId" = $2
        AND (s."teacherId" = $3 OR g."teacherId" = $3)
    `, sessionId, companyId, teacherId);

    if (!groupSessionRows || groupSessionRows.length === 0) {
      return res.status(404).json({ success: false, message: 'الحصة غير موجودة أو غير مسندة لك' });
    }

    const groupSession = groupSessionRows[0];

    await prisma.$executeRawUnsafe(`
      UPDATE "education_group_sessions"
      SET 
        "status" = 'COMPLETED',
        "topic" = COALESCE($1, "topic"),
        "homework" = COALESCE($2, "homework"),
        "notes" = COALESCE($3, "notes")
      WHERE id = $4 AND "companyId" = $5
    `, topic || null, homework || null, notes || null, sessionId, companyId);

    if (Array.isArray(attendanceList) && attendanceList.length > 0) {
      await prisma.$executeRawUnsafe(`
        DELETE FROM "education_group_attendance" WHERE "sessionId" = $1 AND "companyId" = $2
      `, sessionId, companyId);

      const crypto = require('crypto');
      for (const item of attendanceList) {
        if (!item || !item.studentId) continue;
        const attId = `att_${crypto.randomBytes(8).toString('hex')}`;
        await prisma.$executeRawUnsafe(`
          INSERT INTO "education_group_attendance" (
            "id", "companyId", "sessionId", "groupId", "studentId", "status", "notes", "createdAt"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, NOW()
          )
        `, attId, companyId, sessionId, groupSession.groupId, item.studentId, item.status || 'PRESENT', item.notes || null);
      }
    }

    return res.json({
      success: true,
      message: 'تم تسجيل تفاصيل المحاضرة الجماعية والحضور بنجاح'
    });
  } catch (error) {
    console.error('[TeacherPortal] Complete session error:', error);
    res.status(500).json({ success: false, message: error.message || 'حدث خطأ في تسجيل الحصة' });
  }
});

// Fetch active students in a group (for taking attendance)
router.get('/groups/:groupId/students', authenticateTeacherToken, async (req, res) => {
  try {
    const { id: teacherId, companyId } = req.teacher;
    const { groupId } = req.params;
    const prisma = getSharedPrismaClient();

    const group = await prisma.$queryRawUnsafe(`
      SELECT id, name, "teacherId" FROM "education_groups"
      WHERE id = $1 AND "companyId" = $2
    `, groupId, companyId);

    if (!group || group.length === 0) {
      return res.status(404).json({ success: false, message: 'المجموعة غير موجودة' });
    }

    const students = await prisma.$queryRawUnsafe(`
      SELECT 
        m.id AS "membershipId",
        m.status AS "membershipStatus",
        s.id,
        s.code,
        s."firstName",
        s."lastName",
        s.phone,
        s.grade
      FROM "education_group_members" m
      INNER JOIN "education_students" s ON s.id = m."studentId" AND s."companyId" = m."companyId"
      WHERE m."groupId" = $1 AND m."companyId" = $2 AND m.status = 'ACTIVE'
      ORDER BY s."firstName" ASC
    `, groupId, companyId);

    res.json({ success: true, data: students });
  } catch (error) {
    console.error('[TeacherPortal] Group students error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب طلاب المجموعة' });
  }
});

// Fetch attendance records for a group session
router.get('/groups/sessions/:sessionId/attendance', authenticateTeacherToken, async (req, res) => {
  try {
    const { companyId } = req.teacher;
    const { sessionId } = req.params;
    const prisma = getSharedPrismaClient();

    const attendance = await prisma.$queryRawUnsafe(`
      SELECT 
        a.id,
        a."studentId",
        a.status,
        a.notes,
        s."firstName",
        s."lastName"
      FROM "education_group_attendance" a
      INNER JOIN "education_students" s ON s.id = a."studentId" AND s."companyId" = a."companyId"
      WHERE a."sessionId" = $1 AND a."companyId" = $2
    `, sessionId, companyId);

    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error('[TeacherPortal] Session attendance error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب سجل الحضور' });
  }
});

// Teacher's students list (Both private enrollments and group members)
router.get('/students', authenticateTeacherToken, async (req, res) => {
  try {
    const { id: teacherId, companyId } = req.teacher;
    const prisma = getSharedPrismaClient();

    const privateEnrollments = await prisma.educationEnrollment.findMany({
      where: { teacherId, companyId, isActive: true },
      include: {
        student: { select: { id: true, code: true, firstName: true, lastName: true, phone: true, grade: true } },
        package: { select: { id: true, name: true, hoursCount: true } }
      }
    });

    const groupStudents = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT
        s.id,
        s.code,
        s."firstName",
        s."lastName",
        s.phone,
        s.grade,
        g.name AS "groupName",
        g.id AS "groupId"
      FROM "education_group_members" m
      INNER JOIN "education_groups" g ON g.id = m."groupId" AND g."companyId" = m."companyId"
      INNER JOIN "education_students" s ON s.id = m."studentId" AND s."companyId" = m."companyId"
      WHERE (g."teacherId" = $1 OR EXISTS (SELECT 1 FROM "education_group_sessions" gs WHERE gs."groupId" = g.id AND gs."teacherId" = $1))
        AND m."companyId" = $2 AND m.status = 'ACTIVE'
    `, teacherId, companyId);

    res.json({
      success: true,
      data: {
        privateStudents: privateEnrollments.map(e => ({
          studentId: e.student?.id,
          code: e.student?.code,
          name: `${e.student?.firstName || ''} ${e.student?.lastName || ''}`.trim(),
          phone: e.student?.phone,
          grade: e.student?.grade,
          packageName: e.package?.name,
          remainingHours: e.remainingHours,
          totalHours: e.totalHours,
          enrollmentId: e.id,
          type: 'PRIVATE'
        })),
        groupStudents: (groupStudents || []).map(g => ({
          studentId: g.id,
          code: g.code,
          name: `${g.firstName || ''} ${g.lastName || ''}`.trim(),
          phone: g.phone,
          grade: g.grade,
          groupName: g.groupName,
          groupId: g.groupId,
          type: 'GROUP'
        }))
      }
    });
  } catch (error) {
    console.error('[TeacherPortal] Students error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب بيانات الطلاب' });
  }
});

module.exports = router;

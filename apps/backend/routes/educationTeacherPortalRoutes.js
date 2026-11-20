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

    const mappedPrivate = privateSessions.map(s => ({
      ...s,
      sessionType: 'PRIVATE'
    }));

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

    const mappedPrivate = privateSessions.map(s => ({
      ...s,
      sessionType: 'PRIVATE'
    }));

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

module.exports = router;

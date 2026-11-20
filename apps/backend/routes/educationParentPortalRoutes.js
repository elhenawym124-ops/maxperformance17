const express = require('express');
const router = express.Router();
const authController = require('../controller/educationParentAuthController');
const portalController = require('../controller/educationParentPortalController');
const { authenticateParentToken } = require('../utils/verifyParentToken');
const verifyToken = require('../utils/verifyToken');
const { extractSubdomainMiddleware } = require('../middleware/subdomainMiddleware');
const { getSharedPrismaClient } = require('../services/sharedDatabase');

// 🌐 Multi-tenant Subdomain Resolution
router.use(extractSubdomainMiddleware);

// Parent auth routes
router.post('/login', authController.login);
// 🔗 تفعيل حساب ولي الأمر (عام — التوكن في الرابط)
router.get('/activate', authController.validateActivation);
router.post('/activate', authController.activateAccount);
// (أدمن) توليد رابط تفعيل لولي أمر
router.post('/activation-link',
  verifyToken.authenticateToken,
  verifyToken.requireRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'OWNER', 'MANAGER']),
  authController.createActivationLink);
router.get('/me', authenticateParentToken, authController.me);
router.put('/me/password', authenticateParentToken, authController.changePassword);

// Wallet routes
router.get('/wallet', authenticateParentToken, portalController.getWallet);
router.post('/wallet/topup', authenticateParentToken, portalController.topupWallet);

// Package purchase
router.get('/subjects', authenticateParentToken, portalController.getSubjects);
router.post('/purchase-package', authenticateParentToken, portalController.purchasePackage);

// Parent's children
router.get('/children', authenticateParentToken, async (req, res) => {
  try {
    const parentId = req.parent.id;
    const companyId = req.parent.companyId;
    const data = await getSharedPrismaClient().educationStudent.findMany({
      where: { customerId: parentId, companyId, isActive: true },
      include: {
        enrollments: {
          where: { companyId, remainingHours: { gt: 0 } },
          include: {
            package: { select: { id: true, name: true, hoursCount: true, price: true } },
            teacher: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { firstName: 'asc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('[ParentPortal] Children error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب بيانات الأبناء' });
  }
});

// Sessions for a specific child (Both private 1-on-1 and group classes)
router.get('/children/:studentId/sessions', authenticateParentToken, async (req, res) => {
  try {
    const parentId = req.parent.id;
    const companyId = req.parent.companyId;
    const { studentId } = req.params;
    const prisma = getSharedPrismaClient();

    const student = await prisma.educationStudent.findFirst({
      where: { id: studentId, customerId: parentId, companyId }
    });
    if (!student) return res.status(404).json({ success: false, message: 'الطالب غير موجود' });

    const privateSessions = await prisma.educationSession.findMany({
      where: { studentId, companyId },
      include: {
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
        enrollment: { select: { id: true, remainingHours: true, totalHours: true } }
      },
      orderBy: { scheduledAt: 'desc' }
    });

    const formattedPrivate = privateSessions.map((s) => ({
      ...s,
      sessionType: 'PRIVATE',
      attendanceStatus: s.status === 'CONFIRMED' ? 'PRESENT' : (s.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED')
    }));

    // Query group sessions for this student (attendance records + scheduled group sessions)
    let groupSessions = [];
    try {
      groupSessions = await prisma.$queryRawUnsafe(`
        SELECT 
          s.id,
          s."groupId",
          s."sessionDate" AS "scheduledAt",
          s."status" AS "sessionStatus",
          g.name AS "groupName",
          g.room,
          t.name AS "teacherName",
          sub.name AS "subjectName",
          att.status AS "attendanceStatus",
          att.notes AS "attendanceNotes"
        FROM "education_group_members" m
        JOIN "education_groups" g ON g.id = m."groupId" AND g."companyId" = m."companyId"
        JOIN "education_group_sessions" s ON s."groupId" = g.id AND s."companyId" = g."companyId"
        LEFT JOIN "education_teachers" t ON t.id = COALESCE(s."teacherId", g."teacherId") AND t."companyId" = s."companyId"
        LEFT JOIN "education_subjects" sub ON sub.id = g."subjectId" AND sub."companyId" = s."companyId"
        LEFT JOIN "education_group_attendance" att 
          ON att."sessionId" = s.id AND att."studentId" = m."studentId" AND att."companyId" = s."companyId"
        WHERE m."studentId" = $1
          AND m."companyId" = $2
          AND m."status" = 'ACTIVE'
          AND s."status" != 'CANCELLED'
        ORDER BY s."sessionDate" DESC
        LIMIT 100
      `, studentId, companyId);
    } catch (e) {
      console.warn('[ParentPortal] Group sessions query bypassed:', e.message);
    }

    const formattedGroups = (groupSessions || []).map((gs) => ({
      id: gs.id,
      sessionType: 'GROUP',
      groupName: gs.groupName,
      groupId: gs.groupId,
      room: gs.room,
      scheduledAt: gs.scheduledAt,
      status: gs.sessionStatus,
      attendanceStatus: gs.attendanceStatus || (gs.sessionStatus === 'SCHEDULED' ? 'SCHEDULED' : 'PENDING'),
      teacher: gs.teacherName ? { name: gs.teacherName } : null,
      subject: gs.subjectName ? { name: gs.subjectName } : null,
      notes: gs.attendanceNotes
    }));

    const combined = [...formattedPrivate, ...formattedGroups].sort(
      (a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt)
    );

    res.json({ success: true, data: combined });
  } catch (error) {
    console.error('[ParentPortal] Child sessions error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب الحصص' });
  }
});

// Enrollments for a specific child (Both private packages and active group memberships)
router.get('/children/:studentId/enrollments', authenticateParentToken, async (req, res) => {
  try {
    const parentId = req.parent.id;
    const companyId = req.parent.companyId;
    const { studentId } = req.params;
    const prisma = getSharedPrismaClient();

    const student = await prisma.educationStudent.findFirst({
      where: { id: studentId, customerId: parentId, companyId }
    });
    if (!student) return res.status(404).json({ success: false, message: 'الطالب غير موجود' });

    const enrollments = await prisma.educationEnrollment.findMany({
      where: { studentId, companyId },
      include: {
        package: {
          select: {
            id: true,
            name: true,
            hoursCount: true,
            price: true,
            subject: { select: { id: true, name: true } }
          }
        },
        teacher: { select: { id: true, name: true } }
      },
      orderBy: { enrollmentDate: 'desc' }
    });
    const mappedEnrollments = enrollments.map((item) => ({
      ...item,
      enrollmentType: 'PACKAGE',
      subject: item.package?.subject || null
    }));

    // Include group memberships
    let groupMemberships = [];
    try {
      groupMemberships = await prisma.$queryRawUnsafe(`
        SELECT 
          m.id,
          m."groupId",
          m."status",
          m."joinedAt" AS "enrollmentDate",
          m."feeAmount",
          m."paymentStatus",
          m."amountPaid",
          g.name AS "groupName",
          g.code AS "groupCode",
          g."feeType",
          t.name AS "teacherName",
          sub.name AS "subjectName"
        FROM "education_group_members" m
        JOIN "education_groups" g ON g.id = m."groupId" AND g."companyId" = m."companyId"
        LEFT JOIN "education_teachers" t ON t.id = g."teacherId" AND t."companyId" = g."companyId"
        LEFT JOIN "education_subjects" sub ON sub.id = g."subjectId" AND sub."companyId" = g."companyId"
        WHERE m."studentId" = $1
          AND m."companyId" = $2
        ORDER BY m."joinedAt" DESC
      `, studentId, companyId);
    } catch (e) {
      console.warn('[ParentPortal] Group memberships query bypassed:', e.message);
    }

    const mappedGroupMemberships = (groupMemberships || []).map((ge) => ({
      id: ge.id,
      enrollmentType: 'GROUP',
      status: ge.status,
      enrollmentDate: ge.enrollmentDate,
      groupName: ge.groupName,
      groupCode: ge.groupCode,
      feeType: ge.feeType,
      feeAmount: ge.feeAmount,
      paymentStatus: ge.paymentStatus,
      amountPaid: ge.amountPaid,
      package: {
        id: ge.groupId,
        name: `مجموعة ${ge.groupName}`,
        price: ge.feeAmount
      },
      teacher: ge.teacherName ? { name: ge.teacherName } : null,
      subject: ge.subjectName ? { name: ge.subjectName } : null
    }));

    const combinedData = [...mappedEnrollments, ...mappedGroupMemberships].sort(
      (a, b) => new Date(b.enrollmentDate) - new Date(a.enrollmentDate)
    );

    res.json({ success: true, data: combinedData });
  } catch (error) {
    console.error('[ParentPortal] Child enrollments error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب التسجيلات' });
  }
});

// Dashboard stats
router.get('/dashboard', authenticateParentToken, async (req, res) => {
  try {
    const parentId = req.parent.id;
    const companyId = req.parent.companyId;
    const prisma = getSharedPrismaClient();

    const children = await prisma.educationStudent.findMany({
      where: { customerId: parentId, companyId, isActive: true },
      select: { id: true, firstName: true, lastName: true }
    });
    const childIds = children.map(c => c.id);

    const [totalEnrollments, activeEnrollments, upcomingSessions, totalSessions] = await Promise.all([
      prisma.educationEnrollment.count({ where: { companyId, studentId: { in: childIds } } }),
      prisma.educationEnrollment.count({ where: { companyId, studentId: { in: childIds }, remainingHours: { gt: 0 } } }),
      prisma.educationSession.count({ where: { companyId, studentId: { in: childIds }, status: 'SCHEDULED', scheduledAt: { gte: new Date() } } }),
      prisma.educationSession.count({ where: { companyId, studentId: { in: childIds } } })
    ]);

    res.json({
      success: true,
      data: { children: children.length, totalEnrollments, activeEnrollments, upcomingSessions, totalSessions }
    });
  } catch (error) {
    console.error('[ParentPortal] Dashboard error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب الإحصائيات' });
  }
});

module.exports = router;

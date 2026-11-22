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

    const formattedPrivate = privateSessions.map((s) => {
      let homework = null;
      let cleanNotes = s.notes || '';
      if (cleanNotes && cleanNotes.includes('[الواجب]:')) {
        const parts = cleanNotes.split('[الواجب]:');
        cleanNotes = parts[0].trim();
        homework = parts[1].trim();
      }
      const gradeMatch = (s.notes || '').match(/\[درجة التقييم الأكاديمي\]:\s*([^\n\r]+)/);
      const evaluationGrade = gradeMatch ? gradeMatch[1].trim() : null;
      const rescheduleMatch = (s.notes || '').match(/\[تم قبول التأجيل وتحديد موعد جديد من المعلم\]:\s*([^\n\r]+)/);
      const rescheduledInfo = rescheduleMatch ? rescheduleMatch[1].trim() : null;

      return {
        ...s,
        sessionType: 'PRIVATE',
        attendanceStatus: s.status === 'CONFIRMED' ? 'PRESENT' : (s.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED'),
        topic: s.topic || null,
        homework: homework || null,
        evaluationGrade: evaluationGrade || null,
        rescheduledInfo: rescheduledInfo || null,
        notes: cleanNotes || s.notes
      };
    });

    // Query group sessions for this student (attendance records + scheduled group sessions)
    let groupSessions = [];
    try {
      groupSessions = await prisma.$queryRawUnsafe(`
        SELECT 
          s.id,
          s."groupId",
          s."sessionDate" AS "scheduledAt",
          s."status" AS "sessionStatus",
          s.topic,
          s.homework,
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
      plannedDuration: 90,
      status: gs.sessionStatus,
      attendanceStatus: gs.attendanceStatus || (gs.sessionStatus === 'SCHEDULED' ? 'SCHEDULED' : 'PENDING'),
      teacher: gs.teacherName ? { name: gs.teacherName } : null,
      subject: gs.subjectName ? { name: gs.subjectName } : null,
      topic: gs.topic || null,
      homework: gs.homework || null,
      notes: gs.attendanceNotes || null
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
          g."feeAmount",
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

// Get academy active teachers for parent booking & info
router.get('/teachers', authenticateParentToken, async (req, res) => {
  try {
    const companyId = req.parent.companyId;
    const teachers = await getSharedPrismaClient().educationTeacher.findMany({
      where: { companyId, isActive: true },
      select: {
        id: true,
        name: true,
        phone: true,
        bio: true,
        qualifications: true,
        avatarUrl: true
      },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: teachers });
  } catch (error) {
    console.error('[ParentPortal] Teachers error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب قائمة المعلمين' });
  }
});

// Get teacher available slots for booking
router.get('/teachers/:teacherId/availability', authenticateParentToken, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const companyId = req.parent.companyId;
    const prisma = getSharedPrismaClient();

    const slots = await prisma.educationTeacherAvailability.findMany({
      where: { teacherId, companyId, isAvailable: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });

    res.json({ success: true, data: slots });
  } catch (error) {
    console.error('[ParentPortal] Teacher availability error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في جلب مواعيد المعلم' });
  }
});

// Self-service session booking by parent from their remaining hours
router.post('/sessions/book', authenticateParentToken, async (req, res) => {
  try {
    const parentId = req.parent.id;
    const companyId = req.parent.companyId;
    const { studentId, enrollmentId, scheduledAt, plannedDuration, notes } = req.body;
    const prisma = getSharedPrismaClient();

    const student = await prisma.educationStudent.findFirst({
      where: { id: studentId, customerId: parentId, companyId }
    });
    if (!student) return res.status(404).json({ success: false, message: 'الطالب غير موجود' });

    const enrollment = await prisma.educationEnrollment.findFirst({
      where: { id: enrollmentId, studentId, companyId, isActive: true },
      include: {
        package: { select: { id: true, subjectId: true, sessionDuration: true } },
        teacher: { select: { id: true, name: true } }
      }
    });

    if (!enrollment) {
      // W3: تفريق واضح بين «لا اشتراك» و«اشتراك غير نشط/منتهي»
      const activeCount = await prisma.educationEnrollment.count({
        where: { studentId, companyId, isActive: true },
      });
      const code = activeCount > 0 ? 'ENROLLMENT_NOT_ACTIVE' : 'NO_ACTIVE_ENROLLMENT';
      const message = activeCount > 0
        ? 'الاشتراك المحدد غير نشط أو منتهي — اختر اشتراكًا آخر'
        : 'لا يوجد اشتراك نشط لهذا الطالب — اشترك في باقة أولًا أو تواصل مع المركز';
      return res.status(404).json({ success: false, code, message });
    }

    const duration = Number(plannedDuration) || enrollment.package?.sessionDuration || 60;
    const hours = duration / 60;

    if (hours > enrollment.remainingHours) {
      return res.status(400).json({
        success: false,
        message: `رصيد الساعات المتبقي (${enrollment.remainingHours} ساعة) غير كافٍ لحجز ${duration} دقيقة`
      });
    }

    let targetTeacherId = enrollment.teacherId || req.body.teacherId;
    if (!targetTeacherId) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم تعيين معلم للباقة بعد، يرجى اختيار معلم للحصة'
      });
    }

    if (!enrollment.teacherId && targetTeacherId) {
      await prisma.educationEnrollment.update({
        where: { id: enrollment.id },
        data: { teacherId: targetTeacherId }
      }).catch(e => console.warn('[ParentBookAssignTeacher]', e.message));
    }

    // W5: احترام ساعات توفر المدرس عند الحجز من بوابة ولي الأمر
    const bookStart = new Date(scheduledAt);
    if (Number.isNaN(bookStart.getTime())) {
      return res.status(400).json({ success: false, message: 'موعد الحصة غير صحيح' });
    }
    const bookEnd = new Date(bookStart.getTime() + duration * 60000);
    const availability = await require('../utils/educationAvailability').checkTeacherAvailability(
      prisma, companyId, targetTeacherId, bookStart, bookEnd,
    );
    if (!availability.ok) {
      return res.status(409).json({ success: false, message: availability.message, code: availability.code });
    }

    const newSession = await prisma.educationSession.create({
      data: {
        companyId,
        enrollmentId: enrollment.id,
        teacherId: targetTeacherId,
        studentId: student.id,
        subjectId: enrollment.package.subjectId,
        scheduledAt: new Date(scheduledAt),
        plannedDuration: duration,
        status: 'SCHEDULED',
        sessionType: 'PRIVATE',
        notes: notes ? `[حجز ذاتي من ولي الأمر]: ${notes}` : '[حجز ذاتي من ولي الأمر]'
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
        teacher: { select: { name: true } },
        subject: { select: { name: true } }
      }
    });

    try {
      const educationNotificationService = require('../services/educationNotificationService');
      educationNotificationService.notifySessionScheduled(companyId, newSession).catch(e =>
        console.warn('[ParentBookNotify]', e.message)
      );
    } catch (ne) {}

    res.json({
      success: true,
      message: 'تم حجز الحصة بنجاح وإدراجها في الجدول',
      data: newSession
    });
  } catch (error) {
    console.error('[ParentPortal] Book session error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في حجز الحصة' });
  }
});

// Parent requests rescheduling / excuse for a scheduled session
router.post('/sessions/:id/request-reschedule', authenticateParentToken, async (req, res) => {
  try {
    const parentId = req.parent.id;
    const companyId = req.parent.companyId;
    const { id: sessionId } = req.params;
    const { reason, requestedDate } = req.body;
    const prisma = getSharedPrismaClient();

    const session = await prisma.educationSession.findFirst({
      where: {
        id: sessionId,
        companyId,
        student: { customerId: parentId }
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
        teacher: { select: { id: true, name: true } },
        subject: { select: { name: true } }
      }
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'الحصة غير موجودة' });
    }

    if (session.status === 'CONFIRMED' || session.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن طلب تأجيل حصة تم تأكيدها أو انتهت بالفعل'
      });
    }

    const rescheduleNote = `[طلب اعتذار/تأجيل من ولي الأمر]: ${reason || 'غير محدد'}${requestedDate ? ` | الموعد المقترح: ${requestedDate}` : ''}`;
    const updatedNotes = session.notes ? `${session.notes}\n${rescheduleNote}` : rescheduleNote;

    await prisma.educationSession.update({
      where: { id: sessionId },
      data: { notes: updatedNotes }
    });

    res.json({
      success: true,
      message: 'تم إرسال طلب الاعتذار والتأجيل بنجاح، سيتم مراجعته والتواصل معكم لتحديد الموعد البديل'
    });
  } catch (error) {
    console.error('[ParentPortal] Reschedule request error:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في تقديم طلب التأجيل' });
  }
});

module.exports = router;

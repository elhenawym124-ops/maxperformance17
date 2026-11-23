const { getSharedPrismaClient } = require('../services/sharedDatabase');
const { logEducationEvent } = require('../services/educationAuditService');

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

const getCompanyId = (req) => req.user?.effectiveCompanyId || req.user?.companyId || null;

const gradeFor = (score, maxScore) => {
  const total = Number(maxScore) || 0;
  if (score === null || score === undefined || total <= 0) return null;
  const percent = (Number(score) / total) * 100;
  if (percent >= 90) return 'A';
  if (percent >= 80) return 'B';
  if (percent >= 70) return 'C';
  if (percent >= 60) return 'D';
  return 'F';
};

const listExams = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const where = { companyId };
    if (req.query.status) where.status = String(req.query.status).toUpperCase();
    if (req.query.groupId) where.groupId = req.query.groupId;
    if (req.query.packageId) where.packageId = req.query.packageId;
    if (req.query.teacherId) where.teacherId = req.query.teacherId;
    if (req.query.subjectId) where.subjectId = req.query.subjectId;

    const [items, total] = await Promise.all([
      prisma.educationExam.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.educationExam.count({ where }),
    ]);

    const counts = items.length
      ? await prisma.educationExamResult.groupBy({
          by: ['examId'],
          where: { companyId, examId: { in: items.map((exam) => exam.id) } },
          _count: true,
        })
      : [];
    const countMap = new Map(counts.map((row) => [row.examId, row._count]));

    res.json({
      success: true,
      data: items.map((exam) => ({ ...exam, resultsCount: countMap.get(exam.id) || 0 })),
      pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error('Error listing exams:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب الامتحانات' });
  }
};

const createExam = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const {
      title, type = 'QUIZ', maxScore = 100, weight, scheduledAt, notes,
      groupId, packageId, teacherId, subjectId, status = 'DRAFT',
    } = req.body || {};

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, error: 'عنوان الامتحان مطلوب' });
    }
    const max = Number(maxScore);
    if (!Number.isFinite(max) || max <= 0) {
      return res.status(400).json({ success: false, error: 'الدرجة العظمى غير صحيحة' });
    }

    const prisma = getSharedPrismaClient();
    if (groupId) {
      const group = await prisma.$queryRawUnsafe(
        `SELECT id FROM "education_groups" WHERE id = $1 AND "companyId" = $2 LIMIT 1`,
        groupId, companyId
      ).catch(() => []);
      if (!Array.isArray(group) || group.length === 0) {
        return res.status(400).json({ success: false, error: 'المجموعة غير صالحة' });
      }
    }
    if (packageId) {
      const pkg = await prisma.educationPackage.findFirst({ where: { id: packageId, companyId }, select: { id: true } });
      if (!pkg) return res.status(400).json({ success: false, error: 'الباقة غير صالحة' });
    }
    if (teacherId) {
      const teacher = await prisma.educationTeacher.findFirst({ where: { id: teacherId, companyId }, select: { id: true } });
      if (!teacher) return res.status(400).json({ success: false, error: 'المدرّس غير صالح' });
    }

    const exam = await prisma.educationExam.create({
      data: {
        companyId,
        title: String(title).trim(),
        type: String(type || 'QUIZ').toUpperCase(),
        maxScore: max,
        weight: weight === undefined || weight === null || weight === '' ? null : Number(weight),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        notes: notes ? String(notes).slice(0, 1000) : null,
        groupId: groupId || null,
        packageId: packageId || null,
        teacherId: teacherId || null,
        subjectId: subjectId || null,
        status: ['DRAFT', 'PUBLISHED', 'CLOSED'].includes(String(status).toUpperCase()) ? String(status).toUpperCase() : 'DRAFT',
        createdById: req.user?.id || null,
      },
    });

    logEducationEvent({
      companyId,
      action: 'CREATE_EXAM',
      entityType: 'EXAM',
      entityId: exam.id,
      entityName: exam.title,
      description: `تم إنشاء امتحان «${exam.title}» بدرجة عظمى ${exam.maxScore}`,
      details: { type: exam.type, groupId: exam.groupId, packageId: exam.packageId },
      severity: 'LOW',
      req,
    }).catch(() => {});

    res.json({ success: true, data: exam });
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في إنشاء الامتحان' });
  }
};

const resolveCandidates = async (prisma, companyId, exam) => {
  if (exam.groupId) {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT s.id, s."firstName", s."lastName", s.code, s.phone
      FROM "education_group_members" m
      JOIN "education_students" s ON s.id = m."studentId" AND s."companyId" = m."companyId"
      WHERE m."groupId" = $1 AND m."companyId" = $2 AND m."status" = 'ACTIVE'
      ORDER BY s."firstName" ASC
      LIMIT 500
    `, exam.groupId, companyId).catch(() => []);
    return rows || [];
  }
  if (exam.packageId) {
    const enrollments = await prisma.educationEnrollment.findMany({
      where: { companyId, packageId: exam.packageId, isActive: true },
      select: { studentId: true, student: { select: { id: true, firstName: true, lastName: true, code: true, phone: true } } },
      take: 500,
    });
    const map = new Map();
    for (const enrollment of enrollments) {
      if (enrollment.student) map.set(enrollment.student.id, enrollment.student);
    }
    return [...map.values()];
  }
  const students = await prisma.educationStudent.findMany({
    where: { companyId, isActive: true },
    select: { id: true, firstName: true, lastName: true, code: true, phone: true },
    take: 500,
  });
  return students;
};

const getExam = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const exam = await prisma.educationExam.findFirst({ where: { id: req.params.id, companyId } });
    if (!exam) return res.status(404).json({ success: false, error: 'الامتحان غير موجود' });

    const [candidates, results, certificates] = await Promise.all([
      resolveCandidates(prisma, companyId, exam),
      prisma.educationExamResult.findMany({ where: { companyId, examId: exam.id } }),
      prisma.educationCertificate.findMany({ where: { companyId, examId: exam.id } }),
    ]);
    const resultMap = new Map(results.map((result) => [result.studentId, result]));
    const certificateMap = new Map(certificates.map((certificate) => [certificate.studentId, certificate]));

    res.json({
      success: true,
      data: {
        exam,
        students: candidates.map((student) => {
          const result = resultMap.get(student.id);
          return {
            studentId: student.id,
            studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
            code: student.code || null,
            phone: student.phone || null,
            score: result?.score ?? null,
            maxScore: result?.maxScore ?? exam.maxScore,
            grade: result?.grade || null,
            notes: result?.notes || null,
            resultId: result?.id || null,
            certificateId: certificateMap.get(student.id)?.id || null,
            certificateSerial: certificateMap.get(student.id)?.serialNumber || null,
          };
        }),
      },
    });
  } catch (error) {
    console.error('Error loading exam:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب الامتحان' });
  }
};

const saveResults = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const exam = await prisma.educationExam.findFirst({ where: { id: req.params.id, companyId } });
    if (!exam) return res.status(404).json({ success: false, error: 'الامتحان غير موجود' });
    if (exam.status === 'CLOSED') {
      return res.status(409).json({ success: false, error: 'الامتحان مغلق — لا يمكن تعديل الدرجات' });
    }

    const rows = Array.isArray(req.body?.results) ? req.body.results : [];
    if (rows.length === 0) return res.status(400).json({ success: false, error: 'لا توجد درجات للحفظ' });

    const saved = [];
    for (const row of rows) {
      if (!row?.studentId) continue;
      const student = await prisma.educationStudent.findFirst({
        where: { id: row.studentId, companyId },
        select: { id: true, customerId: true, firstName: true, lastName: true },
      });
      if (!student) continue;

      const hasScore = row.score !== undefined && row.score !== null && row.score !== '';
      const score = hasScore ? Number(row.score) : null;
      if (hasScore && (!Number.isFinite(score) || score < 0 || score > Number(exam.maxScore))) {
        return res.status(400).json({ success: false, error: `درجة الطالب ${student.firstName} خارج النطاق` });
      }

      const data = {
        companyId,
        examId: exam.id,
        studentId: student.id,
        enrollmentId: row.enrollmentId || null,
        score,
        maxScore: Number(exam.maxScore),
        grade: gradeFor(score, exam.maxScore),
        notes: row.notes ? String(row.notes).slice(0, 500) : null,
        gradedById: req.user?.id || null,
        gradedAt: new Date(),
      };

      const existing = await prisma.educationExamResult.findFirst({
        where: { examId: exam.id, studentId: student.id },
        select: { id: true },
      });
      const result = existing
        ? await prisma.educationExamResult.update({ where: { id: existing.id }, data })
        : await prisma.educationExamResult.create({ data });
      saved.push(result);
    }

    logEducationEvent({
      companyId,
      action: 'SAVE_EXAM_RESULTS',
      entityType: 'EXAM',
      entityId: exam.id,
      entityName: exam.title,
      description: `تم حفظ درجات ${saved.length} طالب في امتحان «${exam.title}»`,
      details: { examId: exam.id, count: saved.length },
      severity: 'LOW',
      req,
    }).catch(() => {});

    res.json({ success: true, data: saved });
  } catch (error) {
    console.error('Error saving exam results:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في حفظ الدرجات' });
  }
};

const publishExam = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const exam = await prisma.educationExam.findFirst({ where: { id: req.params.id, companyId } });
    if (!exam) return res.status(404).json({ success: false, error: 'الامتحان غير موجود' });

    const now = new Date();
    const updated = await prisma.educationExam.update({ where: { id: exam.id }, data: { status: 'PUBLISHED' } });
    await prisma.educationExamResult.updateMany({
      where: { companyId, examId: exam.id, score: { not: null } },
      data: { publishedAt: now },
    });

    const results = await prisma.educationExamResult.findMany({
      where: { companyId, examId: exam.id, score: { not: null } },
    }).catch(() => []);
    const studentIds = results.map((result) => result.studentId);
    const students = studentIds.length
      ? await prisma.educationStudent.findMany({
          where: { companyId, id: { in: studentIds } },
          select: {
            id: true, firstName: true, lastName: true, customerId: true,
            customer: { select: { firstName: true, lastName: true, phone: true } },
          },
        })
      : [];
    const studentMap = new Map(students.map((student) => [student.id, student]));

    try {
      const notificationService = require('../services/educationNotificationService');
      for (const result of results || []) {
        const student = studentMap.get(result.studentId);
        if (!student?.customer?.phone) continue;
        notificationService.notifyExamResult({
          companyId,
          customerId: student.customerId || null,
          parentName: `${student.customer.firstName || ''} ${student.customer.lastName || ''}`.trim(),
          parentPhone: student.customer.phone,
          studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          examTitle: exam.title,
          score: result.score,
          maxScore: result.maxScore,
          grade: result.grade,
        }).catch(() => {});
      }
    } catch (_) {}

    logEducationEvent({
      companyId,
      action: 'PUBLISH_EXAM',
      entityType: 'EXAM',
      entityId: updated.id,
      entityName: updated.title,
      description: `تم نشر امتحان «${updated.title}» و${results.length} نتيجة`,
      details: { examId: updated.id, results: results.length },
      severity: 'MEDIUM',
      req,
    }).catch(() => {});

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error publishing exam:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في نشر الامتحان' });
  }
};

const closeExam = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });
    const prisma = getSharedPrismaClient();
    const exam = await prisma.educationExam.findFirst({ where: { id: req.params.id, companyId } });
    if (!exam) return res.status(404).json({ success: false, error: 'الامتحان غير موجود' });
    const updated = await prisma.educationExam.update({ where: { id: exam.id }, data: { status: 'CLOSED' } });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error closing exam:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في إغلاق الامتحان' });
  }
};

const deleteExam = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });
    const prisma = getSharedPrismaClient();
    const exam = await prisma.educationExam.findFirst({ where: { id: req.params.id, companyId } });
    if (!exam) return res.status(404).json({ success: false, error: 'الامتحان غير موجود' });

    await prisma.educationExamResult.deleteMany({ where: { companyId, examId: exam.id } });
    await prisma.educationExam.delete({ where: { id: exam.id } });

    logEducationEvent({
      companyId,
      action: 'DELETE_EXAM',
      entityType: 'EXAM',
      entityId: exam.id,
      entityName: exam.title,
      description: `تم حذف امتحان «${exam.title}»`,
      severity: 'MEDIUM',
      req,
    }).catch(() => {});

    res.json({ success: true, message: 'تم حذف الامتحان' });
  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في حذف الامتحان' });
  }
};

module.exports = {
  listExams,
  createExam,
  getExam,
  saveResults,
  publishExam,
  closeExam,
  deleteExam,
  gradeFor,
};

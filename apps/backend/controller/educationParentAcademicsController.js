const { getSharedPrismaClient } = require('../services/sharedDatabase');

const resolveParentStudent = async (prisma, companyId, parentId, studentId) => {
  const student = await prisma.educationStudent.findFirst({
    where: { id: studentId, customerId: parentId, companyId },
    select: { id: true, firstName: true, lastName: true, code: true },
  });
  return student || null;
};

const getChildExams = async (req, res) => {
  try {
    const parentId = req.parent?.id;
    const companyId = req.parent?.companyId;
    if (!parentId || !companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const student = await resolveParentStudent(prisma, companyId, parentId, req.params.studentId);
    if (!student) return res.status(404).json({ success: false, error: 'الطالب غير موجود' });

    const results = await prisma.educationExamResult.findMany({
      where: { companyId, studentId: student.id, publishedAt: { not: null } },
      orderBy: { publishedAt: 'desc' },
      take: 200,
    });
    if (results.length === 0) return res.json({ success: true, data: [] });

    const exams = await prisma.educationExam.findMany({
      where: { companyId, id: { in: [...new Set(results.map((result) => result.examId))] } },
      select: { id: true, title: true, type: true, maxScore: true, scheduledAt: true, createdAt: true },
    });
    const examMap = new Map(exams.map((exam) => [exam.id, exam]));

    res.json({
      success: true,
      data: results.map((result) => ({
        id: result.id,
        examId: result.examId,
        examTitle: examMap.get(result.examId)?.title || 'امتحان',
        examType: examMap.get(result.examId)?.type || 'QUIZ',
        score: result.score,
        maxScore: result.maxScore,
        grade: result.grade,
        notes: result.notes,
        publishedAt: result.publishedAt,
        scheduledAt: examMap.get(result.examId)?.scheduledAt || null,
      })),
    });
  } catch (error) {
    console.error('[ParentPortal] Child exams error:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب الدرجات' });
  }
};

const getChildCertificates = async (req, res) => {
  try {
    const parentId = req.parent?.id;
    const companyId = req.parent?.companyId;
    if (!parentId || !companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const student = await resolveParentStudent(prisma, companyId, parentId, req.params.studentId);
    if (!student) return res.status(404).json({ success: false, error: 'الطالب غير موجود' });

    const certificates = await prisma.educationCertificate.findMany({
      where: { companyId, studentId: student.id },
      orderBy: { issuedAt: 'desc' },
      take: 200,
    });

    res.json({ success: true, data: certificates });
  } catch (error) {
    console.error('[ParentPortal] Child certificates error:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب الشهادات' });
  }
};

const downloadCertificatePdf = async (req, res) => {
  try {
    const parentId = req.parent?.id;
    const companyId = req.parent?.companyId;
    if (!parentId || !companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const students = await prisma.educationStudent.findMany({
      where: { companyId, customerId: parentId },
      select: { id: true },
    });
    const studentIds = students.map((student) => student.id);
    if (studentIds.length === 0) return res.status(404).json({ success: false, error: 'الشهادة غير موجودة' });

    const service = require('../services/educationCertificatePdfService');
    const result = await service.getOrCreateCertificatePdf(prisma, {
      companyId,
      certificateId: req.params.id,
      studentIds,
    });
    if (!result) return res.status(404).json({ success: false, error: 'الشهادة غير موجودة' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${result.certificate.serialNumber || result.certificate.id}.pdf"`);
    res.send(result.buffer);
  } catch (error) {
    console.error('[ParentPortal] Certificate PDF error:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في إنشاء ملف الشهادة' });
  }
};

module.exports = { getChildExams, getChildCertificates, downloadCertificatePdf };

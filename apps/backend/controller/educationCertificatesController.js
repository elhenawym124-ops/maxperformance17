const { getSharedPrismaClient } = require('../services/sharedDatabase');
const { logEducationEvent } = require('../services/educationAuditService');

const getCompanyId = (req) => req.user?.effectiveCompanyId || req.user?.companyId || null;

const nextSerial = async (prisma, companyId) => {
  const now = new Date();
  const prefix = `CERT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`;
  const last = await prisma.educationCertificate.findFirst({
    where: { companyId, serialNumber: { startsWith: prefix } },
    orderBy: { serialNumber: 'desc' },
    select: { serialNumber: true },
  });
  let seq = 1;
  if (last?.serialNumber) {
    const parsed = parseInt(String(last.serialNumber).split('-').pop(), 10);
    if (!Number.isNaN(parsed)) seq = parsed + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
};

const listCertificates = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const where = { companyId };
    if (req.query.studentId) where.studentId = req.query.studentId;
    if (req.query.type) where.type = String(req.query.type).toUpperCase();
    if (req.query.examId) where.examId = req.query.examId;

    const [items, total] = await Promise.all([
      prisma.educationCertificate.findMany({
        where, orderBy: { issuedAt: 'desc' }, skip: (page - 1) * limit, take: limit,
      }),
      prisma.educationCertificate.count({ where }),
    ]);

    const studentIds = [...new Set(items.map((item) => item.studentId))];
    const students = studentIds.length
      ? await prisma.educationStudent.findMany({
          where: { companyId, id: { in: studentIds } },
          select: { id: true, firstName: true, lastName: true, code: true },
        })
      : [];
    const studentMap = new Map(students.map((student) => [student.id, student]));

    res.json({
      success: true,
      data: items.map((item) => ({
        ...item,
        studentName: studentMap.get(item.studentId)
          ? `${studentMap.get(item.studentId).firstName || ''} ${studentMap.get(item.studentId).lastName || ''}`.trim()
          : null,
        studentCode: studentMap.get(item.studentId)?.code || null,
      })),
      pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error('Error listing certificates:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب الشهادات' });
  }
};

const issueCertificate = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { studentId, examId, enrollmentId, type = 'ACHIEVEMENT', level, notes } = req.body || {};
    if (!studentId) return res.status(400).json({ success: false, error: 'الطالب مطلوب' });

    const prisma = getSharedPrismaClient();
    const student = await prisma.educationStudent.findFirst({
      where: { id: studentId, companyId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!student) return res.status(404).json({ success: false, error: 'الطالب غير موجود' });

    let exam = null;
    if (examId) {
      exam = await prisma.educationExam.findFirst({ where: { id: examId, companyId } });
      if (!exam) return res.status(400).json({ success: false, error: 'الامتحان غير موجود' });
    }

    let enrollment = null;
    if (enrollmentId) {
      enrollment = await prisma.educationEnrollment.findFirst({
        where: { id: enrollmentId, companyId },
        include: { package: { select: { name: true } } },
      });
      if (!enrollment) return res.status(400).json({ success: false, error: 'التسجيل غير موجود' });
    }

    const normalizedType = ['LEVEL', 'COURSE', 'ACHIEVEMENT'].includes(String(type).toUpperCase())
      ? String(type).toUpperCase()
      : 'ACHIEVEMENT';
    const title = req.body?.title
      ? String(req.body.title).slice(0, 200)
      : (exam?.title || enrollment?.package?.name || 'شهادة إتمام');

    const serialNumber = await nextSerial(prisma, companyId);

    const certificate = await prisma.educationCertificate.create({
      data: {
        companyId,
        studentId: student.id,
        enrollmentId: enrollment?.id || null,
        examId: exam?.id || null,
        type: normalizedType,
        title,
        level: level ? String(level).slice(0, 100) : null,
        serialNumber,
        issuedById: req.user?.id || null,
        notes: notes ? String(notes).slice(0, 500) : null,
      },
    });

    logEducationEvent({
      companyId,
      action: 'ISSUE_CERTIFICATE',
      entityType: 'EXAM',
      entityId: certificate.id,
      entityName: certificate.serialNumber,
      description: `تم إصدار شهادة «${certificate.title}» للطالب ${student.firstName} ${student.lastName || ''}`.trim(),
      details: { studentId, examId: exam?.id || null, type: normalizedType, serialNumber },
      severity: 'LOW',
      req,
    }).catch(() => {});

    res.json({ success: true, data: certificate });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في إصدار الشهادة' });
  }
};

const deleteCertificate = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    const certificate = await prisma.educationCertificate.findFirst({ where: { id: req.params.id, companyId } });
    if (!certificate) return res.status(404).json({ success: false, error: 'الشهادة غير موجودة' });

    await prisma.educationCertificate.delete({ where: { id: certificate.id } });
    res.json({ success: true, message: 'تم حذف الشهادة' });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في حذف الشهادة' });
  }
};

const downloadCertificatePdf = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const service = require('../services/educationCertificatePdfService');
    const result = await service.getOrCreateCertificatePdf(getSharedPrismaClient(), {
      companyId,
      certificateId: req.params.id,
      force: req.query.regenerate === '1',
    });
    if (!result) return res.status(404).json({ success: false, error: 'الشهادة غير موجودة' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${result.certificate.serialNumber || result.certificate.id}.pdf"`);
    res.send(result.buffer);
  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في إنشاء ملف الشهادة' });
  }
};

module.exports = { listCertificates, issueCertificate, deleteCertificate, downloadCertificatePdf };

/**
 * Education certificates as archived PDFs (landscape A4).
 * Uses PDFKit + NotoSansArabic, same as payment receipts.
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { shapeArabic } = require('../utils/arabicShaping');

const FONT = path.join(__dirname, '..', 'fonts', 'NotoSansArabic-Regular.ttf');

const receiptsRoot = () =>
  process.env.EDUCATION_CERTIFICATES_DIR
  || path.join(process.cwd(), 'uploads', 'education-certificates');

const safeFileName = (value) => String(value || 'certificate').replace(/[^A-Za-z0-9._-]/g, '_');

const formatDate = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const TYPE_LABELS = {
  LEVEL: 'إتمام مستوى',
  COURSE: 'إتمام برنامج',
  ACHIEVEMENT: 'شهادة تقدير',
};

const buildCertificatePdf = (context) => new Promise((resolve, reject) => {
  const { certificate, company, student, exam } = context;
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 36, bottom: 36, left: 48, right: 48 },
    info: { Title: certificate.title, Author: company?.name || 'MaxP' },
  });

  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  doc.registerFont('Noto', FONT);
  doc.font('Noto');

  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const left = 48;
  const width = pageW - 96;

  doc.roundedRect(24, 24, pageW - 48, pageH - 48, 10).lineWidth(2).strokeColor('#111111').stroke();
  doc.roundedRect(32, 32, pageW - 64, pageH - 64, 8).lineWidth(0.6).strokeColor('#999999').stroke();

  doc.fontSize(18).fillColor('#111111')
    .text(shapeArabic(company?.name || 'المركز التعليمي'), left, 58, { width, align: 'center' });
  doc.fontSize(9).fillColor('#555555')
    .text(shapeArabic(company?.phone || ''), left, 82, { width, align: 'center' });

  doc.fontSize(24).fillColor('#111111')
    .text(shapeArabic(TYPE_LABELS[certificate.type] || 'شهادة'), left, 120, { width, align: 'center' });

  doc.fontSize(11).fillColor('#444444')
    .text(shapeArabic('تشهد إدارة المركز بأن'), left, 166, { width, align: 'center' });

  doc.fontSize(26).fillColor('#111111')
    .text(shapeArabic(student?.name || '—'), left, 192, { width, align: 'center' });

  doc.fontSize(11).fillColor('#444444')
    .text(shapeArabic(certificate.title || ''), left, 236, { width, align: 'center' });

  const detailParts = [];
  if (certificate.level) detailParts.push(`المستوى: ${certificate.level}`);
  if (exam?.maxScore) detailParts.push(`التقدير: ${exam.grade || ''} (${exam.score}/${exam.maxScore})`);
  if (detailParts.length) {
    doc.fontSize(10).fillColor('#333333')
      .text(shapeArabic(detailParts.join('   •   ')), left, 262, { width, align: 'center' });
  }

  doc.fontSize(9).fillColor('#555555')
    .text(shapeArabic(`رقم الشهادة: ${certificate.serialNumber}   |   تاريخ الإصدار: ${formatDate(certificate.issuedAt)}`), left, 300, {
      width,
      align: 'center',
    });

  const footerY = pageH - 110;
  doc.fontSize(9).fillColor('#333333')
    .text(shapeArabic('توقيع المدير'), left + 20, footerY, { width: width / 2 - 20, align: 'center' })
    .text(shapeArabic('ختم المركز'), left + width / 2, footerY, { width: width / 2 - 20, align: 'center' });
  doc.moveTo(left + 60, footerY + 26).lineTo(left + width / 2 - 40, footerY + 26).lineWidth(0.6).strokeColor('#777777').stroke();
  doc.moveTo(left + width / 2 + 40, footerY + 26).lineTo(left + width - 60, footerY + 26).stroke();

  doc.end();
});

async function loadCertificateContext(prisma, companyId, certificateId, { studentIds = null } = {}) {
  const certificate = await prisma.educationCertificate.findFirst({
    where: {
      id: certificateId,
      companyId,
      ...(studentIds ? { studentId: { in: studentIds } } : {}),
    },
  });
  if (!certificate) return null;

  const [company, student, examResult] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { name: true, phone: true, address: true } }),
    prisma.educationStudent.findFirst({
      where: { id: certificate.studentId, companyId },
      select: { id: true, code: true, firstName: true, lastName: true },
    }),
    certificate.examId
      ? prisma.educationExamResult.findFirst({
          where: { companyId, examId: certificate.examId, studentId: certificate.studentId },
          select: { score: true, maxScore: true, grade: true },
        })
      : null,
  ]);

  return {
    certificate,
    company,
    student: student
      ? { ...student, name: `${student.firstName || ''} ${student.lastName || ''}`.trim() }
      : null,
    exam: examResult || null,
  };
}

async function getOrCreateCertificatePdf(prisma, { companyId, certificateId, studentIds = null, force = false }) {
  const context = await loadCertificateContext(prisma, companyId, certificateId, { studentIds });
  if (!context) return null;

  const dir = path.join(receiptsRoot(), safeFileName(companyId));
  const fileName = `${safeFileName(context.certificate.serialNumber || context.certificate.id)}.pdf`;
  const absolutePath = path.join(dir, fileName);
  const relativePath = path.relative(process.cwd(), absolutePath).replace(/\\/g, '/');

  if (!force && fs.existsSync(absolutePath)) {
    return { buffer: fs.readFileSync(absolutePath), path: absolutePath, relativePath, certificate: context.certificate, cached: true };
  }

  const buffer = await buildCertificatePdf(context);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(absolutePath, buffer);

  await prisma.educationCertificate.update({
    where: { id: context.certificate.id },
    data: { pdfPath: relativePath, pdfGeneratedAt: new Date() },
  }).catch(() => {});

  return { buffer, path: absolutePath, relativePath, certificate: context.certificate, cached: false };
}

module.exports = {
  buildCertificatePdf,
  getOrCreateCertificatePdf,
  certificatesRoot: receiptsRoot,
  TYPE_LABELS,
};

/**
 * Education payment receipts as archived PDF files.
 *
 * Uses PDFKit + NotoSansArabic (same approach as lab/radiology PDFs) so the
 * archive works on servers without a headless browser.
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { shapeArabic } = require('../utils/arabicShaping');

const FONT = path.join(__dirname, '..', 'fonts', 'NotoSansArabic-Regular.ttf');

const money = (value) =>
  (Math.round((Number(value) || 0) * 100) / 100).toLocaleString('en-EG', { maximumFractionDigits: 2 });

const METHOD_LABELS = {
  CASH: 'نقدي',
  TRANSFER: 'تحويل بنكي',
  WALLET: 'محفظة',
  CARD: 'بطاقة',
  INSTAPAY: 'إنستاپاي',
  OTHER: 'أخرى',
};

const statusLabel = (status) => {
  if (status === 'REVERSED') return 'ملغاة';
  if (status === 'PARTIALLY_REVERSED') return 'ملغاة جزئياً';
  return 'محصلة';
};

const receiptsRoot = () =>
  process.env.EDUCATION_RECEIPTS_DIR
  || path.join(process.cwd(), 'uploads', 'education-receipts');

const safeFileName = (value) => String(value || 'receipt').replace(/[^A-Za-z0-9._-]/g, '_');

const buildReceiptPdf = (context) => new Promise((resolve, reject) => {
  const { payment, company, student, package: pkg } = context;
  const doc = new PDFDocument({
    size: 'A5',
    margins: { top: 30, bottom: 30, left: 30, right: 30 },
    info: { Title: `إيصال ${payment.paymentNumber || ''}`, Author: company?.name || 'MaxP' },
  });

  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  doc.registerFont('Noto', FONT);
  doc.font('Noto');

  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const left = 30;
  const contentW = pageW - 60;
  const right = left + contentW;

  doc.fontSize(15).fillColor('#111111')
    .text(shapeArabic(company?.name || 'المركز التعليمي'), left, 30, { width: contentW, align: 'center' });

  let headerY = 52;
  doc.fontSize(8).fillColor('#555555');
  if (company?.phone) {
    doc.text(shapeArabic(company.phone), left, headerY, { width: contentW, align: 'center' });
    headerY += 11;
  }
  if (company?.address) {
    doc.text(shapeArabic(company.address), left, headerY, { width: contentW, align: 'center' });
    headerY += 11;
  }

  doc.fontSize(11).fillColor('#111111')
    .text(shapeArabic('إيصال تحصيل رسوم'), left, headerY + 2, { width: contentW, align: 'center' });

  const lineY = headerY + 22;
  doc.moveTo(left, lineY).lineTo(right, lineY).lineWidth(0.8).strokeColor('#111111').stroke();

  let y = lineY + 12;
  const row = (label, value) => {
    const half = contentW / 2;
    doc.fontSize(8.5).fillColor('#666666')
      .text(shapeArabic(label), left + half, y, { width: half, align: 'right' });
    doc.fillColor('#111111')
      .text(shapeArabic(value ?? '—'), left, y, { width: half - 10, align: 'left' });
    y += 16;
  };

  const paidAt = payment.paidAt ? new Date(payment.paidAt).toLocaleString('ar-EG') : '';
  const studentName = payment.studentName
    || `${student?.firstName || ''} ${student?.lastName || ''}`.trim()
    || '—';

  row('رقم الإيصال', payment.receiptNumber || payment.paymentNumber);
  row('التاريخ', paidAt);
  row('الطالب', studentName);
  row('كود الطالب', student?.code || '—');
  if (pkg?.name) row('الباقة', `${pkg.name}${pkg.hoursCount ? ` — ${pkg.hoursCount} ساعة` : ''}`);
  row('طريقة الدفع', METHOD_LABELS[payment.method] || payment.method || '—');
  row('الحالة', statusLabel(payment.status));
  row('الكاشير', payment.cashierName || '—');

  y += 6;
  doc.roundedRect(left, y, contentW, 40, 6).fillAndStroke('#f3f4f6', '#dddddd');
  doc.fontSize(9).fillColor('#333333')
    .text(shapeArabic('المبلغ المحصل'), left + contentW / 2, y + 8, { width: contentW / 2 - 10, align: 'right' });
  doc.fontSize(16).fillColor('#111111')
    .text(shapeArabic(`${money(payment.amount)} ج.م`), left + 10, y + 9, { width: contentW / 2, align: 'left' });
  y += 48;

  const reversed = Number(payment.reversedAmount) || 0;
  if (reversed > 0) {
    const net = Math.max(0, Number(payment.amount || 0) - reversed);
    doc.fontSize(8.5).fillColor('#b91c1c')
      .text(shapeArabic(`ملغى: ${money(reversed)} ج.م — الصافي: ${money(net)} ج.م`), left, y, { width: contentW, align: 'right' });
    y += 14;
  }

  if (payment.notes) {
    doc.fontSize(8.5).fillColor('#555555')
      .text(shapeArabic(`ملاحظات: ${payment.notes}`), left, y, { width: contentW, align: 'right' });
    y += 14;
  }

  if (payment.status === 'REVERSED' && payment.reversalReason) {
    doc.fontSize(8.5).fillColor('#b91c1c')
      .text(shapeArabic(`سبب الإلغاء: ${payment.reversalReason}`), left, y, { width: contentW, align: 'right' });
    y += 14;
  }

  const footerY = pageH - 52;
  doc.fontSize(8).fillColor('#666666')
    .text(shapeArabic('توقيع الكاشير'), left, footerY, { width: contentW / 2, align: 'right' })
    .text(shapeArabic('ختم المركز'), left + contentW / 2, footerY, { width: contentW / 2, align: 'left' })
    .fontSize(7)
    .text(shapeArabic(`رقم العملية: ${payment.paymentNumber || ''}`), left, footerY + 14, {
      width: contentW,
      align: 'center',
    });

  doc.end();
});

async function loadReceiptContext(prisma, companyId, paymentId, { studentIds = null } = {}) {
  const payment = await prisma.educationPayment.findFirst({
    where: {
      id: paymentId,
      companyId,
      ...(studentIds ? { studentId: { in: studentIds } } : {}),
    },
  });
  if (!payment) return null;

  const [company, student, enrollment] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, phone: true, address: true, email: true },
    }),
    payment.studentId
      ? prisma.educationStudent.findFirst({
          where: { id: payment.studentId, companyId },
          select: { id: true, code: true, firstName: true, lastName: true },
        })
      : null,
    payment.enrollmentId
      ? prisma.educationEnrollment.findFirst({
          where: { id: payment.enrollmentId, companyId },
          include: { package: { select: { name: true, hoursCount: true } } },
        })
      : null,
  ]);

  return {
    payment,
    company,
    student,
    package: enrollment?.package || null,
  };
}

async function getOrCreateReceiptPdf(prisma, { companyId, paymentId, studentIds = null, force = false }) {
  const context = await loadReceiptContext(prisma, companyId, paymentId, { studentIds });
  if (!context) return null;

  const dir = path.join(receiptsRoot(), safeFileName(companyId));
  const fileName = `${safeFileName(context.payment.paymentNumber || context.payment.id)}.pdf`;
  const absolutePath = path.join(dir, fileName);
  const relativePath = path.relative(process.cwd(), absolutePath).replace(/\\/g, '/');

  if (!force && fs.existsSync(absolutePath)) {
    return {
      buffer: fs.readFileSync(absolutePath),
      path: absolutePath,
      relativePath,
      payment: context.payment,
      cached: true,
    };
  }

  const buffer = await buildReceiptPdf(context);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(absolutePath, buffer);

  await prisma.educationPayment.update({
    where: { id: context.payment.id },
    data: { receiptPdfPath: relativePath, receiptPdfGeneratedAt: new Date() },
  }).catch(() => {});

  return {
    buffer,
    path: absolutePath,
    relativePath,
    payment: context.payment,
    cached: false,
  };
}

module.exports = {
  buildReceiptPdf,
  getOrCreateReceiptPdf,
  loadReceiptContext,
  receiptsRoot,
  METHOD_LABELS,
};

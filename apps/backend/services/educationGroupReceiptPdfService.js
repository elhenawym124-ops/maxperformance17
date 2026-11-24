/**
 * Group collection receipt (batch) as a PDF.
 *
 * نفس أسلوب إيصال الدفع الفردي (PDFKit + NotoSansArabic + shapeArabic) لكن A4
 * ويعرض كل دفعات المجموعة في الفترة المحددة + الإجمالي، للطباعة/الأرشفة بعد التحصيل الجماعي.
 */

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

const formatDate = (value) => {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * @param {object} params
 * @param {object} params.company   { name, phone, address }
 * @param {object} params.group     { name, feeAmount, teacherName? }
 * @param {Array}  params.payments  [{ paymentNumber, receiptNumber, studentName, method, amount, paidAt, status }]
 * @param {string} params.from      YYYY-MM-DD
 * @param {string} params.to        YYYY-MM-DD
 */
const buildGroupReceiptPdf = ({ company, group, payments = [], from, to }) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 36, bottom: 36, left: 36, right: 36 },
    info: {
      Title: `إيصال مجموعة ${group?.name || ''}`,
      Author: company?.name || 'MaxP',
    },
  });

  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  doc.registerFont('Noto', FONT);
  doc.font('Noto');

  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const left = 36;
  const contentW = pageW - 72;
  const right = left + contentW;

  // Header
  doc.fontSize(16).fillColor('#111111')
    .text(shapeArabic(company?.name || 'المركز التعليمي'), left, 36, { width: contentW, align: 'center' });

  let headerY = 60;
  doc.fontSize(8).fillColor('#555555');
  if (company?.phone) {
    doc.text(shapeArabic(company.phone), left, headerY, { width: contentW, align: 'center' });
    headerY += 11;
  }
  if (company?.address) {
    doc.text(shapeArabic(company.address), left, headerY, { width: contentW, align: 'center' });
    headerY += 11;
  }

  doc.fontSize(11.5).fillColor('#111111')
    .text(shapeArabic('إيصال تحصيل رسوم مجموعة'), left, headerY + 4, { width: contentW, align: 'center' });

  const lineY = headerY + 26;
  doc.moveTo(left, lineY).lineTo(right, lineY).lineWidth(0.8).strokeColor('#111111').stroke();

  // Meta rows
  let y = lineY + 10;
  const info = [
    ['المجموعة', group?.name || '—'],
    ['المدرس', group?.teacherName || '—'],
    ['الفترة', `${from || '—'}  ←  ${to || '—'}`],
    ['عدد الدفعات', String(payments.length)],
  ];
  info.forEach(([label, value], idx) => {
    const colW = contentW / 2;
    const x = idx % 2 === 0 ? left : left + colW;
    doc.fontSize(8.5).fillColor('#666666').text(shapeArabic(`${label}:`), x + colW / 2, y, { width: colW / 2 - 4, align: 'right' });
    doc.fillColor('#111111').text(shapeArabic(value), x, y, { width: colW / 2 - 4, align: 'left' });
    if (idx % 2 === 1) y += 15;
  });
  y += 12;

  // Table
  const cols = [
    { key: 'student', label: 'الطالب', x: left + contentW - 210, w: 200, align: 'right' },
    { key: 'receipt', label: 'الإيصال', x: left + contentW - 340, w: 125, align: 'right' },
    { key: 'date', label: 'التاريخ', x: left + contentW - 430, w: 85, align: 'right' },
    { key: 'method', label: 'الدفع', x: left + contentW - 510, w: 75, align: 'right' },
    { key: 'amount', label: 'المبلغ', x: left, w: 80, align: 'left' },
  ];

  const drawHead = () => {
    doc.rect(left, y, contentW, 18).fill('#f3f4f6');
    doc.fontSize(8).fillColor('#333333');
    cols.forEach((c) => doc.text(shapeArabic(c.label), c.x, y + 5, { width: c.w, align: c.align }));
    y += 20;
  };

  drawHead();

  doc.fontSize(8);
  for (const p of payments) {
    if (y > pageH - 90) {
      doc.addPage();
      y = 50;
      drawHead();
      doc.fontSize(8);
    }
    const studentName = String(p.studentName || '—');
    const values = {
      student: studentName.length > 34 ? `${studentName.slice(0, 34)}…` : studentName,
      receipt: p.receiptNumber || p.paymentNumber || '—',
      date: formatDate(p.paidAt),
      method: METHOD_LABELS[p.method] || p.method || '—',
      amount: money(p.amount),
    };
    doc.fillColor(p.status === 'REVERSED' ? '#b91c1c' : '#111111');
    cols.forEach((c) => doc.text(shapeArabic(String(values[c.key])), c.x, y, { width: c.w, align: c.align }));
    doc.moveTo(left, y + 13).lineTo(right, y + 13).lineWidth(0.3).strokeColor('#e5e7eb').stroke();
    y += 17;
  }

  if (!payments.length) {
    doc.fontSize(9).fillColor('#666666')
      .text(shapeArabic('لا توجد دفعات في هذه الفترة'), left, y, { width: contentW, align: 'center' });
    y += 18;
  }

  // Totals
  const total = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  y += 8;
  doc.roundedRect(left, y, contentW, 42, 6).fillAndStroke('#f3f4f6', '#dddddd');
  doc.fontSize(9).fillColor('#333333')
    .text(shapeArabic('إجمالي المحصل'), left + contentW / 2, y + 9, { width: contentW / 2 - 10, align: 'right' });
  doc.fontSize(15).fillColor('#111111')
    .text(shapeArabic(`${money(total)} ج.م`), left + 10, y + 10, { width: contentW / 2, align: 'left' });

  const footerY = pageH - 66;
  doc.moveTo(left, footerY - 10).lineTo(right, footerY - 10).lineWidth(0.5).strokeColor('#cccccc').stroke();
  doc.fontSize(8).fillColor('#666666')
    .text(shapeArabic('توقيع الكاشير'), left, footerY, { width: contentW / 2, align: 'right' })
    .text(shapeArabic('ختم المركز'), left + contentW / 2, footerY, { width: contentW / 2, align: 'left' })
    .fontSize(7)
    .text(shapeArabic(`تم الإنشاء: ${formatDate(new Date())}`), left, footerY + 14, { width: contentW, align: 'center' });

  doc.end();
});

module.exports = { buildGroupReceiptPdf };

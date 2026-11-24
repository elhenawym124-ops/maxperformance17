/**
 * Statement export: PDF (PDFKit + Arabic shaping) and Excel (exceljs).
 */

const path = require('path');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { shapeArabic } = require('../utils/arabicShaping');
const { formatDate } = require('./educationStatementService');

const FONT = path.join(__dirname, '..', 'fonts', 'NotoSansArabic-Regular.ttf');

const TYPE_LABELS = {
  CHARGE: 'مستحق',
  DISCOUNT: 'خصم',
  PAYMENT: 'سداد',
};

const moneyLabel = (value) =>
  (Math.round((Number(value) || 0) * 100) / 100).toLocaleString('en-EG', { maximumFractionDigits: 2 });

const buildStatementPdf = (statement) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'portrait',
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    info: { Title: `كشف حساب ${statement.student.name}`, Author: statement.company.name },
  });

  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  doc.registerFont('Noto', FONT);
  doc.font('Noto');

  const left = 40;
  const right = doc.page.width - 40;
  const width = right - left;

  doc.fontSize(15).fillColor('#111111')
    .text(shapeArabic(statement.company.name), left, 40, { width, align: 'center' });
  doc.fontSize(8).fillColor('#555555')
    .text(shapeArabic(statement.company.phone || ''), left, 62, { width, align: 'center' });

  doc.fontSize(13).fillColor('#111111')
    .text(shapeArabic('كشف حساب طالب'), left, 84, { width, align: 'center' });

  doc.fontSize(9).fillColor('#333333')
    .text(shapeArabic(`الطالب: ${statement.student.name}${statement.student.code ? ` (${statement.student.code})` : ''}`), left, 110)
    .text(shapeArabic(`ولي الأمر: ${statement.student.guardianName || '—'}   •   الهاتف: ${statement.student.phone || '—'}`), left, 124)
    .text(shapeArabic(`الفترة: من ${formatDate(statement.period.from)} إلى ${formatDate(statement.period.to)}`), left, 138);

  let y = 160;
  const cols = { date: left, type: left + 58, label: left + 120, debit: left + 320, credit: left + 375, balance: left + 430 };

  doc.rect(left, y, width, 18).fillColor('#f2f2f2').fill();
  doc.fillColor('#111111').fontSize(8);
  doc.text(shapeArabic('التاريخ'), cols.date + 2, y + 5, { width: 54, align: 'right' });
  doc.text(shapeArabic('النوع'), cols.type + 2, y + 5, { width: 58, align: 'right' });
  doc.text(shapeArabic('البيان'), cols.label + 2, y + 5, { width: 195, align: 'right' });
  doc.text('مدين', cols.debit, y + 5, { width: 50, align: 'right' });
  doc.text('دائن', cols.credit, y + 5, { width: 50, align: 'right' });
  doc.text(shapeArabic('الرصيد'), cols.balance, y + 5, { width: 55, align: 'right' });
  y += 20;

  const maxRows = 26;
  for (const line of statement.lines.slice(0, maxRows)) {
    if (y > doc.page.height - 90) break;
    doc.fillColor('#111111').fontSize(7.5);
    doc.text(line.dateLabel, cols.date, y, { width: 56, align: 'right' });
    doc.text(shapeArabic(TYPE_LABELS[line.type] || line.type), cols.type, y, { width: 58, align: 'right' });
    doc.text(shapeArabic(line.label), cols.label, y, { width: 195, align: 'right' });
    doc.text(line.debit ? moneyLabel(line.debit) : '—', cols.debit, y, { width: 50, align: 'right' });
    doc.text(line.credit ? moneyLabel(line.credit) : '—', cols.credit, y, { width: 50, align: 'right' });
    doc.text(moneyLabel(line.balance), cols.balance, y, { width: 55, align: 'right' });
    y += 14;
  }

  if (statement.lines.length > maxRows) {
    doc.fontSize(7).fillColor('#777777')
      .text(shapeArabic(`... و${statement.lines.length - maxRows} حركة أخرى (الملف الكامل في تصدير Excel)`), left, y + 2, { width, align: 'right' });
    y += 14;
  }

  y += 8;
  doc.moveTo(left, y).lineTo(right, y).lineWidth(0.6).strokeColor('#999999').stroke();
  y += 8;

  const totals = statement.totals;
  doc.fontSize(9).fillColor('#111111');
  doc.text(shapeArabic(`إجمالي المستحق: ${moneyLabel(totals.charges)} ج.م`), left, y, { width: width / 2, align: 'right' });
  doc.text(shapeArabic(`الخصومات: ${moneyLabel(totals.discounts)} ج.م`), left + width / 2, y, { width: width / 2, align: 'right' });
  y += 14;
  doc.text(shapeArabic(`المسدد: ${moneyLabel(totals.paid)} ج.م${totals.refunded ? ` (منها مردود ${moneyLabel(totals.refunded)})` : ''}`), left, y, { width: width / 2, align: 'right' });
  doc.fontSize(10).fillColor(totals.balance > 0.009 ? '#b00020' : '#0a7d32');
  doc.text(shapeArabic(`المتبقي: ${moneyLabel(totals.balance)} ج.م`), left + width / 2, y, { width: width / 2, align: 'right' });

  doc.fontSize(7).fillColor('#777777')
    .text(shapeArabic(`تم الإصدار: ${formatDate(new Date())}`), left, doc.page.height - 55, { width, align: 'center' });

  doc.end();
});

const buildStatementExcel = async (statement) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MaxP';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('كشف حساب', {
    views: [{ rightToLeft: true }],
  });

  sheet.columns = [
    { header: 'التاريخ', key: 'date', width: 14 },
    { header: 'النوع', key: 'type', width: 12 },
    { header: 'البيان', key: 'label', width: 38 },
    { header: 'طريقة الدفع', key: 'method', width: 14 },
    { header: 'مدين', key: 'debit', width: 12 },
    { header: 'دائن', key: 'credit', width: 12 },
    { header: 'الرصيد', key: 'balance', width: 14 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { horizontal: 'center' };

  for (const line of statement.lines) {
    sheet.addRow({
      date: line.dateLabel,
      type: TYPE_LABELS[line.type] || line.type,
      label: line.label,
      method: line.method || '',
      debit: line.debit || null,
      credit: line.credit || null,
      balance: line.balance,
    });
  }

  const totalsRow = sheet.addRow({
    date: '',
    type: '',
    label: `المستحق ${moneyLabel(statement.totals.charges)} · خصومات ${moneyLabel(statement.totals.discounts)} · مسدد ${moneyLabel(statement.totals.paid)}`,
    balance: statement.totals.balance,
  });
  totalsRow.font = { bold: true };

  sheet.getColumn('debit').numFmt = '#,##0.00';
  sheet.getColumn('credit').numFmt = '#,##0.00';
  sheet.getColumn('balance').numFmt = '#,##0.00';

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

module.exports = { buildStatementPdf, buildStatementExcel, TYPE_LABELS };

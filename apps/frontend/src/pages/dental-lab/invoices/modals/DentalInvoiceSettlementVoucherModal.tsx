import { FileCheck, Printer, X as XMarkIcon } from "lucide-react";
import type { DentalMonthlySettlement } from "../../shared";
import { fmtDate, fmtDateTime, fmtMoney, MODAL_CONTENT_CLS } from "../../shared";

export interface DentalInvoiceSettlementVoucherModalProps {
  settlement: DentalMonthlySettlement;
  onClose: () => void;
}

export function DentalInvoiceSettlementVoucherModal({
  settlement,
  onClose,
}: DentalInvoiceSettlementVoucherModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`${MODAL_CONTENT_CLS} max-w-2xl my-6 print:shadow-none print:p-0 print:border-none`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Actions header */}
        <div className="flex items-center justify-between pb-3 border-b dark:border-border mb-4 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 dark:bg-primary/40 text-primary rounded-lg">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              سند تسوية واعتماد المستحقات الشهرية
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 border dark:border-border rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-muted dark:hover:bg-muted"
            >
              <Printer className="w-4 h-4 text-foreground" />
              <span>طباعة السند</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted dark:hover:bg-muted rounded-lg text-muted-foreground"
              aria-label="إغلاق"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Sheet */}
        <div className="border border-border dark:border-border rounded-xl p-5 print:border-none print:p-0 space-y-4 text-xs sm:text-sm bg-white dark:bg-muted">
          {/* Lab Header */}
          <div className="border-b-2 border-primary pb-3 flex items-start justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-primary dark:text-primary">
                معمل ماكس بي للتركيبات السنية
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                MaxP Dental Laboratory Management System
              </p>
            </div>
            <div className="text-left text-xs text-foreground dark:text-muted-foreground">
              <p className="font-bold text-foreground dark:text-muted-foreground">سند تقفيل مستحقات شهرية</p>
              <p className="font-mono">رقم السند: STL-{settlement.id.slice(0, 8).toUpperCase()}</p>
              <p>تاريخ السند: {fmtDate(settlement.closedAt || settlement.createdAt || new Date().toISOString())}</p>
            </div>
          </div>

          {/* Doctor & Period Info */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted dark:bg-muted rounded-lg border dark:border-border">
            <div>
              <span className="text-gray-400 block text-[11px]">السيد الطبيب / العيادة:</span>
              <p className="font-bold text-sm text-foreground mt-0.5">
                د. {settlement.doctorName || "—"}
              </p>
              {settlement.clinicName && <p className="text-xs text-muted-foreground">{settlement.clinicName}</p>}
              {settlement.phone && <p className="text-xs text-muted-foreground font-mono">هاتف: {settlement.phone}</p>}
            </div>
            <div className="text-left">
              <span className="text-gray-400 block text-[11px]">عن شهر التقفيل:</span>
              <p className="font-bold text-sm text-primary dark:text-primary mt-0.5 font-mono">
                {settlement.periodKey} ({settlement.year}/{String(settlement.month).padStart(2, "0")})
              </p>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                  settlement.status === "CLOSED"
                    ? "bg-green-100 text-success dark:bg-success/40 dark:text-success"
                    : settlement.status === "REOPENED"
                    ? "bg-amber-100 text-warning dark:bg-warning/40 dark:text-warning"
                    : "bg-gray-100 text-foreground dark:bg-muted dark:text-muted-foreground"
                }`}
              >
                {settlement.status === "CLOSED"
                  ? "معتمد ومغلق نهائياً"
                  : settlement.status === "REOPENED"
                  ? "معاد فتحه للتدقيق"
                  : "مسودة تسوية أولية"}
              </span>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="border dark:border-border rounded-lg overflow-hidden">
            <table className="w-full text-right">
              <thead className="bg-gray-100 dark:bg-muted text-foreground font-bold text-xs">
                <tr>
                  <th className="py-2.5 px-3">بيان الحركة المحاسبية</th>
                  <th className="py-2.5 px-3">التفاصيل / العدد</th>
                  <th className="py-2.5 px-3 text-left">المبلغ (ج.م)</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-border tabular-nums">
                <tr>
                  <td className="py-2.5 px-3 font-medium">رصيد أول المدة المرحل من الشهر السابق</td>
                  <td className="py-2.5 px-3 text-muted-foreground">رصيد سابق معتمد</td>
                  <td className="py-2.5 px-3 font-semibold text-left font-mono">{fmtMoney(settlement.openingBalance)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-primary dark:text-primary">
                    (+) قيمة الأعمال والفواتير الصادرة بالشهر
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">
                    {settlement.invoicesCount} فاتورة / {settlement.casesCount} حالة
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-primary dark:text-primary text-left font-mono">
                    + {fmtMoney(settlement.totalBilled)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-success dark:text-success">
                    (-) إجمالي التحصيلات والسدادات النقدية والبنكية
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">سدادات مسجلة ومعتمدة</td>
                  <td className="py-2.5 px-3 font-semibold text-success dark:text-success text-left font-mono">
                    - {fmtMoney(settlement.totalPaid)}
                  </td>
                </tr>
                {settlement.totalAdjustments > 0 && (
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-warning dark:text-warning">
                      (-) إجمالي الخصومات والإشعارات الدائنة
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">تسويات وخصومات مسموح بها</td>
                    <td className="py-2.5 px-3 font-semibold text-warning dark:text-warning text-left font-mono">
                      - {fmtMoney(settlement.totalAdjustments)}
                    </td>
                  </tr>
                )}
                <tr className="bg-indigo-50/80 dark:bg-primary/40 font-black text-sm">
                  <td className="py-3 px-3 text-primary dark:text-primary">
                    (=) صافي الرصيد الختامي المستحق والمرحل للشهر القادم
                  </td>
                  <td className="py-3 px-3 text-muted-foreground text-xs font-normal">
                    {settlement.closingBalance > 0 ? "مستحق على الطبيب لصالح المعمل" : "خالص المسدد"}
                  </td>
                  <td className="py-3 px-3 text-destructive dark:text-destructive text-base text-left font-mono">
                    {fmtMoney(settlement.closingBalance)} ج.م
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes & Audit */}
          {settlement.notes && (
            <p className="text-xs text-foreground dark:text-muted-foreground bg-muted dark:bg-muted p-2 rounded">
              <strong>ملاحظات التقفيل:</strong> {settlement.notes}
            </p>
          )}
          {settlement.closedByName && (
            <p className="text-[11px] text-muted-foreground">
              تم اعتماد وإغلاق الحساب بواسطة: <strong>{settlement.closedByName}</strong> بتاريخ:{" "}
              {fmtDateTime(settlement.closedAt)}
            </p>
          )}
          {settlement.reopenedReason && (
            <p className="text-[11px] text-warning dark:text-warning bg-warning/10 dark:bg-warning/30 p-2 rounded border border-warning dark:border-warning">
              <strong>تنبيه تدقيق:</strong> أُعيد فتح هذا الشهر للسبب التالي: {settlement.reopenedReason} بتاريخ{" "}
              {fmtDateTime(settlement.reopenedAt)}
            </p>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-dashed dark:border-border text-center text-xs">
            <div>
              <p className="font-semibold text-foreground">إعداد / قسم الحسابات</p>
              <div className="h-14 border-b border-border"></div>
            </div>
            <div>
              <p className="font-semibold text-foreground">اعتماد إدارة المعمل</p>
              <div className="h-14 border-b border-border"></div>
            </div>
            <div>
              <p className="font-semibold text-foreground">توقيع وختم الطبيب بالاستلام</p>
              <div className="h-14 border-b border-border"></div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t dark:border-border mt-4 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm text-foreground border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

export default DentalInvoiceSettlementVoucherModal;

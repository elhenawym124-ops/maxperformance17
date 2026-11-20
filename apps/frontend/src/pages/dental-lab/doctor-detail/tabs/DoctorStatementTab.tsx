import { FileSpreadsheet, Loader2, Printer, RefreshCw } from "lucide-react";
import { fmtDate, fmtMoney, MODAL_INPUT_CLS } from "../../shared";
import type { DoctorStatementTabProps } from "../types/doctorDetailTypes";
import { DateInput } from '../../../../components/ui/DateInput';

export function DoctorStatementTab({
  doctor,
  statementData,
  invoices,
  loading,
  from,
  to,
  onFromChange,
  onToChange,
  onRefresh,
}: DoctorStatementTabProps) {
  return (
    <div className="space-y-4">
      {/* Date Range Selector and Print CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-4 rounded-xl border dark:border-border">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">من تاريخ:</label>
            <DateInput
              className={`${MODAL_INPUT_CLS} text-sm py-1.5 font-mono tabular-nums`}
              value={from}
              onChange={(e) => onFromChange(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">إلى تاريخ:</label>
            <DateInput
              className={`${MODAL_INPUT_CLS} text-sm py-1.5 font-mono tabular-nums`}
              value={to}
              onChange={(e) => onToChange(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary flex items-center gap-1.5 mt-auto transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تحديث الكشف</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 border dark:border-border rounded-lg text-sm font-medium hover:bg-muted dark:hover:bg-muted transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة كشف الحساب</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card rounded-xl border dark:border-border p-5 space-y-6 print:border-none print:shadow-none">
          {/* Printable Header */}
          <div className="flex justify-between items-start border-b pb-4 dark:border-border">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <span>كشف حساب معمل الأسنان</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                العميل / الطبيب: <span className="font-bold text-foreground">{doctor.name}</span>
              </p>
              {doctor.clinicName && (
                <p className="text-xs text-muted-foreground">العيادة: {doctor.clinicName}</p>
              )}
            </div>
            <div className="text-left text-xs text-muted-foreground font-mono">
              <p>تاريخ الاستخراج: {new Date().toLocaleDateString("ar-EG")}</p>
              {from && <p>من: {from}</p>}
              {to && <p>إلى: {to}</p>}
            </div>
          </div>

          {/* Summary Totals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted dark:bg-muted p-4 rounded-xl">
            <div>
              <span className="text-xs text-muted-foreground block">إجمالي الفواتير الصادرة</span>
              <span className="text-base font-bold text-foreground font-mono tabular-nums">
                {fmtMoney(statementData?.totals?.invoiced ?? doctor.totalBilled ?? 0)} ج.م
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">إجمالي المسدد</span>
              <span className="text-base font-bold text-success font-mono tabular-nums">
                {fmtMoney(statementData?.totals?.paid ?? doctor.totalPaid ?? 0)} ج.م
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">الرصيد المتبقي</span>
              <span className="text-base font-bold text-destructive font-mono tabular-nums">
                {fmtMoney(statementData?.totals?.remaining ?? doctor.outstanding ?? 0)} ج.م
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">عدد الحالات بالفترة</span>
              <span className="text-base font-bold text-foreground font-mono tabular-nums">
                {statementData?.totals?.cases ?? doctor.casesCount ?? 0} حالة
              </span>
            </div>
          </div>

          {/* Statement Invoices Table */}
          <div>
            <h4 className="text-sm font-bold text-foreground mb-2">
              تفاصيل الفواتير والمسحوبات:
            </h4>
            <table className="w-full text-sm border dark:border-border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-muted text-foreground text-right">
                  <th className="py-2.5 px-3">رقم الفاتورة</th>
                  <th className="py-2.5 px-3">التاريخ</th>
                  <th className="py-2.5 px-3">القيمة الكلية</th>
                  <th className="py-2.5 px-3">المدفوع</th>
                  <th className="py-2.5 px-3">المتبقي</th>
                  <th className="py-2.5 px-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-border">
                {(statementData?.invoices || invoices).map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-2 px-3 font-semibold font-mono">{inv.invoiceNumber}</td>
                    <td className="py-2 px-3 text-xs font-mono tabular-nums">{fmtDate(inv.createdAt)}</td>
                    <td className="py-2 px-3 font-mono tabular-nums">{fmtMoney(inv.total)} ج.م</td>
                    <td className="py-2 px-3 text-success font-mono tabular-nums">{fmtMoney(inv.paid)} ج.م</td>
                    <td className="py-2 px-3 font-bold text-destructive font-mono tabular-nums">
                      {fmtMoney(inv.remaining)} ج.م
                    </td>
                    <td className="py-2 px-3 text-xs">{inv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorStatementTab;

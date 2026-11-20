import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Copy, CreditCard, Download, Loader2, Receipt } from "lucide-react";
import { fmtDate, fmtMoney, PAYMENT_STATUS_MAP } from "../../shared";
import type { DoctorInvoicesTabProps } from "../types/doctorDetailTypes";

export function DoctorInvoicesTab({
  invoices,
  loading,
  statusFilter,
  onStatusFilterChange,
  onPayInvoice,
  onDownloadPdf,
  onCopyPaymentLink,
}: DoctorInvoicesTabProps) {
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== "ALL" && inv.status !== statusFilter) return false;
      return true;
    });
  }, [invoices, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Top Bar with Filter Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-xl border dark:border-border">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-muted-foreground" />
          <span className="font-semibold text-sm">فواتير ومستحقات الطبيب</span>
        </div>

        <div className="flex items-center gap-2">
          {[
            { id: "ALL", label: "كل الفواتير" },
            { id: "OPEN", label: "مفتوحة (مستحقة)" },
            { id: "PARTIAL", label: "مدفوعة جزئياً" },
            { id: "PAID", label: "مسددة بالكامل" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => onStatusFilterChange(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === f.id
                  ? "bg-blue-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="p-10 text-center bg-card rounded-xl border dark:border-border">
          <Receipt className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-gray-500 font-medium">لا توجد فواتير تطابق هذا التصنيف</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border dark:border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-muted text-muted-foreground border-b dark:border-border text-right">
                  <th className="py-3 px-3.5">رقم الفاتورة</th>
                  <th className="py-3 px-3.5">التاريخ</th>
                  <th className="py-3 px-3.5">رقم الحالة / البيان</th>
                  <th className="py-3 px-3.5">الإجمالي</th>
                  <th className="py-3 px-3.5">المدفوع</th>
                  <th className="py-3 px-3.5">المتبقي</th>
                  <th className="py-3 px-3.5">الحالة</th>
                  <th className="py-3 px-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-border">
                {filteredInvoices.map((inv) => {
                  const st = PAYMENT_STATUS_MAP[inv.status as keyof typeof PAYMENT_STATUS_MAP] || {
                    label: inv.status,
                    color: "bg-gray-100 text-foreground",
                  };
                  return (
                    <tr key={inv.id} className="hover:bg-muted/50/50">
                      <td className="py-3 px-3.5 font-bold text-foreground font-mono">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-3.5 text-xs text-muted-foreground font-mono tabular-nums">
                        {fmtDate(inv.createdAt)}
                      </td>
                      <td className="py-3 px-3.5">
                        {inv.case?.caseNumber ? (
                          <Link
                            to={`/dental-lab/cases/${inv.caseId}`}
                            className="text-blue-600 hover:underline font-medium text-xs font-mono"
                          >
                            {inv.case.caseNumber} {inv.case.patientName ? `(${inv.case.patientName})` : ""}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">فاتورة مجمعة / دورية</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-semibold font-mono tabular-nums">
                        {fmtMoney(inv.total)} ج.م
                      </td>
                      <td className="py-3 px-3.5 text-success font-medium font-mono tabular-nums">
                        {fmtMoney(inv.paid)} ج.م
                      </td>
                      <td
                        className={`py-3 px-3.5 font-bold font-mono tabular-nums ${
                          (inv.remaining || 0) > 0 ? "text-red-600" : "text-gray-400"
                        }`}
                      >
                        {fmtMoney(inv.remaining)} ج.م
                      </td>
                      <td className="py-3 px-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {(inv.remaining || 0) > 0 && (
                            <button
                              onClick={() => onPayInvoice(inv)}
                              className="p-1.5 text-success hover:bg-success/10 dark:hover:bg-success/30 rounded-lg transition-colors"
                              title="سداد الفاتورة"
                              aria-label="سداد الفاتورة"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onDownloadPdf(inv.id, inv.invoiceNumber)}
                            className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/30 rounded-lg transition-colors"
                            title="تحميل فاتورة PDF"
                            aria-label="تحميل فاتورة PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onCopyPaymentLink(inv.id)}
                            className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/30 rounded-lg transition-colors"
                            title="نسخ رابط الدفع الإلكتروني"
                            aria-label="نسخ رابط الدفع الإلكتروني"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorInvoicesTab;

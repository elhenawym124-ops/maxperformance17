import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Ban,
  Banknote,
  CreditCard,
  Eye,
  FileText,
  Link2,
  Loader2,
  MessageCircle,
  Sparkles,
  X as XMarkIcon,
} from "lucide-react";
import type { DentalInvoice } from "../../shared";
import { fetchInvoicePaymentLink, fetchInvoicePdf, fmtDate, fmtMoney } from "../../shared";
import { invoiceBadge, shareInvoiceWhatsApp } from "../types/dentalInvoicesTypes";

export interface DentalInvoicesTableProps {
  loading: boolean;
  error: string | null;
  onClearError: () => void;
  rows: DentalInvoice[];
  onRowClick: (inv: DentalInvoice) => void;
  onPaymentClick: (inv: DentalInvoice) => void;
  onVoidClick: (inv: DentalInvoice) => void;
}

export function DentalInvoicesTable({
  loading,
  error,
  onClearError,
  rows,
  onRowClick,
  onPaymentClick,
  onVoidClick,
}: DentalInvoicesTableProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center justify-between bg-destructive/10 dark:bg-destructive/30 text-destructive dark:text-destructive border border-destructive dark:border-destructive rounded-lg px-4 py-2 text-sm">
          <span>{error}</span>
          <button
            onClick={onClearError}
            className="p-1 hover:bg-destructive dark:hover:bg-destructive/50 rounded"
            aria-label="إغلاق التنبيه"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white dark:bg-muted rounded-xl border dark:border-border overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground/80">
            <CreditCard className="w-10 h-10 mx-auto mb-3 text-muted-foreground dark:text-foreground" />
            <p className="text-base font-semibold text-muted-foreground">
              {t("dentalLab.invoices.noData")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">جرّب تغيير فلاتر البحث أو الطبيب المحدد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-right tabular-nums">
              <thead className="border-b dark:border-border bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground font-bold">
                <tr>
                  <th className="py-3 px-3.5 whitespace-nowrap">رقم الفاتورة</th>
                  <th className="py-3 px-3 whitespace-nowrap">التاريخ</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">{t("dentalLab.invoices.doctorName")}</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">الحالة / المريض</th>
                  <th className="py-3 px-3 whitespace-nowrap">{t("dentalLab.invoices.total")}</th>
                  <th className="py-3 px-3 whitespace-nowrap">{t("dentalLab.invoices.paid")}</th>
                  <th className="py-3 px-3 whitespace-nowrap">{t("dentalLab.invoices.remaining")}</th>
                  <th className="py-3 px-3 whitespace-nowrap">الاستحقاق</th>
                  <th className="py-3 px-3 whitespace-nowrap">{t("dentalLab.common.status")}</th>
                  <th className="py-3 px-3.5 whitespace-nowrap text-center">
                    {t("dentalLab.common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-border">
                {rows.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => onRowClick(inv)}
                    className="hover:bg-blue-50/40 dark:hover:bg-primary/10 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3.5 font-bold text-primary dark:text-primary whitespace-nowrap font-mono">
                      {inv.invoiceNumber || inv.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                      {fmtDate(inv.createdAt)}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-foreground whitespace-nowrap">
                      {inv.doctorName || "—"}
                    </td>
                    <td className="py-3 px-3.5">
                      {(() => {
                        let isConsolidated = false;
                        let casesCount = 0;
                        let totalUnits = 0;
                        if (inv.notes && inv.notes.startsWith("{") && inv.notes.includes('"items"')) {
                          try {
                            const p = JSON.parse(inv.notes);
                            if (p.isConsolidated || Array.isArray(p.items)) {
                              isConsolidated = true;
                              casesCount = p.items?.length || p.casesCount || p.summary?.casesCount || 0;
                              totalUnits =
                                p.totalUnits ||
                                p.summary?.totalUnits ||
                                (p.items || []).reduce(
                                  (acc: number, it: any) => acc + (Number(it.unitsCount) || 1),
                                  0
                                );
                            }
                          } catch {}
                        }
                        if (isConsolidated) {
                          return (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 font-bold text-primary dark:text-primary bg-primary/10 dark:bg-primary/30 px-2 py-0.5 rounded text-xs w-fit">
                                <Sparkles className="w-3 h-3 text-primary" />
                                فاتورة مجمعة ({casesCount} حالة)
                              </span>
                              {totalUnits > 0 && (
                                <span className="text-[11px] text-muted-foreground font-mono">
                                  {totalUnits} وحدة
                                </span>
                              )}
                            </div>
                          );
                        }
                        return (
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground dark:text-muted-foreground">
                              {inv.patientName || inv.case?.patientName || "—"}
                            </span>
                            {inv.case?.caseNumber && (
                              <span className="text-[11px] text-muted-foreground font-mono">
                                حالة: {inv.case.caseNumber}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-foreground whitespace-nowrap font-mono">
                      {fmtMoney(inv.total)}
                    </td>
                    <td className="py-3 px-3 text-success dark:text-success font-semibold whitespace-nowrap font-mono">
                      {fmtMoney(inv.paid)}
                    </td>
                    <td className="py-3 px-3 text-destructive font-bold whitespace-nowrap font-mono">
                      {fmtMoney(inv.remaining)}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                      {inv.dueDate ? (
                        <span className="text-xs text-warning dark:text-warning">
                          {fmtDate(inv.dueDate)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">{invoiceBadge(inv.status)}</td>
                    <td className="py-3 px-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onRowClick(inv)}
                          className="p-1.5 text-foreground hover:text-primary hover:bg-muted dark:hover:bg-muted rounded-lg"
                          title="تفاصيل الفاتورة"
                          aria-label="تفاصيل الفاتورة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const blob = await fetchInvoicePdf(inv.id);
                              const url = URL.createObjectURL(blob);
                              window.open(url, "_blank");
                            } catch (e) {
                              toast.error(
                                e instanceof Error ? e.message : t("dentalLab.common.noData")
                              );
                            }
                          }}
                          className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/30 rounded-lg"
                          title={t("dentalLab.invoices.pdf")}
                          aria-label={t("dentalLab.invoices.pdf")}
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => shareInvoiceWhatsApp(inv)}
                          className="p-1.5 text-success hover:bg-success/10 dark:hover:bg-success/30 rounded-lg"
                          title="إرسال الفاتورة عبر واتساب"
                          aria-label="إرسال الفاتورة عبر واتساب"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const r = await fetchInvoicePaymentLink(inv.id);
                              if (r.configured && r.checkoutUrl) {
                                window.open(r.checkoutUrl, "_blank");
                              } else {
                                toast.info(r.message || t("dentalLab.invoices.paymentNotConfigured"));
                              }
                            } catch (e) {
                              toast.error(
                                e instanceof Error ? e.message : t("dentalLab.common.noData")
                              );
                            }
                          }}
                          className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/30 rounded-lg"
                          title={t("dentalLab.invoices.paymentLink")}
                          aria-label={t("dentalLab.invoices.paymentLink")}
                        >
                          <Link2 className="w-4 h-4" />
                        </button>
                        {inv.remaining > 0 && (
                          <button
                            onClick={() => onPaymentClick(inv)}
                            className="flex items-center gap-1 px-2 py-1 bg-success/10 border border-success text-success hover:bg-success dark:bg-success/30 dark:border-success dark:text-success rounded-lg text-xs font-semibold"
                            title={t("dentalLab.invoices.addPayment")}
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>سداد</span>
                          </button>
                        )}
                        {inv.status !== "VOID" && inv.status !== "PAID" && (
                          <button
                            onClick={() => onVoidClick(inv)}
                            className="p-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/40 rounded-lg transition-colors"
                            title="إلغاء الفاتورة (Void)"
                            aria-label="إلغاء الفاتورة"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DentalInvoicesTable;

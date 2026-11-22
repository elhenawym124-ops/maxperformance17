import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react";
import { downloadPaymentsCsv, fetchPayments, reversePayment } from "./api";
import { EmptyState, INPUT_CLS, StatusPill, formatDate, formatDateTime, money, monthStartInput, todayInput } from "./shared";
import { PAYMENT_METHOD_LABELS, SOURCE_LABELS } from "./types";
import type { EducationPayment, PaymentsPagination } from "./types";

interface Props {
  reloadKey: number;
  onChanged: () => void;
  onOpenReceipt: (id: string) => void;
}

const PAGE_SIZE = 25;

const PaymentsLedgerTab: React.FC<Props> = ({ reloadKey, onChanged, onOpenReceipt }) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const [items, setItems] = useState<EducationPayment[]>([]);
  const [pagination, setPagination] = useState<PaymentsPagination>({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    from: monthStartInput(),
    to: todayInput(),
    method: "",
    status: "",
    q: "",
  });
  const [page, setPage] = useState(1);
  const [reverseTarget, setReverseTarget] = useState<EducationPayment | null>(null);
  const [reverseReason, setReverseReason] = useState("");
  const [reversing, setReversing] = useState(false);
  const [reverseError, setReverseError] = useState("");

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fetchPayments({ ...filters, page, limit: PAGE_SIZE })
      .then((res) => {
        if (!alive) return;
        setItems(res.items);
        setPagination(res.pagination);
      })
      .catch((e) => alive && setError(e.message || "فشل جلب المدفوعات"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [filters, page, reloadKey]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  const submitReverse = async () => {
    if (!reverseTarget) return;
    try {
      setReversing(true);
      setReverseError("");
      await reversePayment(reverseTarget.id, reverseReason.trim() || undefined);
      setReverseTarget(null);
      setReverseReason("");
      onChanged();
      load();
    } catch (e: any) {
      setReverseError(e.message || "فشل إلغاء الدفعة");
    } finally {
      setReversing(false);
    }
  };

  const resetFilters = () => {
    setFilters({ from: monthStartInput(), to: todayInput(), method: "", status: "", q: "" });
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-2.5">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground" htmlFor="edu-pay-from">
              {isEn ? "From" : "من تاريخ"}
            </label>
            <input
              id="edu-pay-from"
              type="date"
              className={INPUT_CLS + " font-mono"}
              value={filters.from}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, from: e.target.value }));
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground" htmlFor="edu-pay-to">
              {isEn ? "To" : "إلى تاريخ"}
            </label>
            <input
              id="edu-pay-to"
              type="date"
              className={INPUT_CLS + " font-mono"}
              value={filters.to}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, to: e.target.value }));
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground" htmlFor="edu-pay-method-filter">
              {isEn ? "Method" : "طريقة الدفع"}
            </label>
            <select
              id="edu-pay-method-filter"
              className={INPUT_CLS}
              value={filters.method}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, method: e.target.value }));
                setPage(1);
              }}
            >
              <option value="">{isEn ? "All methods" : "كل الطرق"}</option>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {isEn ? label.en : label.ar}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground" htmlFor="edu-pay-status-filter">
              {isEn ? "Status" : "الحالة"}
            </label>
            <select
              id="edu-pay-status-filter"
              className={INPUT_CLS}
              value={filters.status}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, status: e.target.value }));
                setPage(1);
              }}
            >
              <option value="">{isEn ? "All" : "الكل"}</option>
              <option value="COMPLETED">{isEn ? "Completed" : "محصلة"}</option>
              <option value="REVERSED">{isEn ? "Reversed" : "ملغاة"}</option>
            </select>
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-[11px] font-medium text-muted-foreground" htmlFor="edu-pay-search">
              {isEn ? "Search" : "بحث"}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3" />
              <input
                id="edu-pay-search"
                className={INPUT_CLS + " ps-9"}
                value={filters.q}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, q: e.target.value }));
                  setPage(1);
                }}
                placeholder={isEn ? "Student, receipt or reference" : "طالب، إيصال أو مرجع"}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 pt-3">
          <span className="text-[11px] text-muted-foreground font-mono">
            {loading
              ? isEn ? "Loading..." : "جارٍ التحميل..."
              : `${pagination.total} ${isEn ? "payments" : "دفعة"}`}
          </span>
          <button
            type="button"
            onClick={resetFilters}
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            {isEn ? "Reset filters" : "إعادة ضبط الفلاتر"}
          </button>
        </div>
        <div className="flex items-center justify-between gap-2 pt-2">
          <span className="text-[10px] text-muted-foreground">
            {isEn ? "CSV keeps the current filters" : "ملف CSV يحترم نفس الفلاتر"}
          </span>
          <button
            type="button"
            onClick={async () => {
              try {
                await downloadPaymentsCsv({ ...filters, page: 1, limit: PAGE_SIZE });
              } catch (e: any) {
                setError(e.message || (isEn ? "Export failed" : "فشل التصدير"));
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[11px] font-semibold text-foreground hover:bg-muted"
          >
            <Download className="w-3.5 h-3.5" />
            {isEn ? "Export CSV" : "تصدير CSV"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          <span>{error}</span>
          <button type="button" onClick={load} className="inline-flex items-center gap-1 font-semibold">
            <RefreshCw className="w-3.5 h-3.5" />
            {isEn ? "Retry" : "إعادة المحاولة"}
          </button>
        </div>
      ) : null}

      {!error && !loading && items.length === 0 ? (
        <EmptyState
          title={isEn ? "No payments in this range" : "لا توجد مدفوعات في هذه الفترة"}
          hint={isEn ? "Adjust the filters or record a new payment." : "عدّل الفلاتر أو سجّل دفعة جديدة."}
        />
      ) : null}

      {items.length > 0 ? (
        <>
          <div className="hidden md:block rounded-xl border border-border/70 bg-card overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-start px-3 py-2.5 font-medium">{isEn ? "Receipt" : "الإيصال"}</th>
                  <th className="text-start px-3 py-2.5 font-medium">{isEn ? "Student" : "الطالب"}</th>
                  <th className="text-start px-3 py-2.5 font-medium">{isEn ? "Amount" : "المبلغ"}</th>
                  <th className="text-start px-3 py-2.5 font-medium">{isEn ? "Method" : "الطريقة"}</th>
                  <th className="text-start px-3 py-2.5 font-medium">{isEn ? "Date" : "التاريخ"}</th>
                  <th className="text-start px-3 py-2.5 font-medium">{isEn ? "Cashier" : "الكاشير"}</th>
                  <th className="text-start px-3 py-2.5 font-medium">{isEn ? "Status" : "الحالة"}</th>
                  <th className="text-end px-3 py-2.5 font-medium">{isEn ? "Actions" : "إجراءات"}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((payment) => {
                  const reversed = payment.status === "REVERSED";
                  const sourceLabel = SOURCE_LABELS[payment.source || "ADMIN"];
                  return (
                    <tr key={payment.id} className="border-t border-border/60 hover:bg-muted/20">
                      <td className="px-3 py-2.5">
                        <div className="font-mono text-[11px] text-foreground">{payment.paymentNumber}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {sourceLabel
                            ? isEn
                              ? sourceLabel.en
                              : sourceLabel.ar
                            : payment.source || "—"}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-foreground">{payment.studentName || "—"}</div>
                        {payment.reference ? (
                          <div className="text-[10px] text-muted-foreground font-mono">{payment.reference}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 font-mono tabular-nums font-semibold text-foreground">
                        {money(payment.amount)}
                      </td>
                      <td className="px-3 py-2.5">
                        {isEn
                          ? PAYMENT_METHOD_LABELS[payment.method]?.en || payment.method
                          : PAYMENT_METHOD_LABELS[payment.method]?.ar || payment.method}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground"><span dir="ltr">{formatDateTime(payment.paidAt)}</span></td>
                      <td className="px-3 py-2.5 text-muted-foreground">{payment.cashierName || "—"}</td>
                      <td className="px-3 py-2.5">
                        {reversed ? (
                          <div className="space-y-0.5">
                            <StatusPill tone="danger">{isEn ? "Reversed" : "ملغاة"}</StatusPill>
                            {payment.reversalReason ? (
                              <p className="text-[10px] text-muted-foreground max-w-[140px] truncate" title={payment.reversalReason}>
                                {payment.reversalReason}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <StatusPill tone="success">{isEn ? "Completed" : "محصلة"}</StatusPill>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenReceipt(payment.id)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                            aria-label={isEn ? "Receipt" : "إيصال"}
                            title={isEn ? "Receipt" : "إيصال"}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {!reversed ? (
                            <button
                              type="button"
                              onClick={() => {
                                setReverseTarget(payment);
                                setReverseReason("");
                                setReverseError("");
                              }}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              aria-label={isEn ? "Reverse" : "إلغاء الدفعة"}
                              title={isEn ? "Reverse" : "إلغاء الدفعة"}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {items.map((payment) => {
              const reversed = payment.status === "REVERSED";
              return (
                <div key={payment.id} className="rounded-xl border border-border/70 bg-card p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{payment.studentName || "—"}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{payment.paymentNumber}</p>
                    </div>
                    {reversed ? (
                      <StatusPill tone="danger">{isEn ? "Reversed" : "ملغاة"}</StatusPill>
                    ) : (
                      <StatusPill tone="success">{isEn ? "Completed" : "محصلة"}</StatusPill>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">
                      <span dir="ltr">{formatDate(payment.paidAt)}</span> ·{" "}
                      {isEn
                        ? PAYMENT_METHOD_LABELS[payment.method]?.en || payment.method
                        : PAYMENT_METHOD_LABELS[payment.method]?.ar || payment.method}
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {money(payment.amount)} {isEn ? "EGP" : "ج.م"}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => onOpenReceipt(payment.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-muted text-foreground"
                    >
                      <Printer className="w-3 h-3" />
                      {isEn ? "Receipt" : "إيصال"}
                    </button>
                    {!reversed ? (
                      <button
                        type="button"
                        onClick={() => {
                          setReverseTarget(payment);
                          setReverseReason("");
                          setReverseError("");
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-destructive/10 text-destructive"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {isEn ? "Reverse" : "إلغاء"}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {pagination.totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-border text-muted-foreground disabled:opacity-40 hover:bg-muted"
                aria-label={isEn ? "Previous page" : "السابق"}
              >
                <ChevronRight className="w-4 h-4 rtl:hidden" />
                <ChevronLeft className="w-4 h-4 hidden rtl:block" />
              </button>
              <span className="text-[11px] font-mono text-muted-foreground">
                {page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="p-1.5 rounded-lg border border-border text-muted-foreground disabled:opacity-40 hover:bg-muted"
                aria-label={isEn ? "Next page" : "التالي"}
              >
                <ChevronLeft className="w-4 h-4 rtl:hidden" />
                <ChevronRight className="w-4 h-4 hidden rtl:block" />
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {reverseTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-3"
          dir={isEn ? "ltr" : "rtl"}
          onClick={() => setReverseTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card shadow-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={isEn ? "Reverse payment" : "إلغاء دفعة"}
          >
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <h3 className="text-sm font-bold">{isEn ? "Reverse payment" : "إلغاء دفعة"}</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {isEn
                ? `This returns ${money(reverseTarget.amount)} EGP to the student balance and posts an expense to the treasury.`
                : `سيتم إرجاع ${money(reverseTarget.amount)} ج.م لرصيد الطالب وخصمها من الخزينة.`}
            </p>
            <p className="text-[11px] font-mono text-foreground">{reverseTarget.paymentNumber} — {reverseTarget.studentName || "—"}</p>
            <input
              className={INPUT_CLS}
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
              placeholder={isEn ? "Reason (optional)" : "سبب الإلغاء (اختياري)"}
            />
            {reverseError ? <p className="text-[11px] text-destructive">{reverseError}</p> : null}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setReverseTarget(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-muted text-foreground"
              >
                {isEn ? "Keep" : "تراجع"}
              </button>
              <button
                type="button"
                onClick={submitReverse}
                disabled={reversing}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {reversing ? (isEn ? "Reversing..." : "جارٍ الإلغاء...") : isEn ? "Reverse" : "تأكيد الإلغاء"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PaymentsLedgerTab;

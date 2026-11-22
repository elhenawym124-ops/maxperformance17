import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, DollarSign, RefreshCw, TrendingUp, Wallet } from "lucide-react";
import { fetchFinanceReport } from "./api";
import type { FinanceReportData } from "./types";

const METHOD_LABELS: Record<string, { ar: string; en: string }> = {
  CASH: { ar: "نقدي", en: "Cash" },
  TRANSFER: { ar: "تحويل بنكي", en: "Transfer" },
  WALLET: { ar: "محفظة", en: "Wallet" },
  CARD: { ar: "بطاقة", en: "Card" },
  INSTAPAY: { ar: "إنستاپاي", en: "InstaPay" },
  OTHER: { ar: "أخرى", en: "Other" },
};

const SOURCE_LABELS: Record<string, { ar: string; en: string }> = {
  ADMIN: { ar: "تحصيل إداري", en: "Admin" },
  GROUP: { ar: "رسوم مجموعات", en: "Groups" },
  INSTALLMENT: { ar: "أقساط", en: "Installments" },
  PARENT_WALLET: { ar: "محفظة ولي الأمر", en: "Parent wallet" },
  BACKFILL: { ar: "مدفوعات مرحّلة", en: "Backfilled" },
  SYSTEM: { ar: "النظام", en: "System" },
};

const money = (value: number) =>
  (Math.round((Number(value) || 0) * 100) / 100).toLocaleString("en-EG", { maximumFractionDigits: 2 });

const monthLabel = (key: string, isEn: boolean) => {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString(isEn ? "en-GB" : "ar-EG", { month: "short", year: "2-digit" });
};

export const EducationFinanceTab: React.FC<{ isEn: boolean }> = ({ isEn }) => {
  const [months, setMonths] = useState(6);
  const [data, setData] = useState<FinanceReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fetchFinanceReport(months)
      .then((report) => {
        if (!alive) return;
        if (report) setData(report);
        else setError(isEn ? "Failed to load the finance report" : "فشل جلب التقرير المالي");
      })
      .catch(() => alive && setError(isEn ? "Failed to load the finance report" : "فشل جلب التقرير المالي"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [months, isEn]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  const maxMonthly = Math.max(1, ...(data?.monthly || []).map((row) => row.amount));
  const methodTotal = Object.values(data?.byMethod || {}).reduce((sum, row) => sum + row.amount, 0) || 1;

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive flex items-center justify-between gap-3">
        <span>{error}</span>
        <button type="button" onClick={load} className="inline-flex items-center gap-1 font-semibold">
          <RefreshCw className="w-3.5 h-3.5" />
          {isEn ? "Retry" : "إعادة المحاولة"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-success" />
          <h3 className="text-sm font-semibold text-foreground">
            {isEn ? "Collections & revenue" : "التحصيل والإيرادات"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card p-1">
            {[3, 6, 12].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMonths(value)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  months === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {value} {isEn ? "mo" : "شهور"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={load}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted"
            aria-label={isEn ? "Refresh" : "تحديث"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        {[
          { label: isEn ? "Collected" : "إجمالي المحصل", value: `${money(data?.totals.collected || 0)} ${isEn ? "EGP" : "ج.م"}`, icon: DollarSign, tone: "text-success" },
          { label: isEn ? "Payments" : "عدد الدفعات", value: String(data?.totals.payments || 0), icon: TrendingUp, tone: "text-foreground" },
          { label: isEn ? "Average payment" : "متوسط الدفعة", value: `${money(data?.totals.average || 0)} ${isEn ? "EGP" : "ج.م"}`, icon: Wallet, tone: "text-foreground" },
          { label: isEn ? "Outstanding" : "مستحق غير محصل", value: `${money(data?.outstanding.amount || 0)} ${isEn ? "EGP" : "ج.م"}`, icon: Wallet, tone: "text-warning" },
          { label: isEn ? "Overdue installments" : "أقساط متأخرة", value: `${money(data?.overdueInstallments.amount || 0)} ${isEn ? "EGP" : "ج.م"}`, icon: AlertTriangle, tone: (data?.overdueInstallments.count || 0) > 0 ? "text-destructive" : "text-muted-foreground" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border/70 bg-card p-3">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
              <item.icon className={`w-3.5 h-3.5 ${item.tone}`} />
            </div>
            <p className={`text-sm font-bold font-mono tabular-nums mt-1 ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-foreground">{isEn ? "Monthly collections" : "التحصيل الشهري"}</h4>
          <span className="text-[10px] text-muted-foreground font-mono">
            {data?.period ? `${data.period.months} ${isEn ? "months" : "شهور"}` : ""}
          </span>
        </div>
        <div className="mt-4 flex items-end justify-around gap-2 h-36">
          {(data?.monthly || []).map((row) => {
            const heightPx = Math.max(4, Math.round((row.amount / maxMonthly) * 104));
            return (
              <div key={row.month} className="flex-1 max-w-[96px] flex flex-col items-center justify-end gap-1 min-w-0 h-full">
                <span className="text-[10px] font-mono tabular-nums text-muted-foreground truncate w-full text-center">
                  {row.amount ? money(row.amount) : "0"}
                </span>
                <div
                  className="w-full rounded-t-md bg-primary/70 hover:bg-primary transition-colors"
                  style={{ height: `${heightPx}px` }}
                  title={`${row.count} ${isEn ? "payments" : "دفعة"}`}
                />
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{monthLabel(row.month, isEn)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/70 bg-card p-4">
          <h4 className="text-xs font-semibold text-foreground">{isEn ? "By payment method" : "حسب طريقة الدفع"}</h4>
          <div className="mt-3 space-y-2">
            {Object.entries(data?.byMethod || {}).length === 0 ? (
              <p className="text-[11px] text-muted-foreground">{isEn ? "No payments in this period" : "لا توجد دفعات في هذه الفترة"}</p>
            ) : (
              Object.entries(data?.byMethod || {})
                .sort((a, b) => b[1].amount - a[1].amount)
                .map(([method, row]) => (
                  <div key={method} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-foreground">{isEn ? METHOD_LABELS[method]?.en || method : METHOD_LABELS[method]?.ar || method}</span>
                      <span className="font-mono tabular-nums text-muted-foreground">
                        {money(row.amount)} · {row.count}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((row.amount / methodTotal) * 100)}%` }} />
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4">
          <h4 className="text-xs font-semibold text-foreground">{isEn ? "By source" : "حسب المصدر"}</h4>
          <div className="mt-3 space-y-2">
            {Object.entries(data?.bySource || {}).length === 0 ? (
              <p className="text-[11px] text-muted-foreground">{isEn ? "No payments in this period" : "لا توجد دفعات في هذه الفترة"}</p>
            ) : (
              Object.entries(data?.bySource || {})
                .sort((a, b) => b[1].amount - a[1].amount)
                .map(([source, row]) => (
                  <div key={source} className="flex items-center justify-between text-[11px] py-1 border-b border-border/40 last:border-0">
                    <span className="text-foreground">{isEn ? SOURCE_LABELS[source]?.en || source : SOURCE_LABELS[source]?.ar || source}</span>
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {money(row.amount)} {isEn ? "EGP" : "ج.م"} · {row.count}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-foreground">{isEn ? "Top outstanding balances" : "أكبر المتبقي على الطلاب"}</h4>
          <span className="text-[10px] text-muted-foreground font-mono">
            {data?.outstanding.count || 0} {isEn ? "enrollments" : "تسجيل"}
          </span>
        </div>
        {(data?.outstanding.top || []).length === 0 ? (
          <p className="p-4 text-[11px] text-muted-foreground">{isEn ? "No outstanding balances" : "لا توجد متأخرات"}</p>
        ) : (
          <div className="divide-y divide-border/60">
            {(data?.outstanding.top || []).map((due) => (
              <div key={due.enrollmentId} className="px-4 py-2.5 flex items-center justify-between gap-3 text-[11px]">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{due.studentName || "—"}</p>
                  <p className="text-muted-foreground truncate">
                    {due.packageName || "—"}
                    {due.overdueAmount > 0 ? ` · ${isEn ? "overdue" : "متأخر"}: ${money(due.overdueAmount)}` : ""}
                  </p>
                </div>
                <span className="font-mono tabular-nums font-bold text-warning shrink-0">
                  {money(due.remaining)} {isEn ? "EGP" : "ج.م"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

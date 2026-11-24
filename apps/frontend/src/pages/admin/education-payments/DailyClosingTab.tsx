import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, LockKeyhole, RefreshCw, Unlock } from "lucide-react";
import { toast } from "sonner";
import {
  closeDailyClosing,
  fetchDailyClosing,
  fetchDailyClosingHistory,
  reopenDailyClosing,
} from "./api";
import VariancePanel from "./VariancePanel";
import { StatusPill, formatDateTime, money, todayInput } from "./shared";
import { PAYMENT_METHOD_LABELS, SOURCE_LABELS } from "./types";
import type { DailyClosingHistoryRow, DailyClosingReport } from "./types";

interface Props {
  reloadKey: number;
  onChanged: () => void;
}

const DailyClosingTab: React.FC<Props> = ({ reloadKey, onChanged }) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const [date, setDate] = useState(todayInput());
  const [report, setReport] = useState<DailyClosingReport | null>(null);
  const [history, setHistory] = useState<DailyClosingHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [decision, setDecision] = useState<"close" | "reopen" | null>(null);
  const [notes, setNotes] = useState("");

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError("");
    Promise.all([fetchDailyClosing(date), fetchDailyClosingHistory(14)])
      .then(([reportData, historyData]) => {
        if (!alive) return;
        setReport(reportData);
        setHistory(Array.isArray(historyData) ? historyData : []);
      })
      .catch((e) => alive && setError(e.message || "فشل جلب إغلاق اليوم"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [date, reloadKey]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  const submitDecision = async () => {
    if (!decision || !report) return;
    try {
      setWorking(true);
      if (decision === "close") {
        await closeDailyClosing(report.date, notes.trim() || undefined);
        toast.success(isEn ? "Day closed" : "تم إغلاق اليوم");
      } else {
        if (!report.closing?.id) return;
        await reopenDailyClosing(report.closing.id, notes.trim() || undefined);
        toast.success(isEn ? "Day reopened" : "تم إعادة فتح اليوم");
      }
      setDecision(null);
      setNotes("");
      load();
      onChanged();
    } catch (e: any) {
      toast.error(e.message || (isEn ? "Operation failed" : "فشل تنفيذ العملية"));
    } finally {
      setWorking(false);
    }
  };

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

  const status = report?.status || "OPEN";
  const isClosed = status === "CLOSED";
  const byMethod = Object.entries(report?.payments.byMethod || {});
  const bySource = Object.entries(report?.payments.bySource || {});

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LockKeyhole className={`w-4 h-4 ${isClosed ? "text-success" : "text-muted-foreground"}`} />
          <h3 className="text-sm font-semibold text-foreground">
            {isEn ? "Daily closing (Z-Report)" : "الإغلاق اليومي (Z-Report)"}
          </h3>
          {isClosed ? (
            <StatusPill tone="success">{isEn ? "Closed" : "مغلق"}</StatusPill>
          ) : status === "REOPENED" ? (
            <StatusPill tone="warning">{isEn ? "Reopened" : "أُعيد فتحه"}</StatusPill>
          ) : (
            <StatusPill tone="muted">{isEn ? "Open" : "مفتوح"}</StatusPill>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background font-mono"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label={isEn ? "Closing date" : "تاريخ الإغلاق"}
          />
          <button
            type="button"
            onClick={load}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted"
            aria-label={isEn ? "Refresh" : "تحديث"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          {isClosed ? (
            <button
              type="button"
              onClick={() => {
                setDecision("reopen");
                setNotes("");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-warning/30 bg-warning/10 text-warning text-[11px] font-semibold hover:bg-warning/20"
            >
              <Unlock className="w-3.5 h-3.5" />
              {isEn ? "Reopen" : "إعادة فتح"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDecision("close");
                setNotes("");
              }}
              disabled={loading || !report}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isEn ? "Close day" : "إغلاق اليوم"}
            </button>
          )}
        </div>
      </div>

      {report?.warnings?.length ? (
        <div className="rounded-xl border border-warning/20 bg-warning/10 p-3 text-[11px] text-warning space-y-1">
          {report.warnings.map((warning) => (
            <div key={warning} className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2.5">
        {[
          { label: isEn ? "Collected (gross)" : "المحصل الإجمالي", value: report?.payments.gross || 0, tone: "text-foreground" },
          { label: isEn ? "Net after reversals" : "الصافي بعد الإلغاءات", value: report?.payments.net || 0, tone: "text-success" },
          { label: isEn ? "Cash" : "كاش", value: report?.payments.byMethod["CASH"]?.amount || 0, tone: "text-foreground" },
          { label: isEn ? "Card / online" : "بطاقة / أونلاين", value: report?.payments.byMethod["CARD"]?.amount || 0, tone: "text-primary" },
          { label: isEn ? "Treasury net" : "صافي الخزينة", value: report?.treasury.net || 0, tone: "text-foreground" },
          {
            label: isEn ? "Drawer difference" : "فرق الدرج",
            value: report?.cashier.difference || 0,
            tone: Math.abs(report?.cashier.difference || 0) > 0.009 ? "text-destructive" : "text-success",
          },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border/70 bg-card p-3">
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
            <p className={`text-sm font-bold font-mono tabular-nums mt-1 ${item.tone}`}>
              {money(item.value)} {isEn ? "EGP" : "ج.م"}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border/70 bg-card p-4">
          <h4 className="text-xs font-semibold text-foreground">{isEn ? "By method" : "حسب طريقة الدفع"}</h4>
          <div className="mt-3 space-y-1.5">
            {byMethod.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">{isEn ? "No payments" : "لا توجد مدفوعات"}</p>
            ) : (
              byMethod.map(([method, row]) => (
                <div key={method} className="flex items-center justify-between text-[11px] border-b border-border/40 last:border-0 py-1">
                  <span>{isEn ? PAYMENT_METHOD_LABELS[method]?.en || method : PAYMENT_METHOD_LABELS[method]?.ar || method}</span>
                  <span className="font-mono tabular-nums">{money(row.amount)} · {row.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4">
          <h4 className="text-xs font-semibold text-foreground">{isEn ? "By source" : "حسب المصدر"}</h4>
          <div className="mt-3 space-y-1.5">
            {bySource.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">{isEn ? "No payments" : "لا توجد مدفوعات"}</p>
            ) : (
              bySource.map(([source, row]) => (
                <div key={source} className="flex items-center justify-between text-[11px] border-b border-border/40 last:border-0 py-1">
                  <span>{isEn ? SOURCE_LABELS[source]?.en || source : SOURCE_LABELS[source]?.ar || source}</span>
                  <span className="font-mono tabular-nums">{money(row.amount)} · {row.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-4 space-y-2">
          <h4 className="text-xs font-semibold text-foreground">{isEn ? "Treasury & wallets" : "الخزينة والمحافظ"}</h4>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">{isEn ? "Deposits" : "إيداعات"}</span>
            <span className="font-mono tabular-nums text-success">{money(report?.treasury.deposits || 0)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">{isEn ? "Expenses" : "مصروفات"}</span>
            <span className="font-mono tabular-nums text-destructive">{money(report?.treasury.expenses || 0)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">{isEn ? "Wallet top-ups" : "شحن محافظ"}</span>
            <span className="font-mono tabular-nums">{money(report?.walletTopups.total || 0)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">{isEn ? "Wallet purchases" : "شراء من المحفظة"}</span>
            <span className="font-mono tabular-nums">{money(report?.walletPurchases || 0)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
          <h4 className="text-xs font-semibold text-foreground">{isEn ? "Cashier shifts" : "شيفتات الكاشير"}</h4>
          <span className="text-[10px] text-muted-foreground font-mono">
            {report?.cashier.shifts.length || 0}
          </span>
        </div>
        {(report?.cashier.shifts.length || 0) === 0 ? (
          <p className="p-4 text-[11px] text-muted-foreground">{isEn ? "No shifts" : "لا توجد شيفتات"}</p>
        ) : (
          <div className="divide-y divide-border/60">
            {report?.cashier.shifts.map((shift) => (
              <div key={shift.id} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                <div>
                  <span className="font-semibold text-foreground">{shift.cashierName}</span>
                  {shift.status === "OPEN" ? (
                    <StatusPill tone="warning">{isEn ? "Open" : "مفتوح"}</StatusPill>
                  ) : (
                    <StatusPill tone="muted">{isEn ? "Closed" : "مغلق"}</StatusPill>
                  )}
                  <p className="text-muted-foreground font-mono">
                    <span dir="ltr">{formatDateTime(shift.openedAt)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-4 font-mono tabular-nums">
                  <span className="text-muted-foreground">{isEn ? "Expected" : "متوقع"}: {money(shift.expected)}</span>
                  <span>{isEn ? "Actual" : "فعلي"}: {shift.actual === null ? "—" : money(shift.actual)}</span>
                  {shift.difference !== null && shift.difference !== undefined ? (
                    <span className={Math.abs(shift.difference) < 0.01 ? "text-success" : "text-destructive"}>
                      {money(shift.difference)}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
          <h4 className="text-xs font-semibold text-foreground">{isEn ? "Closing history" : "سجل الإغلاق اليومي"}</h4>
          <span className="text-[10px] text-muted-foreground font-mono">{history.length}</span>
        </div>
        {history.length === 0 ? (
          <p className="p-4 text-[11px] text-muted-foreground">{isEn ? "No closings yet" : "لا يوجد إغلاق بعد"}</p>
        ) : (
          <div className="divide-y divide-border/60">
            {history.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setDate(String(row.date).slice(0, 10))}
                className="w-full px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-start hover:bg-muted/40"
              >
                <div>
                  <span className="font-mono font-semibold text-foreground">
                    <span dir="ltr">{String(row.date).slice(0, 10)}</span>
                  </span>
                  {row.status === "CLOSED" ? (
                    <StatusPill tone="success">{isEn ? "Closed" : "مغلق"}</StatusPill>
                  ) : (
                    <StatusPill tone="warning">{isEn ? "Reopened" : "أُعيد فتحه"}</StatusPill>
                  )}
                  <p className="text-muted-foreground">
                    {row.closedByName || "—"} · <span dir="ltr">{formatDateTime(row.closedAt)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-4 font-mono tabular-nums">
                  <span>{isEn ? "Gross" : "إجمالي"}: {money(row.totalGross)}</span>
                  <span>{isEn ? "Cash" : "كاش"}: {money(row.cashTotal)}</span>
                  <span className={Math.abs(row.cashierDifference) < 0.01 ? "text-success" : "text-destructive"}>
                    {isEn ? "Diff" : "فرق"}: {money(row.cashierDifference)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {decision ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-3"
          dir={isEn ? "ltr" : "rtl"}
          onClick={() => setDecision(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card shadow-2xl p-4 space-y-3"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={decision === "close" ? (isEn ? "Close day" : "إغلاق اليوم") : isEn ? "Reopen day" : "إعادة فتح اليوم"}
          >
            <h3 className="text-sm font-bold text-foreground">
              {decision === "close"
                ? isEn ? "Close the day?" : "إغلاق اليوم؟"
                : isEn ? "Reopen the day?" : "إعادة فتح اليوم؟"}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {decision === "close"
                ? isEn
                  ? "The report is snapshotted and new payments for this day will be blocked."
                  : "هيتم حفظ التقرير كصورة نهائية، وأي حركة مالية جديدة على اليوم ده هتتقفل."
                : isEn
                ? "Reopening lets you record or correct payments again; the action is audited."
                : "إعادة الفتح بتسمح بتسجيل أو تصحيح مدفوعات تاني، والعملية بتتسجل في التدقيق."}
            </p>
            <input
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={decision === "close" ? (isEn ? "Notes (optional)" : "ملاحظات (اختياري)") : isEn ? "Reopen reason (optional)" : "سبب إعادة الفتح (اختياري)"}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDecision(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-muted text-foreground"
              >
                {isEn ? "Cancel" : "تراجع"}
              </button>
              <button
                type="button"
                onClick={submitDecision}
                disabled={working}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-50 ${
                  decision === "close"
                    ? "bg-primary text-primary-foreground"
                    : "bg-warning text-foreground"
                }`}
              >
                {working ? (isEn ? "Working..." : "جارٍ التنفيذ...") : isEn ? "Confirm" : "تأكيد"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <VariancePanel isEn={isEn} reloadKey={reloadKey} />
    </div>
  );
};

export default DailyClosingTab;

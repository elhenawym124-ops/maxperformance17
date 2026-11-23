import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CalendarClock, RefreshCw, Wallet } from "lucide-react";
import { fetchDues } from "./api";
import { EmptyState, StatusPill, formatDate, money } from "./shared";
import type { DuesResponse } from "./types";

export interface CollectTarget {
  enrollmentId?: string;
  groupMemberId?: string;
  studentId?: string;
  packageId?: string;
  label: string;
  remaining: number;
}

interface Props {
  reloadKey: number;
  onCollect: (target: CollectTarget) => void;
}

const DuesTab: React.FC<Props> = ({ reloadKey, onCollect }) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const [data, setData] = useState<DuesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fetchDues()
      .then((res) => alive && setData(res))
      .catch((e) => alive && setError(e.message || "فشل جلب المستحقات"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  return (
    <div className="space-y-4">
      {error ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          <span>{error}</span>
          <button type="button" onClick={load} className="inline-flex items-center gap-1 font-semibold">
            <RefreshCw className="w-3.5 h-3.5" />
            {isEn ? "Retry" : "إعادة المحاولة"}
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/70 bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
            <Wallet className="w-3.5 h-3.5" />
            <span>{isEn ? "Package balance due" : "متبقي على التسجيلات"}</span>
          </div>
          <p className="text-lg font-bold font-mono tabular-nums text-warning mt-1">
            {money(data?.totals.enrollmentsRemaining)} {isEn ? "EGP" : "ج.م"}
          </p>
          <p className="text-[11px] text-muted-foreground font-mono">
            {data?.totals.enrollmentsCount || 0} {isEn ? "enrollments" : "تسجيل"}
          </p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
            <CalendarClock className="w-3.5 h-3.5" />
            <span>{isEn ? "Group renewals due" : "تجديدات المجموعات المستحقة"}</span>
          </div>
          <p className="text-lg font-bold font-mono tabular-nums text-warning mt-1">
            {money(data?.totals.groupRenewalsRemaining)} {isEn ? "EGP" : "ج.م"}
          </p>
          <p className="text-[11px] text-muted-foreground font-mono">
            {data?.totals.groupRenewalsCount || 0} {isEn ? "members" : "عضو"}
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-border/70 bg-card overflow-hidden">
        <header className="px-4 py-3 border-b border-border/70 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">{isEn ? "Package dues" : "مستحقات الباقات"}</h3>
          {loading ? <RefreshCw className="w-3.5 h-3.5 text-muted-foreground animate-spin" /> : null}
        </header>
        {!loading && (data?.enrollments.length || 0) === 0 ? (
          <EmptyState title={isEn ? "No package dues" : "لا توجد مستحقات باقات"} />
        ) : (
          <div className="divide-y divide-border/60">
            {(data?.enrollments || []).map((due) => (
              <div key={due.enrollmentId} className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-foreground">{due.studentName}</span>
                    {due.studentCode ? (
                      <span className="text-[10px] font-mono text-muted-foreground">{due.studentCode}</span>
                    ) : null}
                    {due.overdueCount > 0 ? (
                      <StatusPill tone="danger">
                        {isEn ? `${due.overdueCount} overdue` : `${due.overdueCount} قسط متأخر`}
                      </StatusPill>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {[due.packageName, due.subjectName].filter(Boolean).join(" · ") || "—"}
                    {due.nextDueDate ? ` · ${isEn ? "next due" : "الاستحقاق"}: ` : ""}
                    {due.nextDueDate ? <span dir="ltr">{formatDate(due.nextDueDate)}</span> : null}
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="text-end">
                    <p className="text-[10px] text-muted-foreground">{isEn ? "Remaining" : "المتبقي"}</p>
                    <p className="text-xs font-bold font-mono tabular-nums text-warning">
                      {money(due.remaining)} {isEn ? "EGP" : "ج.م"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onCollect({
                        enrollmentId: due.enrollmentId,
                        studentId: due.studentId,
                        packageId: due.packageId || undefined,
                        label: `${due.studentName}${due.packageName ? ` - ${due.packageName}` : ""}`,
                        remaining: due.remaining,
                      })
                    }
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-transform"
                  >
                    {isEn ? "Collect" : "تحصيل"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border/70 bg-card overflow-hidden">
        <header className="px-4 py-3 border-b border-border/70 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">{isEn ? "Group renewals" : "تجديدات المجموعات"}</h3>
          {!loading && (data?.groupRenewals.length || 0) > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-warning">
              <AlertTriangle className="w-3.5 h-3.5" />
              {data?.groupRenewals.length}
            </span>
          ) : null}
        </header>
        {!loading && (data?.groupRenewals.length || 0) === 0 ? (
          <EmptyState title={isEn ? "No group renewals due" : "لا توجد تجديدات مستحقة"} />
        ) : (
          <div className="divide-y divide-border/60">
            {(data?.groupRenewals || []).map((due) => (
              <div key={due.groupMemberId} className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-foreground">{due.studentName}</span>
                    <span className="text-[10px] text-muted-foreground">{due.groupName}</span>
                    {due.paymentStatus === "PARTIAL" ? (
                      <StatusPill tone="warning">{isEn ? "Partial" : "جزئي"}</StatusPill>
                    ) : due.paymentStatus === "PAID" ? (
                      <StatusPill tone="success">{isEn ? "Paid" : "مسدد"}</StatusPill>
                    ) : (
                      <StatusPill tone="danger">{isEn ? "Unpaid" : "غير مسدد"}</StatusPill>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {isEn ? "Fee" : "الرسوم"}: {money(due.feeAmount)} · {isEn ? "Paid" : "المدفوع"}: {money(due.paid)}
                    {due.nextRenewalDate ? ` · ${isEn ? "renew" : "التجديد"}: ` : ""}
                    {due.nextRenewalDate ? <span dir="ltr">{formatDate(due.nextRenewalDate)}</span> : null}
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="text-end">
                    <p className="text-[10px] text-muted-foreground">{isEn ? "Remaining" : "المتبقي"}</p>
                    <p className="text-xs font-bold font-mono tabular-nums text-warning">
                      {money(due.remaining)} {isEn ? "EGP" : "ج.م"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onCollect({
                        groupMemberId: due.groupMemberId,
                        label: `${due.studentName} — ${due.groupName}`,
                        remaining: Math.max(0, due.remaining),
                      })
                    }
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-transform"
                  >
                    {due.paymentStatus === "PAID" ? (isEn ? "Renew" : "تجديد") : isEn ? "Collect" : "تحصيل"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DuesTab;

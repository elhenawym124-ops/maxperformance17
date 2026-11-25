import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CalendarClock, Download, RefreshCw, Wallet } from "lucide-react";
import { downloadStatement, fetchDues, notifyStatementDue, setMemberDiscount } from "./api";
import { EmptyState, StatusPill, formatDate, money } from "./shared";
import type { DuesResponse } from "./types";

type RangePreset = "all" | "overdue" | "today" | "7" | "30" | "custom";

const isoDay = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

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
  const [preset, setPreset] = useState<RangePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const range = useMemo(() => {
    switch (preset) {
      case "overdue":
        return { from: undefined, to: isoDay(-1) };
      case "today":
        return { from: isoDay(0), to: isoDay(0) };
      case "7":
        return { from: isoDay(0), to: isoDay(7) };
      case "30":
        return { from: isoDay(0), to: isoDay(30) };
      case "custom":
        return { from: customFrom || undefined, to: customTo || undefined };
      default:
        return {};
    }
  }, [preset, customFrom, customTo]);

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fetchDues(range)
      .then((res) => alive && setData(res))
      .catch((e) => alive && setError(e.message || "فشل جلب المستحقات"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [reloadKey, range.from, range.to]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  const hasRows =
    (data?.enrollments.length || 0) > 0 || (data?.groupRenewals.length || 0) > 0;

  const exportCsv = () => {
    const escape = (value: unknown) => {
      const text = value === null || value === undefined ? "" : String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const header = isEn
      ? ["Kind", "Student", "Code", "Group", "Package", "Remaining", "Overdue count", "Overdue amount", "Due today", "In range", "Next due"]
      : ["النوع", "الطالب", "الكود", "الجروب", "الباقة", "المتبقي", "أقساط متأخرة", "قيمة المتأخر", "مستحق اليوم", "مستحق في الفترة", "أقرب استحقاق"];
    const lines = [header.join(",")];
    for (const row of data?.enrollments || []) {
      lines.push(
        [
          isEn ? "Package" : "باقة",
          row.studentName,
          row.studentCode || "",
          "",
          [row.packageName, row.subjectName].filter(Boolean).join(" / "),
          row.remaining,
          row.overdueCount || 0,
          row.overdueAmount || 0,
          row.dueTodayAmount || 0,
          row.windowAmount || 0,
          row.nextDueDate ? new Date(row.nextDueDate).toISOString().slice(0, 10) : "",
        ].map(escape).join(","),
      );
    }
    for (const row of data?.groupRenewals || []) {
      lines.push(
        [
          isEn ? "Group renewal" : "تجديد جروب",
          row.studentName,
          "",
          row.groupName || "",
          `${isEn ? "Fee" : "رسوم"}: ${row.feeAmount} / ${isEn ? "Paid" : "مدفوع"}: ${row.paid}`,
          row.remaining,
          "",
          "",
          "",
          "",
          row.nextRenewalDate ? new Date(row.nextRenewalDate).toISOString().slice(0, 10) : "",
        ].map(escape).join(","),
      );
    }
    const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `education-dues-${isoDay(0)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  const presets: Array<{ key: RangePreset; ar: string; en: string }> = [
    { key: "all", ar: "الكل", en: "All" },
    { key: "overdue", ar: "متأخر", en: "Overdue" },
    { key: "today", ar: "النهارده", en: "Today" },
    { key: "7", ar: "خلال 7 أيام", en: "Next 7 days" },
    { key: "30", ar: "خلال 30 يوم", en: "Next 30 days" },
    { key: "custom", ar: "مدى مخصص", en: "Custom" },
  ];

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

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2">
        <span className="text-[11px] font-semibold text-muted-foreground">
          {isEn ? "Due window" : "فترة الاستحقاق"}
        </span>
        {presets.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setPreset(item.key)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              preset === item.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {isEn ? item.en : item.ar}
          </button>
        ))}
        {preset === "custom" ? (
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-background border border-input rounded-lg px-2 py-1 text-[11px] text-foreground"
              aria-label={isEn ? "From" : "من"}
            />
            <span className="text-[11px] text-muted-foreground">→</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-background border border-input rounded-lg px-2 py-1 text-[11px] text-foreground"
              aria-label={isEn ? "To" : "إلى"}
            />
          </div>
        ) : null}
        <button
          type="button"
          onClick={exportCsv}
          disabled={!hasRows}
          className="ms-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-[11px] font-semibold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" />
          {isEn ? "Export CSV" : "تصدير CSV"}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            <span>{isEn ? "Overdue" : "متأخرات"}</span>
          </div>
          <p className="text-lg font-bold font-mono tabular-nums text-destructive mt-1">
            {money(data?.totals.overdueAmount || 0)} {isEn ? "EGP" : "ج.م"}
          </p>
          <p className="text-[11px] text-muted-foreground font-mono">
            {data?.totals.overdueStudents || 0} {isEn ? "students" : "طالب"}
          </p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
            <CalendarClock className="w-3.5 h-3.5" />
            <span>{isEn ? "Due today / in window" : "النهارده / في الفترة"}</span>
          </div>
          <p className="text-lg font-bold font-mono tabular-nums text-foreground mt-1">
            {money(data?.totals.windowAmount || 0)} {isEn ? "EGP" : "ج.م"}
          </p>
          <p className="text-[11px] text-muted-foreground font-mono">
            {isEn
              ? `${data?.totals.dueTodayCount || 0} today · ${data?.totals.windowCount || 0} in range`
              : `${data?.totals.dueTodayCount || 0} النهارده · ${data?.totals.windowCount || 0} في الفترة`}
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm(isEn
                  ? "Send a WhatsApp statement reminder to every parent with an outstanding balance?"
                  : "إرسال إشعار كشف حساب لكل ولي أمر عليه متبقي؟")) return;
                try {
                  const result = await notifyStatementDue({ months: 12 });
                  window.alert(
                    isEn
                      ? `Sent ${result.sent} · skipped ${result.skipped} · failed ${result.failed}`
                      : `تم إرسال ${result.sent} · تخطي ${result.skipped} · فشل ${result.failed}`
                  );
                  load();
                } catch (e: any) {
                  window.alert(e.message || (isEn ? "Failed to send reminders" : "فشل إرسال الإشعارات"));
                }
              }}
              className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-semibold text-foreground hover:bg-muted"
            >
              {isEn ? "Statement reminder" : "إشعار المتأخرات"}
            </button>
            {loading ? <RefreshCw className="w-3.5 h-3.5 text-muted-foreground animate-spin" /> : null}
          </div>
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
                    {(range.from || range.to) && (due.windowCount || 0) > 0 ? (
                      <StatusPill tone="warning">
                        {isEn ? `${due.windowCount} in range` : `${due.windowCount} في الفترة`}
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
                    onClick={async () => {
                      try {
                        await downloadStatement(due.studentId, "pdf");
                      } catch (e: any) {
                        window.alert(e.message || (isEn ? "Failed to export statement" : "فشل تصدير كشف الحساب"));
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-border text-muted-foreground hover:bg-muted"
                  >
                    {isEn ? "Statement" : "كشف"}
                  </button>
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
                    {due.discountAmount ? ` · ${isEn ? "Discount" : "خصم"}: ${money(due.discountAmount)}` : ""}
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
                    onClick={async () => {
                      const input = window.prompt(
                        isEn ? "Standing discount on this member (EGP)" : "خصم دائم على هذا العضو (ج.م)",
                        String(due.discountAmount || 0)
                      );
                      if (input === null) return;
                      const amount = Number(input);
                      if (!Number.isFinite(amount) || amount < 0) {
                        window.alert(isEn ? "Invalid amount" : "قيمة غير صحيحة");
                        return;
                      }
                      try {
                        await setMemberDiscount(due.groupMemberId, amount);
                        load();
                      } catch (e: any) {
                        window.alert(e.message || (isEn ? "Failed to apply discount" : "فشل تطبيق الخصم"));
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-border text-muted-foreground hover:bg-muted"
                  >
                    {isEn ? "Discount" : "خصم"}
                  </button>
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

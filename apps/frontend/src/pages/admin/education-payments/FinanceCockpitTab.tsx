import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { completeWinback, fetchAttendanceLink, fetchCockpit, fetchWinback, syncWinback } from "./api";
import { money } from "./shared";
import type { AttendanceLinkReport, FinanceCockpit, WinbackAction } from "./types";

const severityTone = (severity: string) => {
  if (severity === "HIGH") return "border-destructive/30 bg-destructive/10 text-destructive";
  if (severity === "MEDIUM") return "border-warning/30 bg-warning/10 text-warning";
  return "border-border/70 bg-muted/40 text-muted-foreground";
};

export const FinanceCockpitTab: React.FC<{ isEn: boolean; reloadKey?: number }> = ({ isEn, reloadKey }) => {
  const [months, setMonths] = useState(6);
  const [data, setData] = useState<FinanceCockpit | null>(null);
  const [link, setLink] = useState<AttendanceLinkReport | null>(null);
  const [winback, setWinback] = useState<WinbackAction[]>([]);
  const [winbackBusy, setWinbackBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fetchCockpit(months)
      .then((payload) => alive && setData(payload))
      .catch((err) => alive && setError(err.message || (isEn ? "Failed to load" : "فشل التحميل")))
      .finally(() => alive && setLoading(false));
    fetchAttendanceLink(3)
      .then((payload) => alive && setLink(payload))
      .catch(() => {});
    fetchWinback("OPEN")
      .then((rows) => alive && setWinback(rows))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [months, isEn]);

  const handleSyncWinback = async () => {
    setWinbackBusy(true);
    try {
      await syncWinback(3);
      const rows = await fetchWinback("OPEN");
      setWinback(rows);
    } catch {
      /* silent: the card simply keeps its previous list */
    } finally {
      setWinbackBusy(false);
    }
  };

  const handleCompleteWinback = async (id: string) => {
    try {
      await completeWinback(id, "DONE");
      setWinback((rows) => rows.filter((row) => row.id !== id));
    } catch {
      /* keep the row so the user can retry */
    }
  };

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load, reloadKey]);

  const summary = data?.summary;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold text-foreground">
          {isEn ? "Finance cockpit" : "النظرة المالية الشاملة"}
        </h3>
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
            className="p-1.5 rounded-lg border border-border/70 text-muted-foreground hover:bg-muted"
            aria-label={isEn ? "Refresh" : "تحديث"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>
      ) : null}

      {loading && !data ? (
        <div className="rounded-xl border border-border/70 bg-card p-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          {isEn ? "Loading..." : "جارٍ التحميل..."}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              {
                label: isEn ? "This month" : "إيراد الشهر",
                value: money(summary?.monthCollected || 0),
                hint: summary?.monthGrowth === null || summary?.monthGrowth === undefined
                  ? null
                  : `${summary.monthGrowth > 0 ? "+" : ""}${summary.monthGrowth}%`,
                tone: "text-success",
              },
              {
                label: isEn ? "Collection rate" : "نسبة التحصيل",
                value: summary?.collectionRate === null || summary?.collectionRate === undefined ? "—" : `${summary.collectionRate}%`,
                hint: `${money(summary?.collected || 0)} / ${money(summary?.billed || 0)}`,
                tone: "text-primary",
              },
              {
                label: isEn ? "Open dues" : "مستحقات مفتوحة",
                value: money(summary?.openDues || 0),
                hint: summary?.openDuesMembers ? `${summary.openDuesMembers} ${isEn ? "items" : "عضو"}` : null,
                tone: (summary?.openDues || 0) > 0 ? "text-warning" : "text-muted-foreground",
              },
              {
                label: isEn ? "Cash variance" : "فروق النقدية",
                value: money(summary?.varianceNet || 0),
                hint: summary?.shortCloses ? `${summary.shortCloses} ${isEn ? "short" : "عجز"}` : null,
                tone: (summary?.varianceNet || 0) < 0 ? "text-destructive" : "text-foreground",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border/70 bg-card p-3">
                <span className="text-[10px] text-muted-foreground">{item.label}</span>
                <p className={`text-sm font-bold font-mono tabular-nums mt-1 ${item.tone}`}>{item.value}</p>
                {item.hint ? (
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{item.hint}</p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { label: isEn ? "Coupon discounts" : "خصومات الكوبونات", value: summary?.couponDiscounts || 0 },
              { label: isEn ? "Waivers" : "إعفاءات", value: summary?.waiversValue || 0 },
              { label: isEn ? "Total discount impact" : "إجمالي أثر الخصومات", value: summary?.discountImpact || 0 },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border/70 bg-card px-3 py-2 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{item.label}</span>
                <span className="text-[11px] font-bold font-mono tabular-nums text-destructive">
                  −{money(item.value)}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground">{isEn ? "Attendance × collections" : "الغياب × التحصيل"}</h4>
              <span className="text-[10px] text-muted-foreground font-mono">
                {isEn ? "last 3 months" : "آخر 3 شهور"}
              </span>
            </div>
            {(link?.summary.students || 0) === 0 ? (
              <p className="p-4 text-[11px] text-muted-foreground">
                {isEn ? "No attendance records to correlate yet" : "لا توجد سجلات حضور للربط بعد"}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-3 divide-x divide-border/60 border-b border-border/60 text-center">
                  {[
                    { label: isEn ? "Low attendance" : "حضور منخفض", value: String(link?.summary.lowAttendance || 0), tone: "text-warning" },
                    { label: isEn ? "Low + owes" : "غياب + متبقي", value: String(link?.summary.overlap || 0), tone: "text-destructive" },
                    { label: isEn ? "At-risk amount" : "مبلغ معرّض", value: money(link?.summary.riskAmount || 0), tone: "text-destructive" },
                  ].map((item) => (
                    <div key={item.label} className="p-2.5">
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      <p className={`text-xs font-bold font-mono tabular-nums mt-0.5 ${item.tone}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <p className="px-4 py-2 text-[10px] text-muted-foreground font-mono">
                  {isEn
                    ? `Avg dues: ${money(link?.summary.avgDuesLowAttendance || 0)} (low attendance) vs ${money(link?.summary.avgDuesOthers || 0)} (others)`
                    : `متوسط المتبقي: ${money(link?.summary.avgDuesLowAttendance || 0)} (حضور منخفض) مقابل ${money(link?.summary.avgDuesOthers || 0)} (الباقي)`}
                </p>
                {(link?.risky.length || 0) > 0 ? (
                  <div className="divide-y divide-border/60 max-h-56 overflow-y-auto">
                    {link?.risky.slice(0, 10).map((row) => (
                      <div key={row.studentId} className="px-4 py-2 flex items-center justify-between gap-2 text-[11px]">
                        <div className="min-w-0">
                          <span className="font-semibold text-foreground truncate">{row.studentName || "—"}</span>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            {row.attendanceRate}% · {row.absent}/{row.totalSessions}
                            {row.phone ? ` · ${row.phone}` : ""}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono tabular-nums text-destructive font-bold">
                          {money(row.dues)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold text-foreground">{isEn ? "Win-back worklist" : "قائمة الاسترجاع"}</h4>
                <span className="text-[10px] text-muted-foreground font-mono">{winback.length}</span>
              </div>
              <button
                type="button"
                onClick={handleSyncWinback}
                disabled={winbackBusy}
                className="px-2.5 py-1 rounded-lg border border-border/70 text-[11px] font-semibold text-foreground hover:bg-muted disabled:opacity-50"
              >
                {winbackBusy ? (isEn ? "Syncing..." : "جارٍ التحديث...") : (isEn ? "Refresh list" : "تحديث القائمة")}
              </button>
            </div>
            {winback.length === 0 ? (
              <p className="p-4 text-[11px] text-muted-foreground">
                {isEn ? "No at-risk students queued" : "لا يوجد طلاب معرّضون في القائمة"}
              </p>
            ) : (
              <div className="divide-y divide-border/60 max-h-64 overflow-y-auto">
                {winback.slice(0, 10).map((action) => (
                  <div key={action.id} className="px-4 py-2 flex items-center justify-between gap-2 text-[11px]">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground truncate">{action.studentName || "—"}</span>
                        {(action.reasons || []).slice(0, 3).map((reason) => (
                          <span key={reason} className="px-1 py-0.5 rounded border border-warning/20 bg-warning/10 text-warning text-[9px] font-mono">
                            {reason}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {action.attendanceRate ?? "—"}% · {money(action.dues)}
                        {action.phone ? ` · ${action.phone}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCompleteWinback(action.id)}
                      className="shrink-0 px-2 py-1 rounded-lg border border-border/70 text-[10px] font-semibold text-success hover:bg-success/10"
                    >
                      {isEn ? "Done" : "تم"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground">{isEn ? "Needs attention" : "محتاج تدخّل"}</h4>
              <span className="text-[10px] text-muted-foreground font-mono">{data?.alerts.length || 0}</span>
            </div>
            {(data?.alerts.length || 0) === 0 ? (
              <div className="p-4 flex items-center gap-2 text-[11px] text-success">
                <ShieldCheck className="w-4 h-4" />
                {isEn ? "Everything is balanced" : "كل المؤشرات سليمة"}
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {data?.alerts.map((alert) => (
                  <div key={alert.code} className="px-4 py-2.5 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-mono ${severityTone(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <p className="text-[11px] text-foreground mt-1">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FinanceCockpitTab;

import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, Loader2, RefreshCw } from "lucide-react";
import { fetchAttendanceReport } from "./api";
import type { AttendanceReport } from "./types";

const rateTone = (value: number | null) => {
  if (value === null) return "text-muted-foreground";
  if (value >= 90) return "text-success";
  if (value >= 70) return "text-warning";
  return "text-destructive";
};

export const EducationAttendanceTab: React.FC<{ isEn: boolean }> = ({ isEn }) => {
  const [months, setMonths] = useState(3);
  const [data, setData] = useState<AttendanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fetchAttendanceReport(months)
      .then((payload) => alive && setData(payload))
      .catch((err) => alive && setError(err.message || (isEn ? "Failed to load" : "فشل التحميل")))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [months, isEn]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  const summary = data?.summary;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{isEn ? "Attendance & retention" : "الحضور والالتزام"}</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card p-1">
            {[1, 3, 6].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMonths(value)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  months === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {value} {isEn ? "mo" : "شهر"}
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
                label: isEn ? "Attendance rate" : "نسبة الحضور",
                value: summary?.attendanceRate === null || summary?.attendanceRate === undefined ? "—" : `${summary.attendanceRate}%`,
                tone: rateTone(summary?.attendanceRate ?? null),
              },
              { label: isEn ? "Records" : "سجلات", value: String(summary?.records || 0), tone: "text-foreground" },
              {
                label: isEn ? "At-risk students" : "طلاب معرّضون",
                value: String(summary?.atRiskStudents || 0),
                tone: (summary?.atRiskStudents || 0) > 0 ? "text-destructive" : "text-muted-foreground",
              },
              {
                label: isEn ? "Absences" : "غياب",
                value: `${summary?.absent || 0}`,
                hint: `${summary?.excused || 0} ${isEn ? "excused" : "بعذر"}`,
                tone: "text-warning",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border/70 bg-card p-3">
                <span className="text-[10px] text-muted-foreground">{item.label}</span>
                <p className={`text-sm font-bold font-mono tabular-nums mt-1 ${item.tone}`}>{item.value}</p>
                {"hint" in item && item.hint ? (
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{item.hint}</p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground">{isEn ? "Group attendance" : "حضور المجموعات"}</h4>
              <span className="text-[10px] text-muted-foreground font-mono">{summary?.groups || 0}</span>
            </div>
            {(data?.byGroup.length || 0) === 0 ? (
              <p className="p-4 text-[11px] text-muted-foreground">{isEn ? "No group attendance yet" : "لا يوجد حضور مجموعات بعد"}</p>
            ) : (
              <div className="divide-y divide-border/60">
                {data?.byGroup.map((row) => (
                  <div key={row.groupId} className="px-4 py-2 flex items-center justify-between gap-3 text-[11px]">
                    <div className="min-w-0">
                      <span className="font-semibold text-foreground truncate">{row.name}</span>
                      {row.atRisk ? (
                        <span className="ms-2 px-1.5 py-0.5 rounded border border-destructive/20 bg-destructive/10 text-destructive text-[10px]">
                          {isEn ? "low" : "منخفض"}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-4 shrink-0 font-mono tabular-nums">
                      <span className="text-muted-foreground">{row.students} {isEn ? "std" : "طالب"}</span>
                      <span className="text-muted-foreground">{row.present}/{row.total}</span>
                      <span className={`font-semibold ${rateTone(row.rate)}`}>
                        {row.rate === null ? "—" : `${row.rate}%`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground">{isEn ? "At-risk students" : "طلاب معرّضون للتسرب"}</h4>
              <span className="text-[10px] text-muted-foreground font-mono">{data?.atRisk.length || 0}</span>
            </div>
            {(data?.atRisk.length || 0) === 0 ? (
              <p className="p-4 text-[11px] text-success">
                {isEn ? "Every student attends at least 70% of sessions" : "كل الطلاب حضورهم 70% أو أكثر"}
              </p>
            ) : (
              <div className="divide-y divide-border/60">
                {data?.atRisk.map((row) => (
                  <div key={row.studentId} className="px-4 py-2 flex items-center justify-between gap-3 text-[11px]">
                    <span className="font-semibold text-foreground truncate">{row.studentName || row.firstName || "—"}</span>
                    <div className="flex items-center gap-4 shrink-0 font-mono tabular-nums">
                      <span className="text-muted-foreground">
                        {row.absent} {isEn ? "absent" : "غياب"} / {row.total}
                      </span>
                      <span className="text-destructive font-semibold">{row.rate}%</span>
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

export default EducationAttendanceTab;

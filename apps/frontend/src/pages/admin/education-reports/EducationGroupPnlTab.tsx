import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Wallet } from "lucide-react";
import { fetchGroupPnl } from "./api";
import type { GroupPnlReport } from "./types";

const money = (value: number) =>
  (Math.round((Number(value) || 0) * 100) / 100).toLocaleString("en-EG", { maximumFractionDigits: 2 });

export const EducationGroupPnlTab: React.FC<{ isEn: boolean }> = ({ isEn }) => {
  const [months, setMonths] = useState(3);
  const [data, setData] = useState<GroupPnlReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fetchGroupPnl(months)
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
          <Wallet className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{isEn ? "Group profitability" : "ربحية المجموعات"}</h3>
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
              { label: isEn ? "Collected" : "المحصّل", value: money(summary?.revenue || 0), tone: "text-success" },
              { label: isEn ? "Teacher cost" : "تكلفة المدرّسين", value: money(summary?.teacherCost || 0), tone: "text-warning" },
              { label: isEn ? "Net" : "الصافي", value: money(summary?.net || 0), tone: (summary?.net || 0) < 0 ? "text-destructive" : "text-foreground" },
              {
                label: isEn ? "Occupancy" : "نسبة الإشغال",
                value: summary?.occupancy === null || summary?.occupancy === undefined ? "—" : `${summary.occupancy}%`,
                hint: `${summary?.members || 0}/${summary?.capacity || 0}`,
                tone: "text-primary",
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

          {summary?.lossMaking ? (
            <p className="text-[11px] text-destructive font-semibold">
              {isEn
                ? `${summary.lossMaking} group(s) operating at a loss`
                : `${summary.lossMaking} مجموعة تعمل بخسارة`}
            </p>
          ) : null}

          <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground">{isEn ? "By group" : "حسب المجموعة"}</h4>
              <span className="text-[10px] text-muted-foreground font-mono">{summary?.groups || 0}</span>
            </div>
            {(data?.groups.length || 0) === 0 ? (
              <p className="p-4 text-[11px] text-muted-foreground">{isEn ? "No groups yet" : "لا توجد مجموعات بعد"}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="text-start px-4 py-2 font-medium">{isEn ? "Group" : "المجموعة"}</th>
                      <th className="text-start px-3 py-2 font-medium">{isEn ? "Members" : "أعضاء"}</th>
                      <th className="text-start px-3 py-2 font-medium">{isEn ? "Collected" : "المحصّل"}</th>
                      <th className="text-start px-3 py-2 font-medium">{isEn ? "Dues" : "مستحق"}</th>
                      <th className="text-start px-3 py-2 font-medium">{isEn ? "Teacher" : "المدرّس"}</th>
                      <th className="text-start px-3 py-2 font-medium">{isEn ? "Net" : "الصافي"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.groups.map((row) => (
                      <tr key={row.groupId} className="border-t border-border/60">
                        <td className="px-4 py-2">
                          <span className="font-semibold text-foreground">{row.name}</span>
                          {row.teacherName ? (
                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{row.teacherName}</p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 font-mono tabular-nums">
                          {row.members}
                          <span className="text-muted-foreground">
                            /{row.capacity}
                            {row.occupancy !== null ? ` (${row.occupancy}%)` : ""}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono tabular-nums text-success">{money(row.revenue)}</td>
                        <td className="px-3 py-2 font-mono tabular-nums text-warning">{money(row.dues)}</td>
                        <td className="px-3 py-2 font-mono tabular-nums text-muted-foreground">{money(row.teacherCost)}</td>
                        <td className={`px-3 py-2 font-mono tabular-nums font-bold ${row.net < 0 ? "text-destructive" : "text-foreground"}`}>
                          {money(row.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EducationGroupPnlTab;

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, TrendingUp } from "lucide-react";
import { fetchCollectionReport } from "./api";
import { money } from "./shared";
import type { CollectionReport } from "./types";

const rateTone = (value: number | null) => {
  if (value === null) return "text-muted-foreground";
  if (value >= 90) return "text-success";
  if (value >= 70) return "text-warning";
  return "text-destructive";
};

export const CollectionRateTab: React.FC<{ isEn: boolean; reloadKey?: number }> = ({ isEn, reloadKey }) => {
  const [months, setMonths] = useState(6);
  const [data, setData] = useState<CollectionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fetchCollectionReport(months)
      .then((report) => alive && setData(report))
      .catch((err) => alive && setError(err.message || (isEn ? "Failed to load" : "فشل التحميل")))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [months, isEn]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load, reloadKey]);

  const summary = data?.summary;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {isEn ? "Collections vs billed" : "التحصيل مقابل المستحق"}
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
              { label: isEn ? "Billed" : "المستحق", value: `${money(summary?.billed || 0)}`, tone: "text-foreground" },
              { label: isEn ? "Collected" : "المحصّل", value: `${money(summary?.collected || 0)}`, tone: "text-success" },
              {
                label: isEn ? "Collection rate" : "نسبة التحصيل",
                value: summary?.rate === null || summary?.rate === undefined ? "—" : `${summary.rate}%`,
                tone: rateTone(summary?.rate ?? null),
              },
              {
                label: isEn ? "Open dues (now)" : "مستحقات مفتوحة (الآن)",
                value: `${money(summary?.openDues || 0)}`,
                tone: summary?.openDues ? "text-warning" : "text-muted-foreground",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border/70 bg-card p-3">
                <span className="text-[10px] text-muted-foreground">{item.label}</span>
                <p className={`text-sm font-bold font-mono tabular-nums mt-1 ${item.tone}`}>
                  {item.value} {item.tone === "text-muted-foreground" ? "" : isEn ? "EGP" : "ج.م"}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground">{isEn ? "Monthly" : "شهريًا"}</h4>
              <span className="text-[10px] text-muted-foreground font-mono">
                {isEn ? "gap" : "الفجوة"}: {money(summary?.gap || 0)}
              </span>
            </div>
            {(data?.byMonth.length || 0) === 0 ? (
              <p className="p-4 text-[11px] text-muted-foreground">{isEn ? "No activity" : "لا يوجد نشاط"}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="text-start px-4 py-2 font-medium">{isEn ? "Month" : "الشهر"}</th>
                      <th className="text-start px-3 py-2 font-medium">{isEn ? "Billed" : "المستحق"}</th>
                      <th className="text-start px-3 py-2 font-medium">{isEn ? "Collected" : "المحصّل"}</th>
                      <th className="text-start px-3 py-2 font-medium">{isEn ? "Rate" : "النسبة"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.byMonth.map((row) => (
                      <tr key={row.month} className="border-t border-border/60">
                        <td className="px-4 py-2 font-mono"><span dir="ltr">{row.month}</span></td>
                        <td className="px-3 py-2 font-mono tabular-nums">{money(row.billed)}</td>
                        <td className="px-3 py-2 font-mono tabular-nums text-success">{money(row.collected)}</td>
                        <td className={`px-3 py-2 font-mono tabular-nums font-semibold ${rateTone(row.rate)}`}>
                          {row.rate === null ? "—" : `${row.rate}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/70">
              <h4 className="text-xs font-semibold text-foreground">{isEn ? "Per branch" : "لكل فرع"}</h4>
            </div>
            {(data?.byBranch.length || 0) === 0 ? (
              <p className="p-4 text-[11px] text-muted-foreground">{isEn ? "No branch data" : "لا توجد بيانات فروع"}</p>
            ) : (
              <div className="divide-y divide-border/60">
                {data?.byBranch.map((row) => (
                  <div key={row.id} className="px-4 py-2 flex items-center justify-between gap-3 text-[11px]">
                    <span className="font-semibold text-foreground truncate">{row.name}</span>
                    <div className="flex items-center gap-4 shrink-0 font-mono tabular-nums">
                      <span className="text-muted-foreground">{money(row.billed)}</span>
                      <span className="text-success">{money(row.collected)}</span>
                      <span className={`font-semibold ${rateTone(row.rate)}`}>
                        {row.rate === null ? "—" : `${row.rate}%`}
                      </span>
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

export default CollectionRateTab;

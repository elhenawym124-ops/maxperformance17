import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { fetchVarianceReport } from "./api";
import { money } from "./shared";
import type { VarianceReport } from "./types";

const toneFor = (difference: number) => {
  if (Math.abs(difference) < 0.01) return "text-success";
  return difference < 0 ? "text-destructive" : "text-warning";
};

export const VariancePanel: React.FC<{ isEn: boolean; reloadKey?: number }> = ({ isEn, reloadKey }) => {
  const [months, setMonths] = useState(6);
  const [data, setData] = useState<VarianceReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    fetchVarianceReport(months)
      .then((report) => alive && setData(report))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [months]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load, reloadKey]);

  const summary = data?.summary;

  return (
    <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-3.5 h-3.5 ${summary?.incidents ? "text-warning" : "text-muted-foreground"}`} />
          <h4 className="text-xs font-semibold text-foreground">{isEn ? "Cash variance" : "فروق النقدية"}</h4>
          <span className="text-[10px] text-muted-foreground font-mono">{summary?.incidents || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card p-1">
            {[3, 6, 12].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMonths(value)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                  months === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={load}
            className="p-1 rounded-lg border border-border/70 text-muted-foreground hover:bg-muted"
            aria-label={isEn ? "Refresh" : "تحديث"}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/60 border-b border-border/60 text-center">
        {[
          { label: isEn ? "Short" : "عجز", value: summary?.short || 0, tone: "text-destructive" },
          { label: isEn ? "Over" : "زيادة", value: summary?.over || 0, tone: "text-warning" },
          { label: isEn ? "Balanced" : "مطابق", value: summary?.balanced || 0, tone: "text-success" },
          {
            label: isEn ? "Net variance" : "صافي الفروق",
            value: `${money(summary?.netVariance || 0)}`,
            tone: toneFor(summary?.netVariance || 0),
          },
        ].map((item) => (
          <div key={item.label} className="p-2.5">
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
            <p className={`text-xs font-bold font-mono tabular-nums mt-0.5 ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {(data?.items.length || 0) === 0 ? (
        <p className="p-4 text-[11px] text-muted-foreground">
          {isEn ? "No variance recorded — every close balanced" : "لا توجد فروق — كل الإغلاقات مطابقة"}
        </p>
      ) : (
        <div className="divide-y divide-border/60 max-h-72 overflow-y-auto">
          {data?.items.slice(0, 20).map((item) => (
            <div key={`${item.kind}-${item.id}`} className="px-4 py-2 flex items-center justify-between gap-2 text-[11px]">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded border border-border/70 text-[10px] text-muted-foreground font-mono">
                    {item.kind === "SHIFT" ? (isEn ? "SHIFT" : "شيفت") : (isEn ? "DAY" : "يوم")}
                  </span>
                  <span className="font-semibold text-foreground truncate">{item.staffName || item.label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {item.expected} → {item.actual}
                </p>
              </div>
              <span className={`shrink-0 font-mono tabular-nums font-semibold ${toneFor(item.difference)}`}>
                {item.difference > 0 ? "+" : ""}
                {money(item.difference)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VariancePanel;

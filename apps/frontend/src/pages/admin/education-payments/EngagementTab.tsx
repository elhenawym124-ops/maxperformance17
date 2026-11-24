import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquare, RefreshCw } from "lucide-react";
import { fetchEngagement } from "./api";
import type { EngagementReport } from "./types";

const rateTone = (value: number | null) => {
  if (value === null) return "text-muted-foreground";
  if (value >= 60) return "text-success";
  if (value >= 30) return "text-warning";
  return "text-destructive";
};

export const EngagementTab: React.FC<{ isEn: boolean; reloadKey?: number }> = ({ isEn, reloadKey }) => {
  const [months, setMonths] = useState(3);
  const [data, setData] = useState<EngagementReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fetchEngagement(months)
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
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {isEn ? "Parent engagement" : "تفاعل أولياء الأمور"}
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
              { label: isEn ? "Messages" : "الرسائل", value: String(summary?.messages || 0), tone: "text-foreground" },
              {
                label: isEn ? "Read rate" : "نسبة القراءة",
                value: summary?.readRate === null || summary?.readRate === undefined ? "—" : `${summary.readRate}%`,
                tone: rateTone(summary?.readRate ?? null),
              },
              {
                label: isEn ? "Portal activation" : "تفعيل البوابة",
                value: summary?.activationRate === null || summary?.activationRate === undefined ? "—" : `${summary.activationRate}%`,
                hint: `${summary?.activated || 0}/${summary?.guardians || 0}`,
                tone: rateTone(summary?.activationRate ?? null),
              },
              {
                label: isEn ? "Best send hour" : "أفضل ساعة إرسال",
                value: data?.bestHour ? `${String(data.bestHour.hour).padStart(2, "0")}:00` : "—",
                hint: data?.bestHour ? `${data.bestHour.readRate}%` : null,
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border/70">
                <h4 className="text-xs font-semibold text-foreground">{isEn ? "By message type" : "حسب نوع الرسالة"}</h4>
              </div>
              {(data?.byEventType.length || 0) === 0 ? (
                <p className="p-4 text-[11px] text-muted-foreground">{isEn ? "No messages yet" : "لا توجد رسائل بعد"}</p>
              ) : (
                <div className="divide-y divide-border/60 max-h-72 overflow-y-auto">
                  {data?.byEventType.map((row) => (
                    <div key={row.eventType} className="px-4 py-2 flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-mono text-muted-foreground truncate" dir="ltr">{row.eventType}</span>
                      <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                        <span className="text-muted-foreground">{row.total}</span>
                        <span className={rateTone(row.readRate)}>
                          {row.readRate === null ? "—" : `${row.readRate}%`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
                <h4 className="text-xs font-semibold text-foreground">
                  {isEn ? "Parents never reading" : "أولياء أمور لا يقرأون"}
                </h4>
                <span className="text-[10px] text-muted-foreground font-mono">{data?.ignored.count || 0}</span>
              </div>
              {(data?.ignored.phones.length || 0) === 0 ? (
                <p className="p-4 text-[11px] text-muted-foreground">
                  {isEn ? "Every parent read at least one message" : "كل أولياء الأمور قرأوا رسالة واحدة على الأقل"}
                </p>
              ) : (
                <div className="divide-y divide-border/60 max-h-72 overflow-y-auto">
                  {data?.ignored.phones.map((row) => (
                    <div key={row.phone} className="px-4 py-2 flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-mono text-foreground" dir="ltr">{row.phone}</span>
                      <span className="text-muted-foreground font-mono tabular-nums">
                        {row.total} {isEn ? "sent" : "رسالة"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EngagementTab;

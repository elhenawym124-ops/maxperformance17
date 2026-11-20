import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { PhoneCall, Play, Clock, AlertCircle, CheckCircle2, PhoneOff, PhoneForwarded } from "lucide-react";

export interface CallAttemptItem {
  id: string;
  orderId?: string | null;
  guestOrderId?: string | null;
  userId: string;
  direction?: string;
  callStatus?: string;
  durationSeconds: number;
  callerPhone?: string | null;
  customerPhone?: string | null;
  recordingUrl?: string | null;
  result?: string | null;
  notes?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
}

interface OrderCallTimelineProps {
  orderId: string;
  className?: string;
}

export const OrderCallTimeline: React.FC<OrderCallTimelineProps> = ({ orderId, className = "" }) => {
  const [logs, setLogs] = useState<CallAttemptItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    let isMounted = true;
    api
      .get<{ success: boolean; data: CallAttemptItem[] }>(`/voice/logs/${orderId}`)
      .then((res) => {
        if (isMounted && res.data?.data) {
          setLogs(res.data.data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn("[VOICE-LOGS] Failed to load call logs:", err.message);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className={`bg-card rounded-xl border border-border dark:dark:border-border p-4 text-xs text-muted-foreground animate-pulse ${className}`}>
        جاري تحميل سجل مكالمات الطلب...
      </div>
    );
  }

  if (logs.length === 0) {
    return null; // Don't take up space if no voice calls have occurred yet
  }

  const getResultBadge = (result?: string | null) => {
    const res = String(result || "").toLowerCase();
    if (res === "reached") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-success/10 dark:bg-success/50 text-success dark:text-success border border-success dark:border-success">
          <CheckCircle2 className="w-3 h-3" /> تم الرد والتأكيد
        </span>
      );
    }
    if (res === "busy") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-warning/10 dark:bg-warning/50 text-warning dark:text-warning border border-warning dark:border-warning">
          <PhoneOff className="w-3 h-3" /> الخط مشغول
        </span>
      );
    }
    if (res === "wrong_number") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-destructive/10 dark:bg-destructive/50 text-destructive dark:text-destructive border border-destructive dark:border-destructive">
          <AlertCircle className="w-3 h-3" /> الرقم خاطئ
        </span>
      );
    }
    if (res === "pending") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 dark:bg-primary/50 text-primary dark:text-primary border border-primary dark:border-primary">
          <Clock className="w-3 h-3 animate-spin" /> قيد الاتصال
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted dark:dark:bg-muted text-foreground border border-border dark:dark:border-border">
        <PhoneForwarded className="w-3 h-3" /> لم يتم الرد ({res || "unreached"})
      </span>
    );
  };

  return (
    <div className={`bg-card rounded-xl border border-border dark:dark:border-border p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between border-b border-border dark:dark:border-border pb-2.5">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-xs text-foreground">
            سجل مكالمات الذكاء الاصطناعي (AI Voice Confirmation)
          </h4>
        </div>
        <span className="text-[11px] text-muted-foreground font-mono">
          {logs.length} {logs.length === 1 ? "محاولة" : "محاولات"}
        </span>
      </div>

      <div className="space-y-2.5">
        {logs.map((log, index) => {
          const isSim = log.notes?.includes("SIMULATION") || log.recordingUrl?.includes("simulated");
          const dateStr = new Date(log.createdAt).toLocaleString("ar-EG", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={log.id}
              className="p-3 bg-muted dark:dark:bg-muted rounded-lg border border-border dark:dark:border-border text-xs space-y-2"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground dark:dark:text-muted-foreground">
                    المحاولة #{logs.length - index}
                  </span>
                  {getResultBadge(log.result)}
                  {isSim && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-primary dark:bg-primary text-primary dark:text-primary font-medium">
                      SIMULATION
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-2">
                  {log.durationSeconds > 0 && <span>{log.durationSeconds} ثانية</span>}
                  <span>{dateStr}</span>
                </div>
              </div>

              {log.notes && (
                <div className="text-[11px] text-foreground dark:dark:text-muted-foreground bg-white dark:dark:bg-muted p-2 rounded border border-border dark:dark:border-border">
                  {log.notes}
                </div>
              )}

              {log.recordingUrl && (
                <div className="flex items-center gap-2 pt-1 text-[11px] text-primary">
                  <Play className="w-3 h-3" />
                  <a
                    href={log.recordingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center gap-1 font-mono"
                  >
                    الاستماع لتسجيل المكالمة
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderCallTimeline;

import React from "react";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UnifiedOverviewData } from "./types";

interface UnifiedTelemetryStripProps {
  overview: UnifiedOverviewData | null;
}

export const UnifiedTelemetryStrip: React.FC<UnifiedTelemetryStripProps> = ({
  overview,
}) => {
  if (!overview || !Array.isArray(overview.engines)) return null;

  const {
    telemetry7d = { sent: 0, delivered: 0, read: 0, failed: 0, responded: 0 },
    engines = [],
    templateHealthSummary = { total: 0, approved: 0, rejected: 0, unbound: 0 },
    guardrails = {
      weeklyFrequencyCap: 3,
      deliveryWindowHours: 48,
      pauseOnUnreadInbox: true,
      respectBotUnsubscribe: true,
      blockUnboundOccasions: true,
    },
  } = overview;
  const activeEngines = engines.filter((e) => e.isEnabled).length;
  const deliveryRate =
    telemetry7d.sent > 0
      ? Math.round((telemetry7d.delivered / telemetry7d.sent) * 100)
      : 0;
  const unsafeTemplates =
    templateHealthSummary.rejected + templateHealthSummary.unbound;

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
      <div className="grid grid-cols-2 divide-x divide-y divide-border/70 lg:grid-cols-4 lg:divide-y-0 rtl:divide-x-reverse">
        <div className="p-3.5 sm:p-4">
          <p className="text-xs font-medium text-muted-foreground">
            رسائل آخر 7 أيام
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-xl font-bold tabular-nums text-foreground sm:text-2xl">
              {telemetry7d.sent}
            </span>
            <span className="font-mono text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
              {deliveryRate}% توصيل
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            فشل:{" "}
            <span className="font-mono tabular-nums text-destructive">
              {telemetry7d.failed}
            </span>{" "}
            · تفاعل:{" "}
            <span className="font-mono tabular-nums text-foreground">
              {telemetry7d.responded}
            </span>
          </p>
        </div>

        <div className="p-3.5 sm:p-4">
          <p className="text-xs font-medium text-muted-foreground">
            المحركات النشطة
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-xl font-bold tabular-nums text-foreground sm:text-2xl">
              {activeEngines}
            </span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              / {engines.length}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            جلسات متصلة:{" "}
            <span className="font-mono tabular-nums text-foreground">
              {overview.connectedSessionsCount}
            </span>
          </p>
        </div>

        <div className="p-3.5 sm:p-4">
          <p className="text-xs font-medium text-muted-foreground">
            صحة قوالب Meta
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 sm:text-2xl">
              {templateHealthSummary.approved}
            </span>
            <span className="text-xs text-muted-foreground">معتمد</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            مرفوض/غير مربوط:{" "}
            <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {unsafeTemplates}
            </span>
          </p>
        </div>

        <div className="p-3.5 sm:p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            <span>صمامات الأمان المفعلة</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
            >
              سقف{" "}
              <span className="mx-0.5 font-mono tabular-nums">
                {guardrails.weeklyFrequencyCap}
              </span>
              /أسبوع
            </Badge>
            <Badge
              variant="outline"
              className="border-border/70 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-foreground"
            >
              تسليم ≤{" "}
              <span className="mx-0.5 font-mono tabular-nums">
                {guardrails.deliveryWindowHours}h
              </span>
            </Badge>
            <Badge
              variant="outline"
              className="border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
            >
              تأجيل مع شات مفتوح
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

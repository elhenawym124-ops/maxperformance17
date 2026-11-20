import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export const StatusPill: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
  <span
    className={[
      "inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold tracking-wide",
      ok
        ? "border border-success/70 bg-success/10 text-success dark:border-success/60 dark:bg-success/40 dark:text-success"
        : "border border-warning/70 bg-warning/10 text-warning dark:border-warning/60 dark:bg-warning/40 dark:text-warning",
    ].join(" ")}
  >
    {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
    {label}
  </span>
);

export const MetricTile: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}> = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-border bg-white/90 p-4 shadow-xs transition-all hover:border-border hover:shadow-sm dark:border-border dark:bg-muted dark:hover:border-border">
    <div className="flex items-center gap-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/50 dark:text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground dark:text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-xl font-bold tabular-nums tracking-tight text-foreground dark:text-white">
          {value}
        </p>
      </div>
    </div>
  </div>
);

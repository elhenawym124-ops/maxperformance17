import React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const TONE_STYLES = {
  default: {
    iconBg: "bg-muted text-muted-foreground",
    accent: "text-muted-foreground",
  },
  spend: {
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
    accent: "text-blue-600 dark:text-blue-400",
  },
  purchases: {
    iconBg: "bg-emerald-500/10 text-success dark:text-success border border-success/20",
    accent: "text-emerald-600 dark:text-success",
  },
  results: {
    iconBg: "bg-emerald-500/10 text-success dark:text-success border border-success/20",
    accent: "text-emerald-600 dark:text-success",
  },
  roas: {
    iconBg: "bg-violet-500/10 text-primary dark:text-primary border border-primary/20",
    accent: "text-violet-600 dark:text-primary",
  },
  cpa: {
    iconBg: "bg-amber-500/10 text-warning dark:text-warning border border-warning/20",
    accent: "text-amber-600 dark:text-warning",
  },
};

export interface MetricCardProps {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "default" | "spend" | "purchases" | "results" | "roas" | "cpa" | string;
  delta?: { text: string; isPositive?: boolean };
  badge?: { text: string; isPositive?: boolean };
  subtitle?: string;
}

export default function MetricCard({
  label,
  value,
  icon: Icon,
  variant = "default",
  delta,
  badge,
  subtitle,
}: MetricCardProps) {
  const tone = TONE_STYLES[variant as keyof typeof TONE_STYLES] || TONE_STYLES.default;
  const tag = badge || delta;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs transition-all duration-150 hover:border-border/90 hover:shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground truncate">{label}</span>
        {Icon && (
          <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg shadow-2xs", tone.iconBg)}>
            <Icon className="size-3.5" />
          </span>
        )}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <p
          dir="ltr"
          className="truncate text-lg sm:text-xl font-bold font-mono tracking-tight tabular-nums text-foreground"
        >
          {value}
        </p>

        {tag && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[11px] font-semibold font-mono tabular-nums px-1.5 py-0.5 rounded-md",
              tag.isPositive
                ? "bg-emerald-500/10 text-success dark:text-success border border-success/20"
                : "bg-rose-500/10 text-destructive dark:text-destructive border border-destructive/20",
            )}
          >
            {tag.isPositive ? (
              <ArrowUpRight className="size-3 shrink-0" />
            ) : (
              <ArrowDownRight className="size-3 shrink-0" />
            )}
            <span>{tag.text}</span>
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-muted-foreground/80 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}

import React from "react";

export type RelationBadgeTone = "blue" | "green" | "amber" | "neutral";

export interface RelationBadgeProps {
  label: string;
  tone?: RelationBadgeTone;
}

export function RelationBadge({ label, tone = "blue" }: RelationBadgeProps) {
  const styles =
    tone === "green"
      ? "bg-emerald-100 text-success dark:bg-success/30 dark:text-success"
      : tone === "amber"
        ? "bg-amber-100 text-warning dark:bg-warning/30 dark:text-warning"
        : tone === "neutral"
          ? "bg-gray-200 text-foreground dark:bg-muted dark:text-muted-foreground"
          : "bg-blue-100 text-primary dark:bg-primary/30 dark:text-primary";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${styles}`}
    >
      {label}
    </span>
  );
}

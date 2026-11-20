import React from "react";
import { TIER_COLORS } from "./types";

export const QualityTierBadge: React.FC<{ tier: string }> = ({ tier }) => {
  const color = TIER_COLORS[tier] || "#6B7280";
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: color + "20", color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {tier}
    </span>
  );
};

export const RatingBadge: React.FC<{ rating?: string }> = ({ rating }) => {
  if (!rating || rating === "UNKNOWN") return <span className="text-xs text-muted-foreground">-</span>;
  const colors: Record<string, string> = {
    EXCELLENT: "bg-green-100 text-success dark:bg-success/30 dark:text-success",
    GOOD: "bg-blue-100 text-primary dark:bg-primary/30 dark:text-primary",
    AVERAGE: "bg-yellow-100 text-warning dark:bg-warning/30 dark:text-warning",
    BAD: "bg-red-100 text-destructive dark:bg-destructive/30 dark:text-destructive",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[rating] || ""}`}>
      {rating === "EXCELLENT" ? "★★★★★" : rating === "GOOD" ? "★★★★" : rating === "AVERAGE" ? "★★★" : "★★"}
    </span>
  );
};

export const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  onClick?: () => void;
}> = ({ icon: Icon, label, value, sub, color, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-card rounded-xl p-5 shadow-sm border border-border dark:border-border ${
      onClick
        ? "cursor-pointer hover:shadow-md hover:border-border transition-all"
        : ""
    }`}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="p-2.5 rounded-lg" style={{ backgroundColor: color + "20" }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-2xl font-bold text-foreground mt-0.5 font-mono tabular-nums">
      {typeof value === "number" ? value.toLocaleString("ar-EG") : value}
    </p>
  </div>
);

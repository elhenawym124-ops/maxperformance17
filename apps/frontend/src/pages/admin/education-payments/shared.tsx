import React from "react";
import type { LucideIcon } from "lucide-react";

export const INPUT_CLS =
  "w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export const money = (value: number | null | undefined): string =>
  (Math.round((Number(value) || 0) * 100) / 100).toLocaleString("en-EG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

export const formatDate = (value?: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const formatDateTime = (value?: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${formatDate(value)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const todayInput = (): string => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const monthStartInput = (): string => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
};

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "success" | "warning" | "danger";
  icon: LucideIcon;
  loading?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, tone = "default", icon: Icon, loading = false }) => {
  const toneText =
    tone === "success"
      ? "text-success"
      : tone === "warning"
      ? "text-warning"
      : tone === "danger"
      ? "text-destructive"
      : "text-foreground";
  const toneChip =
    tone === "success"
      ? "bg-success/10 text-success border-success/20"
      : tone === "warning"
      ? "bg-warning/10 text-warning border-warning/20"
      : tone === "danger"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : "bg-primary/10 text-primary border-primary/20";
  return (
    <div className="rounded-xl border border-border/80 bg-card p-3.5 space-y-1.5 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground truncate">{label}</span>
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${toneChip}`}>
          <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        </span>
      </div>
      {loading ? (
        <div className="h-6 w-24 rounded bg-muted animate-pulse" />
      ) : (
        <div className={`text-lg font-bold font-mono tabular-nums whitespace-nowrap ${toneText}`}>{value}</div>
      )}
      {sub ? <div className="text-[11px] text-muted-foreground font-mono truncate">{sub}</div> : null}
    </div>
  );
};

export const EmptyState: React.FC<{ title: string; hint?: string; action?: React.ReactNode }> = ({
  title,
  hint,
  action,
}) => (
  <div className="rounded-xl border border-border/70 bg-muted/20 p-8 text-center space-y-2">
    <p className="text-sm font-semibold text-foreground">{title}</p>
    {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    {action}
  </div>
);

export const StatusPill: React.FC<{ tone: "success" | "warning" | "danger" | "muted"; children: React.ReactNode }> = ({
  tone,
  children,
}) => {
  const cls =
    tone === "success"
      ? "bg-success/10 text-success border-success/20"
      : tone === "warning"
      ? "bg-warning/10 text-warning border-warning/20"
      : tone === "danger"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}>
      {children}
    </span>
  );
};

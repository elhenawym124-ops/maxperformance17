import React, { type ReactNode } from "react";
import { ExternalLink } from "lucide-react";

export const ToggleField = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) => (
  <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-border bg-white p-4 transition-colors hover:border-border focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:border-border dark:bg-muted dark:hover:border-border dark:focus-within:border-blue-500 dark:focus-within:ring-blue-900/30">
    <div className="space-y-1">
      <div className="font-semibold text-foreground">{label}</div>
      <div className="text-sm text-foreground dark:text-muted-foreground">{description}</div>
    </div>
    <input
      type="checkbox"
      className="mt-1 h-5 w-5 rounded border-border text-primary focus:ring-primary"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
  </label>
);

export const SelectField = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) => (
  <label className="block space-y-2">
    <span className="text-sm font-semibold text-foreground">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 dark:border-border dark:bg-muted dark:text-white dark:focus-visible:ring-blue-900/40"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

export const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "datetime-local";
}) => (
  <label className="block space-y-2">
    <span className="text-sm font-semibold text-foreground">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 dark:border-border dark:bg-muted dark:text-white dark:focus-visible:ring-blue-900/40"
    />
  </label>
);

export const InsightCard = ({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
}) => (
  <div className="rounded-xl border border-border dark:border-border bg-card p-5">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="text-sm font-semibold text-muted-foreground">{label}</div>
      <div className="rounded-xl bg-primary/10 p-2 text-primary dark:bg-primary/30 dark:text-primary">
        {icon}
      </div>
    </div>
    <div className="text-2xl font-bold tabular-nums font-mono text-foreground">{value}</div>
    <p className="mt-2 text-sm leading-6 text-foreground dark:text-muted-foreground">{hint}</p>
  </div>
);

export const QuickLinkCard = ({
  title,
  description,
  ctaLabel,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  icon: ReactNode;
  onClick: () => void;
}) => (
  <div className="rounded-xl border border-border bg-white p-5 dark:border-border dark:bg-muted">
    <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary dark:bg-primary/30 dark:text-primary">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-foreground">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-foreground dark:text-muted-foreground">{description}</p>
    <button
      type="button"
      onClick={onClick}
      className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 dark:border-border dark:text-white dark:hover:border-primary/50 dark:hover:text-primary dark:focus-visible:ring-blue-900/40"
    >
      {ctaLabel}
      <ExternalLink size={16} />
    </button>
  </div>
);

export const StatusPill = ({
  active,
  activeLabel = "مفعّل",
  inactiveLabel = "متوقف",
}: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) => (
  <span
    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
      active
        ? "bg-emerald-100 text-success dark:bg-success/30 dark:text-success"
        : "bg-gray-100 text-foreground dark:bg-muted dark:text-muted-foreground"
    }`}
  >
    {active ? activeLabel : inactiveLabel}
  </span>
);

export const PlacementMetric = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) => (
  <div className="rounded-xl border border-border bg-muted p-4 dark:border-border dark:bg-muted">
    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
      {label}
    </div>
    <div className="mt-2 text-2xl font-black tabular-nums font-mono text-foreground">{value}</div>
    <p className="mt-2 text-sm leading-6 text-foreground dark:text-muted-foreground">{hint}</p>
  </div>
);

export const PlacementCard = ({
  icon,
  eyebrow,
  title,
  description,
  status,
  children,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  status: ReactNode;
  children: ReactNode;
}) => (
  <section className="rounded-[28px] border border-border bg-white p-6 shadow-sm dark:border-border dark:bg-muted">
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary">
          {icon}
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold text-primary dark:text-primary">
            {eyebrow}
          </div>
          <h2 className="text-2xl font-black text-foreground">{title}</h2>
          <p className="max-w-3xl text-sm leading-7 text-foreground dark:text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">{status}</div>
    </div>

    {children}
  </section>
);

export const PreviewPill = ({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "blue" | "green" | "amber" | "neutral";
}) => {
  const toneClassMap = {
    blue: "bg-blue-100 text-primary dark:bg-primary/40 dark:text-primary",
    green: "bg-emerald-100 text-success dark:bg-success/30 dark:text-success",
    amber: "bg-amber-100 text-warning dark:bg-warning/30 dark:text-warning",
    neutral: "bg-gray-200 text-foreground dark:bg-muted dark:text-muted-foreground",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
        toneClassMap[tone]
      }`}
    >
      {label}
    </span>
  );
};

export const PlacementPreview = ({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description: string;
  badge?: ReactNode;
  children: ReactNode;
}) => (
  <div className="rounded-[28px] border border-border bg-gradient-to-br from-slate-50 via-white to-primary/70 p-5 shadow-sm dark:border-border dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-primary/20">
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <div className="text-xs font-semibold text-primary dark:text-primary">
          Preview Snapshot
        </div>
        <h3 className="mt-2 text-xl font-black text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-foreground dark:text-muted-foreground">{description}</p>
      </div>
      {badge ? <div className="shrink-0">{badge}</div> : null}
    </div>

    {children}
  </div>
);

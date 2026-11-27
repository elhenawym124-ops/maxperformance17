import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { ProfileIcon } from "./types";

export const AnimatedNumber = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 30);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
};

export const InfoField = ({
  label,
  value,
  editing,
  onChange,
  type = "text",
  children,
}: {
  label: string;
  value: string;
  editing?: boolean;
  onChange?: (v: string) => void;
  type?: string;
  children?: React.ReactNode;
}) => (
  <div className="group">
    <p className="mb-1 text-xs text-muted-foreground">{label}</p>
    {editing && onChange ? (
      children || (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
        />
      )
    ) : (
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    )}
  </div>
);

export const SensitiveValue = ({
  label,
  value,
  visibleChars = 4,
}: {
  label: string;
  value?: string | null;
  visibleChars?: number;
}) => {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(false);
  const raw = (value || "").trim();
  const masked = raw ? `${"•".repeat(Math.max(raw.length - visibleChars, 0))}${raw.slice(-visibleChars)}` : "—";

  return (
    <div className="group">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5">
        <p className="font-mono text-sm font-medium tabular-nums text-foreground" dir="ltr">
          {revealed ? raw || "—" : masked}
        </p>
        {raw && (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            aria-label={revealed ? t("common.hide", "إخفاء") : t("common.show", "إظهار")}
            className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-[0.97]"
          >
            {revealed ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
};

export const SectionCard = ({
  icon: Icon,
  title,
  children,
}: {
  icon: ProfileIcon;
  title: string;
  children: React.ReactNode;
  /** @deprecated kept for backwards compatibility — the design system no longer uses per-section accents */
  accent?: string;
}) => (
  <section className="border-t border-border/70 py-5 first:border-t-0 first:pt-0 last:pb-0">
    <header className="mb-4 flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </header>
    {children}
  </section>
);

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { ProfileIcon } from "./types";
import { sectionAccents } from "./helpers";

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

  return <span className="tabular-nums">{display}{suffix}</span>;
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
    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
      {label}
    </p>
    {editing && onChange ? (
      children || (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none"
        />
      )
    ) : (
      <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{value || "—"}</p>
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
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-medium font-mono tabular-nums text-slate-900 dark:text-slate-200" dir="ltr">
          {revealed ? raw || "—" : masked}
        </p>
        {raw && (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            aria-label={revealed ? t("common.hide", "إخفاء") : t("common.show", "إظهار")}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:scale-[0.97] dark:hover:bg-white/5 dark:hover:text-slate-200"
          >
            {revealed ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
};

const defaultSectionAccent = {  bar: "from-violet-500/20 to-violet-500/0",
  text: "text-violet-600 dark:text-violet-400",
  iconBg: "bg-violet-500/10 dark:bg-violet-500/15",
};

export const SectionCard = ({
  icon: Icon,
  title,
  accent = "violet",
  children,
}: {
  icon: ProfileIcon;
  title: string;
  accent?: string;
  children: React.ReactNode;
}) => {
  const a = (accent ? sectionAccents[accent] : null) || sectionAccents["violet"] || defaultSectionAccent;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-slate-900/80 backdrop-blur-xl shadow-sm dark:shadow-xl transition-all duration-300"
    >
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${a.bar}`} />
      <div className="p-6">
        <h3 className={`flex items-center gap-2.5 text-sm font-bold uppercase tracking-widest mb-6 ${a.text}`}>
          <span className={`w-6 h-6 rounded-lg ${a.iconBg} flex items-center justify-center`}>
            <Icon className="w-3.5 h-3.5" />
          </span>
          {title}
        </h3>
        {children}
      </div>
    </motion.div>
  );
};

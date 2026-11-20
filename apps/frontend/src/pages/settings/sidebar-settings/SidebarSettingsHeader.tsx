import React from "react";
import { useTranslation } from "react-i18next";
import {
  PaintBrushIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export interface SidebarSettingsHeaderProps {
  visibleCount: number;
  totalCount: number;
  saveStatus: "idle" | "saving" | "saved" | "error";
  onRefresh: () => void;
}

export function SidebarSettingsHeader({
  visibleCount,
  totalCount,
  saveStatus,
  onRefresh,
}: SidebarSettingsHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
          <PaintBrushIcon className="h-6 w-6 text-primary" />
          {t("sidebar.sidebarTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("sidebar.sidebarDescription")}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-xs font-mono tabular-nums text-muted-foreground sm:inline">
          {t("sidebar.sidebarCountVisible", { visible: visibleCount, total: totalCount })}
        </span>
        {saveStatus === "saving" && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-warning dark:text-warning">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t("sidebar.sidebarSaving")}
          </span>
        )}
        {saveStatus === "saved" && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-success dark:text-success">
            <CheckCircleIcon className="h-4 w-4" />
            {t("sidebar.sidebarSaved")}
          </span>
        )}
        {saveStatus === "error" && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-destructive dark:text-destructive">
            <ExclamationCircleIcon className="h-4 w-4" />
            {t("sidebar.sidebarSaveFailed")}
          </span>
        )}
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground shadow-xs transition hover:bg-muted dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
        >
          <ArrowPathIcon className="h-3.5 w-3.5" />
          {t("sidebar.sidebarRefresh")}
        </button>
      </div>
    </div>
  );
}
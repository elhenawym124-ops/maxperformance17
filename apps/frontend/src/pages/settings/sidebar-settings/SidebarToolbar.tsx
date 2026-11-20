import React from "react";
import { useTranslation } from "react-i18next";
import {
  MagnifyingGlassIcon,
  Squares2X2Icon,
  Bars3Icon,
} from "@heroicons/react/24/outline";

export interface SidebarToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: "categories" | "flat";
  onViewModeChange: (mode: "categories" | "flat") => void;
}

export function SidebarToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: SidebarToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-md">
        <MagnifyingGlassIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("sidebar.sidebarSearchPlaceholder")}
          className="w-full rounded-xl border border-border bg-white py-2.5 pe-10 ps-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-border dark:bg-muted dark:text-muted-foreground dark:placeholder-muted"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onViewModeChange("categories")}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
            viewMode === "categories"
              ? "bg-indigo-100 text-primary dark:bg-primary/40 dark:text-primary"
              : "text-gray-600 hover:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
          }`}
        >
          <Squares2X2Icon className="h-3.5 w-3.5" />
          {t("sidebar.sidebarViewCategories")}
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange("flat")}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
            viewMode === "flat"
              ? "bg-indigo-100 text-primary dark:bg-primary/40 dark:text-primary"
              : "text-gray-600 hover:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
          }`}
        >
          <Bars3Icon className="h-3.5 w-3.5" />
          {t("sidebar.sidebarViewFlat")}
        </button>
      </div>
    </div>
  );
}

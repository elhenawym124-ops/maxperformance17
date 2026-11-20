import React from "react";
import { Search, X as XMarkIcon } from "lucide-react";
import type { InvoicesDatePreset } from "../types";

export interface DentalInvoicesQueryFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  datePreset: InvoicesDatePreset;
  onDatePresetChange: (p: InvoicesDatePreset) => void;
  fetchedCount: number | null;
}

const STATUS_OPTIONS = [
  { id: "ALL", label: "الكل" },
  { id: "OPEN", label: "غير مسددة" },
  { id: "PARTIAL", label: "مسددة جزئياً" },
  { id: "PAID", label: "مسددة" },
] as const;

const DATE_PRESET_OPTIONS = [
  { id: "ALL", label: "كل الفترات" },
  { id: "THIS_MONTH", label: "هذا الشهر" },
  { id: "LAST_MONTH", label: "الشهر السابق" },
] as const;

export const DentalInvoicesQueryFilters: React.FC<DentalInvoicesQueryFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  datePreset,
  onDatePresetChange,
  fetchedCount,
}) => {
  return (
    <div className="bg-white dark:bg-muted border dark:border-border rounded-xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          className="w-full ps-3 pe-9 py-1.5 border dark:border-border rounded-lg text-xs sm:text-sm dark:bg-muted focus:ring-2 focus:ring-primary"
          placeholder="بحث برقم الفاتورة، اسم الدكتور، المريض..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="مسح البحث"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Status Filters */}
      <div className="flex items-center gap-2">
        {fetchedCount !== null && (
          <span
            className="shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-muted dark:bg-muted text-muted-foreground font-mono tabular-nums"
            title="إجمالي الفواتير المطابقة للفلترة الحالية"
          >
            عدد الفواتير: {fetchedCount}
          </span>
        )}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 flex-1 min-w-0">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onStatusFilterChange(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === s.id
                  ? "bg-blue-600 text-white"
                  : "text-muted-foreground hover:bg-muted dark:hover:bg-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date presets */}
      <div className="flex items-center gap-1 border-r dark:border-border pe-2">
        {DATE_PRESET_OPTIONS.map((dp) => (
          <button
            key={dp.id}
            type="button"
            onClick={() => onDatePresetChange(dp.id)}
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
              datePreset === dp.id
                ? "bg-gray-200 dark:bg-muted text-foreground font-bold"
                : "text-gray-500 hover:text-foreground dark:hover:text-muted-foreground"
            }`}
          >
            {dp.label}
          </button>
        ))}
      </div>
    </div>
  );
};

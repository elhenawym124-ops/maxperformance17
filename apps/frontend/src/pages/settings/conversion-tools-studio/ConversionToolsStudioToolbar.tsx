import { Search, X } from "lucide-react";
import type { CategoryTabItem, StatusFilter } from "./types";

export interface ConversionToolsStudioToolbarProps {
  categoryTabs: CategoryTabItem[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export function ConversionToolsStudioToolbar({
  categoryTabs,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  hasActiveFilters,
  onResetFilters,
}: ConversionToolsStudioToolbarProps) {
  return (
    <section className="space-y-3">
      {/* Category Tabs with horizontal scroll on mobile */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {categoryTabs.map((tab) => {
          const isSelected = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectCategory(tab.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                isSelected
                  ? "bg-indigo-600 text-white shadow-xs shadow-primary/25"
                  : "border border-border bg-white text-foreground hover:border-border hover:bg-muted dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] font-extrabold tabular-nums ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-muted-foreground dark:bg-muted dark:text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input & Status Filter Controls */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="البحث في الأدوات بالاسم أو الفائدة..."
            className="w-full rounded-xl border border-border bg-white py-2 text-xs text-foreground placeholder-muted transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-border dark:bg-muted dark:text-white dark:placeholder-muted rtl:pe-9 rtl:ps-8 ltr:ps-9 ltr:pe-8"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:text-foreground rtl:left-2.5 ltr:right-2.5 dark:hover:text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter Segmented Control */}
          <div className="flex items-center rounded-xl border border-border bg-white p-0.5 dark:border-border dark:bg-muted">
            <button
              type="button"
              onClick={() => onStatusFilterChange("all")}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                statusFilter === "all"
                  ? "bg-slate-100 text-foreground dark:bg-muted dark:text-white"
                  : "text-slate-500 hover:text-foreground dark:text-muted-foreground dark:hover:text-white"
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("active")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                statusFilter === "active"
                  ? "bg-emerald-50 text-success dark:bg-success/60 dark:text-success"
                  : "text-slate-500 hover:text-foreground dark:text-muted-foreground dark:hover:text-white"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span>النشطة</span>
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("inactive")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                statusFilter === "inactive"
                  ? "bg-slate-200 text-foreground dark:bg-muted dark:text-muted-foreground"
                  : "text-slate-500 hover:text-foreground dark:text-muted-foreground dark:hover:text-white"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-muted" />
              <span>المعطلة</span>
            </button>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 rounded-xl border border-border px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:border-border hover:text-foreground dark:border-border dark:text-muted-foreground dark:hover:text-muted-foreground"
            >
              <X className="h-3 w-3" />
              <span>إعادة ضبط</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

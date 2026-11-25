import React from "react";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal, X } from "lucide-react";

export interface FilterDrawerHeaderProps {
  advancedFilterCount: number;
  onClearAdvancedFilters: () => void;
  onClose: () => void;
}

export const FilterDrawerHeader: React.FC<FilterDrawerHeaderProps> = ({
  advancedFilterCount,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between border-b border-border/70 px-4 sm:px-5 py-3.5 bg-card">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
          <SlidersHorizontal className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <h2
            id="orders-filter-drawer-title"
            className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate"
          >
            {t("orders.filters", { defaultValue: "فلاتر الطلبات المتقدمة" })}
          </h2>
          {advancedFilterCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold font-mono tabular-nums text-primary shrink-0">
              {advancedFilterCount}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label={String(t("common.close", { defaultValue: "إغلاق" }))}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95 transition-all cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default FilterDrawerHeader;

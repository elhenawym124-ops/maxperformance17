import React from "react";
import { useTranslation } from "react-i18next";
import { Calendar, RotateCcw } from "lucide-react";
import type { OrdersFilters } from "../../Orders";
import { DateInput } from '../../../../components/ui/DateInput';

export interface DateRangeFilterSectionProps {
  filters: OrdersFilters;
  hasCustomDateFilters: boolean;
  onFilterChange: (key: keyof OrdersFilters, value: OrdersFilters[keyof OrdersFilters]) => void;
  onSetQuickDate: (range: string) => void;
}

const QUICK_DATE_CHIPS = [
  { key: "", labelKey: "orders.allDates", defaultLabel: "الكل" },
  { key: "today", labelKey: "orders.today", defaultLabel: "اليوم" },
  { key: "yesterday", labelKey: "orders.yesterday", defaultLabel: "أمس" },
  { key: "last7", labelKey: "orders.last7Days", defaultLabel: "آخر 7 أيام" },
  { key: "last30", labelKey: "orders.last30Days", defaultLabel: "آخر 30 يوم" },
  { key: "last90", labelKey: "orders.last90Days", defaultLabel: "آخر 90 يوم" },
  { key: "thisMonth", labelKey: "orders.thisMonth", defaultLabel: "هذا الشهر" },
  { key: "thisYear", labelKey: "orders.thisYear", defaultLabel: "هذه السنة" },
  { key: "custom", labelKey: "orders.customPeriod", defaultLabel: "فترة مخصصة" },
];

export const DateRangeFilterSection: React.FC<DateRangeFilterSectionProps> = ({
  filters,
  hasCustomDateFilters,
  onFilterChange,
  onSetQuickDate,
}) => {
  const { t } = useTranslation();

  return (
    <div className="py-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <span>{t("orders.allDates", { defaultValue: "النطاق الزمني والتاريخ" })}</span>
        </span>
        {filters.timeRange && (
          <button
            type="button"
            onClick={() => onSetQuickDate("")}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>{t("orders.clearAll", { defaultValue: "إعادة تعيين" })}</span>
          </button>
        )}
      </div>

      {/* Quick Date Chips (single non-duplicated selector) */}
      <div className="flex flex-wrap items-center gap-1.5">
        {QUICK_DATE_CHIPS.map((chip) => {
          const isActive = filters.timeRange === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => onSetQuickDate(chip.key)}
              className={`h-8 rounded-lg px-2.5 text-xs font-medium whitespace-nowrap transition-all active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "border border-border/70 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t(chip.labelKey, { defaultValue: chip.defaultLabel })}
            </button>
          );
        })}
      </div>

      {/* Custom Date Pickers */}
      {hasCustomDateFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="space-y-1">
            <span className="block text-[11px] font-semibold text-muted-foreground">
              {t("orders.fromDate", { defaultValue: "من تاريخ" })}
            </span>
            <DateInput
              aria-label={String(t("orders.startDate", { defaultValue: "تاريخ البداية" }))}
              value={filters.startDate}
              onChange={(e) => {
                onFilterChange("startDate", e.target.value);
                if (filters.timeRange !== "custom") onFilterChange("timeRange", "custom");
              }}
              className="w-full h-9 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-xs font-mono tabular-nums text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-colors"
            />
          </div>
          <div className="space-y-1">
            <span className="block text-[11px] font-semibold text-muted-foreground">
              {t("orders.toDate", { defaultValue: "إلى تاريخ" })}
            </span>
            <DateInput
              aria-label={String(t("orders.endDate", { defaultValue: "تاريخ النهاية" }))}
              value={filters.endDate}
              onChange={(e) => {
                onFilterChange("endDate", e.target.value);
                if (filters.timeRange !== "custom") onFilterChange("timeRange", "custom");
              }}
              className="w-full h-9 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-xs font-mono tabular-nums text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilterSection;

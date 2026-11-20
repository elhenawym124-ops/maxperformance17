import React from "react";
import { useTranslation } from "react-i18next";
import {
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

interface CustomerListFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  showOnlyWithOrders: boolean;
  onToggleWithOrders: () => void;
  autoDiscountFilter: "" | "AVAILABLE" | "PRE_ACTIVATION";
  onAutoDiscountChange: (value: "" | "AVAILABLE" | "PRE_ACTIVATION") => void;
  availableTags: { name: string; count: number }[];
  selectedTag: string;
  onTagFilterChange: (tagName: string) => void;
}

export const CustomerListFilterBar: React.FC<CustomerListFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  showOnlyWithOrders,
  onToggleWithOrders,
  autoDiscountFilter,
  onAutoDiscountChange,
  availableTags,
  selectedTag,
  onTagFilterChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-muted p-3 sm:p-3.5 rounded-xl border border-border dark:border-border shadow-2xs">
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search */}
        <form onSubmit={onSearchSubmit} className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t("customers.searchPlaceholder")}
              className="block w-full pe-9 ps-3 py-2 text-xs sm:text-sm border border-border dark:border-border rounded-lg bg-muted dark:bg-muted text-foreground dark:text-muted-foreground placeholder-muted dark:placeholder-muted focus:outline-none focus:ring-1 focus:ring-border dark:focus:ring-border focus:border-border dark:focus:border-border transition-all shadow-2xs"
            />
          </div>
        </form>

        {/* Toggle: with orders only */}
        <button
          type="button"
          onClick={onToggleWithOrders}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-150 active:scale-[0.97] shrink-0 shadow-2xs ${
            showOnlyWithOrders
              ? "border-zinc-900 dark:border-border text-foreground dark:text-muted-foreground bg-muted dark:bg-muted font-semibold"
              : "border-zinc-200 dark:border-border text-foreground dark:text-muted-foreground bg-white dark:bg-muted hover:bg-muted dark:hover:bg-muted"
          }`}
        >
          {showOnlyWithOrders ? (
            <ShoppingBagIcon className="h-3.5 w-3.5" />
          ) : (
            <UsersIcon className="h-3.5 w-3.5" />
          )}
          <span>
            {showOnlyWithOrders
              ? t("customers.withOrdersOnly")
              : t("customers.showAllCustomers")}
          </span>
        </button>

        {/* Auto-Discount Status Filter */}
        <select
          value={autoDiscountFilter}
          onChange={(e) =>
            onAutoDiscountChange(
              e.target.value as "" | "AVAILABLE" | "PRE_ACTIVATION",
            )
          }
          className="px-3 py-2 rounded-lg border border-border dark:border-border text-xs sm:text-sm bg-white dark:bg-muted text-foreground dark:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-border dark:focus:ring-border"
        >
          <option value="">كل الخصومات</option>
          <option value="AVAILABLE">خصم متاح</option>
          <option value="PRE_ACTIVATION">قبل تفعيل النظام</option>
        </select>

        {/* Tag Filter */}
        {availableTags.length > 0 && (
          <select
            value={selectedTag}
            onChange={(e) => onTagFilterChange(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border dark:border-border text-xs sm:text-sm bg-white dark:bg-muted text-foreground dark:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-border dark:focus:ring-border"
          >
            <option value="">{t("customers.allTags")}</option>
            {availableTags.map((tag) => (
              <option key={tag.name} value={tag.name}>
                {tag.name} ({tag.count})
              </option>
            ))}
          </select>
        )}

        {/* NPS Filter */}
        <select
          value={selectedTag.startsWith("nps_") ? selectedTag : ""}
          onChange={(e) => onTagFilterChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border dark:border-border text-xs sm:text-sm bg-white dark:bg-muted text-foreground dark:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-border dark:focus:ring-border"
          title="فلترة حسب تقييم NPS"
        >
          <option value="">كل تقييمات NPS</option>
          <option value="nps_promoter">9-10 مروّج</option>
          <option value="nps_passive">7-8 محايد</option>
          <option value="nps_detractor">0-6 منتقد</option>
        </select>
      </div>
    </div>
  );
};

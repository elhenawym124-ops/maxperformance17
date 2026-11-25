import React from "react";
import { useTranslation } from "react-i18next";

export interface FilterDrawerFooterProps {
  advancedFilterCount: number;
  onlyUnseen: boolean;
  onlyPostPurchaseOffer?: boolean;
  onClearAdvancedFilters: () => void;
  onClose: () => void;
}

export const FilterDrawerFooter: React.FC<FilterDrawerFooterProps> = ({
  advancedFilterCount,
  onlyUnseen,
  onlyPostPurchaseOffer = false,
  onClearAdvancedFilters,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <div className="border-t border-border/70 bg-card px-4 sm:px-5 py-3.5">
      <div className="flex items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={onClearAdvancedFilters}
          disabled={advancedFilterCount === 0 && !onlyUnseen && !onlyPostPurchaseOffer}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-border/70 bg-background px-4 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.97] transition-all cursor-pointer"
        >
          {t("orders.clearAll", { defaultValue: "مسح الكل" })}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-9 rounded-lg bg-primary px-5 text-center text-xs sm:text-sm font-bold text-primary-foreground shadow-xs hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 active:scale-[0.97] transition-all cursor-pointer"
        >
          {t("orders.viewResults", { defaultValue: "عرض النتائج" })}
        </button>
      </div>
    </div>
  );
};

export default FilterDrawerFooter;

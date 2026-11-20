import React from "react";
import { useTranslation } from "react-i18next";
import {
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface ReviewsBulkToolbarProps {
  reviewsCount: number;
  selectedCount: number;
  isAllSelected: boolean;
  toggleSelectAll: () => void;
  handleBulkAction: (action: "approve" | "reject" | "delete") => void;
}

export const ReviewsBulkToolbar: React.FC<ReviewsBulkToolbarProps> = ({
  reviewsCount,
  selectedCount,
  isAllSelected,
  toggleSelectAll,
  handleBulkAction,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-card p-3 sm:p-4 rounded-xl border border-border/70 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5">
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
          checked={isAllSelected}
          onChange={toggleSelectAll}
          disabled={reviewsCount === 0}
        />
        <span className="text-foreground font-medium font-mono tabular-nums">
          {t("productReviews.k_25")}{selectedCount})
        </span>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleBulkAction("approve")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success dark:text-success border border-success/20 rounded-lg hover:bg-success/20 transition-colors font-medium shadow-xs"
          >
            <CheckCircleIcon className="h-3.5 w-3.5" />
            <span>{t("productReviews.k_26")}</span>
          </button>
          <button
            onClick={() => handleBulkAction("reject")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-warning/10 text-warning dark:text-warning border border-warning/20 rounded-lg hover:bg-warning/20 transition-colors font-medium shadow-xs"
          >
            <XCircleIcon className="h-3.5 w-3.5" />
            <span>{t("productReviews.k_27")}</span>
          </button>
          <button
            onClick={() => handleBulkAction("delete")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive dark:text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/20 transition-colors font-medium shadow-xs"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            <span>{t("productReviews.k_28")}</span>
          </button>
        </div>
      )}
    </div>
  );
};

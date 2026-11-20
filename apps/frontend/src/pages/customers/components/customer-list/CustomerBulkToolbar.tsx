import React from "react";
import { useTranslation } from "react-i18next";

interface CustomerBulkToolbarProps {
  selectedCount: number;
  onCancel: () => void;
}

export const CustomerBulkToolbar: React.FC<CustomerBulkToolbarProps> = ({
  selectedCount,
  onCancel,
}) => {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  return (
    <div className="bg-indigo-50 dark:bg-primary/20 border border-primary dark:border-primary px-4 py-3 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-indigo-700 dark:text-primary font-medium text-xs sm:text-sm">
          {t("customers.selectedCount", { count: selectedCount })}
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs sm:text-sm text-primary hover:text-primary dark:text-primary font-medium"
        >
          {t("customers.cancelSelection")}
        </button>
      </div>
    </div>
  );
};

import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

interface CustomerListHeaderProps {
  totalCount: number;
  availableDiscountCount: number | null;
  isAdmin: boolean;
  onImportClick: () => void;
  onExportClick: (format: "csv" | "json") => void;
}

export const CustomerListHeader: React.FC<CustomerListHeaderProps> = ({
  totalCount,
  availableDiscountCount,
  isAdmin,
  onImportClick,
  onExportClick,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground dark:text-muted-foreground">
            {t("customers.pageTitle")}
          </h1>
          {totalCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-border dark:border-border bg-muted dark:bg-muted text-foreground dark:text-muted-foreground text-xs font-mono font-medium tabular-nums shadow-2xs">
              {totalCount} عميل
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5">
          {t("customers.pageSubtitle")}
        </p>
        {availableDiscountCount !== null && availableDiscountCount > 0 && (
          <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-success/10 border border-success/20 text-success dark:text-success tabular-nums shadow-2xs">
            <TagIcon className="h-3 w-3" />
            <span>{availableDiscountCount} عميل مؤهل لخصم تلقائي</span>
          </span>
        )}
      </div>

      {isAdmin && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onImportClick}
            className="inline-flex items-center px-3 py-1.5 sm:py-2 border border-border dark:border-border rounded-lg text-xs font-medium text-foreground dark:text-muted-foreground bg-white dark:bg-muted hover:bg-muted dark:hover:bg-muted transition-all duration-150 active:scale-[0.97] shadow-2xs"
          >
            <ArrowUpTrayIcon className="h-3.5 w-3.5 ms-1.5 text-muted-foreground" />
            {t("customers.importCSV")}
          </button>
          <button
            onClick={() => onExportClick("csv")}
            className="inline-flex items-center px-3 py-1.5 sm:py-2 border border-border dark:border-border rounded-lg text-xs font-medium text-foreground dark:text-muted-foreground bg-white dark:bg-muted hover:bg-muted dark:hover:bg-muted transition-all duration-150 active:scale-[0.97] shadow-2xs"
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5 ms-1.5 text-muted-foreground" />
            {t("customers.exportCSV")}
          </button>

          <Link
            to="/customers/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-muted hover:bg-muted dark:bg-muted dark:text-foreground dark:hover:bg-muted shadow-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-150 active:scale-[0.97]"
          >
            <PlusIcon className="h-3.5 w-3.5 text-white dark:text-foreground" />
            <span>{t("customers.addCustomer")}</span>
          </Link>
        </div>
      )}
    </div>
  );
};

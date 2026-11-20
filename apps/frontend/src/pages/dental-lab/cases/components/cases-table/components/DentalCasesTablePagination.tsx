import React from "react";
import { useTranslation } from "react-i18next";

export interface DentalCasesTablePaginationProps {
  page: number;
  totalPages: number;
  setPage: (p: number | ((prev: number) => number)) => void;
}

export const DentalCasesTablePagination: React.FC<DentalCasesTablePaginationProps> = ({
  page,
  totalPages,
  setPage,
}) => {
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 text-sm">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        className="px-3 py-1.5 border dark:border-border rounded-lg disabled:opacity-40 text-xs font-semibold hover:bg-muted dark:hover:bg-muted transition-colors"
      >
        {t("dentalLab.common.prev")}
      </button>
      <span className="text-muted-foreground text-xs font-mono tabular-nums">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => setPage((p) => p + 1)}
        className="px-3 py-1.5 border dark:border-border rounded-lg disabled:opacity-40 text-xs font-semibold hover:bg-muted dark:hover:bg-muted transition-colors"
      >
        {t("dentalLab.common.next")}
      </button>
    </div>
  );
};

import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface EducationStudentsPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  filteredCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const EducationStudentsPagination: React.FC<EducationStudentsPaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  filteredCount,
  onPageChange,
  onPageSizeChange,
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  if (filteredCount === 0) return null;

  const startItem = Math.min((currentPage - 1) * pageSize + 1, filteredCount);
  const endItem = Math.min(currentPage * pageSize, filteredCount);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/70 text-xs text-muted-foreground"
      dir={isEn ? "ltr" : "rtl"}
    >
      {/* Items Range & Total */}
      <div className="flex items-center gap-2 flex-wrap text-center sm:text-start">
        <span>
          {isEn ? "Showing " : "عرض "}
          <span className="font-mono tabular-nums font-semibold text-foreground">{startItem}</span>
          {isEn ? " to " : " إلى "}
          <span className="font-mono tabular-nums font-semibold text-foreground">{endItem}</span>
          {isEn ? " of " : " من "}
          <span className="font-mono tabular-nums font-semibold text-foreground">{filteredCount}</span>
          {isEn ? " students" : " طالب"}
          {filteredCount < totalItems && (
            <span className="text-[11px] text-muted-foreground/80 font-normal">
              {" "}
              ({isEn ? "filtered from " : "من أصل "}
              <span className="font-mono tabular-nums">{totalItems}</span>)
            </span>
          )}
        </span>

        {/* Page Size Selector */}
        <div className="flex items-center gap-1.5 ms-2">
          <span className="text-[11px]">{isEn ? "Per page:" : "لكل صفحة:"}</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-background border border-input rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label={isEn ? "Items per page" : "عدد العناصر بالصفحة"}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg border border-border/80 hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
            aria-label={isEn ? "Previous page" : "الصفحة السابقة"}
          >
            {isEn ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center gap-1 font-mono">
            {getPageNumbers().map((p, idx) =>
              p === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-2 py-1 text-muted-foreground">
                  ...
                </span>
              ) : (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => onPageChange(Number(p))}
                  className={`min-w-[28px] h-7 px-2 text-xs rounded-lg font-semibold transition-colors ${
                    currentPage === p
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "border border-border/80 hover:bg-muted text-foreground"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-border/80 hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
            aria-label={isEn ? "Next page" : "الصفحة التالية"}
          >
            {isEn ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
};

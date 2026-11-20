import React from "react";
import { Search, Star, AlertTriangle, ChevronRight, ChevronLeft } from "lucide-react";
import {
  CustomerLoyaltyRecord,
  FilterMode,
  formatPoints,
  toNumber,
} from "./types";

interface CustomerPointsTableProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterMode: FilterMode;
  onFilterModeChange: (mode: FilterMode) => void;
  paginatedRecords: CustomerLoyaltyRecord[];
  selectedRecordId: string;
  onSelectRecord: (id: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const CustomerPointsTable: React.FC<CustomerPointsTableProps> = ({
  searchQuery,
  onSearchChange,
  filterMode,
  onFilterModeChange,
  paginatedRecords,
  selectedRecordId,
  onSelectRecord,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <div className="space-y-3 lg:col-span-2">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 rounded-xl border border-border dark:border-border bg-white dark:bg-muted p-2 sm:p-2.5 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="ابحث باسم العميل، إيميل، رقم الهاتف..."
            className="w-full rounded-lg border border-border bg-muted py-1.5 ps-3 pe-9 text-right text-xs sm:text-sm text-foreground outline-none focus:bg-white focus:border-border dark:border-border dark:bg-muted dark:text-white transition-all"
          />
        </div>
        <div className="flex items-center gap-1 p-0.5 bg-muted dark:bg-muted rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => onFilterModeChange("ALL")}
            className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
              filterMode === "ALL"
                ? "bg-white text-foreground dark:bg-muted dark:text-white shadow-2xs"
                : "text-gray-500 hover:text-foreground dark:text-muted-foreground"
            }`}
          >
            الكل
          </button>
          <button
            type="button"
            onClick={() => onFilterModeChange("VIP")}
            className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
              filterMode === "VIP"
                ? "bg-white text-foreground dark:bg-muted dark:text-white shadow-2xs"
                : "text-gray-500 hover:text-foreground dark:text-muted-foreground"
            }`}
          >
            <Star className="h-3 w-3 text-warning" />
            VIP
          </button>
          <button
            type="button"
            onClick={() => onFilterModeChange("AT_RISK")}
            className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
              filterMode === "AT_RISK"
                ? "bg-white text-foreground dark:bg-muted dark:text-white shadow-2xs"
                : "text-gray-500 hover:text-foreground dark:text-muted-foreground"
            }`}
          >
            <AlertTriangle className="h-3 w-3 text-destructive" />
            مهدد
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-2xs dark:border-border dark:bg-muted flex flex-col min-h-[400px]">
        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-border dark:divide-border">
            <thead className="bg-gray-50/70 dark:bg-muted sticky top-0 border-b border-border dark:border-border">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">العميل</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">البرنامج</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">الرصيد</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">المستوى</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border">
              {paginatedRecords.map((record) => {
                const isSelected = selectedRecordId === record.id;
                return (
                  <tr
                    key={record.id}
                    onClick={() => onSelectRecord(record.id)}
                    className={`cursor-pointer transition-colors border-b border-border dark:border-border last:border-0 ${
                      isSelected
                        ? "bg-slate-100/90 dark:bg-muted"
                        : "hover:bg-gray-50/70 dark:hover:bg-muted"
                    }`}
                  >
                    <td className="px-4 py-2.5 text-right">
                      <p className="font-semibold text-foreground text-xs sm:text-sm">
                        {record.customer.firstName} {record.customer.lastName}
                      </p>
                      <p className="text-[11px] text-muted-foreground/80 font-mono tabular-nums" dir="ltr">
                        {record.customer.phone || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-foreground">
                      {record.program.nameAr || record.program.name}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold font-mono tabular-nums text-xs sm:text-sm text-foreground">
                      {formatPoints(toNumber(record.currentPoints))}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-foreground">
                      <span className="inline-flex items-center rounded-full border border-border dark:border-border px-2 py-0.5 text-[11px] font-medium bg-muted text-foreground dark:bg-muted dark:text-muted-foreground">
                        {record.tier?.nameAr || record.tier?.name || "بدون مستوى"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {paginatedRecords.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="p-10 text-center text-sm text-muted-foreground">
                      لا يوجد عملاء مطابقون للبحث والتصفية.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 dark:border-border bg-muted dark:bg-muted">
            <p className="text-sm text-muted-foreground font-mono tabular-nums">
              صفحة <span className="font-medium">{currentPage}</span> من{" "}
              <span className="font-medium">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded bg-white border border-border dark:bg-muted dark:border-border disabled:opacity-50 text-foreground hover:bg-muted cursor-pointer"
                aria-label="الصفحة السابقة"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded bg-white border border-border dark:bg-muted dark:border-border disabled:opacity-50 text-foreground hover:bg-muted cursor-pointer"
                aria-label="الصفحة التالية"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

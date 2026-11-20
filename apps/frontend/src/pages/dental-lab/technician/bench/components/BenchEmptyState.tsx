import React from "react";
import { Layers } from "lucide-react";
import { BenchFilterPriority } from "../types/dentalTechBenchTypes";

interface BenchEmptyStateProps {
  filterPriority: BenchFilterPriority;
  onResetFilter: () => void;
}

export const BenchEmptyState: React.FC<BenchEmptyStateProps> = ({
  filterPriority,
  onResetFilter,
}) => {
  return (
    <div className="text-center py-16 bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-6">
      <div className="w-12 h-12 rounded-full bg-muted dark:bg-muted text-muted-foreground mx-auto flex items-center justify-center mb-3">
        <Layers className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-foreground">
        {filterPriority === "OVERDUE"
          ? "ممتاز! لا توجد أي حالات متأخرة حالياً"
          : "لا توجد حالات مطابقة لمعايير البحث الحالية"}
      </h4>
      <p className="text-xs text-muted-foreground mt-1">
        {filterPriority === "OVERDUE"
          ? "جميع الحالات المسندة إليك تسير وفق الجدول الزمني المحدد"
          : "جرب تغيير نص البحث أو اختيار تصفية أخرى"}
      </p>
      {filterPriority !== "ALL" && (
        <button
          type="button"
          onClick={onResetFilter}
          className="mt-3 px-3 py-1.5 text-xs font-semibold text-primary border border-primary dark:border-primary rounded-lg hover:bg-primary/10"
        >
          عرض كافة الحالات
        </button>
      )}
    </div>
  );
};

export default BenchEmptyState;

import React from "react";
import { AlertTriangle } from "lucide-react";
import { BenchFilterPriority } from "../types/dentalTechBenchTypes";

interface BenchOverdueAlertProps {
  overdueCount: number;
  filterPriority: BenchFilterPriority;
  onFilterOverdue: () => void;
}

export const BenchOverdueAlert: React.FC<BenchOverdueAlertProps> = ({
  overdueCount,
  filterPriority,
  onFilterOverdue,
}) => {
  if (overdueCount === 0 || filterPriority === "OVERDUE") {
    return null;
  }

  return (
    <div className="p-3 bg-destructive/10 dark:bg-destructive/40 border border-destructive dark:border-destructive rounded-xl flex items-center justify-between gap-3 text-xs text-destructive dark:text-destructive shadow-xs">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 animate-bounce" />
        <span>
          يوجد{" "}
          <b className="tabular-nums font-mono font-bold">
            {overdueCount}
          </b>{" "}
          حالة متأخرة عن موعد التسليم المقرر للعيادة. يرجى إعطاؤها الأولوية القصوى
          على الطاولة.
        </span>
      </div>
      <button
        type="button"
        onClick={onFilterOverdue}
        className="px-2.5 py-1 bg-destructive hover:bg-destructive text-white font-bold rounded-lg shrink-0 transition"
      >
        تصفية المتأخرات فقط
      </button>
    </div>
  );
};

export default BenchOverdueAlert;

import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

export interface DentalCasesFilterModeTabsProps {
  total: number;
  trashCount: number;
  viewMode: "ACTIVE" | "OVERDUE" | "TRASH";
  onViewModeChange: (mode: "ACTIVE" | "OVERDUE" | "TRASH") => void;
  setPage: (p: number | ((prev: number) => number)) => void;
}

export const DentalCasesFilterModeTabs: React.FC<DentalCasesFilterModeTabsProps> = ({
  total,
  trashCount,
  viewMode,
  onViewModeChange,
  setPage,
}) => {
  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-foreground dark:text-muted-foreground flex items-center gap-1.5">
          <span>حالات معمل الأسنان</span>
          <span className="text-xs font-mono tabular-nums font-bold px-2 py-0.5 rounded-full bg-muted dark:bg-muted text-foreground dark:text-muted-foreground">
            {total}
          </span>
        </h2>
      </div>

      {/* Segmented Mode Selector: Active / Overdue / Trash */}
      <div className="flex items-center bg-muted dark:bg-muted p-0.5 rounded-xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            onViewModeChange("ACTIVE");
            setPage(1);
          }}
          className={`px-3 py-1 rounded-lg transition-all ${
            viewMode === "ACTIVE"
              ? "bg-card text-foreground dark:text-muted-foreground shadow-2xs"
              : "text-slate-500 dark:text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
          }`}
        >
          النشطة
        </button>
        <button
          type="button"
          onClick={() => {
            onViewModeChange("OVERDUE");
            setPage(1);
          }}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
            viewMode === "OVERDUE"
              ? "bg-rose-600 text-white shadow-2xs"
              : "text-rose-600 dark:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/40"
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          <span>المتأخرة</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onViewModeChange("TRASH");
            setPage(1);
          }}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
            viewMode === "TRASH"
              ? "bg-slate-700 dark:bg-muted text-white shadow-2xs"
              : "text-slate-500 dark:text-muted-foreground hover:text-foreground"
          }`}
        >
          <Trash2 className="w-3 h-3" />
          <span>سلة المهملات</span>
          {trashCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted dark:bg-muted text-foreground dark:text-muted-foreground font-mono tabular-nums">
              {trashCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default DentalCasesFilterModeTabs;

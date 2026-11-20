import { Archive, Users } from "lucide-react";
import type { DoctorsViewMode } from "../types/doctorsTypes";

interface DoctorsViewSwitchProps {
  viewMode: DoctorsViewMode;
  onViewModeChange: (mode: DoctorsViewMode) => void;
  activeCount: number;
  archivedCount: number;
}

export function DoctorsViewSwitch({
  viewMode,
  onViewModeChange,
  activeCount,
  archivedCount,
}: DoctorsViewSwitchProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 p-1 bg-muted dark:bg-muted rounded-xl border dark:border-border w-fit">
        <button
          onClick={() => onViewModeChange("ACTIVE")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
            viewMode === "ACTIVE"
              ? "bg-card text-primary dark:text-primary shadow-sm"
              : "text-gray-600 dark:text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>الأطباء النشطين</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary dark:bg-primary/40 text-primary dark:text-primary font-bold font-mono tabular-nums">
            {activeCount}
          </span>
        </button>
        <button
          onClick={() => onViewModeChange("ARCHIVED")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
            viewMode === "ARCHIVED"
              ? "bg-card text-warning dark:text-warning shadow-sm"
              : "text-gray-600 dark:text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>الأطباء المؤرشفين</span>
          {archivedCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-warning dark:bg-warning/40 text-warning dark:text-warning font-bold font-mono tabular-nums">
              {archivedCount}
            </span>
          )}
        </button>
      </div>

      {viewMode === "ARCHIVED" && (
        <div className="text-xs text-warning dark:text-warning bg-warning/10 dark:bg-warning/30 border border-warning dark:border-warning px-3 py-1.5 rounded-lg">
          الأطباء المؤرشفين محتفظ بسجلاتهم المالية السابقة ولا يمكن تعيين حالات جديدة لهم.
        </div>
      )}
    </div>
  );
}

export default DoctorsViewSwitch;

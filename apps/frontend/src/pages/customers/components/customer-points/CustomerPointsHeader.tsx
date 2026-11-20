import React from "react";
import { UserPlus, RefreshCw } from "lucide-react";

interface CustomerPointsHeaderProps {
  onOpenEnroll: () => void;
  onRefresh: () => void;
}

export const CustomerPointsHeader: React.FC<CustomerPointsHeaderProps> = ({
  onOpenEnroll,
  onRefresh,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground dark:text-white sm:text-2xl">
          مركز نقاط العملاء
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
          لوحة شاملة لنقاط العملاء ومستوياتهم وحملات حفظ الولاء.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenEnroll}
          className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-muted dark:bg-white dark:text-foreground dark:hover:bg-muted active:scale-[0.98] transition-all cursor-pointer"
        >
          <UserPlus className="h-3.5 w-3.5" />
          إضافة عميل
        </button>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center justify-center rounded-lg border border-border dark:border-border bg-card p-1.5 text-muted-foreground hover:bg-muted/50/80 shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
          title="تحديث"
          aria-label="تحديث"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

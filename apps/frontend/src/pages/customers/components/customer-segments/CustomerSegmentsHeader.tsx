import React from "react";
import { RefreshCw } from "lucide-react";

interface CustomerSegmentsHeaderProps {
  onRefresh: () => void;
}

export const CustomerSegmentsHeader: React.FC<CustomerSegmentsHeaderProps> = ({ onRefresh }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground dark:text-white sm:text-2xl">
          مركز تقسيم العملاء
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
          إدارة شاملة لتصنيفات العملاء وجودتهم وولائهم
        </p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border dark:border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted/50/80 shadow-2xs active:scale-[0.98] transition-all self-start sm:self-auto cursor-pointer"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        تحديث
      </button>
    </div>
  );
};

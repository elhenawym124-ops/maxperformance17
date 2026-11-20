import React from "react";
import { AlertCircle } from "lucide-react";

export const ManualAttendanceHeader: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          تعديل الحضور اليدوي
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          تعديل سجلات الحضور والانصراف للموظفين
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm text-foreground dark:text-muted-foreground bg-muted dark:bg-muted px-3 py-1.5 rounded-lg border border-border dark:border-border">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>التعديلات تُحفظ فوراً عند الضغط على حفظ</span>
      </div>
    </div>
  );
};

import React from "react";
import { CalendarClock, X as XMarkIcon } from "lucide-react";

export interface DentalInvoiceBatchHeaderProps {
  submitting: boolean;
  onClose: () => void;
}

export const DentalInvoiceBatchHeader: React.FC<DentalInvoiceBatchHeaderProps> = ({
  submitting,
  onClose,
}) => {
  return (
    <div className="flex items-center justify-between pb-3 border-b dark:border-border mb-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-primary/10 dark:bg-primary/40 text-primary rounded-lg">
          <CalendarClock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold">إصدار الفواتير الشهرية المجمعة</h3>
          <p className="text-xs text-muted-foreground">
            تجميع الحالات المكتملة أو قيد التشغيل وإصدار مطالبات رسمية للأطباء
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => !submitting && onClose()}
        disabled={submitting}
        className="p-1 hover:bg-muted dark:hover:bg-muted rounded-lg dark:text-muted-foreground disabled:opacity-50 transition-colors"
        aria-label="إغلاق"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

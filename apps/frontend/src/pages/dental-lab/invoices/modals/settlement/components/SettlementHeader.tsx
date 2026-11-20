import React from "react";
import { CalendarClock, X as XMarkIcon } from "lucide-react";

interface SettlementHeaderProps {
  period: string;
  onClose: () => void;
}

export const SettlementHeader: React.FC<SettlementHeaderProps> = ({
  period,
  onClose,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between pb-3 border-b dark:border-border mb-3 gap-2">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-primary/10 dark:bg-primary/40 text-primary rounded-xl">
          <CalendarClock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <span>تقفيل المستحقات الشهرية وتجميد الأرصدة</span>
            <span className="text-xs font-normal text-primary bg-primary/10 dark:bg-primary/50 px-2 py-0.5 rounded-md border border-primary dark:border-primary font-mono tabular-nums">
              {period}
            </span>
          </h3>
          <p className="text-xs text-muted-foreground">
            تسوية فواتير ومسددات الشهر لكل طبيب، ترحيل رصيد أول المدة، وتجميد
            الحسابات للتدقيق المحاسبي
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="p-1 hover:bg-muted dark:hover:bg-muted rounded-lg dark:text-muted-foreground"
        aria-label="إغلاق"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default SettlementHeader;

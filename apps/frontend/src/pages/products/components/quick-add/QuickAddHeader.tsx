import React from "react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface QuickAddHeaderProps {
  titleId: string;
  onClose: () => void;
}

export const QuickAddHeader: React.FC<QuickAddHeaderProps> = ({
  titleId,
  onClose,
}) => {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border dark:border-border bg-muted dark:bg-muted shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/30 text-primary font-bold text-sm">
          <PlusIcon className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 id={titleId} className="text-base sm:text-lg font-bold text-foreground dark:text-muted-foreground">
              إنشاء طلب سريع
            </h2>
            <span className="px-2 py-0.5 text-[11px] font-semibold text-success dark:text-success bg-success/10 dark:bg-success/30 border border-success dark:border-success/40 rounded-full">
              طلب سريع
            </span>
          </div>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
            أدخل البيانات الأساسية لإطلاق منتجك في متجرك فوراً
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="إغلاق النافذة"
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground hover:bg-muted dark:hover:bg-muted transition-colors"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

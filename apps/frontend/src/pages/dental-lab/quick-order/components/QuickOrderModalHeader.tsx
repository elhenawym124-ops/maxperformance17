import React from "react";
import { RotateCcw, Stethoscope, X as XMarkIcon } from "lucide-react";

export interface QuickOrderModalHeaderProps {
  draftRestored: boolean;
  clearDraft: () => void;
  submitting: boolean;
  submittingAndPrint: boolean;
  onCancel: () => void;
}

export const QuickOrderModalHeader: React.FC<QuickOrderModalHeaderProps> = ({
  draftRestored,
  clearDraft,
  submitting,
  submittingAndPrint,
  onCancel,
}) => {
  const isBusy = submitting || submittingAndPrint;

  return (
    <div className="flex items-center justify-between p-4 sm:p-5 border-b dark:border-border shrink-0">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            <span>الطلب السريع لأمر الشغل</span>
          </h3>
          {draftRestored && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-warning text-warning dark:bg-warning/40 dark:text-warning text-[11px] font-semibold border border-warning dark:border-warning">
              <span>مسودة مسترجعة</span>
              <button
                type="button"
                onClick={clearDraft}
                title="تفريغ المسودة وبدء طلب جديد"
                className="hover:text-red-600 p-0.5 transition-colors"
                aria-label="تفريغ المسودة"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          تسجيل حالة جديدة، تحديد الأسنان، التحقق من الائتمان، وإسناد الفني في 3 خطوات بسيطة
        </p>
      </div>
      <button
        type="button"
        onClick={() => !isBusy && onCancel()}
        disabled={isBusy}
        className="p-1 hover:bg-muted rounded-lg dark:text-muted-foreground disabled:opacity-50 transition-colors"
        aria-label="إغلاق"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

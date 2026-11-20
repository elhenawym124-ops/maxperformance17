import React from "react";
import { CheckIcon } from "@heroicons/react/24/outline";

interface QuickAddFooterProps {
  onAdvanceToNew: () => void;
  onClose: () => void;
  onSubmit: (advanceToFullEditor: boolean) => void;
  submitting: boolean;
  actionType: "publish" | "advance";
}

export const QuickAddFooter: React.FC<QuickAddFooterProps> = ({
  onAdvanceToNew,
  onClose,
  onSubmit,
  submitting,
  actionType,
}) => {
  return (
    <div className="p-4 border-t border-border dark:border-border bg-muted dark:bg-muted flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
      <button
        type="button"
        onClick={onAdvanceToNew}
        className="text-xs text-muted-foreground hover:text-primary dark:text-muted-foreground dark:hover:text-primary transition-colors order-2 sm:order-1"
      >
        الانتقال للنموذج المتقدم مباشرة ←
      </button>

      <div className="flex items-center gap-2.5 w-full sm:w-auto order-1 sm:order-2">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-4 py-2 text-xs sm:text-sm font-semibold text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted rounded-xl transition-colors shrink-0"
        >
          إلغاء
        </button>

        <button
          type="button"
          onClick={() => onSubmit(true)}
          disabled={submitting}
          className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-primary dark:text-primary bg-primary/10 dark:bg-primary/30 hover:bg-primary dark:hover:bg-primary/50 border border-primary dark:border-primary/60 rounded-xl transition-all shrink-0"
        >
          {submitting && actionType === "advance" ? "جارٍ الحفظ..." : "حفظ ومتابعة التفاصيل"}
        </button>

        <button
          type="button"
          onClick={() => onSubmit(false)}
          disabled={submitting}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-primary hover:bg-primary/90 active:scale-97 shadow-sm rounded-xl transition-all disabled:opacity-50 shrink-0"
        >
          {submitting && actionType === "publish" ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <CheckIcon className="w-4 h-4" />
              <span>حفظ ونشر فوراً</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

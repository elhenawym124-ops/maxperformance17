import React from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

export interface OrderPreparationSaveBarProps {
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
}

export const OrderPreparationSaveBar: React.FC<OrderPreparationSaveBarProps> = ({
  saving,
  onSave,
  onReset,
}) => {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted p-4 sm:flex-row sm:items-center sm:justify-between dark:border-border dark:bg-muted">
      <p className="text-xs text-foreground sm:text-sm dark:text-muted-foreground">
        سيتم حفظ القواعد الحالية داخل إعدادات الشركة، ويمكن تعديلها في أي وقت.
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onReset}
          disabled={saving}
          className="border-slate-200 text-xs font-bold text-foreground hover:bg-muted dark:border-border dark:text-muted-foreground dark:hover:bg-muted"
        >
          <ArrowPathIcon className="ms-1.5 h-3.5 w-3.5" />
          <span>استرجاع الافتراضي</span>
        </Button>
        <Button
          onClick={onSave}
          disabled={saving}
          className="bg-indigo-600 text-xs font-bold text-white shadow-xs hover:bg-primary dark:bg-primary dark:hover:bg-primary"
        >
          {saving ? "جاري الحفظ..." : "حفظ إعدادات التجهيز"}
        </Button>
      </div>
    </div>
  );
};

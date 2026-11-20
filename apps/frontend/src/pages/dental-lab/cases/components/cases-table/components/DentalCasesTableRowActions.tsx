import React from "react";
import {
  ArrowRightCircle,
  Eye,
  Pencil,
  Printer,
  RotateCcw,
  Trash2,
} from "lucide-react";
import type { DentalLabCase } from "../../../../shared";
import { CASE_STATUS_MAP, nextStatusOf } from "../../../../shared";
import type { DentalCasesTableViewMode } from "../types";

export interface DentalCasesTableRowActionsProps {
  dentalCase: DentalLabCase;
  viewMode: DentalCasesTableViewMode;
  isBusy: boolean;
  onInspectCase: (c: DentalLabCase) => void;
  onAdvanceCase: (c: DentalLabCase) => void;
  onEditCase: (c: DentalLabCase) => void;
  onPrintPanLabel: (c: DentalLabCase) => void;
  onTrashCase: (c: DentalLabCase) => void;
  onRestoreCase: (c: DentalLabCase) => void;
  onPermanentDelete: (c: DentalLabCase) => void;
}

export const DentalCasesTableRowActions: React.FC<DentalCasesTableRowActionsProps> = ({
  dentalCase,
  viewMode,
  isBusy,
  onInspectCase,
  onAdvanceCase,
  onEditCase,
  onPrintPanLabel,
  onTrashCase,
  onRestoreCase,
  onPermanentDelete,
}) => {
  const next = nextStatusOf(dentalCase.status);

  if (viewMode === "TRASH") {
    return (
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => onRestoreCase(dentalCase)}
          disabled={isBusy}
          className="p-1 text-xs font-semibold bg-primary/10 text-primary rounded hover:bg-primary transition-colors disabled:opacity-50"
          title="استعادة"
          aria-label="استعادة"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPermanentDelete(dentalCase)}
          disabled={isBusy}
          className="p-1 text-xs font-semibold bg-destructive/10 text-destructive rounded hover:bg-destructive transition-colors disabled:opacity-50"
          title="حذف نهائي"
          aria-label="حذف نهائي"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-0.5">
      <button
        type="button"
        onClick={() => onInspectCase(dentalCase)}
        className="p-1.5 hover:bg-primary/10 dark:hover:bg-primary/40 text-primary dark:text-primary rounded-lg transition-colors"
        title="معاينة سريعة منبثقة (درج فحص)"
        aria-label="معاينة فحص"
      >
        <Eye className="w-3.5 h-3.5" />
      </button>

      {next && (
        <button
          type="button"
          onClick={() => onAdvanceCase(dentalCase)}
          className="p-1.5 hover:bg-success/10 dark:hover:bg-success/40 text-success dark:text-success rounded-lg transition-colors"
          title={`نقل إلى: ${CASE_STATUS_MAP[next]?.label || next}`}
          aria-label="ترقية المرحلة"
        >
          <ArrowRightCircle className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
      )}

      <button
        type="button"
        onClick={() => onEditCase(dentalCase)}
        className="p-1.5 hover:bg-muted dark:hover:bg-muted text-muted-foreground rounded-lg transition-colors"
        title="تعديل سريع"
        aria-label="تعديل سريع"
      >
        <Pencil className="w-3.5 h-3.5 text-primary" />
      </button>

      <button
        type="button"
        onClick={() => onPrintPanLabel(dentalCase)}
        className="p-1.5 hover:bg-muted dark:hover:bg-muted text-muted-foreground rounded-lg transition-colors"
        title="طباعة تيكت صينية"
        aria-label="طباعة تيكت صينية"
      >
        <Printer className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onTrashCase(dentalCase)}
        disabled={isBusy}
        className="p-1.5 hover:bg-destructive/10 dark:hover:bg-destructive/40 text-destructive rounded-lg transition-colors disabled:opacity-50"
        title="نقل إلى سلة المهملات"
        aria-label="نقل للمهملات"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

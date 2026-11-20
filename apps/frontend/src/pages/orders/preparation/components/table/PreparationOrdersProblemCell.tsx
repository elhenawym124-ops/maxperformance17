import React from "react";
import { useTranslation } from "react-i18next";
import { ExclamationTriangleIcon, PencilIcon } from "@heroicons/react/24/outline";
import type { ProblemHoldDetails } from "../../types";

export interface PreparationOrdersProblemCellProps {
  orderNumber: string;
  isProblemHeld: boolean;
  problemHoldDetails: ProblemHoldDetails;
  rowBusy: boolean;
  onEditProblemReason: (orderNumber: string) => void;
}

export const PreparationOrdersProblemCell: React.FC<PreparationOrdersProblemCellProps> = ({
  orderNumber,
  isProblemHeld,
  problemHoldDetails,
  rowBusy,
  onEditProblemReason,
}) => {
  const { t } = useTranslation();

  return (
    <td className="px-3 py-2.5">
      {isProblemHeld ? (
        <div className="flex items-start gap-1">
          <button
            type="button"
            onClick={() => onEditProblemReason(orderNumber)}
            disabled={rowBusy}
            title={String(t("preparation.problemPanel.edit"))}
            className="mt-0.5 shrink-0 rounded border border-border/70 bg-background p-1 text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            <PencilIcon className="h-3 w-3" />
          </button>
          {problemHoldDetails.reason ? (
            <span
              className="line-clamp-2 max-w-[180px] rounded border border-warning/80 bg-warning/80 px-2 py-0.5 text-[11px] font-medium text-warning dark:border-warning/60 dark:bg-warning/60 dark:text-warning"
              title={problemHoldDetails.reason}
            >
              {problemHoldDetails.reason}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onEditProblemReason(orderNumber)}
              disabled={rowBusy}
              className="inline-flex items-center gap-1 rounded border border-dashed border-warning bg-warning/60 px-2 py-0.5 text-[11px] font-semibold text-warning transition hover:bg-warning disabled:opacity-50 dark:border-warning dark:bg-warning/50 dark:text-warning"
            >
              <ExclamationTriangleIcon className="h-3 w-3" />
              {t("preparation.problemPanel.addReason")}
            </button>
          )}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground/60">—</span>
      )}
    </td>
  );
};

export default PreparationOrdersProblemCell;

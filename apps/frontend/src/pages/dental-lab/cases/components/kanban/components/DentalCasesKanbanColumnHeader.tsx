import React from "react";
import { Link } from "react-router-dom";
import type { DentalCaseStatusConfig } from "../../../../shared";

export interface DentalCasesKanbanColumnHeaderProps {
  stage: DentalCaseStatusConfig;
  count: number;
  applyFilter: (key: string, value: string, resetOthers?: boolean) => void;
}

export const DentalCasesKanbanColumnHeader: React.FC<DentalCasesKanbanColumnHeaderProps> = ({
  stage,
  count,
  applyFilter,
}) => {
  return (
    <div className="p-3.5 border-b border-border dark:border-border flex items-center justify-between bg-card rounded-t-2xl">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${stage.dotColor}`} />
        <Link
          to={`/dental-lab/cases?status=${stage.id}`}
          onClick={(e) => {
            e.stopPropagation();
            applyFilter("status", stage.id, true);
          }}
          className="font-bold text-sm text-foreground hover:text-primary dark:hover:text-primary hover:underline cursor-pointer transition-colors"
          title={`عرض كل حالات مرحلة "${stage.label}" فقط`}
        >
          {stage.label}
        </Link>
      </div>
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-foreground font-mono tabular-nums">
        {count}
      </span>
    </div>
  );
};

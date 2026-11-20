import React from "react";
import type { DentalCaseStatusConfig, DentalLabCase } from "../../../../shared";
import { DentalCasesKanbanColumnHeader } from "./DentalCasesKanbanColumnHeader";
import { DentalCasesKanbanCard } from "./DentalCasesKanbanCard";

export interface DentalCasesKanbanColumnProps {
  stage: DentalCaseStatusConfig;
  stageCases: DentalLabCase[];
  selectedCaseIds: Set<string>;
  toggleSelect: (id: string) => void;
  isCaseOverdue: (c: DentalLabCase) => boolean;
  getDaysOverdue: (c: DentalLabCase) => number;
  applyFilter: (key: string, value: string, resetOthers?: boolean) => void;
  onAdvanceCase: (c: DentalLabCase) => void;
  onAssignCase: (c: DentalLabCase) => void;
  onPrintPanLabel: (c: DentalLabCase) => void;
  onEditCase: (c: DentalLabCase) => void;
}

export const DentalCasesKanbanColumn: React.FC<DentalCasesKanbanColumnProps> = ({
  stage,
  stageCases,
  selectedCaseIds,
  toggleSelect,
  isCaseOverdue,
  getDaysOverdue,
  applyFilter,
  onAdvanceCase,
  onAssignCase,
  onPrintPanLabel,
  onEditCase,
}) => {
  return (
    <div className="w-80 shrink-0 flex flex-col bg-muted dark:bg-muted rounded-xl border border-border dark:border-border shadow-xs max-h-[calc(100vh-300px)]">
      <DentalCasesKanbanColumnHeader
        stage={stage}
        count={stageCases.length}
        applyFilter={applyFilter}
      />

      <div className="p-3 space-y-3 overflow-y-auto flex-1">
        {stageCases.length === 0 ? (
          <div className="py-8 text-center border-2 border-dashed border-border dark:border-border rounded-xl text-xs text-muted-foreground">
            لا توجد حالات حالياً
          </div>
        ) : (
          stageCases.map((c) => {
            const overdue = isCaseOverdue(c);
            const daysOverdue = overdue ? getDaysOverdue(c) : 0;
            const isSelected = selectedCaseIds.has(c.id);

            return (
              <DentalCasesKanbanCard
                key={c.id}
                dentalCase={c}
                isSelected={isSelected}
                isOverdue={overdue}
                daysOverdue={daysOverdue}
                toggleSelect={toggleSelect}
                applyFilter={applyFilter}
                onAdvanceCase={onAdvanceCase}
                onAssignCase={onAssignCase}
                onPrintPanLabel={onPrintPanLabel}
                onEditCase={onEditCase}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

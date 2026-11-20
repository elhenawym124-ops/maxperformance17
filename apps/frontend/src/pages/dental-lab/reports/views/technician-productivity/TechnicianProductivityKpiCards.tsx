import React from "react";
import { fmtMoney } from "../../../shared";

export interface TechnicianProductivityKpiCardsProps {
  totalStages: number;
  totalUnits: number;
  totalWages: number;
  totalRemakes: number;
}

export const TechnicianProductivityKpiCards: React.FC<TechnicianProductivityKpiCardsProps> = ({
  totalStages,
  totalUnits,
  totalWages,
  totalRemakes,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-xl border border-border dark:border-border bg-card p-4">
        <p className="text-xs text-muted-foreground font-medium">
          إجمالي المراحل المكتملة
        </p>
        <p className="text-2xl font-bold mt-1 text-primary dark:text-primary tabular-nums font-mono">
          {totalStages} <span className="text-xs font-normal text-muted-foreground">مرحلة</span>
        </p>
      </div>
      <div className="rounded-xl border border-border dark:border-border bg-card p-4">
        <p className="text-xs text-muted-foreground font-medium">
          إجمالي الوحدات المنجزة
        </p>
        <p className="text-2xl font-bold mt-1 text-primary dark:text-primary tabular-nums font-mono">
          {totalUnits} <span className="text-xs font-normal text-muted-foreground">وحدة</span>
        </p>
      </div>
      <div className="rounded-xl border border-border dark:border-border bg-card p-4">
        <p className="text-xs text-muted-foreground font-medium">
          إجمالي مستحقات وأجور الفريق
        </p>
        <p className="text-2xl font-bold mt-1 text-success dark:text-success tabular-nums font-mono">
          {fmtMoney(totalWages)}{" "}
          <span className="text-xs font-normal text-muted-foreground">ج.م</span>
        </p>
      </div>
      <div className="rounded-xl border border-border dark:border-border bg-card p-4">
        <p className="text-xs text-muted-foreground font-medium">
          إجمالي الإعادات المرتبطة
        </p>
        <p
          className={`text-2xl font-bold mt-1 tabular-nums font-mono ${
            totalRemakes > 0 ? "text-amber-600" : "text-gray-600"
          }`}
        >
          {totalRemakes} <span className="text-xs font-normal text-muted-foreground">حالة</span>
        </p>
      </div>
    </div>
  );
};

export default TechnicianProductivityKpiCards;

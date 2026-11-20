import React from "react";
import { AlertTriangle } from "lucide-react";
import { fmt } from "./formatters";

interface KpiCard {
  label: string;
  value: string;
  icon: React.ElementType;
  tone: string;
}

interface LoyaltyMapKpiCardsProps {
  kpiCards: KpiCard[];
  cashbackConflict: boolean;
  totalCashback: number;
}

export const LoyaltyMapKpiCards: React.FC<LoyaltyMapKpiCardsProps> = ({
  kpiCards,
  cashbackConflict,
  totalCashback,
}) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiCards.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted"
          >
            <div
              className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${k.tone}`}
            >
              <k.icon className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">{k.label}</p>
            <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-foreground">
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {cashbackConflict && (
        <div className="flex items-start gap-3 rounded-xl border border-warning bg-warning/10 p-4 dark:border-warning dark:bg-warning/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div className="text-sm">
            <p className="font-bold text-warning dark:text-warning">
              تناقض مؤكد في بيانات الكاش باك
            </p>
            <p className="mt-1 text-warning dark:text-warning">
              إجمالي الكاش باك <span className="font-mono tabular-nums">{fmt(totalCashback)}</span> ج.م، لكن صفحة «أداء البرامج التفصيلي»
              تعرض 0 (0 مشترك / 0 نقطة / 0 تحويل كاش باك). عُرض على عقدة «تحليلات الولاء»
              بحالة متضاربة لحين مراجعة المصدرين.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

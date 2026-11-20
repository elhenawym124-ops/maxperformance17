import React from "react";
import { SummaryCardItem } from "./types";

interface ReportsSummaryCardsProps {
  summaryCards: SummaryCardItem[];
}

export const ReportsSummaryCards: React.FC<ReportsSummaryCardsProps> = ({
  summaryCards,
}) => {
  if (summaryCards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {summaryCards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.id}
            className="bg-card shadow rounded-lg p-4 border border-border dark:border-border transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <IconComponent className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground truncate">
                  {card.title}
                </p>
                <p className="text-xl font-bold text-foreground tabular-nums tracking-tight mt-0.5">
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

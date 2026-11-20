import React from "react";
import { useTranslation } from "react-i18next";
import { CounterKey, Counters } from "./types";
import { KPI_CARDS } from "./constants";

interface RadiologyKpiCardsProps {
  counters: Counters | null;
  isCounterActive: (key: CounterKey) => boolean;
  toggleCounter: (key: CounterKey) => void;
}

export const RadiologyKpiCards: React.FC<RadiologyKpiCardsProps> = ({
  counters,
  isCounterActive,
  toggleCounter,
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {KPI_CARDS.map((card) => {
        const value = counters ? counters[card.key] : undefined;
        const active = isCounterActive(card.key);
        const clickable = card.key !== "total";
        return (
          <button
            key={card.key}
            type="button"
            disabled={!clickable}
            onClick={() => toggleCounter(card.key)}
            className={`bg-card rounded-xl shadow-sm border p-3 sm:p-4 flex items-start gap-3 text-right transition-colors ${
              active
                ? "border-blue-400 ring-1 ring-primary dark:border-primary"
                : "border-gray-200 dark:border-border"
            } ${clickable ? "cursor-pointer hover:bg-muted/50/60" : "cursor-default"}`}
          >
            <span className={`p-2 rounded-lg shrink-0 ${card.iconCls}`}>
              <card.icon className="w-5 h-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted-foreground truncate">
                {t(card.labelKey)}
              </span>
              {value === undefined ? (
                <span className="block mt-1.5 h-6 w-10 rounded bg-muted dark:bg-muted animate-pulse" />
              ) : (
                <span className="block mt-0.5 text-xl font-bold text-foreground tabular-nums">
                  {value}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

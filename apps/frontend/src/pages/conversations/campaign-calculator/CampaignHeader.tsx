import React from "react";
import { CalculatorIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { HistoricalDefaults } from "./types";

interface CampaignHeaderProps {
  defaults: HistoricalDefaults | null;
}

export const CampaignHeader: React.FC<CampaignHeaderProps> = ({ defaults }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <CalculatorIcon className="w-10 h-10 text-primary dark:text-primary" />
            حاسبة توقعات نتائج الحملات
          </h1>
          <p className="text-muted-foreground">
            خطط لحملاتك بذكاء مع توقعات دقيقة بناءً على البيانات التاريخية
          </p>
        </div>
        {defaults && (
          <div className="text-sm text-muted-foreground bg-white dark:bg-muted px-4 py-2 rounded-lg shadow">
            <SparklesIcon className="w-4 h-4 inline ms-1 text-warning dark:text-warning" />
            بيانات تاريخية متاحة
          </div>
        )}
      </div>
    </div>
  );
};

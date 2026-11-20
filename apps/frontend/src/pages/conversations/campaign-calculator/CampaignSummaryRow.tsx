import React from "react";
import { CampaignInputs, PredictionResults } from "./types";

interface CampaignSummaryRowProps {
  inputs: CampaignInputs;
  currentResults: PredictionResults;
  formatNumber: (value: number) => string;
}

export const CampaignSummaryRow: React.FC<CampaignSummaryRowProps> = ({
  inputs,
  currentResults,
  formatNumber,
}) => {
  return (
    <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 border-t business-border pt-6">
      <div>
        <p className="text-xs text-muted-foreground/80 mb-1">
          التارجيت اليومي
        </p>
        <p className="text-lg font-bold text-foreground tabular-nums">
          {formatNumber(inputs.dailyTarget)}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground/80 mb-1">
          عدد الارسال الفاشل
        </p>
        <p className="text-lg font-bold text-destructive dark:text-destructive tabular-nums">
          {formatNumber(inputs.failedMessages)}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground/80 mb-1">
          نسبة الرسايل للارسال
        </p>
        <p className="text-lg font-bold text-success dark:text-success tabular-nums">
          {currentResults.successRate.toFixed(1)}%
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground/80 mb-1">المنتج</p>
        <p className="text-lg font-bold text-foreground">
          {inputs.productName || "-"}
        </p>
      </div>
    </div>
  );
};

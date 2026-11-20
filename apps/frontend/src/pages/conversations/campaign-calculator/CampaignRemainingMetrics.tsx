import React from "react";
import { CampaignInputs, PredictionResults } from "./types";

interface CampaignRemainingMetricsProps {
  inputs: CampaignInputs;
  currentResults: PredictionResults;
  formatNumber: (value: number) => string;
}

export const CampaignRemainingMetrics: React.FC<
  CampaignRemainingMetricsProps
> = ({ inputs, currentResults, formatNumber }) => {
  return (
    <div className="lg:col-span-2 grid grid-cols-2 gap-4">
      <div className="bg-gray-50 dark:bg-muted p-5 rounded-xl border business-border">
        <p className="text-sm text-muted-foreground mb-1">
          الباقي علي تارجت الاوردرات
        </p>
        <p className="text-3xl font-bold text-warning dark:text-warning tabular-nums">
          {formatNumber(currentResults.remainingOrdersToTarget)}
        </p>
        <p className="text-xs mt-1 text-muted-foreground/80 tabular-nums">
          من أصل {inputs.orderTarget}
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-muted p-5 rounded-xl border business-border relative overflow-hidden">
        <p className="text-sm text-muted-foreground mb-1">
          إحصائيات الفشل
        </p>
        <p className="text-3xl font-bold text-destructive dark:text-destructive tabular-nums">
          {formatNumber(inputs.failedMessages)}
        </p>
        <p className="text-xs mt-1 font-bold text-destructive dark:text-destructive tabular-nums">
          نسبة الفشل: {currentResults.failureRate.toFixed(1)}%
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-muted p-5 rounded-xl border business-border">
        <p className="text-sm text-muted-foreground mb-1">
          الباقي علي تارجيت ارسال
        </p>
        <p className="text-3xl font-bold text-foreground dark:text-muted-foreground tabular-nums">
          {formatNumber(currentResults.messagesToDailyTarget)}
        </p>
        <p className="text-xs mt-1 font-bold text-muted-foreground/80 tabular-nums">
          إنجاز الإرسال: {currentResults.sendingAchievementRate.toFixed(1)}%
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-primary p-5 rounded-xl border border-primary dark:border-primary">
        <p className="text-xs text-primary dark:text-primary font-bold mb-1">
          المتوقع عند اكتمال الإرسال
        </p>
        <p className="text-3xl font-black text-primary dark:text-primary tabular-nums">
          {formatNumber(currentResults.expectedOrdersFromDaily)}
        </p>
        <p className="text-[10px] mt-1 text-primary dark:text-primary opacity-70">
          أوردر متوقع تحقيقه اليوم
        </p>
      </div>
    </div>
  );
};

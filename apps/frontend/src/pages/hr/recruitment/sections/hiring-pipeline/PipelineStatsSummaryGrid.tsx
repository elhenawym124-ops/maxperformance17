import React from "react";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

interface PipelineStatsSummaryGridProps {
  totalApplicants: number;
  activePipelineApplicants: number;
  inInterviewStages: number;
  hiredApplicants: number;
  conversionRate: number;
}

export const PipelineStatsSummaryGrid: React.FC<
  PipelineStatsSummaryGridProps
> = ({
  totalApplicants,
  activePipelineApplicants,
  inInterviewStages,
  hiredApplicants,
  conversionRate,
}) => {
  return (
    <div className="bg-card rounded-xl p-6 shadow-lg border-2 border-border dark:border-border">
      <h3 className="text-xl font-bold text-foreground dark:text-white mb-4">
        إحصائيات المسار
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="p-4 bg-primary/10 dark:bg-primary/20 rounded-xl border-2 border-primary">
          <p className="text-sm text-foreground dark:text-muted-foreground mb-1">
            إجمالي المتقدمين
          </p>
          <p className="text-3xl font-bold text-primary font-mono tabular-nums">
            {totalApplicants}
          </p>
        </div>
        <div className="p-4 bg-muted dark:bg-muted rounded-xl border-2 border-border">
          <p className="text-sm text-foreground dark:text-muted-foreground mb-1">
            داخل المسار الآن
          </p>
          <p className="text-3xl font-bold text-foreground dark:text-muted-foreground font-mono tabular-nums">
            {activePipelineApplicants}
          </p>
        </div>
        <div className="p-4 bg-primary/10 dark:bg-primary/20 rounded-xl border-2 border-primary">
          <p className="text-sm text-foreground dark:text-muted-foreground mb-1">
            في المقابلات
          </p>
          <p className="text-3xl font-bold text-primary font-mono tabular-nums">
            {inInterviewStages}
          </p>
        </div>
        <div className="p-4 bg-success/10 dark:bg-success/20 rounded-xl border-2 border-success">
          <p className="text-sm text-foreground dark:text-muted-foreground mb-1">
            تم التوظيف
          </p>
          <p className="text-3xl font-bold text-success flex items-center gap-2 font-mono tabular-nums">
            <CheckCircleIcon className="w-7 h-7" />
            {hiredApplicants}
          </p>
        </div>
        <div className="p-4 bg-destructive/10 dark:bg-destructive/20 rounded-xl border-2 border-destructive">
          <p className="text-sm text-foreground dark:text-muted-foreground mb-1">
            معدل التحويل من جديد إلى توظيف
          </p>
          <p className="text-3xl font-bold text-destructive flex items-center gap-2 font-mono tabular-nums">
            <XCircleIcon className="w-7 h-7" />
            {conversionRate}%
          </p>
        </div>
      </div>
    </div>
  );
};

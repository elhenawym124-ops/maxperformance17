import React from "react";
import { Badge } from "@/components/ui/badge";
import { CostBreakdown } from "../hooks/useCostTracker";

interface CostTrackerProps {
  breakdown: CostBreakdown;
  formatCost: (cost: number) => string;
  formatTokens: (tokens: number) => string;
}

export const CostTracker: React.FC<CostTrackerProps> = ({
  breakdown,
  formatCost,
  formatTokens,
}) => {
  return (
    <div className="p-3.5 rounded-lg border border-border dark:border-border bg-white dark:bg-muted shadow-sm space-y-3">
      <span className="block text-[10px] font-bold text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
        Cost Breakdown
      </span>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-[10px] text-muted-foreground block mb-0.5">Input Tokens</span>
          <span className="font-bold text-foreground dark:text-muted-foreground">
            {formatTokens(breakdown.inputTokens)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block mb-0.5">Output Tokens</span>
          <span className="font-bold text-foreground dark:text-muted-foreground">
            {formatTokens(breakdown.outputTokens)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block mb-0.5">Input Cost</span>
          <span className="font-bold text-info dark:text-info">
            {formatCost(breakdown.inputCost)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block mb-0.5">Output Cost</span>
          <span className="font-bold text-warning dark:text-warning">
            {formatCost(breakdown.outputCost)}
          </span>
        </div>
      </div>

      <hr className="border-slate-100 dark:border-border" />

      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-500">Tool Calls</span>
        <Badge variant="secondary" className="text-[10px] py-0 px-2">
          {breakdown.toolCallCount}
        </Badge>
      </div>

      <div className="flex justify-between items-center text-xs font-bold pt-1">
        <span className="text-slate-500">Total Cost</span>
        <span className="text-sm text-primary">
          {formatCost(breakdown.totalCost)}
        </span>
      </div>

      <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1 border-t border-border dark:border-border" title="Estimated monthly cost based on 30 sessions">
        <span>Est. Monthly</span>
        <span>{formatCost(breakdown.estimatedMonthly)}</span>
      </div>
    </div>
  );
};

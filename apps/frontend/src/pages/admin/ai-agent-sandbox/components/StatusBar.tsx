import React from "react";
import { Badge } from "@/components/ui/badge";
import { CostBreakdown } from "../hooks/useCostTracker";

interface StatusBarProps {
  messageCount: number;
  toolCallCount: number;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
  costBreakdown: CostBreakdown;
  formatCost: (cost: number) => string;
  formatTokens: (tokens: number) => string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  messageCount,
  toolCallCount,
  totalTokens,
  totalCost,
  avgLatency,
  costBreakdown,
  formatCost,
  formatTokens,
}) => {
  return (
    <div className="px-4 py-2 border-t border-border dark:border-border flex items-center justify-between gap-2 flex-wrap bg-white dark:bg-muted text-xs">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="text-[10px]" title="Messages">
          {messageCount} msgs
        </Badge>

        <Badge variant="outline" className="text-[10px] text-info dark:text-info border-info dark:border-info/50" title="Tool Calls">
          {toolCallCount} tools
        </Badge>

        <Badge variant="outline" className="text-[10px] text-primary dark:text-primary border-primary dark:border-primary/50" title="Total Tokens">
          {formatTokens(totalTokens)} tokens
        </Badge>

        <Badge variant="outline" className="text-[10px] text-warning dark:text-warning border-warning dark:border-warning/50" title="Average Latency">
          {avgLatency.toFixed(0)}ms avg
        </Badge>
      </div>

      <div className="font-bold text-primary dark:text-primary" title="Total Cost">
        {formatCost(totalCost)}
      </div>
    </div>
  );
};

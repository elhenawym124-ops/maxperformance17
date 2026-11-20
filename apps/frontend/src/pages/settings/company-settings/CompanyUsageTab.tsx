import React from "react";
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { UsageStat, resourceNames } from "./types";

interface CompanyUsageTabProps {
  usage: Record<string, UsageStat>;
}

export const CompanyUsageTab: React.FC<CompanyUsageTabProps> = ({ usage }) => {
  const getUsageColor = (stat: UsageStat) => {
    if (stat.exceeded) return "text-red-600 bg-destructive dark:bg-destructive/30 dark:text-destructive";
    if (stat.warning) return "text-yellow-600 bg-warning dark:bg-warning/30 dark:text-warning";
    return "text-green-600 bg-success dark:bg-success/30 dark:text-success";
  };

  const getUsageBarColor = (stat: UsageStat) => {
    if (stat.exceeded) return "bg-red-500";
    if (stat.warning) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatLimit = (limit: number) => {
    if (limit === -1) return "غير محدود";
    if (limit >= 1000000) return `${(limit / 1000000).toFixed(1)}م`;
    if (limit >= 1000) return `${(limit / 1000).toFixed(1)}ك`;
    return limit.toString();
  };

  return (
    <div className="bg-card shadow rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center">
        <ChartBarIcon className="h-6 w-6 text-primary me-2" />
        إحصائيات الاستخدام
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(usage).map(([resource, stat]) => (
          <div
            key={resource}
            className="border border-border dark:border-border rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-foreground">
                {resourceNames[resource] || resource}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium font-mono tabular-nums ${getUsageColor(
                  stat,
                )}`}
              >
                {stat.unlimited ? "غير محدود" : `${stat.percentage}%`}
              </span>
            </div>

            <div className="mb-2">
              <div className="flex justify-between text-sm text-foreground dark:text-muted-foreground font-mono tabular-nums">
                <span>{stat.usage.toLocaleString()}</span>
                <span>{formatLimit(stat.limit)}</span>
              </div>
              {!stat.unlimited && (
                <div className="w-full bg-muted dark:bg-muted rounded-full h-2 mt-1">
                  <div
                    className={`h-2 rounded-full ${getUsageBarColor(stat)}`}
                    style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                  ></div>
                </div>
              )}
            </div>

            {stat.exceeded && (
              <div className="flex items-center text-destructive dark:text-destructive text-xs gap-1 mt-1">
                <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
                <span>تم تجاوز الحد المسموح</span>
              </div>
            )}
            {stat.warning && !stat.exceeded && (
              <div className="flex items-center text-warning dark:text-warning text-xs gap-1 mt-1">
                <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
                <span>قريب من الحد المسموح</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

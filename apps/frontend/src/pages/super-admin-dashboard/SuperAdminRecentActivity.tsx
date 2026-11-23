import React from "react";
import { Briefcase, TrendingUp, Users, Users2 } from "lucide-react";

import { cn } from "../../lib/utils";
import { formatNumber } from "../../utils/formatNumber";
import { DashboardData } from "./types";

interface SuperAdminRecentActivityProps {
  recentActivity?: DashboardData["recentActivity"];
  comparison?: DashboardData["comparison"];
}

export const SuperAdminRecentActivity: React.FC<SuperAdminRecentActivityProps> = ({
  recentActivity,
  comparison,
}) => {
  return (
    <div className="rounded-xl border border-border/80 bg-card/40 shadow-xs overflow-hidden">
      <div className="p-3 border-b border-border/60 flex items-center justify-between gap-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-3.5 text-success dark:text-success" />
          <span className="text-xs font-semibold text-foreground">
            النشاط ومعدل النمو الأخير
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            (آخر 30 يوماً)
          </span>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-success/10 text-success dark:text-success">
          <span className="size-1.5 rounded-full bg-success" />
          نمو إيجابي
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
        <div className="p-3.5 flex flex-col justify-between hover:bg-muted/10 transition-colors">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">شركات جديدة</span>
            <Briefcase className="size-3.5 text-primary" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums mb-1">
            {formatNumber(recentActivity?.newCompaniesLast30Days || 0)}
          </div>
          {comparison?.companiesGrowth !== undefined && (
            <p
              className={cn(
                "text-[10px] font-mono font-semibold tabular-nums",
                comparison.companiesGrowth >= 0
                  ? "text-emerald-600 dark:text-success"
                  : "text-rose-600 dark:text-destructive",
              )}
            >
              {comparison.companiesGrowth >= 0 ? "↑" : "↓"}{" "}
              {formatNumber(Math.abs(comparison.companiesGrowth), { maxFractionDigits: 1 })}% عن الشهر الماضي
            </p>
          )}
        </div>

        <div className="p-3.5 flex flex-col justify-between hover:bg-muted/10 transition-colors">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">مستخدمون جدد</span>
            <Users2 className="size-3.5 text-success" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums mb-1">
            {formatNumber(recentActivity?.newUsersLast30Days || 0)}
          </div>
          {comparison?.usersGrowth !== undefined && (
            <p
              className={cn(
                "text-[10px] font-mono font-semibold tabular-nums",
                comparison.usersGrowth >= 0
                  ? "text-emerald-600 dark:text-success"
                  : "text-rose-600 dark:text-destructive",
              )}
            >
              {comparison.usersGrowth >= 0 ? "↑" : "↓"}{" "}
              {formatNumber(Math.abs(comparison.usersGrowth), { maxFractionDigits: 1 })}% عن الشهر الماضي
            </p>
          )}
        </div>

        <div className="p-3.5 flex flex-col justify-between hover:bg-muted/10 transition-colors">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">عملاء جدد</span>
            <Users className="size-3.5 text-info" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums mb-1">
            {formatNumber(recentActivity?.newCustomersLast30Days || 0)}
          </div>
          {comparison?.customersGrowth !== undefined && (
            <p
              className={cn(
                "text-[10px] font-mono font-semibold tabular-nums",
                comparison.customersGrowth >= 0
                  ? "text-emerald-600 dark:text-success"
                  : "text-rose-600 dark:text-destructive",
              )}
            >
              {comparison.customersGrowth >= 0 ? "↑" : "↓"}{" "}
              {formatNumber(Math.abs(comparison.customersGrowth), { maxFractionDigits: 1 })}% عن الشهر الماضي
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

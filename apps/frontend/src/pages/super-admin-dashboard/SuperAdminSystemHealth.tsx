import React from "react";
import { Database, HardDrive, Server, Wifi } from "lucide-react";

import { cn } from "../../lib/utils";
import { formatNumber } from "../../utils/formatNumber";
import { DashboardData } from "./types";

interface SuperAdminSystemHealthProps {
  health: DashboardData["health"];
}

export const formatUptime = (seconds?: number): string => {
  if (seconds === undefined || seconds === null || isNaN(seconds)) {
    return `${formatNumber(0)} يوم ${formatNumber(0)} ساعة`;
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${formatNumber(days)} يوم ${formatNumber(hours)} ساعة`;
};

export const formatLatency = (ms?: number | null): string => {
  if (ms === undefined || ms === null || isNaN(ms)) return "—";
  if (ms >= 1000) {
    const seconds = ms / 1000;
    const formatted = formatNumber(seconds, {
      maxFractionDigits: 1,
    });
    return `${formatted} ثانية`;
  }
  const formatted = formatNumber(Math.round(ms));
  return `${formatted} مللي ثانية`;
};

export const SuperAdminSystemHealth: React.FC<SuperAdminSystemHealthProps> = ({
  health,
}) => {
  const statusColor =
    health.status === "healthy"
      ? "bg-emerald-500"
      : health.status === "degraded"
        ? "bg-amber-500"
        : "bg-rose-500";

  const statusText =
    health.status === "healthy"
      ? "ممتاز"
      : health.status === "degraded"
        ? "منخفض"
        : "عطل";

  const dbColor =
    health.database === "connected"
      ? "text-emerald-600 dark:text-success"
      : "text-rose-600 dark:text-destructive";

  const uptimeStr = formatUptime(health?.uptime);

  return (
    <div className="flex flex-wrap items-center gap-3.5 rounded-xl border border-border/80 bg-card/40 px-4 py-2.5 shadow-xs text-xs">
      <div className="flex items-center gap-2">
        <div className={cn("size-2 rounded-full", statusColor)} />
        <span className="font-medium text-muted-foreground text-[11px]">
          حالة النظام:
        </span>
        <span
          className={cn(
            "font-semibold text-xs",
            health.status === "healthy"
              ? "text-emerald-600 dark:text-success"
              : health.status === "degraded"
                ? "text-amber-600 dark:text-warning"
                : "text-rose-600 dark:text-destructive",
          )}
        >
          {statusText}
        </span>
      </div>
      <div className="h-3.5 w-px bg-border/60" />
      <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
        <Server className="size-3.5" />
        <span className="tabular-nums">{uptimeStr}</span>
      </div>
      <div className="h-3.5 w-px bg-border/60" />
      <div className="flex items-center gap-1.5 font-mono text-[11px]">
        <Database className={cn("size-3.5", dbColor)} />
        <span className={cn("font-medium", dbColor)}>
          {health.database === "connected"
            ? "قاعدة البيانات متصلة"
            : "قاعدة البيانات منفصلة"}
        </span>
        {health.dbStats && (
          <span className="text-muted-foreground tabular-nums">
            ({formatNumber(health.dbStats.active || 0)}/{formatNumber(health.dbStats.queryCount || 0)} اتصال)
          </span>
        )}
      </div>
      <div className="h-3.5 w-px bg-border/60" />
      <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
        <Wifi className="size-3.5" />
        <span>{health.environment === "production" ? "إنتاج" : "تطوير"}</span>
      </div>
      {health.dbStats && (
        <>
          <div className="h-3.5 w-px bg-border/60" />
          <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
            <HardDrive className="size-3.5" />
            <span className="tabular-nums">{formatLatency(health.dbStats.latency)}</span>
          </div>
        </>
      )}
    </div>
  );
};

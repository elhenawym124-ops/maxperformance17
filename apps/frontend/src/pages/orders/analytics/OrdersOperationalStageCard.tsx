import React from "react";

export interface OrdersOperationalStageCardProps {
  title: string;
  statusKey: string;
  icon: React.ComponentType<{ className?: string }>;
  percentage: number;
  ordersCount: number;
  piecesCount?: number;
  subLabel: string;
  piecesLabel: string;
  tooltip: string;
  variant: "emerald" | "sky" | "amber" | "indigo" | "rose" | "red";
  onFilterStatus?: (status: string) => void;
}

const VARIANT_STYLES = {
  emerald: {
    border: "border-success/20 bg-success/[0.04] hover:bg-success/[0.08]",
    title: "text-success dark:text-success",
    badge: "text-success dark:text-success bg-success/10",
    count: "text-success dark:text-success",
    pieces: "text-success dark:text-success",
  },
  sky: {
    border: "border-info/20 bg-info/[0.04] hover:bg-info/[0.08]",
    title: "text-info dark:text-info",
    badge: "text-info dark:text-info bg-info/10",
    count: "text-info dark:text-info",
    pieces: "text-info dark:text-info",
  },
  amber: {
    border: "border-warning/20 bg-warning/[0.04] hover:bg-warning/[0.08]",
    title: "text-warning dark:text-warning",
    badge: "text-warning dark:text-warning bg-warning/10",
    count: "text-warning dark:text-warning",
    pieces: "text-warning dark:text-warning",
  },
  indigo: {
    border: "border-primary/20 bg-primary/[0.04] hover:bg-primary/[0.08]",
    title: "text-primary dark:text-primary",
    badge: "text-primary dark:text-primary bg-primary/10",
    count: "text-primary dark:text-primary",
    pieces: "text-primary dark:text-primary",
  },
  rose: {
    border: "border-destructive/20 bg-destructive/[0.04] hover:bg-destructive/[0.08]",
    title: "text-destructive dark:text-destructive",
    badge: "text-destructive dark:text-destructive bg-destructive/10",
    count: "text-destructive dark:text-destructive",
    pieces: "text-destructive dark:text-destructive",
  },
  red: {
    border: "border-destructive/20 bg-destructive/[0.04] hover:bg-destructive/[0.08]",
    title: "text-destructive dark:text-destructive",
    badge: "text-destructive dark:text-destructive bg-destructive/10",
    count: "text-destructive dark:text-destructive",
    pieces: "text-destructive dark:text-destructive",
  },
};

export const OrdersOperationalStageCard: React.FC<OrdersOperationalStageCardProps> = React.memo(
  ({
    title,
    statusKey,
    icon: Icon,
    percentage,
    ordersCount,
    piecesCount = 0,
    subLabel,
    piecesLabel,
    tooltip,
    variant,
    onFilterStatus,
  }) => {
    const style = VARIANT_STYLES[variant];

    return (
      <div
        onClick={() => onFilterStatus && onFilterStatus(statusKey)}
        className={`p-2.5 sm:p-3 rounded-lg border ${style.border} transition-colors cursor-pointer flex flex-col justify-between`}
        title={tooltip}
      >
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className={`text-xs font-bold ${style.title} flex items-center gap-1`}>
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{title}</span>
          </span>
          <span className={`text-[11px] font-black ${style.badge} px-1.5 py-0.5 rounded tabular-nums`}>
            {percentage}%
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className={`text-xl sm:text-2xl font-extrabold tabular-nums ${style.count}`}>
            {ordersCount.toLocaleString()}
          </span>
          <span className="text-[11px] text-muted-foreground">{subLabel}</span>
        </div>
        {piecesCount > 0 && (
          <span className={`text-[10px] font-semibold ${style.pieces} tabular-nums mt-0.5`}>
            {piecesCount.toLocaleString()}&nbsp;{piecesLabel}
          </span>
        )}
      </div>
    );
  }
);

OrdersOperationalStageCard.displayName = "OrdersOperationalStageCard";

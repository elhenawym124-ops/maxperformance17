import React from "react";
import { useTranslation } from "react-i18next";
import { Clock, CheckCircle2, Truck } from "lucide-react";

export interface OrderStatusDistributionSectionProps {
  statusCounts: Record<string, number>;
  totalOrders: number;
}

export const OrderStatusDistributionSection: React.FC<OrderStatusDistributionSectionProps> = ({
  statusCounts,
  totalOrders,
}) => {
  const { t } = useTranslation();

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="h-4 w-4 text-warning" />;
      case "confirmed":
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case "processing":
        return <Clock className="h-4 w-4 text-primary" />;
      case "shipped":
        return <Truck className="h-4 w-4 text-primary" />;
      case "delivered":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusKey = `orders.status.${status.toLowerCase()}`;
    return t(statusKey, { defaultValue: status });
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm lg:col-span-5">
      <h3 className="mb-4 text-xs font-bold text-foreground">
        {t("orderStats.statusDistribution")}
      </h3>
      <div className="space-y-3">
        {Object.entries(statusCounts).map(([status, count]) => {
          const pct = totalOrders > 0 ? (count / totalOrders) * 100 : 0;

          return (
            <div key={status} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <span className="font-medium text-foreground">
                    {getStatusText(status)}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums text-muted-foreground">
                  <span>{count}</span>
                  <span>({pct.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatusDistributionSection;

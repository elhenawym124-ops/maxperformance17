import React from "react";
import { TrendingDown, DollarSign, Clock, CheckCircle } from "lucide-react";
import { DeductionStats } from "./types";
import { formatCurrency } from "./helpers";

interface DeductionStatsCardsProps {
  stats: DeductionStats | null;
}

export const DeductionStatsCards: React.FC<DeductionStatsCardsProps> = ({
  stats,
}) => {
  if (!stats) return null;

  const pendingCount =
    stats.byStatus.find((s) => s.status === "PENDING")?._count || 0;
  const approvedCount =
    stats.byStatus.find((s) => s.status === "APPROVED")?._count || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground dark:text-muted-foreground">
              إجمالي الخصومات
            </p>
            <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
              {stats.total}
            </p>
          </div>
          <TrendingDown className="h-8 w-8 text-primary" />
        </div>
      </div>

      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground dark:text-muted-foreground">
              إجمالي المبلغ
            </p>
            <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
              {formatCurrency(parseFloat(stats.totalAmount || "0"))}
            </p>
          </div>
          <DollarSign className="h-8 w-8 text-success" />
        </div>
      </div>

      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground dark:text-muted-foreground">
              في الانتظار
            </p>
            <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
              {pendingCount}
            </p>
          </div>
          <Clock className="h-8 w-8 text-warning" />
        </div>
      </div>

      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground dark:text-muted-foreground">
              موافق عليها
            </p>
            <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
              {approvedCount}
            </p>
          </div>
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
      </div>
    </div>
  );
};

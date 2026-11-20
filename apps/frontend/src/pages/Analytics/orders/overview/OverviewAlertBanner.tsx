import React from "react";
import { Link } from "react-router-dom";
import {
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface OverviewAlertBannerProps {
  pendingCount?: number;
  lostRevenue?: number;
  formattedLostRevenue?: string;
  cancellationRate?: number;
}

export const OverviewAlertBanner: React.FC<OverviewAlertBannerProps> = ({
  pendingCount = 0,
  lostRevenue = 0,
  formattedLostRevenue,
  cancellationRate = 0,
}) => {
  const hasPendingAction = pendingCount > 0;
  const hasHighCancellation = cancellationRate > 25;

  if (!hasPendingAction && !hasHighCancellation) {
    return null;
  }

  return (
    <div
      role="alert"
      className="rounded-xl border border-warning/80 bg-warning/70 p-3 sm:px-4 sm:py-3 text-warning shadow-sm dark:border-warning/20 dark:bg-warning/20 dark:text-warning transition-all"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="rounded-lg bg-warning/15 p-1.5 shrink-0 text-warning dark:text-warning">
            {hasPendingAction ? (
              <ClockIcon className="h-4 w-4" />
            ) : (
              <ExclamationTriangleIcon className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-warning dark:text-warning">
              نبض المتابعة التشغيلية:
            </span>{" "}
            {hasPendingAction && (
              <span className="tabular-nums">
                يوجد{" "}
                <span className="font-bold underline decoration-warning">
                  {pendingCount}
                </span>{" "}
                طلباً بانتظار التأكيد والمعالجة الفورية اليوم.
              </span>
            )}
            {hasHighCancellation && (
              <span className="me-2 text-xs opacity-90 tabular-nums">
                (معدل الإلغاء مرتفع بنسبة {cancellationRate.toFixed(1)}%
                {lostRevenue > 0 && formattedLostRevenue
                  ? ` بإيراد مفقود يقارب ${formattedLostRevenue}`
                  : ""}
                )
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {hasPendingAction && (
            <Link
              to="/analytics/orders/today-ops"
              className="inline-flex items-center gap-1.5 rounded-lg bg-warning px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-warning active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1"
            >
              <span>مراجعة عمليات اليوم</span>
              <ArrowRightIcon className="h-3 w-3 rotate-180" />
            </Link>
          )}
          {hasHighCancellation && (
            <Link
              to="/analytics/orders/cancellations"
              className="inline-flex items-center gap-1 rounded-lg border border-warning dark:border-warning/40 bg-white dark:bg-warning/30 px-2.5 py-1 text-xs font-medium text-warning dark:text-warning hover:bg-warning/50 transition-colors"
            >
              <span>أسباب الإلغاء</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewAlertBanner;

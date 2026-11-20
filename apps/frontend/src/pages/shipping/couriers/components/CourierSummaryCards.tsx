import React from 'react';
import { CourierDashboardSummary } from '../../../../services/courierService';
import { useCurrency } from '../../../../hooks/useCurrency';

interface CourierSummaryCardsProps {
  summary: CourierDashboardSummary | null;
}

export const CourierSummaryCards: React.FC<CourierSummaryCardsProps> = ({ summary }) => {
  const { formatPrice } = useCurrency();

  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <div className="p-3.5 rounded-xl border border-border dark:border-border bg-white dark:bg-muted">
        <div className="text-xs text-muted-foreground dark:text-muted-foreground">إجمالي الأسطول</div>
        <div className="text-xl font-bold mt-1 tabular-nums font-mono">{summary.totalCouriers}</div>
      </div>
      <div className="p-3.5 rounded-xl border border-border dark:border-border bg-white dark:bg-muted">
        <div className="text-xs text-muted-foreground dark:text-muted-foreground">مناديب في الميدان</div>
        <div className="text-xl font-bold mt-1 text-success dark:text-success tabular-nums font-mono">
          {summary.activeCouriers}
        </div>
      </div>
      <div className="p-3.5 rounded-xl border border-border dark:border-border bg-white dark:bg-muted">
        <div className="text-xs text-muted-foreground dark:text-muted-foreground">مناديب متاحين</div>
        <div className="text-xl font-bold mt-1 tabular-nums font-mono">{summary.availableCouriers}</div>
      </div>
      <div className="p-3.5 rounded-xl border border-border dark:border-border bg-white dark:bg-muted">
        <div className="text-xs text-muted-foreground dark:text-muted-foreground">طرود في الطريق</div>
        <div className="text-xl font-bold mt-1 text-primary dark:text-primary tabular-nums font-mono">
          {summary.totalParcelsInField}
        </div>
      </div>
      <div className="p-3.5 rounded-xl border border-border dark:border-border bg-white dark:bg-muted">
        <div className="text-xs text-muted-foreground dark:text-muted-foreground">كاش متوقع بالشارع</div>
        <div className="text-sm sm:text-base font-bold mt-1 tabular-nums font-mono">
          {formatPrice(summary.totalExpectedCashInField)}
        </div>
      </div>
      <div className="p-3.5 rounded-xl border border-warning dark:border-warning/60 bg-warning/50 dark:bg-warning/20">
        <div className="text-xs text-warning dark:text-warning font-medium">بانتظار التوريد للخزينة</div>
        <div className="text-sm sm:text-base font-bold mt-1 text-warning dark:text-warning tabular-nums font-mono">
          {formatPrice(summary.totalCashAwaitingRemittance)}
        </div>
      </div>
    </div>
  );
};

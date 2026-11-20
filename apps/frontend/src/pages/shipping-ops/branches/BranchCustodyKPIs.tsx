import React from 'react';
import { Package, Coins, Clock, CheckSquare } from 'lucide-react';
import { formatCurrency } from '../shippingOpsShared';

interface BranchCustodyKPIsProps {
  summary: {
    totalShipments: number;
    expectedCod: number;
    aging48hCount: number;
    byStatus?: Record<string, number>;
  };
}

export const BranchCustodyKPIs: React.FC<BranchCustodyKPIsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-4 shadow-sm space-y-1">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>إجمالي الشحنات بعهدة الفرع</span>
          <Package className="w-4 h-4 text-primary" />
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-foreground dark:text-muted-foreground">
          {summary.totalShipments}
        </div>
      </div>

      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-4 shadow-sm space-y-1">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>تحصيل COD متوقع</span>
          <Coins className="w-4 h-4 text-success" />
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-success">
          {formatCurrency(summary.expectedCod)}
        </div>
      </div>

      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-4 shadow-sm space-y-1">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>شحنات راكدة &gt; 48 ساعة</span>
          <Clock className="w-4 h-4 text-warning" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl font-bold font-mono text-warning">
            {summary.aging48hCount}
          </span>
          {summary.aging48hCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warning dark:bg-warning text-warning dark:text-warning">
              Aging Alert
            </span>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-4 shadow-sm space-y-1">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>جاهز للاستلام والتوزيع</span>
          <CheckSquare className="w-4 h-4 text-success" />
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-success">
          {summary.byStatus?.RECEIVED_AT_HUB || 0}
        </div>
      </div>
    </div>
  );
};

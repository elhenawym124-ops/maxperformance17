import React from 'react';
import { Coins, CheckCircle2, XCircle } from 'lucide-react';
import type { ReturnRequest } from '../../../services/returnService';

export interface ReturnSettlementSummaryBarProps {
  request: ReturnRequest;
}

export const ReturnSettlementSummaryBar: React.FC<ReturnSettlementSummaryBarProps> = ({
  request,
}) => {
  const hasFinancialData = Boolean(
    request.order?.codDepositPaid || request.shippingReturnCost || request.settlementAmount
  );

  if (!hasFinancialData) {
    return null;
  }

  const orderCurrency = request.order?.currency || 'EGP';

  return (
    <div className="bg-amber-50 dark:bg-warning/20 p-4 rounded-lg border border-warning dark:border-warning/30">
      <h3 className="text-sm font-bold text-warning dark:text-warning mb-3 flex items-center gap-2">
        <Coins size={16} className="text-amber-600 dark:text-warning" />
        التسوية المالية
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        {request.order?.codDepositPaid && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">دفعة مسبقة (COD Deposit):</span>
            <span className="font-medium text-foreground tabular-nums font-mono flex items-center gap-1.5">
              <span>
                {request.order.codDepositAmount} {orderCurrency}
              </span>
              {request.order.codDepositRefunded ? (
                <span className="inline-flex items-center gap-1 text-success dark:text-success font-semibold text-xs bg-success/10 dark:bg-success/40 px-2 py-0.5 rounded border border-success dark:border-success">
                  <CheckCircle2 size={12} />
                  مستردة
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-destructive dark:text-destructive font-semibold text-xs bg-destructive/10 dark:bg-destructive/40 px-2 py-0.5 rounded border border-destructive dark:border-destructive">
                  <XCircle size={12} />
                  لم تسترد
                </span>
              )}
            </span>
          </div>
        )}
        {request.shippingReturnCost !== undefined && request.shippingReturnCost !== null && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">تكلفة الشحن الراجع:</span>
            <span className="font-bold text-destructive dark:text-destructive tabular-nums font-mono">
              {request.shippingReturnCost} {orderCurrency}
            </span>
          </div>
        )}
        {request.settlementAmount !== undefined && request.settlementAmount !== null && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">صافي التسوية:</span>
            <span
              className={`font-bold tabular-nums font-mono ${
                Number(request.settlementAmount) >= 0
                  ? 'text-green-600 dark:text-success'
                  : 'text-red-600 dark:text-destructive'
              }`}
            >
              {request.settlementAmount} {orderCurrency}
            </span>
          </div>
        )}
        {request.productCondition && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">حالة المنتج عند الاستلام:</span>
            <span className="font-medium text-foreground">{request.productCondition}</span>
          </div>
        )}
      </div>
    </div>
  );
};

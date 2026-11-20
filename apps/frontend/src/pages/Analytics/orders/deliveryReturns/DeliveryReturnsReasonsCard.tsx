import React from "react";
import { useTranslation } from "react-i18next";
import { PackageCheck, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { useCurrency } from "../../../../hooks/useCurrency";

export interface ReturnReasonStat {
  reason: string;
  count: number;
  percentage: number;
  lostValue: number;
}

export interface RestockStatus {
  restockedCount: number;
  pendingWithCarrierCount: number;
  restockedValue: number;
  pendingCarrierValue: number;
  stockRecoveryRate: number;
}

interface Props {
  reasons: ReturnReasonStat[];
  restock: RestockStatus;
}

export const DeliveryReturnsReasonsCard: React.FC<Props> = ({ reasons, restock }) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Restock & Warehouse Recovery Card */}
      <div className="bg-card rounded-xl p-5 border border-border dark:border-border shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PackageCheck className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">
              {t("deliveryReturnsReport.stockRecoveryRate")}
            </h4>
          </div>
          <p className="text-xs text-muted-foreground/80 mb-4">
            موقف استرداد القطع المرتجعة إلى المخزن الفعلي
          </p>

          <div className="space-y-3">
            {/* Restocked to warehouse */}
            <div className="p-3 rounded-lg bg-success/60 dark:bg-success/20 border border-success dark:border-success/40">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-success dark:text-success flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t("deliveryReturnsReport.restockedToWarehouse")}
                </span>
                <span className="font-mono font-bold text-success dark:text-success tabular-nums">
                  {restock.restockedCount.toLocaleString()} طلب
                </span>
              </div>
              <p className="text-[11px] text-success/80 dark:text-success/80 font-mono tabular-nums">
                القيمة المستردة: {formatPrice(restock.restockedValue)}
              </p>
            </div>

            {/* Pending with carrier */}
            <div className="p-3 rounded-lg bg-warning/60 dark:bg-warning/20 border border-warning dark:border-warning/40">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-warning dark:text-warning flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {t("deliveryReturnsReport.pendingWithCarrier")}
                </span>
                <span className="font-mono font-bold text-warning dark:text-warning tabular-nums">
                  {restock.pendingWithCarrierCount.toLocaleString()} طلب
                </span>
              </div>
              <p className="text-[11px] text-warning/80 dark:text-warning/80 font-mono tabular-nums">
                قيمة بضاعة معلقة: {formatPrice(restock.pendingCarrierValue)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border dark:border-border flex items-center justify-between text-xs">
          <span className="text-muted-foreground">نسبة الاسترداد للمخزن:</span>
          <span className="font-mono font-bold text-foreground tabular-nums">
            {restock.stockRecoveryRate}%
          </span>
        </div>
      </div>

      {/* Return Reasons Breakdown */}
      <div className="lg:col-span-2 bg-card rounded-xl p-5 border border-border dark:border-border shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              {t("deliveryReturnsReport.reasonsTab")}
            </h4>
            <p className="text-xs text-muted-foreground/80">
              أسباب عدم استلام الشحنات المرتجعة من واقع المناديب وخدمة العملاء
            </p>
          </div>
          <span className="text-xs font-mono text-muted-foreground/80 tabular-nums">
            {reasons.length} أسباب مسجلة
          </span>
        </div>

        {reasons.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-xs">
            لا توجد أسباب مرتجعات مسجلة في هذه الفترة
          </div>
        ) : (
          <div className="space-y-2.5">
            {reasons.slice(0, 7).map((item) => (
              <div key={item.reason} className="text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground truncate max-w-[260px]" title={item.reason}>
                    {item.reason}
                  </span>
                  <div className="flex items-center gap-3 font-mono text-muted-foreground tabular-nums">
                    <span>{item.count} حالة ({item.percentage}%)</span>
                    <span className="text-foreground font-medium">
                      {formatPrice(item.lostValue)}
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-destructive rounded-full"
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

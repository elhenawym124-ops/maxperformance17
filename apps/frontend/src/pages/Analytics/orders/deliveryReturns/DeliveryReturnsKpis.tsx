import React from "react";
import { useTranslation } from "react-i18next";
import {
  CheckCircle,
  Undo2,
  Truck,
  Banknote,
  ArrowDownRight,
} from "lucide-react";
import { useCurrency } from "../../../../hooks/useCurrency";

export interface LogisticsSummary {
  totalOrders: number;
  preDispatchCancelledCount: number;
  preDispatchPendingCount: number;
  totalShipped: number;
  deliveredOrders: number;
  returnedOrders: number;
  inTransitOrders: number;
  closedOrders: number;
  closedDeliveryRate: number;
  closedReturnRate?: number;
  shippedDeliveryRate: number;
  returnRate: number;
  inTransitRate: number;
  codDeliveredRevenue: number;
  lostShippingCost: number;
  returnedInventoryValue: number;
  inTransitRevenue: number;
  restockedCount: number;
  pendingWithCarrierCount: number;
  restockedValue: number;
  pendingCarrierValue: number;
  stockRecoveryRate: number;
}

interface Props {
  summary?: LogisticsSummary;
}

export const DeliveryReturnsKpis: React.FC<Props> = ({ summary }) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  const deliveredCount = summary?.deliveredOrders ?? 0;
  const returnedCount = summary?.returnedOrders ?? 0;
  const closedOrders = summary?.closedOrders ?? (deliveredCount + returnedCount);
  const closedDeliveryRate = summary?.closedDeliveryRate ?? 0;
  const closedReturnRate = summary?.closedReturnRate ?? (closedOrders > 0 ? Math.round(((returnedCount / closedOrders) * 100) * 10) / 10 : 0);
  const returnRate = summary?.returnRate ?? 0;
  const inTransitCount = summary?.inTransitOrders ?? 0;
  const totalShipped = summary?.totalShipped ?? 0;

  return (
    <div className="space-y-4">
      {/* Context Pipeline Bar: Pre-dispatch to Shipped */}
      <div className="bg-slate-50 dark:bg-muted border border-border dark:border-border rounded-xl p-3 sm:p-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground dark:text-muted-foreground">
              {t("deliveryReturnsReport.totalOrders")}:
            </span>
            <span className="font-mono font-bold text-foreground dark:text-white tabular-nums">
              {(summary?.totalOrders ?? 0).toLocaleString()}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="inline-flex items-center gap-1 text-muted-foreground dark:text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-muted" />
              {t("deliveryReturnsReport.preDispatchPending")}:
              <b className="font-mono text-foreground dark:text-muted-foreground tabular-nums me-1">
                {(summary?.preDispatchPendingCount ?? 0).toLocaleString()}
              </b>
            </span>

            <span className="inline-flex items-center gap-1 text-destructive dark:text-destructive">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              {t("deliveryReturnsReport.preDispatchCancelled")}:
              <b className="font-mono tabular-nums me-1">
                {(summary?.preDispatchCancelledCount ?? 0).toLocaleString()}
              </b>
            </span>

            <span className="inline-flex items-center gap-1 font-medium text-success dark:text-success bg-success/10 dark:bg-success/40 px-2.5 py-1 rounded-lg border border-success/60 dark:border-success/40">
              <Truck className="h-3.5 w-3.5" />
              {t("deliveryReturnsReport.totalShipped")}:
              <b className="font-mono font-bold tabular-nums me-1">
                {totalShipped.toLocaleString()}
              </b>
            </span>
          </div>
        </div>
      </div>

      {/* 5 Operational Logistics KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Delivered Shipments */}
        <div className="bg-card rounded-xl p-4 border border-border dark:border-border shadow-sm border-t-2 border-t-emerald-500 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {t("deliveryReturnsReport.deliveredOrders")}
            </span>
            <div className="p-1.5 rounded-lg bg-success/10 dark:bg-success/30 text-success dark:text-success shrink-0">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground tabular-nums">
                {deliveredCount.toLocaleString()}
              </span>
              <span className="text-xs font-mono font-semibold text-success dark:text-success tabular-nums">
                ({summary?.shippedDeliveryRate ?? 0}% {t("deliveryReturnsReport.deliveredFromShipped")})
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-border dark:border-border flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground/80">
                {t("deliveryReturnsReport.closedDeliveryRateBadge")}:
              </span>
              <span
                className="font-mono font-bold text-success dark:text-success tabular-nums bg-success/10 dark:bg-success/40 px-1.5 py-0.5 rounded border border-success/50 dark:border-success/40"
                title={`${t("deliveryReturnsReport.closedDeliveryRateHint")} (${deliveredCount} ÷ ${closedOrders})`}
              >
                {closedDeliveryRate}% {t("deliveryReturnsReport.fromClosed")}
              </span>
            </div>
          </div>
        </div>

        {/* Returned Shipments */}
        <div className="bg-card rounded-xl p-4 border border-border dark:border-border shadow-sm border-t-2 border-t-amber-500 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {t("deliveryReturnsReport.returnedOrders")}
            </span>
            <div className="p-1.5 rounded-lg bg-warning/10 dark:bg-warning/30 text-warning dark:text-warning shrink-0">
              <Undo2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-bold font-mono tracking-tight text-warning dark:text-warning tabular-nums">
                {returnedCount.toLocaleString()}
              </span>
              <span className="text-xs font-mono font-semibold text-warning dark:text-warning tabular-nums">
                ({returnRate}% {t("deliveryReturnsReport.returnedFromShipped")})
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-border dark:border-border flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground/80">
                {t("deliveryReturnsReport.closedReturnRateBadge")}:
              </span>
              <span
                className="font-mono font-bold text-warning dark:text-warning tabular-nums bg-warning/10 dark:bg-warning/40 px-1.5 py-0.5 rounded border border-warning/50 dark:border-warning/40"
                title={`${t("deliveryReturnsReport.closedReturnRateHint")} (${returnedCount} ÷ ${closedOrders})`}
              >
                {closedReturnRate}% {t("deliveryReturnsReport.fromClosed")}
              </span>
            </div>
          </div>
        </div>

        {/* In Transit with Couriers */}
        <div className="bg-card rounded-xl p-4 border border-border dark:border-border shadow-sm border-t-2 border-t-blue-500 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {t("deliveryReturnsReport.inTransitOrders")}
            </span>
            <div className="p-1.5 rounded-lg bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary shrink-0">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-bold font-mono tracking-tight text-primary dark:text-primary tabular-nums">
                {inTransitCount.toLocaleString()}
              </span>
              <span className="text-xs font-mono font-semibold text-primary dark:text-primary tabular-nums">
                ({summary?.inTransitRate ?? 0}% {t("deliveryReturnsReport.inTransitFromShipped")})
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-border dark:border-border flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground/80">
                {t("deliveryReturnsReport.inTransitHint")}:
              </span>
              <span className="font-mono font-medium text-primary dark:text-primary text-[10px] bg-primary/10 dark:bg-primary/40 px-1.5 py-0.5 rounded border border-primary/50 dark:border-primary/40">
                {t("deliveryReturnsReport.activeInTransitBadge")}
              </span>
            </div>
          </div>
        </div>

        {/* Collected COD Revenue */}
        <div className="bg-card rounded-xl p-4 border border-border dark:border-border shadow-sm border-t-2 border-t-teal-500 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {t("deliveryReturnsReport.codDeliveredRevenue")}
            </span>
            <div className="p-1.5 rounded-lg bg-success/10 dark:bg-success/30 text-success dark:text-success shrink-0">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-bold font-mono tracking-tight text-foreground tabular-nums">
              {formatPrice(summary?.codDeliveredRevenue ?? 0)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground/80 truncate">
              {t("deliveryReturnsReport.fromDeliveredShipments")}
            </p>
          </div>
        </div>

        {/* Lost Shipping Cost on Returns */}
        <div className="bg-card rounded-xl p-4 border border-border dark:border-border shadow-sm border-t-2 border-t-rose-500 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {t("deliveryReturnsReport.lostShippingCost")}
            </span>
            <div className="p-1.5 rounded-lg bg-destructive/10 dark:bg-destructive/30 text-destructive dark:text-destructive shrink-0">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-bold font-mono tracking-tight text-destructive dark:text-destructive tabular-nums">
              {formatPrice(summary?.lostShippingCost ?? 0)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground/80 truncate" title={t("deliveryReturnsReport.lostShippingCostHint")}>
              {t("deliveryReturnsReport.onReturnedShipments")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

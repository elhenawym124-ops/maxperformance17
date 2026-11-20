import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  CubeIcon,
  TruckIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import type { MerchantOperationsTotals } from "./merchantTypes";

interface MerchantOperationsKpisProps {
  totals: MerchantOperationsTotals;
  formatPrice: (value: number | null | undefined) => string;
}

export const MerchantOperationsKpis: React.FC<MerchantOperationsKpisProps> = ({
  totals,
  formatPrice,
}) => {
  const { t } = useTranslation();

  const statCards = useMemo(
    () => [
      {
        label: t("merchant.statCards.inShipping"),
        value: totals.inShippingPieces,
        subValue: t("merchant.statSubValues.ordersCount", { count: totals.inShippingOrdersCount }),
        icon: TruckIcon,
        className:
          "border-info bg-info/10 text-info dark:border-info dark:bg-info/40 dark:text-info",
      },
      {
        label: t("merchant.statCards.delivered"),
        value: totals.deliveredPieces,
        subValue: t("merchant.statSubValues.ordersCount", { count: totals.deliveredOrdersCount }),
        icon: CheckCircleIcon,
        className:
          "border-success bg-success/10 text-success dark:border-success dark:bg-success/40 dark:text-success",
      },
      {
        label: t("merchant.statCards.payable"),
        value: totals.payablePieces,
        subValue: t("merchant.statSubValues.piecesCount", { count: totals.pendingPayablePieces }),
        icon: CubeIcon,
        className:
          "border-primary bg-primary/10 text-primary dark:border-primary dark:bg-primary/40 dark:text-primary",
      },
      {
        label: t("merchant.statCards.notCompleted"),
        value: totals.notDeliveredPieces,
        subValue: t("merchant.statSubValues.ordersCount", { count: totals.notDeliveredOrdersCount }),
        icon: XCircleIcon,
        className:
          "border-destructive bg-destructive/10 text-destructive dark:border-destructive dark:bg-destructive/40 dark:text-destructive",
      },
    ],
    [t, totals],
  );

  const moneyCards = useMemo(
    () => [
      {
        label: t("merchant.moneyCards.expectedForMerchant"),
        value: formatPrice(totals.expectedReceivableAmount),
        subValue: t("merchant.statSubValues.piecesAssigned", { count: totals.assignedPieces }),
        icon: ClockIcon,
        className:
          "border-border/70 bg-card text-card-foreground",
      },
      {
        label: t("merchant.moneyCards.dueAfterDelivery"),
        value: formatPrice(totals.deliveredPayableAmount),
        subValue: t("merchant.statSubValues.piecesCount", { count: totals.payablePieces }),
        icon: BanknotesIcon,
        className:
          "border-success bg-success/50 text-success dark:border-success dark:bg-success/40 dark:text-success",
      },
      {
        label: t("merchant.moneyCards.inShippingValue"),
        value: formatPrice(totals.inShippingAmount),
        subValue: t("merchant.statSubValues.piecesCount", { count: totals.inShippingPieces }),
        icon: TruckIcon,
        className:
          "border-info bg-info/50 text-info dark:border-info dark:bg-info/40 dark:text-info",
      },
      {
        label: t("merchant.moneyCards.shippingCost"),
        value: formatPrice(totals.shippingCostAmount),
        subValue:
          totals.paidAmount > 0
            ? t("merchant.moneyCards.paid", { amount: formatPrice(totals.paidAmount) })
            : t("merchant.moneyCards.noPaymentsRecorded"),
        icon: BanknotesIcon,
        className:
          "border-warning bg-warning/50 text-warning dark:border-warning dark:bg-warning/40 dark:text-warning",
      },
    ],
    [formatPrice, t, totals],
  );

  return (
    <div className="space-y-3">
      {/* Pieces & operations counts */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-xl border p-4 ${card.className}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{card.label}</p>
                <Icon className="h-5 w-5 opacity-70" />
              </div>
              <p className="mt-3 text-2xl font-mono font-bold tabular-nums">
                {card.value}
              </p>
              <p className="mt-1 text-xs opacity-75">{card.subValue}</p>
            </div>
          );
        })}
      </div>

      {/* Financial amounts */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {moneyCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-xl border p-4 ${card.className}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{card.label}</p>
                <Icon className="h-5 w-5 opacity-70" />
              </div>
              <p className="mt-3 text-xl font-mono font-bold tabular-nums">
                {card.value}
              </p>
              <p className="mt-1 text-xs opacity-75">{card.subValue}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MerchantOperationsKpis;

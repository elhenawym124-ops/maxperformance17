import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  BuildingStorefrontIcon,
  PencilSquareIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import {
  Badge,
  formatDate,
  formatInteger,
  fulfillmentModeLabels,
  MerchantProfileStats,
  MerchantRecord,
  statusTone,
  toNumber,
} from "./types";

interface MerchantProfileHeaderProps {
  merchant: MerchantRecord;
  displayName: string;
  fulfillmentMode: string;
  stats: MerchantProfileStats;
  formatPrice: (amount: number) => string;
  onBack: () => void;
}

export const MerchantProfileHeader: React.FC<MerchantProfileHeaderProps> = ({
  merchant,
  displayName,
  fulfillmentMode,
  stats,
  formatPrice,
  onBack,
}) => {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={onBack}
          className="inline-flex min-h-10 w-fit items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted dark:border-border dark:bg-muted dark:text-muted-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          إدارة التجار
        </button>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/orders?page=1&limit=20&merchantId=${merchant.id}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-muted px-4 py-2 text-sm font-semibold text-white transition hover:bg-muted dark:bg-white dark:text-foreground"
          >
            <ShoppingBagIcon className="h-4 w-4" />
            طلبات هذا التاجر
          </Link>
          <Link
            to={`/merchants/${merchant.id}/edit`}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted dark:border-border dark:bg-muted dark:text-muted-foreground"
          >
            <PencilSquareIcon className="h-4 w-4" />
            تعديل وإدارة الربط
          </Link>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-primary bg-primary/10 text-primary dark:border-primary/20 dark:bg-primary/10 dark:text-primary">
              <BuildingStorefrontIcon className="h-9 w-9" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-bold sm:text-3xl">
                  ملف التاجر: {displayName}
                </h1>
                <Badge
                  label={merchant.isActive ? "نشط" : "غير نشط"}
                  tone={statusTone(merchant.isActive ? "ACTIVE" : "INACTIVE")}
                />
                <Badge
                  label={fulfillmentModeLabels[fulfillmentMode] || fulfillmentMode}
                  tone={statusTone(fulfillmentMode)}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground dark:text-muted-foreground">
                <span>{merchant.email || "بدون بريد"}</span>
                <span>{merchant.phone || "بدون هاتف"}</span>
                <span>عمولة التاجر: <span className="tabular-nums font-semibold">{formatInteger(merchant.commissionRate)}%</span></span>
                <span>منذ {formatDate(merchant.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[360px]">
            <Badge
              label={<>المنتجات: <span className="tabular-nums font-bold me-1">{formatInteger(stats.linkedProducts)}</span></>}
              tone={statusTone("CONFIRMED")}
            />
            <Badge
              label={<>الطلبات: <span className="tabular-nums font-bold me-1">{formatInteger(stats.ordersCount)}</span></>}
              tone={statusTone("IN_SHIPPING")}
            />
            <Badge
              label={<>قابل للسحب: <span className="tabular-nums font-bold me-1">{formatPrice(toNumber(stats.availablePayoutAmount))}</span></>}
              tone={statusTone("PAID")}
            />
            <Badge
              label={<>الرصيد المتاح: <span className="tabular-nums font-bold me-1">{formatInteger(stats.availableForSale)}</span> قطعة</>}
              tone={statusTone("ACTIVE")}
            />
          </div>
        </div>
      </section>
    </>
  );
};

import React from "react";
import { useTranslation } from "react-i18next";
import {
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  StarIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency } from "@/utils/currency";
import { CustomerDetailsData } from "./types";

interface CustomerDetailsStatsProps {
  customer: CustomerDetailsData["customer"];
  stats: CustomerDetailsData["stats"];
  loyaltyPoints: number;
  cashbackAmount: number;
  walletBalance: number;
}

// 🆕 المعلم القياسي: شريط إحصائيات واحد بسطح واحد — كل مؤشر رقم + ليبل + أيقونة
// بدون بوكسات متداخلة (Ban Nested Border Nesting — AGENTS.md)
export const CustomerDetailsStats: React.FC<CustomerDetailsStatsProps> = ({
  customer,
  stats,
  loyaltyPoints,
  cashbackAmount,
  walletBalance,
}) => {
  const { t } = useTranslation();

  const deliveryRate =
    Math.round((customer.deliveryRate ?? stats.deliveryRate ?? 0) * 10) / 10;
  const deliveredCount = customer.totalDelivered ?? stats.totalDelivered ?? 0;
  const totalOrders =
    customer.totalOrdersCount ?? stats.totalOrdersCount ?? stats.ordersCount;

  return (
    <div className="rounded-xl border border-border dark:border-border bg-white dark:bg-muted px-4 sm:px-5 py-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-x-6 gap-y-3">
      {/* Delivery Reliability */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-8 w-8 rounded-full bg-success/10 dark:bg-success/40 flex items-center justify-center text-success dark:text-success shrink-0">
          <CheckCircleIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground dark:text-muted-foreground font-medium leading-tight">
            نسبة الاستلام
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-foreground dark:text-white tabular-nums">
              {deliveryRate}%
            </span>
            <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
              ({deliveredCount} من {totalOrders})
            </span>
          </div>
        </div>
      </div>

      {/* Orders count */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/40 flex items-center justify-center text-primary shrink-0">
          <ShoppingBagIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground dark:text-muted-foreground font-medium leading-tight">
            {t("sidebar.orders")}
          </p>
          <p className="text-lg font-bold text-foreground dark:text-white tabular-nums">
            {stats.ordersCount}
          </p>
        </div>
      </div>

      {/* Conversations count */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-8 w-8 rounded-full bg-success/10 dark:bg-success/40 flex items-center justify-center text-success dark:text-success shrink-0">
          <ChatBubbleLeftRightIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground dark:text-muted-foreground font-medium leading-tight">
            {t("sidebar.conversations")}
          </p>
          <p className="text-lg font-bold text-foreground dark:text-white tabular-nums">
            {stats.conversationsCount}
          </p>
        </div>
      </div>

      {/* Total spent */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-8 w-8 rounded-full bg-warning/10 dark:bg-warning/40 flex items-center justify-center text-warning dark:text-warning shrink-0">
          <CurrencyDollarIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground dark:text-muted-foreground font-medium leading-tight">
            {t("customers.totalSpent")}
          </p>
          <p className="text-lg font-bold text-foreground dark:text-white tabular-nums">
            {formatCurrency(stats.totalSpent)}
          </p>
        </div>
      </div>

      {/* Average order */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/40 flex items-center justify-center text-primary dark:text-primary shrink-0">
          <ChartBarIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground dark:text-muted-foreground font-medium leading-tight">
            {t("customers.averageOrder")}
          </p>
          <p className="text-lg font-bold text-foreground dark:text-white tabular-nums">
            {formatCurrency(stats.averageOrderValue)}
          </p>
        </div>
      </div>

      {/* Loyalty points */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-8 w-8 rounded-full bg-warning/10 dark:bg-warning/40 flex items-center justify-center text-warning dark:text-warning shrink-0">
          <StarIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground dark:text-muted-foreground font-medium leading-tight">
            نقاط الولاء
          </p>
          <p className="text-lg font-bold text-foreground dark:text-white tabular-nums">
            {loyaltyPoints}
          </p>
        </div>
      </div>

      {/* Cashback & wallet */}
      <div className="flex items-center gap-2.5 min-w-0 col-span-2 sm:col-span-1">
        <div className="h-8 w-8 rounded-full bg-success/10 dark:bg-success/40 flex items-center justify-center text-success dark:text-success shrink-0">
          <BanknotesIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground dark:text-muted-foreground font-medium leading-tight">
            الكاش باك المحقق
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground dark:text-white tabular-nums">
              {formatCurrency(cashbackAmount)}
            </span>
            <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
              المحفظة: {formatCurrency(walletBalance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDateFormat } from "@/hooks/useDateFormat";
import { formatCurrency } from "@/utils/currency";
import { CustomerDetailsData } from "./types";

interface CustomerOrdersTabProps {
  orders: CustomerDetailsData["recentOrders"];
}

export const CustomerOrdersTab: React.FC<CustomerOrdersTabProps> = ({ orders }) => {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();

  if (orders.length === 0) {
    return (
      <p className="text-center text-xs sm:text-sm text-muted-foreground py-8">
        {t("customers.noOrders")}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border dark:divide-border">
        <thead>
          <tr>
            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
              {t("orders.orderNumber")}
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
              {t("common.status")}
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
              {t("orders.amount")}
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
              {t("common.date")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border dark:divide-border">
          {orders.map((order) => (
            <tr
              key={order.id}
              className="hover:bg-zinc-50/80 dark:hover:bg-muted transition-colors"
            >
              <td className="px-4 py-3">
                <Link
                  to={`/orders/${encodeURIComponent(String(order.id))}`}
                  className="text-zinc-900 dark:text-muted-foreground font-bold font-mono hover:underline text-xs sm:text-sm"
                >
                  #{order.orderNumber}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted dark:bg-muted text-foreground dark:text-muted-foreground border border-border dark:border-border">
                  {order.status}
                </span>
              </td>
              <td className="px-4 py-3 font-mono font-semibold text-xs sm:text-sm tabular-nums text-foreground dark:text-muted-foreground">
                {formatCurrency(order.total)}
              </td>
              <td className="px-4 py-3 text-muted-foreground dark:text-muted-foreground font-mono text-xs tabular-nums">
                {formatDate(order.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

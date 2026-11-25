import React from "react";
import { useTranslation } from "react-i18next";
import type { Order } from "../../Orders";

interface OrdersTableHeaderProps {
  canSelectOrders: boolean;
  headerPadding: string;
  columns: string[];
  orders: Order[];
  selectedOrders: string[];
  onToggleAllSelection: () => void;
}

export const OrdersTableHeader: React.FC<OrdersTableHeaderProps> = ({
  canSelectOrders,
  headerPadding,
  columns,
  orders,
  selectedOrders,
  onToggleAllSelection,
}) => {
  const { t } = useTranslation();

  const isAllSelected =
    orders.length > 0 &&
    orders.every((o) => selectedOrders.includes(o.orderNumber));

  return (
    <thead className="sticky top-0 z-10 bg-muted/95 border-b border-border/70">
      <tr>
        {canSelectOrders && (
          <th className={`w-9 ${headerPadding} text-start`}>
            <input
              type="checkbox"
              aria-label={String(t("orders.selectAllOrders"))}
              className="h-4 w-4 text-primary border-border rounded focus:ring-primary/20 accent-primary cursor-pointer"
              onChange={onToggleAllSelection}
              checked={isAllSelected}
            />
          </th>
        )}
        {columns.includes("orderNumber") && (
          <th className={`${headerPadding} text-start text-xs font-medium text-muted-foreground`}>
            {t("orders.orderNumber")}
          </th>
        )}
        {columns.includes("customer") && (
          <th className={`${headerPadding} text-start text-xs font-medium text-muted-foreground`}>
            {t("orders.customer")}
          </th>
        )}
        {columns.includes("customerRating") && (
          <th className={`${headerPadding} text-start whitespace-nowrap text-xs font-medium text-muted-foreground`}>
            {t("orders.customerRating", "تقييم العملاء")}
          </th>
        )}
        {columns.includes("amount") && (
          <th className={`${headerPadding} text-start whitespace-nowrap text-xs font-medium text-muted-foreground`}>
            {t("orders.amount")}
          </th>
        )}
        {columns.includes("status") && (
          <th className={`${headerPadding} text-start text-xs font-medium text-muted-foreground`}>
            {t("orders.orderStatus")}
          </th>
        )}
        {columns.includes("payment") && (
          <th className={`${headerPadding} text-start text-xs font-medium text-muted-foreground`}>
            {t("orders.payment")}
          </th>
        )}
        {columns.includes("date") && (
          <th className={`hidden ${headerPadding} text-start text-xs font-medium text-muted-foreground xl:table-cell`}>
            {t("orders.date")}
          </th>
        )}
        {columns.includes("actions") && (
          <th className={`${headerPadding} text-start text-xs font-medium text-muted-foreground`}>
            {t("orders.actions")}
          </th>
        )}
      </tr>
    </thead>
  );
};

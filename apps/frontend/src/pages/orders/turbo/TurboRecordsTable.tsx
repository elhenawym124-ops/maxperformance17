import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../hooks/useCurrency";
import { useDateFormat } from "../../../hooks/useDateFormat";
import {
  getTurboStatusDisplay,
  getStatusDisplay,
} from "../../../utils/statusRegistry";
import type { TurboOrder } from "./useTurboRecordsData";

interface TurboRecordsTableProps {
  orders: TurboOrder[];
  loading: boolean;
  selectedOrders: string[];
  totalOrders: number;
  page: number;
  totalPages: number;
  onToggleAll: () => void;
  onToggleOrder: (id: string) => void;
  onPageChange: (newPage: number) => void;
}

export const TurboRecordsTable: React.FC<TurboRecordsTableProps> = ({
  orders,
  loading,
  selectedOrders,
  totalOrders,
  page,
  totalPages,
  onToggleAll,
  onToggleOrder,
  onPageChange,
}) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { formatDate } = useDateFormat();

  return (
    <div className="bg-card rounded-xl border border-border dark:dark:border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table
          className="min-w-full divide-y divide-border dark:dark:divide-border text-right"
          dir="rtl"
        >
          <thead className="bg-muted dark:dark:bg-muted">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-10"
              >
                <input
                  type="checkbox"
                  aria-label="تحديد جميع الطلبات"
                  className="rounded border-border text-primary focus:ring-primary"
                  checked={
                    orders.length > 0 && selectedOrders.length === orders.length
                  }
                  onChange={onToggleAll}
                />
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                {t("orders.orderLabel")}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                {t("orders.customer")}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                {t("orders.total")}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                {t("orders.orderStatus")}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                {t("orders.trackingNumber")}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                {t("orders.k_33")}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                {t("orders.date")}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                {t("orders.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border dark:dark:divide-border">
            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  <div className="flex justify-center mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-primary"></div>
                  </div>
                  {t("orders.loadingOrders")}
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  {t("orders.noOrdersFound")}
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-muted/50/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      aria-label={`تحديد الطلب ${order.orderNumber}`}
                      className="rounded border-border text-primary focus:ring-primary"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => onToggleOrder(order.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/orders/${encodeURIComponent(String(order.id))}`}
                      className="text-primary dark:text-primary hover:text-primary dark:hover:text-primary font-medium"
                    >
                      #{order.orderNumber || order.id.substring(0, 8)}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-foreground">
                      {order.customerName}
                    </div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {order.customerPhone}
                    </div>
                    <div className="text-xs text-muted-foreground/80 mt-1">
                      {order.governorate} - {order.city}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground font-mono tabular-nums">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        getStatusDisplay(order.status).colorClass
                      }`}
                    >
                      {getStatusDisplay(order.status).label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.turboTrackingNumber || order.turboShipmentId ? (
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground dark:dark:text-muted-foreground font-mono border border-border">
                          {order.turboTrackingNumber || order.turboShipmentId}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/80 text-xs">
                        -
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          getTurboStatusDisplay(
                            order.turboShipmentStatus || ""
                          ).colorClass
                        }`}
                      >
                        {
                          getTurboStatusDisplay(
                            order.turboShipmentStatus || ""
                          ).label
                        }
                      </span>
                      {(order.turboLiveStatus || order.turboCaptainName) && (
                        <span className="text-xs text-muted-foreground/80">
                          {order.turboLiveStatus?.status ||
                            order.turboShipmentStatus}
                          {order.turboCaptainName &&
                            ` - مندوب: ${order.turboCaptainName}`}
                          {order.turboCaptainName &&
                            order.turboCaptainPhone &&
                            ` (${order.turboCaptainPhone})`}
                          {!order.turboCaptainName &&
                            order.turboLiveStatus?.captain &&
                            ` - ${order.turboLiveStatus.captain}`}
                        </span>
                      )}
                      {order.turboBranchName && (
                        <span className="text-xs text-primary dark:text-primary bg-primary/10 dark:bg-primary/30 px-2 py-0.5 rounded border border-primary dark:border-primary font-medium">
                          فرع: {order.turboBranchName}
                          {order.turboBranchPhone
                            ? ` (${order.turboBranchPhone})`
                            : ""}
                        </span>
                      )}
                      {(order.turboReturnReason ||
                        order.turboLiveStatus?.returnReason) && (
                        <span className="text-xs text-destructive dark:text-destructive bg-destructive/10 dark:bg-destructive/30 px-2 py-0.5 rounded border border-destructive dark:border-destructive font-medium">
                          {t("orders.k_39")}{" "}
                          {order.turboReturnReason ||
                            order.turboLiveStatus?.returnReason}
                        </span>
                      )}
                      {(order.turboDelayReason ||
                        order.turboLiveStatus?.delayReason) && (
                        <span className="text-xs text-warning dark:text-warning bg-warning/10 dark:bg-warning/30 px-2 py-0.5 rounded border border-warning dark:border-warning font-medium">
                          {t("orders.k_40")}{" "}
                          {order.turboDelayReason ||
                            order.turboLiveStatus?.delayReason}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono tabular-nums">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <Link
                      to={`/orders/${encodeURIComponent(String(order.id))}`}
                      className="text-primary dark:text-primary hover:text-primary dark:hover:text-primary ms-3"
                    >
                      {t("orders.view")}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-border dark:dark:border-border flex items-center justify-between">
        <div className="text-sm text-foreground">
          {t("orders.totalOrders")}:{" "}
          <span className="font-medium font-mono tabular-nums">
            {totalOrders}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-3 py-1 border dark:dark:border-border rounded disabled:opacity-50 text-foreground bg-card text-xs font-semibold"
          >
            {t("orders.previous")}
          </button>
          <span className="px-3 py-1 text-foreground text-xs font-mono">
            {t("orders.pageOf", { page, totalPages })}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-1 border dark:dark:border-border rounded disabled:opacity-50 text-foreground bg-card text-xs font-semibold"
          >
            {t("orders.next")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TurboRecordsTable;

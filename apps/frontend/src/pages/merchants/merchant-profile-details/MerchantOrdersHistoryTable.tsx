import React from "react";
import { Link } from "react-router-dom";
import {
  Badge,
  EmptyState,
  formatDate,
  formatInteger,
  MerchantOperationRow,
  statusLabels,
  statusTone,
  toNumber,
} from "./types";

interface MerchantOrdersHistoryTableProps {
  merchantId: string;
  rows?: MerchantOperationRow[];
  formatPrice: (amount: number) => string;
}

export const MerchantOrdersHistoryTable: React.FC<MerchantOrdersHistoryTableProps> = ({
  merchantId,
  rows,
  formatPrice,
}) => {
  return (
    <section className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold">تاريخ الطلبات المرتبطة</h2>
        <Link
          to={`/orders?page=1&limit=20&merchantId=${merchantId}`}
          className="text-sm font-semibold text-primary hover:underline dark:text-primary"
        >
          فتح كل طلبات التاجر
        </Link>
      </div>
      <div className="mt-4 overflow-x-auto">
        {rows?.length ? (
          <table className="min-w-full text-right text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="py-2">رقم الطلب</th>
                <th className="py-2">العميل</th>
                <th className="py-2">التنفيذ</th>
                <th className="py-2">القطع</th>
                <th className="py-2">مستحق</th>
                <th className="py-2">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border">
              {rows.map((order) => (
                <tr key={order.id}>
                  <td className="py-3">
                    <Link
                      to={`/orders/${order.orderNumber}`}
                      className="font-semibold text-primary hover:underline dark:text-primary font-mono"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="py-3 text-foreground dark:text-muted-foreground">
                    <div className="font-semibold">
                      {order.customerName || "عميل غير محدد"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.customerPhone || "بدون هاتف"}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge
                        label={
                          statusLabels[order.operationStatus || ""] ||
                          order.operationStatus ||
                          "غير محدد"
                        }
                        tone={statusTone(order.operationStatus)}
                      />
                      <Badge
                        label={
                          order.fulfillmentSource === "COMPANY_WAREHOUSE"
                            ? "من مخزن الشركة"
                            : "من عند التاجر"
                        }
                      />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {order.warehouseName || order.shippingCompanyName
                        ? `${order.warehouseName || "بدون مخزن"} · ${
                            order.shippingCompanyName || "بدون شركة شحن"
                          }`
                        : "بدون تفاصيل شحن"}
                    </div>
                  </td>
                  <td className="py-3 font-semibold tabular-nums">
                    {formatInteger(order.pieces)}
                  </td>
                  <td className="py-3 font-semibold tabular-nums">
                    {formatPrice(toNumber(order.payableAmount))}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState text="لا توجد طلبات مرتبطة بهذا التاجر حتى الآن." />
        )}
      </div>
    </section>
  );
};

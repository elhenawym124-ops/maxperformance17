import React from "react";
import { CubeIcon } from "@heroicons/react/24/outline";
import { Skeleton } from "../../../components/ui/skeleton";
import { SalesProduct } from "./types";

interface OrdersTopProductsTableProps {
  loading: boolean;
  products: SalesProduct[];
  formatPrice: (amount: number) => string;
}

export const OrdersTopProductsTable: React.FC<OrdersTopProductsTableProps> = ({
  loading,
  products,
  formatPrice,
}) => {
  return (
    <div className="p-3 sm:p-4 bg-white dark:bg-[#0a0a0c]">
      <div className="flex items-center justify-between pb-2.5 border-b border-border dark:border-white/[0.06] mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md /10/10bg-muted text-foreground dark:dark:text-muted-foreground flex items-center justify-center shrink-0">
            <CubeIcon className="h-3.5 w-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-foreground dark:text-white uppercase tracking-wider">
              أفضل المنتجات مبيعاً وأعلاها عائداً
            </h2>
            <p className="text-[10px] text-muted-foreground">ترتيب المنتجات وفقاً للكميات المحققة وحجم المبيعات الفعلي</p>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
          {products.length} منتج
        </span>
      </div>

      {loading ? (
        <div className="space-y-2 py-2">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-8 w-full rounded" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-8">لا توجد بيانات مبيعات منتجات متاحة في هذه الفترة</p>
      ) : (
        <div className="overflow-x-auto -mx-3.5 sm:mx-0">
          <table className="w-full text-xs min-w-[640px]">
            <thead>
              <tr className="border-b /60/60border-border dark:border-white/[0.06] text-muted-foreground dark:dark:text-muted-foreground /50/50bg-muted dark:dark:bg-muted text-[11px]">
                <th className="py-2 px-3 text-start font-semibold">المنتج</th>
                <th className="py-2 px-3 text-start font-semibold">الكمية المباعة</th>
                <th className="py-2 px-3 text-start font-semibold">عدد الطلبات</th>
                <th className="py-2 px-3 text-start font-semibold">متوسط السعر</th>
                <th className="py-2 px-3 text-start font-semibold">إجمالي المبيعات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-white/[0.04]">
              {products.slice(0, 15).map((p) => (
                <tr key={p.productId} className="hover:hover:bg-muted dark:hover:dark:hover:bg-muted transition-colors">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {p.productImage ? (
                        <img
                          src={p.productImage}
                          alt={p.productName}
                          className="h-6 w-6 rounded object-cover shrink-0 border border-border dark:border-white/10"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded bg-muted dark:dark:bg-muted text-muted-foreground flex items-center justify-center shrink-0 border /60/60border-border dark:border-white/10">
                          <CubeIcon className="h-3 w-3" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground dark:text-white truncate text-[11px]">
                          {p.productName}
                        </p>
                        {p.productSku && (
                          <p className="text-[10px] text-muted-foreground font-mono truncate">
                            SKU: {p.productSku}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-3 font-bold text-foreground dark:text-white tabular-nums">
                    {p.quantitySold.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-foreground dark:dark:text-muted-foreground tabular-nums">
                    {p.orderCount.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-foreground dark:dark:text-muted-foreground tabular-nums">
                    {formatPrice(p.averagePrice)}
                  </td>
                  <td className="py-2 px-3 text-foreground dark:text-white font-bold tabular-nums whitespace-nowrap">
                    {formatPrice(p.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrdersTopProductsTable;

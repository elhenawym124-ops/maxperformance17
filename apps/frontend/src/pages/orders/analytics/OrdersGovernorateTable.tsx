import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPinIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Skeleton } from "../../../components/ui/skeleton";
import { GovernorateDetail } from "./types";

interface OrdersGovernorateTableProps {
  loading: boolean;
  governorates: GovernorateDetail[];
  formatPrice: (amount: number) => string;
}

export const OrdersGovernorateTable: React.FC<OrdersGovernorateTableProps> = ({
  loading,
  governorates,
  formatPrice,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"orders" | "delivery" | "loss" | "revenue">("orders");

  const filteredAndSortedGovs = useMemo(() => {
    let result = [...governorates];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((g) => g.name.toLowerCase().includes(q));
    }
    if (sortBy === "orders") {
      result.sort((a, b) => b.ordersCount - a.ordersCount);
    } else if (sortBy === "delivery") {
      result.sort((a, b) => b.deliveryRate - a.deliveryRate);
    } else if (sortBy === "loss") {
      result.sort((a, b) => {
        const lossA = a.lostShippingCost ?? (a.returnedCount * 45);
        const lossB = b.lostShippingCost ?? (b.returnedCount * 45);
        return lossB - lossA;
      });
    } else if (sortBy === "revenue") {
      result.sort((a, b) => b.revenue - a.revenue);
    }
    return result;
  }, [governorates, search, sortBy]);

  const handleRowClick = (govName: string) => {
    navigate(`/orders?governorate=${encodeURIComponent(govName)}`);
  };

  return (
    <div className="border-b /80/80border-border dark:border-white/[0.08] p-3.5 sm:p-4 bg-white dark:bg-[#070709]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2.5 border-b /60/60border-border dark:border-white/[0.06] gap-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md /10/10bg-muted text-foreground dark:dark:text-muted-foreground flex items-center justify-center shrink-0">
            <MapPinIcon className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-foreground dark:text-white uppercase tracking-wider">
                التحليل الجغرافي ونزيف الشحن بالمحافظات
              </h2>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted dark:dark:bg-muted text-foreground dark:dark:text-muted-foreground tabular-nums">
                {governorates.length} محافظة
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">انقر على أي محافظة لعرض وتصفية طلباتها ومتابعة تكلفة الهدر</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort Switcher including Loss / Bleed */}
          <div className="flex items-center gap-0.5 bg-muted dark:dark:bg-muted p-0.5 rounded-md border /50/50border-border dark:border-white/[0.05] text-[11px]">
            <button
              type="button"
              onClick={() => setSortBy("orders")}
              className={`px-2 py-0.5 rounded transition-all font-medium ${
                sortBy === "orders"
                  ? "bg-white dark:dark:bg-muted text-foreground dark:text-white shadow-xs font-bold"
                  : "text-muted-foreground hover:hover:text-foreground"
              }`}
            >
              الطلبات
            </button>
            <button
              type="button"
              onClick={() => setSortBy("delivery")}
              className={`px-2 py-0.5 rounded transition-all font-medium ${
                sortBy === "delivery"
                  ? "bg-white dark:dark:bg-muted text-success dark:text-success shadow-xs font-bold"
                  : "text-muted-foreground hover:hover:text-foreground"
              }`}
            >
              نسبة التسليم
            </button>
            <button
              type="button"
              onClick={() => setSortBy("loss")}
              className={`px-2 py-0.5 rounded transition-all font-medium ${
                sortBy === "loss"
                  ? "bg-white dark:dark:bg-muted text-destructive dark:text-destructive shadow-xs font-bold"
                  : "text-muted-foreground hover:hover:text-foreground"
              }`}
              title="ترتيب المحافظات الأكثر هدراً لتكاليف شحن المرتجعات"
            >
              نزيف الشحن
            </button>
            <button
              type="button"
              onClick={() => setSortBy("revenue")}
              className={`px-2 py-0.5 rounded transition-all font-medium ${
                sortBy === "revenue"
                  ? "bg-white dark:dark:bg-muted text-foreground dark:text-white shadow-xs font-bold"
                  : "text-muted-foreground hover:hover:text-foreground"
              }`}
            >
              المبيعات
            </button>
          </div>

          {/* Quick Search Input */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-3.5 w-3.5 text-muted-foreground absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في المحافظات..."
              className="ps-8 pe-6 py-1 text-xs rounded-md border /80/80border-border dark:border-white/10 bg-muted dark:dark:bg-muted text-foreground dark:dark:text-muted-foreground placeholder-muted w-36 sm:w-48 focus:outline-hidden focus:focus:border-border"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:hover:text-foreground"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 py-2">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-8 w-full rounded" />
          ))}
        </div>
      ) : filteredAndSortedGovs.length === 0 ? (
        <p className="text-center py-8 text-xs text-muted-foreground">لا توجد نتائج مطابقة للبحث</p>
      ) : (
        <div className="overflow-x-auto -mx-3.5 sm:mx-0">
          <table className="w-full text-xs min-w-[760px]">
            <thead>
              <tr className="border-b /60/60border-border dark:border-white/[0.06] text-muted-foreground dark:dark:text-muted-foreground /50/50bg-muted dark:dark:bg-muted text-[11px]">
                <th className="py-2 px-3 text-start font-semibold">المحافظة</th>
                <th className="py-2 px-3 text-start font-semibold">الطلبات</th>
                <th className="py-2 px-3 text-start font-semibold">الحصة %</th>
                <th className="py-2 px-3 text-start font-semibold">تم التسليم</th>
                <th className="py-2 px-3 text-start font-semibold">نسبة التسليم</th>
                <th className="py-2 px-3 text-start font-semibold">المرتجع</th>
                <th className="py-2 px-3 text-start font-semibold">الملغي</th>
                <th className="py-2 px-3 text-start font-semibold text-destructive dark:text-destructive">نزيف شحن المرتجع</th>
                <th className="py-2 px-3 text-start font-semibold">إجمالي المبيعات</th>
                <th className="py-2 px-2 text-center font-semibold w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-white/[0.04]">
              {filteredAndSortedGovs.map((gov) => {
                const loss = gov.lostShippingCost ?? (gov.returnedCount * 45);
                return (
                  <tr
                    key={gov.name}
                    onClick={() => handleRowClick(gov.name)}
                    className="hover:hover:bg-muted dark:hover:dark:hover:bg-muted transition-colors cursor-pointer group"
                    title={`انقر لتصفية طلبات محافظة ${gov.name}`}
                  >
                    <td className="py-2 px-3 font-bold text-foreground dark:dark:text-muted-foreground flex items-center gap-1.5">
                      <MapPinIcon className="h-3 w-3 text-muted-foreground group-hover:text-destructive transition-colors shrink-0" />
                      <span className="truncate">{gov.name}</span>
                    </td>
                    <td className="py-2 px-3 tabular-nums font-bold text-foreground dark:text-white">
                      {gov.ordersCount.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 tabular-nums text-muted-foreground">
                      <span className="px-1.5 py-0.5 rounded bg-muted dark:dark:bg-muted text-[10px] font-semibold">
                        {gov.sharePct}%
                      </span>
                    </td>
                    <td className="py-2 px-3 tabular-nums font-semibold text-success dark:text-success">
                      {gov.deliveredCount}
                    </td>
                    <td className="py-2 px-3 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`tabular-nums font-bold text-[11px] shrink-0 ${
                            gov.deliveryRate >= 70
                              ? "text-success dark:text-success"
                              : gov.deliveryRate >= 45
                              ? "text-warning dark:text-warning"
                              : "text-destructive dark:text-destructive"
                          }`}
                        >
                          {gov.deliveryRate}%
                        </span>
                        <div className="h-1 flex-1 /60/60bg-muted dark:dark:bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              gov.deliveryRate >= 70
                                ? "bg-success"
                                : gov.deliveryRate >= 45
                                ? "bg-warning"
                                : "bg-destructive"
                            }`}
                            style={{ width: `${Math.min(100, gov.deliveryRate)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3 tabular-nums font-medium text-warning">
                      {gov.returnedCount}
                    </td>
                    <td className="py-2 px-3 tabular-nums font-medium text-destructive">
                      {gov.cancelledCount}
                    </td>
                    <td className="py-2 px-3 tabular-nums font-bold whitespace-nowrap">
                      {loss > 0 ? (
                        <span className="text-destructive dark:text-destructive flex items-center gap-1">
                          <ExclamationTriangleIcon className="h-3 w-3 inline shrink-0" />
                          <span>-{formatPrice(loss)}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0 ج.م</span>
                      )}
                    </td>
                    <td className="py-2 px-3 tabular-nums font-bold text-foreground dark:text-white whitespace-nowrap">
                      {formatPrice(gov.revenue)}
                    </td>
                    <td className="py-2 px-2 text-center text-muted-foreground group-hover:group-hover:text-foreground dark:group-hover:dark:group-hover:text-muted-foreground transition-colors">
                      <ArrowTopRightOnSquareIcon className="h-3 w-3 inline" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrdersGovernorateTable;

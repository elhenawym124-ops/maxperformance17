import React, { useState } from "react";
import {
  TruckIcon,
  BuildingStorefrontIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { Skeleton } from "../../../../components/ui/skeleton";
import type { ShippingPerformance, BranchPerformance } from "../types";

export interface LogisticsSlaColumnProps {
  loading: boolean;
  shippingList: ShippingPerformance[];
  branchList: BranchPerformance[];
  formatPrice: (amount: number) => string;
}

export const LogisticsSlaColumn: React.FC<LogisticsSlaColumnProps> = ({
  loading,
  shippingList,
  branchList,
  formatPrice,
}) => {
  const [logisticsView, setLogisticsView] = useState<"carriers" | "branches">("carriers");

  return (
    <div className="p-3.5 sm:p-4 flex flex-col min-w-0">
      <div className="flex items-center justify-between pb-2 mb-2 border-b /60/60border-border dark:border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md /10/10bg-muted text-foreground dark:dark:text-muted-foreground flex items-center justify-center shrink-0">
            <TruckIcon className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-xs font-bold text-foreground dark:text-white uppercase tracking-wider">
            كفاءة الشحن والتوزيع
          </h3>
        </div>

        {/* Toggle between Carriers and Branches */}
        <div className="flex items-center gap-0.5 p-0.5 bg-muted dark:dark:bg-muted rounded-md border /50/50border-border dark:border-white/[0.05] text-[10px]">
          <button
            type="button"
            onClick={() => setLogisticsView("carriers")}
            className={`px-2 py-0.5 rounded transition-all font-semibold cursor-pointer ${
              logisticsView === "carriers"
                ? "bg-white dark:dark:bg-muted text-foreground dark:text-white shadow-xs"
                : "text-muted-foreground hover:hover:text-foreground"
            }`}
          >
            شركات ووجهات الشحن
          </button>
          <button
            type="button"
            onClick={() => setLogisticsView("branches")}
            className={`px-2 py-0.5 rounded transition-all font-semibold cursor-pointer ${
              logisticsView === "branches"
                ? "bg-white dark:dark:bg-muted text-foreground dark:text-white shadow-xs"
                : "text-muted-foreground hover:hover:text-foreground"
            }`}
          >
            مستودعات التجهيز
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[350px] divide-y divide-border dark:divide-white/[0.04] pe-1.5 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 hover:scrollbar-thumb-zinc-400">
        {loading ? (
          <div className="space-y-2 py-2">
            {[1, 2].map((n) => (
              <Skeleton key={n} className="h-14 w-full rounded" />
            ))}
          </div>
        ) : logisticsView === "carriers" ? (
          shippingList.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-10">لا توجد بيانات شحنات مسجلة</p>
          ) : (
            shippingList.map((carrier) => (
              <div
                key={carrier.name}
                className="py-2.5 px-1 hover:hover:bg-muted dark:hover:dark:hover:bg-muted transition-colors text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-foreground dark:dark:text-muted-foreground truncate text-[11px]">
                    {carrier.name}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {carrier.avgDeliveryDays && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-foreground dark:dark:text-muted-foreground bg-muted dark:dark:bg-muted px-1.5 py-0.5 rounded tabular-nums">
                        <ClockIcon className="h-3 w-3 text-muted-foreground" />
                        <span>{carrier.avgDeliveryDays} يوم سرعة</span>
                      </span>
                    )}
                    <span className="text-[10px] font-bold tabular-nums text-foreground dark:dark:text-muted-foreground px-1.5 py-0.5 rounded bg-muted dark:dark:bg-muted">
                      {carrier.totalOrders.toLocaleString()} مسلّمة للناقل
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] tabular-nums">
                  <span className="flex items-center gap-1">
                    <span className="text-muted-foreground text-[10px]">تسليم:</span>
                    <strong className="text-success dark:text-success font-bold">{carrier.deliveryRate}%</strong>
                    <span className="text-muted-foreground text-[10px]">({carrier.deliveredOrders})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-muted-foreground text-[10px]">مرتجع:</span>
                    <strong className="text-destructive dark:text-destructive font-semibold">{carrier.returnedOrders}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-muted-foreground text-[10px]">بالطريق:</span>
                    <strong className="text-foreground dark:dark:text-muted-foreground">{carrier.inTransitOrders}</strong>
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    كاش: <strong className="text-success dark:text-success">{formatPrice(carrier.codCollected)}</strong>
                  </span>
                </div>
              </div>
            ))
          )
        ) : (
          branchList.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-10">لا توجد بيانات فروع مسجلة</p>
          ) : (
            branchList.map((branch) => (
              <div
                key={branch.name}
                className="py-2.5 px-1 hover:hover:bg-muted dark:hover:dark:hover:bg-muted transition-colors text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-foreground dark:dark:text-muted-foreground truncate text-[11px] flex items-center gap-1">
                    <BuildingStorefrontIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span>{branch.name}</span>
                  </span>
                  <span className="text-[10px] font-bold tabular-nums text-foreground dark:dark:text-muted-foreground px-1.5 py-0.5 rounded bg-muted dark:dark:bg-muted">
                    {branch.totalOrders.toLocaleString()} إجمالي
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] tabular-nums">
                  <span className="flex items-center gap-1">
                    <span className="text-muted-foreground text-[10px]">خرج للشحن:</span>
                    <strong className="text-info dark:text-info font-bold">{branch.dispatchedOrders}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-muted-foreground text-[10px]">تم تسليمه:</span>
                    <strong className="text-success dark:text-success font-bold">{branch.deliveredOrders}</strong>
                    <span className="text-muted-foreground text-[10px]">({branch.deliveryRate}%)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-muted-foreground text-[10px]">بالمستودع:</span>
                    <strong className="text-warning dark:text-warning font-semibold">{branch.pendingDispatch}</strong>
                  </span>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default LogisticsSlaColumn;

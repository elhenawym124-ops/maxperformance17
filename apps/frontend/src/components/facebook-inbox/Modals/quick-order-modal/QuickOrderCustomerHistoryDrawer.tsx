import React from "react";
import {
  ClockIcon,
  XMarkIcon,
  MapPinIcon,
  ArrowPathIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { CustomerLookupResult, PreviousOrder } from "../../../../hooks/useCustomerByPhone";

interface QuickOrderCustomerHistoryDrawerProps {
  showHistoryDrawer: boolean;
  setShowHistoryDrawer: (show: boolean) => void;
  customerName: string;
  phone: string;
  city: string;
  area: string;
  address: string;
  notes: string;
  customerProfile: CustomerLookupResult | null;
  previousOrders: PreviousOrder[];
  loadingCustomerOrders: boolean;
}

export const QuickOrderCustomerHistoryDrawer: React.FC<
  QuickOrderCustomerHistoryDrawerProps
> = ({
  showHistoryDrawer,
  setShowHistoryDrawer,
  customerName,
  phone,
  city,
  area,
  address,
  notes,
  customerProfile,
  previousOrders,
  loadingCustomerOrders,
}) => {
  if (!showHistoryDrawer) return null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-card animate-in fade-in slide-in-from-top-3 duration-200">
      <div className="flex items-center justify-between border-b border-border/70 bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm text-foreground">
            سجل طلبات وبيانات العميل (<span className="font-mono tabular-nums">{previousOrders.length}</span>)
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setShowHistoryDrawer(false)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground active:scale-[0.97] transition-all cursor-pointer"
          aria-label="إغلاق السجل"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-muted/15">
        {/* Customer Info Card */}
        <div className="p-3 rounded-xl border border-border/70 bg-card space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="font-bold text-sm text-foreground">
              {customerName || "عميل"}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {customerProfile?.customerRating && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-warning/15 text-warning border border-warning/30">
                  تقييم {customerProfile.customerRating}
                </span>
              )}
              {customerProfile?.deliveryRate != null && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-success/15 text-success border border-success/30">
                  <span className="font-mono tabular-nums">{customerProfile.deliveryRate}%</span> تسليم
                </span>
              )}
            </div>
          </div>

          {phone && (
            <div className="font-mono text-primary font-medium" dir="ltr">
              {phone}
            </div>
          )}

          {(city || area || address) && (
            <div className="flex items-start gap-1.5 text-muted-foreground">
              <MapPinIcon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
              <span>{[city, area, address].filter(Boolean).join(" · ")}</span>
            </div>
          )}

          {notes && (
            <div className="text-muted-foreground pt-1 border-t border-border/70">
              <span className="font-medium text-foreground">ملاحظات:</span> {notes}
            </div>
          )}
        </div>

        {/* Orders List */}
        {loadingCustomerOrders ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
            جاري جلب الطلبات السابقة...
          </div>
        ) : previousOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            <ShoppingBagIcon className="h-10 w-10 opacity-30 mx-auto mb-2" />
            لا توجد طلبات سابقة مسجلة لهذا الرقم
          </div>
        ) : (
          previousOrders.map((prevOrder) => (
            <div
              key={prevOrder.id || prevOrder.orderNumber}
              className="p-3 rounded-xl border border-border/70 bg-card text-xs space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-sm text-foreground">
                    #{prevOrder.orderNumber}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(prevOrder.createdAt).toLocaleDateString("ar-EG")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted text-foreground">
                    {prevOrder.status}
                  </span>
                  <span className="font-bold text-primary font-mono tabular-nums text-sm">
                    {prevOrder.total?.toLocaleString()} ج.م
                  </span>
                </div>
              </div>

              {prevOrder.orderItems && prevOrder.orderItems.length > 0 && (
                <div className="space-y-1 pt-1.5 border-t border-border/70">
                  {prevOrder.orderItems.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-[11px]"
                    >
                      <span className="truncate text-muted-foreground">
                        {item.quantity}× {item.productName || item.name}
                        {(item.productColor || item.productSize) && (
                          <span className="opacity-75 me-1 font-normal">
                            (
                            {[item.productColor, item.productSize]
                              .filter(Boolean)
                              .join(" - ")}
                            )
                          </span>
                        )}
                      </span>
                      <span className="font-mono tabular-nums font-medium shrink-0">
                        {(
                          Number(item.price || 0) * Number(item.quantity || 1)
                        ).toLocaleString()}{" "}
                        ج.م
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-1.5 flex justify-end">
                <a
                  href={`/orders/${encodeURIComponent(prevOrder.orderNumber || prevOrder.id)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  عرض تفاصيل الطلب بالكامل ←
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

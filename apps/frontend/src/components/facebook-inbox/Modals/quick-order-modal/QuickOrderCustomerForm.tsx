import React from "react";
import {
  UserIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  CustomerLookupResult,
  PreviousOrder,
} from "../../../../hooks/useCustomerByPhone";
import { CustomerBlockEvaluation } from "../../../../services/customerBlocklistService";
import { headingStyle, mutedStyle, dangerStyle } from "./styles";

interface QuickOrderCustomerFormProps {
  phone: string;
  setPhone: (phone: string) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  loadingCustomerOrders: boolean;
  customerProfile: CustomerLookupResult | null;
  previousOrders: PreviousOrder[];
  checkingBlock: boolean;
  customerBlock: CustomerBlockEvaluation | null;
  allowBlockedCustomerOverride: boolean;
  setAllowBlockedCustomerOverride: (allow: boolean) => void;
  canOverrideBlockedCustomer: boolean;
}

export const QuickOrderCustomerForm: React.FC<QuickOrderCustomerFormProps> = ({
  phone,
  setPhone,
  customerName,
  setCustomerName,
  loadingCustomerOrders,
  customerProfile,
  previousOrders,
  checkingBlock,
  customerBlock,
  allowBlockedCustomerOverride,
  setAllowBlockedCustomerOverride,
  canOverrideBlockedCustomer,
}) => {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <h3 className="mb-3 sm:mb-4 flex items-center gap-2 font-semibold text-sm sm:text-base text-foreground">
        <UserIcon className="h-4 w-4 text-muted-foreground" />
        بيانات العميل
      </h3>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              رقم الهاتف <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-9 w-full rounded-lg border border-border/70 bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                placeholder="01xxxxxxxxx"
                dir="ltr"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              اسم العميل <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="h-9 w-full rounded-lg border border-border/70 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              placeholder="اسم العميل"
            />
          </div>
        </div>

        {/* Customer Profile & Historical Orders Lookup */}
        {(loadingCustomerOrders ||
          customerProfile ||
          previousOrders.length > 0) && (
          <div className="rounded-xl border p-3 text-xs sm:text-sm bg-muted dark:bg-muted border-border dark:border-border space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs" style={headingStyle}>
                  سجل العميل والطلبات السابقة
                </span>
                {loadingCustomerOrders && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-primary animate-pulse">
                    <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                    جاري فحص السجل...
                  </span>
                )}
              </div>

              {customerProfile && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {customerProfile.customerRating && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning/15 text-warning border border-warning/30">
                      تقييم {customerProfile.customerRating}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-card border border-border/70 text-foreground">
                    <span className="font-mono tabular-nums">
                      {customerProfile.totalOrdersCount || previousOrders.length}
                    </span>{" "}
                    طلبات
                  </span>
                  {customerProfile.deliveryRate != null && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-success/15 text-success border border-success/30">
                      <span className="font-mono tabular-nums">{customerProfile.deliveryRate}%</span> تسليم
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Customer Tags & Address info if any */}
            {customerProfile &&
              (customerProfile.tags || customerProfile.notes) && (
                <div className="text-[11px] space-y-1 text-muted-foreground border-t border-border dark:border-border pt-1.5">
                  {customerProfile.notes && (
                    <p className="truncate">
                      <span className="font-medium text-foreground">ملاحظات:</span>{" "}
                      {customerProfile.notes}
                    </p>
                  )}
                </div>
              )}

            {/* Full Previous Orders List */}
            {previousOrders.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
                  <span>
                    الطلبات السابقة المسجلة ({previousOrders.length}):
                  </span>
                  <span className="text-[10px] opacity-75">محدّثة فورياً</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pe-0.5">
                  {previousOrders.map((prevOrder) => (
                    <div
                      key={prevOrder.id || prevOrder.orderNumber}
                      className="p-2 rounded-lg border border-border/70 bg-card text-xs space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold font-mono">
                            #{prevOrder.orderNumber}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(prevOrder.createdAt).toLocaleDateString(
                              "ar-EG",
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted dark:bg-muted text-foreground dark:text-muted-foreground">
                            {prevOrder.status}
                          </span>
                          <span className="font-bold text-primary font-mono tabular-nums">
                            {prevOrder.total?.toLocaleString()} ج.م
                          </span>
                        </div>
                      </div>

                      {prevOrder.orderItems &&
                        prevOrder.orderItems.length > 0 && (
                          <div className="text-[11px] text-muted-foreground truncate">
                            {prevOrder.orderItems
                              .map(
                                (item: any) =>
                                  `${item.quantity}× ${item.productName || item.name}${
                                    item.productSize || item.productColor
                                      ? ` (${[
                                          item.productColor,
                                          item.productSize,
                                        ]
                                          .filter(Boolean)
                                          .join("-")})`
                                      : ""
                                  }`,
                              )
                              .join(" · ")}
                          </div>
                        )}

                      <div className="text-end pt-0.5">
                        <a
                          href={`/orders/${encodeURIComponent(prevOrder.orderNumber || prevOrder.id)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1"
                        >
                          عرض تفاصيل الطلب ←
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !loadingCustomerOrders &&
              phone.replace(/\D/g, "").length >= 10 ? (
              <div className="text-xs text-muted-foreground italic py-1">
                لا توجد طلبات سابقة مسجلة لهذا الرقم (عميل جديد)
              </div>
            ) : null}
          </div>
        )}

        {(checkingBlock || customerBlock) && (
          <div
            className={`rounded-xl border p-3 text-xs sm:text-sm ${
              customerBlock?.blocked
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-warning/30 bg-warning/10 text-warning"
            }`}
          >
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {checkingBlock
                    ? "جاري فحص سجل العميل..."
                    : customerBlock?.blocked
                      ? "تنبيه: العميل محظور من إنشاء الطلبات"
                      : "تنبيه بخصوص هذا العميل"}
                </p>
                {customerBlock?.message && (
                  <p className="mt-1 leading-5 text-xs">
                    {customerBlock.message}
                  </p>
                )}
                {customerBlock?.blocked && canOverrideBlockedCustomer && (
                  <label className="mt-2.5 flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowBlockedCustomerOverride}
                      onChange={(e) =>
                        setAllowBlockedCustomerOverride(e.target.checked)
                      }
                      className="h-4 w-4 rounded border-destructive text-destructive focus:ring-destructive"
                    />
                    <span>تجاوز الحظر وإتمام الطلب (صلاحية إدارية)</span>
                  </label>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

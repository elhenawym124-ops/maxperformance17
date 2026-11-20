import React from "react";
import { BanknotesIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import {
  EligiblePreviousOrder,
  ExchangeReturnPolicy,
} from "../../../../../hooks/useCustomerByPhone";
import { ShippingInfo } from "./types";

interface CheckoutOrderSettingsSectionProps {
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;
  status: string;
  setStatus: (val: string) => void;
  requestType: string;
  setRequestType: (val: string) => void;
  returnAmount: string;
  setReturnAmount: (val: string) => void;
  shippingInfo: ShippingInfo | null;
  notes: string;
  setNotes: (val: string) => void;
  isEn: boolean;
  isExchangeOrReturn: boolean;
  phoneDigitsCount: number;
  previousOrderMissing: boolean;
  eligiblePreviousOrders: EligiblePreviousOrder[];
  exchangeReturnPolicy: ExchangeReturnPolicy | null;
  selectedPreviousOrder: string;
  setSelectedPreviousOrder: (val: string) => void;
  selectedOrderObj: EligiblePreviousOrder | undefined;
  t: (key: string) => string;
}

export const CheckoutOrderSettingsSection: React.FC<CheckoutOrderSettingsSectionProps> = ({
  paymentMethod,
  setPaymentMethod,
  status,
  setStatus,
  requestType,
  setRequestType,
  returnAmount,
  setReturnAmount,
  shippingInfo,
  notes,
  setNotes,
  isEn,
  isExchangeOrReturn,
  phoneDigitsCount,
  previousOrderMissing,
  eligiblePreviousOrders,
  exchangeReturnPolicy,
  selectedPreviousOrder,
  setSelectedPreviousOrder,
  selectedOrderObj,
  t,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <BanknotesIcon className="w-5 h-5 text-muted-foreground" />
        {t("manualOrder.k_108")}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            {t("manualOrder.k_109")}
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full border-border rounded-md focus:ring-primary focus:border-primary dark:bg-muted dark:text-muted-foreground"
          >
            <option value="CASH">{t("manualOrder.k_12")}</option>
            <option value="WALLET">{t("manualOrder.k_13")}</option>
            <option value="INSTAPAY">Instapay</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            {t("manualOrder.k_110")}
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border-border rounded-md focus:ring-primary focus:border-primary dark:bg-muted dark:text-muted-foreground"
          >
            <option value="PENDING">{t("manualOrder.k_14")}</option>
            <option value="CONFIRMED">{t("manualOrder.k_15")}</option>
            <option value="PROCESSING">{t("manualOrder.k_16")}</option>
            <option value="RETURNED">{t("manualOrder.k_17")}</option>
            <option value="EXCHANGED">{t("manualOrder.k_18")}</option>
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs text-muted-foreground mb-1">
            {t("manualOrder.k_111")}
          </label>
          <select
            value={requestType}
            onChange={(e) => {
              const val = e.target.value;
              setRequestType(val);
              if (val === "return") {
                setStatus("RETURNED");
              } else if (val === "exchange") {
                setStatus("EXCHANGED");
              } else {
                setStatus("CONFIRMED");
              }
            }}
            className="w-full border-border rounded-md focus:ring-primary focus:border-primary dark:bg-muted dark:text-muted-foreground"
          >
            <option value="delivery">{t("manualOrder.k_19")}</option>
            <option value="partial_delivery">
              {isEn ? "Partial Delivery Order" : "طلب تسليم جزئي"}
            </option>
            <option value="return">{t("manualOrder.k_20")}</option>
            <option value="exchange">{t("manualOrder.k_21")}</option>
          </select>
        </div>

        {isExchangeOrReturn && (
          <div className="col-span-2 space-y-2">
            {phoneDigitsCount < 9 ? (
              <div className="p-2.5 rounded-lg border border-warning dark:border-warning/40 bg-warning/70 dark:bg-warning/20 text-xs text-warning dark:text-warning flex items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-warning shrink-0" />
                <span>
                  يرجى إدخال رقم هاتف العميل أولاً للتحقق من وجود طلبات سابقة
                  مؤهلة
                </span>
              </div>
            ) : previousOrderMissing ? (
              <div className="p-3 rounded-lg border border-destructive dark:border-destructive/50 bg-destructive/80 dark:bg-destructive/30 text-xs text-destructive dark:text-destructive space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <ExclamationTriangleIcon className="w-4 h-4 text-destructive shrink-0" />
                  <span>
                    لا يمكن إنشاء طلب {requestType === "return" ? "مرتجع" : "استبدال"}
                  </span>
                </div>
                <p className="leading-relaxed">
                  سياسة المتجر تشترط وجود طلب سابق مكتمل (
                  {exchangeReturnPolicy?.allowedStatuses?.join(" أو ") ||
                    "DELIVERED"}
                  ) خلال {exchangeReturnPolicy?.timeLimitDays || 14} يوم. لم يتم
                  العثور على أي طلب مؤهل لهذا الرقم.
                </p>
              </div>
            ) : eligiblePreviousOrders.length > 0 ? (
              <div className="p-3 rounded-lg border border-primary dark:border-primary/40 bg-primary/50 dark:bg-primary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-primary dark:text-primary">
                    الطلب السابق المرتبط بال
                    {requestType === "return" ? "مرتجع" : "استبدال"}
                    {exchangeReturnPolicy?.requireExplicitOrderLink && (
                      <span className="text-red-500 ms-1">*</span>
                    )}
                  </label>
                  <span className="text-[11px] font-medium text-primary dark:text-primary">
                    {eligiblePreviousOrders.length} طلب سابق مؤهل
                  </span>
                </div>
                <select
                  value={selectedPreviousOrder}
                  onChange={(e) => setSelectedPreviousOrder(e.target.value)}
                  className="w-full text-xs border-border rounded-md focus:ring-primary focus:border-primary dark:bg-muted dark:text-muted-foreground py-2"
                >
                  <option value="">
                    {exchangeReturnPolicy?.requireExplicitOrderLink
                      ? "اختر الطلب السابق (إلزامي)..."
                      : "تحديد تلقائي (أحدث طلب مؤهل)"}
                  </option>
                  {eligiblePreviousOrders.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      #{ord.orderNumber} —{" "}
                      {new Date(ord.createdAt).toLocaleDateString("ar-EG")} —{" "}
                      {Number(ord.total).toLocaleString()} ج.م ({ord.status})
                    </option>
                  ))}
                </select>
                {selectedOrderObj && (
                  <div className="text-[11px] text-muted-foreground bg-white/80 dark:bg-muted p-2 rounded border border-border dark:border-border space-y-0.5">
                    <span className="font-semibold text-foreground">
                      المنتجات بالطلب السابق:{" "}
                    </span>
                    <span>
                      {selectedOrderObj.orderItems
                        ?.map(
                          (it) =>
                            `${it.productName}${
                              it.productColor ? ` - ${it.productColor}` : ""
                            }${it.productSize ? ` (${it.productSize})` : ""} × ${
                              it.quantity
                            }`,
                        )
                        .join(" | ") || "منتجات الطلب السابق"}
                    </span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Return Collection Amount */}
      <div>
        <label className="block text-xs text-muted-foreground mb-1">
          {isEn
            ? "💰 Return Collection Amount (Default: Shipping Cost)"
            : "💰 مبلغ التحصيل في حالة المرتجع (افتراضي: مصاريف الشحن)"}
        </label>
        <div className="relative">
          <input
            type="number"
            value={returnAmount}
            onChange={(e) => setReturnAmount(e.target.value)}
            placeholder={
              shippingInfo
                ? `${shippingInfo.price} ${
                    isEn ? "(Shipping Cost)" : "(مصاريف الشحن)"
                  }`
                : isEn
                ? "Shipping cost will be used automatically"
                : "سيتم استخدام مصاريف الشحن تلقائياً"
            }
            className="w-full border-border rounded-md focus:ring-primary focus:border-primary text-sm dark:bg-muted dark:text-muted-foreground dark:placeholder-muted pe-16"
            min="0"
            step="1"
          />
          <span
            className={`absolute ${
              isEn ? "end-2" : "start-2"
            } top-1/2 -translate-y-1/2 text-xs text-muted-foreground`}
          >
            {isEn ? "EGP" : "ج.م"}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {isEn
            ? 'This amount appears in the courier system as "Return Collection Amount"'
            : 'هذا المبلغ يظهر في شركة الشحن كـ "مبلغ التحصيل في حالة المرتجع"'}
        </p>
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-1">
          {t("manualOrder.k_112")}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border-border rounded-md focus:ring-primary focus:border-primary h-16 resize-none text-sm dark:bg-muted dark:text-muted-foreground dark:placeholder-muted"
          placeholder={t("manualOrder.k_10")}
        />
      </div>
    </div>
  );
};

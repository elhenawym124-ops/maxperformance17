import React from "react";
import { CheckCircle2 } from "lucide-react";
import type { OrderDetailsType } from "../types";

export interface OrderDeliveryProofCardProps {
  order: OrderDetailsType;
}

export const OrderDeliveryProofCard: React.FC<OrderDeliveryProofCardProps> = ({ order }) => {
  const providerKey = (order.providerKey || "").toUpperCase();
  const deliveredAt = order.deliveredAt;
  const trackingNumber = order.trackingNumber;

  if (!deliveredAt && !(providerKey === "HASHTAG" && trackingNumber)) return null;

  const providerName =
    order.shippingCompany?.name ||
    (providerKey === "HASHTAG" ? "هاشتاج إكسبريس (Hashtag Express)" : providerKey || "شركة الشحن");
  const courierName = order.courier?.name;
  const formattedDeliveredAt = deliveredAt
    ? new Date(deliveredAt).toLocaleString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex items-center gap-2.5 border-b border-border/50 pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10 text-success">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-foreground">إثبات التسليم</h3>
      </div>

      <div className="grid grid-cols-1 gap-2.5 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold text-muted-foreground">تم التسليم بواسطة</span>
          <span className="font-bold text-foreground">{providerName}</span>
        </div>

        {trackingNumber && (
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold text-muted-foreground">رقم البوليصة</span>
            <span className="font-mono tabular-nums text-foreground" dir="ltr">
              {trackingNumber}
            </span>
          </div>
        )}

        {courierName && (
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold text-muted-foreground">المندوب</span>
            <span className="font-semibold text-foreground">{courierName}</span>
          </div>
        )}

        {formattedDeliveredAt && (
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold text-muted-foreground">وقت التسليم</span>
            <span className="font-semibold text-foreground">{formattedDeliveredAt}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDeliveryProofCard;

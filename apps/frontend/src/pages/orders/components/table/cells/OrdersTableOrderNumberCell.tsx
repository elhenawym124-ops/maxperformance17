import React from "react";
import { useTranslation } from "react-i18next";
import { summarizeOrderDocumentItems } from "../../../../../utils/orderDocumentQuantityOffers";
import { hasPostPurchaseOffer } from "../../../../../utils/postPurchaseOfferBadge";
import type { Order } from "../../../Orders";

interface OrdersTableOrderNumberCellProps {
  order: Order;
  displayOrderNumber: string;
  cellPadding: string;
}

export const OrdersTableOrderNumberCell: React.FC<OrdersTableOrderNumberCellProps> = ({
  order,
  displayOrderNumber,
  cellPadding,
}) => {
  const { t } = useTranslation();
  const orderItemsSummary = summarizeOrderDocumentItems(order.items);

  const isAffiliateDirect =
    order.orderSource === "AFFILIATE_DIRECT" ||
    (typeof order.orderNumber === "string" && order.orderNumber.includes("-AFF-")) ||
    (typeof displayOrderNumber === "string" && displayOrderNumber.includes("-AFF-"));
  const affiliateCompanyName =
    order.affiliate?.user?.company?.name ||
    (order.affiliate as any)?.company?.name ||
    null;

  return (
    <td className={cellPadding}>
      <div className="flex flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-1 min-w-0 max-w-[190px] whitespace-nowrap">
          <span
            dir="ltr"
            className="inline-block whitespace-nowrap font-mono text-xs sm:text-[13px] font-bold tabular-nums text-foreground tracking-tight"
          >
            #{displayOrderNumber}
          </span>
          {isAffiliateDirect && (
            <span
              className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground"
              title={affiliateCompanyName ? `أوردر من شركة مرتبطة: ${affiliateCompanyName}` : "أوردر من شركة مرتبطة"}
            >
              <span>{affiliateCompanyName ? `مرتبط — ${affiliateCompanyName}` : "مرتبط"}</span>
            </span>
          )}
          {(Boolean(order.isWholesale) || order.orderSource === "WHOLESALE" || Boolean(order.wholesaleCustomerId)) && (
            <span
              className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground"
              title="طلب موزع جملة"
            >
              <span>موزع</span>
            </span>
          )}
          {hasPostPurchaseOffer(order) && (
            <span
              className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground"
              title="يحتوي على عرض خاص بعد الشراء (Post-Purchase Upsell)"
            >
              <span className="h-2 w-2 rounded-full shrink-0 bg-warning" />
              <span className="hidden sm:inline">عرض بعد الشراء</span>
            </span>
          )}
          {order.metadata?.isGuestOrder && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/50">
              {t("orders.guest")}
            </span>
          )}
          {(order.status === "DUPLICATE_ORDER" || Boolean(order.metadata?.duplicate)) && (
            <span
              className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground"
              title={
                order.metadata?.duplicate?.duplicateOfOrderNumber
                  ? `طلب مكرر من #${order.metadata.duplicate.duplicateOfOrderNumber}`
                  : "طلب مكرر"
              }
            >
              <span className="h-2 w-2 rounded-full shrink-0 bg-warning" />
              <span>مكرر</span>
            </span>
          )}
          {!order.isViewed && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground">
              {t("orders.newLabel")}
            </span>
          )}
        </div>
        {orderItemsSummary.hasQuantityOffers && (
          <div
            className="max-w-[175px] truncate text-[11px] text-muted-foreground"
            title={orderItemsSummary.primaryLabel}
          >
            {orderItemsSummary.primaryLabel}
          </div>
        )}
        {order.notes && (
          <div
            className="max-w-[180px] truncate text-[11px] text-muted-foreground"
            title={order.notes}
          >
            {order.notes}
          </div>
        )}
      </div>
    </td>
  );
};

export default OrdersTableOrderNumberCell;

import React from "react";
import { useTranslation } from "react-i18next";
import { DocumentDuplicateIcon, GiftIcon } from "@heroicons/react/24/outline";
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
        <div className="flex flex-wrap items-center gap-1.5 min-w-0 max-w-[300px] whitespace-nowrap">
          <span
            dir="ltr"
            className="inline-block whitespace-nowrap font-mono text-xs sm:text-[13px] font-bold tabular-nums text-foreground tracking-tight"
          >
            #{displayOrderNumber}
          </span>
          {isAffiliateDirect && (
            <span
              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary dark:text-primary border border-primary/20"
              title={affiliateCompanyName ? `أوردر من شركة مرتبطة: ${affiliateCompanyName}` : "أوردر من شركة مرتبطة"}
            >
              <span>{affiliateCompanyName ? `مرتبط — ${affiliateCompanyName}` : "مرتبط"}</span>
            </span>
          )}
          {(Boolean(order.isWholesale) || order.orderSource === "WHOLESALE" || Boolean(order.wholesaleCustomerId)) && (
            <span
              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary dark:text-primary border border-primary/20"
              title="طلب موزع جملة"
            >
              <span>موزع</span>
            </span>
          )}
          {hasPostPurchaseOffer(order) && (
            <span
              className="inline-flex items-center gap-1 rounded-md bg-warning/10 px-1.5 py-0.5 text-[10px] font-bold text-warning dark:text-warning border border-warning/20"
              title="يحتوي على عرض خاص بعد الشراء (Post-Purchase Upsell)"
            >
              <GiftIcon className="w-3 h-3 text-warning dark:text-warning" />
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
              className="inline-flex items-center gap-1 rounded-md bg-warning/10 px-1.5 py-0.5 text-[10px] font-bold text-warning dark:text-warning border border-warning/20"
              title={
                order.metadata?.duplicate?.duplicateOfOrderNumber
                  ? `طلب مكرر من #${order.metadata.duplicate.duplicateOfOrderNumber}`
                  : "طلب مكرر"
              }
            >
              <DocumentDuplicateIcon className="w-3 h-3 text-warning dark:text-warning" />
              <span>مكرر</span>
              {order.metadata?.duplicate?.duplicateOfOrderNumber && (
                <span className="font-mono text-[10px] opacity-80" dir="ltr">
                  (#{order.metadata.duplicate.duplicateOfOrderNumber})
                </span>
              )}
            </span>
          )}
          {!order.isViewed && (
            <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive dark:text-destructive border border-destructive/20">
              {t("orders.newLabel")}
            </span>
          )}
        </div>
        {orderItemsSummary.hasQuantityOffers && (
          <div
            className="inline-flex items-center gap-1 max-w-[220px] truncate rounded border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-[11px] font-medium text-warning dark:border-warning/40 dark:bg-warning/20 dark:text-warning"
            title={orderItemsSummary.primaryLabel}
          >
            <span className="truncate">{orderItemsSummary.primaryLabel}</span>
          </div>
        )}
        {order.notes && (
          <div
            className="inline-flex items-center gap-1 max-w-[240px] truncate rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary"
            title={order.notes}
          >
            <span className="truncate">{order.notes}</span>
          </div>
        )}
      </div>
    </td>
  );
};

export default OrdersTableOrderNumberCell;

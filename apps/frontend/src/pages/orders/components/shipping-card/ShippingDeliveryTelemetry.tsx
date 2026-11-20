/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  PhoneIcon,
  UserIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";

export interface ShippingDeliveryTelemetryProps {
  order: any;
  shipmentMeta: any;
  liveStatus: any;
}

export const ShippingDeliveryTelemetry: React.FC<
  ShippingDeliveryTelemetryProps
> = ({ order, shipmentMeta, liveStatus }) => {
  const hasReturnOrDelay = Boolean(
    order?.turboReturnReason ||
      order?.turboDelayReason ||
      shipmentMeta?.returnReason
  );

  const hasDriverDetails = Boolean(
    liveStatus?.driverName || liveStatus?.driverPhone || liveStatus?.statusNote
  );

  if (!hasReturnOrDelay && !hasDriverDetails) {
    return null;
  }

  return (
    <>
      {/* Return & Delay Reasons from Carrier */}
      {hasReturnOrDelay && (
        <div className="p-3 rounded-lg bg-destructive/80 dark:bg-destructive/30 border border-destructive dark:border-destructive/50 text-xs space-y-1.5">
          {order?.turboReturnReason && (
            <div className="flex items-start gap-2">
              <span className="font-bold text-destructive dark:text-destructive shrink-0">
                سبب المرتجع:
              </span>
              <span className="text-destructive dark:text-destructive font-semibold">
                {order.turboReturnReason}
              </span>
            </div>
          )}
          {order?.turboDelayReason && (
            <div className="flex items-start gap-2 pt-1 border-t border-destructive/60 dark:border-destructive/30">
              <span className="font-medium text-destructive dark:text-destructive shrink-0">
                ملاحظة التأخير:
              </span>
              <span className="text-foreground dark:dark:text-muted-foreground">
                {order.turboDelayReason}
              </span>
            </div>
          )}
          {shipmentMeta?.returnReason &&
            shipmentMeta.returnReason !== order?.turboReturnReason && (
              <div className="flex items-start gap-2 pt-1 border-t border-destructive/60 dark:border-destructive/30">
                <span className="font-medium text-destructive dark:text-destructive shrink-0">
                  سبب الاسترجاع:
                </span>
                <span className="text-foreground dark:dark:text-muted-foreground">
                  {shipmentMeta.returnReason}
                </span>
              </div>
            )}
        </div>
      )}

      {/* Driver & Delivery Field Details (QP Express / Integrated Couriers) */}
      {hasDriverDetails && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-lg bg-primary/50 dark:bg-primary/20 border border-primary dark:border-primary/40">
          {liveStatus.driverName && (
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-primary dark:text-primary shrink-0" />
              <div className="text-xs truncate">
                <span className="text-muted-foreground dark:dark:text-muted-foreground">
                  المندوب:{" "}
                </span>
                <span className="font-semibold text-foreground dark:text-white">
                  {liveStatus.driverName}
                </span>
              </div>
            </div>
          )}

          {liveStatus.driverPhone && (
            <div className="flex items-center gap-2">
              <PhoneIcon className="h-4 w-4 text-success dark:text-success shrink-0" />
              <div className="text-xs">
                <span className="text-muted-foreground dark:dark:text-muted-foreground">
                  هاتف المندوب:{" "}
                </span>
                <a
                  href={`tel:${liveStatus.driverPhone}`}
                  className="font-mono tabular-nums font-bold text-success dark:text-success hover:underline"
                >
                  {liveStatus.driverPhone}
                </a>
              </div>
            </div>
          )}

          {liveStatus.statusNote && (
            <div className="sm:col-span-2 flex items-start gap-2 pt-1 border-t border-primary/60 dark:border-primary/30">
              <ChatBubbleBottomCenterTextIcon className="h-4 w-4 text-warning dark:text-warning shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-warning dark:text-warning">
                  ملاحظة المندوب الميدانية:{" "}
                </span>
                <span className="text-foreground dark:dark:text-muted-foreground">
                  {liveStatus.statusNote}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

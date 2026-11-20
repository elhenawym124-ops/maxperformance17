/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  ArrowPathIcon,
  PrinterIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  PaperAirplaneIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";

export interface ShippingTrackingActionsProps {
  order: any;
  shipment: any;
  existingTracking: string;
  isQpExpress: boolean;
  isBosta: boolean;
  isTurbo: boolean;
  resending: boolean;
  syncing: boolean;
  onResendShipment: () => void;
  onSyncStatus: () => void;
  onOpenTicket?: () => void;
  onPrintBostaAWB: () => void;
  onPrintQpWaybill: () => void;
  onShowCancelModal: () => void;
}

export const ShippingTrackingActions: React.FC<
  ShippingTrackingActionsProps
> = ({
  order,
  shipment,
  existingTracking,
  isQpExpress,
  isBosta,
  isTurbo,
  resending,
  syncing,
  onResendShipment,
  onSyncStatus,
  onOpenTicket,
  onPrintBostaAWB,
  onPrintQpWaybill,
  onShowCancelModal,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <button
        type="button"
        onClick={onResendShipment}
        disabled={resending || syncing}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 dark:bg-primary/50 text-primary dark:text-primary border border-primary dark:border-primary hover:bg-primary dark:hover:bg-primary/60 transition disabled:opacity-50 active:scale-97"
        title="إعادة إرسال وتحديث بيانات الشحنة والعنوان لشركة الشحن"
      >
        <PaperAirplaneIcon
          className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`}
        />
        <span>{resending ? "جاري الإرسال..." : "إعادة إرسال الشحنة"}</span>
      </button>

      <button
        type="button"
        onClick={onSyncStatus}
        disabled={syncing || resending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border dark:dark:border-border text-foreground dark:dark:text-muted-foreground hover:hover:bg-muted dark:hover:dark:hover:bg-muted transition disabled:opacity-50 active:scale-97"
      >
        <ArrowPathIcon
          className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`}
        />
        <span>مزامنة الحالة اللحظية</span>
      </button>

      {onOpenTicket && (
        <button
          type="button"
          onClick={onOpenTicket}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-warning/10 dark:bg-warning/50 text-warning dark:text-warning border border-warning dark:border-warning hover:bg-warning transition shadow-xs active:scale-97"
          title="فتح تذكرة دعم بخصوص هذه الشحنة في مركز التذاكر"
        >
          <TicketIcon className="h-3.5 w-3.5 text-warning dark:text-warning" />
          <span>فتح تذكرة شحن</span>
        </button>
      )}

      {isQpExpress && (
        <a
          href="https://qpxpress.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground dark:dark:text-muted-foreground border border-border dark:dark:border-border hover:hover:bg-muted dark:hover:dark:hover:bg-muted transition active:scale-97"
        >
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 text-primary" />
          <span>بوابة QP Express</span>
        </a>
      )}

      {isBosta && (
        <a
          href="https://business.bosta.co"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground dark:dark:text-muted-foreground border border-border dark:dark:border-border hover:hover:bg-muted dark:hover:dark:hover:bg-muted transition active:scale-97"
        >
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 text-warning" />
          <span>بوابة بوستا Bosta</span>
        </a>
      )}

      {shipment?.labelUrl && (
        <a
          href={shipment.labelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 dark:bg-primary/50 text-primary dark:text-primary border border-primary dark:border-primary hover:bg-primary transition active:scale-97"
        >
          <PrinterIcon className="h-3.5 w-3.5" />
          <span>طباعة البوليصة AWB</span>
        </a>
      )}

      {isBosta && (
        <button
          type="button"
          onClick={onPrintBostaAWB}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-warning/10 dark:bg-warning/50 text-warning dark:text-warning border border-warning dark:border-warning hover:bg-warning transition shadow-xs active:scale-97"
          title="طباعة بوليصة شحن بوستا AWB"
        >
          <PrinterIcon className="h-3.5 w-3.5 text-warning dark:text-warning" />
          <span>طباعة بوليصة بوستا AWB</span>
        </button>
      )}

      {isQpExpress && existingTracking && (
        <button
          type="button"
          onClick={onPrintQpWaybill}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-warning/10 dark:bg-warning/50 text-warning dark:text-warning border border-warning dark:border-warning hover:bg-warning transition shadow-xs active:scale-97"
          title="طباعة ستيكر حراري (80×50 مم) مع الباركود"
        >
          <PrinterIcon className="h-3.5 w-3.5 text-warning dark:text-warning" />
          <span>طباعة ستيكر QP (80×50 مم)</span>
        </button>
      )}

      {isTurbo &&
        (order?.turboTrackingNumber ||
          order?.turboShipmentId ||
          shipment?.trackingNumber) && (
          <a
            href={`/api/v1/turbo/orders/${
              order.orderNumber || order.id
            }/waybill`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 dark:bg-primary/50 text-primary dark:text-primary border border-primary dark:border-primary hover:bg-primary transition shadow-xs active:scale-97"
            title="طباعة بوليصة شحن تربو الرسمية"
          >
            <PrinterIcon className="h-3.5 w-3.5 text-primary dark:text-primary" />
            <span>طباعة بوليصة تربو AWB</span>
          </a>
        )}

      <button
        type="button"
        onClick={onShowCancelModal}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive border border-destructive hover:bg-destructive/10 dark:border-destructive/50 dark:hover:bg-destructive/30 transition active:scale-97"
      >
        <XMarkIcon className="h-3.5 w-3.5" />
        <span>إلغاء الشحنة</span>
      </button>
    </div>
  );
};

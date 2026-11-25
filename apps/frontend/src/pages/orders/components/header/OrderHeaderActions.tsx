import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Check,
  Pencil,
  Printer,
  CreditCard,
  Calendar,
  Truck,
  Ticket,
  ArrowLeftRight,
  XCircle,
} from "lucide-react";
import { WhatsAppIcon } from "../../../../components/icons/brands";
import type { OrderDetailsType } from "../../types";

export interface OrderHeaderActionsProps {
  order: OrderDetailsType;
  isEditing: boolean;
  updating: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onPrint: () => void;
  onPrintPreparationSlip: () => void;
  onOpenTicket?: () => void;
  canEditOrder?: boolean;
  canPrintPreparationSlip?: boolean;
  whatsappChatUrl?: string | null;
  canUpdatePaymentStatus?: boolean;
  onUpdatePayment?: () => void;
  canPostponeOrder?: boolean;
  onPostponeOrder?: () => void;
  canPartialDelivery?: boolean;
  onPartialDelivery?: () => void;
  showLateCancellationButton?: boolean;
  onCancelRequest?: () => void;
}

export const OrderHeaderActions: React.FC<OrderHeaderActionsProps> = ({
  order,
  isEditing,
  updating,
  onEdit,
  onCancel,
  onSave,
  onPrint,
  onPrintPreparationSlip,
  onOpenTicket,
  canEditOrder = true,
  canPrintPreparationSlip = true,
  whatsappChatUrl,
  canUpdatePaymentStatus = false,
  onUpdatePayment,
  canPostponeOrder = false,
  onPostponeOrder,
  canPartialDelivery = false,
  onPartialDelivery,
  showLateCancellationButton = false,
  onCancelRequest,
}) => {
  const { t } = useTranslation();

  return (
    <div className="w-full lg:w-auto mt-0.5 lg:mt-0">
      {!isEditing ? (
        <div className="no-scrollbar flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5 sm:flex-wrap">
          {canEditOrder && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={String(t("orderDetails.editOrder"))}
              title={String(t("orderDetails.editOrder"))}
              className="inline-flex items-center justify-center sm:justify-start gap-1.5 h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-2 border border-primary/30 text-xs sm:text-sm font-semibold rounded-xl text-primary bg-primary/10 hover:bg-primary/20 whitespace-nowrap shrink-0 transition active:scale-97 shadow-xs"
            >
              <Pencil className="h-4 w-4 shrink-0" />
              <span className="sr-only sm:not-sr-only">{t("orderDetails.editOrder")}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onPrint}
            aria-label={String(t("orderDetails.invoice", { defaultValue: "الفاتورة" }))}
            title={`طباعة ${t("orderDetails.invoice", { defaultValue: "الفاتورة" })}`}
            className="inline-flex items-center justify-center sm:justify-start gap-1.5 h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-2 border border-border/70 text-xs sm:text-sm font-medium rounded-xl text-foreground bg-card hover:bg-muted whitespace-nowrap shrink-0 transition active:scale-97 shadow-xs"
          >
            <Printer className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="sr-only sm:not-sr-only">
              <span className="hidden sm:inline">طباعة </span>
              <span>
                {t("orderDetails.invoice", { defaultValue: "الفاتورة" })}
              </span>
            </span>
          </button>

          {canPrintPreparationSlip && (
            <button
              type="button"
              onClick={onPrintPreparationSlip}
              aria-label={String(
                t("orderDetails.preparationSlip", { defaultValue: "ورقة التجهيز" })
              )}
              title={`طباعة ${t("orderDetails.preparationSlip", { defaultValue: "ورقة التجهيز" })}`}
              className="inline-flex items-center justify-center sm:justify-start gap-1.5 h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-2 border border-success/30 text-xs sm:text-sm font-medium rounded-xl text-success dark:text-success bg-success/10 hover:bg-success/20 whitespace-nowrap shrink-0 transition active:scale-97 shadow-xs"
            >
              <Printer className="h-4 w-4 shrink-0 text-success dark:text-success" />
              <span className="sr-only sm:not-sr-only">
                <span className="hidden sm:inline">طباعة </span>
                <span>
                  {t("orderDetails.preparationSlip", {
                    defaultValue: "ورقة التجهيز",
                  })}
                </span>
              </span>
            </button>
          )}

          {canUpdatePaymentStatus && onUpdatePayment && (
            <button
              type="button"
              onClick={onUpdatePayment}
              aria-label={String(t("orderDetails.updatePayment"))}
              title={String(t("orderDetails.updatePayment"))}
              className="inline-flex items-center justify-center sm:justify-start gap-1.5 h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-2 border border-border/70 text-xs sm:text-sm font-medium rounded-xl text-foreground bg-card hover:bg-muted whitespace-nowrap shrink-0 transition active:scale-97 shadow-xs"
            >
              <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="sr-only sm:not-sr-only">{t("orderDetails.updatePayment")}</span>
            </button>
          )}

          {canPostponeOrder && onPostponeOrder && (
            <button
              type="button"
              onClick={onPostponeOrder}
              aria-label={String(t("orderDetails.postponeOrder"))}
              title={String(t("orderDetails.postponeOrder"))}
              className="inline-flex items-center justify-center sm:justify-start gap-1.5 h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-2 border border-warning/30 text-xs sm:text-sm font-medium rounded-xl text-warning dark:text-warning bg-warning/10 hover:bg-warning/20 whitespace-nowrap shrink-0 transition active:scale-97 shadow-xs"
            >
              <Calendar className="h-4 w-4 shrink-0 text-warning dark:text-warning" />
              <span className="sr-only sm:not-sr-only">{t("orderDetails.postponeOrder")}</span>
            </button>
          )}

          {canPartialDelivery && onPartialDelivery && (
            <button
              type="button"
              onClick={onPartialDelivery}
              aria-label={String(t("orderDetails.partialDelivery"))}
              title={String(t("orderDetails.partialDelivery"))}
              className="inline-flex items-center justify-center sm:justify-start gap-1.5 h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-2 border border-primary/30 text-xs sm:text-sm font-medium rounded-xl text-primary bg-primary/10 hover:bg-primary/20 whitespace-nowrap shrink-0 transition active:scale-97 shadow-xs"
            >
              <Truck className="h-4 w-4 shrink-0 text-primary" />
              <span className="sr-only sm:not-sr-only">{t("orderDetails.partialDelivery")}</span>
            </button>
          )}

          {onOpenTicket && (
            <button
              type="button"
              onClick={onOpenTicket}
              aria-label={String(
                t("orderDetails.supportTickets", { defaultValue: "تذاكر الدعم" })
              )}
              className="inline-flex items-center justify-center sm:justify-start gap-1.5 h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-2 border border-warning/30 text-xs sm:text-sm font-medium rounded-xl text-warning dark:text-warning bg-warning/10 hover:bg-warning/20 whitespace-nowrap shrink-0 transition active:scale-97 shadow-xs"
              title="فتح أو متابعة تذاكر الدعم لهذا الطلب"
            >
              <Ticket className="h-4 w-4 shrink-0 text-warning dark:text-warning" />
              <span className="sr-only sm:not-sr-only">
                {t("orderDetails.supportTickets", {
                  defaultValue: "تذاكر الدعم",
                })}
              </span>
            </button>
          )}

          {whatsappChatUrl && (
            <Link
              to={whatsappChatUrl}
              aria-label={String(
                t("orderDetails.whatsapp", { defaultValue: "واتساب المنصة" })
              )}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 border border-success/30 text-sm font-medium rounded-xl text-success dark:text-success bg-success/10 hover:bg-success/20 whitespace-nowrap shrink-0 transition active:scale-97 shadow-xs"
              title="فتح محادثة العميل على واتساب المنصة"
            >
              <WhatsAppIcon className="h-4 w-4 shrink-0 text-success dark:text-success" />
              <span>
                {t("orderDetails.whatsapp", {
                  defaultValue: "واتساب المنصة",
                })}
              </span>
            </Link>
          )}

          {["DELIVERED", "PARTIALLY_DELIVERED", "SHIPPED"].includes(
            String(order.status || "").toUpperCase()
          ) && (
            <Link
              to={`/orders/manual?exchangeOrderNumber=${encodeURIComponent(
                order.orderNumber
              )}&phone=${encodeURIComponent(order.customerPhone || "")}`}
              aria-label={String(
                t("orderDetails.exchangeOrder", { defaultValue: "طلب استبدال" })
              )}
              className="inline-flex items-center justify-center sm:justify-start gap-1.5 h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-2 border border-primary/30 text-xs sm:text-sm font-medium rounded-xl text-primary dark:text-primary bg-primary/10 hover:bg-primary/20 whitespace-nowrap shrink-0 transition active:scale-97 shadow-xs"
              title="إنشاء طلب استبدال مبني على هذا الطلب"
            >
              <ArrowLeftRight className="h-4 w-4 shrink-0 text-primary dark:text-primary" />
              <span className="sr-only sm:not-sr-only">
                {t("orderDetails.exchangeOrder", {
                  defaultValue: "طلب استبدال",
                })}
              </span>
            </Link>
          )}

          {showLateCancellationButton && onCancelRequest && (
            <button
              type="button"
              onClick={onCancelRequest}
              disabled={updating}
              aria-label={String(t("orderDetails.cancelOrderRequest"))}
              title={String(t("orderDetails.cancelOrderRequest"))}
              className="inline-flex items-center justify-center sm:justify-start gap-1.5 h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-2 border border-destructive/30 text-xs sm:text-sm font-medium rounded-xl text-destructive bg-destructive/10 hover:bg-destructive/20 whitespace-nowrap shrink-0 transition active:scale-97 shadow-xs disabled:opacity-50"
            >
              <XCircle className="h-4 w-4 shrink-0 text-destructive" />
              <span className="sr-only sm:not-sr-only">{t("orderDetails.cancelOrderRequest")}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="fixed bottom-16 inset-x-3 z-40 sm:static sm:inset-auto flex items-center gap-2 bg-card/95 backdrop-blur-sm sm:bg-transparent p-2 sm:p-0 rounded-xl sm:rounded-none border border-border/70 sm:border-0 shadow-lg sm:shadow-none">
          <button
            type="button"
            onClick={onSave}
            disabled={updating}
            className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 px-4 py-2 border border-transparent text-xs sm:text-sm font-semibold rounded-xl text-white bg-success hover:bg-success whitespace-nowrap shrink-0 transition active:scale-97 shadow-xs disabled:opacity-50"
          >
            <Check className="h-4 w-4 shrink-0" />
            <span>
              {updating
                ? t("orderDetails.saving")
                : t("orderDetails.saveChanges")}
            </span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={updating}
            className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 px-4 py-2 border border-border/70 text-xs sm:text-sm font-medium rounded-xl text-foreground bg-card hover:bg-muted whitespace-nowrap shrink-0 transition active:scale-97 disabled:opacity-50"
          >
            <span>{t("orderDetails.cancel")}</span>
          </button>
        </div>
      )}
    </div>
  );
};

import React from "react";
import { CheckCircleIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { CreatedOrderDetails } from "./types";

interface QuickOrderSuccessViewProps {
  createdOrder: CreatedOrderDetails;
  customerName: string;
  phone: string;
  grandTotal: number;
  isScheduledOrder: boolean;
  scheduledDeliveryDate: string;
  scheduledDeliveryTime: string;
  isManualDashboard?: boolean;
  onClose: () => void;
  onReset: () => void;
}

export const QuickOrderSuccessView: React.FC<QuickOrderSuccessViewProps> = ({
  createdOrder,
  customerName,
  phone,
  grandTotal,
  isScheduledOrder,
  scheduledDeliveryDate,
  scheduledDeliveryTime,
  isManualDashboard = false,
  onClose,
  onReset,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center bg-muted/15">
      <div className="max-w-md w-full text-center space-y-5 p-6 sm:p-8 shadow-sm rounded-xl border border-border/70 bg-card">
        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center border border-success/30 bg-success/10 text-success">
          <CheckCircleIcon className="w-9 h-9 text-success" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-foreground">
            تم إنشاء الطلب بنجاح
          </h3>
          <p className="text-sm text-muted-foreground">
            رقم الطلب:{" "}
            <span className="font-mono font-bold text-foreground">
              #{createdOrder.orderNumber || createdOrder.id}
            </span>
          </p>
        </div>

        <div className="p-4 rounded-xl text-xs sm:text-sm text-start space-y-2 border border-border/70 bg-muted/30">
          <div className="flex justify-between">
            <span className="text-muted-foreground">العميل:</span>
            <span className="font-medium text-foreground">
              {customerName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">الهاتف:</span>
            <span className="font-mono font-medium text-foreground" dir="ltr">
              {phone}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">إجمالي الطلب:</span>
            <span className="font-bold text-success font-mono tabular-nums">
              {grandTotal.toLocaleString()} ج.م
            </span>
          </div>
          {isScheduledOrder && scheduledDeliveryDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">موعد التوصيل:</span>
              <span className="font-medium text-foreground">
                {scheduledDeliveryDate}{" "}
                {scheduledDeliveryTime ? `(${scheduledDeliveryTime})` : ""}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              window.open(
                `/orders/${encodeURIComponent(createdOrder.id)}?print=true`,
                "_blank",
              );
            }}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all flex items-center justify-center gap-2 font-bold text-sm cursor-pointer shadow-xs"
          >
            <PrinterIcon className="w-4 h-4" />
            طباعة الفاتورة / البوليصة
          </button>

          <button
            type="button"
            onClick={() => {
              window.open(
                `/orders/${encodeURIComponent(createdOrder.id)}`,
                "_blank",
              );
            }}
            className="w-full h-9 rounded-lg border border-border/70 bg-background text-foreground hover:bg-muted/60 active:scale-[0.97] transition-all flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
          >
            عرض تفاصيل الطلب
          </button>

          <button
            type="button"
            onClick={() => {
              onReset();
              onClose();
            }}
            className="text-xs pt-1.5 text-muted-foreground hover:text-foreground underline transition-colors cursor-pointer"
          >
            {isManualDashboard ? "إغلاق والعودة للطلبات" : "إنهاء والعودة للمحادثة"}
          </button>
        </div>
      </div>
    </div>
  );
};

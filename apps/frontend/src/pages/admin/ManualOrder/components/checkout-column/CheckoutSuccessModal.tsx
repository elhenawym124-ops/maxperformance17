import React from "react";
import { CheckCircleIcon, PrinterIcon } from "@heroicons/react/24/outline";

interface CheckoutSuccessModalProps {
  show: boolean;
  onClose: () => void;
  createdOrderId: string | null;
  isAffiliate: boolean;
  onViewOrder: () => void;
  onPrintInvoice: () => void;
  onCreateAnother: () => void;
  t: (key: string) => string;
}

export const CheckoutSuccessModal: React.FC<CheckoutSuccessModalProps> = ({
  show,
  onViewOrder,
  onPrintInvoice,
  onCreateAnother,
  t,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 dark:bg-muted backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-success dark:bg-success/20 rounded-full">
            <CheckCircleIcon className="w-10 h-10 text-success dark:text-success" />
          </div>
          <h3 className="text-xl font-bold text-center text-foreground mb-2">
            {t("manualOrder.k_61")}
          </h3>
          <p className="text-center text-foreground dark:text-muted-foreground mb-6">
            {t("manualOrder.k_131")}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onViewOrder}
              className="w-full py-3 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              {t("manualOrder.k_132")}
            </button>
            <button
              onClick={onPrintInvoice}
              className="w-full py-3 px-4 bg-muted text-foreground rounded-lg font-medium hover:bg-muted dark:hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <PrinterIcon className="w-5 h-5" />
              {t("manualOrder.k_133")}
            </button>
            <button
              onClick={onCreateAnother}
              className="w-full py-3 px-4 border border-border rounded-lg text-foreground font-medium hover:bg-muted/50 transition-colors"
            >
              {t("manualOrder.k_134")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

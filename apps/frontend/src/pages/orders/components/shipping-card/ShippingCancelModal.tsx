import React from "react";

interface ShippingCancelModalProps {
  showCancelModal: boolean;
  onClose: () => void;
  cancelReason: string;
  setCancelReason: (reason: string) => void;
  cancelling: boolean;
  onConfirmCancel: () => void;
}

export const ShippingCancelModal: React.FC<ShippingCancelModalProps> = ({
  showCancelModal,
  onClose,
  cancelReason,
  setCancelReason,
  cancelling,
  onConfirmCancel,
}) => {
  if (!showCancelModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:dark:bg-muted rounded-xl p-5 max-w-md w-full space-y-4 shadow-xl border border-border dark:dark:border-border">
        <h4 className="text-base font-bold text-foreground dark:text-white">
          تأكيد إلغاء الشحنة
        </h4>
        <p className="text-xs sm:text-sm text-muted-foreground dark:dark:text-muted-foreground">
          سيتم إرسال طلب إلغاء لشركة الشحن وتغيير حالة الشحنة إلى ملغية.
        </p>
        <input
          type="text"
          placeholder="سبب الإلغاء (اختياري)"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          className="w-full px-3 py-2 text-xs sm:text-sm border border-border dark:dark:border-border rounded-lg bg-white dark:dark:bg-muted text-foreground dark:text-white focus:ring-2 focus:ring-destructive"
        />
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-foreground dark:dark:text-muted-foreground border border-border dark:dark:border-border rounded-lg hover:hover:bg-muted dark:hover:dark:hover:bg-muted transition active:scale-97"
          >
            رجوع
          </button>
          <button
            type="button"
            onClick={onConfirmCancel}
            disabled={cancelling}
            className="px-4 py-2 text-xs font-medium text-white bg-destructive rounded-lg hover:bg-destructive disabled:opacity-50 transition active:scale-97"
          >
            {cancelling ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShippingCancelModal;

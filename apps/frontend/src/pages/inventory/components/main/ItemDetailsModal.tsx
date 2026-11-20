import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useDateFormat } from "../../../../hooks/useDateFormat";
import { useCurrency } from "../../../../hooks/useCurrency";
import type { InventoryItem } from "./types";

interface ItemDetailsModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const { formatDate } = useDateFormat();
  const { formatPrice } = useCurrency();

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-2xl p-5 sm:p-6 w-full max-w-lg border border-border dark:border-border animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-4 border-b border-border dark:border-border pb-3">
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            تفاصيل المخزون - {item.productName}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-foreground dark:hover:text-muted-foreground p-1 cursor-pointer"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">
              معلومات المنتج
            </h4>
            <div className="bg-gray-50 dark:bg-muted p-3.5 rounded-xl space-y-1.5 text-sm">
              <p className="text-foreground">
                <strong className="text-foreground">اسم المنتج:</strong> {item.productName}
              </p>
              <p className="text-foreground">
                <strong className="text-foreground">SKU:</strong>{" "}
                <span dir="ltr" className="font-mono tabular-nums">
                  {item.sku || "—"}
                </span>
              </p>
              <p className="text-foreground">
                <strong className="text-foreground">السعر:</strong>{" "}
                <span className="tabular-nums font-mono">{formatPrice(item.price)}</span>
              </p>
              {item.cost !== undefined && item.cost !== null && item.cost > 0 ? (
                <p className="text-foreground">
                  <strong className="text-foreground">التكلفة:</strong>{" "}
                  <span className="tabular-nums font-mono">{formatPrice(item.cost)}</span>
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">
              حالة المخزون
            </h4>
            <div className="bg-gray-50 dark:bg-muted p-3.5 rounded-xl">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1.5 text-foreground">
                  <p>
                    <strong className="text-foreground">المستودع:</strong> {item.warehouseName}
                  </p>
                  <p>
                    <strong className="text-foreground">رقم الدفعة:</strong>{" "}
                    <span className="tabular-nums font-mono">{item.batchNumber || "بدون"}</span>
                  </p>
                  <p>
                    <strong className="text-foreground">تاريخ الصلاحية:</strong>{" "}
                    {item.expiryDate ? formatDate(item.expiryDate) : "---"}
                  </p>
                </div>
                <div className="space-y-1.5 text-foreground">
                  <p>
                    <strong className="text-foreground">الكمية الإجمالية:</strong>{" "}
                    <span className="tabular-nums font-mono font-bold">{item.quantity}</span>
                  </p>
                  <p>
                    <strong className="text-foreground">المتاح للبيع:</strong>{" "}
                    <span className="tabular-nums font-mono text-success font-bold">{item.available}</span>
                  </p>
                  <p>
                    <strong className="text-foreground">المحجوز:</strong>{" "}
                    <span className="tabular-nums font-mono text-warning font-bold">{item.reserved}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted dark:hover:bg-muted text-sm font-medium transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

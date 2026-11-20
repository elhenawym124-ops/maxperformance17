import React from "react";
import { History, X } from "lucide-react";
import { CustomerLoyaltyRecord, formatPoints, toNumber } from "./types";

interface CustomerPointsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRecord: CustomerLoyaltyRecord | null;
}

export const CustomerPointsHistoryModal: React.FC<CustomerPointsHistoryModalProps> = ({
  isOpen,
  onClose,
  selectedRecord,
}) => {
  if (!isOpen || !selectedRecord) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-right"
      dir="rtl"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-muted">
        <div className="flex justify-between items-center border-b border-border dark:border-border pb-3 mb-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            سجل حركات: {selectedRecord.customer.firstName}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-foreground dark:hover:text-muted-foreground cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          <div className="bg-gray-50 dark:bg-muted rounded-lg p-4 border border-border dark:border-border shadow-inner">
            <p className="text-sm font-medium text-foreground dark:text-muted-foreground mb-3">
              ملخص الحركات والأرصدة:
            </p>
            <ul className="text-sm text-foreground dark:text-muted-foreground space-y-3 font-mono tabular-nums">
              <li className="flex justify-between border-b pb-2 dark:border-border">
                <span>إجمالي المكتسب تاريخياً:</span>
                <span className="text-emerald-600 font-bold">
                  {formatPoints(toNumber(selectedRecord.totalEarned))} نقطة
                </span>
              </li>
              <li className="flex justify-between border-b pb-2 dark:border-border">
                <span>إجمالي المستبدل تاريخياً:</span>
                <span className="text-red-500 font-bold">
                  {formatPoints(toNumber(selectedRecord.totalRedeemed))} نقطة
                </span>
              </li>
              <li className="flex justify-between pt-1">
                <span>آخر عملية مسجلة:</span>
                <span className="text-foreground font-medium text-xs">
                  {new Date(selectedRecord.lastActivity).toLocaleString("ar-EG")}
                </span>
              </li>
            </ul>
          </div>

          {selectedRecord.metadata && selectedRecord.metadata.lastReason && (
            <div className="bg-amber-50 dark:bg-warning/10 p-4 rounded-lg border border-warning dark:border-warning/30">
              <p className="text-xs text-warning dark:text-warning font-medium mb-1">
                سبب التعديل اليدوي الأخير:
              </p>
              <p className="text-sm text-warning dark:text-warning">
                {selectedRecord.metadata.lastReason}
              </p>
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground bg-muted dark:bg-muted p-2 rounded">
            ملاحظة: سجل الحركات المفصل سيُتاح في التحديث القادم للنظام المعماري.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg border border-border py-2.5 text-sm font-medium bg-white text-foreground hover:bg-muted shadow-sm transition dark:border-border dark:text-muted-foreground dark:bg-muted dark:hover:bg-muted cursor-pointer"
        >
          إغلاق السجل
        </button>
      </div>
    </div>
  );
};

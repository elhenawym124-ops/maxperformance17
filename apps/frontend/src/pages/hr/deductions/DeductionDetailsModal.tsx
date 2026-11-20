import React from "react";
import { X } from "lucide-react";
import {
  Deduction,
  DEDUCTION_TYPES,
  DEDUCTION_STATUS,
} from "./types";
import { formatCurrency, formatDateWithDay } from "./helpers";

interface DeductionDetailsModalProps {
  open: boolean;
  selectedDeduction: Deduction | null;
  onClose: () => void;
}

export const DeductionDetailsModal: React.FC<DeductionDetailsModalProps> = ({
  open,
  selectedDeduction,
  onClose,
}) => {
  if (!open || !selectedDeduction) return null;

  const statusInfo =
    DEDUCTION_STATUS[
      selectedDeduction.status as keyof typeof DEDUCTION_STATUS
    ] || DEDUCTION_STATUS.PENDING;

  return (
    <div className="fixed inset-0 bg-muted bg-opacity-50 dark:bg-muted dark:bg-opacity-75 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border border-border dark:border-border w-full max-w-2xl shadow-lg rounded-md bg-card max-h-[80vh] overflow-y-auto">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-foreground">
              تفاصيل الخصم
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-foreground dark:hover:text-muted-foreground"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-foreground dark:text-muted-foreground">
                  الموظف
                </p>
                <p className="text-base font-medium text-foreground">
                  {selectedDeduction.employee?.firstName}{" "}
                  {selectedDeduction.employee?.lastName}
                </p>
              </div>

              <div>
                <p className="text-sm text-foreground dark:text-muted-foreground">
                  رقم الموظف
                </p>
                <p className="text-base font-medium text-foreground font-mono tabular-nums">
                  {selectedDeduction.employee?.employeeNumber || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-foreground dark:text-muted-foreground">
                  النوع
                </p>
                <p className="text-base font-medium text-foreground">
                  {DEDUCTION_TYPES[
                    selectedDeduction.type as keyof typeof DEDUCTION_TYPES
                  ] || selectedDeduction.type}
                </p>
              </div>

              <div>
                <p className="text-sm text-foreground dark:text-muted-foreground">
                  المبلغ
                </p>
                <p className="text-base font-medium text-foreground font-mono tabular-nums">
                  {formatCurrency(selectedDeduction.amount)}
                </p>
              </div>

              {selectedDeduction.category && (
                <div className="col-span-2">
                  <p className="text-sm text-foreground dark:text-muted-foreground">
                    التصنيف
                  </p>
                  <p className="text-base font-medium text-foreground">
                    {selectedDeduction.category}
                  </p>
                </div>
              )}

              <div className="col-span-2">
                <p className="text-sm text-foreground dark:text-muted-foreground">
                  السبب
                </p>
                <p className="text-base font-medium text-foreground">
                  {selectedDeduction.reason}
                </p>
              </div>

              {selectedDeduction.description && (
                <div className="col-span-2">
                  <p className="text-sm text-foreground dark:text-muted-foreground">
                    الوصف
                  </p>
                  <p className="text-base text-foreground">
                    {selectedDeduction.description}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-foreground dark:text-muted-foreground">
                  التاريخ الفعلي
                </p>
                <p className="text-base font-medium text-foreground font-mono tabular-nums">
                  {formatDateWithDay(selectedDeduction.date)}
                </p>
              </div>

              <div>
                <p className="text-sm text-foreground dark:text-muted-foreground">
                  الحالة
                </p>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                >
                  {statusInfo.label}
                </span>
              </div>

              {selectedDeduction.rejectionReason && (
                <div className="col-span-2">
                  <p className="text-sm text-foreground dark:text-muted-foreground">
                    سبب الرفض
                  </p>
                  <p className="text-base text-destructive dark:text-destructive">
                    {selectedDeduction.rejectionReason}
                  </p>
                </div>
              )}

              {selectedDeduction.notes && (
                <div className="col-span-2">
                  <p className="text-sm text-foreground dark:text-muted-foreground">
                    ملاحظات
                  </p>
                  <p className="text-base text-foreground">
                    {selectedDeduction.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { NoSymbolIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import {
  CustomerBlockAction,
  CustomerBlockReasonCode,
} from "@/services/customerBlocklistService";
import { CustomerBlockFormState } from "./types";
import { DateInput } from '../../../../components/ui/DateInput';

interface CustomerBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: CustomerBlockFormState;
  onFormChange: React.Dispatch<React.SetStateAction<CustomerBlockFormState>>;
  onSubmit: () => void;
  isBlocking: boolean;
}

export const CustomerBlockModal: React.FC<CustomerBlockModalProps> = ({
  isOpen,
  onClose,
  form,
  onFormChange,
  onSubmit,
  isBlocking,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-muted rounded-xl p-6 max-w-md w-full shadow-2xl border border-border dark:border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-destructive dark:bg-destructive/40 rounded-xl text-destructive dark:text-destructive">
            <NoSymbolIcon className="h-5 w-5" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground dark:text-white">
            حظر العميل
          </h3>
        </div>

        <div className="space-y-3.5">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-foreground dark:text-muted-foreground">
              الإجراء
            </span>
            <select
              value={form.action}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  action: e.target.value as CustomerBlockAction,
                }))
              }
              className="w-full rounded-lg border border-border dark:border-border px-3 py-2 text-xs sm:text-sm bg-white dark:bg-muted text-foreground dark:text-muted-foreground focus:ring-1 focus:ring-border"
            >
              <option value="BLOCK_ORDERS">منع الطلبات</option>
              <option value="REQUIRE_MANAGER_APPROVAL">
                موافقة مدير قبل الطلب
              </option>
              <option value="BLOCK_COD_ONLY">منع الدفع عند الاستلام فقط</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-foreground dark:text-muted-foreground">
              السبب
            </span>
            <select
              value={form.reasonCode}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  reasonCode: e.target.value as CustomerBlockReasonCode,
                }))
              }
              className="w-full rounded-lg border border-border dark:border-border px-3 py-2 text-xs sm:text-sm bg-white dark:bg-muted text-foreground dark:text-muted-foreground focus:ring-1 focus:ring-border"
            >
              <option value="FAKE_ORDERS">طلبات وهمية</option>
              <option value="REPEATED_REFUSAL">رفض استلام متكرر</option>
              <option value="ABUSE">إساءة للدعم</option>
              <option value="FRAUD">احتيال</option>
              <option value="WRONG_DATA">بيانات غير صحيحة</option>
              <option value="OTHER">سبب آخر</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-foreground dark:text-muted-foreground">
              مدة الحظر
            </span>
            <DateInput
              value={form.expiresAt}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  expiresAt: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-border dark:border-border px-3 py-2 text-xs sm:text-sm bg-white dark:bg-muted text-foreground dark:text-muted-foreground focus:ring-1 focus:ring-border"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-foreground dark:text-muted-foreground">
              ملاحظة السبب
            </span>
            <textarea
              value={form.reasonNote}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  reasonNote: e.target.value,
                }))
              }
              rows={2}
              className="w-full rounded-lg border border-border dark:border-border px-3 py-2 text-xs sm:text-sm bg-white dark:bg-muted text-foreground dark:text-muted-foreground focus:ring-1 focus:ring-border"
            />
          </label>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isBlocking}
            className="px-4 py-2 border border-border dark:border-border rounded-lg text-xs sm:text-sm font-medium text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isBlocking}
            className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-destructive disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {isBlocking ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <NoSymbolIcon className="h-4 w-4" />
            )}
            <span>{isBlocking ? "جاري الحظر..." : "تأكيد الحظر"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

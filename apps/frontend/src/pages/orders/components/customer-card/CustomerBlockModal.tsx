import React from "react";
import {
  NoSymbolIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  CustomerBlockAction,
  CustomerBlockReasonCode,
} from "../../../../services/customerBlocklistService";
import {
  blockActionOptions,
  blockReasonOptions,
} from "./customerCardTypes";
import { DateInput } from '../../../../components/ui/DateInput';

interface CustomerBlockModalProps {
  show: boolean;
  onClose: () => void;
  savingBlock: boolean;
  blockForm: {
    reasonCode: CustomerBlockReasonCode;
    reasonNote: string;
    action: CustomerBlockAction;
    expiresAt: string;
  };
  setBlockForm: React.Dispatch<
    React.SetStateAction<{
      reasonCode: CustomerBlockReasonCode;
      reasonNote: string;
      action: CustomerBlockAction;
      expiresAt: string;
    }>
  >;
  onConfirm: () => void;
}

export const CustomerBlockModal: React.FC<CustomerBlockModalProps> = ({
  show,
  onClose,
  savingBlock,
  blockForm,
  setBlockForm,
  onConfirm,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:dark:bg-muted">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-destructive p-2 dark:bg-destructive/30">
            <NoSymbolIcon className="h-6 w-6 text-destructive dark:text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              حظر العميل من الطلب
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              سيتم تطبيق الحظر على بيانات العميل المرتبطة بهذا الطلب.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-foreground">
              الأكشن
            </span>
            <select
              value={blockForm.action}
              onChange={(event) =>
                setBlockForm((current) => ({
                  ...current,
                  action: event.target.value as CustomerBlockAction,
                }))
              }
              className="w-full rounded-lg border border-border px-3 py-2 text-sm dark:dark:border-border dark:dark:bg-muted dark:dark:text-muted-foreground"
            >
              {blockActionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-foreground">
              السبب
            </span>
            <select
              value={blockForm.reasonCode}
              onChange={(event) =>
                setBlockForm((current) => ({
                  ...current,
                  reasonCode: event.target.value as CustomerBlockReasonCode,
                }))
              }
              className="w-full rounded-lg border border-border px-3 py-2 text-sm dark:dark:border-border dark:dark:bg-muted dark:dark:text-muted-foreground"
            >
              {blockReasonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-foreground">
              ينتهي في
            </span>
            <DateInput
              value={blockForm.expiresAt}
              onChange={(event) =>
                setBlockForm((current) => ({
                  ...current,
                  expiresAt: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-border px-3 py-2 text-sm dark:dark:border-border dark:dark:bg-muted dark:dark:text-muted-foreground"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-foreground">
              ملاحظة السبب
            </span>
            <textarea
              value={blockForm.reasonNote}
              onChange={(event) =>
                setBlockForm((current) => ({
                  ...current,
                  reasonNote: event.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm dark:dark:border-border dark:dark:bg-muted dark:dark:text-muted-foreground"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={savingBlock}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:hover:bg-muted disabled:opacity-60 dark:dark:border-border dark:dark:text-muted-foreground dark:hover:dark:hover:bg-muted"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={savingBlock}
            className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white transition hover:bg-destructive disabled:opacity-60"
          >
            {savingBlock ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <NoSymbolIcon className="h-4 w-4" />
            )}
            تأكيد الحظر
          </button>
        </div>
      </div>
    </div>
  );
};

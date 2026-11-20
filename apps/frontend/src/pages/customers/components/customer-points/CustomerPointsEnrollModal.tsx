import React from "react";
import { UserPlus, X } from "lucide-react";
import { CustomerLoyaltyProgram } from "./types";

interface CustomerPointsEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrollData: { customerId: string; programId: string; initialPoints: string };
  onEnrollDataChange: (data: { customerId: string; programId: string; initialPoints: string }) => void;
  allSystemCustomers: any[];
  programs: CustomerLoyaltyProgram[];
  errorMessage: string;
  isSubmitting: boolean;
  onEnrollCustomer: () => void;
}

export const CustomerPointsEnrollModal: React.FC<CustomerPointsEnrollModalProps> = ({
  isOpen,
  onClose,
  enrollData,
  onEnrollDataChange,
  allSystemCustomers,
  programs,
  errorMessage,
  isSubmitting,
  onEnrollCustomer,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-right"
      dir="rtl"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-muted">
        <div className="flex justify-between items-center mb-5 border-b border-border dark:border-border pb-3">
          <h3 className="text-xl font-bold text-foreground">إضافة عميل لبرنامج ولاء</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-foreground dark:hover:text-muted-foreground cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              العميل
            </label>
            <select
              value={enrollData.customerId}
              onChange={(e) => onEnrollDataChange({ ...enrollData, customerId: e.target.value })}
              className="w-full rounded-lg border border-border p-2.5 text-sm dark:bg-muted dark:border-border text-foreground cursor-pointer"
            >
              <option value="">-- اختر عميل من النظام --</option>
              {allSystemCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              برنامج الولاء المستهدف
            </label>
            <select
              value={enrollData.programId}
              onChange={(e) => onEnrollDataChange({ ...enrollData, programId: e.target.value })}
              className="w-full rounded-lg border border-border p-2.5 text-sm dark:bg-muted dark:border-border text-foreground cursor-pointer"
            >
              <option value="">-- اختر برنامج --</option>
              {programs
                .filter((p) => p.status === "ACTIVE" || !p.status)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameAr || p.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              نقاط ترحيبية مبدئية
            </label>
            <input
              type="number"
              value={enrollData.initialPoints}
              onChange={(e) => onEnrollDataChange({ ...enrollData, initialPoints: e.target.value })}
              className="w-full rounded-lg border border-border p-2.5 text-sm dark:bg-muted dark:border-border text-foreground text-right font-mono tabular-nums"
            />
            <p className="text-xs text-muted-foreground mt-1">يُضاف الرصيد فور التسجيل في البرنامج.</p>
          </div>

          {errorMessage && (
            <p className="bg-red-50 text-destructive p-3 rounded-md text-sm border border-destructive dark:bg-destructive/20 dark:border-destructive/50">
              {errorMessage}
            </p>
          )}

          <div className="flex gap-3 pt-4 border-t border-border dark:border-border mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted dark:border-border dark:text-muted-foreground dark:hover:bg-muted cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={onEnrollCustomer}
              disabled={isSubmitting || !enrollData.customerId || !enrollData.programId}
              className="flex-1 rounded-lg bg-success py-2.5 text-sm font-medium text-white hover:bg-success disabled:opacity-50 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              {isSubmitting ? "جاري التسجيل..." : "تسجيل وتفعيل"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

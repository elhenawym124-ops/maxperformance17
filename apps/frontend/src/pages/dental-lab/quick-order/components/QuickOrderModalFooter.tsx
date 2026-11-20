import React from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import type { DentalLabDoctor } from "../../shared";
import type { Step } from "../types/quickOrderTypes";

export interface QuickOrderModalFooterProps {
  step: Step;
  setStep: React.Dispatch<React.SetStateAction<Step>>;
  selectedDoctor: DentalLabDoctor | null;
  selectedServiceIds: string[];
  patientName: string;
  submitting: boolean;
  submittingAndPrint: boolean;
  onCancel: () => void;
  submitOrder: (printPanTicket?: boolean) => void;
}

export const QuickOrderModalFooter: React.FC<QuickOrderModalFooterProps> = ({
  step,
  setStep,
  selectedDoctor,
  selectedServiceIds,
  patientName,
  submitting,
  submittingAndPrint,
  onCancel,
  submitOrder,
}) => {
  const isBusy = submitting || submittingAndPrint;
  const isPatientNameValid = Boolean(patientName.trim());

  return (
    <div className="p-4 border-t dark:border-border flex items-center justify-between bg-muted dark:bg-muted shrink-0">
      <div>
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as Step)}
            disabled={submitting}
            className="px-4 py-2 border dark:border-border rounded-lg text-sm text-foreground hover:bg-muted flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <ArrowRight className="w-4 h-4" />
            <span>السابق</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 border dark:border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          إلغاء
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={() => {
              if (step === 1 && !selectedDoctor) {
                toast.error("يرجى اختيار الطبيب للمتابعة");
                return;
              }
              if (step === 2 && selectedServiceIds.length === 0) {
                toast.error("يرجى اختيار نوع الشغل للمتابعة");
                return;
              }
              setStep((s) => (s + 1) as Step);
            }}
            className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <span>التالي</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => submitOrder(true)}
              disabled={isBusy || !isPatientNameValid}
              className="px-4 py-2 border border-success dark:border-success bg-success/10 dark:bg-success/40 text-success dark:text-success rounded-lg text-sm font-bold hover:bg-success dark:hover:bg-success/60 disabled:opacity-50 flex items-center gap-1.5 shadow-sm transition-colors"
              title="حفظ أمر الشغل وفتح كارت الباركود فوراً للطباعة"
            >
              {submittingAndPrint ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>حفظ وطباعة الباركود</span>
            </button>
            <button
              type="button"
              onClick={() => submitOrder(false)}
              disabled={isBusy || !isPatientNameValid}
              className="px-5 py-2 bg-success text-white rounded-lg text-sm font-bold hover:bg-success disabled:opacity-50 flex items-center gap-1.5 shadow-sm transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>حفظ أمر الشغل</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

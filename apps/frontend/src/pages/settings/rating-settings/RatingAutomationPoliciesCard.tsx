import React from "react";
import { AlertTriangle } from "lucide-react";
import { RatingSettings } from "./types";

interface RatingAutomationPoliciesCardProps {
  autoApproveExcellent: boolean;
  autoRejectBad: boolean;
  onChange: (key: keyof RatingSettings, value: boolean) => void;
}

export const RatingAutomationPoliciesCard: React.FC<RatingAutomationPoliciesCardProps> = ({
  autoApproveExcellent,
  autoRejectBad,
  onChange,
}) => {
  return (
    <div className="bg-white dark:bg-muted rounded-xl shadow-xs border border-border dark:border-border">
      <div className="p-6 border-b border-border dark:border-border">
        <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          الأتمتة (Automations)
        </h2>
        <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
          إجراءات تلقائية بناءً على تقييم العملاء.
        </p>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-foreground dark:text-white">
              الموافقة التلقائية لـ "الممتازين"
            </h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              قبول طلبات الإرجاع تلقائياً إذا كان العميل ممتاز.
            </p>
          </div>
          <div className="relative inline-block w-12 me-2 align-middle select-none transition duration-200 ease-in">
            <input
              type="checkbox"
              checked={autoApproveExcellent}
              onChange={(e) => onChange("autoApproveExcellent", e.target.checked)}
              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              aria-label="الموافقة التلقائية للممتازين"
            />
            <label
              className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                autoApproveExcellent ? "bg-blue-600" : "bg-slate-300 dark:bg-muted"
              }`}
            ></label>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-foreground dark:text-white">
              الرفض التلقائي/مراجعة يدوية لـ "الضعفاء"
            </h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              تحويل طلبات العملاء ذوي التقييم الضعيف للمراجعة اليدوية دائماً (Risk Protection).
            </p>
          </div>
          <div className="relative inline-block w-12 me-2 align-middle select-none transition duration-200 ease-in">
            <input
              type="checkbox"
              checked={autoRejectBad}
              onChange={(e) => onChange("autoRejectBad", e.target.checked)}
              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              aria-label="الرفض التلقائي أو مراجعة يدوية للضعفاء"
            />
            <label
              className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                autoRejectBad ? "bg-blue-600" : "bg-slate-300 dark:bg-muted"
              }`}
            ></label>
          </div>
        </div>
      </div>
    </div>
  );
};

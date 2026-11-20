import type { Dispatch, SetStateAction } from "react";
import { DAYS_OF_WEEK } from "../../../../shared";
import type { TechnicianForm } from "../../types/technicianTypes";

interface TechnicianWorkingDaysSectionProps {
  modal: TechnicianForm;
  setModal: Dispatch<SetStateAction<TechnicianForm | null>>;
}

export function TechnicianWorkingDaysSection({ modal, setModal }: TechnicianWorkingDaysSectionProps) {
  const labelCls = "block text-sm font-medium text-foreground mb-1";

  return (
    <div className="sm:col-span-2">
      <label className={labelCls}>أيام العمل الأسبوعية (Working Schedule)</label>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {DAYS_OF_WEEK.map(({ day, label }) => {
          const isSelected = modal.workingDays.includes(day);
          return (
            <button
              type="button"
              key={day}
              onClick={() => {
                const next = isSelected
                  ? modal.workingDays.filter((d) => d !== day)
                  : [...modal.workingDays, day].sort();
                setModal({ ...modal, workingDays: next });
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-gray-50 text-foreground dark:bg-muted dark:text-muted-foreground border-border dark:border-border hover:border-border"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">
        إذا لم يتم اختيار أي يوم، يُعتبر الفني متاحاً طوال أيام الأسبوع حسب سياسة المعمل.
      </p>
    </div>
  );
}

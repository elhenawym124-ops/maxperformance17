import type { Dispatch, SetStateAction } from "react";
import { Palmtree, Plus, Trash2 } from "lucide-react";
import { MODAL_INPUT_CLS } from "../../../../shared";
import type { TechnicianForm } from "../../types/technicianTypes";
import { DateInput } from '../../../../../../components/ui/DateInput';

interface TechnicianVacationsSectionProps {
  modal: TechnicianForm;
  setModal: Dispatch<SetStateAction<TechnicianForm | null>>;
}

export function TechnicianVacationsSection({ modal, setModal }: TechnicianVacationsSectionProps) {
  const inputCls = `${MODAL_INPUT_CLS} text-sm`;

  return (
    <div className="sm:col-span-2 border-t dark:border-border pt-4 mt-2">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Palmtree className="w-4 h-4 text-warning dark:text-warning" />
          <h4 className="text-xs font-bold text-foreground">
            الإجازات الاستثنائية والتفرغ (Exceptional Vacations)
          </h4>
        </div>
        <button
          type="button"
          onClick={() => {
            const today = new Date().toISOString().split("T")[0];
            setModal({
              ...modal,
              vacations: [
                ...modal.vacations,
                { startDate: today, endDate: today, reason: "" },
              ],
            });
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-warning dark:text-warning bg-warning/10 dark:bg-warning/40 hover:bg-warning dark:hover:bg-warning/50 border border-warning dark:border-warning rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة فترة إجازة</span>
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">
        يتم استبعاد الفني آلياً من التوزيع الذكي والمحرك خلال فترات الإجازة المحددة لحماية سلاسة العمل.
      </p>

      {modal.vacations.length === 0 ? (
        <div className="p-3 text-center border border-dashed rounded-lg border-border dark:border-border text-xs text-muted-foreground/80">
          لا توجد إجازات استثنائية مسجلة حالياً (الفني متاح للعمل حسب جدوله الأسبوعي).
        </div>
      ) : (
        <div className="space-y-2">
          {modal.vacations.map((vac, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-lg border border-border dark:border-border bg-muted dark:bg-muted"
            >
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-0.5">من تاريخ *</span>
                  <DateInput
                    className={`${inputCls} py-1 text-xs font-mono`}
                    value={vac.startDate}
                    onChange={(e) => {
                      const next = [...modal.vacations];
                      next[idx] = { ...next[idx], startDate: e.target.value };
                      setModal({ ...modal, vacations: next });
                    }}
                    required
                  />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-0.5">إلى تاريخ *</span>
                  <DateInput
                    className={`${inputCls} py-1 text-xs font-mono`}
                    value={vac.endDate}
                    onChange={(e) => {
                      const next = [...modal.vacations];
                      next[idx] = { ...next[idx], endDate: e.target.value };
                      setModal({ ...modal, vacations: next });
                    }}
                    required
                  />
                </div>
              </div>
              <div className="flex-[1.5]">
                <span className="text-[10px] text-muted-foreground block mb-0.5">السبب / ملاحظات</span>
                <input
                  type="text"
                  className={`${inputCls} py-1 text-xs`}
                  placeholder="سبب الإجازة (اختياري، مثلاً: راحة مرضية، سفر، ظرف عائلي)"
                  value={vac.reason || ""}
                  onChange={(e) => {
                    const next = [...modal.vacations];
                    next[idx] = { ...next[idx], reason: e.target.value };
                    setModal({ ...modal, vacations: next });
                  }}
                />
              </div>
              <div className="sm:self-end flex justify-end pb-0.5">
                <button
                  type="button"
                  onClick={() => {
                    const next = modal.vacations.filter((_, i) => i !== idx);
                    setModal({ ...modal, vacations: next });
                  }}
                  className="p-1.5 text-muted-foreground hover:text-destructive dark:hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/40 rounded transition-colors"
                  title="حذف هذه الإجازة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

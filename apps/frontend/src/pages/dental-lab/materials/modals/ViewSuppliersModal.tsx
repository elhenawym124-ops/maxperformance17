import { Building2, MapPin, Phone, Plus, User, X } from "lucide-react";
import { fmtMoney, MODAL_CONTENT_CLS } from "../../shared";
import type { ViewSuppliersModalProps } from "../types/materialsTypes";

export function ViewSuppliersModal({
  isOpen,
  onClose,
  suppliers,
  onOpenAddSupplier,
}: ViewSuppliersModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className={`${MODAL_CONTENT_CLS} max-w-xl!`}>
        <div className="flex items-center justify-between pb-3 border-b border-border dark:border-border mb-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-info dark:text-info" />
              <span>الشركات والموردين المعتمدين ({suppliers.length})</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              قائمة الموردين المعتمدين لتوريد خامات وأقراص ومستهلكات المعمل
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground hover:bg-muted transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pe-1">
          {suppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              <Building2 className="w-10 h-10 mx-auto text-muted-foreground dark:text-foreground mb-2" />
              <p className="font-semibold">لا يوجد موردين مسجلين بعد</p>
              <p className="mt-1">
                يمكنك إضافة أول شركة توريد لتسجيل أقراص وخامات المعمل باسمها.
              </p>
            </div>
          ) : (
            suppliers.map((s) => (
              <div
                key={s.id}
                className="p-3 bg-muted dark:bg-muted border border-border dark:border-border rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-2">
                    <span>{s.name}</span>
                    {s.city && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-info dark:bg-info/60 text-info dark:text-info flex items-center gap-1 font-normal">
                        <MapPin className="w-3 h-3" />
                        {s.city}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-[11px]">
                    {s.contactPerson && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-muted-foreground" />
                        {s.contactPerson}
                      </span>
                    )}
                    {s.phone && (
                      <span className="flex items-center gap-1 dir-ltr font-mono">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        {s.phone}
                      </span>
                    )}
                  </div>
                </div>

                {s.currentBalance !== undefined && Number(s.currentBalance) !== 0 && (
                  <div className="text-left shrink-0">
                    <span className="text-[10px] text-muted-foreground block">الرصيد</span>
                    <span
                      className={`font-bold font-mono tabular-nums ${
                        Number(s.currentBalance) > 0
                          ? "text-red-600 dark:text-destructive"
                          : "text-emerald-600 dark:text-success"
                      }`}
                    >
                      {fmtMoney(Number(s.currentBalance))}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border dark:border-border mt-4">
          <button
            type="button"
            onClick={onOpenAddSupplier}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-info hover:bg-info text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ مورد / شركة جديدة</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-foreground text-xs font-semibold cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViewSuppliersModal;

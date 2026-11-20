import { AlertTriangle, Loader2, Plus, Search, Stethoscope } from "lucide-react";
import { fmtMoney, MODAL_INPUT_CLS } from "../../shared";
import { DoctorCard } from "../components/DoctorCard";
import { NewDoctorInline } from "../components/NewDoctorInline";
import type { QuickOrderStepDoctorProps } from "../types/quickOrderTypes";

export function QuickOrderStepDoctor({
  doctorSearch,
  onDoctorSearchChange,
  filteredDoctors,
  selectedDoctor,
  onSelectDoctor,
  treatingDoctorName,
  onTreatingDoctorNameChange,
  customDoctorInput,
  onCustomDoctorInputChange,
  showNewDoctor,
  onShowNewDoctorChange,
  doctorsLoading,
  bypassCreditCheck,
  onBypassCreditCheckChange,
  onDoctorCreated,
}: QuickOrderStepDoctorProps) {
  const inputCls = `${MODAL_INPUT_CLS} text-sm`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-foreground dark:text-muted-foreground font-medium">
          اختر الطبيب أو العيادة المرسلة لأمر الشغل:
        </p>
        {!showNewDoctor && (
          <button
            type="button"
            onClick={() => onShowNewDoctorChange(true)}
            className="flex items-center gap-1 text-xs font-semibold text-primary dark:text-primary hover:underline transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            طبيب / عيادة جديدة
          </button>
        )}
      </div>

      {showNewDoctor && (
        <NewDoctorInline
          onCreated={onDoctorCreated}
          onCancel={() => onShowNewDoctorChange(false)}
        />
      )}

      <div className="relative">
        <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground" />
        <input
          className={`${inputCls} pe-9`}
          placeholder="بحث باسم الطبيب، العيادة، أو رقم الهاتف..."
          value={doctorSearch}
          onChange={(e) => onDoctorSearchChange(e.target.value)}
          autoFocus
        />
      </div>

      {selectedDoctor && (
        <div className="p-3.5 rounded-xl border-2 border-primary bg-primary/40 dark:bg-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                د
              </div>
              <div>
                <div className="font-bold text-sm text-primary dark:text-primary">
                  {selectedDoctor.name}
                </div>
                <div className="text-xs text-primary dark:text-primary">
                  {selectedDoctor.clinicName || "عيادة خاصة"}
                </div>
              </div>
            </div>
            <div className="text-end">
              <span className="text-[11px] text-muted-foreground">الرصيد المستحق: </span>
              <span className="font-bold text-sm text-warning dark:text-warning font-mono tabular-nums">
                {fmtMoney(selectedDoctor.outstanding)} ج.م
              </span>
            </div>
          </div>

          {selectedDoctor.creditExceeded && (
            <div className="mt-3 p-2.5 rounded-lg bg-destructive dark:bg-destructive/40 border border-destructive dark:border-destructive text-xs text-destructive dark:text-destructive flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <span>
                  تحذير: الطبيب تجاوز حد الائتمان المحدد ({fmtMoney(selectedDoctor.creditLimit)} ج.م)
                </span>
              </div>
              <label className="flex items-center gap-1 text-[11px] font-bold cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={bypassCreditCheck}
                  onChange={(e) => onBypassCreditCheckChange(e.target.checked)}
                  className="rounded text-destructive focus:ring-destructive"
                />
                موافقة على الاستثناء
              </label>
            </div>
          )}

          {/* تحديد الطبيب المعالج داخل العيادة / المركز */}
          <div className="mt-3 pt-3 border-t border-primary dark:border-primary/60">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-foreground dark:text-muted-foreground flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-primary dark:text-primary" />
                <span>الطبيب المعالج داخل العيادة / المركز:</span>
              </label>
              <span className="text-[10px] text-muted-foreground">يظهر في كارتة الحالة وتفاصيل الفاتورة</span>
            </div>

            {Array.isArray(selectedDoctor.doctors) &&
            selectedDoctor.doctors.length > 0 &&
            !customDoctorInput ? (
              <div className="flex items-center gap-2">
                <select
                  className={`${inputCls} text-xs flex-1`}
                  value={treatingDoctorName}
                  onChange={(e) => {
                    if (e.target.value === "__CUSTOM__") {
                      onCustomDoctorInputChange(true);
                      onTreatingDoctorNameChange("");
                    } else {
                      onTreatingDoctorNameChange(e.target.value);
                    }
                  }}
                >
                  <option value="">
                    -- {selectedDoctor.name} (الطبيب الرئيسي / الحساب المالي الموحد) --
                  </option>
                  {selectedDoctor.doctors.map((doc, idx) => (
                    <option key={doc.id || idx} value={doc.name}>
                      {doc.name} {doc.specialty ? `(${doc.specialty})` : ""}
                    </option>
                  ))}
                  <option value="__CUSTOM__">+ كتابة اسم طبيب آخر غير مسجل بالعيادة...</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  className={`${inputCls} text-xs flex-1`}
                  placeholder="اسم الطبيب المعالج (مثال: د. شريف)"
                  value={treatingDoctorName}
                  onChange={(e) => onTreatingDoctorNameChange(e.target.value)}
                />
                {Array.isArray(selectedDoctor.doctors) && selectedDoctor.doctors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onCustomDoctorInputChange(false)}
                    className="px-2 py-1 text-[11px] text-primary dark:text-primary hover:underline shrink-0 font-medium"
                  >
                    اختر من أطباء العيادة
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {doctorsLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">لا يوجد أطباء مطابقين للبحث</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[40vh] overflow-y-auto">
          {filteredDoctors.map((doc) => (
            <DoctorCard
              key={doc.id}
              doctor={doc}
              selected={selectedDoctor?.id === doc.id}
              onSelect={() => onSelectDoctor(doc)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default QuickOrderStepDoctor;

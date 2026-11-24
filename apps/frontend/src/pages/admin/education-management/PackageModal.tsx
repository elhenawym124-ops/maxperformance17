import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Calendar, Plus, Trash2, User, Users } from "lucide-react";
import type { EducationPackage, EducationSubject } from "./types";
import { MODAL_CLS, INPUT_CLS } from "./types";

export interface PackageModalProps {
  pkg?: Partial<EducationPackage> | null;
  subjects: EducationSubject[];
  enableSubjects?: boolean;
  onClose: () => void;
  onSave: (d: Partial<EducationPackage>) => Promise<void>;
}

const WEEK_DAYS = [
  { id: "SATURDAY", labelAr: "السبت", labelEn: "Saturday" },
  { id: "SUNDAY", labelAr: "الأحد", labelEn: "Sunday" },
  { id: "MONDAY", labelAr: "الاثنين", labelEn: "Monday" },
  { id: "TUESDAY", labelAr: "الثلاثاء", labelEn: "Tuesday" },
  { id: "WEDNESDAY", labelAr: "الأربعاء", labelEn: "Wednesday" },
  { id: "THURSDAY", labelAr: "الخميس", labelEn: "Thursday" },
  { id: "FRIDAY", labelAr: "الجمعة", labelEn: "Friday" },
];

export const PackageModal: React.FC<PackageModalProps> = ({
  pkg,
  subjects,
  enableSubjects = false,
  onClose,
  onSave,
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const [form, setForm] = useState({
    name: "",
    description: "",
    subjectId: "",
    hoursCount: 10,
    sessionDuration: 60,
    price: 0,
    levelNumber: null as number | null,
    ageFrom: null as number | null,
    ageTo: null as number | null,
    packageType: "GROUP" as "GROUP" | "PRIVATE",
    scheduleSlots: [] as Array<{ dayOfWeek: string; startTime: string; endTime: string }>,
    ...pkg,
  });

  const handleAddSlot = () => {
    setForm((prev) => ({
      ...prev,
      scheduleSlots: [
        ...(prev.scheduleSlots || []),
        { dayOfWeek: "SATURDAY", startTime: "17:00", endTime: "18:30" },
      ],
    }));
  };

  const handleUpdateSlot = (idx: number, patch: Partial<{ dayOfWeek: string; startTime: string; endTime: string }>) => {
    setForm((prev) => ({
      ...prev,
      scheduleSlots: (prev.scheduleSlots || []).map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }));
  };

  const handleRemoveSlot = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      scheduleSlots: (prev.scheduleSlots || []).filter((_, i) => i !== idx),
    }));
  };

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className={MODAL_CLS + " max-h-[92vh] overflow-y-auto w-full max-w-lg"}
        onClick={(e) => e.stopPropagation()}
        dir={isEn ? "ltr" : "rtl"}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <h3 className="text-sm font-bold text-foreground">
            {pkg?.id
              ? t("education.packages.modalTitleEdit", isEn ? "Edit Session Package" : "تعديل باقة الحصص")
              : t("education.packages.modalTitleNew", isEn ? "Add New Package" : "إضافة باقة جديدة")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 pt-2">
          {/* Package Type (Private vs Group) */}
          <div className="space-y-1.5 p-3 rounded-xl bg-muted/40 border border-border/70">
            <label className="text-xs font-bold text-foreground block">
              {isEn ? "Package System / Type" : "نوع ونظام الباقة (مجموعات أو حصص برايفت فردية)"} *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, packageType: "GROUP" })}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  form.packageType === "GROUP"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{isEn ? "Group Package" : "باقة مجموعات (Group)"}</span>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, packageType: "PRIVATE" })}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  form.packageType === "PRIVATE"
                    ? "bg-purple-600 text-white border-primary shadow-xs"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="w-4 h-4" />
                <span>{isEn ? "Private (1-on-1)" : "حصص فردية خاصة (Private)"}</span>
              </button>
            </div>
            {form.packageType === "PRIVATE" && (
              <p className="text-[11px] text-primary dark:text-primary font-medium pt-0.5">
                {isEn
                  ? "⭐ Private 1-on-1 package: Dedicated instructor, personalized curriculum & flexible scheduling."
                  : "⭐ نظام الحصص البرايفت: طالب واحد مع المدرس، خطة مخصصة بالكامل ومواعيد مرنة."}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              {t("education.packages.name", isEn ? "Package Name" : "اسم الباقة")} *
            </label>
            <input
              className={INPUT_CLS}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={isEn ? "e.g. 10 Sessions Intensive Course" : "مثال: باقة 10 حصص برمجية مكثفة"}
            />
          </div>

          {enableSubjects && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {t("education.packages.subject", isEn ? "Subject" : "المادة")} *
              </label>
              <select
                className={INPUT_CLS}
                value={form.subjectId}
                onChange={(e) => {
                  const subId = e.target.value;
                  const foundSub = subjects.find((s) => s.id === subId);
                  setForm((prev) => ({
                    ...prev,
                    subjectId: subId,
                    price: prev.price === 0 && foundSub?.price ? foundSub.price : prev.price,
                  }));
                }}
              >
                <option value="">{t("education.packages.selectSubject", isEn ? "Select Subject" : "اختر المادة")}</option>
                {subjects
                  .filter((s) => s.isActive)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {t("education.packages.hoursCount", isEn ? "Hours Count" : "عدد الساعات")}
              </label>
              <input
                type="number"
                min={1}
                className={INPUT_CLS}
                value={form.hoursCount}
                onChange={(e) =>
                  setForm({ ...form, hoursCount: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {t("education.packages.sessionDuration", isEn ? "Minutes/Session" : "الدقائق/حصة")}
              </label>
              <input
                type="number"
                min={15}
                step={15}
                className={INPUT_CLS}
                value={form.sessionDuration}
                onChange={(e) =>
                  setForm({ ...form, sessionDuration: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {t("education.packages.priceLabel", isEn ? "Price (EGP)" : "السعر (ج.م)")}
              </label>
              <input
                type="number"
                min={0}
                className={INPUT_CLS}
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
              />
            </div>
          </div>

          {/* Level sequence & age range */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {isEn ? "Level Number" : "رقم الليفل"}
              </label>
              <input
                type="number"
                min={1}
                max={30}
                className={INPUT_CLS}
                value={form.levelNumber ?? ""}
                onChange={(e) =>
                  setForm({ ...form, levelNumber: e.target.value ? Number(e.target.value) : null })
                }
                placeholder={isEn ? "e.g. 3" : "مثال: 3"}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {isEn ? "Age from" : "السن من"}
              </label>
              <input
                type="number"
                min={3}
                max={99}
                className={INPUT_CLS}
                value={form.ageFrom ?? ""}
                onChange={(e) =>
                  setForm({ ...form, ageFrom: e.target.value ? Number(e.target.value) : null })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {isEn ? "Age to" : "السن إلى"}
              </label>
              <input
                type="number"
                min={3}
                max={99}
                className={INPUT_CLS}
                value={form.ageTo ?? ""}
                onChange={(e) =>
                  setForm({ ...form, ageTo: e.target.value ? Number(e.target.value) : null })
                }
              />
            </div>
          </div>

          {/* Timetable / Schedule for the Package */}
          <div className="space-y-2 p-3 rounded-xl border border-border/70 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>{isEn ? "Package Timetable / Schedule" : "نظام جدول مواعيد الباقة"}</span>
              </div>
              <button
                type="button"
                onClick={handleAddSlot}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <Plus className="w-3 h-3" />
                <span>{isEn ? "Add Slot" : "إضافة موعد بالجدول"}</span>
              </button>
            </div>

            {(!form.scheduleSlots || form.scheduleSlots.length === 0) ? (
              <p className="text-[11px] text-muted-foreground italic">
                {isEn
                  ? "No fixed timetable slots defined yet. You can add suggested weekly days/times for this package."
                  : "لم يتم تحديد مواعيد ثابتة بعد. يمكنك إضافة مواعيد أسبوعية مقترحة لجدول هذه الباقة."}
              </p>
            ) : (
              <div className="space-y-1.5">
                {form.scheduleSlots.map((slot, sIdx) => (
                  <div
                    key={sIdx}
                    className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border text-xs"
                  >
                    <select
                      value={slot.dayOfWeek}
                      onChange={(e) => handleUpdateSlot(sIdx, { dayOfWeek: e.target.value })}
                      className="bg-card border border-input rounded-md px-2 py-1 text-xs font-semibold"
                    >
                      {WEEK_DAYS.map((wd) => (
                        <option key={wd.id} value={wd.id}>
                          {isEn ? wd.labelEn : wd.labelAr}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-[10px] text-muted-foreground">{isEn ? "From:" : "من:"}</span>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => handleUpdateSlot(sIdx, { startTime: e.target.value })}
                        className="bg-card border border-input rounded-md px-1.5 py-0.5 text-xs font-mono w-full"
                      />
                    </div>

                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-[10px] text-muted-foreground">{isEn ? "To:" : "إلى:"}</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => handleUpdateSlot(sIdx, { endTime: e.target.value })}
                        className="bg-card border border-input rounded-md px-1.5 py-0.5 text-xs font-mono w-full"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(sIdx)}
                      className="p-1 text-muted-foreground hover:text-destructive rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              {t("education.subjects.description", isEn ? "Description" : "الوصف")}
            </label>
            <textarea
              className={INPUT_CLS}
              rows={2}
              value={form.description || ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder={isEn ? "Package description or syllabus summary..." : "وصف الباقة أو ملخص المنهج..."}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-border/80">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs rounded-lg bg-muted text-foreground hover:bg-muted/80"
          >
            {t("education.actions.cancel", isEn ? "Cancel" : "إلغاء")}
          </button>
          <button
            type="button"
            onClick={() => onSave(form)}
            disabled={!form.name || (enableSubjects && !form.subjectId)}
            className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {t("education.actions.save", isEn ? "Save" : "حفظ")}
          </button>
        </div>
      </div>
    </div>
  );
};

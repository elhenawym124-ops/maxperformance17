import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus, AlertTriangle, Loader2, Percent, Calendar, Check } from "lucide-react";
import type {
  EducationEnrollment,
  EducationStudent,
  EducationPackage,
  EducationTeacher,
  EducationSubject,
  EducationCustomDiscount,
} from "./types";
import { MODAL_CLS, INPUT_CLS } from "./types";
import { DateInput } from "../../../components/ui/DateInput";
import { api, getAuthHeaders, fetchJson } from "./api";
import {
  computeDiscountAndFinal,
  DEFAULT_EDUCATION_DISCOUNTS,
  calculateInstallmentSchedule,
} from "./educationSharedHelpers";

export interface EnrollmentModalProps {
  enrollment?: Partial<EducationEnrollment> | null;
  students: EducationStudent[];
  packages: EducationPackage[];
  teachers: EducationTeacher[];
  groups?: Array<{
    id: string;
    name: string;
    teacherId?: string | null;
    teacherName?: string | null;
    subjectId?: string;
    branchId?: string | null;
    capacity?: number;
    activeMembers?: number;
  }>;
  subjects: EducationSubject[];
  enableSubjects?: boolean;
  customDiscounts?: EducationCustomDiscount[];
  onClose: () => void;
  onSave: (d: Partial<EducationEnrollment>) => Promise<void>;
  onAddNewStudent?: (d: Partial<EducationStudent>) => Promise<EducationStudent | null>;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  enrollment,
  students,
  packages,
  teachers,
  groups = [],
  enableSubjects = false,
  customDiscounts: initialCustomDiscounts,
  onClose,
  onSave,
  onAddNewStudent,
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const [activeDiscounts, setActiveDiscounts] = useState<EducationCustomDiscount[]>(
    initialCustomDiscounts || []
  );

  useEffect(() => {
    if (initialCustomDiscounts && initialCustomDiscounts.length > 0) {
      setActiveDiscounts(initialCustomDiscounts);
    } else {
      // Fetch dynamic discounts from education settings if not passed
      fetchJson(api("settings/discounts"))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setActiveDiscounts(data);
          } else {
            setActiveDiscounts(DEFAULT_EDUCATION_DISCOUNTS);
          }
        })
        .catch(() => {
          setActiveDiscounts(DEFAULT_EDUCATION_DISCOUNTS);
        });
    }
  }, [initialCustomDiscounts]);

  const [groupId, setGroupId] = useState<string>(
    String((enrollment as any)?.groupId || "")
  );

  const [form, setForm] = useState({
    studentId: "",
    packageId: "",
    teacherId: "",
    amountPaid: 0,
    expiresAt: "",
    ...enrollment,
    paymentStatus:
      enrollment?.paymentStatus === "PAID"
        ? "COMPLETED"
        : enrollment?.paymentStatus || "PENDING",
  });

  const [discountType, setDiscountType] = useState<string>(
    enrollment?.discountType || "NONE"
  );
  const [promoCodeInput, setPromoCodeInput] = useState<string>("");
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [discountValue, setDiscountValue] = useState<number | "">(
    enrollment?.discountAmount ? Number(enrollment.discountAmount) : ""
  );
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "INSTALLMENTS">(
    enrollment?.paymentMethod || "CASH"
  );
  const [installmentCount, setInstallmentCount] = useState<number>(
    enrollment?.installmentCount && enrollment.installmentCount > 1 ? enrollment.installmentCount : 3
  );
  const [installments, setInstallments] = useState<
    Array<{ installmentNumber: number; amount: number; dueDate: string; status: string }>
  >((enrollment?.installments as any) || []);

  const [localStudents, setLocalStudents] = useState<EducationStudent[]>(students);
  useEffect(() => {
    setLocalStudents(students);
  }, [students]);

  const [isCreatingStudent, setIsCreatingStudent] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    guardianName: "",
  });
  const [savingStudent, setSavingStudent] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);

  const handleQuickCreateStudent = async () => {
    if (!newStudentForm.firstName.trim() || savingStudent) return;
    setSavingStudent(true);
    setStudentError(null);
    try {
      let created: EducationStudent | null = null;
      if (onAddNewStudent) {
        created = await onAddNewStudent({
          firstName: newStudentForm.firstName.trim(),
          lastName: newStudentForm.lastName.trim(),
          phone: newStudentForm.phone.trim() || undefined,
          notes: newStudentForm.guardianName.trim()
            ? `${isEn ? "Guardian:" : "ولي الأمر:"} ${newStudentForm.guardianName.trim()}`
            : undefined,
          ...((newStudentForm.guardianName.trim()
            ? { guardianName: newStudentForm.guardianName.trim() }
            : {}) as any),
        });
      } else {
        const res = await fetch(api("students"), {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            firstName: newStudentForm.firstName.trim(),
            lastName: newStudentForm.lastName.trim(),
            phone: newStudentForm.phone.trim() || undefined,
            guardianName: newStudentForm.guardianName.trim() || undefined,
          }),
        });
        const d = await res.json();
        if (d.success && d.data) {
          created = d.data;
        } else {
          setStudentError(d.error || (isEn ? "Failed to create student" : "فشل إنشاء الطالب"));
          return;
        }
      }

      if (created) {
        setLocalStudents((prev) => [created!, ...prev]);
        setForm((prev) => ({ ...prev, studentId: created!.id }));
        setIsCreatingStudent(false);
        setNewStudentForm({
          firstName: "",
          lastName: "",
          phone: "",
          guardianName: "",
        });
      }
    } catch (e: any) {
      setStudentError(e.message || (isEn ? "Error creating student" : "حدث خطأ أثناء إضافة الطالب"));
    } finally {
      setSavingStudent(false);
    }
  };

  const selectedPackage = packages.find((p) => p.id === form.packageId);
  const basePrice = selectedPackage?.price || 0;
  const isGroupPackage = (selectedPackage?.packageType || "GROUP") === "GROUP";
  const availableGroups = groups.filter(
    (g) => !selectedPackage?.subjectId || !g.subjectId || String(g.subjectId) === String(selectedPackage.subjectId)
  );

  const selectedStudent = localStudents.find((s) => s.id === form.studentId);
  const studentSiblingCount = useMemo(() => {
    if (!selectedStudent?.customerId) return 1;
    return localStudents.filter((s) => s.customerId === selectedStudent.customerId).length;
  }, [localStudents, selectedStudent]);

  const financial = useMemo(() => {
    const rawDisc = typeof discountValue === "number" ? discountValue : 0;
    return computeDiscountAndFinal(basePrice, discountType, rawDisc, activeDiscounts);
  }, [basePrice, discountType, discountValue, activeDiscounts]);

  const handleDiscountTypeChange = (newType: string) => {
    setDiscountType(newType);
    setPromoMessage(null);
    if (newType === "NONE") {
      setDiscountValue("");
    } else if (newType === "CUSTOM") {
      setDiscountValue(typeof discountValue === "number" ? discountValue : 0);
    } else {
      const matched = activeDiscounts.find((d) => d.id === newType);
      if (matched) {
        if (matched.type === "PERCENTAGE") {
          const rate = Math.min(100, Math.max(0, Number(matched.value) || 0)) / 100;
          setDiscountValue(Math.round(basePrice * rate));
        } else {
          setDiscountValue(Math.min(basePrice, Number(matched.value) || 0));
        }
      }
    }
  };

  const handleApplyPromoCode = () => {
    if (!promoCodeInput.trim()) return;
    const clean = promoCodeInput.trim().toUpperCase();
    const matched = activeDiscounts.find(
      (d) => d && d.code && d.code.toUpperCase() === clean && d.isActive !== false
    );
    if (matched) {
      handleDiscountTypeChange(matched.id);
      setPromoMessage({
        text: isEn ? `Promo code applied: ${matched.nameEn || matched.nameAr}` : `تم تطبيق كود الخصم: ${matched.nameAr}`,
        isError: false,
      });
    } else {
      setPromoMessage({
        text: isEn ? "Invalid or inactive promo code" : "كود الخصم غير صحيح أو غير مفعّل",
        isError: true,
      });
    }
  };

  useEffect(() => {
    if (paymentMethod === "INSTALLMENTS" && financial.finalAmount > 0) {
      if (!enrollment?.id || installments.length === 0) {
        const schedule = calculateInstallmentSchedule(financial.finalAmount, installmentCount);
        setInstallments(
          schedule.map((s) => ({
            installmentNumber: s.installmentNumber,
            amount: s.amount,
            dueDate: s.dueDate,
            status: "PENDING",
          }))
        );
        setForm((prev) => ({ ...prev, amountPaid: schedule[0]?.amount || 0 }));
      }
    } else if (paymentMethod === "CASH") {
      setInstallments([]);
      if (!enrollment?.id) {
        setForm((prev) => ({ ...prev, amountPaid: financial.finalAmount }));
      }
    }
  }, [paymentMethod, installmentCount, financial.finalAmount]);

  const handleDueDateChange = (index: number, newDate: string) => {
    setInstallments((prev) =>
      prev.map((inst, i) => (i === index ? { ...inst, dueDate: newDate } : inst))
    );
  };
  const matchingTeachers = selectedPackage?.subjectId
    ? teachers.filter((t) =>
        t.subjectRates?.some(
          (sr) => sr.subjectId === selectedPackage.subjectId
        )
      )
    : teachers;
  // Fallback to all teachers if no teacher has specific rates for this subject (e.g. general courses mode)
  const filteredTeachers = matchingTeachers.length > 0 ? matchingTeachers : teachers;

  const activeStudents = localStudents.filter((s) => s.isActive);

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={MODAL_CLS + " max-h-[90vh] overflow-y-auto"}
        onClick={(e) => e.stopPropagation()}
        dir={isEn ? "ltr" : "rtl"}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <h3 className="text-sm font-bold text-foreground">
            {enrollment?.id
              ? t("education.enrollments.modalTitleEdit", isEn ? "Edit Subscription" : "تعديل الاشتراك")
              : t("education.enrollments.modalTitleNew", isEn ? "Add New Subscription" : "إضافة اشتراك جديد")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Student selection / creation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">
                {t("education.enrollments.student", isEn ? "Student" : "الطالب")} *
              </label>
              {!enrollment?.id && !isCreatingStudent && (
                <button
                  type="button"
                  onClick={() => setIsCreatingStudent(true)}
                  className="text-[11px] text-primary hover:underline font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t("education.enrollments.quickAddStudent", isEn ? "+ Add New Student" : "+ إضافة طالب جديد")}
                </button>
              )}
            </div>

            {isCreatingStudent ? (
              <div className="p-3 bg-muted/40 border border-primary/30 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-primary" />
                    {t("education.enrollments.quickAddStudentTitle", isEn ? "Add new student & select immediately" : "إضافة طالب جديد وتحديده فوراً")}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingStudent(false);
                      setStudentError(null);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t("education.actions.cancel", isEn ? "Cancel" : "إلغاء")}
                  </button>
                </div>
                {studentError && (
                  <p className="text-[11px] text-destructive font-medium">{studentError}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground">{t("education.students.firstName", isEn ? "First Name *" : "الاسم الأول *")}</label>
                    <input
                      className={INPUT_CLS}
                      placeholder={isEn ? "e.g. Joseph" : "مثال: يوسف"}
                      value={newStudentForm.firstName}
                      onChange={(e) =>
                        setNewStudentForm({ ...newStudentForm, firstName: e.target.value })
                      }
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">{t("education.students.lastName", isEn ? "Last Name" : "اسم العائلة / الأخير")}</label>
                    <input
                      className={INPUT_CLS}
                      placeholder={isEn ? "e.g. Miller" : "مثال: محمد"}
                      value={newStudentForm.lastName}
                      onChange={(e) =>
                        setNewStudentForm({ ...newStudentForm, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground">{t("education.students.phone", isEn ? "Student Phone" : "هاتف الطالب")}</label>
                    <input
                      className={INPUT_CLS}
                      placeholder="01xxxxxxxxx"
                      value={newStudentForm.phone}
                      onChange={(e) =>
                        setNewStudentForm({ ...newStudentForm, phone: e.target.value })
                      }
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">{t("education.students.manualGuardianName", isEn ? "Guardian Name (Optional)" : "اسم ولي الأمر (اختياري)")}</label>
                    <input
                      className={INPUT_CLS}
                      placeholder={isEn ? "Guardian Name" : "اسم ولي الأمر"}
                      value={newStudentForm.guardianName}
                      onChange={(e) =>
                        setNewStudentForm({ ...newStudentForm, guardianName: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingStudent(false);
                      setStudentError(null);
                    }}
                    className="px-2.5 py-1 text-xs rounded-md bg-muted text-muted-foreground hover:bg-muted/80"
                  >
                    {t("education.actions.back", isEn ? "Back" : "رجوع")}
                  </button>
                  <button
                    type="button"
                    disabled={!newStudentForm.firstName.trim() || savingStudent}
                    onClick={handleQuickCreateStudent}
                    className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {savingStudent && <Loader2 className="w-3 h-3 animate-spin" />}
                    {t("education.enrollments.saveAndSelectStudent", isEn ? "Save & Select Student" : "حفظ واختيار الطالب")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <select
                  className={INPUT_CLS}
                  value={form.studentId}
                  onChange={(e) =>
                    setForm({ ...form, studentId: e.target.value })
                  }
                  disabled={!!enrollment?.id}
                >
                  <option value="">
                    {activeStudents.length === 0
                      ? t("education.enrollments.noStudentsAvailable", isEn ? "-- No enrolled students --" : "-- لا يوجد طلاب مسجلين --")
                      : t("education.enrollments.selectStudent", isEn ? "Select Student" : "اختر الطالب")}
                  </option>
                  {activeStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code ? `[#${s.code}] ` : ""}{s.firstName} {s.lastName || ""} {s.phone ? `- ${s.phone}` : ""}
                    </option>
                  ))}
                </select>

                {activeStudents.length === 0 && !enrollment?.id && (
                  <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-semibold text-warning dark:text-warning">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{t("education.enrollments.noStudentsAlert", isEn ? "No students registered in the system yet." : "لا يوجد أي طلاب مسجلين في النظام بعد.")}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreatingStudent(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:bg-primary/90 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t("education.enrollments.addStudentNow", isEn ? "+ Add New Student Now" : "+ إضافة طالب جديد الآن")}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Package Selection */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              {t("education.enrollments.package", isEn ? "Session Package" : "الباقة الدراسية")} *
            </label>
            <select
              className={INPUT_CLS}
              value={form.packageId}
              onChange={(e) => {
                setForm({
                  ...form,
                  packageId: e.target.value,
                  teacherId: "",
                });
                setGroupId("");
              }}
              disabled={!!enrollment?.id}
            >
              <option value="">{t("education.enrollments.selectPackage", isEn ? "Select Package" : "اختر الباقة")}</option>
              {packages
                .filter((p) => p.isActive)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{enableSubjects && p.subject?.name ? ` - ${p.subject.name}` : ""} ({p.hoursCount}{isEn ? "h" : "س"} - {p.price} {isEn ? "EGP" : "ج.م"})
                  </option>
                ))}
            </select>
          </div>

          {/* Group Selection — the teacher and branch come from the group */}
          {isGroupPackage && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {isEn ? "Group" : "المجموعة"}{" "}
                <span className="text-[11px] font-normal text-muted-foreground">
                  {isEn ? "(teacher & branch come from the group)" : "(المدرس والفرع يتبعان المجموعة)"}
                </span>
              </label>
              <select
                className={INPUT_CLS}
                value={groupId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  const picked = availableGroups.find((g) => g.id === nextId);
                  setGroupId(nextId);
                  setForm((prev) => ({ ...prev, teacherId: picked?.teacherId || "" }));
                }}
                disabled={!!enrollment?.id}
              >
                <option value="">{isEn ? "-- No group --" : "-- بدون مجموعة --"}</option>
                {availableGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                    {g.teacherName ? ` — ${g.teacherName}` : ""}
                    {typeof g.activeMembers === "number" && typeof g.capacity === "number"
                      ? ` (${g.activeMembers}/${g.capacity})`
                      : ""}
                  </option>
                ))}
              </select>
              {availableGroups.length === 0 ? (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {isEn
                    ? "No groups on this track yet. Create a group first, or save without a group."
                    : "لا توجد مجموعات على نفس المسار. أنشئ مجموعة أولاً أو احفظ بدون مجموعة."}
                </p>
              ) : null}
            </div>
          )}

          {/* Teacher Selection */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              {t("education.enrollments.teacher", isEn ? "Assigned Teacher" : "المدرس المعين")}{" "}
              {!enrollment?.id && (
                <span className="text-muted-foreground text-[11px]">
                  ({t("education.students.addressOptional", isEn ? "Optional" : "اختياري")})
                </span>
              )}
            </label>
            <select
              className={INPUT_CLS}
              value={form.teacherId || ""}
              disabled={Boolean(groupId)}
              onChange={(e) =>
                setForm({ ...form, teacherId: e.target.value || "" })
              }
            >
              <option value="">{t("education.enrollments.notAssigned", isEn ? "-- Not Assigned Yet --" : "-- لم يحدد بعد --")}</option>
              {filteredTeachers
                .filter((t) => t.isActive)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
            {filteredTeachers.length === 0 && form.packageId && (
              <p className="text-[11px] text-warning mt-1">
                {enableSubjects
                  ? t("education.enrollments.unassignedNotice", isEn ? "No teachers for this subject. Please add a teacher with a rate for this subject first." : "لا يوجد مدرسين لهذه المادة. أضف مدرساً مع سعر للمادة أولاً.")
                  : t("education.enrollments.noActiveInstructors", isEn ? "No active teachers found. Please add a teacher first." : "لا يوجد مدرسين نشطين حالياً. أضف مدرساً أولاً.")}
              </p>
            )}
          </div>

          {/* Discounts System */}
          <div className="space-y-2 p-3 rounded-xl border border-border/70 bg-muted/20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Percent className="w-3.5 h-3.5 text-primary" />
                <span>{isEn ? "Discounts & Promotions" : "نظام الخصومات والعروض"}</span>
              </div>
              {studentSiblingCount > 1 && (
                <span className="text-[10px] font-semibold text-warning dark:text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>{isEn ? `Student has ${studentSiblingCount - 1} sibling(s)` : `طالب له ${studentSiblingCount - 1} إخوة مسجلين`}</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">{isEn ? "Discount Policy / Type" : "نوع وسياسة الخصم"}</label>
                <select
                  className={INPUT_CLS}
                  value={discountType}
                  onChange={(e) => handleDiscountTypeChange(e.target.value)}
                >
                  <option value="NONE">{isEn ? "No Discount" : "بدون خصم"}</option>
                  {activeDiscounts
                    .filter((d) => d && d.isActive !== false)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {isEn ? d.nameEn || d.nameAr : d.nameAr} (
                        {d.type === "PERCENTAGE" ? `${d.value}%` : `${d.value} ${isEn ? "EGP" : "ج.م"}`})
                        {d.code ? ` - [${d.code}]` : ""}
                      </option>
                    ))}
                  <option value="CUSTOM">{isEn ? "Custom Manual Discount (EGP)" : "خصم مخصص يدوي (ج.م)"}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">
                  {discountType === "CUSTOM"
                    ? isEn
                      ? "Custom Discount (EGP)"
                      : "قيمة الخصم اليدوي (ج.م)"
                    : isEn
                    ? "Applied Discount Value"
                    : "قيمة الخصم المطبق (ج.م)"}
                </label>
                <input
                  type="number"
                  min={0}
                  max={basePrice}
                  disabled={discountType === "NONE" || discountType !== "CUSTOM"}
                  className={INPUT_CLS}
                  placeholder={discountType === "NONE" ? "-" : "0"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value ? Number(e.target.value) : "")}
                />
              </div>
            </div>

            {/* Optional Promo Code lookup */}
            <div className="pt-1 flex items-center gap-2">
              <input
                type="text"
                placeholder={isEn ? "Enter promo code (e.g. EARLY10)" : "كود الخصم الترويجي (مثال: EARLY10)"}
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                className={INPUT_CLS + " max-w-[240px] uppercase font-mono text-[11px]"}
              />
              <button
                type="button"
                onClick={handleApplyPromoCode}
                className="px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-all active:scale-[0.98] shrink-0"
              >
                {isEn ? "Apply Code" : "تطبيق الكود"}
              </button>
              {promoMessage && (
                <span
                  className={`text-[11px] font-semibold truncate ${
                    promoMessage.isError ? "text-red-500" : "text-emerald-600 dark:text-success"
                  }`}
                >
                  {promoMessage.text}
                </span>
              )}
            </div>

            {basePrice > 0 && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-success/10 border border-success/20 text-xs mt-1">
                <span className="text-muted-foreground">{isEn ? "Final Payable:" : "المبلغ النهائي بعد الخصم:"}</span>
                <span className="font-bold text-success dark:text-success font-mono">
                  {financial.finalAmount.toLocaleString()} ج.م
                  {financial.discountAmount > 0 && (
                    <span className="text-[10px] text-muted-foreground font-normal me-1.5">
                      (خصم: {financial.discountAmount.toLocaleString()} ج.م)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Payment Method & Installments */}
          <div className="space-y-2.5 p-3 rounded-xl border border-border/70 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>{isEn ? "Payment Plan" : "نظام الدفع والأقساط"}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                    paymentMethod === "CASH"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isEn ? "Cash" : "كاش"}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("INSTALLMENTS")}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                    paymentMethod === "INSTALLMENTS"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isEn ? "Installments" : "أقساط مجدولة"}
                </button>
              </div>
            </div>

            {paymentMethod === "INSTALLMENTS" ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{isEn ? "Installment Count:" : "عدد الأقساط:"}</span>
                  <select
                    value={installmentCount}
                    onChange={(e) => setInstallmentCount(Number(e.target.value))}
                    className="bg-background border border-input rounded-md px-2 py-0.5 text-xs font-bold text-foreground"
                  >
                    {Array.from({ length: 11 }, (_, i) => i + 2).map((n) => (
                      <option key={n} value={n}>
                        {isEn ? `${n} installments` : `${n} أقساط`}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-muted-foreground">
                    {isEn ? "(one every month)" : "(قسط كل شهر)"}
                  </span>
                </div>

                {/* Installments Table */}
                <div className="space-y-1.5">
                  {installments.map((inst, idx) => (
                    <div
                      key={inst.installmentNumber}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background border border-border text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">
                          {inst.installmentNumber}
                        </span>
                        <span className="font-semibold">{isEn ? `Inst ${inst.installmentNumber}` : `القسط ${inst.installmentNumber}`}:</span>
                        <span className="font-bold text-primary font-mono">{inst.amount.toLocaleString()} ج.م</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">{isEn ? "Due:" : "الموعد:"}</span>
                        <input
                          type="date"
                          value={inst.dueDate}
                          onChange={(e) => handleDueDateChange(idx, e.target.value)}
                          className="bg-card border border-input rounded-md px-1.5 py-0.5 text-xs font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Amount & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  {paymentMethod === "INSTALLMENTS"
                    ? isEn ? "Paid Now (1st Installment)" : "المبلغ المدفوع الآن (مقدماً)"
                    : t("education.enrollments.amountPaid", isEn ? "Amount Paid (EGP)" : "المبلغ المدفوع (ج.م)")}
                </label>
                <input
                  type="number"
                  min={0}
                  className={INPUT_CLS}
                  value={form.amountPaid}
                  onChange={(e) =>
                    setForm({ ...form, amountPaid: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  {t("education.enrollments.paymentStatus", isEn ? "Payment Status" : "حالة السداد")}
                </label>
                <select
                  className={INPUT_CLS}
                  value={form.paymentStatus}
                  onChange={(e) =>
                    setForm({ ...form, paymentStatus: e.target.value })
                  }
                >
                  <option value="PENDING">{t("education.enrollments.statusPending", isEn ? "Pending" : "معلق")}</option>
                  <option value="COMPLETED">{t("education.enrollments.statusPaid", isEn ? "Paid" : "مدفوع")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Expiration date */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              {t("education.enrollments.expiresAt", isEn ? "Package Expiration Date" : "تاريخ انتهاء الباقة")}
            </label>
            <DateInput
              className={INPUT_CLS}
              value={form.expiresAt?.split("T")[0] || ""}
              onChange={(e) =>
                setForm({ ...form, expiresAt: e.target.value || "" })
              }
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-border/80">
          <div className="text-[11px] text-warning font-medium">
            {!form.studentId && !form.packageId
              ? (isEn ? "* Please select student and package to enable saving" : "* يرجى اختيار الطالب والباقة لتفعيل الحفظ")
              : !form.studentId
              ? (isEn ? "* Please select student to enable saving" : "* يرجى اختيار الطالب لتفعيل الحفظ")
              : !form.packageId
              ? (isEn ? "* Please select package to enable saving" : "* يرجى اختيار الباقة لتفعيل الحفظ")
              : null}
          </div>
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs rounded-lg bg-muted text-foreground hover:bg-muted/80"
            >
              {t("education.actions.cancel", isEn ? "Cancel" : "إلغاء")}
            </button>
            <button
              type="button"
              onClick={() =>
                onSave({
                  ...form,
                  paymentMethod,
                  installmentCount: paymentMethod === "INSTALLMENTS" ? installmentCount : 1,
                  installments: paymentMethod === "INSTALLMENTS" ? installments : undefined,
                  discountType,
                  discountAmount: financial.discountAmount,
                  finalAmount: financial.finalAmount,
                  teacherId: form.teacherId || null,
                  groupId: groupId || null,
                  expiresAt: form.expiresAt ? form.expiresAt : null,
                })
              }
              disabled={!form.studentId || !form.packageId}
              className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-opacity"
            >
              {t("education.actions.save", isEn ? "Save" : "حفظ")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

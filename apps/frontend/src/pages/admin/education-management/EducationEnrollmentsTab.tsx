import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, AlertTriangle, CreditCard, CheckCircle2, Calendar, Percent, X, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api, getAuthHeaders } from "./api";
import type {
  EducationEnrollment,
  EducationStudent,
  EducationPackage,
  EducationTeacher,
  EducationSubject,
} from "./types";
import { CELL_CLS } from "./types";
import { computeRenewalExpiry } from "./educationSharedHelpers";
import { EnrollmentModal } from "./EnrollmentModal";

export interface EducationEnrollmentsTabProps {
  enrollments: EducationEnrollment[];
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
  enrollmentModal: Partial<EducationEnrollment> | null | undefined;
  setEnrollmentModal: (
    e: Partial<EducationEnrollment> | null | undefined
  ) => void;
  handleSaveEnrollment: (d: Partial<EducationEnrollment>) => Promise<void>;
  handleDeleteEnrollment: (id: string) => Promise<void>;
  handleSaveStudent?: (d: Partial<EducationStudent>) => Promise<EducationStudent | null>;
  onRefresh?: () => void;
}

export const EducationEnrollmentsTab: React.FC<EducationEnrollmentsTabProps> = ({
  enrollments,
  students,
  packages,
  teachers,
  groups = [],
  subjects,
  enableSubjects = false,
  enrollmentModal,
  setEnrollmentModal,
  handleSaveEnrollment,
  handleDeleteEnrollment,
  handleSaveStudent,
  onRefresh,
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const getDiscountLabel = (type?: string) => {
    if (!type || type === "NONE") return null;
    if (type === "SIBLINGS" || type === "SIBLING" || type === "disc_sibling") {
      return isEn ? "Sibling Disc" : "خصم أخوات";
    }
    if (type === "SEASONAL" || type === "disc_seasonal") {
      return isEn ? "Seasonal Disc" : "خصم مواسم";
    }
    if (type === "disc_early_bird") {
      return isEn ? "Early Bird" : "حجز مبكر";
    }
    if (type === "disc_cash" || type === "disc_cash_full") {
      return isEn ? "Cash Disc" : "خصم كاش";
    }
    if (type === "CUSTOM") {
      return isEn ? "Custom Disc" : "خصم مخصص";
    }
    return type;
  };

  const [selectedEnrollmentForInstallments, setSelectedEnrollmentForInstallments] =
    useState<EducationEnrollment | null>(null);
  const [payingInstallment, setPayingInstallment] = useState(false);

  // الافتراضي: الاشتراكات النشطة فقط — المعطلة تظهر بفلتر صريح
  const [activationFilter, setActivationFilter] = useState<"active" | "inactive" | "all">("active");
  const activeCount = enrollments.filter((e) => e.isActive !== false).length;
  const inactiveCount = enrollments.length - activeCount;
  const visibleEnrollments = enrollments.filter((e) =>
    activationFilter === "all" ? true : activationFilter === "active" ? e.isActive !== false : e.isActive === false
  );
  const emptyMessage =
    enrollments.length > 0 && visibleEnrollments.length === 0
      ? isEn
        ? "No subscriptions match this filter"
        : "لا توجد اشتراكات مطابقة للفلتر"
      : t("education.enrollments.empty", isEn ? "No registered enrollments" : "لا توجد تسجيلات مسجلة");

  // تجديد اشتراك: يمدد المدة، يسجل الدفعة، ويمدّد تجديد المجموعة
  const [renewTarget, setRenewTarget] = useState<EducationEnrollment | null>(null);
  const [renewMonths, setRenewMonths] = useState(3);
  const [renewAmount, setRenewAmount] = useState(0);
  const [renewMethod, setRenewMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
  const [renewSaving, setRenewSaving] = useState(false);

  const openRenew = (enrollment: EducationEnrollment) => {
    const months = Math.min(24, Math.max(1, Number(enrollment.package?.durationMonths) || 3));
    setRenewMonths(months);
    setRenewAmount(Number(enrollment.finalAmount ?? enrollment.package?.price ?? 0));
    setRenewMethod("CASH");
    setRenewTarget(enrollment);
  };

  const renewPreviewDate = renewTarget ? computeRenewalExpiry(renewTarget.expiresAt, renewMonths) : "";

  const handleRenewEnrollment = async () => {
    if (!renewTarget) return;
    try {
      setRenewSaving(true);
      const res = await fetch(api(`enrollments/${renewTarget.id}/renew`), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ months: renewMonths, amountPaid: renewAmount, paymentMethod: renewMethod }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          isEn
            ? `Renewed for ${renewMonths} months until ${data.meta?.newExpiry?.slice(0, 10) || renewPreviewDate}`
            : `تم التجديد ${renewMonths} شهور حتى ${data.meta?.newExpiry?.slice(0, 10) || renewPreviewDate}`
        );
        setRenewTarget(null);
        onRefresh?.();
      } else {
        toast.error(data.error || (isEn ? "Could not renew" : "تعذّر تجديد الاشتراك"));
      }
    } catch (err: any) {
      toast.error(err?.message || (isEn ? "Error while renewing" : "حدث خطأ أثناء التجديد"));
    } finally {
      setRenewSaving(false);
    }
  };

  const handlePayInstallment = async (enrollmentId: string, installmentNumber: number) => {
    try {
      setPayingInstallment(true);
      const res = await fetch(api(`enrollments/${enrollmentId}/installments/${installmentNumber}/pay`), {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isEn ? `Installment #${installmentNumber} marked as paid!` : `تم تحصيل القسط رقم ${installmentNumber} بنجاح!`);
        if (selectedEnrollmentForInstallments) {
          const updated = {
            ...selectedEnrollmentForInstallments,
            installments: selectedEnrollmentForInstallments.installments?.map((inst) =>
              inst.installmentNumber === installmentNumber
                ? { ...inst, status: "PAID" as const, paidAt: new Date().toISOString() }
                : inst
            ),
          };
          setSelectedEnrollmentForInstallments(updated);
        }
        onRefresh?.();
      } else {
        toast.error(data.error || (isEn ? "Failed to pay installment" : "فشل تحصيل القسط"));
      }
    } catch (err: any) {
      toast.error(err.message || (isEn ? "Error" : "حدث خطأ أثناء تحصيل القسط"));
    } finally {
      setPayingInstallment(false);
    }
  };

  return (
    <div className="space-y-4" dir={isEn ? "ltr" : "rtl"}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-base font-bold text-foreground">
          {t("education.enrollments.title", isEn ? "Subscriptions Management" : "إدارة الاشتراكات")}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setEnrollmentModal({})}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("education.enrollments.addEnrollment", isEn ? "Add New Subscription" : "إضافة اشتراك جديد")}
          </button>
          <Link
            to="/admin/education/payments"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-background border border-border text-foreground text-xs font-semibold rounded-lg hover:bg-muted"
          >
            <CreditCard className="w-3.5 h-3.5" />
            {isEn ? "Payments & Collections" : "المدفوعات والتحصيل"}
          </Link>
        </div>
      </div>

      {/* Activation filter — active subscriptions are the default view */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {([
          { key: "active" as const, label: isEn ? "Active" : "نشطة", count: activeCount },
          { key: "inactive" as const, label: isEn ? "Inactive" : "معطلة", count: inactiveCount },
          { key: "all" as const, label: isEn ? "All" : "الكل", count: enrollments.length },
        ]).map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => setActivationFilter(chip.key)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
              activationFilter === chip.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {chip.label}
            <span className="font-mono tabular-nums opacity-80">{chip.count}</span>
          </button>
        ))}
      </div>

      {/* Mobile Cards View */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {visibleEnrollments.map((e) => {
          const remaining = e.remainingHours ?? 0;
          const total = e.totalHours ?? 0;
          const pct = total > 0 ? Math.round((remaining / total) * 100) : 0;
          return (
            <div
              key={e.id}
              className={`bg-card border border-border/80 rounded-xl p-3.5 shadow-xs space-y-3 ${
                e.isActive === false ? "opacity-60 bg-muted/20" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-foreground truncate flex items-center gap-1.5">
                    <span>
                      {e.student
                        ? `${e.student.firstName} ${e.student.lastName || ""}`
                        : "—"}
                    </span>
                    {e.student?.code && (
                      <span className="font-mono text-[10px] text-primary bg-primary/10 px-1 py-0.5 rounded border border-primary/20 shrink-0" dir="ltr">
                        #{e.student.code}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {e.package?.name} {enableSubjects && e.package?.subject?.name ? `• ${e.package.subject.name}` : ""}
                  </div>
                  {e.groups && e.groups.length > 0 && (
                    <div className="text-[11px] text-muted-foreground/80 truncate">
                      {isEn ? "Group: " : "المجموعة: "}
                      {e.groups.map((g) => g.name).join(isEn ? ", " : "، ")}
                    </div>
                  )}
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border shrink-0 ${
                    e.isActive !== false
                      ? "bg-emerald-500/10 text-success dark:text-success border-success/20"
                      : "bg-red-500/10 text-destructive dark:text-destructive border-destructive/20"
                  }`}
                >
                  {e.isActive !== false
                    ? t("education.statuses.ACTIVE", isEn ? "Active" : "نشط")
                    : t("education.statuses.INACTIVE", isEn ? "Inactive" : "معطل")}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-border/40">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span>{t("education.enrollments.teacher", isEn ? "Teacher:" : "المدرس:")}</span>
                  {e.teacher?.name ? (
                    <span className="font-medium text-foreground">{e.teacher.name}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-warning font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      {t("education.enrollments.notAssigned", isEn ? "Not Assigned" : "لم يحدد بعد")}
                    </span>
                  )}
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                    ["COMPLETED", "PAID"].includes(e.paymentStatus)
                      ? "bg-emerald-500/10 text-success dark:text-success border-success/20"
                      : e.paymentStatus === "PENDING"
                      ? "bg-amber-500/10 text-warning dark:text-warning border-warning/20"
                      : "bg-muted/60 text-muted-foreground border-border"
                  }`}
                >
                  {["COMPLETED", "PAID"].includes(e.paymentStatus)
                    ? t("education.statuses.PAID", isEn ? "Paid" : "مدفوع")
                    : t("education.statuses.PENDING", isEn ? "Pending" : "معلق")}
                  {" "}({e.amountPaid || 0} {isEn ? "EGP" : "ج.م"})
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs ">
                  <span className="text-muted-foreground">{t("education.enrollments.remainingHours", isEn ? "Remaining Hours:" : "الساعات المتبقية:")}</span>
                  <span
                    className={`font-semibold ${
                      remaining < total * 0.2
                        ? "text-red-600 dark:text-destructive"
                        : remaining < total * 0.5
                        ? "text-amber-600 dark:text-warning"
                        : "text-emerald-600 dark:text-success"
                    }`}
                  >
                    {t("education.enrollments.remainingProgress", {
                      remaining,
                      total,
                      percent: pct,
                      defaultValue: isEn ? `${remaining} of ${total} hours (${pct}%)` : `${remaining} من ${total} ساعة (${pct}%)`,
                    })}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct <= 20
                        ? "bg-red-500"
                        : pct <= 50
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/60">
                {e.isActive !== false && (
                  <button
                    type="button"
                    onClick={() => openRenew(e)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-primary hover:bg-primary/10 rounded-md transition-colors border border-primary/30"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {isEn ? "Renew" : "تجديد"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEnrollmentModal(e)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors border border-border/60"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {t("education.actions.edit", isEn ? "Edit" : "تعديل")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSaveEnrollment({
                      id: e.id,
                      isActive: e.isActive === false,
                    })
                  }
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                    e.isActive !== false
                      ? "bg-red-500/10 text-destructive hover:bg-destructive/20"
                      : "bg-emerald-500/10 text-success hover:bg-success/20"
                  }`}
                >
                  {e.isActive !== false
                    ? t("education.actions.deactivate", isEn ? "Deactivate" : "تعطيل")
                    : t("education.actions.activate", isEn ? "Activate" : "تفعيل")}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteEnrollment(e.id)}
                  className="p-1.5 text-destructive dark:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  aria-label={t("education.actions.delete", isEn ? "Delete" : "حذف")} title={t("education.actions.delete", isEn ? "Delete" : "حذف")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        {visibleEnrollments.length === 0 && (
          <div className="bg-card border border-border/80 rounded-xl p-8 text-center text-xs text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-card border border-border/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground text-xs">
                {[
                  t("education.enrollments.student", isEn ? "Student" : "الطالب"),
                  t("education.enrollments.package", isEn ? "Package" : "الباقة"),
                  ...(enableSubjects ? [t("education.enrollments.subject", isEn ? "Subject" : "المادة")] : []),
                  t("education.enrollments.teacher", isEn ? "Teacher" : "المدرس"),
                  t("education.enrollments.remainingHours", isEn ? "Remaining Hours" : "الساعات المتبقية"),
                  t("education.enrollments.paidAmount", isEn ? "Paid Amount" : "المدفوع"),
                  t("education.enrollments.paymentStatus", isEn ? "Status" : "الحالة"),
                  t("education.enrollments.activation", isEn ? "Activation" : "التفعيل"),
                  "",
                ].map((h, i) => (
                  <th key={i} className={`${isEn ? "text-left" : "text-right"} py-3 px-4 font-semibold`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {visibleEnrollments.map((e) => {
                const remaining = e.remainingHours ?? 0;
                const total = e.totalHours ?? 0;
                const pct =
                  total > 0 ? Math.round((remaining / total) * 100) : 0;
                return (
                  <tr key={e.id} className={`hover:bg-muted/30 transition-colors ${e.isActive === false ? "opacity-60 bg-muted/20" : ""}`}>
                    <td className={CELL_CLS + " font-medium text-foreground"}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>
                          {e.student
                            ? `${e.student.firstName} ${e.student.lastName || ""}`
                            : "—"}
                        </span>
                        {e.student?.code && (
                          <span className="font-mono text-[10px] text-primary bg-primary/10 px-1 py-0.5 rounded border border-primary/20" dir="ltr">
                            #{e.student.code}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={CELL_CLS + " text-muted-foreground"}>
                      <div>{e.package?.name || "—"}</div>
                      {e.groups && e.groups.length > 0 && (
                        <div className="text-[10px] text-muted-foreground/80">
                          {e.groups.map((g) => g.name).join(isEn ? ", " : "، ")}
                        </div>
                      )}
                    </td>
                    {enableSubjects && (
                      <td className={CELL_CLS + " text-muted-foreground"}>
                        {e.package?.subject?.name || "—"}
                      </td>
                    )}
                    <td className={CELL_CLS}>
                      {e.teacher?.name || (
                        <span className="text-amber-500 text-[11px] font-medium">
                          {t("education.enrollments.notAssigned", isEn ? "Not Assigned" : "لم يحدد بعد")}
                        </span>
                      )}
                    </td>
                    <td className={CELL_CLS}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono tabular-nums font-medium ${
                            remaining < total * 0.2
                              ? "text-red-600 dark:text-destructive"
                              : remaining < total * 0.5
                              ? "text-amber-600 dark:text-warning"
                              : "text-emerald-600 dark:text-success"
                          }`}
                        >
                          {remaining}/{total}
                        </span>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct <= 20
                                ? "bg-red-500"
                                : pct <= 50
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td
                      className={
                        CELL_CLS + " font-mono tabular-nums text-foreground"
                      }
                    >
                      <div className="font-bold">
                        {e.amountPaid || 0} {isEn ? "EGP" : "ج.م"}
                        {e.finalAmount && e.finalAmount !== e.amountPaid ? (
                          <span className="text-[10px] text-muted-foreground block font-normal">
                            {isEn ? "of " : "من "} {e.finalAmount} {isEn ? "EGP" : "ج.م"}
                          </span>
                        ) : null}
                      </div>
                      {e.paymentMethod === "INSTALLMENTS" || (e.installments && e.installments.length > 0) ? (
                        <button
                          type="button"
                          onClick={() => setSelectedEnrollmentForInstallments(e)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 mt-1 cursor-pointer transition-colors"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>
                            {isEn
                              ? `Installments (${e.installments?.length || e.installmentCount || 2})`
                              : `أقساط (${e.installments?.length || e.installmentCount || 2})`}
                          </span>
                        </button>
                      ) : null}
                      {e.discountType && e.discountType !== "NONE" && (
                        <div className="text-[10px] text-success dark:text-success font-semibold flex items-center gap-0.5 mt-0.5">
                          <Percent className="w-2.5 h-2.5" />
                          <span>{getDiscountLabel(e.discountType)}</span>
                        </div>
                      )}
                    </td>
                    <td className={CELL_CLS}>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          ["COMPLETED", "PAID"].includes(e.paymentStatus)
                            ? "bg-emerald-500/10 text-success dark:text-success border-success/20"
                            : e.paymentStatus === "PENDING"
                            ? "bg-amber-500/10 text-warning dark:text-warning border-warning/20"
                            : "bg-muted/60 text-muted-foreground border-border"
                        }`}
                      >
                        {["COMPLETED", "PAID"].includes(e.paymentStatus)
                          ? t("education.statuses.PAID", isEn ? "Paid" : "مدفوع")
                          : t("education.statuses.PENDING", isEn ? "Pending" : "معلق")}
                      </span>
                    </td>
                    <td className={CELL_CLS}>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          e.isActive !== false
                            ? "bg-emerald-500/10 text-success dark:text-success border-success/20"
                            : "bg-red-500/10 text-destructive dark:text-destructive border-destructive/20"
                        }`}
                      >
                        {e.isActive !== false
                          ? t("education.statuses.ACTIVE", isEn ? "Active" : "نشط")
                          : t("education.statuses.INACTIVE", isEn ? "Inactive" : "معطل")}
                      </span>
                    </td>
                    <td className={CELL_CLS}>
                      <div className="flex items-center justify-end gap-1">
                        {e.isActive !== false && (
                          <button
                            type="button"
                            onClick={() => openRenew(e)}
                            className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
                            aria-label={isEn ? "Renew subscription" : "تجديد الاشتراك"}
                            title={isEn ? "Renew subscription" : "تجديد الاشتراك"}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setEnrollmentModal(e)}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                          aria-label={t("education.actions.edit", isEn ? "Edit" : "تعديل")} title={t("education.actions.edit", isEn ? "Edit" : "تعديل")}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {!e.teacher?.id && (
                          <span title={isEn ? "Teacher assignment needed" : "مطلوب تعيين مدرس"}>
                            <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            handleSaveEnrollment({
                              id: e.id,
                              isActive: e.isActive === false,
                            })
                          }
                          className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                            e.isActive !== false
                              ? "bg-red-500/10 text-destructive hover:bg-destructive/20"
                              : "bg-emerald-500/10 text-success hover:bg-success/20"
                          }`}
                        >
                          {e.isActive !== false
                            ? t("education.actions.deactivate", isEn ? "Deactivate" : "تعطيل")
                            : t("education.actions.activate", isEn ? "Activate" : "تفعيل")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEnrollment(e.id)}
                          className="p-1.5 text-destructive dark:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                          aria-label={t("education.actions.delete", isEn ? "Delete" : "حذف")} title={t("education.actions.delete", isEn ? "Delete" : "حذف")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visibleEnrollments.length === 0 && (
          <p className="text-center py-12 text-xs text-muted-foreground">
            {emptyMessage}
          </p>
        )}
      </div>
      {renewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir={isEn ? "ltr" : "rtl"}>
          <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/70">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground">{isEn ? "Renew subscription" : "تجديد الاشتراك"}</h3>
                <p className="text-[11px] text-muted-foreground truncate">
                  {renewTarget.student ? `${renewTarget.student.firstName} ${renewTarget.student.lastName || ""}` : ""} •{" "}
                  {renewTarget.package?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRenewTarget(null)}
                className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg"
                aria-label={isEn ? "Close" : "إغلاق"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">{isEn ? "Months" : "المدة (شهور)"}</label>
                  <select
                    className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm text-foreground"
                    value={renewMonths}
                    onChange={(e) => setRenewMonths(Number(e.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {isEn ? `${m} months` : `${m} شهور`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">{isEn ? "Amount (EGP)" : "المبلغ (ج.م)"}</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm font-mono tabular-nums text-foreground"
                    value={renewAmount}
                    onChange={(e) => setRenewAmount(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">{isEn ? "Payment method" : "طريقة الدفع"}</label>
                <select
                  className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm text-foreground"
                  value={renewMethod}
                  onChange={(e) => setRenewMethod(e.target.value as "CASH" | "CARD" | "TRANSFER")}
                >
                  <option value="CASH">{isEn ? "Cash" : "كاش"}</option>
                  <option value="CARD">{isEn ? "Card" : "بطاقة"}</option>
                  <option value="TRANSFER">{isEn ? "Transfer" : "تحويل"}</option>
                </select>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground space-y-0.5">
                <div className="flex items-center justify-between">
                  <span>{isEn ? "Renewal covers until" : "التجديد يغطي حتى"}</span>
                  <span className="font-mono tabular-nums text-foreground">{renewPreviewDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{isEn ? "Monthly collection paused" : "التحصيل الشهري متوقف"}</span>
                  <span className="text-foreground">{isEn ? "Yes, within the period" : "نعم، خلال المدة"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border/70">
              <button
                type="button"
                onClick={() => setRenewTarget(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted"
              >
                {isEn ? "Cancel" : "إلغاء"}
              </button>
              <button
                type="button"
                onClick={handleRenewEnrollment}
                disabled={renewSaving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${renewSaving ? "animate-spin" : ""}`} />
                {isEn ? "Confirm renewal" : "تأكيد التجديد"}
              </button>
            </div>
          </div>
        </div>
      )}

      {enrollmentModal !== undefined && (
        <EnrollmentModal
          enrollment={enrollmentModal}
          students={students}
          packages={packages}
          teachers={teachers}
          groups={groups}
          subjects={subjects}
          enableSubjects={enableSubjects}
          onClose={() => setEnrollmentModal(undefined)}
          onSave={handleSaveEnrollment}
          onAddNewStudent={handleSaveStudent}
        />
      )}

      {selectedEnrollmentForInstallments && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4"
          onClick={() => setSelectedEnrollmentForInstallments(null)}
          dir={isEn ? "ltr" : "rtl"}
        >
          <div
            className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {isEn ? "Installment Schedule & Payments" : "جدول الأقساط وتحصيل الدفعات"}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedEnrollmentForInstallments.student?.firstName} {selectedEnrollmentForInstallments.student?.lastName} - {selectedEnrollmentForInstallments.package?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnrollmentForInstallments(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/60 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground block">{isEn ? "Total Amount:" : "المبلغ الإجمالي:"}</span>
                <span className="font-bold text-foreground font-mono">
                  {selectedEnrollmentForInstallments.finalAmount || selectedEnrollmentForInstallments.amountPaid} ج.م
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">{isEn ? "Total Paid:" : "إجمالي المدفوع:"}</span>
                <span className="font-bold text-success dark:text-success font-mono">
                  {selectedEnrollmentForInstallments.amountPaid || 0} ج.م
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">{isEn ? "Remaining:" : "المتبقي:"}</span>
                <span className="font-bold text-warning dark:text-warning font-mono">
                  {Math.max(0, (selectedEnrollmentForInstallments.finalAmount || selectedEnrollmentForInstallments.amountPaid || 0) - (selectedEnrollmentForInstallments.amountPaid || 0))} ج.م
                </span>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(selectedEnrollmentForInstallments.installments || []).map((inst) => {
                const isPaid = inst.status === "PAID";
                return (
                  <div
                    key={inst.installmentNumber}
                    className="p-3 rounded-xl border border-border/80 bg-background flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">
                          {inst.installmentNumber}
                        </span>
                        <span className="font-bold text-foreground">
                          {isEn ? `Installment #${inst.installmentNumber}` : `القسط رقم ${inst.installmentNumber}`}
                        </span>
                        <span className="font-bold font-mono text-primary">
                          {inst.amount.toLocaleString()} ج.م
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{isEn ? "Due Date:" : "تاريخ الاستحقاق:"} {inst.dueDate || "-"}</span>
                        {isPaid && inst.paidAt && (
                          <span className="text-[10px] text-success me-1.5">
                            ({isEn ? "Paid on " : "سُدد في "} {inst.paidAt.split("T")[0]})
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-success/10 text-success dark:text-success border border-success/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isEn ? "Paid" : "مدفوع"}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={payingInstallment}
                          onClick={() => handlePayInstallment(selectedEnrollmentForInstallments.id, inst.installmentNumber)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isEn ? "Collect Now" : "تحصيل القسط"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-border/80">
              <button
                type="button"
                onClick={() => setSelectedEnrollmentForInstallments(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground"
              >
                {isEn ? "Close" : "إغلاق"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, Pencil, Trash2, Phone, MapPin, BookOpen, Users } from "lucide-react";
import type { EducationStudent, EducationSubject } from "./types";

export interface EducationStudentsMobileCardsProps {
  students: EducationStudent[];
  subjects: EducationSubject[];
  enableSubjects?: boolean;
  onEdit: (student: EducationStudent) => void;
  onToggleStatus: (id: string, current: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const EducationStudentsMobileCards: React.FC<EducationStudentsMobileCardsProps> = ({
  students,
  subjects,
  enableSubjects = false,
  onEdit,
  onToggleStatus,
  onDelete,
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  return (
    <div className="block sm:hidden space-y-3" dir={isEn ? "ltr" : "rtl"}>
      {students.map((s) => {
        const activeEnrollment = s.enrollments?.[0];
        const packageName = activeEnrollment?.package?.name;
        const teacherName = activeEnrollment?.teacher?.name;
        const packagePrice = activeEnrollment?.package?.price ?? 0;
        const amountPaid = activeEnrollment?.amountPaid ?? 0;
        const remainingAmount = Math.max(0, packagePrice - amountPaid);
        const groupName = (s as any).groupName;

        return (
          <div
            key={s.id}
            className={`bg-card border border-border/80 rounded-xl p-3.5 shadow-xs space-y-3 transition-all ${
              !s.isActive ? "opacity-65 bg-muted/20" : ""
            }`}
          >
            {/* Header Row: Name, Code & Status */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link
                    to={`/admin/education/student/${s.id}`}
                    className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate"
                  >
                    {s.firstName} {s.lastName || ""}
                  </Link>
                  {s.code && (
                    <span
                      className="font-mono text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0"
                      dir="ltr"
                    >
                      #{s.code}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground font-medium">
                  <span>{s.grade || (isEn ? "Grade not specified" : "الصف غير محدد")}</span>
                  {s.currentLevel !== undefined && s.currentLevel !== null && String(s.currentLevel).trim() !== "" && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-foreground border border-border/60">
                      {isEn ? `Lvl ${s.currentLevel}` : `المستوى ${s.currentLevel}`}
                    </span>
                  )}
                </div>
              </div>

              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border shrink-0 ${
                  s.isActive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                }`}
              >
                {s.isActive
                  ? t("education.statuses.ACTIVE", isEn ? "Active" : "نشط")
                  : t("education.statuses.INACTIVE", isEn ? "Inactive" : "معطل")}
              </span>
            </div>

            {/* Contact & Education Details */}
            <div className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border/40">
              {/* Student Phone (+ Phone2) */}
              <div className="flex items-center gap-1.5 font-mono" dir="ltr">
                <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{s.phone || "—"}</span>
                {s.phone2 && (
                  <span className="text-[10px] text-primary/90 font-sans bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                    {isEn ? "Alt: " : "إضافي: "}
                    {s.phone2}
                  </span>
                )}
              </div>

              {/* Guardian */}
              {s.customer && (
                <div className="pt-0.5">
                  <span className="text-muted-foreground">{isEn ? "Guardian: " : "ولي الأمر: "}</span>
                  <span className="text-foreground font-medium">
                    {s.customer.firstName} {s.customer.lastName || ""}
                  </span>
                  {s.customer.phone && (
                    <span className="ms-1.5 font-mono text-[11px] text-muted-foreground" dir="ltr">
                      ({s.customer.phone})
                    </span>
                  )}
                </div>
              )}

              {/* Group */}
              {groupName && (
                <div className="flex items-center gap-1.5 pt-0.5">
                  <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-muted-foreground">{isEn ? "Group: " : "المجموعة: "}</span>
                  <span className="text-foreground font-medium">{groupName}</span>
                </div>
              )}

              {/* Package & Teacher */}
              {(packageName || teacherName) && (
                <div className="flex items-center gap-2 pt-0.5 text-xs flex-wrap">
                  {packageName && (
                    <span className="inline-flex items-center gap-1 text-foreground font-medium">
                      <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{packageName}</span>
                    </span>
                  )}
                  {teacherName && (
                    <span className="text-muted-foreground">
                      ({isEn ? "Teacher: " : "المدرّس: "}{teacherName})
                    </span>
                  )}
                </div>
              )}

              {/* Paid & Due */}
              {activeEnrollment && (
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/30" dir="ltr">
                  <span className="text-emerald-600 font-semibold">
                    {amountPaid.toLocaleString(isEn ? "en-US" : "ar-EG")} {isEn ? "EGP" : "ج.م"}
                  </span>
                  {remainingAmount > 0 && (
                    <span className="text-amber-600">
                      {isEn ? "Due: " : "متبقي: "}{remainingAmount.toLocaleString(isEn ? "en-US" : "ar-EG")} {isEn ? "EGP" : "ج.م"}
                    </span>
                  )}
                </div>
              )}

              {/* Address */}
              {s.address && (
                <div className="flex items-center gap-1.5 truncate pt-0.5" title={s.address}>
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{s.address}</span>
                </div>
              )}
            </div>

            {/* Subjects Tags */}
            {(s as any).subjects &&
              Array.isArray((s as any).subjects) &&
              (s as any).subjects.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 border-t border-border/40">
                  {(s as any).subjects.map((sub: any, idx: number) => {
                    const subName =
                      typeof sub === "string"
                        ? subjects.find((x) => x.id === sub)?.name || sub
                        : sub.name || sub.id;
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20"
                      >
                        <BookOpen className="w-2.5 h-2.5" />
                        {subName}
                      </span>
                    );
                  })}
                </div>
              )}

            {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2.5 border-t border-border/60">
            <Link
              to={`/admin/education/student/${s.id}`}
              className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-muted/60 text-foreground hover:bg-muted text-xs rounded-lg transition-colors font-medium"
            >
              <Eye className="w-3.5 h-3.5" />
              {t("education.actions.view", isEn ? "View" : "عرض")}
            </Link>

            <button
              type="button"
              onClick={() => onEdit(s)}
              className="p-1.5 text-xs text-foreground bg-muted/60 hover:bg-muted rounded-lg transition-colors"
              aria-label={t("education.actions.edit", isEn ? "Edit" : "تعديل")}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onToggleStatus(s.id, s.isActive)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                s.isActive
                  ? "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                  : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
              }`}
            >
              {s.isActive
                ? t("education.actions.deactivate", isEn ? "Deactivate" : "تعطيل")
                : t("education.actions.activate", isEn ? "Activate" : "تفعيل")}
            </button>

            <button
              type="button"
              onClick={() => onDelete(s.id)}
              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              aria-label={t("education.actions.delete", isEn ? "Delete" : "حذف")}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}

      {students.length === 0 && (
        <div className="text-center py-10 text-xs text-muted-foreground bg-card border border-border/80 rounded-xl">
          {t("education.students.empty", isEn ? "No enrolled students found" : "لا يوجد طلاب مطابقين للبحث")}
        </div>
      )}
    </div>
  );
};

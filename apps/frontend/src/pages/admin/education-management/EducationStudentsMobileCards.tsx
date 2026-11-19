import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, Pencil, Trash2, Phone, MapPin, BookOpen } from "lucide-react";
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
      {students.map((s) => (
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
              <p className="text-xs text-muted-foreground font-medium">
                {s.grade || (isEn ? "Grade not specified" : "الصف غير محدد")}
              </p>
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

          {/* Contact Details */}
          <div className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border/40">
            {/* Student Phone */}
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

            {/* Address */}
            {s.address && (
              <div className="flex items-center gap-1.5 truncate" title={s.address}>
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{s.address}</span>
              </div>
            )}

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
          </div>

          {/* Subjects Tags */}
          {enableSubjects &&
            (s as any).subjects &&
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

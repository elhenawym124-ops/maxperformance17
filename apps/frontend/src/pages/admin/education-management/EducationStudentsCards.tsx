import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Phone,
  Eye,
  Pencil,
  Trash2,
  BookOpen,
  MapPin,
} from "lucide-react";
import type { EducationStudent, EducationSubject } from "./types";

interface EducationStudentsCardsProps {
  students: EducationStudent[];
  subjects: EducationSubject[];
  enableSubjects?: boolean;
  onEditStudent: (student: EducationStudent) => void;
  onToggleStudent: (id: string, current: boolean) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
}

export const EducationStudentsCards: React.FC<EducationStudentsCardsProps> = ({
  students,
  subjects,
  enableSubjects = false,
  onEditStudent,
  onToggleStudent,
  onDeleteStudent,
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
      {students.map((s) => (
        <div
          key={s.id}
          className={`bg-card border border-border/80 rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3 transition-all hover:border-primary/40 ${
            !s.isActive ? "opacity-60 bg-muted/20" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-semibold text-sm text-foreground truncate">
                  {s.firstName} {s.lastName || ""}
                </h3>
                {s.code && (
                  <span className="font-mono text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0" dir="ltr">
                    #{s.code}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {s.grade || (isEn ? "Grade not specified" : "الصف غير محدد")}
              </p>
            </div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                s.isActive
                  ? "bg-emerald-500/10 text-success dark:text-success border-success/20"
                  : "bg-red-500/10 text-destructive dark:text-destructive border-destructive/20"
              }`}
            >
              {s.isActive
                ? t("education.statuses.ACTIVE", isEn ? "Active" : "نشط")
                : t("education.statuses.INACTIVE", isEn ? "Inactive" : "معطل")}
            </span>
          </div>

          {/* Student Phones */}
          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5 font-mono">
            <Phone className="w-3 h-3 text-primary shrink-0" />
            <span>{s.phone || "—"}</span>
            {s.phone2 && (
              <span className="text-[10px] text-primary/90 font-sans bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                {isEn ? "Alt: " : "إضافي: "}{s.phone2}
              </span>
            )}
          </div>

          {/* Student Address */}
          {s.address && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate" title={s.address}>
              <MapPin className="w-3 h-3 text-primary shrink-0" />
              <span className="truncate">{s.address}</span>
            </div>
          )}

          {/* Guardian & Guardian Phones */}
          <div className="text-xs text-muted-foreground space-y-0.5">
            <div>
              {t("education.students.guardianTitle", isEn ? "Guardian:" : "ولي الأمر:")}{" "}
              <span className="text-foreground font-medium">
                {s.customer
                  ? `${s.customer.firstName} ${s.customer.lastName || ""}`
                  : "—"}
              </span>
            </div>
            {s.customer?.phone && (
              <div className="text-[11px] font-mono text-muted-foreground/80 flex flex-wrap items-center gap-1">
                <span>{s.customer.phone}</span>
                {(s.customer as any)?.phone2 && (
                  <span className="text-primary font-normal">
                    | {isEn ? "Alt: " : "إضافي: "}{(s.customer as any).phone2}
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

          <div className="flex items-center gap-2 pt-3 border-t border-border/60">
            <Link
              to={`/admin/education/student/${s.id}`}
              className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-muted/60 text-foreground hover:bg-muted text-xs rounded-lg transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              {t("education.actions.view", isEn ? "View" : "عرض")}
            </Link>
            <button
              type="button"
              onClick={() => onEditStudent(s)}
              className="px-2.5 py-1.5 text-xs text-foreground bg-muted/60 hover:bg-muted rounded-lg transition-colors"
              aria-label={t("education.actions.edit", isEn ? "Edit" : "تعديل")}
              title={t("education.actions.edit", isEn ? "Edit" : "تعديل")}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onToggleStudent(s.id, s.isActive)}
              className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                s.isActive
                  ? "bg-red-500/10 text-destructive hover:bg-destructive/20"
                  : "bg-emerald-500/10 text-success hover:bg-success/20"
              }`}
              aria-label={
                s.isActive
                  ? t("education.actions.deactivate", isEn ? "Deactivate" : "تعطيل")
                  : t("education.actions.activate", isEn ? "Activate" : "تفعيل")
              }
              title={
                s.isActive
                  ? t("education.actions.deactivate", isEn ? "Deactivate" : "تعطيل")
                  : t("education.actions.activate", isEn ? "Activate" : "تفعيل")
              }
            >
              {s.isActive
                ? t("education.actions.deactivate", isEn ? "Deactivate" : "تعطيل")
                : t("education.actions.activate", isEn ? "Activate" : "تفعيل")}
            </button>
            <button
              type="button"
              onClick={() => onDeleteStudent(s.id)}
              className="p-1.5 text-destructive dark:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              aria-label={t("education.actions.delete", isEn ? "Delete" : "حذف")}
              title={t("education.actions.delete", isEn ? "Delete" : "حذف")}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
      {students.length === 0 && (
        <p className="col-span-full text-center py-12 text-xs text-muted-foreground">
          {t("education.students.empty", isEn ? "No enrolled students" : "لا يوجد طلاب مسجلين")}
        </p>
      )}
    </div>
  );
};

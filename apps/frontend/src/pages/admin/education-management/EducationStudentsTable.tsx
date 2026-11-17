import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, Pencil, Trash2, BookOpen, MapPin, ArrowUp, ArrowDown } from "lucide-react";
import type { EducationStudent, EducationSubject } from "./types";

export interface EducationStudentsTableProps {
  students: EducationStudent[];
  subjects: EducationSubject[];
  enableSubjects?: boolean;
  sortBy: string;
  sortDir: "asc" | "desc";
  onSort: (column: string) => void;
  onEdit: (student: EducationStudent) => void;
  onToggleStatus: (id: string, current: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const EducationStudentsTable: React.FC<EducationStudentsTableProps> = ({
  students,
  subjects,
  enableSubjects = false,
  sortBy,
  sortDir,
  onSort,
  onEdit,
  onToggleStatus,
  onDelete,
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-primary inline ms-1 shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 text-primary inline ms-1 shrink-0" />
    );
  };

  return (
    <div className="hidden sm:block bg-card border border-border/80 rounded-xl overflow-hidden shadow-xs" dir={isEn ? "ltr" : "rtl"}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-start border-collapse">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              {/* Student Name & Code */}
              <th
                onClick={() => onSort("name")}
                className="py-3 px-3.5 text-start cursor-pointer hover:text-foreground select-none transition-colors"
              >
                <span>{isEn ? "Student / Code" : "الطالب / الكود"}</span>
                {renderSortIcon("name")}
              </th>

              {/* Grade */}
              <th
                onClick={() => onSort("grade")}
                className="py-3 px-3.5 text-start cursor-pointer hover:text-foreground select-none transition-colors"
              >
                <span>{isEn ? "Grade" : "الصف الدراسي"}</span>
                {renderSortIcon("grade")}
              </th>

              {/* Student Phone */}
              <th className="py-3 px-3.5 text-start">
                <span>{isEn ? "Phone" : "هاتف الطالب"}</span>
              </th>

              {/* Guardian */}
              <th className="py-3 px-3.5 text-start">
                <span>{isEn ? "Guardian" : "ولي الأمر"}</span>
              </th>

              {/* Address */}
              <th className="py-3 px-3.5 text-start">
                <span>{isEn ? "Address" : "العنوان"}</span>
              </th>

              {/* Subjects / Packages */}
              {enableSubjects && (
                <th className="py-3 px-3.5 text-start">
                  <span>{isEn ? "Subjects" : "المواد"}</span>
                </th>
              )}

              {/* Status */}
              <th
                onClick={() => onSort("status")}
                className="py-3 px-3.5 text-center cursor-pointer hover:text-foreground select-none transition-colors"
              >
                <span>{isEn ? "Status" : "الحالة"}</span>
                {renderSortIcon("status")}
              </th>

              {/* Actions */}
              <th className="py-3 px-3.5 text-end">
                <span>{isEn ? "Actions" : "الإجراءات"}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {students.map((s) => (
              <tr
                key={s.id}
                className={`hover:bg-muted/30 transition-colors ${
                  !s.isActive ? "opacity-65 bg-muted/10" : ""
                }`}
              >
                {/* 1. Student Name & Code */}
                <td className="py-2.5 px-3.5 align-middle">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                      {s.firstName?.[0] || "ط"}
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/admin/education/student/${s.id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors truncate block text-xs"
                      >
                        {s.firstName} {s.lastName || ""}
                      </Link>
                      {s.code && (
                        <span
                          className="font-mono text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 inline-block mt-0.5"
                          dir="ltr"
                        >
                          #{s.code}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* 2. Grade */}
                <td className="py-2.5 px-3.5 align-middle text-muted-foreground font-medium">
                  {s.grade || (isEn ? "Not specified" : "غير محدد")}
                </td>

                {/* 3. Student Phone */}
                <td className="py-2.5 px-3.5 align-middle">
                  <div className="font-mono text-[11px] text-muted-foreground flex flex-col gap-0.5" dir="ltr">
                    {s.phone ? (
                      <span className="text-foreground">{s.phone}</span>
                    ) : (
                      <span>—</span>
                    )}
                    {s.phone2 && (
                      <span className="text-[10px] text-primary/80">
                        {isEn ? "Alt: " : "إضافي: "}
                        {s.phone2}
                      </span>
                    )}
                  </div>
                </td>

                {/* 4. Guardian */}
                <td className="py-2.5 px-3.5 align-middle">
                  {s.customer ? (
                    <div className="space-y-0.5">
                      <div className="font-medium text-foreground truncate max-w-[140px]">
                        {s.customer.firstName} {s.customer.lastName || ""}
                      </div>
                      {s.customer.phone && (
                        <div className="font-mono text-[11px] text-muted-foreground" dir="ltr">
                          {s.customer.phone}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>

                {/* 5. Address */}
                <td className="py-2.5 px-3.5 align-middle text-muted-foreground max-w-[150px] truncate" title={s.address || ""}>
                  {s.address ? (
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{s.address}</span>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>

                {/* 6. Subjects */}
                {enableSubjects && (
                  <td className="py-2.5 px-3.5 align-middle">
                    {(s as any).subjects && Array.isArray((s as any).subjects) && (s as any).subjects.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {(s as any).subjects.slice(0, 2).map((sub: any, idx: number) => {
                          const subName =
                            typeof sub === "string"
                              ? subjects.find((x) => x.id === sub)?.name || sub
                              : sub.name || sub.id;
                          return (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20"
                            >
                              <BookOpen className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate max-w-[60px]">{subName}</span>
                            </span>
                          );
                        })}
                        {(s as any).subjects.length > 2 && (
                          <span className="text-[10px] text-muted-foreground self-center">
                            +{(s as any).subjects.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                )}

                {/* 7. Status */}
                <td className="py-2.5 px-3.5 align-middle text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                      s.isActive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                    }`}
                  >
                    {s.isActive
                      ? t("education.statuses.ACTIVE", isEn ? "Active" : "نشط")
                      : t("education.statuses.INACTIVE", isEn ? "Inactive" : "معطل")}
                  </span>
                </td>

                {/* 8. Actions */}
                <td className="py-2.5 px-3.5 align-middle text-end">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* View Profile */}
                    <Link
                      to={`/admin/education/student/${s.id}`}
                      className="p-1.5 bg-muted/60 text-foreground hover:bg-muted hover:text-primary rounded-lg transition-colors"
                      title={t("education.actions.view", isEn ? "View Profile" : "عرض ملف الطالب")}
                      aria-label={t("education.actions.view", isEn ? "View Profile" : "عرض ملف الطالب")}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>

                    {/* Edit Student */}
                    <button
                      type="button"
                      onClick={() => onEdit(s)}
                      className="p-1.5 bg-muted/60 text-foreground hover:bg-muted hover:text-primary rounded-lg transition-colors"
                      title={t("education.actions.edit", isEn ? "Edit" : "تعديل")}
                      aria-label={t("education.actions.edit", isEn ? "Edit" : "تعديل")}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {/* Toggle Status */}
                    <button
                      type="button"
                      onClick={() => onToggleStatus(s.id, s.isActive)}
                      className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                        s.isActive
                          ? "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                          : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                      }`}
                      title={s.isActive ? (isEn ? "Deactivate" : "تعطيل") : (isEn ? "Activate" : "تفعيل")}
                      aria-label={s.isActive ? (isEn ? "Deactivate" : "تعطيل") : (isEn ? "Activate" : "تفعيل")}
                    >
                      {s.isActive
                        ? t("education.actions.deactivate", isEn ? "Deactivate" : "تعطيل")
                        : t("education.actions.activate", isEn ? "Activate" : "تفعيل")}
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => onDelete(s.id)}
                      className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title={t("education.actions.delete", isEn ? "Delete" : "حذف")}
                      aria-label={t("education.actions.delete", isEn ? "Delete" : "حذف")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {students.length === 0 && (
              <tr>
                <td
                  colSpan={enableSubjects ? 8 : 7}
                  className="py-12 text-center text-xs text-muted-foreground"
                >
                  {t("education.students.empty", isEn ? "No enrolled students found" : "لا يوجد طلاب مطابقين للبحث")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

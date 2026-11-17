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
  MessageCircle,
} from "lucide-react";
import type { EducationStudent, EducationSubject } from "./types";

interface EducationStudentsTableProps {
  students: EducationStudent[];
  subjects: EducationSubject[];
  enableSubjects?: boolean;
  onEditStudent: (student: EducationStudent) => void;
  onToggleStudent: (id: string, current: boolean) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
}

export const EducationStudentsTable: React.FC<EducationStudentsTableProps> = ({
  students,
  subjects,
  enableSubjects = false,
  onEditStudent,
  onToggleStudent,
  onDeleteStudent,
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const getWhatsAppLink = (phone?: string) => {
    if (!phone) return null;
    let clean = phone.replace(/[^0-9]/g, "");
    if (clean.startsWith("01")) clean = "2" + clean;
    return `https://wa.me/${clean}`;
  };

  return (
    <div className="bg-card border border-border/80 rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs text-foreground">
          <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground font-semibold">
            <tr>
              <th className="p-3 sm:p-3.5 whitespace-nowrap"># {t("education.students.code", isEn ? "Code" : "الكود")}</th>
              <th className="p-3 sm:p-3.5 whitespace-nowrap">{t("education.students.name", isEn ? "Student Name" : "اسم الطالب")}</th>
              <th className="p-3 sm:p-3.5 whitespace-nowrap">{t("education.students.grade", isEn ? "Grade" : "الصف الدراسي")}</th>
              <th className="p-3 sm:p-3.5 whitespace-nowrap">{t("education.students.phone", isEn ? "Phone" : "الهاتف")}</th>
              <th className="p-3 sm:p-3.5 whitespace-nowrap">{t("education.students.guardianTitle", isEn ? "Guardian" : "ولي الأمر")}</th>
              <th className="p-3 sm:p-3.5 whitespace-nowrap">{t("education.students.address", isEn ? "Address" : "العنوان")}</th>
              {enableSubjects && (
                <th className="p-3 sm:p-3.5 whitespace-nowrap">{t("education.students.subjects", isEn ? "Subjects" : "المواد")}</th>
              )}
              <th className="p-3 sm:p-3.5 whitespace-nowrap">{t("education.students.status", isEn ? "Status" : "الحالة")}</th>
              <th className="p-3 sm:p-3.5 whitespace-nowrap text-center">{t("education.actions.title", isEn ? "Actions" : "إجراءات")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {students.map((s) => {
              const waLink = getWhatsAppLink(s.phone || s.customer?.phone);
              return (
                <tr
                  key={s.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    !s.isActive ? "opacity-60 bg-muted/10" : ""
                  }`}
                >
                  {/* Code */}
                  <td className="p-3 sm:p-3.5 whitespace-nowrap">
                    {s.code ? (
                      <span
                        className="font-mono text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 shrink-0 inline-block"
                        dir="ltr"
                      >
                        #{s.code}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>

                  {/* Student Name */}
                  <td className="p-3 sm:p-3.5 whitespace-nowrap font-medium text-foreground">
                    <Link
                      to={`/admin/education/student/${s.id}`}
                      className="hover:text-primary transition-colors hover:underline inline-flex items-center gap-1.5"
                    >
                      <span className="font-semibold">{s.firstName} {s.lastName || ""}</span>
                    </Link>
                  </td>

                  {/* Grade */}
                  <td className="p-3 sm:p-3.5 whitespace-nowrap text-muted-foreground">
                    {s.grade || (isEn ? "Not specified" : "غير محدد")}
                  </td>

                  {/* Phone */}
                  <td className="p-3 sm:p-3.5 whitespace-nowrap font-mono tabular-nums">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-primary shrink-0" />
                      <span>{s.phone || "—"}</span>
                      {s.phone2 && (
                        <span className="text-[10px] text-primary/90 font-sans bg-primary/10 px-1 py-0.2 rounded border border-primary/20">
                          {isEn ? "Alt: " : "إضافي: "}{s.phone2}
                        </span>
                      )}
                      {waLink && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 p-1 rounded hover:bg-emerald-500/10 transition-colors"
                          title={isEn ? "WhatsApp chat" : "محادثة واتساب"}
                          aria-label={isEn ? "WhatsApp chat" : "محادثة واتساب"}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Guardian */}
                  <td className="p-3 sm:p-3.5 whitespace-nowrap">
                    {s.customer ? (
                      <div>
                        <span className="font-medium text-foreground">
                          {s.customer.firstName} {s.customer.lastName || ""}
                        </span>
                        {s.customer.phone && (
                          <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                            <span>{s.customer.phone}</span>
                            {(s.customer as any).phone2 && (
                              <span className="text-primary font-normal text-[10px]">
                                | {(s.customer as any).phone2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>

                  {/* Address */}
                  <td className="p-3 sm:p-3.5 max-w-[180px] truncate text-muted-foreground" title={s.address || ""}>
                    {s.address ? (
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-primary shrink-0" />
                        <span className="truncate">{s.address}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>

                  {/* Subjects */}
                  {enableSubjects && (
                    <td className="p-3 sm:p-3.5 whitespace-nowrap">
                      {(s as any).subjects && Array.isArray((s as any).subjects) && (s as any).subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
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
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>
                  )}

                  {/* Status */}
                  <td className="p-3 sm:p-3.5 whitespace-nowrap">
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

                  {/* Actions */}
                  <td className="p-3 sm:p-3.5 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        to={`/admin/education/student/${s.id}`}
                        className="p-1.5 text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted rounded-lg transition-colors"
                        title={t("education.actions.view", isEn ? "View" : "عرض")}
                        aria-label={t("education.actions.view", isEn ? "View" : "عرض")}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => onEditStudent(s)}
                        className="p-1.5 text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted rounded-lg transition-colors"
                        title={t("education.actions.edit", isEn ? "Edit" : "تعديل")}
                        aria-label={t("education.actions.edit", isEn ? "Edit" : "تعديل")}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleStudent(s.id, s.isActive)}
                        className={`p-1.5 text-xs rounded-lg transition-colors ${
                          s.isActive
                            ? "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                            : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                        }`}
                        title={
                          s.isActive
                            ? t("education.actions.deactivate", isEn ? "Deactivate" : "تعطيل")
                            : t("education.actions.activate", isEn ? "Activate" : "تفعيل")
                        }
                        aria-label={
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
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title={t("education.actions.delete", isEn ? "Delete" : "حذف")}
                        aria-label={t("education.actions.delete", isEn ? "Delete" : "حذف")}
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
      {students.length === 0 && (
        <div className="py-12 text-center text-xs text-muted-foreground">
          {t("education.students.empty", isEn ? "No enrolled students" : "لا يوجد طلاب مسجلين")}
        </div>
      )}
    </div>
  );
};

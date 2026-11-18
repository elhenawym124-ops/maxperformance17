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
  selectedIds?: Set<string>;
  onSort: (column: string) => void;
  onSelectAll?: () => void;
  onSelectStudent?: (id: string) => void;
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
  selectedIds = new Set(),
  onSort,
  onSelectAll,
  onSelectStudent,
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

  const isAllSelected = students.length > 0 && students.every((s) => selectedIds.has(s.id));
  const isSomeSelected = students.some((s) => selectedIds.has(s.id)) && !isAllSelected;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isEn ? "en-US" : "ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "—";
    return `${amount.toLocaleString(isEn ? "en-US" : "ar-EG")} ${isEn ? "EGP" : "ج.م"}`;
  };

  return (
    <div className="hidden sm:block bg-card border border-border/80 rounded-xl overflow-hidden shadow-xs" dir={isEn ? "ltr" : "rtl"}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-start border-collapse">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              {/* Checkbox */}
              <th className="py-3 px-3 text-center w-9">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isSomeSelected;
                  }}
                  onChange={() => onSelectAll && onSelectAll()}
                  aria-label={isEn ? "Select all students" : "تحديد كل الطلاب"}
                  className="rounded border-border text-primary focus:ring-primary/20 h-3.5 w-3.5 cursor-pointer"
                />
              </th>

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

              {/* Package */}
              <th className="py-3 px-3.5 text-start">
                <span>{isEn ? "Package" : "الباقة"}</span>
              </th>

              {/* Teacher */}
              <th className="py-3 px-3.5 text-start">
                <span>{isEn ? "Teacher" : "المدرّس"}</span>
              </th>

              {/* Registration Date */}
              <th
                onClick={() => onSort("createdAt")}
                className="py-3 px-3.5 text-start cursor-pointer hover:text-foreground select-none transition-colors"
              >
                <span>{isEn ? "Reg. Date" : "تاريخ التسجيل"}</span>
                {renderSortIcon("createdAt")}
              </th>

              {/* Paid / Remaining */}
              <th className="py-3 px-3.5 text-start">
                <span>{isEn ? "Paid / Due" : "المدفوع / المتبقي"}</span>
              </th>

              {/* Payment Status */}
              <th className="py-3 px-3.5 text-center">
                <span>{isEn ? "Payment" : "حالة السداد"}</span>
              </th>

              {/* Student & Guardian Phone */}
              <th className="py-3 px-3.5 text-start">
                <span>{isEn ? "Phone / Guardian" : "الهاتف / ولي الأمر"}</span>
              </th>

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
            {students.map((s) => {
              const activeEnrollment = s.enrollments?.[0];
              const packageName = activeEnrollment?.package?.name || "—";
              const teacherName = activeEnrollment?.teacher?.name || "—";
              const packagePrice = activeEnrollment?.package?.price ?? 0;
              const amountPaid = activeEnrollment?.amountPaid ?? 0;
              const remainingAmount = Math.max(0, packagePrice - amountPaid);
              const pStatus = activeEnrollment?.paymentStatus || "PENDING";
              const isSelected = selectedIds.has(s.id);

              return (
                <tr
                  key={s.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    isSelected ? "bg-primary/5" : ""
                  } ${!s.isActive ? "opacity-65 bg-muted/10" : ""}`}
                >
                  {/* Checkbox */}
                  <td className="py-2.5 px-3 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectStudent && onSelectStudent(s.id)}
                      aria-label={`${isEn ? "Select student" : "تحديد الطالب"} ${s.firstName}`}
                      className="rounded border-border text-primary focus:ring-primary/20 h-3.5 w-3.5 cursor-pointer"
                    />
                  </td>

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

                  {/* 3. Package */}
                  <td className="py-2.5 px-3.5 align-middle font-medium text-foreground max-w-[130px] truncate" title={packageName}>
                    {activeEnrollment?.package ? (
                      <span className="inline-flex items-center gap-1 truncate text-xs">
                        <BookOpen className="w-3 h-3 text-primary shrink-0" />
                        <span className="truncate">{packageName}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* 4. Teacher */}
                  <td className="py-2.5 px-3.5 align-middle text-muted-foreground max-w-[120px] truncate" title={teacherName}>
                    {teacherName}
                  </td>

                  {/* 5. Registration Date */}
                  <td className="py-2.5 px-3.5 align-middle text-muted-foreground tabular-nums text-[11px]" dir="ltr">
                    {formatDate((s as any).createdAt || activeEnrollment?.enrollmentDate)}
                  </td>

                  {/* 6. Paid / Remaining */}
                  <td className="py-2.5 px-3.5 align-middle">
                    {activeEnrollment ? (
                      <div className="flex flex-col text-[11px] tabular-nums" dir="ltr">
                        <span className="text-emerald-600 font-semibold">{formatCurrency(amountPaid)}</span>
                        {remainingAmount > 0 && (
                          <span className="text-amber-600 text-[10px]">{isEn ? "Due: " : "متبقي: "}{formatCurrency(remainingAmount)}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* 7. Payment Status */}
                  <td className="py-2.5 px-3.5 align-middle text-center">
                    {activeEnrollment ? (
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          pStatus === "PAID"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : pStatus === "PARTIAL"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : "bg-red-500/10 text-red-600 border-red-500/20"
                        }`}
                      >
                        {pStatus === "PAID"
                          ? (isEn ? "Paid" : "مدفوع")
                          : pStatus === "PARTIAL"
                          ? (isEn ? "Partial" : "جزئي")
                          : (isEn ? "Unpaid" : "غير مسدد")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* 8. Phone / Guardian */}
                  <td className="py-2.5 px-3.5 align-middle">
                    <div className="flex flex-col gap-0.5">
                      {s.phone ? (
                        <span className="font-mono text-[11px] text-foreground" dir="ltr">{s.phone}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                      {s.customer && (
                        <span className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                          {s.customer.firstName} {s.customer.lastName || ""}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 9. Status */}
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

                  {/* 10. Actions */}
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
              );
            })}

            {students.length === 0 && (
              <tr>
                <td
                  colSpan={11}
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

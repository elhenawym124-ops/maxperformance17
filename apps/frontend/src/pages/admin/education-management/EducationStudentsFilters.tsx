import React from "react";
import { useTranslation } from "react-i18next";
import { Search, Plus, Download, RotateCcw, ArrowUpDown } from "lucide-react";
import type { EducationSubject, EducationPackage, EducationTeacher } from "./types";

export interface StudentFilterState {
  search: string;
  status: string; // 'all' | 'active' | 'inactive'
  grade: string;
  subjectId: string;
  packageId: string;
  enrollmentStatus?: string; // 'all' | 'enrolled' | 'not_enrolled'
  teacherId?: string;
  paymentState?: string; // 'all' | 'paid' | 'partial' | 'overdue'
  dateFrom?: string;
  dateTo?: string;
  level?: string; // '1'..'15'
  groupId?: string;
  sortBy: string; // 'name' | 'code' | 'grade' | 'status' | 'createdAt' | 'remaining'
  sortDir: "asc" | "desc";
}

export interface EducationStudentsFiltersProps {
  filters: StudentFilterState;
  onFilterChange: (updates: Partial<StudentFilterState>) => void;
  onResetFilters: () => void;
  gradesList: string[];
  subjects: EducationSubject[];
  packages?: EducationPackage[];
  teachers?: EducationTeacher[];
  enableSubjects?: boolean;
  totalStudents: number;
  filteredCount: number;
  onOpenAddModal: () => void;
  onExport: () => void;
}

export const EducationStudentsFilters: React.FC<EducationStudentsFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  gradesList,
  subjects,
  packages = [],
  teachers = [],
  enableSubjects = false,
  totalStudents,
  filteredCount,
  onOpenAddModal,
  onExport,
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const hasActiveFilters =
    Boolean(filters.search?.trim()) ||
    (filters.status && filters.status !== "all") ||
    Boolean(filters.grade) ||
    Boolean(filters.subjectId) ||
    Boolean(filters.packageId) ||
    (filters.enrollmentStatus && filters.enrollmentStatus !== "all") ||
    Boolean(filters.teacherId && filters.teacherId !== "all") ||
    Boolean(filters.paymentState && filters.paymentState !== "all") ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    Boolean(filters.level && filters.level !== "all") ||
    Boolean(filters.groupId && filters.groupId !== "all");

  return (
    <div className="space-y-3 bg-card border border-border/80 rounded-xl p-3 sm:p-4 shadow-xs" dir={isEn ? "ltr" : "rtl"}>
      {/* Top Header Row: Title, Counter, and Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className="text-base font-bold text-foreground">
            {t("education.students.title", isEn ? "Students Management" : "إدارة الطلاب")}
          </h2>

          {/* Matching Counter Badge: عداد مطابق X من Y */}
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <span className="font-mono">{filteredCount}</span>
            <span>{isEn ? "of" : "من"}</span>
            <span className="font-mono">{totalStudents}</span>
            <span>{isEn ? "students" : "طالب"}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Export Button */}
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-muted/70 hover:bg-muted text-foreground text-xs font-medium rounded-lg border border-border/80 transition-colors shrink-0"
            title={isEn ? "Export filtered students as CSV" : "تصدير الطلاب المفلترين كـ CSV"}
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{isEn ? "Export CSV" : "تصدير CSV"}</span>
          </button>

          {/* Add Student Button */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("education.students.addStudent", isEn ? "Add Student" : "إضافة طالب")}
          </button>
        </div>
      </div>

      {/* Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
        {/* 1. Search Input */}
        <div className="relative sm:col-span-2">
          <Search
            className={`w-3.5 h-3.5 absolute ${isEn ? "left-3" : "right-3"} top-2.5 text-muted-foreground`}
          />
          <input
            className={`bg-background border border-input rounded-lg ${
              isEn ? "pl-9 pr-3" : "pr-9 pl-3"
            } py-1.5 text-xs text-foreground w-full focus:outline-none focus:ring-1 focus:ring-primary`}
            placeholder={t(
              "education.students.search",
              isEn ? "Search by name, code, phone, guardian..." : "بحث بالاسم، الكود، الهاتف، ولي الأمر..."
            )}
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
          />
        </div>

        {/* 2. Status Filter */}
        <div>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label={isEn ? "Status Filter" : "فلتر الحالة"}
          >
            <option value="all">{isEn ? "All Statuses" : "جميع الحالات"}</option>
            <option value="active">{isEn ? "Active Only" : "نشط فقط"}</option>
            <option value="inactive">{isEn ? "Inactive Only" : "معطل فقط"}</option>
          </select>
        </div>

        {/* 3. Grade Filter */}
        <div>
          <select
            value={filters.grade}
            onChange={(e) => onFilterChange({ grade: e.target.value })}
            className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label={isEn ? "Grade Filter" : "فلتر الصف"}
          >
            <option value="">{isEn ? "All Grades" : "جميع الصفوف"}</option>
            {gradesList.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Subject or Package Filter */}
        <div>
          {enableSubjects ? (
            <select
              value={filters.subjectId}
              onChange={(e) => onFilterChange({ subjectId: e.target.value })}
              className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label={isEn ? "Subject Filter" : "فلتر المادة"}
            >
              <option value="">{isEn ? "All Subjects" : "جميع المواد"}</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={filters.packageId}
              onChange={(e) => onFilterChange({ packageId: e.target.value })}
              className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label={isEn ? "Package Filter" : "فلتر الكورس/الباقة"}
            >
              <option value="">{isEn ? "All Packages" : "جميع الباقات والكورسات"}</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 5. Teacher Filter */}
        <div>
          <select
            value={filters.teacherId || ""}
            onChange={(e) => onFilterChange({ teacherId: e.target.value })}
            className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label={isEn ? "Teacher Filter" : "فلتر المدرّس"}
          >
            <option value="">{isEn ? "All Teachers" : "جميع المدرّسين"}</option>
            {teachers.map((teach) => (
              <option key={teach.id} value={teach.id}>
                {teach.name}
              </option>
            ))}
          </select>
        </div>

        {/* 6. Payment State Filter */}
        <div>
          <select
            value={filters.paymentState || "all"}
            onChange={(e) => onFilterChange({ paymentState: e.target.value })}
            className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label={isEn ? "Payment Status Filter" : "فلتر حالة السداد"}
          >
            <option value="all">{isEn ? "All Payment Statuses" : "كل حالات السداد"}</option>
            <option value="paid">{isEn ? "Fully Paid" : "مدفوع بالكامل"}</option>
            <option value="partial">{isEn ? "Partially Paid" : "مدفوع جزئياً"}</option>
            <option value="overdue">{isEn ? "Pending / Overdue" : "معلق / مستحق"}</option>
          </select>
        </div>

        {/* 7. Level Filter (1..15) */}
        <div>
          <select
            value={filters.level || ""}
            onChange={(e) => onFilterChange({ level: e.target.value })}
            className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label={isEn ? "Level Filter" : "فلتر المستوى"}
          >
            <option value="">{isEn ? "All Levels" : "جميع المستويات"}</option>
            {Array.from({ length: 15 }, (_, i) => i + 1).map((lvl) => (
              <option key={lvl} value={String(lvl)}>
                {isEn ? `Level ${lvl}` : `المستوى ${lvl}`}
              </option>
            ))}
          </select>
        </div>

        {/* 8. Date From */}
        <div>
          <input
            type="date"
            value={filters.dateFrom || ""}
            onChange={(e) => onFilterChange({ dateFrom: e.target.value })}
            className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            title={isEn ? "Registration Date From" : "تاريخ التسجيل من"}
            aria-label={isEn ? "Registration Date From" : "تاريخ التسجيل من"}
          />
        </div>

        {/* 9. Date To */}
        <div>
          <input
            type="date"
            value={filters.dateTo || ""}
            onChange={(e) => onFilterChange({ dateTo: e.target.value })}
            className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            title={isEn ? "Registration Date To" : "تاريخ التسجيل إلى"}
            aria-label={isEn ? "Registration Date To" : "تاريخ التسجيل إلى"}
          />
        </div>
      </div>

      {/* Sorting & Reset Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-muted-foreground flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" />
            <span>{isEn ? "Sort by:" : "الترتيب حسب:"}</span>
          </span>

          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value })}
            className="bg-background border border-input rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label={isEn ? "Sort by" : "الترتيب حسب"}
          >
            <option value="name">{isEn ? "Student Name" : "اسم الطالب"}</option>
            <option value="code">{isEn ? "Student Code" : "كود الطالب"}</option>
            <option value="grade">{isEn ? "Grade" : "الصف الدراسي"}</option>
            <option value="status">{isEn ? "Status (Active/Inactive)" : "الحالة (نشط/معطل)"}</option>
            <option value="createdAt">{isEn ? "Registration Date" : "تاريخ التسجيل"}</option>
            <option value="remaining">{isEn ? "Remaining Amount" : "المتبقي"}</option>
          </select>

          <button
            type="button"
            onClick={() => onFilterChange({ sortDir: filters.sortDir === "asc" ? "desc" : "asc" })}
            className="inline-flex items-center gap-1 px-2 py-1 bg-muted/60 hover:bg-muted text-foreground rounded-md border border-border/80 transition-colors"
            title={isEn ? "Toggle sort order" : "تبديل اتجاه الترتيب (تصاعدي/تنازلي)"}
          >
            <span>{filters.sortDir === "asc" ? "↑ " + (isEn ? "Asc" : "تصاعدي") : "↓ " + (isEn ? "Desc" : "تنازلي")}</span>
          </button>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isEn ? "Reset Filters" : "إعادة تعيين الفلاتر"}</span>
          </button>
        )}
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  Plus,
  Table as TableIcon,
  LayoutGrid,
} from "lucide-react";
import type { EducationStudent, Customer, EducationSubject } from "./types";
import { StudentModal } from "./StudentModal";
import { EducationStudentsTable } from "./EducationStudentsTable";
import { EducationStudentsCards } from "./EducationStudentsCards";

export interface EducationStudentsTabProps {
  students: EducationStudent[];
  subjects: EducationSubject[];
  enableSubjects?: boolean;
  customers: Customer[];
  customerResults: Customer[];
  studentSearch: string;
  setStudentSearch: (q: string) => void;
  studentModal: Partial<EducationStudent> | null | undefined;
  setStudentModal: (s: Partial<EducationStudent> | null | undefined) => void;
  searchCustomers: (q: string) => Promise<void>;
  handleSaveStudent: (d: Partial<EducationStudent>) => Promise<EducationStudent | null | void>;
  handleToggleStudent: (id: string, current: boolean) => Promise<void>;
  handleDeleteStudent: (id: string) => Promise<void>;
}

export const EducationStudentsTab: React.FC<EducationStudentsTabProps> = ({
  students,
  subjects,
  enableSubjects = false,
  customers,
  customerResults,
  studentSearch,
  setStudentSearch,
  studentModal,
  setStudentModal,
  searchCustomers,
  handleSaveStudent,
  handleToggleStudent,
  handleDeleteStudent,
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const [viewMode, setViewMode] = useState<"table" | "grid">(() => {
    try {
      const saved = localStorage.getItem("education_students_view_mode");
      return saved === "grid" ? "grid" : "table";
    } catch {
      return "table";
    }
  });

  const handleViewModeChange = (mode: "table" | "grid") => {
    setViewMode(mode);
    try {
      localStorage.setItem("education_students_view_mode", mode);
    } catch {
      // ignore storage error
    }
  };

  const q = studentSearch.toLowerCase().trim();
  const codeQ = q.startsWith("#") ? q.slice(1).trim() : q;
  const filtered = students.filter(
    (s) =>
      !q ||
      (s.code || "").toLowerCase().includes(codeQ) ||
      (s.firstName || "").toLowerCase().includes(q) ||
      (s.lastName || "").toLowerCase().includes(q) ||
      (s.phone || "").toLowerCase().includes(q) ||
      (s.phone2 || "").toLowerCase().includes(q) ||
      (s.address || "").toLowerCase().includes(q) ||
      (s.customer?.firstName || "").toLowerCase().includes(q) ||
      (s.customer?.lastName || "").toLowerCase().includes(q) ||
      (s.customer?.phone || "").toLowerCase().includes(q) ||
      (s.customer?.phone2 || "").toLowerCase().includes(q)
  );

  return (
    <div className="space-y-4" dir={isEn ? "ltr" : "rtl"}>
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-foreground">
            {t("education.students.title", isEn ? "Students Management" : "إدارة الطلاب")}
          </h2>
          <span className="font-mono tabular-nums text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {filtered.length}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64 min-w-[180px]">
            <Search className={`w-3.5 h-3.5 absolute ${isEn ? "left-3" : "right-3"} top-2.5 text-muted-foreground`} />
            <input
              className={`bg-background border border-input rounded-lg ${isEn ? "pl-9 pr-3" : "pr-9 pl-3"} py-1.5 text-xs text-foreground w-full focus:outline-none focus:ring-1 focus:ring-primary`}
              placeholder={t("education.students.search", isEn ? "Search student by name, code, or phone..." : "بحث عن طالب بالاسم، الكود، أو الهاتف...")}
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
          </div>

          {/* View Mode Switcher (Table / Cards) */}
          <div className="inline-flex items-center p-0.5 rounded-lg border border-border/80 bg-muted/40 shrink-0">
            <button
              type="button"
              onClick={() => handleViewModeChange("table")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === "table"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={isEn ? "Table View" : "عرض جدول"}
              aria-label={isEn ? "Table View" : "عرض جدول"}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isEn ? "Table" : "جدول"}</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange("grid")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={isEn ? "Cards View" : "عرض بطاقات"}
              aria-label={isEn ? "Cards View" : "عرض بطاقات"}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isEn ? "Cards" : "بطاقات"}</span>
            </button>
          </div>

          {/* Add Student CTA */}
          <button
            type="button"
            onClick={() => setStudentModal({})}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 shadow-xs shrink-0 transition-transform active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("education.students.addStudent", isEn ? "Add Student" : "إضافة طالب")}
          </button>
        </div>
      </div>

      {/* Main View: Table Mode (Default) vs Cards */}
      {viewMode === "table" ? (
        <EducationStudentsTable
          students={filtered}
          subjects={subjects}
          enableSubjects={enableSubjects}
          onEditStudent={(s) => setStudentModal(s)}
          onToggleStudent={handleToggleStudent}
          onDeleteStudent={handleDeleteStudent}
        />
      ) : (
        <EducationStudentsCards
          students={filtered}
          subjects={subjects}
          enableSubjects={enableSubjects}
          onEditStudent={(s) => setStudentModal(s)}
          onToggleStudent={handleToggleStudent}
          onDeleteStudent={handleDeleteStudent}
        />
      )}

      {studentModal !== undefined && (
        <StudentModal
          key={studentModal?.id || "new"}
          student={studentModal}
          subjects={subjects}
          enableSubjects={enableSubjects}
          customers={customers}
          customerResults={customerResults}
          onCustomerSearch={searchCustomers}
          onClose={() => setStudentModal(undefined)}
          onSave={handleSaveStudent}
        />
      )}
    </div>
  );
};

import React, { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { EducationStudent, Customer, EducationSubject, EducationPackage, EducationTeacher } from "./types";
import { StudentModal } from "./StudentModal";
import { EducationStudentsFilters, StudentFilterState } from "./EducationStudentsFilters";
import { EducationStudentsTable } from "./EducationStudentsTable";
import { EducationStudentsMobileCards } from "./EducationStudentsMobileCards";
import { EducationStudentsPagination } from "./EducationStudentsPagination";

export interface EducationStudentsTabProps {
  students: EducationStudent[];
  subjects: EducationSubject[];
  packages?: EducationPackage[];
  teachers?: EducationTeacher[];
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
  packages = [],
  teachers = [],
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
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Sync State with URL Search Params
  const filterState: StudentFilterState = useMemo(() => ({
    search: searchParams.get("q") ?? studentSearch ?? "",
    status: searchParams.get("status") ?? "all",
    grade: searchParams.get("grade") ?? "",
    subjectId: searchParams.get("subjectId") ?? "",
    packageId: searchParams.get("packageId") ?? "",
    enrollmentStatus: searchParams.get("enrollment") ?? "all",
    sortBy: searchParams.get("sortBy") ?? "name",
    sortDir: (searchParams.get("sortDir") as "asc" | "desc") ?? "asc",
  }), [searchParams, studentSearch]);

  const currentPage = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.max(5, Math.min(100, Number(searchParams.get("pageSize") || 10)));

  // Helper to update search params
  const updateParams = useCallback((updates: Record<string, string | number | null | undefined>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, val]) => {
        if (val === null || val === undefined || val === "" || val === "all") {
          next.delete(key);
        } else {
          next.set(key, String(val));
        }
      });
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Handle filter changes (resets to page 1)
  const handleFilterChange = useCallback((updates: Partial<StudentFilterState>) => {
    const paramUpdates: Record<string, string | number | null> = { page: 1 };
    if (updates.search !== undefined) {
      paramUpdates.q = updates.search;
      setStudentSearch(updates.search);
    }
    if (updates.status !== undefined) paramUpdates.status = updates.status;
    if (updates.grade !== undefined) paramUpdates.grade = updates.grade;
    if (updates.subjectId !== undefined) paramUpdates.subjectId = updates.subjectId;
    if (updates.packageId !== undefined) paramUpdates.packageId = updates.packageId;
    if (updates.enrollmentStatus !== undefined) paramUpdates.enrollment = updates.enrollmentStatus;
    if (updates.sortBy !== undefined) paramUpdates.sortBy = updates.sortBy;
    if (updates.sortDir !== undefined) paramUpdates.sortDir = updates.sortDir;

    updateParams(paramUpdates);
  }, [setStudentSearch, updateParams]);

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    setStudentSearch("");
    setSearchParams((prev) => {
      const next = new URLSearchParams();
      // preserve active tab if present in URL
      const tab = prev.get("tab");
      if (tab) next.set("tab", tab);
      return next;
    }, { replace: true });
  }, [setStudentSearch, setSearchParams]);

  // Handle Sort Toggle from Table Header
  const handleSortHeader = useCallback((column: string) => {
    if (filterState.sortBy === column) {
      handleFilterChange({ sortDir: filterState.sortDir === "asc" ? "desc" : "asc" });
    } else {
      handleFilterChange({ sortBy: column, sortDir: "asc" });
    }
  }, [filterState.sortBy, filterState.sortDir, handleFilterChange]);

  // Extract unique grades list from students for filter dropdown
  const gradesList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.grade && s.grade.trim()) set.add(s.grade.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
  }, [students]);

  // 2. Filter Students
  const filteredStudents = useMemo(() => {
    const q = filterState.search.toLowerCase().trim();
    const codeQ = q.startsWith("#") ? q.slice(1).trim() : q;

    return students.filter((s) => {
      // Search query filter
      if (q) {
        const matchesQuery =
          (s.code || "").toLowerCase().includes(codeQ) ||
          (s.firstName || "").toLowerCase().includes(q) ||
          (s.lastName || "").toLowerCase().includes(q) ||
          (s.phone || "").toLowerCase().includes(q) ||
          (s.phone2 || "").toLowerCase().includes(q) ||
          (s.address || "").toLowerCase().includes(q) ||
          (s.customer?.firstName || "").toLowerCase().includes(q) ||
          (s.customer?.lastName || "").toLowerCase().includes(q) ||
          (s.customer?.phone || "").toLowerCase().includes(q) ||
          (s.customer?.phone2 || "").toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Status filter
      if (filterState.status === "active" && !s.isActive) return false;
      if (filterState.status === "inactive" && s.isActive) return false;

      // Grade filter
      if (filterState.grade && (s.grade || "").trim() !== filterState.grade.trim()) {
        return false;
      }

      // Subject filter
      if (filterState.subjectId) {
        const hasSub = (s as any).subjects?.some((sub: any) =>
          typeof sub === "string" ? sub === filterState.subjectId : sub.id === filterState.subjectId
        );
        if (!hasSub) return false;
      }

      // Enrollment filter
      if (filterState.enrollmentStatus === "enrolled") {
        const enrolledCount = s.enrollments?.length ?? 0;
        if (enrolledCount === 0) return false;
      } else if (filterState.enrollmentStatus === "not_enrolled") {
        const enrolledCount = s.enrollments?.length ?? 0;
        if (enrolledCount > 0) return false;
      }

      return true;
    });
  }, [students, filterState]);

  // 3. Sort Students
  const sortedStudents = useMemo(() => {
    const list = [...filteredStudents];
    const { sortBy, sortDir } = filterState;
    const factor = sortDir === "asc" ? 1 : -1;

    list.sort((a, b) => {
      if (sortBy === "code") {
        const codeA = Number(a.code) || 0;
        const codeB = Number(b.code) || 0;
        if (codeA && codeB) return (codeA - codeB) * factor;
        return (a.code || "").localeCompare(b.code || "") * factor;
      }
      if (sortBy === "grade") {
        return (a.grade || "").localeCompare(b.grade || "", "ar") * factor;
      }
      if (sortBy === "status") {
        return (Number(b.isActive) - Number(a.isActive)) * factor;
      }
      // default: sortBy === 'name'
      const nameA = `${a.firstName} ${a.lastName || ""}`.trim();
      const nameB = `${b.firstName} ${b.lastName || ""}`.trim();
      return nameA.localeCompare(nameB, "ar") * factor;
    });

    return list;
  }, [filteredStudents, filterState.sortBy, filterState.sortDir]);

  // 4. Paginate Students
  const totalPages = Math.max(1, Math.ceil(sortedStudents.length / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);
  const paginatedStudents = useMemo(() => {
    const start = (effectivePage - 1) * pageSize;
    return sortedStudents.slice(start, start + pageSize);
  }, [sortedStudents, effectivePage, pageSize]);

  // 5. CSV Export with UTF-8 BOM
  const handleExportCsv = useCallback(() => {
    const headers = [
      "كود الطالب",
      "الاسم الأول",
      "اسم العائلة",
      "الصف الدراسي",
      "هاتف الطالب",
      "هاتف إضافي",
      "العنوان",
      "ولي الأمر",
      "هاتف ولي الأمر",
      "الحالة",
    ];

    const escapeCsv = (val: any) => {
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = sortedStudents.map((s) => [
      escapeCsv(s.code || ""),
      escapeCsv(s.firstName || ""),
      escapeCsv(s.lastName || ""),
      escapeCsv(s.grade || ""),
      escapeCsv(s.phone || ""),
      escapeCsv(s.phone2 || ""),
      escapeCsv(s.address || ""),
      escapeCsv(s.customer ? `${s.customer.firstName} ${s.customer.lastName || ""}`.trim() : ""),
      escapeCsv(s.customer?.phone || ""),
      escapeCsv(s.isActive ? "نشط" : "معطل"),
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `students_export_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [sortedStudents]);

  return (
    <div className="space-y-3.5">
      {/* 1. Filters & Action Bar */}
      <EducationStudentsFilters
        filters={filterState}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        gradesList={gradesList}
        subjects={subjects}
        packages={packages}
        enableSubjects={enableSubjects}
        totalStudents={students.length}
        filteredCount={sortedStudents.length}
        onOpenAddModal={() => setStudentModal({})}
        onExport={handleExportCsv}
      />

      {/* 2. Desktop Table View */}
      <EducationStudentsTable
        students={paginatedStudents}
        subjects={subjects}
        enableSubjects={enableSubjects}
        sortBy={filterState.sortBy}
        sortDir={filterState.sortDir}
        onSort={handleSortHeader}
        onEdit={(student) => setStudentModal(student)}
        onToggleStatus={handleToggleStudent}
        onDelete={handleDeleteStudent}
      />

      {/* 3. Mobile Card View */}
      <EducationStudentsMobileCards
        students={paginatedStudents}
        subjects={subjects}
        enableSubjects={enableSubjects}
        onEdit={(student) => setStudentModal(student)}
        onToggleStatus={handleToggleStudent}
        onDelete={handleDeleteStudent}
      />

      {/* 4. Pagination */}
      <EducationStudentsPagination
        currentPage={effectivePage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={students.length}
        filteredCount={sortedStudents.length}
        onPageChange={(page) => updateParams({ page })}
        onPageSizeChange={(newSize) => updateParams({ pageSize: newSize, page: 1 })}
      />

      {/* 5. Add / Edit Modal */}
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

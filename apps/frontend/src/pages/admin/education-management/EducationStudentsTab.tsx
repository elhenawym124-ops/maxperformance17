import React, { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getCompanyId } from "../../../utils/storefrontApi";
import {
  UserCheck,
  UserX,
  Users,
  Send,
  RotateCcw,
  AlertCircle,
  Loader2,
  FolderPlus
} from "lucide-react";
import type {
  EducationStudent,
  Customer,
  EducationSubject,
  EducationPackage,
  EducationTeacher
} from "./types";
import { api, fetchJson, getAuthHeaders } from "./api";
import { toast } from "sonner";
import { StudentModal } from "./StudentModal";
import { EducationStudentsFilters, StudentFilterState } from "./EducationStudentsFilters";
import { EducationStudentsTable } from "./EducationStudentsTable";
import { EducationStudentsMobileCards } from "./EducationStudentsMobileCards";
import { EducationStudentsPagination } from "./EducationStudentsPagination";

export interface EducationStudentsTabProps {
  students: EducationStudent[];
  studentsTotal?: number;
  studentsTotalPages?: number;
  studentsLoading?: boolean;
  onStudentsQuery?: (query: any) => Promise<any>;
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
  studentsTotal,
  studentsTotalPages = 1,
  studentsLoading = false,
  onStudentsQuery,
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
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Sync State with URL Search Params
  const filterState: StudentFilterState = useMemo(() => ({
    search: searchParams.get("q") ?? studentSearch ?? "",
    status: searchParams.get("status") ?? "all",
    grade: searchParams.get("grade") ?? "",
    subjectId: searchParams.get("subjectId") ?? "",
    packageId: searchParams.get("packageId") ?? "",
    enrollmentStatus: searchParams.get("enrollment") ?? "all",
    teacherId: searchParams.get("teacherId") ?? "",
    paymentState: searchParams.get("paymentState") ?? "all",
    dateFrom: searchParams.get("dateFrom") ?? "",
    dateTo: searchParams.get("dateTo") ?? "",
    level: searchParams.get("level") ?? "",
    groupId: searchParams.get("groupId") ?? "",
    sortBy: searchParams.get("sortBy") ?? "createdAt",
    sortDir: (searchParams.get("sortDir") as "asc" | "desc") ?? "desc",
  }), [searchParams, studentSearch]);

  const currentPage = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.max(5, Math.min(100, Number(searchParams.get("pageSize") || 25)));

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
    if (updates.teacherId !== undefined) paramUpdates.teacherId = updates.teacherId;
    if (updates.paymentState !== undefined) paramUpdates.paymentState = updates.paymentState;
    if (updates.dateFrom !== undefined) paramUpdates.dateFrom = updates.dateFrom;
    if (updates.dateTo !== undefined) paramUpdates.dateTo = updates.dateTo;
    if (updates.level !== undefined) paramUpdates.level = updates.level;
    if (updates.groupId !== undefined) paramUpdates.groupId = updates.groupId;
    if (updates.sortBy !== undefined) paramUpdates.sortBy = updates.sortBy;
    if (updates.sortDir !== undefined) paramUpdates.sortDir = updates.sortDir;

    updateParams(paramUpdates);
  }, [setStudentSearch, updateParams]);

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    setStudentSearch("");
    setSearchParams((prev) => {
      const next = new URLSearchParams();
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

  // Build current query object for backend
  const buildCurrentQuery = useCallback(() => {
    const query: Record<string, any> = {
      page: currentPage,
      pageSize,
      sortBy: filterState.sortBy,
      sortDir: filterState.sortDir,
    };
    if (filterState.search?.trim()) query.search = filterState.search.trim();
    if (filterState.status && filterState.status !== "all") query.isActive = filterState.status;
    if (filterState.grade && filterState.grade !== "all") query.grade = filterState.grade;
    if (filterState.level && filterState.level !== "all") query.level = filterState.level;
    if (filterState.subjectId && filterState.subjectId !== "all") query.subject = filterState.subjectId;
    if (filterState.packageId && filterState.packageId !== "all") query.packageId = filterState.packageId;
    if (filterState.teacherId && filterState.teacherId !== "all") query.teacherId = filterState.teacherId;
    if (filterState.groupId && filterState.groupId !== "all") query.groupId = filterState.groupId;
    if (filterState.paymentState && filterState.paymentState !== "all") query.paymentState = filterState.paymentState;
    if (filterState.dateFrom) query.dateFrom = filterState.dateFrom;
    if (filterState.dateTo) query.dateTo = filterState.dateTo;
    return query;
  }, [filterState, currentPage, pageSize]);

  // Debounced server query on filter/page/pageSize change (300ms debounce)
  const lastQueryKeyRef = useRef<string>("");

  useEffect(() => {
    if (!onStudentsQuery) return;
    const query = buildCurrentQuery();
    const queryKey = JSON.stringify(query);

    if (!lastQueryKeyRef.current) {
      lastQueryKeyRef.current = queryKey;
      onStudentsQuery(query);
      return;
    }

    const timer = setTimeout(() => {
      if (queryKey !== lastQueryKeyRef.current) {
        lastQueryKeyRef.current = queryKey;
        onStudentsQuery(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [buildCurrentQuery, onStudentsQuery]);

  // Extract unique grades list from students for filter dropdown
  const gradesList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.grade && s.grade.trim()) set.add(s.grade.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
  }, [students]);

  // Total and filtered counts tracking
  const hasActiveFilters = Boolean(
    filterState.search?.trim() ||
    (filterState.status && filterState.status !== "all") ||
    filterState.grade ||
    filterState.subjectId ||
    filterState.packageId ||
    filterState.teacherId ||
    (filterState.paymentState && filterState.paymentState !== "all") ||
    filterState.dateFrom ||
    filterState.dateTo ||
    (filterState.level && filterState.level !== "all") ||
    filterState.groupId
  );

  const baselineTotalRef = useRef<number>(studentsTotal ?? students.length);
  useEffect(() => {
    if (!hasActiveFilters && studentsTotal !== undefined && studentsTotal > 0) {
      baselineTotalRef.current = studentsTotal;
    }
  }, [hasActiveFilters, studentsTotal]);

  const serverCount = studentsTotal !== undefined ? studentsTotal : students.length;
  const totalCount = !hasActiveFilters ? serverCount : (baselineTotalRef.current || serverCount);

  // Multi-Selection State for Bulk Actions (current page only)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [bulkLoading, setBulkLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch groups list for bulk assignment
  useEffect(() => {
    let isMounted = true;
    fetchJson(api("groups"))
      .then((res: any) => {
        if (isMounted) {
          const list = Array.isArray(res) ? res : (res?.data || res?.items || []);
          setGroups(list);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allSelected = students.length > 0 && students.every((s) => prev.has(s.id));
      if (allSelected) {
        return new Set();
      }
      return new Set(students.map((s) => s.id));
    });
  }, [students]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Safe auth headers helper guarding against missing token
  const safeAuthHeaders = (): Record<string, string> => {
    let authHeader: string | null = null;
    let headers: Record<string, string> = {};

    try {
      headers = getAuthHeaders();
      authHeader = headers["Authorization"] || headers["authorization"] || null;
    } catch {
      // getAuthHeaders threw
    }

    if (!authHeader && typeof window !== "undefined") {
      try {
        const rawToken =
          sessionStorage.getItem("accessToken") ||
          sessionStorage.getItem("token") ||
          localStorage.getItem("accessToken") ||
          localStorage.getItem("token");

        if (rawToken) {
          authHeader = `Bearer ${rawToken}`;
          headers["Authorization"] = authHeader;
        }
      } catch {
        // storage access blocked
      }
    }

    if (!authHeader) {
      throw new Error(isEn ? "Authentication token is missing. Please log in again." : "تعذر العثور على رمز تسجيل الدخول. يرجى تسجيل الدخول أولاً");
    }

    headers["Content-Type"] = "application/json";
    if (!headers["X-Company-Id"]) {
      try {
        const cid = getCompanyId();
        if (cid) headers["X-Company-Id"] = cid;
      } catch {}
    }

    return headers;
  };

  // Bulk actions handlers
  const handleBulkStatus = async (isActive: boolean) => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    setActionError(null);
    try {
      const headers = safeAuthHeaders();
      const res = await fetch(api("students/bulk/status"), {
        method: "POST",
        headers,
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          isActive,
        }),
      });
      if (!res.ok) {
        throw new Error(isEn ? "Failed to update students status" : "فشل تحديث حالة الطلاب");
      }
      const data = await res.json();
      if (!data?.success) {
        throw new Error(data?.error || data?.message || (isEn ? "Failed to update students status" : "فشل تحديث حالة الطلاب"));
      }
      setSelectedIds(new Set());
      toast.success(isEn ? "Status updated successfully" : "تم تحديث حالة الطلاب بنجاح");
      if (onStudentsQuery) {
        onStudentsQuery(buildCurrentQuery());
      }
    } catch (err: any) {
      console.error("Bulk status error:", err);
      const msg = err?.message || (isEn ? "Failed to update students status" : "فشل تحديث حالة الطلاب");
      setActionError(msg);
      toast.error(msg);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkAddToGroup = async () => {
    if (selectedIds.size === 0 || !selectedGroupId) return;
    setBulkLoading(true);
    setActionError(null);
    try {
      const headers = safeAuthHeaders();
      const res = await fetch(api("students/bulk/group"), {
        method: "POST",
        headers,
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          groupId: selectedGroupId,
        }),
      });
      if (!res.ok) {
        throw new Error(isEn ? "Failed to add students to group" : "فشل إضافة الطلاب للمجموعة");
      }
      const data = await res.json();
      if (!data?.success) {
        throw new Error(data?.error || data?.message || (isEn ? "Failed to add students to group" : "فشل إضافة الطلاب للمجموعة"));
      }
      setSelectedIds(new Set());
      setSelectedGroupId("");
      toast.success(isEn ? "Students added to group successfully" : "تم إضافة الطلاب للمجموعة بنجاح");
      if (onStudentsQuery) {
        onStudentsQuery(buildCurrentQuery());
      }
    } catch (err: any) {
      console.error("Bulk add to group error:", err);
      const msg = err?.message || (isEn ? "Failed to add students to group" : "فشل إضافة الطلاب للمجموعة");
      setActionError(msg);
      toast.error(msg);
    } finally {
      setBulkLoading(false);
    }
  };

  // CSV Export: fetches all=true with active filters from backend
  const handleExportCsv = useCallback(async () => {
    setActionError(null);
    try {
      const headers = safeAuthHeaders();
      const params = new URLSearchParams();
      params.set("all", "true");
      if (filterState.search?.trim()) params.append("search", filterState.search.trim());
      if (filterState.status && filterState.status !== "all") params.append("isActive", filterState.status);
      if (filterState.grade && filterState.grade !== "all") params.append("grade", filterState.grade);
      if (filterState.level && filterState.level !== "all") params.append("level", filterState.level);
      if (filterState.subjectId && filterState.subjectId !== "all") params.append("subject", filterState.subjectId);
      if (filterState.packageId && filterState.packageId !== "all") params.append("packageId", filterState.packageId);
      if (filterState.teacherId && filterState.teacherId !== "all") params.append("teacherId", filterState.teacherId);
      if (filterState.groupId && filterState.groupId !== "all") params.append("groupId", filterState.groupId);
      if (filterState.paymentState && filterState.paymentState !== "all") params.append("paymentState", filterState.paymentState);
      if (filterState.dateFrom) params.append("dateFrom", filterState.dateFrom);
      if (filterState.dateTo) params.append("dateTo", filterState.dateTo);
      if (filterState.sortBy) params.append("sortBy", filterState.sortBy);
      if (filterState.sortDir) params.append("sortDir", filterState.sortDir);

      const res = await fetch(api(`students?${params.toString()}`), {
        headers,
      });

      if (!res.ok) {
        throw new Error(isEn ? "Failed to export students data" : "فشل تصدير بيانات الطلاب");
      }

      const data = await res.json();
      if (!data?.success) {
        throw new Error(data?.error || data?.message || (isEn ? "Failed to export students data" : "فشل تصدير بيانات الطلاب"));
      }

      const exportItems: EducationStudent[] = Array.isArray(data?.data)
        ? data.data
        : (data?.items || []);

      if (exportItems.length === 0) {
        const emptyMsg = isEn ? "No students matching filters to export" : "لا يوجد طلاب مطابقين للفلاتر لتصديرهم";
        setActionError(emptyMsg);
        toast.error(emptyMsg);
        return;
      }

      const headersList = [
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
        "الباقة",
        "المدرّس",
        "المدفوع",
        "المتبقي",
        "حالة السداد",
      ];

      const escapeCsv = (val: any) => {
        const str = String(val ?? "").replace(/"/g, '""');
        return `"${str}"`;
      };

      const paymentStatusLabels: Record<string, string> = {
        COMPLETED: "مدفوع بالكامل",
        PARTIALLY_PAID: "مدفوع جزئياً",
        PENDING: "معلق / مستحق",
        FAILED: "فشل",
        REFUNDED: "مسترد",
      };

      const rows = exportItems.map((s: any) => {
        const enrollment = s.enrollments?.[0];
        const pkgName = enrollment?.package?.name || "";
        const teacherName = enrollment?.teacher?.name || "";
        const amountPaid = enrollment?.amountPaid !== undefined ? String(enrollment.amountPaid) : "0";
        const totalPrice = enrollment?.finalAmount ?? enrollment?.package?.price ?? 0;
        const remaining = Math.max(0, totalPrice - (enrollment?.amountPaid || 0));
        const payStatusRaw = enrollment?.paymentStatus || "";
        const payStatus = paymentStatusLabels[payStatusRaw] || payStatusRaw;

        return [
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
          escapeCsv(pkgName),
          escapeCsv(teacherName),
          escapeCsv(amountPaid),
          escapeCsv(remaining),
          escapeCsv(payStatus),
        ];
      });

      const csvContent = "\uFEFF" + [headersList.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `students_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Export error:", err);
      const msg = err?.message || (isEn ? "Failed to export students data" : "فشل تصدير بيانات الطلاب");
      setActionError(msg);
      toast.error(msg);
    }
  }, [filterState, isEn]);

  return (
    <div className="space-y-3.5">
      {/* Action Error Banner */}
      {actionError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 p-3 text-xs rounded-xl bg-destructive/10 border border-destructive/30 text-destructive animate-in fade-in"
          dir={isEn ? "ltr" : "rtl"}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs hover:underline cursor-pointer"
          >
            {isEn ? "Dismiss" : "إغلاق"}
          </button>
        </div>
      )}

      {/* 1. Filters & Action Bar */}
      <EducationStudentsFilters
        filters={filterState}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        gradesList={gradesList}
        subjects={subjects}
        packages={packages}
        teachers={teachers}
        enableSubjects={enableSubjects}
        totalStudents={totalCount}
        filteredCount={serverCount}
        onOpenAddModal={() => setStudentModal({})}
        onExport={handleExportCsv}
      />

      {/* 2. Bulk Actions Bar (Sticky/Prominent when rows selected) */}
      {selectedIds.size > 0 && (
        <div
          className="flex flex-wrap items-center justify-between gap-2.5 bg-primary/10 border border-primary/30 rounded-xl p-3 shadow-xs transition-all animate-in fade-in"
          dir={isEn ? "ltr" : "rtl"}
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {selectedIds.size}
            </span>
            <span className="text-xs font-semibold text-foreground">
              {isEn ? `${selectedIds.size} students selected` : `تم تحديد ${selectedIds.size}`}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Activate button */}
            <button
              type="button"
              disabled={bulkLoading}
              onClick={() => handleBulkStatus(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background hover:bg-muted text-foreground border border-border text-xs font-medium rounded-lg transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isEn ? "Activate" : "تنشيط"}</span>
            </button>

            {/* Deactivate button */}
            <button
              type="button"
              disabled={bulkLoading}
              onClick={() => handleBulkStatus(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background hover:bg-muted text-foreground border border-border text-xs font-medium rounded-lg transition-colors"
            >
              <UserX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>{isEn ? "Deactivate" : "إيقاف"}</span>
            </button>

            {/* Group assignment */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[150px]"
                aria-label={isEn ? "Select Group" : "اختر المجموعة"}
              >
                <option value="">{isEn ? "Select group..." : "اختر المجموعة..."}</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={bulkLoading || !selectedGroupId}
                onClick={handleBulkAddToGroup}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>{isEn ? "Add to Group" : "إضافة لمجموعة"}</span>
              </button>
            </div>

            {/* WhatsApp bulk button (UI ONLY - disabled + tooltip) */}
            <button
              type="button"
              disabled
              title={isEn ? "Will be connected after WhatsApp channel approval" : "هيتوصل بعد اعتماد قناة الواتساب"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground border border-border/60 text-xs font-medium rounded-lg cursor-not-allowed opacity-60"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isEn ? "Send WhatsApp" : "أرسل واتساب"}</span>
            </button>

            {/* Clear Selection */}
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground underline px-1"
            >
              {isEn ? "Deselect" : "إلغاء التحديد"}
            </button>
          </div>
        </div>
      )}

      {/* 3. Empty State or Table */}
      {students.length === 0 && !studentsLoading ? (
        <div
          className="flex flex-col items-center justify-center p-8 sm:p-12 bg-card border border-border/80 rounded-2xl text-center space-y-3.5"
          dir={isEn ? "ltr" : "rtl"}
        >
          <div className="w-12 h-12 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">
              {isEn ? "No students match the filters" : "مفيش طلاب مطابقين للفلاتر"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              {isEn
                ? "Try clearing or adjusting search filters to see matching student records."
                : "جرّب تغيير كلمات البحث أو مسح الفلاتر لعرض نتائج أخرى."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isEn ? "Clear Filters" : "مسح الفلاتر"}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="relative">
            {studentsLoading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            )}
            <EducationStudentsTable
              students={students}
              subjects={subjects}
              enableSubjects={enableSubjects}
              sortBy={filterState.sortBy}
              sortDir={filterState.sortDir}
              selectedIds={selectedIds}
              onSort={handleSortHeader}
              onSelectAll={handleToggleSelectAll}
              onSelectStudent={handleToggleSelect}
              onEdit={(student) => setStudentModal(student)}
              onToggleStatus={handleToggleStudent}
              onDelete={handleDeleteStudent}
            />
          </div>

          {/* Mobile Card View */}
          <EducationStudentsMobileCards
            students={students}
            subjects={subjects}
            enableSubjects={enableSubjects}
            onEdit={(student) => setStudentModal(student)}
            onToggleStatus={handleToggleStudent}
            onDelete={handleDeleteStudent}
          />

          {/* Pagination */}
          <EducationStudentsPagination
            currentPage={currentPage}
            totalPages={studentsTotalPages}
            pageSize={pageSize}
            totalItems={totalCount}
            filteredCount={serverCount}
            onPageChange={(page) => updateParams({ page })}
            onPageSizeChange={(newSize) => updateParams({ pageSize: newSize, page: 1 })}
          />
        </>
      )}

      {/* 4. Add / Edit Modal */}
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

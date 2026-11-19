import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import type {
  EducationSubject,
  EducationPackage,
  EducationStudent,
  EducationTeacher,
  EducationEnrollment,
  EducationSession,
  Customer,
  TabId,
} from "./types";
import { TABS } from "./types";
import { api, searchCustomersApi, fetchJson, getAuthHeaders } from "./api";

export interface StudentsQuery {
  search?: string;
  isActive?: boolean | string;
  grade?: string;
  level?: number | string;
  subject?: string;
  packageId?: string;
  groupId?: string;
  teacherId?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentState?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  all?: boolean | string;
}

export function useEducationManagementController() {
  const location = useLocation();
  const { "*": path } = useParams();
  const navigate = useNavigate();
  const pathFromLocation = location.pathname.startsWith("/admin/education/")
    ? location.pathname.replace(/^\/admin\/education\/?/, "").split("/")[0]
    : "";
  const urlTab = (path || pathFromLocation || "").split("/")[0];
  const activeTab = (
    TABS.map((t) => t.id).includes(urlTab as TabId) ? urlTab : "dashboard"
  ) as TabId;
  const setActiveTab = (tab: TabId) =>
    navigate(`/admin/education/${tab === "dashboard" ? "dashboard" : tab}`);

  const [subjects, setSubjects] = useState<EducationSubject[]>([]);
  const [packages, setPackages] = useState<EducationPackage[]>([]);
  const [students, setStudents] = useState<EducationStudent[]>([]);
  const [studentsTotal, setStudentsTotal] = useState<number>(0);
  const [studentsTotalPages, setStudentsTotalPages] = useState<number>(1);
  const [studentsLoading, setStudentsLoading] = useState<boolean>(false);
  const [teachers, setTeachers] = useState<EducationTeacher[]>([]);
  const [enrollments, setEnrollments] = useState<EducationEnrollment[]>([]);
  const [sessions, setSessions] = useState<EducationSession[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastStudentsQueryRef = useRef<StudentsQuery | undefined>(undefined);

  // Modals
  const [subjectModal, setSubjectModal] = useState<
    Partial<EducationSubject> | null | undefined
  >(undefined);
  const [packageModal, setPackageModal] = useState<
    Partial<EducationPackage> | null | undefined
  >(undefined);
  const [studentModal, setStudentModal] = useState<
    Partial<EducationStudent> | null | undefined
  >(undefined);
  const [teacherModal, setTeacherModal] = useState<
    Partial<EducationTeacher> | null | undefined
  >(undefined);
  const [sessionModal, setSessionModal] = useState<
    Partial<EducationSession> | null | undefined
  >(undefined);
  const [enrollmentModal, setEnrollmentModal] = useState<
    Partial<EducationEnrollment> | null | undefined
  >(undefined);

  // Search/filter
  const [subjectSearch, setSubjectSearch] = useState("");
  const [packageSubjectFilter, setPackageSubjectFilter] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [sessionFilters, setSessionFilters] = useState({
    status: "",
    teacherId: "",
    from: "",
    to: "",
  });
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);

  const fetchSubjects = async () => {
    try {
      setSubjects(await fetchJson(api("subjects")));
    } catch (e: any) {
      throw e;
    }
  };

  const fetchPackages = async () => {
    try {
      setPackages(await fetchJson(api("packages")));
    } catch (e: any) {
      throw e;
    }
  };

  const fetchStudents = async (query?: StudentsQuery) => {
    setStudentsLoading(true);
    try {
      if (query !== undefined) {
        lastStudentsQueryRef.current = query;
      }
      const activeQuery = query || lastStudentsQueryRef.current;
      const params = new URLSearchParams();
      if (activeQuery) {
        if (activeQuery.search && activeQuery.search.trim()) params.append("search", activeQuery.search.trim());
        if (activeQuery.isActive !== undefined && activeQuery.isActive !== "" && activeQuery.isActive !== "all") {
          params.append("isActive", String(activeQuery.isActive));
        }
        if (activeQuery.grade && activeQuery.grade !== "all") params.append("grade", activeQuery.grade);
        if (activeQuery.level !== undefined && activeQuery.level !== "" && activeQuery.level !== "all") {
          params.append("level", String(activeQuery.level));
        }
        if (activeQuery.subject && activeQuery.subject !== "all") params.append("subject", activeQuery.subject);
        if (activeQuery.packageId && activeQuery.packageId !== "all") params.append("packageId", activeQuery.packageId);
        if (activeQuery.groupId && activeQuery.groupId !== "all") params.append("groupId", activeQuery.groupId);
        if (activeQuery.teacherId && activeQuery.teacherId !== "all") params.append("teacherId", activeQuery.teacherId);
        if (activeQuery.dateFrom) params.append("dateFrom", activeQuery.dateFrom);
        if (activeQuery.dateTo) params.append("dateTo", activeQuery.dateTo);
        if (activeQuery.paymentState && activeQuery.paymentState !== "all") params.append("paymentState", activeQuery.paymentState);
        if (activeQuery.page) params.append("page", String(activeQuery.page));
        if (activeQuery.pageSize) params.append("pageSize", String(activeQuery.pageSize));
        if (activeQuery.sortBy) params.append("sortBy", activeQuery.sortBy);
        if (activeQuery.sortDir) params.append("sortDir", activeQuery.sortDir);
        if (activeQuery.all) params.append("all", String(activeQuery.all));
      } else {
        // Default call without query (other tabs / initial load compat): fetch 100 items
        params.append("pageSize", "100");
      }

      const queryString = params.toString();
      const endpoint = queryString ? `students?${queryString}` : "students";
      const res = await fetch(api(endpoint), { headers: getAuthHeaders() });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "فشل جلب الطلاب");
      }

      const items: EducationStudent[] = Array.isArray(data?.data) ? data.data : (data?.items || []);
      const total = data?.total !== undefined ? Number(data.total) : items.length;
      const totalPages = data?.totalPages !== undefined ? Number(data.totalPages) : Math.max(1, Math.ceil(total / (query?.pageSize || 20)));

      setStudents(items);
      setStudentsTotal(total);
      setStudentsTotalPages(totalPages);
      return data;
    } catch (e: any) {
      throw e;
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      setTeachers(await fetchJson(api("teachers")));
    } catch (e: any) {
      throw e;
    }
  };

  const fetchEnrollments = async () => {
    try {
      setEnrollments(await fetchJson(api("enrollments")));
    } catch (e: any) {
      throw e;
    }
  };

  const fetchSessions = async () => {
    const params = new URLSearchParams();
    if (sessionFilters.status) params.append("status", sessionFilters.status);
    if (sessionFilters.teacherId)
      params.append("teacherId", sessionFilters.teacherId);
    if (sessionFilters.from) params.append("from", sessionFilters.from);
    if (sessionFilters.to) params.append("to", sessionFilters.to);
    try {
      setSessions(await fetchJson(api(`sessions?${params}`)));
    } catch (e: any) {
      throw e;
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        fetchSubjects(),
        fetchPackages(),
        fetchStudents(),
        fetchTeachers(),
        fetchEnrollments(),
        fetchSessions(),
      ]);

      const rejected = results.filter(
        (r): r is PromiseRejectedResult => r.status === "rejected"
      );

      // Only show error if ALL parallel endpoints failed (e.g. 401 Unauthorized or 403 App Access Denied)
      if (rejected.length === results.length) {
        setError(rejected[0].reason?.message || "فشل تحميل البيانات");
      }
    } catch (e: any) {
      setError(e.message || "فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchAll();
    } else if (activeTab === "subjects") {
      setLoading(true);
      fetchSubjects().finally(() => setLoading(false));
    } else if (activeTab === "packages") {
      setLoading(true);
      fetchPackages().finally(() => setLoading(false));
    } else if (activeTab === "students") {
      setLoading(false);
    } else if (activeTab === "teachers") {
      setLoading(true);
      fetchTeachers().finally(() => setLoading(false));
    } else if (activeTab === "enrollments") {
      setLoading(true);
      Promise.all([
        fetchEnrollments(),
        fetchStudents(),
        fetchPackages(),
        fetchTeachers(),
      ])
        .catch((e: any) => setError(e.message || "فشل تحميل البيانات"))
        .finally(() => setLoading(false));
    } else if (activeTab === "sessions") {
      setLoading(true);
      // مودال «إضافة حصة» بيعتمد على قائمة التسجيلات — من غير تحميلها هنا
      // كانت القائمة بتفضل فاضية على طول (السبب الحقيقي للمشكلة).
      Promise.all([fetchSessions(), fetchEnrollments(), fetchTeachers()])
        .catch((e: any) => setError(e.message || "فشل تحميل البيانات"))
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  const searchCustomers = async (q: string) => {
    if (!q || q.length < 2) {
      setCustomerResults([]);
      return;
    }
    try {
      const data = await fetchJson(searchCustomersApi(q));
      setCustomerResults(Array.isArray(data) ? data : []);
    } catch {
      setCustomerResults([]);
    }
  };

  // CRUD helpers
  // 502/504 بيرجعوا HTML مش JSON — من غير الهاندلينج ده الواجهة كانت بتفشل بصمت
  // (المستخدم يشوف الشاشة قفلت من غير أي رسالة، أو "فشل الحفظ" من غير سبب).
  const readJsonSafe = async (res: Response): Promise<any> => {
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  };

  const describeFailure = (res: Response, body: any, fallback: string) => {
    if (body && typeof body.error === "string" && body.error.trim()) {
      return body.error;
    }
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      return "السيرفر بيرجّع خطأ مؤقت (502) — استنى لحظة وجرّب تاني";
    }
    if (res.status === 401 || res.status === 403) {
      return "الجلسة انتهت أو مفيش صلاحية — اعمل تحديث للصفحة وادخل تاني";
    }
    if (res.status === 409) return "البيانات مكررة";
    return `${fallback} (كود ${res.status})`;
  };

  const writeRequest = async (
    url: string,
    method: string,
    body: any,
    fallback: string
  ): Promise<any | null> => {
    const send = () =>
      fetch(url, {
        method,
        headers: getAuthHeaders(),
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });

    try {
      let res = await send();
      // 502 أثناء إعادة تشغيل السيرفر = الطلب عمره ما وصل للتطبيق، فإعادة
      // المحاولة مرة واحدة آمنة (بنستثني 504 عشان ممكن يكون اتنفّذ فعلًا).
      if (res.status === 502) {
        await new Promise((r) => setTimeout(r, 1500));
        res = await send();
      }
      const result = await readJsonSafe(res);
      if (!res.ok || !result?.success) {
        alert(describeFailure(res, result, fallback));
        return null;
      }
      return result;
    } catch (e: any) {
      alert(`تعذر الاتصال بالسيرفر: ${e?.message || "خطأ شبكة"}`);
      return null;
    }
  };

  const saveItem = async (entity: string, data: any) => {
    const isEdit = !!data.id;
    const url = isEdit ? api(`${entity}/${data.id}`) : api(entity);
    const result = await writeRequest(
      url,
      isEdit ? "PUT" : "POST",
      data,
      isEdit ? "فشل التحديث" : "فشل الحفظ"
    );
    return !!result;
  };

  const deleteItem = async (entity: string, id: string) => {
    if (!confirm("تأكيد الحذف؟")) return false;
    const result = await writeRequest(
      api(`${entity}/${id}`),
      "DELETE",
      undefined,
      "فشل الحذف"
    );
    return !!result;
  };

  const toggleActive = async (
    entity: string,
    id: string,
    current: boolean
  ) => {
    const result = await writeRequest(
      api(`${entity}/${id}`),
      "PUT",
      { isActive: !current },
      "فشل التحديث"
    );
    return !!result;
  };

  // Subject handlers
  const handleSaveSubject = async (d: Partial<EducationSubject>) => {
    if (!(await saveItem("subjects", d))) return;
    setSubjectModal(undefined);
    fetchSubjects();
  };
  const handleToggleSubject = async (id: string, current: boolean) => {
    if (await toggleActive("subjects", id, current)) fetchSubjects();
  };
  const handleDeleteSubject = async (id: string) => {
    if (await deleteItem("subjects", id)) fetchSubjects();
  };

  // Package handlers
  const handleSavePackage = async (d: Partial<EducationPackage>) => {
    if (!(await saveItem("packages", d))) return;
    setPackageModal(undefined);
    fetchPackages();
  };
  const handleTogglePackage = async (id: string, current: boolean) => {
    if (await toggleActive("packages", id, current)) fetchPackages();
  };
  const handleDeletePackage = async (id: string) => {
    if (await deleteItem("packages", id)) fetchPackages();
  };

  // Student handlers
  const handleSaveStudent = async (d: Partial<EducationStudent>): Promise<EducationStudent | null> => {
    const isEdit = !!d.id;
    const url = isEdit ? api(`students/${d.id}`) : api("students");
    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(d),
      });
      const result = await res.json();
      if (!result.success) {
        alert(result.error || "فشل الحفظ");
        return null;
      }
      setStudentModal(undefined);
      await fetchStudents();
      return result.data;
    } catch (e: any) {
      alert(e.message || "فشل حفظ الطالب");
      return null;
    }
  };
  const handleToggleStudent = async (id: string, current: boolean) => {
    if (await toggleActive("students", id, current)) fetchStudents();
  };
  const handleDeleteStudent = async (id: string) => {
    if (await deleteItem("students", id)) fetchStudents();
  };

  // Teacher handlers
  const handleSaveTeacher = async (d: Partial<EducationTeacher>) => {
    if (!(await saveItem("teachers", d))) return;
    setTeacherModal(undefined);
    fetchTeachers();
  };
  const handleToggleTeacher = async (id: string, current: boolean) => {
    if (await toggleActive("teachers", id, current)) fetchTeachers();
  };
  const handleDeleteTeacher = async (id: string) => {
    if (await deleteItem("teachers", id)) fetchTeachers();
  };

  // Enrollment handlers
  const handleSaveEnrollment = async (d: Partial<EducationEnrollment>) => {
    if (!(await saveItem("enrollments", d))) return;
    setEnrollmentModal(undefined);
    fetchEnrollments();
  };
  const handleDeleteEnrollment = async (id: string) => {
    if (await deleteItem("enrollments", id)) fetchEnrollments();
  };

  // Session handlers
  const handleSaveSession = async (d: Partial<EducationSession>) => {
    const ok = await saveItem("sessions", d);
    if (!ok) {
      throw new Error("تعذر حفظ الحصة، يرجى مراجعة البيانات والمحاولة مرة أخرى");
    }
    setSessionModal(undefined);
    fetchSessions();
  };
  const handleConfirmSession = async (
    id: string,
    actualDuration?: number
  ) => {
    const res = await fetch(api(`sessions/${id}/confirm`), {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ actualDuration: actualDuration || undefined }),
    });
    const data = await res.json();
    if (!data.success) {
      alert(data.error || "فشل التأكيد");
      return;
    }
    fetchSessions();
  };
  const handleCancelSession = async (id: string) => {
    if (!confirm("تأكيد إلغاء الحصة؟")) return;
    const res = await fetch(api(`sessions/${id}/cancel`), {
      method: "PUT",
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!data.success) {
      alert(data.error || "فشل الإلغاء");
      return;
    }
    fetchSessions();
  };

  // Stats
  const todayStr = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  const stats = useMemo(
    () => ({
      totalSubjects: (subjects || []).filter((s) => s.isActive).length,
      totalPackages: (packages || []).filter((p) => p.isActive).length,
      totalStudents: (students || []).filter((s) => s.isActive).length,
      totalTeachers: (teachers || []).filter((t) => t.isActive).length,
      activeEnrollments: (enrollments || []).filter((e) => (e.remainingHours ?? 0) > 0).length,
      sessionsToday: (sessions || []).filter((s) =>
        s.scheduledAt?.startsWith(todayStr)
      ).length,
      totalSessions: (sessions || []).filter((s) => s.status === "CONFIRMED").length,
      scheduledSessions: (sessions || []).filter((s) => s.status === "SCHEDULED").length,
    }),
    [subjects, packages, students, teachers, enrollments, sessions, todayStr]
  );

  return {
    activeTab,
    setActiveTab,
    subjects,
    packages,
    students,
    studentsTotal,
    studentsTotalPages,
    studentsLoading,
    studentsMeta: {
      total: studentsTotal,
      totalPages: studentsTotalPages,
      loading: studentsLoading,
    },
    fetchStudents,
    teachers,
    enrollments,
    sessions,
    customers,
    loading,
    error,
    stats,
    // Modals
    subjectModal,
    setSubjectModal,
    packageModal,
    setPackageModal,
    studentModal,
    setStudentModal,
    teacherModal,
    setTeacherModal,
    sessionModal,
    setSessionModal,
    enrollmentModal,
    setEnrollmentModal,
    // Filters
    subjectSearch,
    setSubjectSearch,
    packageSubjectFilter,
    setPackageSubjectFilter,
    studentSearch,
    setStudentSearch,
    teacherSearch,
    setTeacherSearch,
    sessionFilters,
    setSessionFilters,
    customerResults,
    searchCustomers,
    fetchAll,
    // Handlers
    handleSaveSubject,
    handleToggleSubject,
    handleDeleteSubject,
    handleSavePackage,
    handleTogglePackage,
    handleDeletePackage,
    handleSaveStudent,
    handleToggleStudent,
    handleDeleteStudent,
    handleSaveTeacher,
    handleToggleTeacher,
    handleDeleteTeacher,
    handleSaveEnrollment,
    handleDeleteEnrollment,
    handleSaveSession,
    handleConfirmSession,
    handleCancelSession,
  };
}

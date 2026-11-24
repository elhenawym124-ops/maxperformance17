import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  GraduationCap,
  Clock,
  RefreshCw,
  ArrowRight,
  BookOpen,
  CalendarCheck
} from "lucide-react";

interface Session {
  id: string;
  scheduledAt: string;
  plannedDuration: number;
  actualDuration: number | null;
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | string;
  sessionType?: "PRIVATE" | "GROUP";
  groupName?: string;
  room?: string;
  attendanceStatus?: "PRESENT" | "ABSENT" | "EXCUSED" | "SCHEDULED" | "PENDING";
  topic?: string | null;
  homework?: string | null;
  notes?: string | null;
  subject: { name: string };
  teacher: { name: string };
  enrollment?: { remainingHours: number; totalHours: number };
}

interface Enrollment {
  id: string;
  enrollmentType?: "PACKAGE" | "GROUP";
  remainingHours?: number;
  totalHours?: number;
  package: { id: string; name: string; hoursCount?: number; price?: number };
  teacher: { name: string } | null;
  subject: { name: string } | null;
  groupName?: string;
  groupCode?: string;
  feeType?: string;
  feeAmount?: number;
  paymentStatus?: string;
  status?: string;
}

interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  examType: string;
  score: number | null;
  maxScore: number;
  grade?: string | null;
  notes?: string | null;
  publishedAt?: string | null;
  scheduledAt?: string | null;
}

interface Certificate {
  id: string;
  title: string;
  type: string;
  level?: string | null;
  serialNumber: string;
  issuedAt: string;
}

const ParentChildDetailPage: React.FC = () => {
  const { studentId } = useParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [activeTab, setActiveTab] = useState<"sessions" | "enrollments" | "academics">("sessions");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDetail = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem("parentToken");
      const [sessRes, enrRes, examRes, certRes] = await Promise.all([
        fetch(`/api/v1/education/parent-portal/children/${studentId}/sessions`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`/api/v1/education/parent-portal/children/${studentId}/enrollments`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`/api/v1/education/parent-portal/children/${studentId}/exams`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`/api/v1/education/parent-portal/children/${studentId}/certificates`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then((r) => r.json()).catch(() => ({ success: false }))
      ]);

      setExamResults(examRes.success && Array.isArray(examRes.data) ? examRes.data : []);
      setCertificates(certRes.success && Array.isArray(certRes.data) ? certRes.data : []);

      if (sessRes.success && Array.isArray(sessRes.data) && sessRes.data.length > 0) {
        setSessions(sessRes.data);
      } else {
        setSessions([]);
      }

      if (enrRes.success && Array.isArray(enrRes.data) && enrRes.data.length > 0) {
        setEnrollments(enrRes.data);
      } else {
        setEnrollments([]);
      }
    } catch {
      setSessions([]);
      setEnrollments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [studentId]);

  const totalRemainingHours = useMemo(() => {
    return enrollments.reduce((sum, e) => sum + (e.remainingHours || 0), 0);
  }, [enrollments]);

  const downloadStatement = async (format: "pdf" | "excel") => {
    try {
      const token = localStorage.getItem("parentToken");
      const res = await fetch(
        `/api/v1/education/parent-portal/children/${studentId}/statement?months=12&format=${format}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("تعذر تصدير كشف الحساب");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `statement-${studentId}.${format === "excel" ? "xlsx" : "pdf"}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Statement export failed:", err);
    }
  };

  const downloadCertificate = async (certificateId: string, serialNumber: string) => {    try {
      const token = localStorage.getItem("parentToken");
      const res = await fetch(`/api/v1/education/parent-portal/certificates/${certificateId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("تعذر تحميل الشهادة");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${serialNumber || certificateId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Certificate download failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] space-y-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs font-mono text-muted-foreground uppercase">جاري تحميل ملف الطالب...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10" dir="rtl">
      {/* Telemetry Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to="/parent/children"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة لقائمة الأبناء</span>
            </Link>
            <span className="text-muted-foreground">•</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-primary/10 text-primary border border-primary/20">
              STUDENT PROFILE
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">الملف الأكاديمي للطالب</h1>
          <p className="text-xs text-muted-foreground">
            متابعة جدول الحصص الفردية، حضور الدروس، ورصيد ساعات الباقات المسجلة
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDetail}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/80 bg-background hover:bg-muted text-foreground transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">الساعات المتبقية</span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-foreground mt-2">
            {totalRemainingHours} ساعة
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">الحصص المجدولة</span>
            <CalendarCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-foreground mt-2">
            {sessions.length} حصة
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">الباقات المشترك بها</span>
            <GraduationCap className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-foreground mt-2">
            {enrollments.length} باقة
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/50 text-xs w-fit">
        <button
          onClick={() => setActiveTab("sessions")}
          className={`px-3.5 py-1.5 rounded-md font-medium transition-all ${
            activeTab === "sessions"
              ? "bg-background text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          سجل الحصص ({sessions.length})
        </button>
        <button
          onClick={() => setActiveTab("enrollments")}
          className={`px-3.5 py-1.5 rounded-md font-medium transition-all ${
            activeTab === "enrollments"
              ? "bg-background text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          الباقات والتسجيلات ({enrollments.length})
        </button>
        <button
          onClick={() => setActiveTab("academics")}
          className={`px-3.5 py-1.5 rounded-md font-medium transition-all ${
            activeTab === "academics"
              ? "bg-background text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          الدرجات والشهادات ({examResults.length + certificates.length})
        </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => downloadStatement("pdf")}
            className="px-3 py-1.5 rounded-lg border border-border/70 text-[11px] font-semibold text-foreground hover:bg-muted"
          >
            كشف حساب PDF
          </button>
          <button
            type="button"
            onClick={() => downloadStatement("excel")}
            className="px-3 py-1.5 rounded-lg border border-border/70 text-[11px] font-semibold text-muted-foreground hover:bg-muted"
          >
            Excel
          </button>
        </div>
      </div>

      {/* Tab 1: Sessions */}
      {activeTab === "sessions" && (
        <div className="rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm overflow-hidden divide-y divide-border/60">
          {sessions.length === 0 ? (
            <div className="text-center py-12 px-4 text-xs text-muted-foreground">
              لا توجد حصص مسجلة للطالب
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">
                        {s.subject?.name || "حصة تدريس"}
                      </h4>
                      {s.sessionType === "GROUP" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono border bg-purple-500/10 text-purple-600 border-purple-500/20">
                          مجموعة: {s.groupName}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono border bg-blue-500/10 text-blue-600 border-blue-500/20">
                          حصة خاصة
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          s.status === "CONFIRMED"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : s.status === "COMPLETED"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        }`}
                      >
                        {s.status === "CONFIRMED" ? "مؤكدة" : s.status === "COMPLETED" ? "مكتملة" : "مجدولة"}
                      </span>
                      {s.attendanceStatus === "PRESENT" && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          حاضر
                        </span>
                      )}
                      {s.attendanceStatus === "ABSENT" && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono border bg-rose-500/10 text-rose-600 border-rose-500/20">
                          غائب
                        </span>
                      )}
                      {s.attendanceStatus === "EXCUSED" && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono border bg-amber-500/10 text-amber-600 border-amber-500/20">
                          معذور
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">المعلم: {s.teacher?.name || "معلم المادة"}</p>
                    <p className="text-[11px] font-mono text-muted-foreground">
                      {new Date(s.scheduledAt).toLocaleDateString("ar-EG")} • {s.actualDuration || s.plannedDuration} دقيقة
                      {s.room ? ` • القاعة: ${s.room}` : ""}
                    </p>

                    {/* Topic & Homework Display */}
                    {(s.topic || s.homework || s.notes) && (
                      <div className="mt-2 p-2.5 rounded-lg bg-muted/40 border border-border/70 space-y-1.5 text-xs">
                        {s.topic && (
                          <div className="font-medium text-foreground">
                            <span>الدرس: </span>
                            <span className="text-foreground/90">{s.topic}</span>
                          </div>
                        )}
                        {s.homework && (
                          <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
                            <span className="font-bold">الواجب: </span>
                            <span>{s.homework}</span>
                          </div>
                        )}
                        {s.notes && (
                          <div className="text-[11px] text-muted-foreground">
                            <span>ملاحظات: </span>
                            <span>{s.notes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Enrollments */}
      {activeTab === "enrollments" && (
        <div className="rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm overflow-hidden divide-y divide-border/60">
          {enrollments.length === 0 ? (
            <div className="text-center py-12 px-4 text-xs text-muted-foreground">
              لا توجد باقات مسجلة للطالب
            </div>
          ) : (
            enrollments.map((e) => {
              const isGroup = e.enrollmentType === "GROUP";
              const total = e.package?.hoursCount ?? 0;
              const remaining = e.remainingHours || 0;
              const pct = total > 0 ? Math.min(100, Math.round((remaining / total) * 100)) : 0;
              const price = isGroup ? (e.feeAmount || e.package?.price || 0) : (e.package?.price || 0);

              return (
                <div
                  key={e.id}
                  className="p-5 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">
                        {e.groupName || e.package?.name || "اشتراك تعليمي"}
                      </h4>
                      {isGroup ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
                          مجموعة دراسية
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          باقة خاصة
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {e.subject?.name || "—"} • المعلم: {e.teacher?.name || "لم يحدد"}
                    </p>
                    {!isGroup && total > 0 ? (
                      <div className="w-full pt-1 space-y-1">
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                          <span>المتبقي: {remaining} ساعة</span>
                          <span>الإجمالي: {total} ساعة</span>
                        </div>
                      </div>
                    ) : isGroup ? (
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span>نظام الرسوم: {e.feeType === "PER_SESSION" ? "رسوم لكل حصة" : "اشتراك شهري منتظم"}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="text-left font-mono">
                    <div className="text-sm font-bold text-foreground">
                      {price > 0 ? `${price.toLocaleString("ar-EG")} ج.م` : "—"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {isGroup ? "رسوم المجموعة" : "سعر الباقة"}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 3: Grades & certificates */}
      {activeTab === "academics" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border/70 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-foreground">نتائج الامتحانات</h3>
              <span className="text-[10px] text-muted-foreground font-mono">{examResults.length}</span>
            </div>
            {examResults.length === 0 ? (
              <div className="text-center py-10 px-4 text-xs text-muted-foreground">
                لا توجد نتائج منشورة بعد
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {examResults.map((result) => (
                  <div key={result.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{result.examTitle}</p>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {result.publishedAt ? new Date(result.publishedAt).toLocaleDateString("ar-EG") : "—"}
                      </p>
                      {result.notes ? (
                        <p className="text-[11px] text-muted-foreground mt-1">{result.notes}</p>
                      ) : null}
                    </div>
                    <div className="text-left shrink-0 font-mono tabular-nums">
                      <div className="text-sm font-bold text-foreground">
                        {result.score === null || result.score === undefined ? "—" : result.score} / {result.maxScore}
                      </div>
                      {result.grade ? (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">
                          {result.grade}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border/70 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-foreground">الشهادات</h3>
              <span className="text-[10px] text-muted-foreground font-mono">{certificates.length}</span>
            </div>
            {certificates.length === 0 ? (
              <div className="text-center py-10 px-4 text-xs text-muted-foreground">
                لا توجد شهادات صادرة بعد
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {certificates.map((certificate) => (
                  <div key={certificate.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{certificate.title}</p>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {certificate.serialNumber} · {new Date(certificate.issuedAt).toLocaleDateString("ar-EG")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadCertificate(certificate.id, certificate.serialNumber)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 text-[11px] font-semibold text-foreground hover:bg-muted shrink-0"
                    >
                      تحميل PDF
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentChildDetailPage;

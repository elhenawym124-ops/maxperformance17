import React, { useEffect, useState, useMemo } from "react";
import {
  CalendarDays,
  Clock,
  Search,
  RefreshCw,
  CheckCircle2,
  CalendarCheck,
  BookOpen,
  CheckCircle,
  XCircle,
  FileText,
  Users,
  Check,
  X,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

interface Session {
  id: string;
  scheduledAt: string;
  plannedDuration: number;
  actualDuration: number | null;
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  sessionType?: "PRIVATE" | "GROUP";
  groupName?: string;
  groupId?: string;
  room?: string;
  topic?: string | null;
  homework?: string | null;
  evaluationGrade?: string | null;
  isRescheduleRequested?: boolean;
  rescheduleRequestDetails?: string | null;
  notes?: string | null;
  student: { id?: string; firstName: string; lastName: string; phone?: string };
  subject: { name: string };
  enrollment?: { remainingHours: number };
}

interface GroupStudentItem {
  id: string;
  code?: string;
  firstName: string;
  lastName: string;
  status: "PRESENT" | "ABSENT" | "EXCUSED";
  notes?: string;
}

export default function TeacherSchedulePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTab, setFilterTab] = useState<"ALL" | "UPCOMING" | "CONFIRMED" | "PAST">("UPCOMING");
  const [searchQuery, setSearchQuery] = useState("");

  // Complete / Attendance Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [formTopic, setFormTopic] = useState("");
  const [formHomework, setFormHomework] = useState("");
  const [formEvaluationGrade, setFormEvaluationGrade] = useState("");
  const [formDuration, setFormDuration] = useState(60);
  const [formNotes, setFormNotes] = useState("");
  const [groupStudents, setGroupStudents] = useState<GroupStudentItem[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Reschedule Modal State
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleSession, setRescheduleSession] = useState<Session | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [rescheduleSuccessMsg, setRescheduleSuccessMsg] = useState<string | null>(null);
  const [rescheduleErrorMsg, setRescheduleErrorMsg] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem("teacherToken") || localStorage.getItem("token");
      const res = await fetch("/api/v1/education/teacher-portal/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setSessions(json.data);
      } else {
        setSessions([]);
      }
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchSessions();
  }, []);

  const now = useMemo(() => new Date(), []);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const sDate = new Date(s.scheduledAt);
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (s.student?.firstName || "").toLowerCase().includes(q) ||
        (s.student?.lastName || "").toLowerCase().includes(q) ||
        (s.subject?.name || "").toLowerCase().includes(q) ||
        (s.topic || "").toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterTab === "UPCOMING") {
        return sDate >= now && s.status !== "CANCELLED";
      }
      if (filterTab === "CONFIRMED") {
        return s.status === "CONFIRMED";
      }
      if (filterTab === "PAST") {
        return sDate < now || s.status === "COMPLETED";
      }
      return true;
    });
  }, [sessions, filterTab, searchQuery, now]);

  const upcomingCount = useMemo(
    () => sessions.filter((s) => new Date(s.scheduledAt) >= now && s.status !== "CANCELLED").length,
    [sessions, now]
  );
  const completedCount = useMemo(
    () => sessions.filter((s) => s.status === "COMPLETED" || new Date(s.scheduledAt) < now).length,
    [sessions, now]
  );
  const confirmedCount = useMemo(
    () => sessions.filter((s) => s.status === "CONFIRMED").length,
    [sessions]
  );

  // Open Log / Complete Modal
  const handleOpenCompleteModal = async (session: Session) => {
    setActiveSession(session);
    setFormTopic(session.topic || "");
    setFormHomework(session.homework || "");
    setFormEvaluationGrade(session.evaluationGrade || "");
    setFormDuration(session.actualDuration || session.plannedDuration || 60);
    setFormNotes(session.notes || "");
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    setModalOpen(true);

    if (session.sessionType === "GROUP" && session.groupId) {
      try {
        setLoadingStudents(true);
        const token = localStorage.getItem("teacherToken") || localStorage.getItem("token");
        const [stRes, attRes] = await Promise.all([
          fetch(`/api/v1/education/teacher-portal/groups/${session.groupId}/students`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.json()).catch(() => ({ success: false })),
          fetch(`/api/v1/education/teacher-portal/groups/sessions/${session.id}/attendance`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.json()).catch(() => ({ success: false }))
        ]);

        const studentsList = Array.isArray(stRes?.data) ? stRes.data : [];
        const existingAttendance = Array.isArray(attRes?.data) ? attRes.data : [];
        const attMap = new Map(existingAttendance.map((a: any) => [a.studentId, a.status]));

        setGroupStudents(
          studentsList.map((st: any) => ({
            id: st.id,
            code: st.code,
            firstName: st.firstName,
            lastName: st.lastName,
            status: (attMap.get(st.id) as any) || "PRESENT",
            notes: ""
          }))
        );
      } catch (err) {
        console.error("Error loading group students:", err);
      } finally {
        setLoadingStudents(false);
      }
    }
  };

  const handleStudentStatusChange = (studentId: string, status: "PRESENT" | "ABSENT" | "EXCUSED") => {
    setGroupStudents(prev =>
      prev.map(st => st.id === studentId ? { ...st, status } : st)
    );
  };

  const handleSubmitComplete = async () => {
    if (!activeSession) return;
    try {
      setSubmitting(true);
      setActionErrorMsg(null);
      const token = localStorage.getItem("teacherToken") || localStorage.getItem("token");

      const payload: any = {
        actualDuration: Number(formDuration),
        topic: formTopic.trim(),
        homework: formHomework.trim(),
        evaluationGrade: formEvaluationGrade.trim(),
        notes: formNotes.trim()
      };

      if (activeSession.sessionType === "GROUP") {
        payload.attendanceList = groupStudents.map(st => ({
          studentId: st.id,
          status: st.status,
          notes: st.notes
        }));
      }

      const res = await fetch(`/api/v1/education/teacher-portal/sessions/${activeSession.id}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        setActionSuccessMsg(json.message || "تم حفظ بيانات الحصة بنجاح!");
        setTimeout(() => {
          setModalOpen(false);
          setActionSuccessMsg(null);
          void fetchSessions();
        }, 1200);
      } else {
        setActionErrorMsg(json.message || "حدث خطأ أثناء حفظ بيانات الحصة");
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || "فشل الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Reschedule Modal
  const handleOpenRescheduleModal = (session: Session) => {
    setRescheduleSession(session);
    try {
      const dt = new Date(session.scheduledAt);
      const offsetMs = dt.getTimezoneOffset() * 60000;
      const localISOTime = new Date(dt.getTime() - offsetMs).toISOString().slice(0, 16);
      setRescheduleDate(localISOTime);
    } catch {
      setRescheduleDate("");
    }
    setRescheduleNotes("");
    setRescheduleSuccessMsg(null);
    setRescheduleErrorMsg(null);
    setRescheduleModalOpen(true);
  };

  const handleSubmitReschedule = async () => {
    if (!rescheduleSession || !rescheduleDate) return;
    try {
      setRescheduleSubmitting(true);
      setRescheduleErrorMsg(null);
      const token = localStorage.getItem("teacherToken") || localStorage.getItem("token");

      const res = await fetch(`/api/v1/education/teacher-portal/sessions/${rescheduleSession.id}/reschedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          newScheduledAt: new Date(rescheduleDate).toISOString(),
          notes: rescheduleNotes.trim()
        })
      });

      const json = await res.json();
      if (json.success) {
        setRescheduleSuccessMsg(json.message || "تمت إعادة جدولة الحصة وتحديد الموعد الجديد بنجاح!");
        setTimeout(() => {
          setRescheduleModalOpen(false);
          setRescheduleSuccessMsg(null);
          void fetchSessions();
        }, 1200);
      } else {
        setRescheduleErrorMsg(json.message || "حدث خطأ أثناء إعادة الجدولة");
      }
    } catch (err: any) {
      setRescheduleErrorMsg(err.message || "فشل الاتصال بالخادم");
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-2.5 text-muted-foreground">
        <RefreshCw className="size-5 animate-spin text-primary" />
        <span className="text-xs font-mono">جاري تحميل جدول الحصص والمواعيد...</span>
      </div>
    );
  }

  const renderStatusBadge = (status: Session["status"]) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <CheckCircle className="size-3" />
            مؤكدة
          </span>
        );
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Clock className="size-3" />
            مجدولة
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border bg-primary/10 text-primary border-primary/20">
            <CheckCircle2 className="size-3" />
            مكتملة
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="size-3" />
            ملغية
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-4" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border/70 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <CalendarCheck className="size-4" />
            </span>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              جدول الحصص والمواعيد
            </h1>
            <Badge variant="outline" className="text-[11px] font-mono border-border/80 bg-muted/30">
              {sessions.length} حصة مسجلة
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            إدارة مواعيد الحصص المباشرة، تسجيل ما تم شرحه والواجبات، ورصد حضور الطلاب مباشرة
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto font-mono text-xs">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchSessions()}
            disabled={refreshing}
            className="h-8 px-2.5 text-xs font-mono gap-1 border-border/70 active:scale-[0.98]"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </Button>
        </div>
      </div>

      {/* Filter Ribbon & Search Bar */}
      <div className="p-2.5 sm:p-3 rounded-lg border border-border/70 bg-card shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Tabs */}
        <div className="flex items-center gap-1 font-mono text-xs overflow-x-auto">
          {[
            { id: "UPCOMING", label: `القادمة (${upcomingCount})` },
            { id: "CONFIRMED", label: `المؤكدة (${confirmedCount})` },
            { id: "PAST", label: `المكتملة (${completedCount})` },
            { id: "ALL", label: `الكل (${sessions.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
                filterTab === tab.id
                  ? "bg-card text-foreground font-semibold shadow-xs border border-border/70"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <Search className="size-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="بحث بالطالب أو المادة أو الدرس..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pr-8 text-xs font-mono bg-background border-border/70"
          />
        </div>
      </div>

      {/* Sessions Single-Surface Container */}
      <div className="rounded-lg border border-border/70 bg-card shadow-xs overflow-hidden">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <CalendarDays className="size-9 text-muted-foreground/40 mx-auto" />
            <p className="text-xs font-semibold text-foreground font-mono">
              لا توجد حصص مطابقة للمعايير المحددة
            </p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              جرب تغيير التبويب أو تصفية البحث لرؤية الحصص الأخرى
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filteredSessions.map((session) => {
              const sessionDate = new Date(session.scheduledAt);
              const isPast = sessionDate < now;
              const isConfirmed = session.status === "CONFIRMED" || session.status === "COMPLETED";

              return (
                <div
                  key={session.id}
                  className="p-3.5 sm:p-4 hover:bg-muted/30 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-md bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpen className="size-4" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xs font-semibold text-foreground">
                          {session.student?.firstName || ""} {session.student?.lastName || ""}
                        </h3>
                        {session.sessionType === "GROUP" ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border bg-purple-500/10 text-purple-600 border-purple-500/20">
                            مجموعة: {session.groupName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border bg-blue-500/10 text-blue-600 border-blue-500/20">
                            حصة فردية
                          </span>
                        )}
                        {renderStatusBadge(session.status)}
                      </div>

                      <p className="text-[11px] text-muted-foreground font-mono">
                        {session.subject?.name || "—"}
                      </p>

                      <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-muted-foreground pt-0.5 font-mono">
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Clock className="size-3 text-primary" />
                          {session.actualDuration || session.plannedDuration} دقيقة
                        </span>
                        <span>•</span>
                        <span className="tabular-nums">
                          {sessionDate.toLocaleDateString("ar-EG", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span>•</span>
                        <span className="tabular-nums">
                          {sessionDate.toLocaleTimeString("ar-EG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {session.room && (
                          <>
                            <span>•</span>
                            <span className="text-[10px] text-muted-foreground/80">
                              القاعة: {session.room}
                            </span>
                          </>
                        )}
                        {session.enrollment && (
                          <>
                            <span>•</span>
                            <span className="text-[10px] text-muted-foreground/70">
                              المتبقي للطالب: {session.enrollment.remainingHours} ساعة
                            </span>
                          </>
                        )}
                      </div>

                      {/* Topic & Homework Display */}
                      {(session.topic || session.homework || session.evaluationGrade) && (
                        <div className="pt-1.5 space-y-1">
                          {session.topic && (
                            <div className="flex items-center gap-1.5 text-xs text-foreground/90 font-medium">
                              <FileText className="size-3 text-primary shrink-0" />
                              <span>الدرس: {session.topic}</span>
                            </div>
                          )}
                          {session.homework && (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px]">
                              <Sparkles className="size-3 shrink-0" />
                              <span>الواجب: {session.homework}</span>
                            </div>
                          )}
                          {session.evaluationGrade && (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-mono mr-2">
                              <CheckCircle2 className="size-3 shrink-0" />
                              <span>التقييم: {session.evaluationGrade}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Reschedule Request from Parent Banner */}
                      {session.isRescheduleRequested && (
                        <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="size-4 text-amber-600 shrink-0" />
                            <div>
                              <span className="font-bold">طلب اعتذار / تأجيل من ولي الأمر: </span>
                              <span>{session.rescheduleRequestDetails || "يرجى تحديد موعد بديل"}</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenRescheduleModal(session)}
                            className="h-7 text-xs font-mono bg-amber-500/20 border-amber-500/40 text-amber-950 dark:text-amber-100 hover:bg-amber-500/30 shrink-0"
                          >
                            الموافقة وتحديد موعد جديد
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Button */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {!isConfirmed && session.sessionType !== "GROUP" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenRescheduleModal(session)}
                        className="h-8 text-xs font-mono gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Clock className="size-3.5" />
                        <span>إعادة جدولة</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={isConfirmed ? "outline" : "default"}
                      onClick={() => void handleOpenCompleteModal(session)}
                      className="h-8 text-xs font-mono gap-1.5 px-3"
                    >
                      <FileText className="size-3.5" />
                      <span>{isConfirmed ? "تعديل التقرير والواجب" : (session.sessionType === "GROUP" ? "تسجيل الحضور والمحاضرة" : "إنهاء الحصة وتسجيل الواجب")}</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completion & Attendance Modal */}
      {modalOpen && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in" dir="rtl">
          <div className="bg-card text-card-foreground border border-border shadow-xl rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border/70 pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <span>
                    {activeSession.sessionType === "GROUP"
                      ? `تسجيل محاضرة وحضور: ${activeSession.groupName}`
                      : `إنهاء وتأكيد حصة: ${activeSession.student.firstName} ${activeSession.student.lastName}`}
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeSession.subject.name} • {new Date(activeSession.scheduledAt).toLocaleDateString("ar-EG")}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Notification Messages */}
            {actionSuccessMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}
            {actionErrorMsg && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="size-4 shrink-0" />
                <span>{actionErrorMsg}</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3.5">
              {/* Lesson Topic */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  عنوان الدرس / ما تم شرحه اليوم <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="مثال: شرح درس المعادلات الخطية وحل تدريبات ص 24"
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>

              {/* Homework Assignment */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3 text-amber-500" />
                  <span>الواجب والتكليفات المنزلية لولي الأمر والطالب</span>
                </label>
                <Input
                  type="text"
                  placeholder="مثال: حل تمارين الكتاب من ص 28 إلى 30 وتسليمها الحصة القادمة"
                  value={formHomework}
                  onChange={(e) => setFormHomework(e.target.value)}
                  className="h-8 text-xs bg-background border-amber-500/30 focus-visible:ring-amber-500"
                />
              </div>

              {/* Actual Duration (Private Session) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    المدة الفعلية للحصة (بالدقائق)
                  </label>
                  <Input
                    type="number"
                    min="15"
                    max="240"
                    step="5"
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    خصم الساعات
                  </label>
                  <div className="h-8 flex items-center px-2.5 rounded border border-border bg-muted/40 text-xs font-mono text-muted-foreground">
                    {(formDuration / 60).toFixed(2)} ساعة
                  </div>
                </div>
              </div>

              {/* Group Attendance List */}
              {activeSession.sessionType === "GROUP" && (
                <div className="space-y-2 border-t border-border/60 pt-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Users className="size-3.5 text-purple-600" />
                      <span>رصد حضور وغياب طلاب المجموعة ({groupStudents.length})</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      حاضر: {groupStudents.filter(s => s.status === 'PRESENT').length} | غائب: {groupStudents.filter(s => s.status === 'ABSENT').length}
                    </span>
                  </div>

                  {loadingStudents ? (
                    <div className="text-center py-4 text-xs text-muted-foreground font-mono flex items-center justify-center gap-2">
                      <RefreshCw className="size-3.5 animate-spin text-primary" />
                      <span>جاري تحميل قائمة الطلاب...</span>
                    </div>
                  ) : groupStudents.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 text-center">لا يوجد طلاب نشطون مسجلون في هذه المجموعة حالياً.</p>
                  ) : (
                    <div className="divide-y divide-border/60 border border-border/70 rounded-lg max-h-48 overflow-y-auto">
                      {groupStudents.map((st) => (
                        <div key={st.id} className="p-2 flex items-center justify-between gap-2 hover:bg-muted/20">
                          <span className="text-xs font-medium text-foreground">
                            {st.firstName} {st.lastName}
                          </span>
                          <div className="flex items-center gap-1 font-mono text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleStudentStatusChange(st.id, "PRESENT")}
                              className={`px-2 py-0.5 rounded transition-all ${
                                st.status === "PRESENT"
                                  ? "bg-emerald-500 text-white font-bold"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              حاضر
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStudentStatusChange(st.id, "ABSENT")}
                              className={`px-2 py-0.5 rounded transition-all ${
                                st.status === "ABSENT"
                                  ? "bg-destructive text-white font-bold"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              غائب
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStudentStatusChange(st.id, "EXCUSED")}
                              className={`px-2 py-0.5 rounded transition-all ${
                                st.status === "EXCUSED"
                                  ? "bg-amber-500 text-white font-bold"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              معذور
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Academic Evaluation Grade */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3 text-emerald-500" />
                  <span>درجة التقييم أو الاختبار السريع (اختياري)</span>
                </label>
                <Input
                  type="text"
                  placeholder="مثال: 95% أو 10/10 أو ممتاز"
                  value={formEvaluationGrade}
                  onChange={(e) => setFormEvaluationGrade(e.target.value)}
                  className="h-8 text-xs bg-background border-emerald-500/30 focus-visible:ring-emerald-500 font-mono"
                />
              </div>

              {/* Teacher Notes / Academic Evaluation */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  ملاحظات المعلم والتقييم الأكاديمي (يظهر لولي الأمر والإدارة)
                </label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات حول مستوى الطالب، تفاعله، أو نقاط تحتاج إلى تركيز..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-border bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="h-8 text-xs"
              >
                إلغاء
              </Button>
              <Button
                size="sm"
                onClick={() => void handleSubmitComplete()}
                disabled={submitting || !formTopic.trim()}
                className="h-8 text-xs font-medium gap-1.5"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>جاري الحفظ والاعتماد...</span>
                  </>
                ) : (
                  <>
                    <Check className="size-3.5" />
                    <span>تأكيد واعتماد الحصة</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalOpen && rescheduleSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in" dir="rtl">
          <div className="bg-card text-card-foreground border border-border shadow-xl rounded-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-border/70 pb-3">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  <span>إعادة جدولة موعد الحصة</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  الطالب: {rescheduleSession.student.firstName} {rescheduleSession.student.lastName} • {rescheduleSession.subject.name}
                </p>
              </div>
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Reschedule Notification Messages */}
            {rescheduleSuccessMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{rescheduleSuccessMsg}</span>
              </div>
            )}
            {rescheduleErrorMsg && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="size-4 shrink-0" />
                <span>{rescheduleErrorMsg}</span>
              </div>
            )}

            {rescheduleSession.isRescheduleRequested && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <AlertCircle className="size-3.5 text-amber-600" />
                  طلب ولي الأمر الأصلي:
                </span>
                <p className="text-[11px] font-mono pr-4.5">{rescheduleSession.rescheduleRequestDetails}</p>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  الموعد والتوقيت الجديد <span className="text-destructive">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="h-8 text-xs font-mono bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  ملاحظات موجهة لولي الأمر حول الموعد البديل (اختياري)
                </label>
                <textarea
                  rows={2}
                  placeholder="مثال: تم الاتفاق على تبكير الموعد ساعة واحدة بناءً على طلبكم..."
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-border bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRescheduleModalOpen(false)}
                disabled={rescheduleSubmitting}
                className="h-8 text-xs"
              >
                إلغاء
              </Button>
              <Button
                size="sm"
                onClick={() => void handleSubmitReschedule()}
                disabled={rescheduleSubmitting || !rescheduleDate}
                className="h-8 text-xs font-medium gap-1.5"
              >
                {rescheduleSubmitting ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>جاري تحديث الموعد...</span>
                  </>
                ) : (
                  <>
                    <Check className="size-3.5" />
                    <span>تأكيد الموعد الجديد</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

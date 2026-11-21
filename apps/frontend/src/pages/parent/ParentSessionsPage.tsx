import React, { useEffect, useState, useMemo } from "react";
import {
  CalendarDays,
  Clock,
  User,
  BookOpen,
  RefreshCw,
  CheckCircle2,
  CalendarCheck,
  GraduationCap,
  Sparkles,
  FileText,
  AlertCircle,
  X,
  Check,
  CalendarPlus,
  HelpCircle
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

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
  evaluationGrade?: string | null;
  rescheduledInfo?: string | null;
  notes?: string | null;
  subject: { name: string };
  teacher: { name: string };
  student?: { firstName: string; lastName: string };
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  enrollments?: Array<{
    id: string;
    remainingHours: number;
    package?: { id: string; name: string };
    teacher?: { id: string; name: string };
  }>;
}

const ParentSessionsPage: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [sessionsMap, setSessionsMap] = useState<Record<string, Session[]>>({});
  const [selectedChildId, setSelectedChildId] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reschedule Request Modal State
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedSessionForReschedule, setSelectedSessionForReschedule] = useState<Session | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleProposedDate, setRescheduleProposedDate] = useState("");
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState<string | null>(null);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Quick Book Session Modal State
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [bookChildId, setBookChildId] = useState("");
  const [bookEnrollmentId, setBookEnrollmentId] = useState("");
  const [bookTeacherId, setBookTeacherId] = useState("");
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string }>>([]);
  const [bookDateTime, setBookDateTime] = useState("");
  const [bookNotes, setBookNotes] = useState("");
  const [bookSubmitting, setBookSubmitting] = useState(false);
  const [bookSuccess, setBookSuccess] = useState<string | null>(null);
  const [bookError, setBookError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem("parentToken");
      const res = await fetch("/api/v1/education/parent-portal/children", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      if (d.success && Array.isArray(d.data) && d.data.length > 0) {
        setChildren(d.data);
        const results = await Promise.all(
          d.data.map(async (child: Child) => {
            try {
              const sRes = await fetch(
                `/api/v1/education/parent-portal/children/${child.id}/sessions`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const sJson = await sRes.json();
              return { childId: child.id, sessions: (sJson.success && Array.isArray(sJson.data)) ? sJson.data : [] };
            } catch {
              return { childId: child.id, sessions: [] };
            }
          })
        );
        const map: Record<string, Session[]> = {};
        results.forEach(({ childId, sessions }) => {
          map[childId] = sessions;
        });
        setSessionsMap(map);
      } else {
        setChildren([]);
        setSessionsMap({});
      }
      // Fetch teachers for booking
      try {
        const tRes = await fetch("/api/v1/education/parent-portal/teachers", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const tJson = await tRes.json();
        if (tJson.success && Array.isArray(tJson.data)) {
          setTeachers(tJson.data);
        }
      } catch {}
    } catch {
      setChildren([]);
      setSessionsMap({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const allSessions = useMemo(() => {
    if (selectedChildId === "ALL") {
      return Object.entries(sessionsMap).flatMap(([cId, sList]) => {
        const child = children.find((c) => c.id === cId);
        return sList.map((s) => ({
          ...s,
          student: s.student || (child ? { firstName: child.firstName, lastName: child.lastName } : undefined)
        }));
      });
    }
    const child = children.find((c) => c.id === selectedChildId);
    return (sessionsMap[selectedChildId] || []).map((s) => ({
      ...s,
      student: s.student || (child ? { firstName: child.firstName, lastName: child.lastName } : undefined)
    }));
  }, [sessionsMap, selectedChildId, children]);

  // Handle Reschedule Submit
  const handleSubmitReschedule = async () => {
    if (!selectedSessionForReschedule) return;
    try {
      setRescheduleSubmitting(true);
      setRescheduleError(null);
      const token = localStorage.getItem("parentToken");

      const res = await fetch(`/api/v1/education/parent-portal/sessions/${selectedSessionForReschedule.id}/request-reschedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: rescheduleReason.trim(),
          requestedDate: rescheduleProposedDate.trim()
        })
      });

      const json = await res.json();
      if (json.success) {
        setRescheduleSuccess(json.message || "تم إرسال طلب الاعتذار بنجاح!");
        setTimeout(() => {
          setRescheduleModalOpen(false);
          setRescheduleSuccess(null);
          void fetchData();
        }, 1400);
      } else {
        setRescheduleError(json.message || "حدث خطأ في تقديم طلب التأجيل");
      }
    } catch (err: any) {
      setRescheduleError(err.message || "فشل الاتصال بالخادم");
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  // Handle Book Session Submit
  const handleOpenBookModal = () => {
    const defaultChild = children[0];
    setBookChildId(defaultChild ? defaultChild.id : "");
    const defaultEnr = defaultChild?.enrollments?.[0];
    setBookEnrollmentId(defaultEnr ? defaultEnr.id : "");
    setBookTeacherId(defaultEnr?.teacher?.id || (teachers[0]?.id || ""));
    setBookDateTime("");
    setBookNotes("");
    setBookSuccess(null);
    setBookError(null);
    setBookModalOpen(true);
  };

  const selectedChildEnrollments = useMemo(() => {
    const c = children.find(ch => ch.id === bookChildId);
    return c?.enrollments || [];
  }, [children, bookChildId]);

  const selectedEnrollment = useMemo(() => {
    return selectedChildEnrollments.find(e => e.id === bookEnrollmentId);
  }, [selectedChildEnrollments, bookEnrollmentId]);

  const handleSubmitBook = async () => {
    if (!bookChildId || !bookEnrollmentId || !bookDateTime) {
      setBookError("يرجى اختيار الطالب، الباقة، وتحديد موعد الحصة");
      return;
    }
    const effectiveTeacherId = selectedEnrollment?.teacher?.id || bookTeacherId;
    if (!effectiveTeacherId) {
      setBookError("يرجى اختيار المعلم للحصة");
      return;
    }
    try {
      setBookSubmitting(true);
      setBookError(null);
      const token = localStorage.getItem("parentToken");

      const res = await fetch("/api/v1/education/parent-portal/sessions/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: bookChildId,
          enrollmentId: bookEnrollmentId,
          teacherId: effectiveTeacherId,
          scheduledAt: new Date(bookDateTime).toISOString(),
          notes: bookNotes.trim()
        })
      });

      const json = await res.json();
      if (json.success) {
        setBookSuccess(json.message || "تم حجز الحصة بنجاح!");
        setTimeout(() => {
          setBookModalOpen(false);
          setBookSuccess(null);
          void fetchData();
        }, 1400);
      } else {
        setBookError(json.message || "فشل حجز الحصة");
      }
    } catch (err: any) {
      setBookError(err.message || "فشل الاتصال بالخادم");
    } finally {
      setBookSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] space-y-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs font-mono text-muted-foreground uppercase">جاري تحميل جدول الحصص...</p>
      </div>
    );
  }

  const upcomingCount = allSessions.filter(
    (s) => s.status !== "CANCELLED" && new Date(s.scheduledAt) >= new Date()
  ).length;

  const renderAttendanceBadge = (status?: string) => {
    switch (status) {
      case "PRESENT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <CheckCircle2 className="size-3" />
            حاضر
          </span>
        );
      case "ABSENT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border bg-rose-500/10 text-rose-600 border-rose-500/20">
            <AlertCircle className="size-3" />
            غائب
          </span>
        );
      case "EXCUSED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border bg-amber-500/10 text-amber-600 border-amber-500/20">
            <HelpCircle className="size-3" />
            معذور
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-10" dir="rtl">
      {/* Telemetry Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-primary/10 text-primary border border-primary/20">
              ACADEMIC SESSIONS
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              إجمالي {allSessions.length} حصة مسجلة
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">جدول حصص الأبناء والواجبات</h1>
          <p className="text-xs text-muted-foreground">
            متابعة ما تم شرحه بالحصة، التكليفات والواجبات المنزلية، وسجل الحضور الفعلي
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={handleOpenBookModal}
            className="h-8 px-3 text-xs font-medium gap-1.5"
          >
            <CalendarPlus className="size-3.5" />
            <span>حجز موعد حصة</span>
          </Button>

          <button
            onClick={fetchData}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/80 bg-background hover:bg-muted text-foreground transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">الحصص القادمة</span>
            <CalendarCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-foreground mt-2">
            {upcomingCount} حصة
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">الطلاب المشمولون</span>
            <GraduationCap className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-foreground mt-2">
            {children.length} طلاب
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">إجمالي الحصص</span>
            <CalendarDays className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-foreground mt-2">
            {allSessions.length} حصة
          </div>
        </div>
      </div>

      {/* Children Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/50 text-xs w-fit overflow-x-auto">
        <button
          onClick={() => setSelectedChildId("ALL")}
          className={`px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap ${
            selectedChildId === "ALL"
              ? "bg-background text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          كافة الأبناء ({children.length})
        </button>
        {children.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedChildId(c.id)}
            className={`px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap ${
              selectedChildId === c.id
                ? "bg-background text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.firstName} {c.lastName}
          </button>
        ))}
      </div>

      {/* Sessions Single-Surface Container */}
      <div className="rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm overflow-hidden">
        {allSessions.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto stroke-1" />
            <p className="text-sm font-medium text-foreground">لا توجد حصص مجدولة حالياً</p>
            <p className="text-xs text-muted-foreground">سيظهر موعد الحصة فور حجزها مع المعلم أو إضافتها من المركز</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {allSessions.map((s) => {
              const sessionDate = new Date(s.scheduledAt);
              const isPast = sessionDate < new Date();
              const dateStr = sessionDate.toLocaleDateString("ar-EG", {
                weekday: "long",
                year: "numeric",
                month: "short",
                day: "numeric"
              });
              const timeStr = sessionDate.toLocaleTimeString("ar-EG", {
                hour: "2-digit",
                minute: "2-digit"
              });

              return (
                <div
                  key={s.id}
                  className="p-5 hover:bg-muted/30 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpen className="w-5 h-5" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">
                          {s.subject?.name || "حصة تدريس"}
                        </h3>
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
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                            s.status === "CONFIRMED" || s.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          }`}
                        >
                          {s.status === "CONFIRMED" || s.status === "COMPLETED" ? "مؤكدة / مكتملة" : "مجدولة"}
                        </span>
                        {renderAttendanceBadge(s.attendanceStatus)}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                        <span className="flex items-center gap-1 text-foreground/80">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          {s.actualDuration || s.plannedDuration} دقيقة
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                          {dateStr} — {timeStr}
                        </span>
                        {s.room && (
                          <>
                            <span>•</span>
                            <span className="text-muted-foreground/80">
                              القاعة: {s.room}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>المعلم: {s.teacher?.name || "معلم المادة"}</span>
                        </span>
                        {s.student && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="font-medium text-foreground">
                                الطالب: {s.student.firstName} {s.student.lastName}
                              </span>
                            </span>
                          </>
                        )}
                      </div>

                      {/* Topic, Homework, Evaluation & Notes Display */}
                      {(s.topic || s.homework || s.evaluationGrade || s.rescheduledInfo || s.notes) && (
                        <div className="mt-2.5 p-3 rounded-lg bg-muted/40 border border-border/70 space-y-2 text-xs">
                          {s.topic && (
                            <div className="flex items-start gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold text-foreground">موضوع الدرس: </span>
                                <span className="text-foreground/90">{s.topic}</span>
                              </div>
                            </div>
                          )}

                          {s.evaluationGrade && (
                            <div className="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">درجة التقييم والأداء: </span>
                                <span className="font-mono font-semibold">{s.evaluationGrade}</span>
                              </div>
                            </div>
                          )}

                          {s.rescheduledInfo && (
                            <div className="p-2 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300 flex items-start gap-2">
                              <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">الموعد الجديد المعتمد من المعلم: </span>
                                <span>{s.rescheduledInfo}</span>
                              </div>
                            </div>
                          )}

                          {s.homework && (
                            <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">الواجب والتكليف المنزلي: </span>
                                <span>{s.homework}</span>
                              </div>
                            </div>
                          )}

                          {s.notes && (
                            <div className="text-[11px] text-muted-foreground">
                              <span className="font-medium">ملاحظات المعلم: </span>
                              <span>{s.notes}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reschedule Button for upcoming sessions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {!isPast && (s.status === "SCHEDULED" || s.status === "CONFIRMED") && s.sessionType !== "GROUP" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSessionForReschedule(s);
                          setRescheduleReason("");
                          setRescheduleProposedDate("");
                          setRescheduleSuccess(null);
                          setRescheduleError(null);
                          setRescheduleModalOpen(true);
                        }}
                        className="h-8 text-xs font-mono text-muted-foreground hover:text-foreground"
                      >
                        طلب اعتذار / تأجيل
                      </Button>
                    )}
                    <span className="text-xs font-mono px-2.5 py-1 rounded bg-muted text-muted-foreground border border-border/50">
                      {isPast ? "حصة منتهية" : "موعد قائم"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reschedule Request Modal */}
      {rescheduleModalOpen && selectedSessionForReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in" dir="rtl">
          <div className="bg-card text-card-foreground border border-border shadow-xl rounded-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-border/70 pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">طلب اعتذار أو تأجيل موعد الحصة</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedSessionForReschedule.subject.name} مع المعلم {selectedSessionForReschedule.teacher.name}
                </p>
              </div>
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="size-4" />
              </button>
            </div>

            {rescheduleSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-medium flex items-center gap-2">
                <Check className="size-4" />
                <span>{rescheduleSuccess}</span>
              </div>
            )}
            {rescheduleError && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                <AlertCircle className="size-4" />
                <span>{rescheduleError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">سبب الاعتذار أو طلب التأجيل *</label>
                <textarea
                  rows={2}
                  placeholder="مثال: الطالب لديه وعكة صحية / ظرف عائلي مفاجئ..."
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-border bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">الموعد البديل المقترح (اختياري)</label>
                <Input
                  type="text"
                  placeholder="مثال: يفضل يوم الخميس القادم الساعة 6 مساءً"
                  value={rescheduleProposedDate}
                  onChange={(e) => setRescheduleProposedDate(e.target.value)}
                  className="h-8 text-xs bg-background"
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
                onClick={handleSubmitReschedule}
                disabled={rescheduleSubmitting || !rescheduleReason.trim()}
                className="h-8 text-xs font-medium"
              >
                {rescheduleSubmitting ? "جاري الإرسال..." : "إرسال طلب التأجيل"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Booking Modal */}
      {bookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in" dir="rtl">
          <div className="bg-card text-card-foreground border border-border shadow-xl rounded-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-border/70 pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <CalendarPlus className="size-4 text-primary" />
                  <span>حجز موعد حصة من رصيد الساعات</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  اختر الطالب والباقة المسجلة وحدد التاريخ والوقت المناسب
                </p>
              </div>
              <button
                onClick={() => setBookModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="size-4" />
              </button>
            </div>

            {bookSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-medium flex items-center gap-2">
                <Check className="size-4" />
                <span>{bookSuccess}</span>
              </div>
            )}
            {bookError && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                <AlertCircle className="size-4" />
                <span>{bookError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              {/* Select Child */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">الطالب *</label>
                <select
                  value={bookChildId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setBookChildId(cid);
                    const child = children.find(c => c.id === cid);
                    setBookEnrollmentId(child?.enrollments?.[0]?.id || "");
                  }}
                  className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs"
                >
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Enrollment / Package */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">الباقة المسجلة والرصيد المتاح *</label>
                {selectedChildEnrollments.length === 0 ? (
                  <p className="text-xs text-destructive">لا توجد باقات مفعلة بساعات متبقية لهذا الطالب.</p>
                ) : (
                  <select
                    value={bookEnrollmentId}
                    onChange={(e) => setBookEnrollmentId(e.target.value)}
                    className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs"
                  >
                    {selectedChildEnrollments.map((enr) => (
                      <option key={enr.id} value={enr.id}>
                        {enr.package?.name || "باقة تدريس"} — المتبقي: {enr.remainingHours} ساعة ({enr.teacher?.name ? `المعلم: ${enr.teacher.name}` : "لم يعين معلم"})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Select Teacher if package has no dedicated teacher */}
              {!selectedEnrollment?.teacher?.id && (
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">اختيار المعلم للحصة *</label>
                  <select
                    value={bookTeacherId}
                    onChange={(e) => setBookTeacherId(e.target.value)}
                    className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs"
                  >
                    <option value="">-- اختر المعلم المناسب --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date & Time */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">تاريخ ووقت الحصة *</label>
                <Input
                  type="datetime-local"
                  value={bookDateTime}
                  onChange={(e) => setBookDateTime(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">ملاحظات لمركز التعليم أو المعلم (اختياري)</label>
                <Input
                  type="text"
                  placeholder="أي طلب خاص أو درس محدد للمراجعة..."
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBookModalOpen(false)}
                disabled={bookSubmitting}
                className="h-8 text-xs"
              >
                إلغاء
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitBook}
                disabled={bookSubmitting || !bookChildId || !bookEnrollmentId || !bookDateTime}
                className="h-8 text-xs font-medium"
              >
                {bookSubmitting ? "جاري الحجز..." : "تأكيد الحجز"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentSessionsPage;

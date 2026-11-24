import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Plus, Check, X, Pencil, Clock, BookOpen, User, CalendarPlus, UserX, Trash2, Users, Download } from "lucide-react";
import type {
  EducationSession,
  EducationTeacher,
  EducationSubject,
  EducationEnrollment,
  EducationStudent,
} from "./types";
import { CELL_CLS, SESSION_STATUS, getSessionStatus } from "./types";
import { SessionModal } from "./SessionModal";
import { DateInput } from '../../../components/ui/DateInput';

export interface EducationSessionsTabProps {
  sessions: EducationSession[];
  teachers: EducationTeacher[];
  subjects: EducationSubject[];
  enrollments: EducationEnrollment[];
  students: EducationStudent[];
  sessionFilters: {
    status: string;
    teacherId: string;
    from: string;
    to: string;
  };
  setSessionFilters: React.Dispatch<
    React.SetStateAction<{
      status: string;
      teacherId: string;
      from: string;
      to: string;
    }>
  >;
  sessionModal: Partial<EducationSession> | null | undefined;
  setSessionModal: (s: Partial<EducationSession> | null | undefined) => void;
  handleSaveSession: (d: Partial<EducationSession>) => Promise<void>;
  handleConfirmSession: (
    id: string,
    actualDuration?: number
  ) => Promise<void>;
  handleCancelSession: (id: string) => Promise<void>;
  handleMarkNoShow: (id: string) => Promise<void>;
  handleDeleteSession: (id: string) => Promise<void>;
  handleCancelGroupSession: (session: { id: string; groupId?: string }) => Promise<void>;
  onScheduleMakeup?: (id: string) => void;
}

export const EducationSessionsTab: React.FC<EducationSessionsTabProps> = ({
  sessions,
  teachers,
  subjects,
  enrollments,
  students,
  sessionFilters,
  setSessionFilters,
  sessionModal,
  setSessionModal,
  handleSaveSession,
  handleConfirmSession,
  handleCancelSession,
  handleMarkNoShow,
  handleDeleteSession,
  handleCancelGroupSession,
  onScheduleMakeup,
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const navigate = useNavigate();

  const [sessionTypeFilter, setSessionTypeFilter] = React.useState<"ALL" | "PRIVATE" | "GROUP">("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [visibleCount, setVisibleCount] = React.useState(100);

  const isGroupSession = (s: EducationSession) => s.sessionType === "GROUP";

  const filtered = sessions.filter((s) => {
    if (sessionTypeFilter !== "ALL" && (s.sessionType || "GROUP") !== sessionTypeFilter) return false;
    if (sessionFilters.status && s.status !== sessionFilters.status)
      return false;
    if (sessionFilters.teacherId && s.teacherId !== sessionFilters.teacherId)
      return false;
    if (sessionFilters.from) {
      const fromTs = new Date(`${sessionFilters.from}T00:00:00`).getTime();
      if (new Date(s.scheduledAt).getTime() < fromTs) return false;
    }
    if (sessionFilters.to) {
      const toTs = new Date(`${sessionFilters.to}T23:59:59.999`).getTime();
      if (new Date(s.scheduledAt).getTime() > toTs) return false;
    }
    return true;
  });

  const searched = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter((s) => {
      const haystack = [
        s.student ? `${s.student.firstName} ${s.student.lastName || ""}` : "",
        s.student?.code || "",
        s.groupName || "",
        s.groupCode || "",
        s.room || "",
        s.teacher?.name || "",
        s.subject?.name || "",
        s.topic || "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [filtered, searchQuery]);

  const visible = searched.slice(0, visibleCount);

  const handleExportCsv = () => {
    const rowsToExport = searched;
    if (rowsToExport.length === 0) return;

    const headers = isEn
      ? ["Type", "Student / Group", "Code", "Teacher", "Subject", "Topic", "Room", "Date & Time", "Duration (min)", "Status", "Present", "Absent"]
      : ["النوع", "الطالب / الجروب", "الكود", "المدرس", "المادة", "التوبيك", "القاعة", "التاريخ والوقت", "المدة (دقيقة)", "الحالة", "حاضر", "غائب"];

    const escapeCell = (value: unknown) => {
      const text = value === null || value === undefined ? "" : String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };

    const lines = [headers.map(escapeCell).join(",")];
    for (const s of rowsToExport) {
      const isGroup = isGroupSession(s);
      const who = isGroup
        ? s.groupName || ""
        : s.student
          ? `${s.student.firstName} ${s.student.lastName || ""}`.trim()
          : "";
      const when = new Date(s.scheduledAt);
      const pad2 = (n: number) => String(n).padStart(2, "0");
      const whenText = Number.isNaN(when.getTime())
        ? ""
        : `${when.getFullYear()}-${pad2(when.getMonth() + 1)}-${pad2(when.getDate())} ${pad2(
            when.getHours(),
          )}:${pad2(when.getMinutes())}`;
      lines.push(
        [
          isGroup ? (isEn ? "Group" : "مجموعة") : isEn ? "Private" : "برايفت",
          who,
          isGroup ? s.groupCode || "" : s.student?.code || "",
          s.teacher?.name || "",
          s.subject?.name || "",
          s.topic || "",
          s.room || "",
          whenText,
          s.actualDuration || s.plannedDuration || "",
          getSessionStatus(s.status, isEn).label,
          isGroup ? s.presentCount ?? "" : "",
          isGroup ? s.absentCount ?? "" : "",
        ]
          .map(escapeCell)
          .join(","),
      );
    }

    const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `education-sessions-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  return (
    <div className="space-y-4" dir={isEn ? "ltr" : "rtl"}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-foreground">
            {t("education.sessions.title", isEn ? "Sessions & Schedule Management" : "إدارة الحصص وجداول البرايفت")}
          </h2>
          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => setSessionTypeFilter("ALL")}
              className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                sessionTypeFilter === "ALL"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {isEn ? "All Sessions" : "كل الحصص"}
            </button>
            <button
              type="button"
              onClick={() => setSessionTypeFilter("PRIVATE")}
              className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                sessionTypeFilter === "PRIVATE"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {isEn ? "Private (1-on-1)" : "حصص برايفت خاصة"}
            </button>
            <button
              type="button"
              onClick={() => setSessionTypeFilter("GROUP")}
              className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                sessionTypeFilter === "GROUP"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {isEn ? "Group Sessions" : "حصص مجموعات"}
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full lg:w-auto items-stretch sm:items-center">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(100);
            }}
            placeholder={isEn ? "Search student / group / teacher" : "بحث بالطالب أو الجروب أو المدرس"}
            className="bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-52"
          />
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <select
              className="bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-auto"
              value={sessionFilters.status}
              onChange={(e) =>
                setSessionFilters({ ...sessionFilters, status: e.target.value })
              }
            >
              <option value="">{t("education.sessions.allStatuses", isEn ? "All Statuses" : "كل الحالات")}</option>
              {Object.entries(SESSION_STATUS).map(([k]) => (
                <option key={k} value={k}>
                  {getSessionStatus(k, isEn).label}
                </option>
              ))}
            </select>
            <select
              className="bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-auto"
              value={sessionFilters.teacherId}
              onChange={(e) =>
                setSessionFilters({
                  ...sessionFilters,
                  teacherId: e.target.value,
                })
              }
            >
              <option value="">{t("education.sessions.allTeachers", isEn ? "All Teachers" : "كل المدرسين")}</option>
              {teachers
                .filter((t) => t.isActive)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <DateInput
              className="bg-background border border-input rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-32"
              value={sessionFilters.from}
              onChange={(e) =>
                setSessionFilters({ ...sessionFilters, from: e.target.value })
              }
            />
            <DateInput
              className="bg-background border border-input rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-32"
              value={sessionFilters.to}
              onChange={(e) =>
                setSessionFilters({ ...sessionFilters, to: e.target.value })
              }
            />
          </div>
          <button
            type="button"
            onClick={() => setSessionModal({})}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("education.sessions.scheduleSession", isEn ? "Schedule Session" : "إضافة حصة")}
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={searched.length === 0}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-card text-foreground text-xs font-semibold rounded-lg border border-border/70 hover:bg-muted shadow-xs shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isEn ? "Export filtered sessions to CSV" : "تصدير الحصص المفلترة CSV"}
            title={isEn ? "Export filtered sessions to CSV" : "تصدير الحصص المفلترة CSV"}
          >
            <Download className="w-3.5 h-3.5" />
            {isEn ? "CSV" : "تصدير CSV"}
          </button>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {visible.map((s) => (
          <div
            key={s.id}
            className="bg-card border border-border/80 rounded-xl p-3.5 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-foreground truncate flex items-center gap-1.5">
                  {isGroupSession(s) ? (
                    <>
                      <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">
                        {s.groupName || (isEn ? "Group session" : "حصة مجموعة")}
                      </span>
                      {s.room && (
                        <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded shrink-0">
                          {s.room}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span>
                        {s.student
                          ? `${s.student.firstName} ${s.student.lastName || ""}`
                          : "—"}
                      </span>
                      {s.student?.code && (
                        <span className="font-mono text-[10px] text-primary bg-primary/10 px-1 py-0.5 rounded border border-primary/20 shrink-0" dir="ltr">
                          #{s.student.code}
                        </span>
                      )}
                    </>
                  )}
                  {s.sessionType === "PRIVATE" && (
                    <span className="font-mono text-[9px] text-primary dark:text-primary bg-primary/10 px-1 py-0.5 rounded border border-primary/20 shrink-0">
                      Private 1-on-1
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <User className="w-3 h-3 text-primary shrink-0" />
                  <span className="truncate">{s.teacher?.name || (isEn ? "Unassigned Teacher" : "مدرس غير محدد")}</span>
                </div>
                {isGroupSession(s) && (
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono tabular-nums">
                    <span className="text-success bg-success/10 px-1.5 py-0.5 rounded border border-success/20">
                      {isEn ? "Present" : "حاضر"} {s.presentCount || 0}
                    </span>
                    <span className="text-destructive bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20">
                      {isEn ? "Absent" : "غائب"} {s.absentCount || 0}
                    </span>
                  </div>
                )}
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border shrink-0 ${
                  getSessionStatus(s.status, isEn).color
                }`}
              >
                {getSessionStatus(s.status, isEn).label}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-border/40">
              <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>
                  {new Date(s.scheduledAt).toLocaleDateString(isEn ? "en-US" : "ar-EG")}{" "}
                  {new Date(s.scheduledAt).toLocaleTimeString(isEn ? "en-US" : "ar-EG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <span className="text-[11px] tabular-nums bg-muted/60 text-foreground px-2 py-0.5 rounded-md">
                {s.actualDuration || s.plannedDuration} {isEn ? "min" : "دقيقة"}
              </span>
            </div>

            {s.subject?.name && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-primary/10 text-primary dark:text-primary border border-primary/20 text-[11px]">
                  <BookOpen className="w-3 h-3" />
                  {s.subject.name}
                </span>
                {s.topic && (
                  <span className="text-muted-foreground text-[11px] truncate">
                    ({s.topic})
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-border/60">
              {isGroupSession(s) ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/education/groups")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors border border-primary/20"
                  >
                    <Users className="w-3.5 h-3.5" />
                    {isEn ? "Log attendance" : "تسجيل الحضور"}
                  </button>
                  {s.status === "SCHEDULED" && (
                    <button
                      type="button"
                      onClick={() => handleCancelGroupSession({ id: s.id, groupId: s.groupId })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-destructive dark:text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors border border-destructive/20"
                      aria-label={isEn ? "Cancel this session" : "إلغاء هذه الحصة"}
                      title={isEn ? "Cancel this session" : "إلغاء هذه الحصة"}
                    >
                      <X className="w-3.5 h-3.5" />
                      {isEn ? "Cancel" : "إلغاء"}
                    </button>
                  )}
                </>
              ) : (
                <>
                  {s.status === "SCHEDULED" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleConfirmSession(s.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-success dark:text-success bg-success/10 hover:bg-success/20 rounded-md transition-colors border border-success/20"
                        aria-label={t("education.dashboard.confirmSession", isEn ? "Confirm Attendance" : "تأكيد الحضور")} title={t("education.dashboard.confirmSession", isEn ? "Confirm Attendance" : "تأكيد الحضور")}
                      >
                        <Check className="w-3.5 h-3.5" />
                        {t("education.actions.confirm", isEn ? "Confirm" : "تأكيد")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkNoShow(s.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-warning bg-warning/10 hover:bg-warning/20 rounded-md transition-colors border border-warning/20"
                        aria-label={isEn ? "Mark no-show" : "تسجيل غياب الطالب"} title={isEn ? "Mark no-show" : "تسجيل غياب الطالب"}
                      >
                        <UserX className="w-3.5 h-3.5" />
                        {isEn ? "No-show" : "غياب"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelSession(s.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-destructive dark:text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors border border-destructive/20"
                        aria-label={t("education.dashboard.cancelSession", isEn ? "Cancel Session" : "إلغاء الحصة")} title={t("education.dashboard.cancelSession", isEn ? "Cancel Session" : "إلغاء الحصة")}
                      >
                        <X className="w-3.5 h-3.5" />
                        {t("education.actions.cancel", isEn ? "Cancel" : "إلغاء")}
                      </button>
                    </>
                  )}
                  {s.status === "CONFIRMED" && typeof onScheduleMakeup === "function" && (
                    <button
                      type="button"
                      onClick={() => onScheduleMakeup(s.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors border border-primary/20"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      {isEn ? "Make-up" : "تعويض"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSessionModal(s)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors border border-border/60"
                    aria-label={t("education.actions.edit", isEn ? "Edit" : "تعديل")} title={t("education.actions.edit", isEn ? "Edit" : "تعديل")}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {t("education.actions.edit", isEn ? "Edit" : "تعديل")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSession(s.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors border border-border/60"
                    aria-label={isEn ? "Delete session" : "حذف الحصة"} title={isEn ? "Delete session" : "حذف الحصة"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {isEn ? "Delete" : "حذف"}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="bg-card border border-border/80 rounded-xl p-8 text-center text-xs text-muted-foreground">
            {t("education.sessions.empty", isEn ? "No registered sessions matching criteria" : "لا توجد حصص مسجلة")}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-card border border-border/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground text-xs">
                {[
                  t("education.enrollments.student", isEn ? "Student" : "الطالب"),
                  t("education.enrollments.teacher", isEn ? "Teacher" : "المدرس"),
                  t("education.enrollments.subject", isEn ? "Subject" : "المادة"),
                  t("education.sessions.dateAndTime", isEn ? "Date & Time" : "التاريخ والوقت"),
                  t("education.sessions.plannedDuration", isEn ? "Duration" : "المدة"),
                  t("education.subjects.status", isEn ? "Status" : "الحالة"),
                  "",
                ].map((h, i) => (
                  <th key={i} className={`${isEn ? "text-left" : "text-right"} py-3 px-4 font-semibold`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {visible.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className={CELL_CLS + " font-medium text-foreground"}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isGroupSession(s) ? (
                        <>
                          <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{s.groupName || (isEn ? "Group session" : "حصة مجموعة")}</span>
                          {s.room && (
                            <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded">
                              {s.room}
                            </span>
                          )}
                          <span className="font-mono text-[10px] tabular-nums text-success bg-success/10 px-1 py-0.5 rounded border border-success/20">
                            {isEn ? "P" : "حاضر"} {s.presentCount || 0}
                          </span>
                          <span className="font-mono text-[10px] tabular-nums text-destructive bg-destructive/10 px-1 py-0.5 rounded border border-destructive/20">
                            {isEn ? "A" : "غائب"} {s.absentCount || 0}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>
                            {s.student
                              ? `${s.student.firstName} ${s.student.lastName || ""}`
                              : "—"}
                          </span>
                          {s.student?.code && (
                            <span className="font-mono text-[10px] text-primary bg-primary/10 px-1 py-0.5 rounded border border-primary/20" dir="ltr">
                              #{s.student.code}
                            </span>
                          )}
                          {s.sessionType === "PRIVATE" && (
                            <span className="font-mono text-[9px] text-primary dark:text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20" dir="ltr">
                              Private 1-on-1
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td className={CELL_CLS + " text-muted-foreground"}>
                    {s.teacher?.name || "—"}
                  </td>
                  <td className={CELL_CLS + " text-muted-foreground"}>
                    {s.subject?.name || "—"}
                  </td>
                  <td className={CELL_CLS + " font-mono text-muted-foreground"}>
                    {new Date(s.scheduledAt).toLocaleDateString(isEn ? "en-US" : "ar-EG")}{" "}
                    {new Date(s.scheduledAt).toLocaleTimeString(isEn ? "en-US" : "ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td
                    className={
                      CELL_CLS + " font-mono tabular-nums text-foreground"
                    }
                  >
                    {s.actualDuration || s.plannedDuration} {isEn ? "min" : "دقيقة"}
                  </td>
                  <td className={CELL_CLS}>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                        getSessionStatus(s.status, isEn).color
                      }`}
                    >
                      {getSessionStatus(s.status, isEn).label}
                    </span>
                  </td>
                  <td className={CELL_CLS}>
                    <div className="flex items-center justify-end gap-1">
                      {isGroupSession(s) ? (
                        <>
                          <button
                            type="button"
                            onClick={() => navigate("/admin/education/groups")}
                            className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
                            aria-label={isEn ? "Log attendance" : "تسجيل الحضور"} title={isEn ? "Log attendance" : "تسجيل الحضور"}
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>
                          {s.status === "SCHEDULED" && (
                            <button
                              type="button"
                              onClick={() => handleCancelGroupSession({ id: s.id, groupId: s.groupId })}
                              className="p-1.5 text-destructive dark:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                              aria-label={isEn ? "Cancel this session" : "إلغاء هذه الحصة"} title={isEn ? "Cancel this session" : "إلغاء هذه الحصة"}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {s.status === "SCHEDULED" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleConfirmSession(s.id)}
                                className="p-1.5 text-success dark:text-success hover:bg-success/10 rounded-md transition-colors"
                                aria-label={t("education.dashboard.confirmSession", isEn ? "Confirm Attendance" : "تأكيد الحضور")} title={t("education.dashboard.confirmSession", isEn ? "Confirm Attendance" : "تأكيد الحضور")}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkNoShow(s.id)}
                                className="p-1.5 text-warning hover:bg-warning/10 rounded-md transition-colors"
                                aria-label={isEn ? "Mark no-show" : "تسجيل غياب الطالب"} title={isEn ? "Mark no-show" : "تسجيل غياب الطالب"}
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelSession(s.id)}
                                className="p-1.5 text-destructive dark:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                aria-label={t("education.dashboard.cancelSession", isEn ? "Cancel Session" : "إلغاء الحصة")} title={t("education.dashboard.cancelSession", isEn ? "Cancel Session" : "إلغاء الحصة")}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {s.status === "CONFIRMED" && typeof onScheduleMakeup === "function" && (
                            <button
                              type="button"
                              onClick={() => onScheduleMakeup(s.id)}
                              className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
                              aria-label={isEn ? "Schedule make-up" : "حصة تعويض"}
                              title={isEn ? "Schedule make-up" : "حصة تعويض"}
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSessionModal(s)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                            aria-label={t("education.actions.edit", isEn ? "Edit Details" : "تفاصيل")} title={t("education.actions.edit", isEn ? "Edit Details" : "تفاصيل")}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSession(s.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                            aria-label={isEn ? "Delete session" : "حذف الحصة"} title={isEn ? "Delete session" : "حذف الحصة"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && (
          <p className="text-center py-12 text-xs text-muted-foreground">
            {t("education.sessions.empty", isEn ? "No registered sessions" : "لا توجد حصص مسجلة")}
          </p>
        )}
      </div>

      {/* Load more (client-side paging) */}
      {searched.length > visible.length && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + 100)}
            className="px-4 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-colors tabular-nums"
          >
            {isEn
              ? `Show more (${visible.length}/${searched.length})`
              : `عرض المزيد (${visible.length}/${searched.length})`}
          </button>
        </div>
      )}
      {sessionModal !== undefined && (
        <SessionModal
          session={sessionModal}
          teachers={teachers}
          subjects={subjects}
          enrollments={enrollments}
          students={students}
          onClose={() => setSessionModal(undefined)}
          onSave={handleSaveSession}
        />
      )}
    </div>
  );
};

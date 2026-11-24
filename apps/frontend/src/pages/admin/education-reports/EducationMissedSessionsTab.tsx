import React from "react";
import { AlertTriangle, CalendarX, GraduationCap, UserX } from "lucide-react";
import { MissedSessionsData } from "./types";

interface EducationMissedSessionsTabProps {
  data: MissedSessionsData | null;
  loading: boolean;
  isEn: boolean;
}

const statusLabel = (status: string, isEn: boolean) => {
  if (status === "CONFIRMED") return isEn ? "Confirmed" : "مؤكدة";
  if (status === "SCHEDULED") return isEn ? "Scheduled" : "مجدولة";
  if (status === "COMPLETED") return isEn ? "Completed" : "مكتملة";
  if (status === "CANCELLED") return isEn ? "Cancelled" : "ملغية";
  if (status === "NO_SHOW") return isEn ? "No-show" : "غياب الطالب";
  return status;
};

export const EducationMissedSessionsTab: React.FC<EducationMissedSessionsTabProps> = ({
  data,
  loading,
  isEn,
}) => {
  const total = data?.total ?? 0;
  const noShowCount = data?.noShowCount ?? 0;
  const sessions = data?.sessions ?? [];
  const byTeacher = data?.byTeacher ?? [];
  const byStudent = data?.byStudent ?? [];
  const days = data?.days ?? 30;

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-muted-foreground">
        {isEn ? "Loading missed sessions…" : "جاري تحميل الحصص الفائتة…"}
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/70 bg-card p-3">
          <p className="text-[11px] text-muted-foreground">
            {isEn ? "Missed sessions" : "إجمالي الحصص الفائتة"}
          </p>
          <p className="text-xl font-bold tabular-nums text-destructive">{total}</p>
          <p className="text-[10px] text-muted-foreground">
            {isEn ? `last ${days} days` : `خلال ${days} يومًا`}
            {noShowCount > 0 && (
              <span className="ms-1 text-warning">
                {isEn ? `· ${noShowCount} no-show logged` : `· منها ${noShowCount} غياب مسجّل`}
              </span>
            )}
          </p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card p-3">
          <p className="text-[11px] text-muted-foreground">
            {isEn ? "Affected teachers" : "مدرسون متأثرون"}
          </p>
          <p className="text-xl font-bold tabular-nums">{byTeacher.length}</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card p-3">
          <p className="text-[11px] text-muted-foreground">
            {isEn ? "Affected students" : "طلاب متأثرون"}
          </p>
          <p className="text-xl font-bold tabular-nums">{byStudent.length}</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card p-3">
          <p className="text-[11px] text-muted-foreground">{isEn ? "Top offender" : "أعلى تكرار"}</p>
          <p className="text-sm font-bold truncate">
            {byTeacher[0] ? `${byTeacher[0].name} (${byTeacher[0].count})` : "—"}
          </p>
        </div>
      </div>

      {total === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 p-10 text-center space-y-2">
          <CalendarX className="w-6 h-6 mx-auto text-success" />
          <p className="text-sm font-semibold text-foreground">
            {isEn ? "No missed sessions" : "لا توجد حصص فائتة"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isEn
              ? "Every scheduled session in this period was executed or cancelled."
              : "كل الحصص المجدولة في هذه الفترة نُفّذت أو أُلغيت — لا شيء يحتاج متابعة."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:divide-x lg:divide-border/60">
          {/* Breakdown */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 pb-2 border-b border-border/60">
                <UserX className="w-3.5 h-3.5 text-destructive" />
                {isEn ? "By teacher" : "حسب المدرس"}
              </h3>
              <ul className="pt-2 space-y-1.5">
                {byTeacher.map((t) => (
                  <li key={t.teacherId} className="flex items-center justify-between text-xs">
                    <span className="truncate text-foreground">{t.name}</span>
                    <span className="font-mono tabular-nums font-bold text-destructive shrink-0 ms-2">
                      {t.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 pb-2 border-b border-border/60">
                <GraduationCap className="w-3.5 h-3.5 text-warning" />
                {isEn ? "By student" : "حسب الطالب"}
              </h3>
              <ul className="pt-2 space-y-1.5">
                {byStudent.slice(0, 8).map((s) => (
                  <li key={s.studentId} className="flex items-center justify-between text-xs">
                    <span className="truncate text-foreground">
                      {s.code ? <span className="font-mono text-[10px] text-muted-foreground me-1">{s.code}</span> : null}
                      {s.name}
                    </span>
                    <span className="font-mono tabular-nums font-bold shrink-0 ms-2">{s.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sessions table */}
          <div className="lg:col-span-8 lg:ps-6">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
              <h3 className="text-xs font-bold text-foreground">{isEn ? "Session breakdown" : "تفصيل الحصص"}</h3>
              <span className="text-[10px] text-muted-foreground">
                {isEn ? `latest ${Math.min(sessions.length, 100)}` : `أحدث ${Math.min(sessions.length, 100)}`}
              </span>
            </div>
            <div className="pt-2 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border/50">
                    <th className="text-start font-medium py-2">{isEn ? "Date" : "التاريخ"}</th>
                    <th className="text-start font-medium py-2">{isEn ? "Student" : "الطالب"}</th>
                    <th className="text-start font-medium py-2">{isEn ? "Teacher" : "المدرس"}</th>
                    <th className="text-start font-medium py-2">{isEn ? "Subject" : "المادة"}</th>
                    <th className="text-start font-medium py-2">{isEn ? "Status" : "الحالة"}</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, 100).map((s) => (
                    <tr key={s.id} className="border-b border-border/40 last:border-0">
                      <td className="py-2 font-mono tabular-nums text-foreground whitespace-nowrap">
                        {new Date(s.scheduledAt).toLocaleDateString(isEn ? "en-GB" : "ar-EG")}
                        <span className="text-muted-foreground ms-1">
                          {new Date(s.scheduledAt).toLocaleTimeString(isEn ? "en-GB" : "ar-EG", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="py-2 truncate max-w-[140px]">{s.studentName || "—"}</td>
                      <td className="py-2 truncate max-w-[120px]">{s.teacherName || "—"}</td>
                      <td className="py-2 truncate max-w-[110px]">{s.subjectName || "—"}</td>
                      <td className="py-2">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-warning/10 text-warning border border-warning/20">
                          {statusLabel(s.status, isEn)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationMissedSessionsTab;

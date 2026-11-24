import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, CalendarPlus, Loader2 } from "lucide-react";
import type { EducationSession, EducationTeacher } from "./types";
import { MODAL_CLS, INPUT_CLS } from "./types";

export interface MakeupSessionModalProps {
  session: Partial<EducationSession>;
  teachers: EducationTeacher[];
  onClose: () => void;
  /** Returns an error message on failure, or null on success. */
  onSave: (payload: {
    scheduledAt: string;
    plannedDuration?: number;
    teacherId?: string;
    topic?: string;
    notes?: string;
  }) => Promise<string | null>;
}

const pad = (n: number) => String(n).padStart(2, "0");

const toLocalInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;

export const MakeupSessionModal: React.FC<MakeupSessionModalProps> = ({
  session,
  teachers,
  onClose,
  onSave,
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const defaultDate = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return toLocalInput(d);
  }, []);

  const [scheduledAt, setScheduledAt] = useState(defaultDate);
  const [plannedDuration, setPlannedDuration] = useState(
    String(session.actualDuration || session.plannedDuration || 60),
  );
  const [teacherId, setTeacherId] = useState(session.teacherId || session.teacher?.id || "");
  const [topic, setTopic] = useState(session.topic || "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const studentLabel = session.student
    ? `${session.student.firstName} ${session.student.lastName || ""}`.trim()
    : session.groupName || (isEn ? "Session" : "حصة");

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = new Date(scheduledAt);
    if (!scheduledAt || Number.isNaN(parsed.getTime())) {
      setError(isEn ? "Pick a valid date and time" : "اختر تاريخ ووقت صحيحين");
      return;
    }
    if (parsed.getTime() < Date.now() - 60 * 1000) {
      setError(isEn ? "Make-up session must be in the future" : "موعد التعويض لازم يكون في المستقبل");
      return;
    }

    setSaving(true);
    try {
      const message = await onSave({
        scheduledAt: parsed.toISOString(),
        plannedDuration: Number(plannedDuration) || undefined,
        teacherId: teacherId || undefined,
        topic: topic.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (message) setError(message);
    } catch (err: any) {
      setError(err?.message || (isEn ? "Failed to schedule make-up" : "فشل جدولة حصة التعويض"));
    } finally {
      setSaving(false);
    }
  };

  const activeTeachers = teachers.filter((teacher) => teacher.isActive !== false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      dir={isEn ? "ltr" : "rtl"}
      role="dialog"
      aria-modal="true"
    >
      <div className={MODAL_CLS}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <CalendarPlus className="w-4 h-4 text-primary" />
              {t("education.sessions.scheduleMakeup", isEn ? "Schedule make-up session" : "جدولة حصة تعويض")}
            </h3>
            <p className="text-[11px] text-muted-foreground">{studentLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            aria-label={t("common.close", isEn ? "Close" : "إغلاق")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1 block">
              <span className="text-[11px] font-medium text-muted-foreground">
                {t("education.sessions.dateAndTime", isEn ? "Date & time" : "التاريخ والوقت")}
              </span>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className={INPUT_CLS}
                required
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-[11px] font-medium text-muted-foreground">
                {t("education.sessions.plannedDuration", isEn ? "Duration (min)" : "المدة (دقيقة)")}
              </span>
              <input
                type="number"
                min={15}
                max={300}
                step={15}
                value={plannedDuration}
                onChange={(e) => setPlannedDuration(e.target.value)}
                className={INPUT_CLS}
              />
            </label>
          </div>

          <label className="space-y-1 block">
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("education.enrollments.teacher", isEn ? "Teacher" : "المدرس")}
            </span>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className={INPUT_CLS}
            >
              <option value="">
                {isEn ? "Same teacher as original session" : "نفس مدرس الحصة الأصلية"}
              </option>
              {activeTeachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 block">
            <span className="text-[11px] font-medium text-muted-foreground">
              {isEn ? "Topic (optional)" : "التوبيك (اختياري)"}
            </span>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={session.topic || (isEn ? "Make-up of lesson" : "تعويض حصة")}
              className={INPUT_CLS}
            />
          </label>

          <label className="space-y-1 block">
            <span className="text-[11px] font-medium text-muted-foreground">
              {isEn ? "Note (optional)" : "ملاحظة (اختياري)"}
            </span>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={INPUT_CLS}
            />
          </label>

          {error && (
            <p className="text-[11px] text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-2.5 py-1.5">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted rounded-lg transition-colors disabled:opacity-50"
            >
              {t("common.cancel", isEn ? "Cancel" : "إلغاء")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarPlus className="w-3.5 h-3.5" />}
              {isEn ? "Schedule make-up" : "جدولة التعويض"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MakeupSessionModal;

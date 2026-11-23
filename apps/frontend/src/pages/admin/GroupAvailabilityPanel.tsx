import React, { useEffect, useMemo, useState } from "react";
import { CalendarClock, RefreshCw } from "lucide-react";
import { buildApiUrl } from "../../utils/urlHelper";
import tokenManager from "../../utils/tokenManager";

const getCompanyId = (): string | null => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}") as { companyId?: string } | null;
    return user?.companyId || null;
  } catch {
    return null;
  }
};

const getAuthHeaders = () => {
  const headers = tokenManager.createAuthHeaders({ "Content-Type": "application/json" });
  const cid = getCompanyId();
  if (cid) headers["X-Company-Id"] = cid;
  return headers;
};

const api = (path: string) => {
  const base = buildApiUrl(`education/${path}`);
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    url = new URL(base, window.location.origin);
  }
  const cid = getCompanyId();
  if (cid) url.searchParams.set("companyId", cid);
  return url.toString();
};

interface AvailabilityInterval {
  startMin: number;
  endMin: number;
  start: string;
  end: string;
  type: "TEACHER" | "ROOM" | "PRIVATE";
  groupId?: string | null;
  groupName?: string | null;
  teacherName?: string | null;
  studentName?: string | null;
  room?: string | null;
  label: string;
}

interface AvailabilityDay {
  dateISO: string;
  dayIdx: number;
  dayLabel: string;
  dayKey: string;
  busy: AvailabilityInterval[];
  free: AvailabilityInterval[];
}

interface AvailabilityPayload {
  window: { start: string; end: string };
  room: string | null;
  days: AvailabilityDay[];
}

export interface GroupAvailabilityPanelProps {
  teacherId?: string | null;
  classroomId?: string | null;
  room?: string | null;
  branchId?: string | null;
  excludeGroupId?: string | null;
  isEn: boolean;
  onPickSlot: (slot: { dayOfWeek: string; startTime: string; endTime: string }) => void;
}

const toMinutes = (value: string) => {
  const [h, m] = String(value || "0:0").split(":").map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
};

const toHHMM = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

const sessionEnd = (slot: AvailabilityInterval) => {
  const start = toMinutes(slot.start);
  const preferred = Math.min(slot.endMin, start + 90);
  return slot.endMin - start >= 30 ? toHHMM(preferred) : slot.end;
};

const formatDay = (iso: string, isEn: boolean) => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(isEn ? "en-GB" : "ar-EG", { day: "numeric", month: "short" });
};

export const GroupAvailabilityPanel: React.FC<GroupAvailabilityPanelProps> = ({
  teacherId,
  classroomId,
  room,
  branchId,
  excludeGroupId,
  isEn,
  onPickSlot,
}) => {
  const [payload, setPayload] = useState<AvailabilityPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasFilter = Boolean(teacherId || classroomId);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (teacherId) params.set("teacherId", teacherId);
    if (classroomId) params.set("classroomId", classroomId);
    if (room) params.set("room", room);
    if (branchId) params.set("branchId", branchId);
    if (excludeGroupId) params.set("groupId", excludeGroupId);
    params.set("days", "7");
    return params.toString();
  }, [teacherId, classroomId, room, branchId, excludeGroupId]);

  useEffect(() => {
    if (!hasFilter) {
      setPayload(null);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    fetch(api(`groups/availability?${query}`), { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (!alive) return;
        if (!data?.success) {
          setError(data?.error || (isEn ? "Could not load availability" : "تعذّر تحميل المواعيد المتاحة"));
          setPayload(null);
          return;
        }
        setPayload(data.data as AvailabilityPayload);
      })
      .catch(() => {
        if (alive) setError(isEn ? "Could not load availability" : "تعذّر تحميل المواعيد المتاحة");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [query, hasFilter, isEn]);

  return (
    <div className="space-y-2 rounded-lg border border-border/70 bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          {isEn ? "Available times" : "المواعيد المتاحة"}
        </div>
        {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
      </div>

      {!hasFilter ? (
        <p className="text-[11px] text-muted-foreground">
          {isEn
            ? "Pick a teacher or a classroom to see free and busy times."
            : "اختر المدرس أو القاعة الأول لعرض الأوقات الفاضية والمشغولة."}
        </p>
      ) : error ? (
        <p className="text-[11px] text-destructive">{error}</p>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">
            {isEn
              ? "Green = free (click to add it to the schedule). Red = busy, hover to see who has it."
              : "الأخضر متاح (اضغط لإضافته للجدول)، والأحمر محجوز — مرّر عليه لتعرف مين فيه."}
          </p>
          <div className="max-h-64 space-y-1.5 overflow-y-auto pe-1">
            {(payload?.days || []).map((day) => (
              <div key={day.dateISO} className="flex flex-wrap items-center gap-1.5 border-b border-border/60 pb-1.5 last:border-b-0">
                <span className="w-28 shrink-0 text-[11px] font-medium text-foreground">
                  {day.dayLabel}
                  <span className="ms-1 font-normal text-muted-foreground">{formatDay(day.dateISO, isEn)}</span>
                </span>
                <div className="flex flex-1 flex-wrap gap-1">
                  {day.busy.length === 0 && day.free.length === 0 ? (
                    <span className="text-[11px] text-muted-foreground">{isEn ? "No times" : "لا توجد أوقات"}</span>
                  ) : (
                    [
                      ...day.free.map((slot) => ({ slot, kind: "free" as const })),
                      ...day.busy.map((slot) => ({ slot, kind: "busy" as const })),
                    ]
                      .sort((a, b) => a.slot.startMin - b.slot.startMin)
                      .map(({ slot, kind }) =>
                        kind === "free" ? (
                          <button
                            key={`f-${slot.startMin}`}
                            type="button"
                            onClick={() =>
                              onPickSlot({
                                dayOfWeek: day.dayKey,
                                startTime: slot.start,
                                endTime: sessionEnd(slot),
                              })
                            }
                            title={isEn ? "Free — click to add" : "متاح — اضغط للإضافة"}
                            className="rounded-md border border-success/40 bg-success/10 px-1.5 py-0.5 text-[10px] tabular-nums text-success transition hover:bg-success/20"
                          >
                            {slot.start} - {slot.end}
                          </button>
                        ) : (
                          <span
                            key={`b-${slot.startMin}-${slot.type}`}
                            title={slot.label}
                            className="cursor-help rounded-md border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-[10px] tabular-nums text-destructive"
                          >
                            {slot.start} - {slot.end}
                            {slot.type === "PRIVATE" ? ` · ${isEn ? "private" : "خاصة"}` : ""}
                          </span>
                        )
                      )
                  )}
                </div>
              </div>
            ))}
            {!loading && payload && payload.days.every((d) => d.free.length === 0 && d.busy.length === 0) ? (
              <p className="text-[11px] text-muted-foreground">
                {isEn ? "No schedule data for the next 7 days." : "لا توجد بيانات مواعيد للسبعة أيام القادمة."}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupAvailabilityPanel;

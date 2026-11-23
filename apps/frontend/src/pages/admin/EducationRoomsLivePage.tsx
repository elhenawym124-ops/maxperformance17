import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Building2,
  Clock,
  DoorOpen,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react";
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

interface LiveSession {
  groupId: string;
  groupName: string;
  teacherName?: string | null;
  subjectName?: string | null;
  room?: string | null;
  members: number;
  capacity: number;
  startAt: string;
  endAt: string;
  startTime: string;
  endTime: string;
  dayLabel: string;
  sessionId?: string | null;
  topic?: string | null;
  status: string;
}

interface LiveRoom {
  id: string;
  name: string;
  type: string;
  capacity: number;
  isActive: boolean;
  groupsCount: number;
  isOccupied: boolean;
  current: LiveSession | null;
  next: LiveSession | null;
  fillPercent: number;
}

interface LiveBranch {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
  rooms: LiveRoom[];
  occupiedCount: number;
  totalRooms: number;
}

interface UnassignedGroup {
  groupId: string;
  groupName: string;
  teacherName?: string | null;
  subjectName?: string | null;
  room?: string | null;
  members: number;
  capacity: number;
  current: LiveSession | null;
  next: LiveSession | null;
}

interface LiveRoomsPayload {
  generatedAt: string;
  at: string;
  serverNow: string;
  summary: {
    totalRooms: number;
    occupiedRooms: number;
    freeRooms: number;
    unassignedGroups: number;
  };
  branches: LiveBranch[];
  unassigned: UnassignedGroup[];
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  LAB: "معمل",
  THEORY: "قاعة نظري",
  ROBOTICS: "روبوتكس",
  ONLINE: "أونلاين",
};

const isToday = (iso?: string | null) => {
  if (!iso) return true;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return true;
  return d.toDateString() === new Date().toDateString();
};

const shortDate = (iso: string | null | undefined, isEn: boolean) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(isEn ? "en-GB" : "ar-EG", { day: "numeric", month: "short" });
};

const whenLabel = (session: LiveSession, isEn: boolean) => {
  const day = session.dayLabel || "";
  const date = isToday(session.startAt) ? "" : shortDate(session.startAt, isEn);
  return [day, date, session.startTime].filter(Boolean).join(" ");
};

const EducationRoomsLivePage: React.FC = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const [payload, setPayload] = useState<LiveRoomsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [allBranches, setAllBranches] = useState<{ id: string; name: string }[]>([]);
  const [clock, setClock] = useState(() => new Date());

  const load = useCallback(async () => {
    try {
      setError(null);
      const query = branchFilter ? `&branchId=${encodeURIComponent(branchFilter)}` : "";
      const res = await fetch(api(`groups/rooms/live?_=1${query}`), { headers: getAuthHeaders() });
      const data = await res.json();
      if (!data?.success) {
        setError(data?.error || (isEn ? "Failed to load rooms" : "تعذّر تحميل حالة القاعات"));
        return;
      }
      setPayload(data.data as LiveRoomsPayload);
      if (!branchFilter) {
        const list = (data.data?.branches || []).map((b: LiveBranch) => ({ id: b.id, name: b.name }));
        setAllBranches(list);
      }
    } catch (err: any) {
      setError(err?.message || (isEn ? "Failed to load rooms" : "تعذّر تحميل حالة القاعات"));
    } finally {
      setLoading(false);
    }
  }, [branchFilter, isEn]);

  useEffect(() => {
    setLoading(true);
    load();
    const refresh = setInterval(load, 60000);
    return () => clearInterval(refresh);
  }, [load]);

  useEffect(() => {
    const tick = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(tick);
  }, []);

  const branches = payload?.branches || [];
  const unassigned = payload?.unassigned || [];

  const summary = useMemo(
    () =>
      payload?.summary || {
        totalRooms: 0,
        occupiedRooms: 0,
        freeRooms: 0,
        unassignedGroups: 0,
      },
    [payload]
  );

  const statusPill = (room: LiveRoom) => {
    if (!room.isActive) {
      return { text: isEn ? "Inactive" : "غير مفعّلة", cls: "border-border/70 bg-muted text-muted-foreground" };
    }
    return room.isOccupied
      ? { text: isEn ? "Busy" : "مشغولة الآن", cls: "border-accent/30 bg-accent/10 text-accent" }
      : { text: isEn ? "Free" : "متاحة", cls: "border-border/70 bg-muted/60 text-muted-foreground" };
  };

  const sessionLine = (session: LiveSession | null) => {
    if (!session) return null;
    return {
      group: session.groupName,
      teacher: session.teacherName || (isEn ? "No teacher" : "بدون مدرس"),
      time: `${session.startTime} - ${session.endTime}`,
      members: `${session.members}/${session.capacity}`,
    };
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-6 sm:py-6 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-lg font-bold text-foreground sm:text-xl">
            <DoorOpen className="h-5 w-5 text-muted-foreground" />
            {isEn ? "Rooms Live Board" : "القاعات الآن"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isEn
              ? "Which room is busy right now, who is inside, and when the next class starts."
              : "أي قاعة مشغولة الآن، مين جواها، وامتى الحصة الجاية."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1 rounded-lg border border-border/70 px-2 py-1 text-xs tabular-nums text-muted-foreground sm:inline-flex">
            <Clock className="h-3.5 w-3.5" />
            {clock.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">{isEn ? "All branches" : "كل الفروع"}</option>
            {allBranches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-2 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {isEn ? "Refresh" : "تحديث"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 divide-y divide-border/70 overflow-hidden rounded-lg border border-border/70 bg-card sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        {[
          { label: isEn ? "Total rooms" : "إجمالي القاعات", value: summary.totalRooms, icon: DoorOpen },
          { label: isEn ? "Busy now" : "مشغولة الآن", value: summary.occupiedRooms, icon: Users },
          { label: isEn ? "Free" : "متاحة", value: summary.freeRooms, icon: DoorOpen },
          {
            label: isEn ? "Groups without a room" : "مجموعات بدون قاعة",
            value: summary.unassignedGroups,
            icon: MapPin,
          },
        ].map((card) => (
          <div key={card.label} className="px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{card.label}</span>
              <card.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums text-foreground">{card.value}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && branches.length === 0 && (
        <div className="rounded-lg border border-border/70 bg-card px-4 py-6 text-center text-xs text-muted-foreground">
          {isEn
            ? "No branches or classrooms defined yet. Add classrooms from Education Settings → Branches."
            : "لا توجد فروع أو قاعات مسجلة. أضف القاعات من إعدادات التعليم → الفروع والقاعات."}
        </div>
      )}

      {branches.map((branch) => (
        <section key={branch.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              {branch.name}
              {branch.city ? (
                <span className="text-[11px] font-normal text-muted-foreground">— {branch.city}</span>
              ) : null}
            </h2>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {branch.occupiedCount} / {branch.totalRooms} {isEn ? "busy" : "مشغولة"}
            </span>
          </div>

          <div className="overflow-hidden rounded-lg border border-border/70 bg-card">
            <table className="hidden w-full text-xs sm:table">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-[11px] text-muted-foreground">
                  <th className="px-3 py-2 text-start font-medium">{isEn ? "Room" : "القاعة"}</th>
                  <th className="px-3 py-2 text-start font-medium">{isEn ? "Status" : "الحالة"}</th>
                  <th className="px-3 py-2 text-start font-medium">{isEn ? "Current session" : "الحصة الحالية"}</th>
                  <th className="px-3 py-2 text-start font-medium">{isEn ? "Next session" : "الحصة القادمة"}</th>
                </tr>
              </thead>
              <tbody>
                {branch.rooms.map((room) => {
                  const pill = statusPill(room);
                  const current = sessionLine(room.current);
                  return (
                    <tr key={room.id} className="border-t border-border/70 align-top first:border-t-0">
                      <td className="px-3 py-2">
                        <div className="font-medium text-foreground">{room.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {ROOM_TYPE_LABELS[room.type] || room.type} · {isEn ? "capacity" : "سعة"} {room.capacity}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium ${pill.cls}`}>
                          {pill.text}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {current ? (
                          <>
                            <div className="font-medium text-foreground">{current.group}</div>
                            <div className="text-[11px] tabular-nums text-muted-foreground">
                              {current.time} · {current.teacher} · {current.members}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {room.next ? (
                          <>
                            <div className="tabular-nums text-foreground">{whenLabel(room.next, isEn)}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {room.next.groupName}
                              {room.next.teacherName ? ` · ${room.next.teacherName}` : ""}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="divide-y divide-border/70 sm:hidden">
              {branch.rooms.map((room) => {
                const pill = statusPill(room);
                const current = sessionLine(room.current);
                return (
                  <div key={room.id} className="px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-foreground">{room.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {ROOM_TYPE_LABELS[room.type] || room.type} · {isEn ? "capacity" : "سعة"} {room.capacity}
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium ${pill.cls}`}>
                        {pill.text}
                      </span>
                    </div>
                    {current ? (
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground">{current.group}</span>
                        {" · "}
                        <span className="tabular-nums">{current.time}</span>
                        {" · "}
                        {current.teacher}
                        {" · "}
                        <span className="tabular-nums">{current.members}</span>
                      </div>
                    ) : null}
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {room.next ? (
                        <>
                          {isEn ? "Next: " : "الجاية: "}
                          <span className="tabular-nums text-foreground">{whenLabel(room.next, isEn)}</span>
                          {" · "}
                          {room.next.groupName}
                          {room.next.teacherName ? ` · ${room.next.teacherName}` : ""}
                        </>
                      ) : (
                        <>{isEn ? "No upcoming class." : "لا توجد حصة قادمة."}</>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {unassigned.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {isEn ? "Groups without an assigned room" : "مجموعات بدون قاعة محددة"}
          </h2>
          <div className="overflow-hidden rounded-lg border border-border/70 bg-card">
            {unassigned.map((group) => (
              <div
                key={group.groupId}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-3 py-2 text-xs last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-foreground">{group.groupName}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {group.teacherName || (isEn ? "No teacher" : "بدون مدرس")}
                    {group.room ? ` · ${group.room}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] tabular-nums text-muted-foreground">
                  <span>
                    {group.current
                      ? `${isEn ? "Now" : "الآن"} ${group.current.startTime}-${group.current.endTime}`
                      : group.next
                        ? `${isEn ? "Next" : "الجاية"} ${whenLabel(group.next, isEn)}`
                        : isEn
                          ? "No schedule"
                          : "بدون جدول"}
                  </span>
                  <span>
                    {group.members}/{group.capacity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default EducationRoomsLivePage;

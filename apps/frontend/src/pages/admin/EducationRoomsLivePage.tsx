import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Building2,
  Clock,
  DoorOpen,
  GraduationCap,
  LayoutGrid,
  MapPin,
  RefreshCw,
  Rotate3d,
  Users,
} from "lucide-react";
import { buildApiUrl } from "../../utils/urlHelper";
import tokenManager from "../../utils/tokenManager";

const getCompanyId = (): string | null => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}").companyId || null;
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

const timeOf = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
};

const EducationRoomsLivePage: React.FC = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const [payload, setPayload] = useState<LiveRoomsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [is3D, setIs3D] = useState(true);
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

  const roomTone = (room: LiveRoom) => {
    if (!room.isActive) return "border-border/70 bg-muted/40 text-muted-foreground";
    if (room.isOccupied) return "border-accent/40 bg-accent/5";
    return "border-border/70 bg-card";
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-6 sm:py-6 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-lg font-bold text-foreground sm:text-xl">
            <Rotate3d className="h-5 w-5 text-accent" />
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
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setIs3D((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-2 py-1.5 text-xs font-medium text-foreground transition active:scale-[0.97] hover:bg-muted"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            {is3D ? (isEn ? "Flat" : "مسطح") : isEn ? "3D" : "٣د"}
          </button>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-2 py-1.5 text-xs font-medium text-foreground transition active:scale-[0.97] hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {isEn ? "Refresh" : "تحديث"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
          <div key={card.label} className="rounded-xl border border-border/70 bg-card px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{card.label}</span>
              <card.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-1 text-xl font-bold tabular-nums text-foreground">{card.value}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && branches.length === 0 && (
        <div className="rounded-xl border border-border/70 bg-card px-4 py-6 text-center text-xs text-muted-foreground">
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
              {branch.city ? <span className="text-[11px] font-normal text-muted-foreground">— {branch.city}</span> : null}
            </h2>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {branch.occupiedCount} / {branch.totalRooms} {isEn ? "busy" : "مشغولة"}
            </span>
          </div>

          <div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
            style={is3D ? { perspective: "1400px" } : undefined}
          >
            {branch.rooms.map((room) => (
              <article
                key={room.id}
                className={`rounded-xl border p-3 transition-transform duration-300 ${roomTone(room)}`}
                style={
                  is3D
                    ? {
                      transform: "rotateX(12deg)",
                      transformStyle: "preserve-3d",
                      boxShadow: room.isOccupied
                        ? "0 14px 24px -22px var(--accent, rgba(0,0,0,0.4))"
                        : "0 10px 20px -24px rgba(0,0,0,0.35)",
                    }
                    : undefined
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{room.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {ROOM_TYPE_LABELS[room.type] || room.type} · {isEn ? "capacity" : "سعة"} {room.capacity}
                      {!room.isActive ? (isEn ? " · inactive" : " · غير مفعّلة") : ""}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      room.isOccupied
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-border/70 bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    {room.isOccupied ? (isEn ? "Busy" : "مشغولة") : isEn ? "Free" : "متاحة"}
                  </span>
                </div>

                {room.current ? (
                  <div className="mt-2 space-y-1 border-t border-border/70 pt-2">
                    <div className="text-xs font-semibold text-foreground">{room.current.groupName}</div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {room.current.teacherName || (isEn ? "No teacher" : "بدون مدرس")}
                      </span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Clock className="h-3 w-3" />
                        {room.current.startTime} - {room.current.endTime}
                      </span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Users className="h-3 w-3" />
                        {room.current.members}/{room.capacity}
                      </span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${Math.max(4, Math.min(100, room.fillPercent))}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 border-t border-border/70 pt-2 text-[11px] text-muted-foreground">
                    {isEn ? "No class in progress." : "لا توجد حصة جارية حالياً."}
                  </div>
                )}

                <div className="mt-2 rounded-lg bg-muted/40 px-2 py-1.5 text-[11px] text-muted-foreground">
                  {room.next ? (
                    <>
                      <span className="font-semibold text-foreground">{isEn ? "Next: " : "الجاية: "}</span>
                      <span className="tabular-nums">
                        {room.next.dayLabel} {room.next.startTime}
                      </span>
                      {" · "}
                      {room.next.groupName}
                      {room.next.teacherName ? ` · ${room.next.teacherName}` : ""}
                    </>
                  ) : (
                    <>{isEn ? "No upcoming class scheduled." : "لا توجد حصة قادمة مجدولة."}</>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {unassigned.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {isEn ? "Groups without an assigned room" : "مجموعات بدون قاعة محددة"}
          </h2>
          <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
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
                        ? `${isEn ? "Next" : "الجاية"} ${group.next.dayLabel} ${group.next.startTime}`
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

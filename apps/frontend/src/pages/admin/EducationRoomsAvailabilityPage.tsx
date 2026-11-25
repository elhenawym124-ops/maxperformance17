import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, CalendarClock, RefreshCw } from "lucide-react";
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

const api = (path: string, params: Record<string, string> = {}) => {
  const base = buildApiUrl(`education/${path}`);
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    url = new URL(base, window.location.origin);
  }
  const cid = getCompanyId();
  if (cid) url.searchParams.set("companyId", cid);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return url.toString();
};

interface BusyBlock {
  startTime: string;
  endTime: string;
  start: number;
  end: number;
  groups: string[];
  teacherName?: string | null;
}

interface RoomSlot {
  startTime: string;
  endTime: string;
  minutes: number;
}

interface AvailabilityRoom {
  id: string;
  name: string;
  type?: string | null;
  capacity: number;
  isActive: boolean;
  groupsCount: number;
  busy: BusyBlock[];
  free: RoomSlot[];
  busyMinutes: number;
  freeMinutes: number;
  utilization: number | null;
  firstFree: string | null;
}

interface AvailabilityBranch {
  id: string;
  name: string;
  city?: string | null;
  rooms: AvailabilityRoom[];
}

interface AvailabilityPayload {
  date: string;
  dayLabel: string;
  window: { from: string; to: string };
  summary: {
    rooms: number;
    fullyFree: number;
    fullyBooked: number;
    freeMinutesTotal: number;
  };
  branches: AvailabilityBranch[];
}

const toMinutes = (hhmm: string) => {
  const parts = String(hhmm || "0:0").split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

const hoursLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}د`;
  return rest ? `${hours}س ${rest}د` : `${hours}س`;
};

const todayInput = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const EducationRoomsAvailabilityPage: React.FC = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const [date, setDate] = useState(todayInput());
  const [from, setFrom] = useState("08:00");
  const [to, setTo] = useState("22:00");
  const [branchId, setBranchId] = useState("");
  const [payload, setPayload] = useState<AvailabilityPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        api("groups/rooms/availability", { date, from, to, branchId }),
        { headers: getAuthHeaders() }
      );
      const data = await res.json();
      if (!data?.success) {
        setError(data?.error || (isEn ? "Failed to load availability" : "تعذّر تحميل المواعيد المتاحة"));
        return;
      }
      setPayload(data.data as AvailabilityPayload);
    } catch (err: any) {
      setError(err?.message || (isEn ? "Failed to load availability" : "تعذّر تحميل المواعيد المتاحة"));
    } finally {
      setLoading(false);
    }
  }, [date, from, to, branchId, isEn]);

  useEffect(() => {
    load();
  }, [load]);

  const windowFrom = payload ? toMinutes(payload.window.from) : toMinutes(from);
  const windowTo = payload ? toMinutes(payload.window.to) : toMinutes(to);
  const windowMinutes = Math.max(1, windowTo - windowFrom);

  const branches = payload?.branches || [];
  const branchOptions = useMemo(
    () => branches.map((branch) => ({ id: branch.id, name: branch.name })),
    [branches]
  );

  return (
    <div className="w-full h-full min-h-0 flex-1 overflow-y-auto overflow-x-hidden font-sans" dir={isEn ? "ltr" : "rtl"}>
    <div className="mx-auto w-full max-w-[1400px] px-3 py-4 pb-24 sm:px-6 sm:py-6 sm:pb-12 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-lg font-bold text-foreground sm:text-xl">
            <CalendarClock className="h-5 w-5 text-muted-foreground" />
            {isEn ? "Room availability" : "المواعيد المتاحة في القاعات"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isEn
              ? "Pick a day and see every room's busy blocks and free windows."
              : "اختار اليوم وشوف لكل قاعة الأوقات المشغولة والفراغات المتاحة."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/education/rooms"
            className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-2 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            {isEn ? "Live board" : "القاعات الآن"}
          </Link>
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

      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border/70 bg-card p-3">
        <label className="text-[11px] text-muted-foreground">
          {isEn ? "Date" : "التاريخ"}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-foreground"
          />
        </label>
        <label className="text-[11px] text-muted-foreground">
          {isEn ? "From" : "من"}
          <input
            type="time"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 block rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-foreground tabular-nums"
          />
        </label>
        <label className="text-[11px] text-muted-foreground">
          {isEn ? "To" : "إلى"}
          <input
            type="time"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 block rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-foreground tabular-nums"
          />
        </label>
        <label className="text-[11px] text-muted-foreground">
          {isEn ? "Branch" : "الفرع"}
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="mt-1 block rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-foreground"
          >
            <option value="">{isEn ? "All branches" : "كل الفروع"}</option>
            {branchOptions.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>
        {payload ? (
          <span className="ms-auto text-[11px] text-muted-foreground font-mono">
            {payload.dayLabel} · {payload.window.from}–{payload.window.to}
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>
      ) : null}

      {payload ? (
        <div className="grid grid-cols-2 divide-y divide-border/70 overflow-hidden rounded-lg border border-border/70 bg-card sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {[
            { label: isEn ? "Rooms" : "قاعات", value: payload.summary.rooms },
            { label: isEn ? "Free all day" : "فاضية اليوم", value: payload.summary.fullyFree },
            { label: isEn ? "Fully booked" : "محجوزة بالكامل", value: payload.summary.fullyBooked },
            {
              label: isEn ? "Total free time" : "إجمالي الوقت المتاح",
              value: hoursLabel(payload.summary.freeMinutesTotal),
            },
          ].map((item) => (
            <div key={item.label} className="p-3">
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {loading && !payload ? (
        <div className="rounded-lg border border-border/70 bg-card p-6 text-center text-xs text-muted-foreground">
          {isEn ? "Loading..." : "جارٍ التحميل..."}
        </div>
      ) : null}

      <div className="space-y-4">
        {branches.map((branch) => (
          <section key={branch.id} className="overflow-hidden rounded-lg border border-border/70 bg-card">
            <header className="flex items-center justify-between border-b border-border/70 px-3 py-2">
              <h2 className="text-xs font-semibold text-foreground">{branch.name}</h2>
              <span className="text-[10px] text-muted-foreground font-mono">
                {branch.rooms.length} {isEn ? "rooms" : "قاعة"}
              </span>
            </header>
            {branch.rooms.length === 0 ? (
              <p className="p-3 text-[11px] text-muted-foreground">
                {isEn ? "No rooms configured for this branch" : "لا توجد قاعات مسجّلة لهذا الفرع"}
              </p>
            ) : (
              <div className="divide-y divide-border/60">
                {branch.rooms.map((room) => (
                  <div key={room.id} className="px-3 py-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{room.name}</span>
                        {room.type ? (
                          <span className="rounded border border-border/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {room.type}
                          </span>
                        ) : null}
                        {!room.isActive ? (
                          <span className="rounded border border-border/70 bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {isEn ? "Inactive" : "غير مفعّلة"}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground tabular-nums">
                        <span>
                          {isEn ? "Busy" : "مشغول"}: {hoursLabel(room.busyMinutes)}
                        </span>
                        <span className="text-success">
                          {isEn ? "Free" : "متاح"}: {hoursLabel(room.freeMinutes)}
                        </span>
                        <span>{room.utilization === null ? "—" : `${room.utilization}%`}</span>
                      </div>
                    </div>

                    <div className="relative h-5 w-full overflow-hidden rounded bg-muted">
                      {room.busy.map((block, index) => {
                        const left = ((Math.max(block.start, windowFrom) - windowFrom) / windowMinutes) * 100;
                        const width = ((Math.min(block.end, windowTo) - Math.max(block.start, windowFrom)) / windowMinutes) * 100;
                        if (width <= 0) return null;
                        return (
                          <div
                            key={`${block.startTime}-${index}`}
                            title={`${block.startTime}–${block.endTime} · ${block.groups.join(" / ")}`}
                            className="absolute top-0 h-full bg-accent/70"
                            style={{ left: `${left}%`, width: `${Math.max(width, 0.6)}%` }}
                          />
                        );
                      })}
                      <div className="absolute inset-0 flex items-center justify-between px-1 text-[9px] text-muted-foreground">
                        <span>{payload?.window.from}</span>
                        <span>{payload?.window.to}</span>
                      </div>
                    </div>

                    {room.free.length === 0 ? (
                      <p className="text-[11px] text-destructive">
                        {isEn ? "No free window in this range" : "لا يوجد وقت متاح في هذا النطاق"}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {room.free.map((slot) => (
                          <span
                            key={`${slot.startTime}-${slot.endTime}`}
                            className="rounded border border-success/20 bg-success/10 px-1.5 py-0.5 text-[10px] font-mono tabular-nums text-success"
                          >
                            {slot.startTime}–{slot.endTime} ({hoursLabel(slot.minutes)})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
    </div>
  );
};

export default EducationRoomsAvailabilityPage;

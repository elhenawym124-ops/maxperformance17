import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Users,
  MessageSquare,
  UserCheck,
  Trash2,
  CheckCircle2,
  Info,
  Globe,
  Phone,
  Building2,
  User,
  Filter,
  ExternalLink,
  X,
  Share2,
  Sparkles,
} from "lucide-react";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { DemoDayAttendee } from "./types";

interface DemoDayAttendeesTableProps {
  attendees: DemoDayAttendee[];
  branches?: Array<{ id: string; name: string }>;
  onUpdateStatus: (attendeeId: string, update: { attendanceStatus?: string; conversionStatus?: string; notes?: string; branchId?: string }) => Promise<void>;
  onConvertLead: (attendee: DemoDayAttendee) => void;
  onDeleteAttendee: (attendeeId: string) => Promise<void>;
  isEn?: boolean;
}

export function resolveAttendeeAttribution(att: DemoDayAttendee) {
  let channel = att.sourceChannel || null;
  let campaign = att.campaignName || null;
  let adId = att.adRef || null;
  let postId = att.postRef || null;
  let sourceRaw = att.sourceRaw || null;
  let landingUrl = att.landingUrl || null;

  // Fallback to legacy [ATTR: ...] tag inside notes if columns are null
  if ((!channel || !campaign) && att.notes && att.notes.includes("[ATTR:")) {
    try {
      const match = att.notes.match(/\[ATTR:\s*({.*?})\]/);
      if (match && match[1]) {
        const parsed = JSON.parse(match[1]);
        if (!channel && parsed.source) channel = String(parsed.source).toUpperCase();
        if (!campaign && parsed.campaign) campaign = parsed.campaign;
        if (!adId && parsed.adId) adId = parsed.adId;
        if (!postId && parsed.postId) postId = parsed.postId;
      }
    } catch (_) {}
  }

  if (!channel) {
    if (att.leadSource) {
      channel = att.leadSource.toUpperCase();
    } else {
      channel = "OTHER";
    }
  }

  if (!campaign) {
    campaign = channel === "WEBSITE" ? "الموقع ولاندينج بيج" : channel === "WHATSAPP" ? "محادثات الواتساب" : "حملة عامة";
  }

  return {
    channel,
    campaign,
    adId,
    postId,
    sourceRaw,
    landingUrl,
  };
}

export function resolveRegisteredBy(att: DemoDayAttendee) {
  let type = att.registeredByType ? String(att.registeredByType).toUpperCase() : null;
  const name = att.registeredByName || null;
  const userId = att.registeredByUserId || null;

  if (!type) {
    if (att.notes?.includes("تسجيل ذاتي") || att.notes?.includes("الموقع العام") || att.sourceChannel === "WEBSITE") {
      type = "SELF";
    } else {
      type = "SELF";
    }
  }

  return {
    type,
    name,
    userId,
  };
}

function cleanNotes(notes?: string | null) {
  if (!notes) return "";
  return notes.replace(/\[ATTR:\s*{.*?}\]/g, "").trim();
}

export function DemoDayAttendeesTable({
  attendees,
  branches = [],
  onUpdateStatus,
  onConvertLead,
  onDeleteAttendee,
  isEn = false,
}: DemoDayAttendeesTableProps) {
  const [pendingDelete, setPendingDelete] = useState<DemoDayAttendee | null>(null);
  const [selectedDetailAttendee, setSelectedDetailAttendee] = useState<DemoDayAttendee | null>(null);

  // Filters
  const [channelFilter, setChannelFilter] = useState<string>("ALL");
  const [regTypeFilter, setRegTypeFilter] = useState<string>("ALL");

  const filteredAttendees = useMemo(() => {
    return attendees.filter((att) => {
      const attr = resolveAttendeeAttribution(att);
      const reg = resolveRegisteredBy(att);

      if (channelFilter !== "ALL" && attr.channel !== channelFilter) {
        return false;
      }

      if (regTypeFilter !== "ALL") {
        if (regTypeFilter === "SELF" && reg.type !== "SELF") return false;
        if (regTypeFilter === "EMPLOYEE" && reg.type !== "EMPLOYEE") return false;
        if (regTypeFilter === "IMPORT" && reg.type !== "IMPORT") return false;
        if (regTypeFilter === "API" && reg.type !== "API") return false;
      }

      return true;
    });
  }, [attendees, channelFilter, regTypeFilter]);

  if (!attendees.length) {
    return (
      <div className="p-8 sm:p-12 text-center rounded-xl border border-dashed border-border bg-card/50 space-y-2.5">
        <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
          <Users className="w-5 h-5" />
        </div>
        <p className="text-xs text-muted-foreground font-medium">
          {isEn ? "No attendees registered for this Demo Day yet" : "لا يوجد مسجلين في هذا اليوم التجريبي حتى الآن"}
        </p>
      </div>
    );
  }

  const openWhatsApp = (phone: string, studentName: string) => {
    let clean = phone.replace(/[^\d]/g, "");
    if (clean.startsWith("01")) clean = "20" + clean.slice(1);
    const msg = encodeURIComponent(
      isEn
        ? `Hello, regarding the Demo Day reservation for student ${studentName}…`
        : `أهلاً بك، بخصوص حجز اليوم التجريبي (الديمو داي) للطالب ${studentName}…`
    );
    window.open(`https://wa.me/${clean}?text=${msg}`, "_blank");
  };

  const attendanceSelectCls = (att: DemoDayAttendee) =>
    `text-[11px] font-semibold px-2 py-1 rounded-lg w-full focus:outline-none cursor-pointer transition-colors ${
      att.attendanceStatus === "ATTENDED"
        ? "bg-emerald-500/10 text-success dark:text-success"
        : att.attendanceStatus === "ABSENT"
        ? "bg-rose-500/10 text-destructive dark:text-destructive"
        : "bg-muted text-muted-foreground"
    }`;

  const leadSelectCls = (att: DemoDayAttendee) =>
    `text-[11px] font-semibold px-2 py-1 rounded-lg w-full focus:outline-none cursor-pointer transition-colors ${
      att.conversionStatus === "CONVERTED"
        ? "bg-emerald-500/10 text-success dark:text-success font-bold"
        : att.conversionStatus === "NOT_INTERESTED"
        ? "bg-muted text-muted-foreground"
        : "bg-blue-500/10 text-primary dark:text-primary"
    }`;

  const renderChannelBadge = (channel: string) => {
    switch (channel) {
      case "WHATSAPP":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <span>💬</span> {isEn ? "WhatsApp" : "واتساب"}
          </span>
        );
      case "FACEBOOK":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400">
            <span>⚡</span> {isEn ? "Facebook" : "فيسبوك"}
          </span>
        );
      case "INSTAGRAM":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pink-500/15 text-pink-600 dark:text-pink-400">
            <span>📸</span> {isEn ? "Instagram" : "إنستجرام"}
          </span>
        );
      case "MESSENGER":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
            <span>💬</span> {isEn ? "Messenger" : "ماسنجر"}
          </span>
        );
      case "WEBSITE":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
            <span>🌐</span> {isEn ? "Website" : "الموقع"}
          </span>
        );
      case "PHONE":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <span>📞</span> {isEn ? "Phone" : "هاتف"}
          </span>
        );
      case "WALK_IN":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400">
            <span>🏢</span> {isEn ? "Walk-In" : "حضور مباشر"}
          </span>
        );
      case "REFERRAL":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-500/15 text-teal-600 dark:text-teal-400">
            <span>🤝</span> {isEn ? "Referral" : "ترشيح"}
          </span>
        );
      case "OTHER":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
            <span>🔗</span> {isEn ? "Other" : "أخرى"}
          </span>
        );
    }
  };

  const renderRegisteredByBadge = (reg: { type: string; name?: string | null }) => {
    switch (reg.type) {
      case "SELF":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <User className="w-3 h-3" />
            <span>{isEn ? "Self (Client)" : "العميل نفسه"}</span>
          </span>
        );
      case "EMPLOYEE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 max-w-[150px] truncate" title={reg.name || "موظف"}>
            <Building2 className="w-3 h-3 shrink-0" />
            <span className="truncate">{reg.name ? (isEn ? `Emp: ${reg.name}` : `موظف: ${reg.name}`) : (isEn ? "Employee" : "موظف")}</span>
          </span>
        );
      case "IMPORT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span>📥</span> {isEn ? "Import" : "استيراد"}
          </span>
        );
      case "API":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <span>🔌</span> {isEn ? "API" : "تكامل API"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
            <span>{reg.name || reg.type || "-"}</span>
          </span>
        );
    }
  };

  const whatsappBtn = (att: DemoDayAttendee, size: string) => (
    <button
      type="button"
      onClick={() => openWhatsApp(att.phone, att.studentName)}
      title={isEn ? "Chat on WhatsApp" : "مراسلة عبر واتساب"}
      aria-label={isEn ? `Chat with ${att.studentName} on WhatsApp` : `مراسلة ${att.studentName} عبر واتساب`}
      className={`p-1 rounded-lg text-success dark:text-success hover:bg-success/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${size}`}
    >
      <MessageSquare className="w-3.5 h-3.5" />
    </button>
  );

  const convertBtn = (att: DemoDayAttendee, withLabel: boolean) =>
    !withLabel ? (
      <button
        type="button"
        onClick={() => onConvertLead(att)}
        title={isEn ? "Convert lead to official student" : "تحويل العميل المحتمل إلى طالب رسمي"}
        aria-label={isEn ? `Convert ${att.studentName} to official student` : `تحويل ${att.studentName} إلى طالب رسمي`}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-primary hover:bg-primary/90 active:scale-[0.97] text-primary-foreground shadow-2xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        <UserCheck className="w-3.5 h-3.5" />
        <span>{isEn ? "Convert" : "تحويل لطالب"}</span>
      </button>
    ) : (
      <span className="inline-flex items-center gap-1 text-[11px] text-success dark:text-success font-semibold px-2 py-0.5">
        <CheckCircle2 className="w-3.5 h-3.5" />
        {isEn ? "Enrolled" : "مشترك"}
      </span>
    );

  const deleteBtn = (att: DemoDayAttendee, size: string) => (
    <button
      type="button"
      onClick={() => setPendingDelete(att)}
      title={isEn ? "Delete attendee" : "حذف الحاضر"}
      aria-label={isEn ? `Delete attendee ${att.studentName}` : `حذف الحاضر ${att.studentName}`}
      className={`p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive ${size}`}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );

  return (
    <>
      {/* Filtering Bar for Source Channel and Registrar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-card border border-border/80 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <Filter className="w-3 h-3 text-primary" />
            <span>{isEn ? "Filters:" : "تصفية المسجلين:"}</span>
          </span>

          {/* Channel Filter */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            aria-label={isEn ? "Filter by channel" : "تصفية حسب القناة"}
            className="text-xs font-medium px-2.5 py-1 rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="ALL">{isEn ? "All Channels" : "كل القنوات"}</option>
            <option value="WHATSAPP">💬 {isEn ? "WhatsApp" : "واتساب"}</option>
            <option value="FACEBOOK">⚡ {isEn ? "Facebook" : "فيسبوك"}</option>
            <option value="INSTAGRAM">📸 {isEn ? "Instagram" : "إنستجرام"}</option>
            <option value="MESSENGER">💬 {isEn ? "Messenger" : "ماسنجر"}</option>
            <option value="WEBSITE">🌐 {isEn ? "Website" : "الموقع العام"}</option>
            <option value="PHONE">📞 {isEn ? "Phone" : "هاتف"}</option>
            <option value="WALK_IN">🏢 {isEn ? "Walk-In" : "حضور مباشر"}</option>
            <option value="REFERRAL">🤝 {isEn ? "Referral" : "ترشيح وتوصية"}</option>
            <option value="OTHER">🔗 {isEn ? "Other" : "أخرى / مباشر"}</option>
          </select>

          {/* Registrar Filter */}
          <select
            value={regTypeFilter}
            onChange={(e) => setRegTypeFilter(e.target.value)}
            aria-label={isEn ? "Filter by registrant" : "تصفية حسب من سجّل"}
            className="text-xs font-medium px-2.5 py-1 rounded-lg border border-border bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="ALL">{isEn ? "All Registrars" : "الكل (ذاتي وموظفين)"}</option>
            <option value="SELF">👤 {isEn ? "Self (Client)" : "العميل نفسه (تسجيل ذاتي)"}</option>
            <option value="EMPLOYEE">👔 {isEn ? "Employee" : "موظف (من المنصة)"}</option>
            <option value="IMPORT">📥 {isEn ? "Import" : "استيراد ملف"}</option>
            <option value="API">🔌 {isEn ? "API Integration" : "تكامل خارجي (API)"}</option>
          </select>

          {(channelFilter !== "ALL" || regTypeFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setChannelFilter("ALL");
                setRegTypeFilter("ALL");
              }}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded hover:bg-muted transition-colors"
            >
              <X className="w-3 h-3" />
              <span>{isEn ? "Reset" : "إلغاء التصفية"}</span>
            </button>
          )}
        </div>

        <div className="text-[11px] text-muted-foreground tabular-nums font-medium self-end sm:self-center">
          {isEn ? "Showing" : "عرض"}{" "}
          <span className="font-bold text-foreground">{filteredAttendees.length}</span>{" "}
          {isEn ? `of ${attendees.length}` : `من إجمالي ${attendees.length}`}
        </div>
      </div>

      {filteredAttendees.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-dashed border-border bg-card/50 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            {isEn ? "No attendees match the chosen filters." : "لا يوجد مسجلين يطابقون شروط التصفية المختارة."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table (md+) */}
          <div className="hidden md:block w-full overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right divide-y divide-border/60">
                <thead className="bg-muted/40 text-muted-foreground text-[11px] font-semibold">
                  <tr>
                    <th className="py-3 px-3.5 whitespace-nowrap">{isEn ? "Student / Guardian" : "الطالب / ولي الأمر"}</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">{isEn ? "Phone & WhatsApp" : "الهاتف والواتساب"}</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">{isEn ? "Age / Grade" : "السن والمرحلة"}</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">{isEn ? "Branch" : "فرع الحضور"}</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">{isEn ? "Booking Source" : "مصدر الحجز"}</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">{isEn ? "Registered By" : "سجّله"}</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">{isEn ? "Attendance" : "حالة الحضور"}</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">{isEn ? "Lead Status" : "حالة العميل المحتمل"}</th>
                    <th className="py-3 px-3.5 text-center whitespace-nowrap">{isEn ? "Actions" : "الإجراءات"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-foreground">
                  {filteredAttendees.map((att) => {
                    const isConverted = att.conversionStatus === "CONVERTED";
                    const attr = resolveAttendeeAttribution(att);
                    const reg = resolveRegisteredBy(att);

                    return (
                      <tr key={att.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="space-y-0.5">
                            <div className="font-bold text-foreground flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedDetailAttendee(att)}
                                className="hover:text-primary hover:underline transition-colors text-right font-bold flex items-center gap-1"
                                title={isEn ? "View reservation details" : "عرض تفاصيل الحجز والإسناد"}
                              >
                                <span>{att.studentName}</span>
                                <Info className="w-3 h-3 text-muted-foreground opacity-70" />
                              </button>
                              {isConverted && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-success/10 text-success dark:text-success">
                                  {isEn ? "Student" : "طالب مقيد"}
                                </span>
                              )}
                            </div>
                            {att.guardianName && (
                              <div className="text-[11px] text-muted-foreground">
                                {isEn ? "Guardian:" : "ولي الأمر:"} {att.guardianName}
                              </div>
                            )}
                            {cleanNotes(att.notes) && (
                              <div className="text-[10px] text-muted-foreground/80 italic line-clamp-1">{cleanNotes(att.notes)}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3.5 tabular-nums">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground font-medium">{att.phone}</span>
                            {whatsappBtn(att, "")}
                          </div>
                          {att.email && (
                            <div className="text-[10px] text-muted-foreground font-sans truncate max-w-[140px]">{att.email}</div>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-muted-foreground">
                          <div>{att.grade || "-"}</div>
                          {att.age ? (
                            <div className="text-[10px] tabular-nums font-medium text-foreground">
                              {att.age} {isEn ? "yrs" : "سنة"}{" "}
                              <span className="text-[9px] text-primary">
                                {att.age < 7 ? "(براعم)" : att.age < 10 ? "(أشبال)" : att.age < 14 ? "(يافعين)" : "(شباب)"}
                              </span>
                            </div>
                          ) : null}
                        </td>
                        <td className="py-3 px-3.5">
                          <select
                            value={att.branchId || ""}
                            onChange={(e) => onUpdateStatus(att.id, { branchId: e.target.value })}
                            aria-label={isEn ? `Branch for ${att.studentName}` : `فرع حضور ${att.studentName}`}
                            className="text-[11px] font-medium px-2 py-1 rounded-lg border border-border/80 bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                          >
                            <option value="">{isEn ? "-- No branch --" : "-- فرع الحضور --"}</option>
                            {branches.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Column 5: Booking Source (Channel + Campaign + Ad ID) */}
                        <td className="py-3 px-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {renderChannelBadge(attr.channel)}
                              {attr.sourceRaw && attr.sourceRaw !== attr.channel && (
                                <span className="font-mono text-[9px] text-muted-foreground bg-muted px-1 py-0.5 rounded truncate max-w-[90px]" title={attr.sourceRaw}>
                                  {attr.sourceRaw}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-medium text-foreground truncate max-w-[170px]" title={attr.campaign}>
                              {attr.campaign}
                            </div>
                            {attr.adId && (
                              <div className="font-mono text-[9px] text-muted-foreground flex items-center gap-1">
                                <span>{isEn ? "Ad ID:" : "إعلان:"}</span>
                                <span className="font-semibold text-primary">{attr.adId}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Column 6: Registered By (Self vs Employee) */}
                        <td className="py-3 px-3.5">
                          <div className="space-y-0.5">
                            {renderRegisteredByBadge(reg)}
                            {reg.type === "EMPLOYEE" && reg.name && (
                              <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                {reg.name}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3.5">
                          <select
                            value={att.attendanceStatus}
                            onChange={(e) => onUpdateStatus(att.id, { attendanceStatus: e.target.value })}
                            aria-label={isEn ? `Attendance status of ${att.studentName}` : `حالة حضور ${att.studentName}`}
                            className={attendanceSelectCls(att)}
                          >
                            <option value="REGISTERED">{isEn ? "Registered" : "مسجل"}</option>
                            <option value="ATTENDED">{isEn ? "Attended" : "حضر الديمو"}</option>
                            <option value="ABSENT">{isEn ? "Absent" : "غائب"}</option>
                            <option value="CANCELLED">{isEn ? "Cancelled" : "ملغي"}</option>
                          </select>
                        </td>
                        <td className="py-3 px-3.5">
                          <select
                            value={att.conversionStatus}
                            onChange={(e) => onUpdateStatus(att.id, { conversionStatus: e.target.value })}
                            aria-label={isEn ? `Lead status of ${att.studentName}` : `حالة العميل المحتمل ${att.studentName}`}
                            className={leadSelectCls(att)}
                          >
                            <option value="PENDING">{isEn ? "Lead (Pending)" : "عميل محتمل (متابعة)"}</option>
                            <option value="FOLLOW_UP">{isEn ? "Follow-Up" : "مهتم - إعادة تواصل"}</option>
                            <option value="CONVERTED">{isEn ? "Converted (Student)" : "مشترك (تم التحويل)"}</option>
                            <option value="NOT_INTERESTED">{isEn ? "Not Interested" : "غير مهتم حالياً"}</option>
                          </select>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {convertBtn(att, isConverted)}
                            {deleteBtn(att, "")}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards (< md) */}
          <div className="md:hidden rounded-xl border border-border/80 bg-card shadow-2xs divide-y divide-border/40">
            {filteredAttendees.map((att) => {
              const isConverted = att.conversionStatus === "CONVERTED";
              const attr = resolveAttendeeAttribution(att);
              const reg = resolveRegisteredBy(att);

              return (
                <div key={att.id} className="p-3.5 space-y-2.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-foreground flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailAttendee(att)}
                          className="hover:text-primary transition-colors text-right font-bold truncate flex items-center gap-1"
                        >
                          <span className="truncate">{att.studentName}</span>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </button>
                        {isConverted && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-success/10 text-success dark:text-success">
                            {isEn ? "Student" : "طالب مقيد"}
                          </span>
                        )}
                      </div>
                      {att.guardianName && (
                        <div className="text-[11px] text-muted-foreground truncate">
                          {isEn ? "Guardian:" : "ولي الأمر:"} {att.guardianName}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {whatsappBtn(att, "")}
                      {deleteBtn(att, "")}
                    </div>
                  </div>

                  {/* Booking Source & Registrar line */}
                  <div className="flex items-center justify-between gap-2 flex-wrap p-2 rounded-lg bg-muted/30 border border-border/60">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {renderChannelBadge(attr.channel)}
                      <span className="text-[11px] font-medium text-foreground truncate max-w-[130px]" title={attr.campaign}>
                        {attr.campaign}
                      </span>
                      {attr.adId && (
                        <span className="font-mono text-[9px] text-primary bg-primary/10 px-1 py-0.2 rounded font-bold">
                          #{attr.adId}
                        </span>
                      )}
                    </div>
                    <div className="shrink-0">
                      {renderRegisteredByBadge(reg)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 tabular-nums text-[11px] flex-wrap">
                    <span className="text-foreground font-medium">{att.phone}</span>
                    {att.age && <span className="text-muted-foreground">{att.age} {isEn ? "yrs" : "سنة"}</span>}
                    {att.grade && <span className="text-muted-foreground truncate">{att.grade}</span>}
                  </div>

                  {cleanNotes(att.notes) && (
                    <div className="text-[10px] text-muted-foreground/80 italic">{cleanNotes(att.notes)}</div>
                  )}

                  <div className="grid grid-cols-1 gap-2">
                    <select
                      value={att.attendanceStatus}
                      onChange={(e) => onUpdateStatus(att.id, { attendanceStatus: e.target.value })}
                      aria-label={isEn ? `Attendance status of ${att.studentName}` : `حالة حضور ${att.studentName}`}
                      className={attendanceSelectCls(att)}
                    >
                      <option value="REGISTERED">{isEn ? "Registered" : "مسجل"}</option>
                      <option value="ATTENDED">{isEn ? "Attended" : "حضر الديمو"}</option>
                      <option value="ABSENT">{isEn ? "Absent" : "غائب"}</option>
                      <option value="CANCELLED">{isEn ? "Cancelled" : "ملغي"}</option>
                    </select>
                    <select
                      value={att.conversionStatus}
                      onChange={(e) => onUpdateStatus(att.id, { conversionStatus: e.target.value })}
                      aria-label={isEn ? `Lead status of ${att.studentName}` : `حالة العميل المحتمل ${att.studentName}`}
                      className={leadSelectCls(att)}
                    >
                      <option value="PENDING">{isEn ? "Lead (Pending)" : "عميل محتمل (متابعة)"}</option>
                      <option value="FOLLOW_UP">{isEn ? "Follow-Up" : "مهتم - إعادة تواصل"}</option>
                      <option value="CONVERTED">{isEn ? "Converted (Student)" : "مشترك (تم التحويل)"}</option>
                      <option value="NOT_INTERESTED">{isEn ? "Not Interested" : "غير مهتم حالياً"}</option>
                    </select>
                  </div>

                  {!isConverted && (
                    <button
                      type="button"
                      onClick={() => onConvertLead(att)}
                      className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground shadow-2xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      {isEn ? "Convert to Student" : "تحويل لطالب"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Reservation Details Modal (Requirement 6) */}
      {selectedDetailAttendee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/80">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {isEn ? "Reservation & Attribution Details" : "تفاصيل الحجز ومصدر الإسناد"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedDetailAttendee.studentName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailAttendee(null)}
                aria-label={isEn ? "Close" : "إغلاق"}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {/* Attribution & Registrar Highlight Box */}
              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isEn ? "Booking Attribution Summary" : "ملخص إسناد الحجز والتسجيل"}</span>
                </span>

                {(() => {
                  const attr = resolveAttendeeAttribution(selectedDetailAttendee);
                  const reg = resolveRegisteredBy(selectedDetailAttendee);
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground font-medium block">
                          {isEn ? "Registered By" : "الجهة المسجلة (سجّله):"}
                        </span>
                        <div>{renderRegisteredByBadge(reg)}</div>
                        {reg.name && (
                          <div className="text-[11px] font-semibold text-foreground">
                            {reg.name} {reg.userId ? `(ID: ${reg.userId})` : ""}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground font-medium block">
                          {isEn ? "Source Channel" : "قناة الوصول والحجز:"}
                        </span>
                        <div>{renderChannelBadge(attr.channel)}</div>
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <span className="text-[10px] text-muted-foreground font-medium block">
                          {isEn ? "Campaign Name" : "اسم الحملة الإعلانية:"}
                        </span>
                        <div className="font-semibold text-foreground text-xs bg-card p-2 rounded-lg border border-border/80">
                          {attr.campaign}
                        </div>
                      </div>

                      {attr.adId && (
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-muted-foreground font-medium block">
                            {isEn ? "Ad Identifier (Ad ID / Ref):" : "معرّف الإعلان (Ad ID):"}
                          </span>
                          <span className="font-mono text-xs font-bold text-primary bg-background px-2 py-1 rounded border border-border inline-block">
                            {attr.adId}
                          </span>
                        </div>
                      )}

                      {attr.postId && (
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-muted-foreground font-medium block">
                            {isEn ? "Post Identifier (Post ID / Ref):" : "معرّف المنشور (Post ID):"}
                          </span>
                          <span className="font-mono text-xs font-bold text-foreground bg-background px-2 py-1 rounded border border-border inline-block">
                            {attr.postId}
                          </span>
                        </div>
                      )}

                      {attr.sourceRaw && (
                        <div className="space-y-0.5 sm:col-span-2">
                          <span className="text-[10px] text-muted-foreground font-medium block">
                            {isEn ? "Raw Source Text:" : "النص الخام للمصدر (من الرابط):"}
                          </span>
                          <div className="font-mono text-[11px] text-foreground bg-background p-2 rounded border border-border break-all">
                            {attr.sourceRaw}
                          </div>
                        </div>
                      )}

                      {attr.landingUrl && (
                        <div className="space-y-0.5 sm:col-span-2">
                          <span className="text-[10px] text-muted-foreground font-medium block">
                            {isEn ? "Landing Page / Referer URL:" : "صفحة الوصول (Landing / Referer):"}
                          </span>
                          <a
                            href={attr.landingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[10px] text-primary hover:underline break-all inline-flex items-center gap-1"
                          >
                            <span className="truncate max-w-sm">{attr.landingUrl}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Student & Guardian Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-card border border-border/80">
                <div>
                  <span className="text-[10px] text-muted-foreground block">{isEn ? "Phone:" : "الهاتف:"}</span>
                  <div className="font-mono font-medium text-foreground">{selectedDetailAttendee.phone}</div>
                </div>

                {selectedDetailAttendee.phone2 && (
                  <div>
                    <span className="text-[10px] text-muted-foreground block">{isEn ? "Alt Phone:" : "هاتف بديل:"}</span>
                    <div className="font-mono font-medium text-foreground">{selectedDetailAttendee.phone2}</div>
                  </div>
                )}

                {selectedDetailAttendee.email && (
                  <div>
                    <span className="text-[10px] text-muted-foreground block">{isEn ? "Email:" : "البريد الإلكتروني:"}</span>
                    <div className="text-foreground">{selectedDetailAttendee.email}</div>
                  </div>
                )}

                <div>
                  <span className="text-[10px] text-muted-foreground block">{isEn ? "Age / Grade:" : "السن والمرحلة:"}</span>
                  <div className="text-foreground">
                    {selectedDetailAttendee.age ? `${selectedDetailAttendee.age} سنة` : "-"} / {selectedDetailAttendee.grade || "-"}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground block">{isEn ? "Registration Date:" : "تاريخ التسجيل:"}</span>
                  <div className="text-foreground tabular-nums">
                    {new Date(selectedDetailAttendee.createdAt).toLocaleString("ar-EG")}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground block">{isEn ? "Student Code:" : "كود الطالب:"}</span>
                  <div className="font-mono font-bold text-primary">
                    {selectedDetailAttendee.studentCode || "-"}
                  </div>
                </div>
              </div>

              {selectedDetailAttendee.notes && (
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold block">
                    {isEn ? "Full Notes & System Tags:" : "الملاحظات ووسوم النظام:"}
                  </span>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-[11px] text-foreground whitespace-pre-wrap">
                    {selectedDetailAttendee.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-3.5 border-t border-border/80 bg-muted/20">
              <button
                type="button"
                onClick={() => setSelectedDetailAttendee(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-border bg-background hover:bg-muted text-foreground transition-colors"
              >
                {isEn ? "Close" : "إغلاق"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={isEn ? "Delete attendee?" : "حذف الحاضر؟"}
        content={
          isEn
            ? `Remove ${pendingDelete?.studentName || ""} from this Demo Day attendance list?`
            : `سيتم حذف ${pendingDelete?.studentName || ""} من قائمة حضور هذا اليوم التجريبي.`
        }
        confirmLabel={isEn ? "Delete" : "حذف"}
        cancelLabel={isEn ? "Cancel" : "إلغاء"}
        confirmColor="error"
        onConfirm={() => {
          if (pendingDelete) {
            void onDeleteAttendee(pendingDelete.id);
            toast.success(isEn ? "Attendee removed" : "تم حذف الحاضر");
          }
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

export default DemoDayAttendeesTable;

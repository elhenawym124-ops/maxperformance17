import React, { useState, useMemo } from "react";
import { X, UserPlus, Check, AlertCircle, Building2, Sparkles, GraduationCap } from "lucide-react";
import { getLevelsForAge } from "../education-management/educationSharedHelpers";

interface AddAttendeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (data: any) => Promise<void>;
  demoDayTitle: string;
  branches?: Array<{ id: string; name: string; city?: string }>;
  isEn?: boolean;
}

export function AddAttendeeModal({
  isOpen,
  onClose,
  onRegister,
  demoDayTitle,
  branches = [],
  isEn = false,
}: AddAttendeeModalProps) {
  const [studentName, setStudentName] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [branchId, setBranchId] = useState<string>("");
  const [grade, setGrade] = useState("");
  const [sourceChannel, setSourceChannel] = useState("PHONE");
  const [campaignName, setCampaignName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestedLevels = useMemo(() => {
    return getLevelsForAge(typeof age === "number" ? age : undefined);
  }, [age]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !phone.trim()) {
      setError(isEn ? "Student name and phone number are required" : "اسم الطالب ورقم الهاتف مطلوبان");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onRegister({
        studentName: studentName.trim(),
        guardianName: guardianName.trim() || null,
        phone: phone.trim(),
        phone2: phone2.trim() || null,
        email: email.trim() || null,
        age: age ? Number(age) : null,
        branchId: branchId || null,
        grade: grade.trim() || null,
        leadSource: sourceChannel || "PHONE",
        campaignName: campaignName.trim() || null,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || (isEn ? "Failed to register attendee" : "فشل تسجيل الحاضر"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-xs">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary dark:text-primary border border-primary/20">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {isEn ? "Register Demo Day Attendee" : "تسجيل حاضر في الديمو داي"}
              </h3>
              <p className="text-xs text-muted-foreground truncate max-w-xs">
                {demoDayTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? "Close modal" : "إغلاق النافذة"}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Auto Student Creation Hint */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>
              {isEn
                ? "This attendee will automatically be enrolled in the official Students Directory with a unique student code."
                : "سيتم إدراج الطالب تلقائياً في قائمة الطلاب الرسمية وتخصيص كود فريد له مع إمكانية التحويل المباشر."}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                {isEn ? "Student Name" : "اسم الطالب"} <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder={isEn ? "e.g. Omar Mokhtar" : "مثال: عمر مختار"}
                className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {isEn ? "Guardian Name (Parent)" : "اسم ولي الأمر"}
              </label>
              <input
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder={isEn ? "e.g. Mokhtar Elhenawy" : "مثال: مختار الهنداوي"}
                className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                {isEn ? "Phone (WhatsApp)" : "رقم الهاتف (الواتساب)"} <span className="text-destructive">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
                dir="ltr"
                className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {isEn ? "Alternative Phone (Optional)" : "رقم هاتف بديل"}
              </label>
              <input
                type="tel"
                value={phone2}
                onChange={(e) => setPhone2(e.target.value)}
                placeholder="01112345678"
                dir="ltr"
                className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Branch & Age (with age bracket & levels) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                {isEn ? "Branch Attendance" : "تسجيل الحضور على فرع"}
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="">{isEn ? "-- Select Branch --" : "-- اختر الفرع للحضور --"}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.city ? `(${b.city})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground flex items-center justify-between">
                <span>{isEn ? "Age (Years)" : "السن (سنوات)"}</span>
                {typeof age === "number" && (
                  <span className="text-[10px] text-primary font-semibold">
                    {age < 7 ? "براعم (4-6)" : age < 10 ? "أشبال (7-9)" : age < 14 ? "يافعين (10-13)" : "شباب (14-18)"}
                  </span>
                )}
              </label>
              <input
                type="number"
                min="3"
                max="80"
                value={age}
                onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                placeholder={isEn ? "e.g. 10" : "مثال: 10"}
                className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none font-mono tabular-nums"
              />
            </div>
          </div>

          {/* Age Linked Level Preview */}
          {suggestedLevels.length > 0 && (
            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 space-y-1">
              <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-primary" />
                {isEn ? "Suggested Age-Linked Levels:" : "المستويات المقترحة لهذا السن:"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedLevels.map((lvl) => (
                  <span
                    key={lvl.id}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-background border border-border text-foreground"
                  >
                    {lvl.name} ({lvl.code})
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {isEn ? "Grade / School Level" : "المرحلة الدراسية"}
              </label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder={isEn ? "e.g. Grade 6 / Preparatory" : "مثال: أولى إعدادي"}
                className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {isEn ? "Email Address (Optional)" : "البريد الإلكتروني (اختياري)"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                dir="ltr"
                className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Booking Attribution Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                {isEn ? "Booking Channel" : "قناة الحجز / التواصل"}
              </label>
              <select
                value={sourceChannel}
                onChange={(e) => setSourceChannel(e.target.value)}
                className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="PHONE">📞 {isEn ? "Phone Call" : "اتصال هاتفي (Phone)"}</option>
                <option value="WHATSAPP">💬 {isEn ? "WhatsApp" : "محادثة واتساب (WhatsApp)"}</option>
                <option value="WALK_IN">🏢 {isEn ? "Walk-In (Branch)" : "حضور مباشر للفرع (Walk-In)"}</option>
                <option value="FACEBOOK">⚡ {isEn ? "Facebook Ads/Page" : "إعلانات فيسبوك (Facebook)"}</option>
                <option value="INSTAGRAM">📸 {isEn ? "Instagram" : "إنستجرام (Instagram)"}</option>
                <option value="MESSENGER">💬 {isEn ? "Messenger" : "ماسنجر (Messenger)"}</option>
                <option value="REFERRAL">🤝 {isEn ? "Referral" : "ترشيح من عميل (Referral)"}</option>
                <option value="WEBSITE">🌐 {isEn ? "Website" : "الموقع الإلكتروني (Website)"}</option>
                <option value="OTHER">🔗 {isEn ? "Other" : "أخرى / مباشر"}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                {isEn ? "Campaign Name (Optional)" : "اسم الحملة الإعلانية (اختياري)"}
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder={isEn ? "e.g. Summer Robotics 2026" : "مثال: حملة روبوتيكس الصيف"}
                className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              {isEn ? "Notes / Source" : "ملاحظات أو مصدر المعرفة"}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isEn ? "e.g. Came via Facebook Ad, interested in Robotics" : "مثال: قادم من إعلان فيسبوك، مهتم بمسار البرمجة"}
              className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 sm:p-5 border-t border-border/80 bg-muted/20">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-medium border border-border bg-background hover:bg-muted text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            {isEn ? "Cancel" : "إلغاء"}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            {isEn ? "Confirm Registration" : "تأكيد التسجيل وإدراج الطالب"}
          </button>
        </div>
      </div>
    </div>
  );
}

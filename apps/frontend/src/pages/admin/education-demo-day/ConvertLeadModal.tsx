import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  UserCheck,
  Gift,
  GraduationCap,
  DollarSign,
  Check,
  AlertCircle,
  Building2,
  Users,
  Layers,
  KeyRound,
  Copy,
  Calendar,
  Percent,
  Sparkles,
} from "lucide-react";
import { DemoDayAttendee } from "./types";
import {
  AGE_BRACKETS,
  getLevelsForAge,
  generateAutoCredentials,
  calculateInstallmentSchedule,
  DISCOUNT_TYPES,
  computeDiscountAndFinal,
} from "../education-management/educationSharedHelpers";

interface ConvertLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConvert: (data: {
    groupId?: string;
    branchId?: string;
    level?: string;
    age?: number;
    paymentMethod?: "CASH" | "INSTALLMENTS";
    installmentCount?: number;
    installments?: Array<{ installmentNumber: number; amount: number; dueDate: string; status: string }>;
    discountType?: "NONE" | "SIBLINGS" | "SEASONAL" | "CUSTOM";
    discountAmount?: number;
    finalAmount?: number;
    autoGenerateCredentials?: boolean;
    username?: string;
    password?: string;
    packageId?: string;
    teacherId?: string;
    amountPaid?: number;
  }) => Promise<void>;
  attendee: DemoDayAttendee | null;
  packages: { id: string; name: string; price: number; hoursCount: number }[];
  teachers: { id: string; name: string }[];
  groups?: Array<{
    id: string;
    name: string;
    branchId?: string | null;
    level?: string | null;
    scheduleSlots?: Array<{ dayOfWeek: string; startTime: string; endTime: string }>;
    maxStudents?: number;
    studentCount?: number;
  }>;
  branches?: Array<{ id: string; name: string; city?: string }>;
  isEn?: boolean;
}

export function ConvertLeadModal({
  isOpen,
  onClose,
  onConvert,
  attendee,
  packages = [],
  teachers = [],
  groups = [],
  branches = [],
  isEn = false,
}: ConvertLeadModalProps) {
  // Core placement
  const [branchId, setBranchId] = useState<string>("");
  const [age, setAge] = useState<number | "">("");
  const [level, setLevel] = useState<string>("");
  const [groupId, setGroupId] = useState<string>("");

  // Package & Teacher
  const [packageId, setPackageId] = useState<string>("");
  const [teacherId, setTeacherId] = useState<string>("");

  // Financial & Discount
  const [basePrice, setBasePrice] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"NONE" | "SIBLINGS" | "SEASONAL" | "CUSTOM">("NONE");
  const [discountValue, setDiscountValue] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "INSTALLMENTS">("CASH");
  const [installmentCount, setInstallmentCount] = useState<2 | 3>(2);
  const [installments, setInstallments] = useState<
    Array<{ installmentNumber: number; amount: number; dueDate: string; status: string }>
  >([]);
  const [amountPaid, setAmountPaid] = useState<number | "">("");

  // Credentials
  const [autoCredentials, setAutoCredentials] = useState<boolean>(true);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from attendee
  useEffect(() => {
    if (attendee && isOpen) {
      const initAge = attendee.age || 10;
      setAge(initAge);
      setBranchId(attendee.branchId || (branches.length > 0 ? branches[0].id : ""));
      const creds = generateAutoCredentials(attendee.studentName, attendee.phone);
      setUsername(creds.username);
      setPassword(creds.password);
      setPackageId("");
      setTeacherId("");
      setGroupId("");
      setBasePrice(0);
      setDiscountType("NONE");
      setDiscountValue("");
      setPaymentMethod("CASH");
      setInstallmentCount(2);
      setAmountPaid("");
      setError(null);
    }
  }, [attendee, isOpen, branches]);

  // Dynamic Levels based on Age
  const currentLevels = useMemo(() => {
    return getLevelsForAge(typeof age === "number" ? age : undefined);
  }, [age]);

  // Set default level when levels change
  useEffect(() => {
    if (currentLevels.length > 0 && (!level || !currentLevels.some((l) => l.name === level))) {
      setLevel(currentLevels[0].name);
    }
  }, [currentLevels]);

  // Filter groups by selected branch if branch chosen
  const filteredGroups = useMemo(() => {
    if (!branchId) return groups;
    return groups.filter((g) => !g.branchId || g.branchId === branchId);
  }, [groups, branchId]);

  // Update base price when package is selected
  const handlePackageChange = (id: string) => {
    setPackageId(id);
    const p = packages.find((x) => x.id === id);
    if (p) {
      setBasePrice(p.price);
    } else {
      setBasePrice(0);
    }
  };

  // Recalculate financial breakdown
  const financial = useMemo(() => {
    const rawDisc = typeof discountValue === "number" ? discountValue : 0;
    return computeDiscountAndFinal(basePrice, discountType, rawDisc);
  }, [basePrice, discountType, discountValue]);

  // Recalculate installments whenever finalAmount, paymentMethod, or installmentCount changes
  useEffect(() => {
    if (paymentMethod === "INSTALLMENTS" && financial.finalAmount > 0) {
      const schedule = calculateInstallmentSchedule(financial.finalAmount, installmentCount);
      setInstallments(
        schedule.map((s) => ({
          installmentNumber: s.installmentNumber,
          amount: s.amount,
          dueDate: s.dueDate,
          status: "PENDING",
        }))
      );
      // Default amount paid now to 1st installment
      if (schedule.length > 0) {
        setAmountPaid(schedule[0].amount);
      }
    } else if (paymentMethod === "CASH") {
      setInstallments([]);
      setAmountPaid(financial.finalAmount > 0 ? financial.finalAmount : "");
    }
  }, [paymentMethod, installmentCount, financial.finalAmount]);

  const handleDueDateChange = (index: number, newDate: string) => {
    setInstallments((prev) =>
      prev.map((inst, i) => (i === index ? { ...inst, dueDate: newDate } : inst))
    );
  };

  const handleGenerateNewCreds = () => {
    if (!attendee) return;
    const creds = generateAutoCredentials(attendee.studentName, attendee.phone);
    setUsername(creds.username);
    setPassword(creds.password);
  };

  const handleCopyCredentials = () => {
    const text = `${isEn ? "Username:" : "اسم المستخدم:"} ${username}\n${isEn ? "Password:" : "كلمة المرور:"} ${password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !attendee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onConvert({
        groupId: groupId || undefined,
        branchId: branchId || undefined,
        level: level || undefined,
        age: typeof age === "number" ? age : undefined,
        paymentMethod,
        installmentCount: paymentMethod === "INSTALLMENTS" ? installmentCount : 1,
        installments: paymentMethod === "INSTALLMENTS" ? installments : undefined,
        discountType,
        discountAmount: financial.discountAmount,
        finalAmount: financial.finalAmount,
        autoGenerateCredentials: autoCredentials,
        username: autoCredentials ? username : undefined,
        password: autoCredentials ? password : undefined,
        packageId: packageId || undefined,
        teacherId: teacherId || undefined,
        amountPaid: amountPaid ? Number(amountPaid) : 0,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || (isEn ? "Failed to convert lead" : "فشل تحويل العميل المحتمل إلى طالب"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-background/80 backdrop-blur-xs">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/80 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success/10 text-success dark:text-success border border-success/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {isEn ? "Convert Demo Lead to Official Student" : "تحويل العميل من الديمو إلى طالب رسمي ومجموعة"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {attendee.studentName} ({attendee.phone})
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Lead Summary Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/70 text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground block">{isEn ? "Student" : "اسم الطالب"}</span>
              <span className="font-semibold text-foreground">{attendee.studentName}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">{isEn ? "Phone" : "الهاتف"}</span>
              <span className="font-mono tabular-nums text-foreground">{attendee.phone}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">{isEn ? "Guardian" : "ولي الأمر"}</span>
              <span className="text-foreground">{attendee.guardianName || "-"}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">{isEn ? "Age / Grade" : "العمر / الصف"}</span>
              <span className="text-foreground">{attendee.age ? `${attendee.age} سنة` : attendee.grade || "-"}</span>
            </div>
          </div>

          {/* Section 1: Branch, Age & Level */}
          <div className="space-y-3 p-3.5 rounded-xl border border-border/70 bg-card/60">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground border-b border-border/50 pb-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span>{isEn ? "Educational Placement (Branch, Age, Level)" : "البيانات الأكاديمية (الفرع، الفئة العمرية، المستوى)"}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Branch */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  {isEn ? "Educational Branch" : "الفرع التعليمي"} *
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="">{isEn ? "-- Select Branch --" : "-- اختر الفرع --"}</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.city ? `(${b.city})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Age with Bracket Badge */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                  <span>{isEn ? "Age (Years)" : "عمر الطالب (سنوات)"} *</span>
                  {typeof age === "number" && (
                    <span className="text-[10px] font-normal text-primary">
                      {age < 7 ? "براعم (4-6)" : age < 10 ? "أشبال (7-9)" : age < 14 ? "يافعين (10-13)" : "شباب (14-18)"}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min="3"
                  max="25"
                  value={age}
                  onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                  placeholder="مثال: 9"
                  className="w-full bg-background border border-input rounded-xl px-2.5 py-1.5 text-xs font-mono tabular-nums focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              {/* Level Linked to Age */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  {isEn ? "Linked Level" : "المستوى الأكاديمي المناسب"} *
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none font-semibold text-primary"
                >
                  {currentLevels.map((lvl) => (
                    <option key={lvl.id} value={lvl.name}>
                      {lvl.name} ({lvl.code})
                    </option>
                  ))}
                  <option value="مستوى مخصص">{isEn ? "Custom Level" : "مستوى مخصص آخر"}</option>
                </select>
              </div>
            </div>

            {/* Study Group Selection */}
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>{isEn ? "Assign to Study Group" : "المجموعة الدراسية (تحديد اليوم والتوقيت)"}</span>
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full bg-background border border-input rounded-xl px-2.5 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="">{isEn ? "-- Select Study Group --" : "-- اختر المجموعة الدراسية --"}</option>
                {filteredGroups.map((g) => {
                  const slotsStr =
                    g.scheduleSlots && g.scheduleSlots.length > 0
                      ? g.scheduleSlots.map((s) => `${s.dayOfWeek} (${s.startTime}-${s.endTime})`).join(" | ")
                      : "";
                  return (
                    <option key={g.id} value={g.id}>
                      {g.name} {slotsStr ? `[${slotsStr}]` : ""} {g.maxStudents ? `(${g.studentCount || 0}/${g.maxStudents})` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Section 2: Package & Course Billing */}
          <div className="space-y-3 p-3.5 rounded-xl border border-border/70 bg-card/60">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground border-b border-border/50 pb-2">
              <DollarSign className="w-4 h-4 text-success" />
              <span>{isEn ? "Package & Course Pricing" : "الباقة الدراسية والرسوم المالية"}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Package */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-primary" />
                  {isEn ? "Session Package" : "باقة الحصص"}
                </label>
                <select
                  value={packageId}
                  onChange={(e) => handlePackageChange(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="">{isEn ? "-- No package (file only) --" : "-- بدون باقة حالياً (تسجيل ملف فقط) --"}</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.hoursCount} {isEn ? "hrs" : "ساعة"} - {pkg.price} {isEn ? "EGP" : "ج.م"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-primary" />
                  {isEn ? "Assigned Instructor" : "المدرب أو المعلم المسؤول"}
                </label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="">{isEn ? "-- Select Later --" : "-- تحديد المعلم لاحقاً --"}</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Base Price Override */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">{isEn ? "Base Price" : "السعر الأصلي (ج.م)"}</label>
                <input
                  type="number"
                  min="0"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value ? Number(e.target.value) : 0)}
                  className="w-full bg-background border border-input rounded-xl px-2.5 py-1.5 text-xs font-mono tabular-nums focus:ring-1 focus:ring-primary focus:outline-none font-bold"
                />
              </div>

              {/* Discount Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-primary" />
                  <span>{isEn ? "Discount Type" : "نوع الخصم"}</span>
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full bg-background border border-input rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  {DISCOUNT_TYPES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.labelAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Discount Value */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">
                  {discountType === "SIBLINGS" || discountType === "SEASONAL"
                    ? isEn
                      ? "Discount %"
                      : "نسبة الخصم (%)"
                    : isEn
                    ? "Discount (EGP)"
                    : "قيمة الخصم (ج.م)"}
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={discountType === "NONE"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value ? Number(e.target.value) : "")}
                  placeholder={discountType === "NONE" ? "-" : "0"}
                  className="w-full bg-background border border-input rounded-xl px-2.5 py-1.5 text-xs font-mono tabular-nums focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Financial Summary Pill */}
            {basePrice > 0 && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-success/10 border border-success/20 text-xs">
                <span className="text-muted-foreground">{isEn ? "Final Payable Amount:" : "المبلغ الإجمالي بعد الخصم:"}</span>
                <span className="font-bold text-success dark:text-success font-mono text-sm">
                  {financial.finalAmount.toLocaleString()} ج.م
                  {financial.discountAmount > 0 && (
                    <span className="text-[10px] text-muted-foreground font-normal me-2">
                      (خصم: {financial.discountAmount.toLocaleString()} ج.م)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Section 3: Cash vs 2 or 3 Installments */}
          <div className="space-y-3 p-3.5 rounded-xl border border-border/70 bg-card/60">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{isEn ? "Payment Plan & Installments" : "نظام الدفع (كاش أو أقساط 2 أو 3 مرات)"}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    paymentMethod === "CASH"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isEn ? "Cash (Full)" : "كاش بالكامل"}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("INSTALLMENTS")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    paymentMethod === "INSTALLMENTS"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isEn ? "Installments" : "أقساط مجدولة"}
                </button>
              </div>
            </div>

            {paymentMethod === "INSTALLMENTS" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{isEn ? "Number of Installments:" : "عدد الأقساط:"}</span>
                  <button
                    type="button"
                    onClick={() => setInstallmentCount(2)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                      installmentCount === 2
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {isEn ? "2 Installments" : "قسطين (2)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstallmentCount(3)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                      installmentCount === 3
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {isEn ? "3 Installments" : "3 أقساط"}
                  </button>
                </div>

                {/* Installments Table */}
                <div className="space-y-2">
                  {installments.map((inst, idx) => (
                    <div
                      key={inst.installmentNumber}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-background border border-border text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[11px]">
                          {inst.installmentNumber}
                        </span>
                        <span className="font-semibold text-foreground">
                          {isEn ? `Installment ${inst.installmentNumber}` : `القسط ${inst.installmentNumber}`}:
                        </span>
                        <span className="font-bold text-primary font-mono">{inst.amount.toLocaleString()} ج.م</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">{isEn ? "Due Date:" : "موعد الاستحقاق:"}</span>
                        <input
                          type="date"
                          value={inst.dueDate}
                          onChange={(e) => handleDueDateChange(idx, e.target.value)}
                          className="bg-card border border-input rounded-lg px-2 py-1 text-xs font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Amount Paid Now */}
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                    <span>{isEn ? "Initial Payment (Paid Now)" : "المبلغ المدفوع الآن مقدماً"}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {isEn ? "(Usually 1st installment)" : "(عادة القسط الأول)"}
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value ? Number(e.target.value) : "")}
                    placeholder="0.00"
                    className="w-full bg-background border border-input rounded-xl px-3 py-1.5 text-xs font-mono tabular-nums font-bold focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">{isEn ? "Amount Paid Now (Full Cash)" : "المبلغ المدفوع نقداً الآن"}</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value ? Number(e.target.value) : "")}
                  placeholder="0.00"
                  className="w-full bg-background border border-input rounded-xl px-3 py-1.5 text-xs font-mono tabular-nums font-bold focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Section 4: Auto Username & Password Credentials */}
          <div className="space-y-3 p-3.5 rounded-xl border border-border/70 bg-card/60">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <KeyRound className="w-4 h-4 text-warning" />
                <span>{isEn ? "Student Account Credentials" : "توليد اسم المستخدم وكلمة المرور للطالب"}</span>
              </div>
              <button
                type="button"
                onClick={handleGenerateNewCreds}
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
              >
                <Sparkles className="w-3 h-3" />
                <span>{isEn ? "Regenerate" : "إعادة توليد"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">{isEn ? "Username" : "اسم المستخدم (Username)"}</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-3 py-1.5 text-xs font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">{isEn ? "Password" : "كلمة المرور (Password)"}</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-3 py-1.5 text-xs font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCredentials}
                  onChange={(e) => setAutoCredentials(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span>{isEn ? "Create active student portal user" : "إنشاء وتفعيل حساب الطالب على المنصة فورياً"}</span>
              </label>

              <button
                type="button"
                onClick={handleCopyCredentials}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-border bg-background hover:bg-muted text-foreground transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (isEn ? "Copied!" : "تم النسخ!") : isEn ? "Copy Login Info" : "نسخ بيانات الدخول"}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 sm:p-5 border-t border-border/80 bg-muted/20">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-medium border border-border bg-background hover:bg-muted text-foreground transition-colors"
          >
            {isEn ? "Cancel" : "إلغاء"}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 active:scale-[0.97] text-primary-foreground transition-all shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            {isEn ? "Confirm Conversion & Enrollment" : "تأكيد التحويل والتسجيل بالفرع والمجموعة"}
          </button>
        </div>
      </div>
    </div>
  );
}

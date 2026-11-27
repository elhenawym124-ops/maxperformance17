import React, { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, PhoneCall } from "lucide-react";
import { useStorefrontSettings } from "../../hooks/useStorefrontSettings";
import { buildStorefrontPath } from "../../utils/paths";
import "../../styles/academy-stage.css";

interface TrackChoice {
  id: string;
  label: string;
  ageRange: string;
  summary: string;
}

const TRACK_CHOICES: TrackChoice[] = [
  {
    id: "juniors",
    label: "التأسيس المنطقي و Scratch",
    ageRange: "6–9",
    summary: "بداية تفاعلية لبناء الألعاب والقصص وفهم المنطق من الحصة الأولى.",
  },
  {
    id: "makers",
    label: "تطبيقات الموبايل و Micro:bit",
    ageRange: "10–13",
    summary: "تطوير تطبيقات أندرويد وربط الكود بالحساسات المادية ومشاريع AI.",
  },
  {
    id: "builders",
    label: "التطبيقات والذكاء الاصطناعي",
    ageRange: "10–13",
    summary: "رؤية حاسوبية، أتمتة ذكية، ومشاريع ويب عملية متدرجة.",
  },
  {
    id: "ai-web",
    label: "الذكاء الاصطناعي وتطوير الويب",
    ageRange: "11–14",
    summary: "بناء مواقع حقيقية ونماذج رؤية حاسوبية بالعمل الجماعي.",
  },
  {
    id: "founders",
    label: "Python Pro و Demo Day",
    ageRange: "14–17",
    summary: "تطوير تطبيقات بايثون احترافية وتجهيز عرض مشروع تخرج حقيقي.",
  },
];

const DEFAULT_BRANCH_OPTIONS = [
  "أونلاين — فصل تفاعلي مباشر (Zoom)",
  "حضوري — مقر الأكاديمية الرئيسي",
];

const normalizeWaDigits = (raw?: string): string => {
  const digits = String(raw || "").replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("01") && digits.length === 11) return `20${digits.slice(1)}`;
  if (digits.startsWith("20")) return digits;
  return digits;
};

export interface GlazierTrialBookingProps {
  section?: {
    variant?: string;
    [key: string]: unknown;
  };
  settings?: {
    title?: string;
    subtitle?: string;
    description?: string;
    formSlug?: string;
    whatsappPhone?: string;
    branches?: Array<string | { name?: string }>;
    [key: string]: unknown;
  };
}

/**
 * Architectural Glazier Free Evaluation Booking screen replacing legacy membership form on /registration.
 * Reads ?track= query parameter, submits leads cleanly to public form API with direct WhatsApp fallback.
 */
export const GlazierTrialBookingSection: React.FC<GlazierTrialBookingProps> = ({
  settings,
}) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { settings: storefrontSettings } = useStorefrontSettings();

  const urlTrack = (searchParams.get("track") || "").trim().toLowerCase();
  const matchedTrack =
    TRACK_CHOICES.find((item) => item.id === urlTrack) || TRACK_CHOICES[1];

  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentAge, setStudentAge] = useState(matchedTrack.ageRange);
  const [selectedTrack, setSelectedTrack] = useState(matchedTrack.id);
  const [preferredBranch, setPreferredBranch] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedReceipt, setSubmittedReceipt] = useState<{
    mode: "api" | "whatsapp";
    referenceId?: string;
  } | null>(null);

  const branchOptions = React.useMemo(() => {
    const rawList = Array.isArray(settings?.branches) ? settings.branches : [];
    const parsed = rawList
      .map((entry) =>
        typeof entry === "string"
          ? entry.trim()
          : typeof entry?.name === "string"
            ? entry.name.trim()
            : "",
      )
      .filter(Boolean);
    return parsed.length > 0 ? parsed : DEFAULT_BRANCH_OPTIONS;
  }, [settings?.branches]);

  useEffect(() => {
    if (!preferredBranch && branchOptions.length > 0) {
      setPreferredBranch(branchOptions[0]);
    }
  }, [branchOptions, preferredBranch]);

  useEffect(() => {
    const nextMatch = TRACK_CHOICES.find((item) => item.id === urlTrack);
    if (nextMatch) {
      setSelectedTrack(nextMatch.id);
      setStudentAge(nextMatch.ageRange);
    }
  }, [urlTrack]);

  const resolvedTrackObj =
    TRACK_CHOICES.find((item) => item.id === selectedTrack) || TRACK_CHOICES[1];

  const resolvedWaPhone = normalizeWaDigits(
    settings?.whatsappPhone ||
      (storefrontSettings?.storefront?.settings?.["whatsappPhone"] as string) ||
      storefrontSettings?.company?.phone,
  );

  const whatsappConfirmUrl = React.useMemo(() => {
    if (!resolvedWaPhone) return "";
    const text = [
      `حجز حصة تقييم مجانية — ${storefrontSettings?.company?.name || "الأكاديمية"}`,
      `ولي الأمر: ${parentName || "-"}`,
      `رقم التواصل: ${phone || "-"}`,
      `اسم الطالب: ${studentName || "-"}`,
      `الفئة العمرية: ${studentAge} سنوات`,
      `المسار: ${resolvedTrackObj.label}`,
      `نظام الحضور: ${preferredBranch || branchOptions[0]}`,
    ].join("\n");
    return `https://wa.me/${resolvedWaPhone}?text=${encodeURIComponent(text)}`;
  }, [
    branchOptions,
    parentName,
    phone,
    preferredBranch,
    resolvedTrackObj.label,
    resolvedWaPhone,
    storefrontSettings?.company?.name,
    studentAge,
    studentName,
  ]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!parentName.trim() || !phone.trim() || !studentName.trim()) {
      setFormError("يرجى إدخال اسم ولي الأمر، رقم الواتساب، واسم الطالب للمتابعة.");
      return;
    }

    const cleanPhone = phone.replace(/[^\d+]/g, "");
    if (cleanPhone.length < 10) {
      setFormError("يرجى إدخال رقم واتساب صحيح (مثال: 010xxxxxxxx).");
      return;
    }

    setSubmitting(true);
    const formSlug =
      typeof settings?.formSlug === "string" && settings.formSlug.trim()
        ? settings.formSlug.trim()
        : "free-evaluation";

    try {
      const response = await fetch(`/api/v1/public/forms/${encodeURIComponent(formSlug)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            parentName: parentName.trim(),
            name: parentName.trim(),
            phone: cleanPhone,
            studentName: studentName.trim(),
            studentAge,
            track: resolvedTrackObj.label,
            trackId: resolvedTrackObj.id,
            branch: preferredBranch || branchOptions[0],
          },
        }),
      });

      const payload = await response.json().catch(() => null);
      if (response.ok && payload?.success) {
        setSubmittedReceipt({
          mode: "api",
          referenceId: payload?.data?.id,
        });
        return;
      }

      if (response.status === 400 && payload?.error) {
        setFormError(payload.error);
        return;
      }

      setSubmittedReceipt({ mode: "whatsapp" });
    } catch {
      setSubmittedReceipt({ mode: "whatsapp" });
    } finally {
      setSubmitting(false);
    }
  };

  const title =
    typeof settings?.title === "string" && settings.title.trim()
      ? settings.title.trim()
      : "احجز حصة التقييم المجانية";
  const subtitle =
    typeof settings?.subtitle === "string" && settings.subtitle.trim()
      ? settings.subtitle.trim()
      : typeof settings?.description === "string" && settings.description.trim()
        ? settings.description.trim()
        : "جلسة عملية مدتها 45 دقيقة لتقييم مستوى الطالب وتحديد أنسب مجموعة من بين 15 مستوى.";

  return (
    <section
      aria-label={title}
      className="glazier-scope glazier-b w-full"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto glazier-xl-x">
        {/* Header Bay */}
        <div className="glazier-b glazier-seeded p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-8 space-y-3">
              <h1 className="glazier-heading text-2xl sm:text-3xl lg:text-4xl font-bold leading-snug">
                {title}
              </h1>
              <p className="glazier-muted text-sm sm:text-base leading-relaxed max-w-2xl">
                {subtitle}
              </p>
            </div>
            <div className="lg:col-span-4 flex lg:justify-end">
              <Link
                to={buildStorefrontPath(location.pathname, "/collections", location.search)}
                className="glazier-clear glazier-frame inline-flex min-h-[46px] items-center gap-2 px-5 py-2.5 text-sm font-bold"
              >
                <span>مراجعة الـ 15 مستوى أولاً</span>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* 2-Bay Booking Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Right Protocol Bay */}
          <div className="lg:col-span-5 glazier-b lg:border-b-0 glazier-lg-e glazier-chamber p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-8">
            <div className="space-y-6">
              <div>
                <div className="text-xs font-mono font-bold tracking-wide opacity-70 mb-2">
                  <bdi dir="ltr">45 MIN · LIVE DIAGNOSTIC</bdi>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold leading-snug">
                  ماذا يحدث داخل حصة التقييم المجانية؟
                </h2>
              </div>

              <div className="space-y-4">
                {[
                  {
                    step: "01",
                    head: "قياس المنطق وطريقة التفكير",
                    body: "أسئلة تفاعلية تناسب عمر الطالب بدون ضغط امتحانات تقليدية.",
                  },
                  {
                    step: "02",
                    head: "تجربة كود عملية مباشرة",
                    body: "ينفّذ الطالب خطوة حقيقية في Scratch أو Python حسب مستواه الحالي.",
                  },
                  {
                    step: "03",
                    head: "تقرير واضح لولي الأمر",
                    body: "نحدد المستوى الدقيق من بين 15 مستوى ونعرض أنسب موعد حضوري أو أونلاين.",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="glazier-frame p-4 bg-white/5 border-white/25"
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-mono tabular-nums text-xs font-bold opacity-75 pt-0.5">
                        <bdi dir="ltr">{item.step}</bdi>
                      </span>
                      <div className="space-y-1">
                        <div className="text-sm font-bold">{item.head}</div>
                        <p className="text-xs leading-relaxed opacity-80">{item.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glazier-pane-cobalt glazier-frame p-5 space-y-1.5">
              <div className="text-xs font-mono tabular-nums opacity-85">
                المسار المحدد: <bdi dir="ltr">{resolvedTrackObj.ageRange} YRS</bdi>
              </div>
              <div className="text-base font-bold">{resolvedTrackObj.label}</div>
              <p className="text-xs leading-relaxed opacity-90">{resolvedTrackObj.summary}</p>
            </div>
          </div>

          {/* Left Booking Form Bay */}
          <div className="lg:col-span-7 glazier-clear p-6 sm:p-8 lg:p-10">
            {submittedReceipt ? (
              <div
                data-testid="glazier-booking-success"
                className="glazier-frame glazier-seeded p-6 sm:p-8 space-y-6"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-7 w-7 shrink-0 text-primary" aria-hidden="true" />
                  <div className="space-y-2">
                    <h2 className="glazier-heading text-xl sm:text-2xl font-bold">
                      {submittedReceipt.mode === "api"
                        ? "تم استلام طلب حجز التقييم بنجاح"
                        : "بيانات الحجز جاهزة — أكمل التأكيد عبر واتساب"}
                    </h2>
                    <p className="glazier-muted text-sm leading-relaxed">
                      {submittedReceipt.mode === "api"
                        ? `شكراً أستاذ/ة ${parentName}. سيتواصل فريق الأكاديمية معك لتأكيد موعد جلسة الطالب (${studentName}) في ${preferredBranch}.`
                        : `جهّزنا ملخص بيانات الطالب (${studentName}) في ${preferredBranch} لإرسالها مباشرة لفريق المواعيد.`}
                    </p>
                    {submittedReceipt.referenceId ? (
                      <div className="text-xs font-mono tabular-nums glazier-muted">
                        رقم الطلب: <bdi dir="ltr">{submittedReceipt.referenceId.slice(0, 12)}</bdi>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {whatsappConfirmUrl ? (
                    <a
                      href={whatsappConfirmUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glazier-pane-emerald glazier-frame inline-flex min-h-[48px] items-center gap-2 px-5 py-3 text-sm font-bold"
                    >
                      <PhoneCall className="h-4 w-4" aria-hidden="true" />
                      <span>تأكيد الموعد مباشرة عبر واتساب</span>
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setSubmittedReceipt(null)}
                    className="glazier-clear glazier-frame inline-flex min-h-[48px] items-center px-5 py-3 text-sm font-bold"
                  >
                    تسجيل طالب آخر
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label
                      htmlFor="glazier-parent-name"
                      className="block text-xs font-bold glazier-heading"
                    >
                      اسم ولي الأمر
                    </label>
                    <input
                      id="glazier-parent-name"
                      name="parentName"
                      type="text"
                      required
                      placeholder="مثال: م. أحمد محمود"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="glazier-frame w-full min-h-[48px] px-4 text-sm font-medium bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="glazier-parent-phone"
                      className="block text-xs font-bold glazier-heading"
                    >
                      رقم الواتساب للتواصل
                    </label>
                    <input
                      id="glazier-parent-phone"
                      name="phone"
                      type="tel"
                      dir="ltr"
                      required
                      placeholder="010xxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="glazier-frame w-full min-h-[48px] px-4 text-sm font-mono tabular-nums bg-white text-start focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label
                      htmlFor="glazier-student-name"
                      className="block text-xs font-bold glazier-heading"
                    >
                      اسم الطالب
                    </label>
                    <input
                      id="glazier-student-name"
                      name="studentName"
                      type="text"
                      required
                      placeholder="الاسم الأول والثاني"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="glazier-frame w-full min-h-[48px] px-4 text-sm font-medium bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="glazier-track-select"
                      className="block text-xs font-bold glazier-heading"
                    >
                      المسار المهتم به
                    </label>
                    <select
                      id="glazier-track-select"
                      name="track"
                      value={selectedTrack}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedTrack(val);
                        const match = TRACK_CHOICES.find((c) => c.id === val);
                        if (match) setStudentAge(match.ageRange);
                      }}
                      className="glazier-frame w-full min-h-[48px] px-4 text-sm font-medium bg-white focus:outline-none"
                    >
                      {TRACK_CHOICES.map((choice) => (
                        <option key={choice.id} value={choice.id}>
                          {choice.label} ({choice.ageRange} سنوات)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-xs font-bold glazier-heading">
                    الفئة العمرية للطالب
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { age: "6–9", label: "تأسيس مبكر", trackId: "juniors" },
                      { age: "10–13", label: "صنّاع التطبيقات", trackId: "builders" },
                      { age: "14–17", label: "مسار بايثون والريادة", trackId: "founders" },
                    ].map((opt) => {
                      const active = studentAge === opt.age;
                      return (
                        <button
                          key={opt.age}
                          type="button"
                          onClick={() => {
                            setStudentAge(opt.age);
                            setSelectedTrack(opt.trackId);
                          }}
                          className={`glazier-frame min-h-[54px] p-2.5 text-center transition-colors ${
                            active ? "glazier-pane-cobalt" : "glazier-seeded"
                          }`}
                        >
                          <div className="font-mono tabular-nums text-sm font-bold">
                            <bdi dir="ltr">{opt.age}</bdi>
                          </div>
                          <div className="text-[11px] opacity-85">{opt.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="glazier-branch-select"
                    className="block text-xs font-bold glazier-heading"
                  >
                    الفرع أو نظام الحضور المفضل
                  </label>
                  <select
                    id="glazier-branch-select"
                    name="preferredBranch"
                    value={preferredBranch}
                    onChange={(e) => setPreferredBranch(e.target.value)}
                    className="glazier-frame w-full min-h-[48px] px-4 text-sm font-medium bg-white focus:outline-none"
                  >
                    {branchOptions.map((branchName) => (
                      <option key={branchName} value={branchName}>
                        {branchName}
                      </option>
                    ))}
                  </select>
                </div>

                {formError ? (
                  <div
                    role="alert"
                    className="glazier-frame glazier-pane-berry px-4 py-3 text-xs sm:text-sm font-bold"
                  >
                    {formError}
                  </div>
                ) : null}

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="glazier-pane-cobalt glazier-frame flex-1 min-h-[52px] px-6 py-3 text-sm sm:text-base font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <span>{submitting ? "جارٍ تسجيل الطلب..." : "تأكيد حجز التقييم المجاني"}</span>
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  {whatsappConfirmUrl ? (
                    <a
                      href={whatsappConfirmUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glazier-clear glazier-frame min-h-[52px] px-5 py-3 text-sm font-bold inline-flex items-center justify-center gap-2"
                    >
                      <PhoneCall className="h-4 w-4" aria-hidden="true" />
                      <span>أو راسلنا واتساب</span>
                    </a>
                  ) : null}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

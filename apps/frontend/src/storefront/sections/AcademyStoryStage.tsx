import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/academy-stage.css";

export interface StoryMilestone {
  index?: string;
  badge?: string;
  title: string;
  subtitle?: string;
  highlights?: string[];
  codeSnippet?: string;
  metric?: string;
  metricLabel?: string;
}

export interface StoryMetric {
  value: string;
  label: string;
}

export interface AcademyStoryStageProps {
  section?: { variant?: string; [key: string]: unknown };
  settings?: {
    manifestoText?: string;
    manifestoHighlights?: string[];
    journeyTitle?: string;
    milestones?: StoryMilestone[];
    bentoTitle?: string;
    bentoDescription?: string;
    metrics?: StoryMetric[];
    ctaText?: string;
    ctaLink?: string;
    [key: string]: unknown;
  };
}

const DEFAULT_MANIFESTO =
  "نحن لا نعلّم الأطفال حفظ الأوامر — بل نبني عقلية مهندس ورائد أعمال يصمم لعبته أو نموذج الذكاء الاصطناعي ويعرض مشروعه في Demo Day بثقة.";

const DEFAULT_HIGHLIGHTS = ["مهندس ورائد أعمال", "الذكاء الاصطناعي", "Demo Day"];

const PANE_CLASSES = [
  "glazier-pane-emerald",
  "glazier-pane-cyan",
  "glazier-pane-berry",
  "glazier-pane-cobalt",
];

const DEFAULT_MILESTONES: StoryMilestone[] = [
  {
    index: "1–4",
    badge: "Code.org · Scratch",
    title: "أساسيات التفكير المنطقي وبناء الألعاب",
    subtitle:
      "يحول الطالب أفكاره إلى قصص وألعاب تفاعلية ويفهم الحلقات والشروط والمتغيرات دون تعقيد.",
    highlights: ["تفكير خوارزمي", "تصميم الشخصيات", "منطق الألعاب"],
    codeSnippet: "onGameTick(() => checkScoreAndAdvanceLevel());",
    metric: "LVL 01–04",
    metricLabel: "مناسبة لعمر 6–9 سنوات",
  },
  {
    index: "5–8",
    badge: "App Inventor · Micro:bit",
    title: "تطبيقات الهاتف والتحكم في الهاردوير",
    subtitle:
      "يبرمج تطبيق أندرويد حقيقي ويربط الكود بلوحات Micro:bit والحساسات المادية.",
    highlights: ["تطبيقات موبايل", "شرائح Micro:bit", "إلكترونيات عملية"],
    codeSnippet: "microbit.onSensorTrigger((lux) => toggleRelay(lux));",
    metric: "LVL 05–08",
    metricLabel: "مناسبة لعمر 9–12 سنة",
  },
  {
    index: "9–11",
    badge: "PictoBlox AI · Web & JS",
    title: "الذكاء الاصطناعي وتطوير صفحات الويب",
    subtitle:
      "يدرّب نماذج رؤية حاسوبية ويبني مواقع تفاعلية حديثة بلغة JavaScript.",
    highlights: ["نماذج Vision AI", "واجهات Web & JS", "تحليل البيانات"],
    codeSnippet: "const result = await visionModel.classifyFrame(cam);",
    metric: "LVL 09–11",
    metricLabel: "مناسبة لعمر 12–15 سنة",
  },
  {
    index: "12–15",
    badge: "Python Pro · Demo Day",
    title: "إتقان Python وتأسيس شركة ناشئة",
    subtitle:
      "يكتب كود Python احترافي ويصيغ نموذج منتج حقيقي ويعرض مشروع التخرج أمام لجنة التحكيم.",
    highlights: ["برمجة Python Pro", "بناء نموذج عمل", "عرض Demo Day"],
    codeSnippet: "startup.pitch_demo_day(mvp=python_app, team=cohort);",
    metric: "LVL 12–15",
    metricLabel: "مناسبة لعمر 14–17 سنة",
  },
];

const DEFAULT_METRICS: StoryMetric[] = [
  { value: "15", label: "مستوى عملي متدرج من التأسيس للاحتراف" },
  { value: "8–10", label: "الحد الأقصى للطلاب داخل المجموعة الواحدة" },
  { value: "6–17", label: "فئة عمرية مقسمة حسب العمر والمستوى" },
];

const HARDWARE_PLATE =
  "/assets/themes/academy-stage-3d/arduino-uno.jpg";

/**
 * Illuminated Glazier Partition Curriculum Wall:
 * Four structural colorfield bays span flush between steel mullions; hovering or selecting
 * a bay backlights its pigment and renders its hardware/code deliverable below.
 */
const AcademyStoryStage: React.FC<AcademyStoryStageProps> = ({ settings }) => {
  const manifestoText = settings?.manifestoText || DEFAULT_MANIFESTO;
  const highlights =
    Array.isArray(settings?.manifestoHighlights) &&
    settings.manifestoHighlights.length > 0
      ? settings.manifestoHighlights
      : DEFAULT_HIGHLIGHTS;
  const milestones =
    Array.isArray(settings?.milestones) && settings.milestones.length > 0
      ? settings.milestones.slice(0, 4)
      : DEFAULT_MILESTONES;
  const metrics =
    Array.isArray(settings?.metrics) && settings.metrics.length > 0
      ? settings.metrics.slice(0, 3)
      : DEFAULT_METRICS;

  const [activeIdx, setActiveIdx] = useState(0);
  const activeStage = milestones[activeIdx] || milestones[0];

  const renderManifesto = (text: string) => {
    const pattern = new RegExp(
      `(${highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
      "g",
    );
    return text.split(pattern).map((part, idx) =>
      highlights.includes(part) ? (
        <span key={idx} className="text-primary font-extrabold">
          {part}
        </span>
      ) : (
        <span key={idx}>{part}</span>
      ),
    );
  };

  return (
    <section
      aria-label={settings?.journeyTitle || "خريطة المناهج والأقسام"}
      className="glazier-scope glazier-b w-full"
    >
      <div className="max-w-7xl mx-auto glazier-xl-x">
        {/* Act I — Manifesto Bay */}
        <div className="glazier-b glazier-seeded p-6 sm:p-10 lg:px-12 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <h2 className="glazier-heading lg:col-span-9 text-2xl sm:text-3xl lg:text-[2.15rem] font-bold leading-[1.45]">
              {renderManifesto(manifestoText)}
            </h2>
            <div className="lg:col-span-3 flex lg:justify-end">
              <span className="font-mono tabular-nums text-xs sm:text-sm font-bold glazier-muted">
                CODE · STARTUP · PITCH
              </span>
            </div>
          </div>
        </div>

        {/* Act II — 4-Column Stained Glass Partition Matrix */}
        <div className="glazier-b glazier-clear px-6 py-5 sm:px-10">
          <h3 className="glazier-heading text-xl sm:text-2xl font-bold">
            {settings?.journeyTitle || "كيف يتدرج الطالب عبر 15 مستوى عملي"}
          </h3>
        </div>

        <div className="glazier-b grid grid-cols-1 md:grid-cols-4">
          {milestones.map((item, idx) => {
            const active = idx === activeIdx;
            const litClass = PANE_CLASSES[idx % PANE_CLASSES.length];
            return (
              <button
                key={item.title + idx}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`p-6 sm:p-7 text-start flex flex-col justify-between gap-6 min-h-[210px] ${
                  idx < milestones.length - 1
                    ? "glazier-b md:border-b-0 glazier-md-e"
                    : ""
                } ${active ? litClass : "glazier-clear"}`}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <span className="font-mono tabular-nums text-sm font-bold">
                    {item.metric || `LVL ${item.index || idx + 1}`}
                  </span>
                  {item.badge ? (
                    <span className="font-mono text-xs font-semibold opacity-85">
                      {item.badge}
                    </span>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <h4 className="glazier-heading text-lg font-bold leading-snug">
                    {item.title}
                  </h4>
                  {item.metricLabel ? (
                    <p className="text-xs font-medium opacity-85">
                      {item.metricLabel}
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        {/* Synchronized Stage Specification Plinth */}
        <div className="glazier-b glazier-seeded grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-4">
            <p className="text-base sm:text-lg font-medium leading-relaxed">
              {activeStage.subtitle}
            </p>
            {Array.isArray(activeStage.highlights) &&
            activeStage.highlights.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeStage.highlights.map((hl) => (
                  <span
                    key={hl}
                    className="glazier-frame glazier-clear px-3.5 py-2 text-xs font-semibold"
                  >
                    {hl}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-5 glazier-t glazier-lg-t-0 glazier-lg-s glazier-chamber p-6 sm:p-8 flex flex-col justify-between gap-3">
            <span className="text-xs font-semibold opacity-80">
              مخرجات المرحلة العملية
            </span>
            <code
              dir="ltr"
              className="font-mono text-xs sm:text-sm leading-relaxed text-emerald-300 break-words"
            >
              {activeStage.codeSnippet || "student.build(realProject);"}
            </code>
            <span className="text-xs opacity-75">
              {activeStage.metricLabel || "مشروع تطبيقي بنهاية المرحلة"}
            </span>
          </div>
        </div>

        {/* Act III — Demo Day Proof & Verified Hardware Workshop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-5 glazier-clear h-[260px] lg:h-[360px] overflow-hidden flex items-center justify-center p-5">
            <img
              src={HARDWARE_PLATE}
              width={600}
              height={600}
              alt="لوحة Arduino Uno R3 الهندسية لتطبيقات الهاردوير والمستشعرات"
              className="h-full w-full object-contain mix-blend-multiply"
            />
          </div>

          <div className="lg:col-span-7 glazier-t glazier-lg-t-0 glazier-lg-s flex flex-col justify-between">
            <div className="glazier-seeded p-6 sm:p-8 lg:p-10 space-y-4">
              <h3 className="glazier-heading text-2xl sm:text-3xl font-bold leading-snug">
                {settings?.bentoTitle ||
                  "لا ينتهي المسار باختبار نظري — بل بعرض مشروع حقيقي في Demo Day"}
              </h3>
              <p className="glazier-muted text-sm sm:text-base leading-relaxed max-w-2xl">
                {settings?.bentoDescription ||
                  "كل طالب يبني مشروعاً عملياً ويقدم عرض Pitch متكامل يجمع البرمجة والذكاء الاصطناعي وريادة الأعمال."}
              </p>
            </div>

            <div className="glazier-t grid grid-cols-3">
              {metrics.map((m, idx) => (
                <div
                  key={m.label + idx}
                  className={`glazier-clear p-4 sm:p-6 flex flex-col items-start justify-between gap-1 text-start ${
                    idx < metrics.length - 1 ? "glazier-e" : ""
                  }`}
                >
                  <div className="glazier-heading font-mono tabular-nums text-2xl sm:text-3xl font-bold">
                    <bdi dir="ltr">{m.value}</bdi>
                  </div>
                  <div className="glazier-muted text-xs leading-snug">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="glazier-t flex">
              <Link
                to={settings?.ctaLink || "/registration"}
                className="glazier-pane-cobalt w-full min-h-[56px] px-6 py-4 flex items-center justify-between text-sm sm:text-base font-bold"
              >
                <span>{settings?.ctaText || "احجز حصة التقييم المجانية"}</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  aria-hidden="true"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AcademyStoryStage;

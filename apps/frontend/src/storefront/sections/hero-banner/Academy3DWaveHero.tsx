import React, { useState } from "react";
import { Link } from "react-router-dom";
import type { HeroVariantProps } from "./heroTypes";
import { isExternalHref, renderHeroAction } from "./heroActions";
import { useStorefrontTheme } from "../../engine/ThemeProvider";
import "../../styles/academy-stage.css";

interface AgeTrackPane {
  id: string;
  ageLabel: string;
  stageTitle: string;
  levelsLabel: string;
  toolsLine: string;
  outcome: string;
}

const DEFAULT_AGE_TRACKS: AgeTrackPane[] = [
  {
    id: "juniors",
    ageLabel: "6–9 سنوات",
    stageTitle: "التأسيس والمنطق",
    levelsLabel: "LVL 01–05",
    toolsLine: "Code.org · Scratch · Creative Logic",
    outcome:
      "يصمم الطالب لعبته وقصته التفاعلية الأولى ويفهم التفكير الخوارزمي عملياً من أول شهر.",
  },
  {
    id: "builders",
    ageLabel: "10–13 سنة",
    stageTitle: "التطبيقات والذكاء الاصطناعي",
    levelsLabel: "LVL 06–11",
    toolsLine: "MIT App Inventor · Micro:bit · PictoBlox AI",
    outcome:
      "يربط البرمجة بالحساسات المادية ويبرمج تطبيق موبايل ونموذج رؤية حاسوبية بالذكاء الاصطناعي.",
  },
  {
    id: "founders",
    ageLabel: "14–17 سنة",
    stageTitle: "الويب و Python والريادة",
    levelsLabel: "LVL 12–15",
    toolsLine: "Web & JS · Python Pro · Demo Day Pitch",
    outcome:
      "يبني تطبيق Python Pro كامل ويصمم فكرة شركته الناشئة ويعرضها بثقة في Demo Day.",
  },
];

const GENERIC_AGE_TRACKS: AgeTrackPane[] = [
  {
    id: "juniors",
    ageLabel: "المرحلة التأسيسية",
    stageTitle: "بناء الأساسيات والمهارات الأولى",
    levelsLabel: "STAGE 01",
    toolsLine: "مجموعات صغيرة · تفاعل مباشر · متابعة فردية",
    outcome: "يفهم الطالب المفاهيم الأساسية عبر أنشطة وتطبيقات عملية منذ الأسبوع الأول.",
  },
  {
    id: "builders",
    ageLabel: "المرحلة المتوسطة",
    stageTitle: "التطبيق العملي وبناء المشاريع",
    levelsLabel: "STAGE 02",
    toolsLine: "تمارين تطبيقية · تقييم مرحلي · تقارير دورية",
    outcome: "ينفّذ الطالب تدريبات ومشروعات متدرجة ترسّخ المهارة وتقيس تقدمه بدقة.",
  },
  {
    id: "founders",
    ageLabel: "المرحلة المتقدمة",
    stageTitle: "الإتقان والاستعداد للاختبارات والشهادات",
    levelsLabel: "STAGE 03",
    toolsLine: "اختبارات محاكاة · مشروع تخرج · شهادة إتمام",
    outcome: "يتقن الطالب المسار بالكامل مع تقييم ختامي وتقرير شامل لولي الأمر أو المتدرب.",
  },
];

const DEFAULT_HERO_HARDWARE_PHOTO =
  "/assets/themes/academy-stage-3d/microbit-kit.jpg";

/**
 * Architectural Glazier Colorfield Grid hero:
 * Steel glazing mullions partition calm frosted display copy, an active age-track selector,
 * verified hardware studio photography, and backlit promotional color panes.
 */
export const Academy3DWaveHero: React.FC<HeroVariantProps> = ({
  title,
  titleHighlight,
  subtitle,
  ctaText,
  primaryHref,
  secondaryCtaText,
  secondaryHref,
  panel,
  brandName,
}) => {
  const { theme } = useStorefrontTheme();
  const isGenericEdu = theme?.id === "edu-academy-pro";
  const trackList = isGenericEdu ? GENERIC_AGE_TRACKS : DEFAULT_AGE_TRACKS;
  const [selectedTrackId, setSelectedTrackId] = useState<string>(
    trackList[1].id,
  );

  const activeTrack =
    trackList.find((t) => t.id === selectedTrackId) ||
    trackList[1];

  const heroPhoto = panel?.image || DEFAULT_HERO_HARDWARE_PHOTO;
  const resolvedPrimaryLabel = ctaText || "احجز جلسة التقييم المجانية";
  const resolvedSecondaryLabel =
    secondaryCtaText || (isGenericEdu ? "تصفح البرامج المتاحة" : "جرّب المعمل التفاعلي");
  const bookingUrl = primaryHref.includes("?")
    ? `${primaryHref}&track=${activeTrack.id}`
    : `${primaryHref}?track=${activeTrack.id}`;

  return (
    <section
      aria-label={brandName || "المقدمة الرئيسية"}
      className="glazier-scope glazier-b w-full"
    >
      <div className="max-w-7xl mx-auto glazier-xl-x">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Primary Reading Bay */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div className="glazier-seeded p-6 sm:p-10 lg:p-11 min-h-[296px] sm:min-h-[320px] flex-1 flex flex-col justify-center">
              <h1 className="glazier-heading font-bold leading-[1.38] lg:leading-[1.28] text-3xl sm:text-4xl lg:text-[2.75rem] max-w-2xl">
                {title}
                {titleHighlight ? (
                  <>
                    {" "}
                    <span className="text-primary">{titleHighlight}</span>
                  </>
                ) : null}
              </h1>

              {subtitle ? (
                <p className="glazier-muted mt-5 text-base sm:text-lg leading-relaxed max-w-2xl">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {/* Interactive Age Partition Row */}
            <div
              role="tablist"
              aria-label="اختيار المرحلة العمرية"
              className="glazier-t grid grid-cols-3"
            >
              {trackList.map((track, idx) => {
                const isSelected = track.id === activeTrack.id;
                return (
                  <button
                    key={track.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedTrackId(track.id)}
                    className={`min-h-[72px] p-3 sm:p-4 flex flex-col items-start justify-between gap-1 text-start ${
                      idx < trackList.length - 1 ? "glazier-e" : ""
                    } ${isSelected ? "glazier-pane-cobalt" : "glazier-clear"}`}
                  >
                    <span className="font-mono tabular-nums text-xs font-semibold opacity-80">
                      <bdi dir="ltr">{track.levelsLabel}</bdi>
                    </span>
                    <span className="glazier-heading text-xs sm:text-sm font-bold leading-snug">
                      <bdi>{track.ageLabel}</bdi>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Track Deliverable Specification Strip */}
            <div className="glazier-t glazier-clear px-5 py-4 sm:px-6 min-h-[86px] flex flex-col justify-center gap-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="glazier-heading text-sm font-bold">
                  {activeTrack.stageTitle}
                </span>
                <span className="font-mono tabular-nums text-xs font-semibold text-primary">
                  <bdi dir="ltr">{activeTrack.toolsLine}</bdi>
                </span>
              </div>
              <p className="glazier-muted text-xs sm:text-sm leading-relaxed">
                {activeTrack.outcome}
              </p>
            </div>

            {/* Backlit Action Panes */}
            <div className="glazier-t grid grid-cols-1 sm:grid-cols-12">
              <div className="sm:col-span-8 flex">
                {isExternalHref(bookingUrl) ? (
                  <a
                    href={bookingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="glazier-pane-berry w-full min-h-[58px] px-6 py-4 flex items-center justify-between text-sm sm:text-base font-bold"
                  >
                    <span>{resolvedPrimaryLabel}</span>
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
                  </a>
                ) : (
                  <Link
                    to={bookingUrl}
                    className="glazier-pane-berry w-full min-h-[58px] px-6 py-4 flex items-center justify-between text-sm sm:text-base font-bold"
                  >
                    <span>{resolvedPrimaryLabel}</span>
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
                )}
              </div>

              <div className="sm:col-span-4 glazier-t sm:border-t-0 glazier-md-s flex">
                {renderHeroAction(
                  secondaryHref || "#academy-lab",
                  resolvedSecondaryLabel,
                  "glazier-clear w-full min-h-[58px] px-5 py-4 flex items-center justify-center text-sm font-semibold text-center",
                )}
              </div>
            </div>
          </div>

          {/* Architectural Stained-Glass Mullion Pier aligned flush with row mullions */}
          <div
            aria-hidden="true"
            className="hidden lg:flex lg:col-span-1 glazier-lg-s flex-col"
          >
            <div className="glazier-pane-cobalt flex-1 glazier-b" />
            <div className="glazier-pane-amber h-[88px] shrink-0 glazier-b" />
            <div className="glazier-pane-berry h-[58px] shrink-0" />
          </div>

          {/* Hardware Window & Backlit Telemetry Column */}
          <div className="lg:col-span-5 glazier-t glazier-lg-t-0 glazier-lg-s flex flex-col">
            <div className="glazier-photo-glass relative h-[260px] sm:h-[300px] lg:flex-1 lg:min-h-[340px] overflow-hidden">
              <img
                src={heroPhoto}
                width={1280}
                height={1076}
                alt={
                  panel?.title ||
                  "وحدة Micro:bit وأدوات التدريب العملي على البرمجة والروبوتات"
                }
                className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-[1.03]"
              />
            </div>

            <div className="glazier-t glazier-clear px-5 py-3 flex items-center justify-between gap-3">
              <span className="text-xs font-medium glazier-muted">
                {panel?.subtitle || "تدريب عملي بأطقم الهاردوير والكود"}
              </span>
              <span className="font-mono tabular-nums text-xs font-bold shrink-0">
                <bdi dir="ltr">{isGenericEdu ? "CAMPUS · ONLINE" : "MICRO:BIT · PYTHON"}</bdi>
              </span>
            </div>

            <div className="glazier-t grid grid-cols-2">
              <div className="glazier-pane-amber glazier-e p-4 sm:p-5 flex flex-col items-start justify-between gap-1.5 text-start">
                <span className="font-mono tabular-nums text-lg sm:text-xl font-bold">
                  <bdi dir="ltr">{panel?.metricValue || "EARLY10"}</bdi>
                </span>
                <span className="text-xs sm:text-sm font-semibold leading-snug">
                  {panel?.metricLabel || "تقييم مجاني وخصم 15% للإخوة"}
                </span>
              </div>

              <div className="glazier-pane-cobalt p-4 sm:p-5 flex flex-col items-start justify-between gap-1.5 text-start">
                <span className="font-mono tabular-nums text-lg sm:text-xl font-bold">
                  <bdi dir="ltr">{isGenericEdu ? "01 — 04" : "01 — 15"}</bdi>
                </span>
                <span className="text-xs sm:text-sm font-medium leading-snug opacity-95">
                  {isGenericEdu ? "مراحل تعليمية متدرجة بإشراف مباشر" : "مستوى متدرج حتى Demo Day"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Academy3DWaveHero;

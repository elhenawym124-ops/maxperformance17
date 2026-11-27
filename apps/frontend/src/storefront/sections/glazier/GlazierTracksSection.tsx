import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useCategories } from "../../hooks/useCategories";
import { useStorefrontTheme } from "../../engine/ThemeProvider";
import { buildStorefrontPath } from "../../utils/paths";
import "../../styles/academy-stage.css";

interface StageTrackSpec {
  id: string;
  stageCode: string;
  levelsCode: string;
  ageCode: string;
  ageUnit: string;
  title: string;
  tools: string;
  outcome: string;
  paneClass: string;
  categoryKeywords: string[];
  levels: Array<{
    code: string;
    name: string;
    focus: string;
    searchQuery: string;
  }>;
}

const TRACK_STAGES: StageTrackSpec[] = [
  {
    id: "juniors",
    stageCode: "01",
    levelsCode: "LVL 01–04",
    ageCode: "6–9",
    ageUnit: "سنوات",
    title: "التأسيس المنطقي و Scratch",
    tools: "Code.org · Scratch Jr · Scratch 3",
    outcome: "يحول الطالب خياله إلى ألعاب وقصص تفاعلية مع فهم التسلسل والشرط والتكرار.",
    paneClass: "glazier-pane-emerald",
    categoryKeywords: ["تأسيس", "scratch", "1–4", "1-4", "6-9", "junior"],
    levels: [
      { code: "LVL 01", name: "أساسيات التفكير البرمجي", focus: "الأوامر والتسلسل وحل الألغاز", searchQuery: "Level 1" },
      { code: "LVL 02", name: "الرسوم والقصص التفاعلية", focus: "بناء مشاهد متحركة في Scratch", searchQuery: "Level 2" },
      { code: "LVL 03", name: "ألعاب المنطق والمراحل", focus: "المتغيرات والشرط والنقاط", searchQuery: "Level 3" },
      { code: "LVL 04", name: "مشروع اللعبة المتكامل", focus: "إخراج لعبة كاملة بواجهة صوتية", searchQuery: "Level 4" },
    ],
  },
  {
    id: "makers",
    stageCode: "02",
    levelsCode: "LVL 05–08",
    ageCode: "9–12",
    ageUnit: "سنة",
    title: "تطبيقات الموبايل والهاردوير",
    tools: "MIT App Inventor · Micro:bit · Arduino",
    outcome: "يبرمج الطالب تطبيقات أندرويد ويربط الكود بالحساسات والشاشات والمحركات.",
    paneClass: "glazier-pane-cyan",
    categoryKeywords: ["موبايل", "app", "micro", "arduino", "5–8", "5-8", "هاردوير"],
    levels: [
      { code: "LVL 05", name: "تطبيقات الموبايل الأولى", focus: "واجهات MIT App Inventor التفاعلية", searchQuery: "Level 5" },
      { code: "LVL 06", name: "المتغيرات وقواعد البيانات المصغرة", focus: "حفظ نتائج المستخدمين والتنقل", searchQuery: "Level 6" },
      { code: "LVL 07", name: "برمجة Micro:bit والحساسات", focus: "الحركة والضوء والإشارات اللاسلكية", searchQuery: "Level 7" },
      { code: "LVL 08", name: "نموذج أجهزة ذكية عملي", focus: "تكامل التطبيق مع الدوائر الحساسة", searchQuery: "Level 8" },
    ],
  },
  {
    id: "ai-web",
    stageCode: "03",
    levelsCode: "LVL 09–11",
    ageCode: "11–14",
    ageUnit: "سنة",
    title: "الذكاء الاصطناعي وبناء الويب",
    tools: "PictoBlox AI · Arduino Sensors · Web",
    outcome: "يدرب الطالب نماذج رؤية حاسوبية وتمييز الأجسام ويصمم واجهات ويب حقيقية.",
    paneClass: "glazier-pane-amber",
    categoryKeywords: ["ذكاء", "ai", "ويب", "web", "9–11", "9-11", "رؤية"],
    levels: [
      { code: "LVL 09", name: "تصميم صفحات الويب HTML & CSS", focus: "هيكلة الصفحة والتنسيق المتجاوب", searchQuery: "Level 9" },
      { code: "LVL 10", name: "مقدمة تطوير الويب التفاعلي", focus: "JavaScript والمنطق داخل المتصفح", searchQuery: "Level 10" },
      { code: "LVL 11", name: "الذكاء الاصطناعي والرؤية الحاسوبية", focus: "تصنيف الصور وتتبع الحركة عملياً", searchQuery: "Level 11" },
    ],
  },
  {
    id: "founders",
    stageCode: "04",
    levelsCode: "LVL 12–15",
    ageCode: "14–17",
    ageUnit: "سنة",
    title: "Python Pro و Demo Day",
    tools: "Python · GUI Apps · Entrepreneurship",
    outcome: "يبني الطالب تطبيق Python متكامل ويعرض مشروعه التقني أمام لجنة التقييم.",
    paneClass: "glazier-pane-berry",
    categoryKeywords: ["python", "ريادة", "demo", "12–15", "12-15", "14-17"],
    levels: [
      { code: "LVL 12", name: "أساسيات Python والبيانات", focus: "الدوال وهياكل البيانات والمنطق النظيف", searchQuery: "Level 12" },
      { code: "LVL 13", name: "برمجة الواجهات والتطبيقات", focus: "تصميم تطبيق سطح مكتب ببايثون", searchQuery: "Level 13" },
      { code: "LVL 14", name: "تطبيقات Python GUI المتقدمة", focus: "دمج الواجهة مع قواعد البيانات والملفات", searchQuery: "Level 14" },
      { code: "LVL 15", name: "مشروع التخرج و Demo Day Pitch", focus: "عرض المنتج النهائي كنموذج شركة ناشئة", searchQuery: "Level 15" },
    ],
  },
];

const GENERIC_TRACK_STAGES: StageTrackSpec[] = [
  {
    id: "juniors",
    stageCode: "01",
    levelsCode: "STAGE 01",
    ageCode: "المرحلة 1",
    ageUnit: "تأسيس",
    title: "المرحلة التأسيسية والمهارات الأساسية",
    tools: "مجموعات صغيرة · شرح تفاعلي · تطبيق أولي",
    outcome: "بناء قاعدة معرفية سليمة مع تقييم أسبوعي لمستوى الفهم والتطبيق.",
    paneClass: "glazier-pane-emerald",
    categoryKeywords: ["تأسيس", "تمهيد", "stage 1", "basic", "foundation"],
    levels: [
      { code: "UNIT 01", name: "تقييم البداية وبناء الأساس", focus: "تثبيت المفاهيم الأولية خطوة بخطوة", searchQuery: "1" },
      { code: "UNIT 02", name: "تطبيقات وتمارين موجهة", focus: "ربط الشرح النظري بأنشطة عملية", searchQuery: "2" },
    ],
  },
  {
    id: "makers",
    stageCode: "02",
    levelsCode: "STAGE 02",
    ageCode: "المرحلة 2",
    ageUnit: "تطوير",
    title: "المرحلة المتوسطة والتطبيق العملي",
    tools: "ورش تطبيقية · مشاريع فردية · متابعة مباشرة",
    outcome: "تعميق الفهم عبر تدريبات واقعية وحل مشكلات متدرجة الصعوبة.",
    paneClass: "glazier-pane-cyan",
    categoryKeywords: ["متوسط", "تطوير", "stage 2", "intermediate"],
    levels: [
      { code: "UNIT 03", name: "المهارات التطبيقية المتوسطة", focus: "تنفيذ مهام عملية بإشراف المحاضر", searchQuery: "3" },
      { code: "UNIT 04", name: "تقييم منتصف المسار", focus: "مراجعة شاملة وقياس التقدم", searchQuery: "4" },
    ],
  },
  {
    id: "ai-web",
    stageCode: "03",
    levelsCode: "STAGE 03",
    ageCode: "المرحلة 3",
    ageUnit: "تخصص",
    title: "المرحلة المتقدمة والتخصص المعمق",
    tools: "مشاريع جماعية · محاكاة عملية · تغذية راجعة",
    outcome: "إتقان المهارات المتقدمة وتنفيذ مشروعات متكاملة بمستوى احترافي.",
    paneClass: "glazier-pane-amber",
    categoryKeywords: ["متقدم", "تخصص", "stage 3", "advanced"],
    levels: [
      { code: "UNIT 05", name: "التطبيقات المتقدمة", focus: "معالجة حالات عملية حقيقية", searchQuery: "5" },
      { code: "UNIT 06", name: "مشروع تطبيقي متكامل", focus: "بناء وعرض المخرج النهائي للمرحلة", searchQuery: "6" },
    ],
  },
  {
    id: "founders",
    stageCode: "04",
    levelsCode: "STAGE 04",
    ageCode: "المرحلة 4",
    ageUnit: "إتقان",
    title: "مسار الإتقان والاعتماد النهائي",
    tools: "اختبارات محاكاة · تقييم ختامي · شهادة إتمام",
    outcome: "إتمام البرنامج بنجاح مع تقرير تقييم شامل وشهادة إتمام معتمدة.",
    paneClass: "glazier-pane-berry",
    categoryKeywords: ["إتقان", "تأهيل", "شهادة", "stage 4", "master"],
    levels: [
      { code: "UNIT 07", name: "المراجعة النهائية والمحاكاة", focus: "استعداد كامل للتقييم النهائي", searchQuery: "7" },
      { code: "UNIT 08", name: "التقييم الختامي والشهادة", focus: "عرض المشروع أو اجتياز الاختبار", searchQuery: "8" },
    ],
  },
];

export interface GlazierTracksSectionProps {
  section?: {
    variant?: string;
    [key: string]: unknown;
  };
  settings?: {
    title?: string;
    subtitle?: string;
    [key: string]: unknown;
  };
}

/**
 * Glazier architectural curriculum matrix for the /collections route.
 * Partitions the 15-level roadmap into 4 backlit age & discipline bays with interactive level index.
 */
export const GlazierTracksSection: React.FC<GlazierTracksSectionProps> = ({
  settings,
}) => {
  const location = useLocation();
  const { theme } = useStorefrontTheme();
  const isGenericEdu = theme?.id === "edu-academy-pro";
  const trackStages = isGenericEdu ? GENERIC_TRACK_STAGES : TRACK_STAGES;
  const { categories } = useCategories();
  const [activeStageId, setActiveStageId] = useState<string>("all");

  const scopedHref = (target: string) =>
    buildStorefrontPath(location.pathname, target, location.search);

  const stageCategories = useMemo(() => {
    const map = new Map<string, string>();
    trackStages.forEach((stage, index) => {
      const matched = categories.find((cat) => {
        const hay = `${cat.name || ""} ${cat.slug || ""}`.toLowerCase();
        return stage.categoryKeywords.some((kw) => hay.includes(kw));
      });
      if (matched?.id) {
        map.set(stage.id, matched.id);
      } else if (categories[index]?.id) {
        map.set(stage.id, categories[index].id);
      }
    });
    return map;
  }, [categories, trackStages]);

  const visibleStages = useMemo(
    () =>
      activeStageId === "all"
        ? trackStages
        : trackStages.filter((stage) => stage.id === activeStageId),
    [activeStageId, trackStages],
  );

  const sectionTitle =
    typeof settings?.title === "string" && settings.title.trim()
      ? settings.title.trim()
      : isGenericEdu
        ? "خارطة المسارات والبرامج التعليمية"
        : "خارطة المسارات التعليمية — 15 مستوى عملي";
  const sectionSubtitle =
    typeof settings?.subtitle === "string" && settings.subtitle.trim()
      ? settings.subtitle.trim()
      : "اختر المرحلة العمرية المناسبة لتصفح المهارات والأدوات، أو انتقل مباشرة لباقات المستويات وحجز التقييم.";

  return (
    <section
      aria-label={sectionTitle}
      className="glazier-scope glazier-b w-full"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto glazier-xl-x">
        {/* Header Bay */}
        <div className="glazier-b glazier-seeded p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-8 space-y-3">
              <h1 className="glazier-heading text-2xl sm:text-3xl lg:text-4xl font-bold leading-snug">
                {sectionTitle}
              </h1>
              <p className="glazier-muted text-sm sm:text-base leading-relaxed max-w-2xl">
                {sectionSubtitle}
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-2">
              <Link
                to={scopedHref("/registration")}
                className="glazier-pane-berry glazier-frame inline-flex min-h-[46px] items-center gap-2 px-5 py-2.5 text-sm font-bold whitespace-nowrap"
              >
                <span>احجز تقييم تحديد المستوى</span>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to={scopedHref("/shop")}
                className="glazier-clear glazier-frame inline-flex min-h-[46px] items-center px-5 py-2.5 text-sm font-bold whitespace-nowrap"
              >
                كل الباقات
              </Link>
            </div>
          </div>
        </div>

        {/* Interactive Track Filter Rail */}
        <div
          role="tablist"
          aria-label="تصفية حسب المرحلة العمرية"
          className="glazier-b glazier-mullion-grid flex items-stretch overflow-x-auto scrollbar-none lg:grid lg:grid-cols-5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeStageId === "all"}
            onClick={() => setActiveStageId("all")}
            className={`shrink-0 min-h-[48px] px-4 py-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
              activeStageId === "all" ? "glazier-pane-cobalt" : "glazier-clear"
            }`}
          >
            كل المسارات (<bdi dir="ltr" className="font-mono tabular-nums">15</bdi>)
          </button>
          {TRACK_STAGES.map((stage) => {
            const selected = activeStageId === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveStageId(stage.id)}
                className={`shrink-0 min-h-[48px] px-4 py-3 text-xs sm:text-sm font-bold whitespace-nowrap flex items-center justify-center gap-2 transition-colors ${
                  selected ? "glazier-pane-cobalt" : "glazier-clear"
                }`}
              >
                <bdi dir="ltr" className="font-mono tabular-nums text-[11px] opacity-80">
                  {stage.ageCode}
                </bdi>
                <span>{stage.title}</span>
              </button>
            );
          })}
        </div>

        {/* 4 Illuminated Stage Partition Bays */}
        <div className="glazier-b glazier-mullion-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {TRACK_STAGES.map((stage) => {
            const categoryId = stageCategories.get(stage.id);
            const shopTarget = categoryId
              ? `/shop?category=${encodeURIComponent(categoryId)}`
              : "/shop";
            const active = activeStageId === stage.id;

            return (
              <div
                key={stage.id}
                className={`flex flex-col justify-between p-6 transition-colors ${
                  active ? stage.paneClass : "glazier-clear"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold">
                    <bdi dir="ltr" className="font-mono tabular-nums">
                      {stage.stageCode} · {stage.levelsCode}
                    </bdi>
                    <span className="glazier-frame px-2 py-0.5 text-[11px] font-bold">
                      <bdi dir="ltr" className="font-mono tabular-nums">
                        {stage.ageCode}
                      </bdi>{" "}
                      {stage.ageUnit}
                    </span>
                  </div>

                  <h2 className="glazier-heading text-lg font-bold leading-snug">
                    {stage.title}
                  </h2>

                  <p className="text-xs font-mono leading-relaxed opacity-85" dir="ltr">
                    {stage.tools}
                  </p>

                  <p className="text-sm leading-relaxed opacity-90">
                    {stage.outcome}
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <Link
                    to={scopedHref(shopTarget)}
                    className="glazier-frame glazier-clear flex min-h-[44px] items-center justify-between px-4 py-2.5 text-xs font-bold"
                  >
                    <span>تصفح مستويات المسار</span>
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                  <Link
                    to={scopedHref(`/registration?track=${stage.id}`)}
                    className="glazier-pane-cobalt glazier-frame flex min-h-[42px] items-center justify-center px-4 py-2 text-xs font-bold"
                  >
                    احجز تقييم لهذه المرحلة
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* 15-Level Curriculum Index Ledger */}
        <div className="glazier-seeded">
          {visibleStages.map((stage, sIdx) => (
            <div
              key={stage.id}
              className={sIdx < visibleStages.length - 1 ? "glazier-b" : ""}
            >
              <div className="glazier-b glazier-clear px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`${stage.paneClass} glazier-frame px-2.5 py-1 text-xs font-mono tabular-nums font-bold`}>
                    <bdi dir="ltr">{stage.levelsCode}</bdi>
                  </span>
                  <h3 className="glazier-heading text-base sm:text-lg font-bold">
                    {stage.title}
                  </h3>
                </div>
                <span className="glazier-muted text-xs font-medium">
                  مناسب للأعمار{" "}
                  <bdi dir="ltr" className="font-mono tabular-nums font-bold">
                    {stage.ageCode}
                  </bdi>{" "}
                  {stage.ageUnit}
                </span>
              </div>

              <div
                className={`glazier-mullion-grid grid grid-cols-1 sm:grid-cols-2 ${
                  stage.levels.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
                }`}
              >
                {stage.levels.map((level) => (
                  <Link
                    key={level.code}
                    to={scopedHref(`/shop?search=${encodeURIComponent(level.searchQuery)}`)}
                    className="glazier-clear p-5 flex flex-col justify-between gap-3 text-start"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono tabular-nums font-bold glazier-muted">
                        <bdi dir="ltr">{level.code}</bdi>
                        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      </div>
                      <div className="glazier-heading text-sm sm:text-base font-bold leading-snug">
                        {level.name}
                      </div>
                      <p className="glazier-muted text-xs leading-relaxed">
                        {level.focus}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

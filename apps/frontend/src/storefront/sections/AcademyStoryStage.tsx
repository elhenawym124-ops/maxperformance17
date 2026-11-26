import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/academy-stage.css';

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
    manifestoEyebrow?: string;
    manifestoText?: string;
    manifestoHighlights?: string[];
    journeyBadge?: string;
    journeyTitle?: string;
    milestones?: StoryMilestone[];
    bentoBadge?: string;
    bentoTitle?: string;
    bentoDescription?: string;
    metrics?: StoryMetric[];
    ctaText?: string;
    ctaLink?: string;
    [key: string]: unknown;
  };
}

const DEFAULT_MANIFESTO =
  'نحن لا نعلّم الأطفال حفظ الأوامر — بل نبني عقلية مهندس ورائد أعمال يصمم لعبته أو نموذج الذكاء الاصطناعي ويعرض مشروعه في Demo Day بثقة.';

const DEFAULT_HIGHLIGHTS = ['مهندس ورائد أعمال', 'الذكاء الاصطناعي', 'Demo Day'];

const DEFAULT_MILESTONES: StoryMilestone[] = [
  {
    index: '01',
    badge: 'Code · Level 1–5',
    title: 'من التفكير المنطقي إلى بناء الألعاب والتطبيقات',
    subtitle: 'ينتقل الطالب من الكتل البصرية (Code.org & Scratch) إلى تصميم ألعاب وتطبيقات هاتف متكاملة.',
    highlights: ['أساسيات المنطق والخوارزميات', 'تطوير ألعاب بـ Scratch', 'تطبيقات موبايل بـ MIT'],
    codeSnippet: 'if (idea.tested && game.score >= 100) launchDemo();',
    metric: '1–5',
    metricLabel: 'المستويات التأسيسية',
  },
  {
    index: '02',
    badge: 'AI & Hardware · Level 6–11',
    title: 'برمجة الذكاء الاصطناعي والمستشعرات في مشاريع حية',
    subtitle: 'تدريب نماذج رؤية حاسوبية بـ PictoBlox وربط Microbit ومواقع Web JavaScript بتجربة عملية.',
    highlights: ['نماذج Vision AI تفاعلية', 'برمجة Microbit والروبوتات', 'تطوير صفحات Web & JS'],
    codeSnippet: 'const prediction = await visionModel.classify(frame);',
    metric: '6–11',
    metricLabel: 'مرحلة الابتكار والـ AI',
  },
  {
    index: '03',
    badge: 'Startup & Pitch · Level 12–15',
    title: 'Python Pro وتأسيس شركة ناشئة مع عرض أمام الجمهور',
    subtitle: 'كتابة Python احترافي، صياغة خطة منتج حقيقي، والتدريب على الإلقاء باللغتين في Demo Day.',
    highlights: ['تطبيقات Python Pro متقدمة', 'تفكير ريادي وبناء MVP', 'عرض Pitch أمام لجنة التحكيم'],
    codeSnippet: 'pitch.present({ product: "EduBot", traction: "Demo Day" });',
    metric: '12–15',
    metricLabel: 'مسار الريادة والتخرج',
  },
];

const DEFAULT_METRICS: StoryMetric[] = [
  { value: '15', label: 'مستوى عملي متدرج من التأسيس للاحتراف' },
  { value: '6–17', label: 'فئة عمرية مقسمة حسب الاستيعاب' },
  { value: '8–10', label: 'الحد الأقصى للطلاب في المجموعة' },
];

/**
 * 2026 MotionSites-inspired narrative flow section:
 * Act I: Scroll-linked word-by-word Manifesto opacity reveal.
 * Act II: Sticky stacking milestone cards (zero overflow:hidden traps).
 * Act III: Asymmetric Bento proof & offer summary.
 */
const AcademyStoryStage: React.FC<AcademyStoryStageProps> = ({ settings }) => {
  const manifestoRef = useRef<HTMLParagraphElement | null>(null);
  const stackRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [wordProgress, setWordProgress] = useState<number>(1);
  const [reducedMotion, setReducedMotion] = useState(false);

  const manifestoText = settings?.manifestoText || DEFAULT_MANIFESTO;
  const highlights =
    Array.isArray(settings?.manifestoHighlights) && settings.manifestoHighlights.length > 0
      ? settings.manifestoHighlights
      : DEFAULT_HIGHLIGHTS;
  const milestones =
    Array.isArray(settings?.milestones) && settings.milestones.length > 0
      ? settings.milestones
      : DEFAULT_MILESTONES;
  const metrics =
    Array.isArray(settings?.metrics) && settings.metrics.length > 0
      ? settings.metrics
      : DEFAULT_METRICS;

  const words = manifestoText.trim().split(/\s+/);
  // Group contiguous Latin phrases (e.g. "Demo Day") so RTL layout never reverses English word order
  const tokens: string[] = [];
  for (const w of words) {
    const isLatin = /^[A-Za-z0-9.,!?-]+$/.test(w);
    if (isLatin && tokens.length > 0 && /^[A-Za-z0-9.,!?-\s]+$/.test(tokens[tokens.length - 1])) {
      tokens[tokens.length - 1] = `${tokens[tokens.length - 1]} ${w}`;
    } else {
      tokens.push(w);
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const isReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReducedMotion(isReduce);
    if (isReduce) {
      setWordProgress(1);
      return undefined;
    }

    let ticking = false;
    const updateScroll = () => {
      ticking = false;
      const vh = window.innerHeight || 800;

      if (manifestoRef.current) {
        const r = manifestoRef.current.getBoundingClientRect();
        const startY = vh * 0.85;
        const endY = vh * 0.25;
        const denom = startY - endY + r.height;
        const p = Math.min(1, Math.max(0, (startY - r.top) / Math.max(1, denom)));
        setWordProgress(p);
      }

      if (stackRef.current && window.innerWidth >= 768) {
        const sr = stackRef.current.getBoundingClientRect();
        const totalDist = Math.max(1, sr.height - vh);
        const totalP = Math.min(1, Math.max(0, -sr.top / totalDist));
        const n = milestones.length;

        cardRefs.current.forEach((cardEl, idx) => {
          if (!cardEl) return;
          const slotStart = idx / n;
          const localP = Math.min(1, Math.max(0, (totalP - slotStart) / Math.max(0.15, 1 - slotStart)));
          const targetScale = 1 - (n - 1 - idx) * 0.035;
          const scale = 1 - (1 - targetScale) * localP;
          cardEl.style.transform = `scale(${scale.toFixed(4)})`;
        });
      }
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateScroll);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [milestones.length]);

  const isWordHighlighted = (word: string, idx: number, all: string[]) => {
    const clean = word.replace(/[.,،—-]/g, '');
    return highlights.some((phrase) => {
      if (phrase.includes(clean) && clean.length >= 2) {
        const prev = idx > 0 ? all[idx - 1] : '';
        const next = idx < all.length - 1 ? all[idx + 1] : '';
        const windowText = `${prev} ${clean} ${next}`;
        return windowText.includes(phrase) || phrase === clean;
      }
      return false;
    });
  };

  return (
    <section
      id="academy-story"
      dir="rtl"
      className="relative acad-obsidian-canvas overflow-x-clip py-20 sm:py-28"
    >
      <div className="acad-grain" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 sm:space-y-32">
        {/* Act I: Scroll-Linked Word-by-Word Manifesto Reveal */}
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2.5 text-xs font-mono uppercase tracking-[0.18em] text-white/55">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: 'hsl(var(--accent))' }}
            />
            <span>{settings?.manifestoEyebrow || 'PHILOSOPHY // المنهجية'}</span>
          </div>

          <p
            ref={manifestoRef}
            className="text-2xl sm:text-4xl lg:text-[42px] font-semibold leading-[1.35] text-white/90"
            style={{ letterSpacing: 0 }}
          >
            {tokens.map((word, idx) => {
              const n = Math.max(1, tokens.length);
              const start = idx / n - 0.08;
              const end = idx / n + 0.06;
              const t = reducedMotion
                ? 1
                : Math.min(1, Math.max(0, (wordProgress - start) / Math.max(0.01, end - start)));
              const opacity = 0.36 + 0.64 * t;
              const hl = isWordHighlighted(word, idx, tokens);
              const isLatinToken = /^[A-Za-z0-9.,!?-\s]+$/.test(word);

              return (
                <span
                  key={`${idx}-${word}`}
                  dir={isLatinToken ? 'ltr' : undefined}
                  className={`inline-block transition-opacity duration-75 ${
                    isLatinToken ? 'mx-[0.28em]' : 'me-[0.3em]'
                  }`}
                  style={{
                    opacity: Number(opacity.toFixed(3)),
                    color: hl ? '#ffffff' : 'rgba(226, 232, 240, 0.94)',
                    textShadow: hl && t > 0.55 ? '0 0 28px hsl(var(--accent) / 0.55)' : undefined,
                    borderBottom: hl ? '2px solid hsl(var(--accent))' : undefined,
                  }}
                >
                  {word}
                </span>
              );
            })}
          </p>
        </div>

        {/* Act II: Sticky Stacking Journey Cards */}
        <div ref={stackRef} className="space-y-8 sm:space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-[0.18em] text-white/50">
                {settings?.journeyBadge || 'CURRICULUM ARCHITECTURE // مسار التطور'}
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-white" style={{ letterSpacing: 0 }}>
                {settings?.journeyTitle || 'رحلة الطالب من الفكرة إلى منصة العرض'}
              </h2>
            </div>
            <span className="font-mono text-xs tabular-nums text-white/50">
              {`01 — 0${milestones.length}`}
            </span>
          </div>

          <div className="space-y-6 md:space-y-10">
            {milestones.map((item, idx) => (
              <div
                key={item.title + idx}
                className="md:sticky"
                style={{ top: `${92 + idx * 24}px`, zIndex: 10 + idx }}
              >
                <div
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  style={{ transformOrigin: 'top center' }}
                  className="acad-glass acad-glass--strong rounded-3xl sm:rounded-[32px] p-6 sm:p-10 transition-transform duration-150 will-change-transform"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
                    <div className="lg:col-span-7 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono tabular-nums text-xs px-3 py-1 rounded-full bg-white/10 text-white/85">
                          {item.index || `0${idx + 1}`}
                        </span>
                        {item.badge && (
                          <span
                            className="font-mono text-xs px-3 py-1 rounded-full font-semibold"
                            style={{
                              backgroundColor: 'hsl(var(--accent) / 0.2)',
                              color: '#FFE4D9',
                              border: '1px solid hsl(var(--accent) / 0.45)',
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <h3
                        className="text-xl sm:text-3xl font-bold text-white leading-snug"
                        style={{ letterSpacing: 0 }}
                      >
                        {item.title}
                      </h3>

                      {item.subtitle && (
                        <p className="text-sm sm:text-base text-white/75 leading-relaxed max-w-2xl">
                          {item.subtitle}
                        </p>
                      )}

                      {Array.isArray(item.highlights) && item.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {item.highlights.map((tag) => (
                            <span
                              key={tag}
                              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.06] border border-white/10 text-white/85"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-5">
                      <div className="rounded-2xl bg-[#04070F]/85 border border-white/10 p-5 sm:p-6 space-y-4">
                        <div className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-4">
                          <div>
                            <div className="text-xs font-mono uppercase tracking-[0.14em] text-white/45">
                              {item.metricLabel || 'LEVEL STAGE'}
                            </div>
                            <div
                              dir="ltr"
                              className="inline-block text-3xl sm:text-4xl font-bold font-mono tabular-nums text-white mt-1"
                            >
                              {item.metric || `0${idx + 1}`}
                            </div>
                          </div>
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: 'hsl(var(--accent))',
                              boxShadow: '0 0 18px hsl(var(--accent))',
                            }}
                            aria-hidden="true"
                          />
                        </div>

                        {item.codeSnippet && (
                          <pre
                            dir="ltr"
                            className="font-mono text-xs text-sky-300/90 overflow-x-auto scrollbar-none bg-black/50 rounded-xl p-3.5 border border-white/5"
                          >
                            <code>{item.codeSnippet}</code>
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Act III: Asymmetric Editorial Bento Proof Band */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-7 acad-glass acad-glass--strong rounded-3xl p-7 sm:p-10 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.16em] text-white/60">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: 'hsl(var(--accent))' }}
                />
                {settings?.bentoBadge || 'DEMO DAY // التخرج والعرض'}
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight" style={{ letterSpacing: 0 }}>
                {settings?.bentoTitle || 'لا ينتهي المسار باختبار — بل بعرض مشروع حقيقي أمام الجميع'}
              </h3>
              <p className="text-sm sm:text-base text-white/75 leading-relaxed max-w-xl">
                {settings?.bentoDescription ||
                  'كل طالب يبني مشروعاً عملياً ويقدم عرض Pitch متكامل يجمع البرمجة والذكاء الاصطناعي وريادة الأعمال.'}
              </p>
            </div>

            {settings?.ctaText && (
              <div>
                <Link to={settings.ctaLink || '/registration'} className="acad-btn-roll">
                  <span className="acad-btn-roll__label">
                    <span className="acad-btn-roll__inner">
                      <span>{settings.ctaText}</span>
                      <span aria-hidden="true">{settings.ctaText}</span>
                    </span>
                  </span>
                  <span className="acad-btn-roll__chip" aria-hidden="true">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                  </span>
                </Link>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 divide-y divide-white/10 acad-glass rounded-3xl overflow-hidden">
            {metrics.map((m) => (
              <div key={m.value + m.label} className="p-6 flex items-center justify-between gap-4">
                <span className="text-sm text-white/75 leading-snug max-w-[22ch]">{m.label}</span>
                <span
                  dir="ltr"
                  className="text-3xl sm:text-4xl font-bold font-mono tabular-nums text-white shrink-0"
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AcademyStoryStage;

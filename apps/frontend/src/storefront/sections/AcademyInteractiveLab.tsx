import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/academy-stage.css';

interface LabTarget {
  key: string;
  chipLabel: string;
  resultLabel: string;
  confidence: string;
  color: string;
  shape: 'bottle' | 'solar' | 'book';
}

interface AcademyInteractiveLabProps {
  section?: { variant?: string; [key: string]: unknown };
  settings?: {
    badge?: string;
    title?: string;
    subtitle?: string;
    visionTabLabel?: string;
    physicsTabLabel?: string;
    ctaText?: string;
    ctaLink?: string;
    targets?: LabTarget[];
    [key: string]: unknown;
  };
}

const DEFAULT_TARGETS: LabTarget[] = [
  {
    key: 'bottle',
    chipLabel: 'مشروع إعادة التدوير',
    resultLabel: 'Plastic Bottle — فرز ذكي بالكاميرا',
    confidence: '97.4%',
    color: '#38BDF8',
    shape: 'bottle',
  },
  {
    key: 'solar',
    chipLabel: 'مشروع الطاقة النظيفة',
    resultLabel: 'Solar Cell — قياس كفاءة الخلايا',
    confidence: '95.8%',
    color: '#FBBF24',
    shape: 'solar',
  },
  {
    key: 'book',
    chipLabel: 'مساعد المذاكرة الذكي',
    resultLabel: 'Study Assistant — تصنيف المحتوى التعليمي',
    confidence: '98.2%',
    color: '#FFAE91',
    shape: 'book',
  },
];

const AcademyInteractiveLab: React.FC<AcademyInteractiveLabProps> = ({ settings }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const targets =
    Array.isArray(settings?.targets) && settings.targets.length > 0
      ? settings.targets
      : DEFAULT_TARGETS;

  const [mode, setMode] = useState<'vision' | 'rocket'>('vision');
  const [activeKey, setActiveKey] = useState<string>(targets[0].key);
  const [gravityMode, setGravityMode] = useState<'low' | 'earth'>('low');
  const [launchCount, setLaunchCount] = useState(0);

  const activeTarget = targets.find((t) => t.key === activeKey) || targets[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let scanT = 0;
    const rocket = {
      x: 80,
      y: 195,
      vx: 3.4,
      vy: gravityMode === 'low' ? -5.8 : -7.2,
      grav: gravityMode === 'low' ? 0.045 : 0.13,
      trail: [] as Array<{ x: number; y: number }>,
    };

    const draw = () => {
      rafId = requestAnimationFrame(draw);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 32) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 0; gy < h; gy += 32) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      if (mode === 'vision') {
        scanT = (scanT + 0.024) % 1;
        const cx = w / 2;
        const cy = h / 2;

        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 2;
        if (activeTarget.shape === 'bottle') {
          ctx.beginPath();
          ctx.roundRect(cx - 26, cy - 42, 52, 92, 14);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.roundRect(cx - 12, cy - 60, 24, 18, 4);
          ctx.fill();
          ctx.stroke();
        } else if (activeTarget.shape === 'solar') {
          ctx.beginPath();
          ctx.roundRect(cx - 72, cy - 46, 144, 92, 10);
          ctx.fill();
          ctx.stroke();
          for (let x = cx - 36; x <= cx + 36; x += 36) {
            ctx.beginPath();
            ctx.moveTo(x, cy - 46);
            ctx.lineTo(x, cy + 46);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.moveTo(cx - 72, cy);
          ctx.lineTo(cx + 72, cy);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.roundRect(cx - 56, cy - 48, 112, 96, 8);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx, cy - 48);
          ctx.lineTo(cx, cy + 48);
          ctx.stroke();
        }
        ctx.restore();

        const bw = 180;
        const bh = 148;
        const bx = cx - bw / 2;
        const by = cy - bh / 2;
        ctx.strokeStyle = activeTarget.color;
        ctx.lineWidth = 2.5;
        const arm = 22;
        [
          [bx, by, 1, 1],
          [bx + bw, by, -1, 1],
          [bx, by + bh, 1, -1],
          [bx + bw, by + bh, -1, -1],
        ].forEach(([x, y, sx, sy]) => {
          ctx.beginPath();
          ctx.moveTo(x + sx * arm, y);
          ctx.lineTo(x, y);
          ctx.lineTo(x, y + sy * arm);
          ctx.stroke();
        });

        const sy = by + scanT * bh;
        ctx.save();
        ctx.strokeStyle = activeTarget.color;
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        ctx.moveTo(bx + 6, sy);
        ctx.lineTo(bx + bw - 6, sy);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.direction = 'ltr';
        ctx.textAlign = 'left';
        ctx.fillStyle = activeTarget.color;
        ctx.beginPath();
        ctx.roundRect(bx, by - 28, 172, 22, 6);
        ctx.fill();
        ctx.fillStyle = '#081212';
        ctx.font = '600 11px "IBM Plex Mono", monospace';
        ctx.fillText(
          `${activeTarget.key.toUpperCase()} ${activeTarget.confidence}`,
          bx + 10,
          by - 13,
        );
        ctx.restore();
      } else {
        rocket.vy += rocket.grav;
        rocket.x += rocket.vx;
        rocket.y += rocket.vy;
        rocket.trail.push({ x: rocket.x, y: rocket.y });
        if (rocket.trail.length > 42) rocket.trail.shift();
        if (rocket.y > 205 || rocket.x > w - 36) {
          rocket.x = 80;
          rocket.y = 195;
          rocket.vy = gravityMode === 'low' ? -5.8 : -7.2;
          rocket.trail = [];
        }

        rocket.trail.forEach((pt, idx) => {
          ctx.fillStyle = `rgba(217, 93, 57, ${idx / rocket.trail.length})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.save();
        ctx.translate(rocket.x, rocket.y);
        ctx.rotate(Math.atan2(rocket.vy, rocket.vx));
        ctx.fillStyle = '#FFAE91';
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(-10, -8);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.beginPath();
        ctx.moveTo(24, 212);
        ctx.lineTo(w - 24, 212);
        ctx.stroke();
      }
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [mode, activeTarget, gravityMode, launchCount]);

  return (
    <section
      id="academy-lab"
      dir="rtl"
      className="relative acad-obsidian-canvas overflow-x-clip py-20 sm:py-28 border-t border-white/10"
    >
      <div className="acad-grain" aria-hidden="true" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-5 space-y-5">
          <span
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono tracking-wider"
            style={{
              backgroundColor: 'hsl(var(--accent) / 0.16)',
              color: '#FFE4D9',
              border: '1px solid hsl(var(--accent) / 0.45)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'hsl(var(--accent))' }}
            />
            {settings?.badge || 'LIVE LAB // معمل التجربة التفاعلي'}
          </span>

          <h2 className="text-2xl sm:text-4xl font-bold leading-snug text-white" style={{ letterSpacing: 0 }}>
            {settings?.title || 'شوف بنفسك كيف يبني الطالب ذكاءً اصطناعياً وألعاباً حية'}
          </h2>

          <p className="text-sm sm:text-base text-white/75 leading-relaxed">
            {settings?.subtitle ||
              'بدل الكلام النظري، جرّب نموذج الرؤية الحاسوبية أو محاكاة الفيزياء التي ينفذها طلابنا خطوة بخطوة.'}
          </p>

          <div className="acad-glass inline-flex p-1 rounded-full gap-1">
            <button
              type="button"
              onClick={() => setMode('vision')}
              className={`min-h-[40px] px-4 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                mode === 'vision' ? 'bg-white text-[#060913]' : 'text-white/75 hover:text-white'
              }`}
            >
              {settings?.visionTabLabel || 'كاشف الذكاء الاصطناعي'}
            </button>
            <button
              type="button"
              onClick={() => setMode('rocket')}
              className={`min-h-[40px] px-4 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                mode === 'rocket' ? 'bg-white text-[#060913]' : 'text-white/75 hover:text-white'
              }`}
            >
              {settings?.physicsTabLabel || 'برمجة الحركة والفيزياء'}
            </button>
          </div>

          {settings?.ctaText && (
            <div className="pt-2">
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

        <div className="lg:col-span-7 acad-glass acad-glass--strong rounded-3xl overflow-hidden">
          <div className="h-11 px-5 border-b border-white/10 flex items-center justify-between text-xs text-white/60 font-mono">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: 'hsl(var(--accent))' }}
              />
              <span>SIMULATION // WORKBENCH</span>
            </div>
            <span className="tabular-nums text-white/80">
              {mode === 'vision' ? 'VISION AI' : 'PHYSICS 60FPS'}
            </span>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#040914]">
              <canvas
                ref={canvasRef}
                width={560}
                height={240}
                className="w-full h-[220px] sm:h-[240px] block"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              {mode === 'vision' ? (
                <div className="flex flex-wrap gap-2">
                  {targets.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setActiveKey(t.key)}
                      className={`min-h-[36px] px-3.5 rounded-full text-xs font-semibold border transition-colors ${
                        activeTarget.key === t.key
                          ? 'bg-white text-[#0E1722] border-white'
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                      }`}
                    >
                      {t.chipLabel}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGravityMode('low');
                      setLaunchCount((c) => c + 1);
                    }}
                    className={`min-h-[36px] px-3.5 rounded-full text-xs font-semibold border ${
                      gravityMode === 'low'
                        ? 'bg-white text-[#0E1722] border-white'
                        : 'bg-white/10 text-white border-white/20'
                    }`}
                  >
                    جاذبية القمر
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGravityMode('earth');
                      setLaunchCount((c) => c + 1);
                    }}
                    className={`min-h-[36px] px-3.5 rounded-full text-xs font-semibold border ${
                      gravityMode === 'earth'
                        ? 'bg-white text-[#0E1722] border-white'
                        : 'bg-white/10 text-white border-white/20'
                    }`}
                  >
                    جاذبية الأرض
                  </button>
                  <button
                    type="button"
                    onClick={() => setLaunchCount((c) => c + 1)}
                    className="min-h-[36px] px-3.5 rounded-full text-xs font-semibold border border-white/25 bg-white/10 text-white"
                  >
                    إعادة الإطلاق
                  </button>
                </div>
              )}
            </div>

            <div className="px-3.5 py-2.5 rounded-xl bg-black/35 border border-white/10 flex items-center justify-between gap-3 text-xs sm:text-sm">
              <span className="text-emerald-100 truncate">
                {mode === 'vision'
                  ? `التصنيف: ${activeTarget.resultLabel}`
                  : `gravity = ${gravityMode === 'low' ? '0.045' : '0.13'}`}
              </span>
              <span className="font-mono tabular-nums font-semibold text-amber-200 whitespace-nowrap shrink-0">
                {mode === 'vision' ? activeTarget.confidence : '60 FPS'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AcademyInteractiveLab;

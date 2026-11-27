import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/academy-stage.css";

interface LabTarget {
  key: string;
  chipLabel: string;
  resultLabel: string;
  confidence: string;
  shape: "bottle" | "solar" | "book";
}

interface AcademyInteractiveLabProps {
  section?: { variant?: string; [key: string]: unknown };
  settings?: {
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
    key: "bottle",
    chipLabel: "مشروع إعادة التدوير",
    resultLabel: "Plastic Bottle — فرز ذكي بالكاميرا",
    confidence: "97.4%",
    shape: "bottle",
  },
  {
    key: "solar",
    chipLabel: "مشروع الطاقة النظيفة",
    resultLabel: "Solar Cell — قياس كفاءة الخلايا",
    confidence: "95.8%",
    shape: "solar",
  },
  {
    key: "book",
    chipLabel: "مساعد المذاكرة الذكي",
    resultLabel: "Study Assistant — تصنيف المحتوى التعليمي",
    confidence: "98.2%",
    shape: "book",
  },
];

/**
 * Steel-mullioned optical observation chamber for experimenting with AI vision classification
 * and trajectory simulation models built by students.
 */
const AcademyInteractiveLab: React.FC<AcademyInteractiveLabProps> = ({
  settings,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const targets =
    Array.isArray(settings?.targets) && settings.targets.length > 0
      ? settings.targets
      : DEFAULT_TARGETS;

  const [mode, setMode] = useState<"vision" | "rocket">("vision");
  const [activeKey, setActiveKey] = useState<string>(targets[0].key);
  const [gravityMode, setGravityMode] = useState<"low" | "earth">("low");
  const [launchCount, setLaunchCount] = useState(0);

  const activeTarget = targets.find((t) => t.key === activeKey) || targets[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cs = getComputedStyle(canvas);
    const cyan = cs.getPropertyValue("--glazier-cyan").trim() || "rgb(41,168,223)";
    const amber = cs.getPropertyValue("--glazier-amber").trim() || "rgb(229,183,47)";
    const emerald =
      cs.getPropertyValue("--glazier-emerald").trim() || "rgb(43,182,115)";
    const activeColor =
      activeTarget.shape === "solar"
        ? amber
        : activeTarget.shape === "book"
          ? emerald
          : cyan;

    let rafId = 0;
    let scanT = 0;
    const rocket = {
      x: 72,
      y: 215,
      vx: 3.1,
      vy: gravityMode === "low" ? -5.5 : -6.9,
      grav: gravityMode === "low" ? 0.045 : 0.125,
      trail: [] as Array<{ x: number; y: number }>,
    };

    const draw = () => {
      rafId = requestAnimationFrame(draw);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 0; gy < h; gy += 40) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      if (mode === "vision") {
        scanT += 0.025;
        const cx = w * 0.5;
        const cy = h * 0.52;
        const bw = 240;
        const bh = 200;
        const left = cx - bw / 2;
        const top = cy - bh / 2;

        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(left, top, bw, bh);

        const corner = 14;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(left, top + corner); ctx.lineTo(left, top); ctx.lineTo(left + corner, top);
        ctx.moveTo(left + bw - corner, top); ctx.lineTo(left + bw, top); ctx.lineTo(left + bw, top + corner);
        ctx.moveTo(left, top + bh - corner); ctx.lineTo(left, top + bh); ctx.lineTo(left + corner, top + bh);
        ctx.moveTo(left + bw - corner, top + bh); ctx.lineTo(left + bw, top + bh); ctx.lineTo(left + bw, top + bh - corner);
        ctx.stroke();

        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.strokeStyle = activeColor;
        if (activeTarget.shape === "bottle") {
          ctx.fillRect(cx - 34, cy - 32, 68, 102);
          ctx.fillRect(cx - 18, cy - 52, 36, 20);
          ctx.fillRect(cx - 12, cy - 66, 24, 14);
          ctx.fillStyle = activeColor;
          ctx.fillRect(cx - 26, cy - 4, 52, 26);
        } else if (activeTarget.shape === "solar") {
          ctx.fillRect(cx - 76, cy - 46, 152, 92);
          ctx.strokeStyle = "rgb(17,24,39)";
          ctx.lineWidth = 2;
          for (let px = -38; px <= 38; px += 38) {
            ctx.beginPath();
            ctx.moveTo(cx + px, cy - 46);
            ctx.lineTo(cx + px, cy + 46);
            ctx.stroke();
          }
          for (let py = -15; py <= 15; py += 30) {
            ctx.beginPath();
            ctx.moveTo(cx - 76, cy + py);
            ctx.lineTo(cx + 76, cy + py);
            ctx.stroke();
          }
        } else {
          ctx.fillRect(cx - 64, cy - 52, 128, 104);
          ctx.strokeStyle = "rgb(17,24,39)";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(cx, cy - 52);
          ctx.lineTo(cx, cy + 52);
          ctx.stroke();
          ctx.fillStyle = activeColor;
          ctx.fillRect(cx - 50, cy - 34, 38, 10);
          ctx.fillRect(cx - 50, cy - 14, 38, 8);
          ctx.fillRect(cx + 12, cy - 34, 38, 28);
        }

        const scanY = top + ((Math.sin(scanT) + 1) / 2) * bh;
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(left + 8, scanY);
        ctx.lineTo(left + bw - 8, scanY);
        ctx.stroke();

        const tagAr =
          activeTarget.shape === "solar"
            ? "خلية شمسية"
            : activeTarget.shape === "book"
              ? "مرجع دراسي"
              : "إعادة تدوير";
        ctx.fillStyle = activeColor;
        ctx.fillRect(left, top - 30, bw, 26);
        ctx.fillStyle = "rgb(17,24,39)";
        (ctx as unknown as { direction?: string }).direction = "rtl";
        ctx.textAlign = "center";
        ctx.font = 'bold 13px "Alexandria", "IBM Plex Sans Arabic", sans-serif';
        ctx.fillText(
          `${tagAr} · ${activeTarget.confidence}`,
          cx,
          top - 12,
        );
      } else {
        rocket.x += rocket.vx;
        rocket.vy += rocket.grav;
        rocket.y += rocket.vy;
        rocket.trail.push({ x: rocket.x, y: rocket.y });
        if (rocket.trail.length > 48) rocket.trail.shift();

        if (rocket.x > w + 24 || rocket.y > h - 22) {
          rocket.x = 72;
          rocket.y = 215;
          rocket.vy = gravityMode === "low" ? -5.5 : -6.9;
          rocket.trail = [];
        }

        ctx.strokeStyle = cyan;
        ctx.lineWidth = 2;
        ctx.beginPath();
        rocket.trail.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        ctx.fillStyle = amber;
        ctx.fillRect(rocket.x - 6, rocket.y - 6, 12, 12);

        ctx.fillStyle = "rgba(255,255,255,0.9)";
        (ctx as unknown as { direction?: string }).direction = "rtl";
        ctx.textAlign = "right";
        ctx.font = 'bold 13px "Alexandria", "IBM Plex Sans Arabic", sans-serif';
        ctx.fillText(
          `الجاذبية: ${gravityMode === "low" ? "0.16g القمر" : "1.00g الأرض"}  |  السرعة: ${Math.abs(rocket.vy).toFixed(1)}`,
          w - 20,
          28,
        );
      }
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [activeTarget, mode, gravityMode, launchCount]);

  return (
    <section
      id="academy-lab"
      aria-label="المعمل التفاعلي المباشر"
      className="glazier-scope w-full"
    >
      <div className="max-w-7xl mx-auto glazier-xl-x">
        <div className="glazier-b grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-8 glazier-seeded p-6 sm:p-10 space-y-2">
            <h2 className="glazier-heading text-2xl sm:text-3xl font-bold leading-snug">
              {settings?.title ||
                "جرّب بنفسك نماذج الرؤية والفيزياء التي يبرمجها طلابنا"}
            </h2>
            <p className="glazier-muted text-sm sm:text-base max-w-2xl">
              {settings?.subtitle ||
                "اختبر محاكاة الكشف الذكي أو حساب الجاذبية مباشرة داخل المتصفح كما ينفذها الطلاب في الحصص."}
            </p>
          </div>
          <div className="lg:col-span-4 glazier-t lg:border-t-0 glazier-lg-s flex">
            <Link
              to={settings?.ctaLink || "/registration"}
              className="glazier-pane-berry w-full min-h-[64px] px-6 py-5 text-sm sm:text-base font-bold flex items-center justify-between gap-2"
            >
              <span>{settings?.ctaText || "احجز حصة التقييم المجانية"}</span>
              <svg
                width="17"
                height="17"
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

        {/* Optical Lab Partition Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Control Panes */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div className="glazier-b grid grid-cols-2">
              <button
                type="button"
                onClick={() => setMode("vision")}
                className={`glazier-e min-h-[54px] px-4 py-3 text-xs sm:text-sm font-bold text-center ${
                  mode === "vision" ? "glazier-pane-cobalt" : "glazier-clear"
                }`}
              >
                {settings?.visionTabLabel || "مختبر PictoBlox AI"}
              </button>
              <button
                type="button"
                onClick={() => setMode("rocket")}
                className={`min-h-[54px] px-4 py-3 text-xs sm:text-sm font-bold text-center ${
                  mode === "rocket" ? "glazier-pane-cobalt" : "glazier-clear"
                }`}
              >
                {settings?.physicsTabLabel || "محاكاة Python الفيزيائية"}
              </button>
            </div>

            {mode === "vision" ? (
              <div className="flex-1 flex flex-col">
                {targets.map((item) => {
                  const selected = item.key === activeTarget.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveKey(item.key)}
                      className={`glazier-b flex-1 min-h-[68px] p-4 sm:px-5 text-start flex items-center justify-between gap-3 ${
                        selected ? "glazier-pane-berry" : "glazier-clear"
                      }`}
                    >
                      <span className="text-sm font-bold">{item.chipLabel}</span>
                      <span className="font-mono tabular-nums text-xs font-bold shrink-0">
                        {item.confidence}
                      </span>
                    </button>
                  );
                })}
                <div className="glazier-seeded p-4 sm:px-5 text-xs sm:text-sm glazier-muted">
                  {activeTarget.resultLabel}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex flex-col flex-1">
                  <button
                    type="button"
                    onClick={() => setGravityMode("low")}
                    className={`glazier-b flex-1 min-h-[68px] p-5 text-start flex items-center justify-between ${
                      gravityMode === "low" ? "glazier-pane-cobalt" : "glazier-clear"
                    }`}
                  >
                    <span className="text-sm font-bold">جاذبية القمر</span>
                    <span className="font-mono tabular-nums text-xs font-bold">
                      0.16g
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGravityMode("earth")}
                    className={`glazier-b flex-1 min-h-[68px] p-5 text-start flex items-center justify-between ${
                      gravityMode === "earth"
                        ? "glazier-pane-cobalt"
                        : "glazier-clear"
                    }`}
                  >
                    <span className="text-sm font-bold">جاذبية الأرض</span>
                    <span className="font-mono tabular-nums text-xs font-bold">
                      1.00g
                    </span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setLaunchCount((n) => n + 1)}
                  className="glazier-pane-amber min-h-[56px] px-5 py-4 text-sm font-bold text-center"
                >
                  إعادة إطلاق المسار البرمجي
                </button>
              </div>
            )}
          </div>

          {/* Darkroom Observation Window */}
          <div className="lg:col-span-8 glazier-t glazier-lg-t-0 glazier-lg-s glazier-chamber flex flex-col justify-between min-h-[290px]">
            <div className="p-3 sm:p-4 flex items-center justify-between border-b border-white/15">
              <span className="text-xs font-semibold text-white/85">
                {mode === "vision"
                  ? "مختبر الرؤية الحاسوبية · PictoBlox AI"
                  : "محاكاة المسار الفيزيائي · Python"}
              </span>
              <span className="font-mono tabular-nums text-xs text-emerald-400">
                نشط
              </span>
            </div>
            <div className="p-4 flex-1 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={640}
                height={290}
                dir="ltr"
                className="glazier-canvas w-full h-auto max-h-[290px] block"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AcademyInteractiveLab;

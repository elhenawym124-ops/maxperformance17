import React, { useState, useEffect, useRef } from 'react';
import type { HeroVariantProps } from './heroTypes';
import { renderHeroAction } from './heroActions';
import { Terminal, Bot, Sparkles, CheckCircle2, PlayCircle, ArrowLeft, Layers, ShieldCheck, Zap } from 'lucide-react';

export const SkillLabAcademyHero: React.FC<HeroVariantProps> = (props) => {
  const eyebrow = props.eyebrow || 'أكاديمية النخبة البرمجية • مسارات 2026 المتقدمة';
  const title = props.title || 'تعلّم مهارات هندسية فائقة وانضم إلى صفوة المطورين';
  const subtitle = props.subtitle || 'مسارات مكثفة لنقلك من مرحلة المطور التقليدي إلى بناء أنظمة معقدة، شبكات وكلاء الذكاء الاصطناعي، وواجهات موشن فائقة الأداء (60 FPS) تنافس عالمياً.';

  // Interactive Tab State for Sandbox Cockpit
  const [activeTab, setActiveTab] = useState<'agent' | 'motion' | 'architecture'>('agent');

  // 3D Tilt Physics State
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Canvas Ref for Interactive Particle Network (ultimate-animation-skill-pack)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.offsetHeight || 600);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.offsetHeight || 600;
    };
    window.addEventListener('resize', handleResize);

    const particleCount = Math.min(Math.floor((width * height) / 11000), 75);
    const colors = ['#22c55e', '#38bdf8', '#a855f7', '#4ade80'];

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      baseAlpha: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.75,
        vy: (Math.random() - 0.5) * 0.75,
        radius: Math.random() * 2.2 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        baseAlpha: Math.random() * 0.6 + 0.35,
      });
    }

    const mouse = { x: -1000, y: -1000, radius: 150 };
    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handlePointerLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('mouseleave', handlePointerLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        // Mouse repulsion & attraction field
        const dxMouse = mouse.x - p1.x;
        const dyMouse = mouse.y - p1.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < mouse.radius) {
          const force = (mouse.radius - distMouse) / mouse.radius;
          p1.x -= (dxMouse / distMouse) * force * 3.5;
          p1.y -= (dyMouse / distMouse) * force * 3.5;
        }

        // Draw particle dot with glow
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.globalAlpha = p1.baseAlpha;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p1.color;
        ctx.fill();

        // Dynamic Constellation lines between nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 115) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p1.color;
            ctx.globalAlpha = (1 - dist / 115) * 0.25;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }
      }

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = Number((((y - centerY) / centerY) * -8).toFixed(2));
    const rotateY = Number((((x - centerX) / centerX) * 8).toFixed(2));

    setTilt({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  const metrics = [
    { label: 'مهندس وخريج تم تأهيلهم', value: '4,200+', desc: 'سوق العمل المحلي والدولي' },
    { label: 'نسبة إتمام المسارات', value: '96.4%', desc: 'إشراف ومراجعة كود أسبوعية' },
    { label: 'مشروع عملي Production-Ready', value: '38+', desc: 'أنظمة متكاملة قابلة للنشر' },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-[#07090E] pt-10 pb-16 sm:py-20 lg:py-24 text-white">
      {/* Interactive Particle Constellation Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-90"
      />

      {/* Background Ambient Glow Orbs */}
      <div className="pointer-events-none absolute -top-40 right-1/4 h-[550px] w-[550px] rounded-full bg-emerald-500/15 blur-[140px] animate-pulse" />
      <div className="pointer-events-none absolute top-1/2 -left-40 h-[500px] w-[500px] rounded-full bg-sky-500/12 blur-[150px]" />
      
      {/* Precision Grid Blueprint */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #22c55e 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-12">
          
          {/* Left Column: Academy Narrative & Value Proposition (7 Cols) */}
          <div className="lg:col-span-7 space-y-6 text-right">
            
            {/* Live Batch Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-emerald-300 backdrop-blur-md shadow-[0_0_20px_rgba(34,197,94,0.15)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span>{eyebrow}</span>
              <span className="text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded text-emerald-300 font-mono border border-emerald-800/60 hidden sm:inline-block">
                ⚡ Interactive Particles Active
              </span>
            </div>

            {/* Headline with Brand Gradient */}
            <h1 className="font-heading text-3xl sm:text-5xl lg:text-[3.4rem] font-black tracking-tight text-white leading-[1.2] lg:leading-[1.15]">
              اصنع برمجيات{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">
                فائقة الأداء
              </span>{' '}
              وتجاوز الحدود التقليدية
            </h1>

            {/* Subtitle */}
            <p className="max-w-2xl text-sm sm:text-base lg:text-lg text-slate-300 font-normal leading-relaxed">
              {subtitle}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              {renderHeroAction(
                props.primaryHref || '/shop',
                props.ctaText || 'استكشف المسارات واشترك الآن',
                'inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-7 py-3 text-sm sm:text-base shadow-[0_12px_36px_-12px_rgba(34,197,94,0.6)] transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer'
              )}
              {renderHeroAction(
                props.secondaryHref || '/collections',
                props.secondaryCtaText || 'مشاهدة المنهج والمشاريع',
                'inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl border border-slate-700/90 bg-slate-900/80 hover:bg-slate-800 text-white font-bold px-6 py-3 text-sm sm:text-base backdrop-blur-md transition-all active:scale-95 cursor-pointer'
              )}
            </div>

            {/* Verified Student Metrics Bar */}
            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-3 sm:gap-6">
              {metrics.map((metric, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">
                    {metric.label}
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 tabular-nums">
                    {metric.value}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block truncate">
                    {metric.desc}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right Column: 3D Mouse Tilt Sandbox Cockpit (5 Cols) */}
          <div className="lg:col-span-5 relative">
            <div
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={handleMouseLeave}
              style={{
                transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(${isHovered ? 1.02 : 1}, ${isHovered ? 1.02 : 1}, 1)`,
                transition: isHovered ? 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)' : 'transform 0.5s ease',
              }}
              className="relative rounded-2xl border border-white/10 bg-slate-900/90 p-4 sm:p-5 shadow-[0_24px_64px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl will-change-transform"
            >
              {/* Cockpit Window Top Header */}
              <div className="mb-4 flex items-center justify-between border-b border-slate-800/90 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300">
                  <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                  <span>skill-lab-kernel.ts</span>
                </div>
                <span className="rounded-md bg-emerald-950/80 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400 animate-bounce" />
                  <span>60 FPS Live</span>
                </span>
              </div>

              {/* Interactive Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950/80 border border-slate-800/80 mb-3 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('agent')}
                  className={`flex-1 py-1.5 px-2 rounded-md font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'agent' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>وكلاء الذكاء</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('motion')}
                  className={`flex-1 py-1.5 px-2 rounded-md font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'motion' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>GSAP Motion</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('architecture')}
                  className={`flex-1 py-1.5 px-2 rounded-md font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'architecture' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>معمارية النظم</span>
                </button>
              </div>

              {/* Live Sandbox Terminal Code Block */}
              <div className="rounded-xl bg-[#05070B] p-3.5 font-mono text-[11px] leading-relaxed text-slate-300 border border-slate-800/80 text-left overflow-x-auto min-h-[140px] flex flex-col justify-center">
                {activeTab === 'agent' && (
                  <div>
                    <div className="text-slate-500">// Microsoft Agent & MCP Protocol Swarm</div>
                    <div><span className="text-purple-400">const</span> swarm = <span className="text-purple-400">new</span> <span className="text-amber-300">MultiAgentSwarm</span>({'{'} concurrency: <span className="text-rose-400">4</span> {'}'});</div>
                    <div><span className="text-blue-400">await</span> swarm.<span className="text-amber-300">delegate</span>({'{'} task: <span className="text-emerald-400">'Autonomous Code Audit'</span> {'}'});</div>
                    <div className="text-emerald-400 mt-2">✓ 0 Blast-Radius Verified across all modules</div>
                    <div className="text-sky-400">✓ Context Memory Tier-3 synced successfully</div>
                  </div>
                )}
                {activeTab === 'motion' && (
                  <div>
                    <div className="text-slate-500">// Lenis + GSAP 60 FPS Particle Engine</div>
                    <div><span className="text-purple-400">const</span> lenis = <span className="text-purple-400">new</span> <span className="text-amber-300">Lenis</span>({'{'} duration: <span className="text-rose-400">1.2</span>, smooth: <span className="text-teal-400">true</span> {'}'});</div>
                    <div>ScrollTrigger.<span className="text-amber-300">sync</span>(lenis);</div>
                    <div className="text-emerald-400 mt-2">✓ Canvas Particle Network: 75 connected nodes</div>
                    <div className="text-sky-400">✓ GPU Transform3D acceleration: ON</div>
                  </div>
                )}
                {activeTab === 'architecture' && (
                  <div>
                    <div className="text-slate-500">// Enterprise Microservices & Multi-Tenancy</div>
                    <div><span className="text-purple-400">const</span> tenant = <span className="text-blue-400">await</span> db.<span className="text-amber-300">resolveTenant</span>({'{'} companyId {'}'});</div>
                    <div><span className="text-purple-400">const</span> queue = <span className="text-purple-400">new</span> <span className="text-amber-300">BullMQWorker</span>({'{'} concurrency: <span className="text-rose-400">20</span> {'}'});</div>
                    <div className="text-emerald-400 mt-2">✓ Zero-Downtime Hot Reloading Active</div>
                    <div className="text-sky-400">✓ Redis Cluster P99 Latency: 1.2ms</div>
                  </div>
                )}
              </div>

              {/* Student Live Progress Card */}
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-right">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">مراجعة كود فردية معتمدة</span>
                    <span className="text-[10px] text-slate-400">ملاحظات دقيقة على كل Pull Request</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800/50">
                  Passed 100%
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

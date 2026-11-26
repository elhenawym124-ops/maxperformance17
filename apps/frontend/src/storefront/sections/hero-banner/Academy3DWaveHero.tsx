import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { HeroVariantProps } from './heroTypes';
import { isExternalHref, renderHeroAction } from './heroActions';
import { Link } from 'react-router-dom';
import '../../styles/academy-stage.css';

const DEFAULT_AMBIENT_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261020_065130_c7de1c6f-c1d5-4abf-97d5-fd14ead36d75.mp4';

export interface Academy3DCardItem {
  title: string;
  tag: string;
  age: string;
  desc: string;
  bgColor?: string;
  accentColor?: string;
  pattern?: 'wave' | 'rings' | 'grid' | 'bars' | 'dots';
}

const DEFAULT_CARDS: Academy3DCardItem[] = [
  {
    title: 'تصميم الألعاب الأولى',
    tag: 'Logic & Games',
    age: '7–9 سنوات',
    desc: 'بناء ألعاب وقصص تفاعلية بتفكير منطقي منظم وخطوات عملية.',
    bgColor: '#013735',
    accentColor: '#FFAE91',
    pattern: 'rings',
  },
  {
    title: 'مشاريع الذكاء الاصطناعي',
    tag: 'Vision AI',
    age: '10–12 سنة',
    desc: 'تدريب نماذج ذكية تتعرف على الصور والأصوات وتحل مشكلات واقعية.',
    bgColor: '#16242B',
    accentColor: '#38BDF8',
    pattern: 'grid',
  },
  {
    title: 'تطبيقات الويب و Python',
    tag: 'Python & Web',
    age: '13–17 سنة',
    desc: 'كتابة كود حقيقي وبناء مواقع وتطبيقات متكاملة جاهزة للعرض.',
    bgColor: '#2C1B47',
    accentColor: '#C4B5FD',
    pattern: 'bars',
  },
  {
    title: 'ريادة الأعمال والعرض',
    tag: 'Startup & Pitch',
    age: 'كل الأعمار',
    desc: 'تحويل الفكرة لمشروع متكامل وتقديمه بثقة أمام لجنة التحكيم.',
    bgColor: '#D95D39',
    accentColor: '#FAF8F5',
    pattern: 'wave',
  },
  {
    title: 'الروبوتات والمستشعرات',
    tag: 'Hardware Lab',
    age: '9–14 سنة',
    desc: 'ربط البرمجة بالدوائر الإلكترونية والمستشعرات لبناء ابتكارات ذكية.',
    bgColor: '#14452F',
    accentColor: '#86EFAC',
    pattern: 'dots',
  },
  {
    title: 'تطبيقات الموبايل الذكية',
    tag: 'Mobile Apps',
    age: '12–15 سنة',
    desc: 'تصميم وبرمجة تطبيقات هاتف تفاعلية بواجهات عصرية.',
    bgColor: '#1E293B',
    accentColor: '#FBBF24',
    pattern: 'grid',
  },
];

function createCardTexture(card: Academy3DCardItem): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 700;
  const g = canvas.getContext('2d');
  if (!g) {
    return new THREE.CanvasTexture(canvas);
  }

  const bg = card.bgColor || '#013735';
  const accent = card.accentColor || '#FFAE91';

  const grad = g.createLinearGradient(0, 0, 512, 700);
  grad.addColorStop(0, bg);
  grad.addColorStop(1, '#0B1014');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 700);

  g.save();
  g.strokeStyle = accent;
  g.fillStyle = accent;
  const pattern = card.pattern || 'wave';
  if (pattern === 'rings') {
    g.globalAlpha = 0.24;
    g.lineWidth = 4;
    for (let r = 48; r <= 200; r += 36) {
      g.beginPath();
      g.arc(256, 310, r, 0, Math.PI * 2);
      g.stroke();
    }
  } else if (pattern === 'grid') {
    g.globalAlpha = 0.22;
    g.lineWidth = 2;
    for (let x = 48; x < 480; x += 48) {
      g.beginPath();
      g.moveTo(x, 120);
      g.lineTo(x, 480);
      g.stroke();
    }
    for (let y = 120; y < 480; y += 48) {
      g.beginPath();
      g.moveTo(48, y);
      g.lineTo(464, y);
      g.stroke();
    }
    g.globalAlpha = 0.85;
    g.lineWidth = 5;
    g.strokeRect(156, 200, 200, 180);
  } else if (pattern === 'bars') {
    g.globalAlpha = 0.35;
    [120, 210, 160, 260, 190].forEach((bh, idx) => {
      g.fillRect(88 + idx * 72, 430 - bh, 44, bh);
    });
  } else if (pattern === 'dots') {
    g.globalAlpha = 0.35;
    for (let x = 70; x <= 442; x += 46) {
      for (let y = 150; y <= 440; y += 46) {
        g.beginPath();
        g.arc(x, y, 6, 0, Math.PI * 2);
        g.fill();
      }
    }
  } else {
    g.globalAlpha = 0.3;
    g.lineWidth = 5;
    for (let k = 0; k < 5; k++) {
      g.beginPath();
      for (let x = 40; x <= 472; x += 12) {
        const y = 300 + Math.sin(x * 0.02 + k * 0.7) * (42 + k * 10);
        if (x === 40) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
    }
  }
  g.restore();

  const glow = g.createRadialGradient(256, 300, 10, 256, 300, 150);
  glow.addColorStop(0, accent);
  glow.addColorStop(1, 'transparent');
  g.save();
  g.globalAlpha = 0.36;
  g.fillStyle = glow;
  g.fillRect(60, 130, 392, 340);
  g.restore();

  g.fillStyle = 'rgba(255,255,255,0.14)';
  g.beginPath();
  g.roundRect(40, 44, 195, 46, 23);
  g.fill();

  g.fillStyle = accent;
  g.font = '600 20px "IBM Plex Mono", monospace';
  g.textAlign = 'left';
  g.fillText(card.tag.slice(0, 16), 58, 74);

  g.fillStyle = 'rgba(255,255,255,0.88)';
  g.font = '600 22px "IBM Plex Sans Arabic", sans-serif';
  g.textAlign = 'right';
  g.fillText(card.age, 470, 74);

  g.fillStyle = '#FFFFFF';
  g.font = '700 34px "IBM Plex Sans Arabic", sans-serif';
  g.fillText(card.title.slice(0, 26), 470, 565);

  g.fillStyle = accent;
  g.fillRect(350, 595, 120, 6);

  g.fillStyle = 'rgba(255,255,255,0.78)';
  g.font = '400 20px "IBM Plex Sans Arabic", sans-serif';
  g.fillText(card.desc.slice(0, 38), 470, 642);

  // Subtle architectural luminous rim on card cover
  g.strokeStyle = 'rgba(255,255,255,0.22)';
  g.lineWidth = 3;
  g.strokeRect(10, 10, 492, 680);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export const Academy3DWaveHero: React.FC<HeroVariantProps> = (props) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const watermarkRef = useRef<HTMLDivElement | null>(null);

  const cardsList: Academy3DCardItem[] =
    Array.isArray(props.academyCards) && props.academyCards.length > 0
      ? props.academyCards
      : DEFAULT_CARDS;

  const [hudCard, setHudCard] = useState<Academy3DCardItem>(cardsList[0]);
  const [hudIndex, setHudIndex] = useState<number>(0);
  const [selectedCard, setSelectedCard] = useState<Academy3DCardItem | null>(null);
  const [webglReady, setWebglReady] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [allowVideo, setAllowVideo] = useState(false);

  const watermarkText = props.watermarkText || props.brandName || 'ACADEMY 3D';
  const ambientVideoUrl = props.videoUrl ?? DEFAULT_AMBIENT_VIDEO_URL;
  const hintText =
    props.hintText || 'حرّك المؤشر أو اضغط على البطاقات ثلاثية الأبعاد لاستكشاف المسارات';
  const trustPills =
    Array.isArray(props.trustPills) && props.trustPills.length > 0
      ? props.trustPills
      : ['مجموعات صغيرة وإشراف مباشر', 'مشاريع عملية قابلة للعرض', 'تقرير أسبوعي لولي الأمر'];

  useEffect(() => {
    setHudCard(cardsList[0]);
    setHudIndex(0);
  }, [cardsList]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setAllowVideo(!reduced && Boolean(ambientVideoUrl));
  }, [ambientVideoUrl]);

  useEffect(() => {
    const heroWrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!heroWrap || !canvas) return;

    let rafId = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let pmrem: THREE.PMREMGenerator | null = null;
    let envTarget: THREE.WebGLRenderTarget | null = null;
    let sharedGeo: THREE.BoxGeometry | null = null;
    const disposables: Array<{ dispose: () => void }> = [];

    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(heroWrap.clientWidth || 1200, heroWrap.clientHeight || 720, false);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      const scene = new THREE.Scene();
      pmrem = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      envTarget = pmrem.fromScene(roomEnv, 0.04);
      roomEnv.dispose();
      scene.environment = envTarget.texture;
      scene.environmentIntensity = 0.65;

      const keyLight = new THREE.DirectionalLight('#fff2e2', 2.2);
      keyLight.position.set(-4, 6, 7);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight('#9ae6d4', 1.2);
      rimLight.position.set(6, 3, -4);
      scene.add(rimLight);

      scene.add(new THREE.AmbientLight('#ffffff', 0.25));

      const camera = new THREE.PerspectiveCamera(
        24,
        (heroWrap.clientWidth || 1200) / Math.max(1, heroWrap.clientHeight || 720),
        0.1,
        100,
      );

      const updateCamera = () => {
        if (!heroWrap || !renderer) return;
        const w = heroWrap.clientWidth || 1200;
        const h = Math.max(1, heroWrap.clientHeight || 720);
        camera.aspect = w / h;
        camera.fov = w < h ? 44 : 23;
        camera.position.set(w < h ? 2.4 : 2.9, 1.85, w < h ? 8.8 : 8.2);
        camera.lookAt(-1.2, w < h ? 0.05 : -0.35, -0.4);
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      };
      updateCamera();

      const COUNT = 18;
      sharedGeo = new THREE.BoxGeometry(1.12, 1.54, 0.14);
      const edgeMat = new THREE.MeshStandardMaterial({ color: '#E8E3D9', roughness: 0.75 });
      const backMat = new THREE.MeshPhysicalMaterial({
        color: '#0f172a',
        roughness: 0.45,
        clearcoat: 0.4,
      });
      disposables.push(edgeMat, backMat);

      const cards: Array<{
        mesh: THREE.Mesh;
        card: Academy3DCardItem;
        y: number;
        vy: number;
        z: number;
        vz: number;
      }> = [];

      for (let i = 0; i < COUNT; i++) {
        const item = cardsList[i % cardsList.length];
        const tex = createCardTexture(item);
        const frontMat = new THREE.MeshPhysicalMaterial({
          map: tex,
          roughness: 0.28,
          clearcoat: 0.72,
          clearcoatRoughness: 0.22,
        });
        const spineMat = new THREE.MeshPhysicalMaterial({
          color: item.bgColor || '#013735',
          roughness: 0.4,
          clearcoat: 0.45,
        });
        disposables.push(tex, frontMat, spineMat);

        const mesh = new THREE.Mesh(sharedGeo, [
          edgeMat,
          spineMat,
          edgeMat,
          edgeMat,
          frontMat,
          backMat,
        ]);

        const grp = new THREE.Group();
        grp.position.set(2.05 + i * -0.48, -1.22, 1.1 + i * -0.22);
        grp.rotation.y = 0.34;
        mesh.position.y = -3.2;
        grp.add(mesh);
        scene.add(grp);

        cards.push({ mesh, card: item, y: -3.2, vy: 0, z: 0, vz: 0 });
      }

      const pointer = { x: -9999, y: -9999, nx: 0, ny: 0, active: false, lastMove: 0 };
      const raycaster = new THREE.Raycaster();
      const pointerNDC = new THREE.Vector2();

      const onPointerMove = (e: PointerEvent) => {
        const rect = heroWrap.getBoundingClientRect();
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
        pointer.nx = (pointer.x / Math.max(1, rect.width)) * 2 - 1;
        pointer.ny = (pointer.y / Math.max(1, rect.height)) * 2 - 1;
        pointer.active = true;
        pointer.lastMove = performance.now();

        heroWrap.style.setProperty('--mx', `${pointer.x}px`);
        heroWrap.style.setProperty('--my', `${pointer.y}px`);
        if (watermarkRef.current) {
          watermarkRef.current.style.transform = `translate3d(${(-pointer.nx * 22).toFixed(1)}px, ${(-pointer.ny * 12).toFixed(1)}px, 0)`;
        }
      };

      const onPointerLeave = () => {
        pointer.active = false;
      };

      const onCanvasClick = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        pointerNDC.x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
        pointerNDC.y = -((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
        raycaster.setFromCamera(pointerNDC, camera);
        const hits = raycaster.intersectObjects(
          cards.map((c) => c.mesh),
          false,
        );
        if (hits.length > 0) {
          const hit = cards.find((c) => c.mesh === hits[0].object);
          if (hit) setSelectedCard(hit.card);
        }
      };

      heroWrap.addEventListener('pointermove', onPointerMove);
      heroWrap.addEventListener('pointerleave', onPointerLeave);
      canvas.addEventListener('click', onCanvasClick);

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const startTime = performance.now();
      let lastTime = startTime;
      let inView = true;
      let activeIdx = 0;
      let camShiftX = 0;
      let camShiftY = 0;

      const visIO = new IntersectionObserver(
        (entries) => {
          inView = Boolean(entries[0]?.isIntersecting);
        },
        { threshold: 0.05 },
      );
      visIO.observe(heroWrap);

      const resizeObs = new ResizeObserver(updateCamera);
      resizeObs.observe(heroWrap);

      const projVec = new THREE.Vector3();
      const animate = (now: number) => {
        rafId = requestAnimationFrame(animate);
        if (!inView || !renderer) return;

        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;
        const elapsed = (now - startTime) / 1000;
        const w = heroWrap.clientWidth || 1200;
        const h = Math.max(1, heroWrap.clientHeight || 720);

        const targetCamX = pointer.active ? pointer.nx * 0.42 : 0;
        const targetCamY = pointer.active ? -pointer.ny * 0.24 : 0;
        camShiftX += (targetCamX - camShiftX) * 0.08;
        camShiftY += (targetCamY - camShiftY) * 0.08;
        camera.position.x = (w < h ? 2.4 : 2.85) + camShiftX;
        camera.position.y = 1.72 + camShiftY;
        camera.lookAt(-1.2, w < h ? 0.05 : -0.18, -0.4);

        let px = pointer.x;
        let py = pointer.y;
        const isIdle = !pointer.active || now - pointer.lastMove > 3200;
        if (isIdle && !reduced) {
          const u = (Math.sin(elapsed * 0.65) + 1) * 0.5;
          px = w * (0.2 + 0.62 * u);
          py = h * 0.66;
        } else if (isIdle && reduced) {
          px = -9999;
          py = -9999;
        }

        const K = 75;
        const C = 11.5;
        const sub = 4;
        const step = dt / sub;
        const spread = Math.max(w, h) * 0.125;

        let bestInf = 0;
        let bestIdx = activeIdx;

        for (let i = 0; i < cards.length; i++) {
          const c = cards[i];
          const ready = elapsed > 0.12 + (COUNT - i) * 0.025;

          projVec.set(0, 0.15, 0);
          c.mesh.localToWorld(projVec);
          projVec.project(camera);
          const sx = (projVec.x * 0.5 + 0.5) * w;
          const sy = (-projVec.y * 0.5 + 0.5) * h;

          const dx = sx - px;
          const dy = (sy - py) * 0.65;
          const inf = ready && px > -1000 ? Math.exp(-(dx * dx + dy * dy) / (spread * spread)) : 0;

          if (inf > bestInf) {
            bestInf = inf;
            bestIdx = i;
          }

          const targetY = ready ? inf * 1.18 : -3.2;
          const targetZ = ready ? inf * 0.82 : 0;

          for (let s = 0; s < sub; s++) {
            c.vy += ((targetY - c.y) * K - c.vy * C) * step;
            c.y += c.vy * step;
            c.vz += ((targetZ - c.z) * K - c.vz * C) * step;
            c.z += c.vz * step;
          }

          c.mesh.position.y = c.y;
          c.mesh.position.z = c.z;
          c.mesh.rotation.x = -c.vy * 0.015;
          c.mesh.rotation.y = -inf * 0.36;
        }

        canvas.style.cursor = bestInf > 0.35 ? 'pointer' : 'grab';

        if (bestIdx !== activeIdx && bestInf > 0.25) {
          activeIdx = bestIdx;
          setHudCard(cards[bestIdx].card);
          setHudIndex(bestIdx % cardsList.length);
        }

        renderer.render(scene, camera);
      };

      rafId = requestAnimationFrame(animate);

      return () => {
        cancelAnimationFrame(rafId);
        visIO.disconnect();
        resizeObs.disconnect();
        heroWrap.removeEventListener('pointermove', onPointerMove);
        heroWrap.removeEventListener('pointerleave', onPointerLeave);
        canvas.removeEventListener('click', onCanvasClick);
        sharedGeo?.dispose();
        disposables.forEach((d) => d.dispose());
        envTarget?.dispose();
        pmrem?.dispose();
        renderer?.dispose();
      };
    } catch {
      setWebglReady(false);
      return undefined;
    }
  }, [cardsList]);

  return (
    <section
      ref={wrapRef}
      dir="rtl"
      className="relative overflow-hidden min-h-[88vh] md:min-h-[90vh] flex flex-col justify-between pt-20 pb-7 md:pt-24 md:pb-8 text-white bg-[#060913]"
      style={{
        background:
          props.heroBgFrom && props.heroBgTo
            ? `radial-gradient(110% 85% at 50% 0%, ${props.heroBgFrom} 0%, ${props.heroBgTo} 58%, #060913 100%)`
            : 'radial-gradient(110% 85% at 50% 0%, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.55) 45%, #060913 100%)',
      }}
    >
      {/* Optional MotionSites Ambient Video Layer (fails silently under reduced motion or network block) */}
      {allowVideo && !videoFailed && ambientVideoUrl && (
        <video
          aria-hidden="true"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
          className={`pointer-events-none absolute inset-0 w-full h-full object-cover mix-blend-screen z-[0] transition-opacity duration-1000 ${
            videoReady ? 'opacity-[0.22]' : 'opacity-0'
          }`}
          src={ambientVideoUrl}
        />
      )}

      {/* Protective Calm Readability Scrim over Top Text Band */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(ellipse 75% 60% at 70% 24%, rgba(6, 9, 19, 0.72) 0%, rgba(6, 9, 19, 0.25) 65%, transparent 100%)',
        }}
      />

      {/* Interactive Cursor Spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(560px circle at var(--mx, 50%) var(--my, 55%), hsl(var(--accent) / 0.24), rgba(56,189,248,0.08) 42%, transparent 72%)',
        }}
      />

      {/* Studio Film Grain Overlay */}
      <div className="acad-grain z-[1]" aria-hidden="true" />

      {/* Giant Architectural Watermark */}
      <div
        ref={watermarkRef}
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-x-0 top-20 md:top-24 z-[1] text-center font-bold leading-none whitespace-nowrap text-white/[0.04]"
        style={{ fontSize: 'clamp(72px, 18vw, 240px)', letterSpacing: 0 }}
      >
        {watermarkText}
      </div>

      {/* Real-Time Three.js 3D Wave Canvas */}
      {webglReady && (
        <canvas
          ref={canvasRef}
          aria-label="معرض المسارات والمشاريع ثلاثي الأبعاد"
          className="absolute inset-0 w-full h-full z-[2] block"
        />
      )}

      {/* Smooth Obsidian Bottom Edge Melt (eliminates sharp seam into next section) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 z-[3]"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, #060913 100%)',
        }}
      />

      {/* Copy + Liquid-Glass Telemetry HUD */}
      <div className="relative z-[4] max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-start pointer-events-none">
        <div className="md:col-span-8 pointer-events-auto space-y-4">
          <div
            className="acad-glass acad-in-down inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-white/95"
            style={{ '--acad-d': '0ms' } as React.CSSProperties}
          >
            {props.logoUrl ? (
              <img
                src={props.logoUrl}
                alt={props.brandName || 'شعار الأكاديمية'}
                className="w-6 h-6 rounded-full object-cover bg-white p-0.5 shrink-0"
              />
            ) : (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: 'hsl(var(--accent))' }}
              />
            )}
            <span>{props.eyebrow || 'تعليم تطبيقي وصناعة مشاريع حقيقية'}</span>
          </div>

          <h1
            className="acad-in-blur text-3xl sm:text-5xl lg:text-[58px] font-bold text-white leading-[1.12] max-w-3xl [text-wrap:balance]"
            style={{ letterSpacing: 0, '--acad-d': '40ms' } as React.CSSProperties}
          >
            <span>{props.title}</span>
            {props.titleHighlight && (
              <span
                className="block mt-1.5 text-transparent bg-clip-text"
                style={{
                  backgroundImage:
                    'linear-gradient(90deg, #ffffff 0%, #f8fafc 45%, hsl(var(--accent)) 100%)',
                }}
              >
                {props.titleHighlight}
              </span>
            )}
          </h1>

          {props.subtitle && (
            <p
              className="acad-in-blur text-sm sm:text-lg text-white/80 max-w-2xl leading-relaxed"
              style={{ '--acad-d': '80ms', '--acad-blur': '3px' } as React.CSSProperties}
            >
              {props.subtitle}
            </p>
          )}

          <div
            className="acad-in-blur flex flex-wrap items-center gap-3 pt-2"
            style={{ '--acad-d': '120ms', '--acad-blur': '2px' } as React.CSSProperties}
          >
            {props.ctaText && (
              isExternalHref(props.primaryHref || '/registration') ? (
                <a
                  href={props.primaryHref || '/registration'}
                  target="_blank"
                  rel="noreferrer"
                  className="acad-btn-roll shadow-lg"
                >
                  <span className="acad-btn-roll__label">
                    <span className="acad-btn-roll__inner">
                      <span>{props.ctaText}</span>
                      <span aria-hidden="true">{props.ctaText}</span>
                    </span>
                  </span>
                  <span className="acad-btn-roll__chip" aria-hidden="true">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                  </span>
                </a>
              ) : (
                <Link
                  to={props.primaryHref || '/registration'}
                  className="acad-btn-roll shadow-lg"
                >
                  <span className="acad-btn-roll__label">
                    <span className="acad-btn-roll__inner">
                      <span>{props.ctaText}</span>
                      <span aria-hidden="true">{props.ctaText}</span>
                    </span>
                  </span>
                  <span className="acad-btn-roll__chip" aria-hidden="true">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                  </span>
                </Link>
              )
            )}
            {props.secondaryCtaText &&
              renderHeroAction(
                props.secondaryHref?.includes('#')
                  ? `#${props.secondaryHref.split('#')[1]}`
                  : props.secondaryHref || '#academy-lab',
                props.secondaryCtaText,
                'acad-glass inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-full font-semibold text-sm text-white transition-transform hover:scale-[1.02] active:scale-[0.97]',
              )}
          </div>
        </div>

        {/* Live Synchronized Liquid-Glass Telemetry HUD */}
        <aside
          aria-live="polite"
          className="hidden md:block md:col-span-4 justify-self-end w-full max-w-xs acad-glass acad-glass--strong acad-in-blur rounded-3xl p-5 text-white pointer-events-auto space-y-3"
          style={{ '--acad-d': '140ms' } as React.CSSProperties}
        >
          <div className="flex items-center justify-between text-xs text-white/60 font-mono">
            <span className="tabular-nums">
              {`${String(hudIndex + 1).padStart(2, '0')} / ${String(cardsList.length).padStart(2, '0')}`}
            </span>
            <span className="font-mono tabular-nums text-white/75">{hudCard.age}</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full font-semibold font-mono text-xs"
              style={{
                backgroundColor: 'hsl(var(--accent) / 0.22)',
                border: '1px solid hsl(var(--accent) / 0.5)',
                color: '#FFE4D9',
              }}
            >
              {hudCard.tag}
            </span>
          </div>

          <h3 className="text-base font-bold leading-snug" style={{ letterSpacing: 0 }}>
            {hudCard.title}
          </h3>
          <p className="text-xs text-white/75 leading-relaxed">{hudCard.desc}</p>

          <button
            type="button"
            onClick={() => setSelectedCard(hudCard)}
            className="w-full pt-2 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-white/85 hover:text-white transition-colors"
          >
            <span>معاينة تفاصيل المسار</span>
            <span aria-hidden="true">←</span>
          </button>
        </aside>
      </div>

      {/* Bottom Interactive Hint & Trust Pills */}
      <div className="relative z-[4] max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-40 sm:pt-48 md:pt-56 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="acad-glass pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs text-white/85">
          <span>{hintText}</span>
        </div>

        <div className="pointer-events-auto hidden sm:flex flex-wrap items-center gap-2 text-xs text-white/85">
          {trustPills.map((pill) => (
            <span
              key={pill}
              className="acad-glass px-3.5 py-1.5 rounded-full"
            >
              {pill}
            </span>
          ))}
        </div>
      </div>

      {/* Click-to-Preview Modal */}
      {selectedCard && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedCard(null)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl p-6 bg-[#0F1824] border border-white/20 text-white shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold font-mono"
                style={{ backgroundColor: 'hsl(var(--accent))', color: '#fff' }}
              >
                {selectedCard.tag}
              </span>
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                aria-label="إغلاق"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-white/70 font-mono">{selectedCard.age}</div>
            <h3 className="text-xl font-bold" style={{ letterSpacing: 0 }}>
              {selectedCard.title}
            </h3>
            <p className="text-sm text-white/80 leading-relaxed">{selectedCard.desc}</p>
            <div className="pt-2">
              {renderHeroAction(
                props.primaryHref || '/registration',
                props.ctaText || 'سجّل في هذا المسار',
                'w-full inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-full font-semibold text-sm bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground,0_0%_100%))] hover:opacity-95',
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Academy3DWaveHero;

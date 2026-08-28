import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useOptionalScrollProgress } from './scroll/scrollProgress.js';

const ShaderGradientCanvasLazy = lazy(async () => {
  const mod = await import('@shadergradient/react');
  return { default: mod.ShaderGradientCanvas };
});

const ShaderGradientLazy = lazy(async () => {
  const mod = await import('@shadergradient/react');
  return { default: mod.ShaderGradient };
});

/** Your ShaderGradient base mesh. */
export const USER_SHADER = {
  animate: 'on',
  brightness: 0.8,
  cAzimuthAngle: 270,
  cDistance: 0.5,
  cPolarAngle: 180,
  cameraZoom: 5,
  color1: '#73bfc4',
  color2: '#ff810a',
  color3: '#8da0ce',
  envPreset: 'city',
  fov: 20,
  grain: 'on',
  lightType: 'env',
  positionX: -0.1,
  positionY: 0,
  positionZ: 0,
  reflection: 0.4,
  rotationX: 0,
  rotationY: 130,
  rotationZ: 70,
  shader: 'defaults',
  type: 'sphere',
  uAmplitude: 3.2,
  uDensity: 0.8,
  uFrequency: 5.5,
  uSpeed: 0.4,
  uStrength: 0.3,
  wireframe: false,
};

/** Soft chapter tints — interpolated by scroll progress. */
const CHAPTER_PALETTES = [
  { color1: '#73bfc4', color2: '#ff810a', color3: '#8da0ce' }, // intro
  { color1: '#8da0ce', color2: '#c4a0e8', color3: '#ff810a' }, // journey
  { color1: '#5eb8d4', color2: '#73bfc4', color3: '#8da0ce' }, // projects
  { color1: '#6ec4b8', color2: '#73bfc4', color3: '#a8d4c0' }, // build
  { color1: '#9b8ec4', color2: '#8da0ce', color3: '#c4b5fd' }, // story
  { color1: '#d4b896', color2: '#ff810a', color3: '#8da0ce' }, // contact
];

function lerpColor(a, b, t) {
  const parse = (hex) => {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  const toHex = (n) => Math.round(n).toString(16).padStart(2, '0');
  const A = parse(a);
  const B = parse(b);
  const mix = A.map((v, i) => v + (B[i] - v) * t);
  return `#${toHex(mix[0])}${toHex(mix[1])}${toHex(mix[2])}`;
}

function paletteAt(progress) {
  const max = CHAPTER_PALETTES.length - 1;
  const x = Math.max(0, Math.min(max, progress * max));
  const i = Math.floor(x);
  const t = x - i;
  // Smoothstep — softer blend between chapter palettes
  const s = t * t * (3 - 2 * t);
  const a = CHAPTER_PALETTES[i];
  const b = CHAPTER_PALETTES[Math.min(max, i + 1)];
  return {
    color1: lerpColor(a.color1, b.color1, s),
    color2: lerpColor(a.color2, b.color2, s),
    color3: lerpColor(a.color3, b.color3, s),
  };
}

function StaticFallback({ colors }) {
  return (
    <div
      className="shader-bg__fallback"
      style={{
        background: `
          radial-gradient(ellipse 85% 75% at 40% 35%, ${colors.color1} 0%, transparent 55%),
          radial-gradient(ellipse 70% 60% at 70% 70%, ${colors.color2} 0%, transparent 50%),
          radial-gradient(ellipse 55% 50% at 25% 80%, ${colors.color3} 0%, transparent 45%),
          #0a0a0b`,
      }}
      aria-hidden
    />
  );
}

function LiveShader({ colors, isMobile, onReady }) {
  const canvasStyle = useMemo(
    () => ({
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
    }),
    []
  );

  useEffect(() => {
    const tid = window.setTimeout(() => onReady?.(), 450);
    return () => window.clearTimeout(tid);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on mount
  }, []);

  return (
    <Suspense fallback={null}>
      <ShaderGradientCanvasLazy
        style={canvasStyle}
        pixelDensity={isMobile ? 0.7 : 1}
        fov={USER_SHADER.fov}
        pointerEvents="none"
        className="shader-bg__canvas"
      >
        <ShaderGradientLazy
          control="props"
          animate={USER_SHADER.animate}
          type={USER_SHADER.type}
          shader={USER_SHADER.shader}
          uSpeed={USER_SHADER.uSpeed}
          uStrength={USER_SHADER.uStrength}
          uDensity={USER_SHADER.uDensity}
          uFrequency={USER_SHADER.uFrequency}
          uAmplitude={USER_SHADER.uAmplitude}
          color1={colors.color1}
          color2={colors.color2}
          color3={colors.color3}
          reflection={USER_SHADER.reflection}
          cAzimuthAngle={USER_SHADER.cAzimuthAngle}
          cPolarAngle={USER_SHADER.cPolarAngle}
          cDistance={USER_SHADER.cDistance}
          cameraZoom={USER_SHADER.cameraZoom}
          lightType={USER_SHADER.lightType}
          brightness={USER_SHADER.brightness}
          envPreset={USER_SHADER.envPreset}
          grain={USER_SHADER.grain}
          grainBlending={0.5}
          positionX={USER_SHADER.positionX}
          positionY={USER_SHADER.positionY}
          positionZ={USER_SHADER.positionZ}
          rotationX={USER_SHADER.rotationX}
          rotationY={USER_SHADER.rotationY}
          rotationZ={USER_SHADER.rotationZ}
          wireframe={USER_SHADER.wireframe}
          enableTransition
        />
      </ShaderGradientCanvasLazy>
    </Suspense>
  );
}

/** Full-bleed mesh. Only colors evolve with scroll — position/camera stay fixed. */
export function ShaderBackground({ progress: progressFallback = 0.15 } = {}) {
  const reducedMotion = useReducedMotion();
  const scroll = useOptionalScrollProgress();
  const progressMotion = scroll?.progress;
  const [tabVisible, setTabVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [colors, setColors] = useState(() => {
    const p = progressMotion?.get() ?? progressFallback;
    return paletteAt(p);
  });

  const targetPRef = useRef(progressMotion?.get() ?? progressFallback);
  const displayPRef = useRef(targetPRef.current);
  const colorKeyRef = useRef('');
  const rafRef = useRef(0);
  const loopingRef = useRef(false);

  const applyPalette = (p) => {
    const next = paletteAt(p);
    const key = `${next.color1}|${next.color2}|${next.color3}`;
    if (key === colorKeyRef.current) return;
    colorKeyRef.current = key;
    setColors(next);
  };

  const tickSmooth = () => {
    loopingRef.current = true;
    const target = targetPRef.current;
    const display = displayPRef.current;
    const delta = target - display;
    // Ease toward scroll progress so chapter colors blend instead of stepping
    const next = Math.abs(delta) < 0.00035 ? target : display + delta * 0.12;
    displayPRef.current = next;
    applyPalette(next);

    if (Math.abs(target - next) > 0.00035) {
      rafRef.current = requestAnimationFrame(tickSmooth);
    } else {
      loopingRef.current = false;
      displayPRef.current = target;
      applyPalette(target);
    }
  };

  const syncColors = (raw) => {
    targetPRef.current = Math.max(0, Math.min(1, raw));
    if (!loopingRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tickSmooth);
    }
  };

  useLayoutEffect(() => {
    const p = progressMotion?.get() ?? progressFallback;
    targetPRef.current = p;
    displayPRef.current = p;
    applyPalette(p);
  }, [progressMotion, progressFallback]);

  useEffect(() => {
    if (!progressMotion) return undefined;
    const unsub = progressMotion.on('change', syncColors);
    return () => {
      unsub();
      cancelAnimationFrame(rafRef.current);
      loopingRef.current = false;
    };
  }, [progressMotion]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const showShader = !reducedMotion && tabVisible;

  return (
    <div className={`shader-bg${canvasReady ? ' shader-bg--live' : ''}`} aria-hidden>
      <div className="shader-bg__void" />
      {!showShader ? (
        <StaticFallback colors={colors} />
      ) : (
        <div className="shader-bg__live">
          <StaticFallback colors={colors} />
          <LiveShader
            colors={colors}
            isMobile={isMobile}
            onReady={() => setCanvasReady(true)}
          />
        </div>
      )}
      <div className="shader-bg__grain" />
      <div className="shader-bg__readability" />
    </div>
  );
}


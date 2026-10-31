import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import { DistortSurface } from './landing/gl/DistortSurface.jsx';
import { bakeDetailTitleTexture } from './detailTextBake.js';
import './detail-screen-fx.css';

function PixelCamera() {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    if (!camera.isOrthographicCamera) return;
    camera.left = 0;
    camera.right = size.width;
    camera.top = 0;
    camera.bottom = -size.height;
    camera.position.set(0, 0, 400);
    camera.near = 0.1;
    camera.far = 4000;
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

function measure(el, stageBox) {
  if (!el || !stageBox) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  return {
    left: r.left - stageBox.left,
    top: r.top - stageBox.top,
    width: r.width,
    height: r.height,
  };
}

function splitTitle(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { line1: name.toUpperCase(), line2: '' };
  if (parts.length === 2) {
    return { line1: parts[0].toUpperCase(), line2: parts[1].toUpperCase() };
  }
  const mid = Math.ceil(parts.length / 2);
  return {
    line1: parts.slice(0, mid).join(' ').toUpperCase(),
    line2: parts.slice(mid).join(' ').toUpperCase(),
  };
}

function titleMaxPx(vw) {
  return Math.max(64, Math.min(180, 0.1 * vw + 100));
}

function DetailScene({
  scrollRef,
  project,
  heroSrc,
  mouseRef,
  simRef,
  paramsRef,
  heroRectRef,
  shotRectRefs,
  titleRectRef,
  textParamsRef,
  reducedMotion,
  /** 'media' = photos, 'title' = mega name (difference canvas), 'all' */
  layer = 'all',
  onMediaReady,
}) {
  const readySent = useRef(false);
  const { size, gl } = useThree();
  const [heroTex, setHeroTex] = useState(null);
  const [shotTex, setShotTex] = useState(() => new Map());
  const [fontsReady, setFontsReady] = useState(0);

  useLayoutEffect(() => {
    gl.setClearColor(0xedeee5, 0);
  }, [gl]);

  useEffect(() => {
    let alive = true;
    const ready =
      typeof document !== 'undefined' && document.fonts?.ready
        ? document.fonts.ready
        : Promise.resolve();
    ready.then(() => {
      if (alive) setFontsReady((n) => n + 1);
    });
    return () => {
      alive = false;
    };
  }, []);

  const shots = useMemo(() => {
    const list = Array.isArray(project?.gallery) ? project.gallery.filter(Boolean) : [];
    if (list.length) return list;
    return heroSrc ? [heroSrc] : [];
  }, [project, heroSrc]);

  const titleParts = useMemo(() => splitTitle(project?.name || ''), [project?.name]);

  const titleBakeSizeRef = useRef(null);
  const titleBake = useMemo(() => {
    if (!titleParts.line1) return null;
    const maxFs = titleMaxPx(size.width || window.innerWidth || 1200);
    const next = bakeDetailTitleTexture({
      line1: titleParts.line1,
      line2: titleParts.line2,
      maxFs,
    });
    titleBakeSizeRef.current = { width: next.width, height: next.height };
    return next;
    // fontsReady: rebuild once webfonts settle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleParts.line1, titleParts.line2, size.width, fontsReady]);

  useEffect(
    () => () => {
      titleBake?.texture?.dispose?.();
    },
    [titleBake]
  );

  useEffect(() => {
    if (!heroSrc || layer === 'title') return undefined;
    let dead = false;
    new THREE.TextureLoader().load(heroSrc, (tex) => {
      if (dead) {
        tex.dispose();
        return;
      }
      tex.colorSpace = THREE.NoColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      setHeroTex((prev) => {
        prev?.dispose?.();
        return tex;
      });
    });
    return () => {
      dead = true;
    };
  }, [heroSrc, layer]);

  useEffect(() => {
    if (layer === 'title') return undefined;
    let dead = false;
    const loader = new THREE.TextureLoader();
    const next = new Map();
    let pending = shots.length;
    if (!pending) {
      setShotTex(new Map());
      return undefined;
    }
    shots.forEach((src) => {
      loader.load(
        src,
        (tex) => {
          if (dead) {
            tex.dispose();
            return;
          }
          tex.colorSpace = THREE.NoColorSpace;
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;
          next.set(src, tex);
          pending -= 1;
          if (pending <= 0) {
            setShotTex((prev) => {
              prev.forEach((t, k) => {
                if (!next.has(k)) t.dispose();
              });
              return new Map(next);
            });
          }
        },
        undefined,
        () => {
          pending -= 1;
          if (pending <= 0 && !dead) {
            setShotTex((prev) => {
              prev.forEach((t, k) => {
                if (!next.has(k)) t.dispose();
              });
              return new Map(next);
            });
          }
        }
      );
    });
    return () => {
      dead = true;
    };
  }, [shots, layer]);

  // Signal overlay once photo textures are in GPU memory
  useEffect(() => {
    if (layer === 'title' || readySent.current) return;
    if (!heroSrc) {
      readySent.current = true;
      onMediaReady?.();
      return;
    }
    if (!heroTex) return;
    if (shots.length > 0 && shotTex.size < shots.length) return;
    readySent.current = true;
    onMediaReady?.();
  }, [layer, heroSrc, heroTex, shotTex, shots.length, onMediaReady]);

  useFrame((_, dt) => {
    const m = mouseRef.current;
    m.vw = size.width;
    m.vh = size.height;

    const speed = Math.hypot(m.x - m.px, m.y - m.py) / Math.max(dt, 0.001);
    m.px = m.x;
    m.py = m.y;
    const targetStrength =
      m.inside && !reducedMotion ? Math.min(0.1615, 0.0323 + speed * 0.000226) : 0;
    m.strength += (targetStrength - m.strength) * (m.inside ? 0.16 : 0.07);

    simRef.current.userVelocity *= Math.pow(0.04, dt);

    const scrollEl = scrollRef?.current;
    const stage = scrollEl?.closest('.project-open__detail-stage');
    if (!scrollEl || !stage) return;
    const stageBox = stage.getBoundingClientRect();

    heroRectRef.current = measure(scrollEl.querySelector('.project-detail__hero'), stageBox);

    const figs = scrollEl.querySelectorAll('.project-detail__shot');
    figs.forEach((fig, i) => {
      if (!shotRectRefs.current[i]) shotRectRefs.current[i] = { current: null };
      shotRectRefs.current[i].current = measure(fig, stageBox);
    });

    // Mega only — kind stays DOM. Uniform scale from bake aspect (no stretch).
    const titleEl =
      stage.querySelector('.project-detail__title-float .project-detail__mega') ||
      scrollEl.querySelector('.project-detail__title-slot .project-detail__mega') ||
      stage.querySelector('.project-detail__title-float');
    const titleBox = measure(titleEl, stageBox);
    const titleBakeSize = titleBakeSizeRef.current;
    if (titleBox && titleBakeSize?.height > 0) {
      const scale = titleBox.height / titleBakeSize.height;
      const w = titleBakeSize.width * scale;
      const h = titleBakeSize.height * scale;
      titleRectRef.current = {
        left: titleBox.left + (titleBox.width - w) * 0.5,
        top: titleBox.top,
        width: w,
        height: h,
      };
    } else {
      titleRectRef.current = titleBox;
    }

  });

  const showMedia = layer === 'all' || layer === 'media';
  const showTitle = layer === 'all' || layer === 'title';

  return (
    <>
      <PixelCamera />
      {showMedia && heroTex ? (
        <DistortSurface
          texture={heroTex}
          rectRef={heroRectRef}
          mouseRef={mouseRef}
          paramsRef={paramsRef}
          simRef={simRef}
          reducedMotion={reducedMotion}
          mode="cover"
          depthWrite={false}
        />
      ) : null}
      {showMedia
        ? shots.map((src, i) => {
            const tex = shotTex.get(src);
            if (!tex) return null;
            if (!shotRectRefs.current[i]) shotRectRefs.current[i] = { current: null };
            return (
              <DistortSurface
                key={`${src}-${i}`}
                texture={tex}
                rectRef={shotRectRefs.current[i]}
                mouseRef={mouseRef}
                paramsRef={paramsRef}
                simRef={simRef}
                reducedMotion={reducedMotion}
                mode="cover"
                depthWrite={false}
              />
            );
          })
        : null}
      {showTitle && titleBake?.texture ? (
        <DistortSurface
          texture={titleBake.texture}
          rectRef={titleRectRef}
          mouseRef={mouseRef}
          paramsRef={textParamsRef}
          simRef={simRef}
          reducedMotion={reducedMotion}
          mode="alpha"
          depthWrite={false}
        />
      ) : null}
    </>
  );
}

/** WebGL: hero + gallery + baked title/intro (mesh distortion like landing / Auge). */
export function DetailGlStage({ scrollRef, project, heroSrc, active, onReady }) {
  const reducedMotion = useReducedMotion();
  const enabled = Boolean(active) && !reducedMotion;
  const [mediaReady, setMediaReady] = useState(false);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const mouseRef = useRef({
    x: 0,
    y: 0,
    px: 0,
    py: 0,
    clientX: 0,
    clientY: 0,
    inside: false,
    strength: 0,
    vw: 1,
    vh: 1,
  });
  const simRef = useRef({
    userVelocity: 0,
    drag: { active: false },
    skew: 0,
    clickRipple: null,
  });
  const paramsRef = useRef({
    spreadPct: 60,
    strengthPct: 200,
    edgeAxis: 'tb',
    edgeWidth: 0.16,
    edgeRefractMul: 110,
  });
  // Text planes: mouse mesh only — edge liquid slices glyphs (unlike photo covers)
  const textParamsRef = useRef({
    spreadPct: 60,
    strengthPct: 200,
    edgeAxis: 'lr',
    edgeWidth: 0.03,
    edgeRefractMul: 0,
  });
  const heroRectRef = useRef(null);
  const shotRectRefs = useRef([]);
  const titleRectRef = useRef(null);
  const lastScrollTop = useRef(0);
  const lastScrollTs = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return undefined;
    const scrollEl = scrollRef?.current;
    if (!scrollEl) return undefined;
    scrollEl.classList.add('project-open__scroll--gl');
    const detail = scrollEl.querySelector('.project-detail');
    const stage = scrollEl.closest('.project-open__detail-stage') || scrollEl.parentElement;

    const onMove = (e) => {
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      const m = mouseRef.current;
      m.inside = inside;
      m.clientX = e.clientX;
      m.clientY = e.clientY;
      if (!inside) return;
      m.x = e.clientX - rect.left;
      m.y = e.clientY - rect.top;
    };

    const onScroll = () => {
      const now = performance.now();
      const dt = Math.max(0.008, (now - lastScrollTs.current) / 1000);
      const top = scrollEl.scrollTop;
      simRef.current.userVelocity = (top - lastScrollTop.current) / dt;
      lastScrollTop.current = top;
      lastScrollTs.current = now;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    lastScrollTop.current = scrollEl.scrollTop;

    return () => {
      window.removeEventListener('pointermove', onMove);
      scrollEl.removeEventListener('scroll', onScroll);
      scrollEl.classList.remove('project-open__scroll--gl');
      detail?.classList.remove('project-detail--gl-ghost');
      stage?.classList.remove('project-open__detail-stage--gl');
    };
  }, [enabled, scrollRef]);

  // Only ghost DOM images once GL textures exist — avoids cream flash / flicker
  useEffect(() => {
    if (!enabled || !mediaReady) return undefined;
    const scrollEl = scrollRef?.current;
    const detail = scrollEl?.querySelector('.project-detail');
    const stage = scrollEl?.closest('.project-open__detail-stage') || scrollEl?.parentElement;
    detail?.classList.add('project-detail--gl-ghost');
    stage?.classList.add('project-open__detail-stage--gl');
    onReadyRef.current?.();
    return () => {
      detail?.classList.remove('project-detail--gl-ghost');
      stage?.classList.remove('project-open__detail-stage--gl');
    };
  }, [enabled, mediaReady, scrollRef]);

  if (!enabled) return null;

  const sharedScene = {
    scrollRef,
    project,
    heroSrc,
    mouseRef,
    simRef,
    paramsRef,
    heroRectRef,
    shotRectRefs,
    titleRectRef,
    textParamsRef,
    reducedMotion: Boolean(reducedMotion),
  };

  const canvasProps = {
    orthographic: true,
    dpr: [1, 1.5],
    camera: { position: [0, 0, 400], near: 0.1, far: 4000 },
    gl: {
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      premultipliedAlpha: false,
    },
    style: { pointerEvents: 'none' },
  };

  return (
    <>
      {/* Photos — normal composite; body copy stays live DOM */}
      <div className="detail-gl-stage" aria-hidden>
        <Canvas className="detail-gl-stage__canvas" {...canvasProps}>
          <DetailScene
            {...sharedScene}
            layer="media"
            onMediaReady={() => setMediaReady(true)}
          />
        </Canvas>
      </div>
      {/* Mega title — white bake + difference (same trick as landing S / Auge) */}
      <div className="detail-gl-stage detail-gl-stage--title" aria-hidden>
        <Canvas className="detail-gl-stage__canvas" {...canvasProps}>
          <DetailScene {...sharedScene} layer="title" />
        </Canvas>
      </div>
    </>
  );
}

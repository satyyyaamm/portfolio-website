import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import { DistortSurface } from './landing/gl/DistortSurface.jsx';
import {
  bakeDetailKindTexture,
  bakeDetailTitleTexture,
  useDetailCopyBakes,
} from './detailTextBake.js';
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
  if (vw <= 720) return Math.max(52, Math.min(76, vw * 0.175));
  return Math.max(64, Math.min(180, 0.1 * vw + 100));
}

function typeLabel(previewFrame) {
  if (previewFrame === 'mobile') return 'App';
  if (previewFrame === 'web') return 'Website';
  return 'Project';
}

function DetailScene({
  scrollRef,
  project,
  heroSrc,
  nextSrc,
  mouseRef,
  simRef,
  paramsRef,
  heroRectRef,
  shotRectRefs,
  nextRectRef,
  titleRectRef,
  kindRectRef,
  textParamsRef,
  copyParamsRef,
  copyBakes,
  copyRectsRef,
  reducedMotion,
  mediaSegments = [32, 48],
  measureTitle = true,
  measureCopy = true,
  /** 'media' = photos, 'title' = mega name (difference canvas), 'all' */
  layer = 'all',
  /** Phones: hero only — sheet text/gallery stay DOM above the canvas */
  heroOnly = false,
  onMediaReady,
  onShotsReady,
  onNextReady,
}) {
  const readySent = useRef(false);
  const scrollSampleRef = useRef({ top: null, vel: 0 });
  const bendElsRef = useRef([]);
  const stageRef = useRef(null);
  const measureTick = useRef(0);
  const { size, gl } = useThree();
  const [heroTex, setHeroTex] = useState(null);
  const [shotTex, setShotTex] = useState(() => new Map());
  const [nextTex, setNextTex] = useState(null);
  const [fontsReady, setFontsReady] = useState(0);

  useLayoutEffect(() => {
    // Fully transparent clear — RGB cream + 0 alpha can composite as a wash on iOS.
    gl.setClearColor(0x000000, 0);
    if (gl.domElement) gl.domElement.style.background = 'transparent';
  }, [gl]);

  /* Cache bend targets like About — querySelectorAll every frame shakes type */
  useLayoutEffect(() => {
    const scrollEl = scrollRef?.current;
    const stage = scrollEl?.closest('.project-open__detail-stage') || null;
    stageRef.current = stage;
    bendElsRef.current = stage ? [...stage.querySelectorAll('[data-bend-key]')] : [];
  }, [scrollRef, copyBakes, measureCopy]);

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
  const titleKind = useMemo(() => typeLabel(project?.previewFrame), [project?.previewFrame]);

  const titleBakeSizeRef = useRef(null);
  const kindBakeSizeRef = useRef(null);
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

  const kindBake = useMemo(() => {
    if (!titleKind) return null;
    const next = bakeDetailKindTexture({
      kind: titleKind,
      vw: size.width || window.innerWidth || 1200,
    });
    if (next) kindBakeSizeRef.current = { width: next.width, height: next.height };
    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleKind, size.width, fontsReady]);

  useEffect(
    () => () => {
      titleBake?.texture?.dispose?.();
    },
    [titleBake]
  );

  useEffect(
    () => () => {
      kindBake?.texture?.dispose?.();
    },
    [kindBake]
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

  // Stagger gallery GPU uploads so enter doesn't hitch on a burst of decodes
  useEffect(() => {
    if (layer === 'title') return undefined;
    let dead = false;
    const loader = new THREE.TextureLoader();
    if (!shots.length) {
      setShotTex(new Map());
      return undefined;
    }
    let i = 0;
    const loadNext = () => {
      if (dead || i >= shots.length) return;
      const src = shots[i];
      i += 1;
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
          setShotTex((prev) => {
            const next = new Map(prev);
            const old = next.get(src);
            if (old && old !== tex) old.dispose();
            next.set(src, tex);
            return next;
          });
          if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(loadNext, { timeout: 200 });
          } else {
            window.setTimeout(loadNext, 32);
          }
        },
        undefined,
        () => {
          if (!dead) loadNext();
        }
      );
    };
    // Start after a tick so the first detail paint isn't competing
    const kick = window.setTimeout(loadNext, 120);
    return () => {
      dead = true;
      window.clearTimeout(kick);
    };
  }, [shots, layer]);

  // Next-project thumb — load early so footer has bend/mess ready on arrival
  useEffect(() => {
    if (layer === 'title') return undefined;
    if (!nextSrc) {
      setNextTex((prev) => {
        prev?.dispose?.();
        return null;
      });
      return undefined;
    }
    let dead = false;
    const kick = window.setTimeout(() => {
      new THREE.TextureLoader().load(
        nextSrc,
        (tex) => {
          if (dead) {
            tex.dispose();
            return;
          }
          tex.colorSpace = THREE.NoColorSpace;
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;
          setNextTex((prev) => {
            prev?.dispose?.();
            return tex;
          });
        },
        undefined,
        () => {
          /* keep DOM thumb if GL decode fails */
        }
      );
    }, 60);
    return () => {
      dead = true;
      window.clearTimeout(kick);
    };
  }, [nextSrc, layer]);

  // Unblock the yellow load once the hero is on the GPU — gallery can stream in after.
  useEffect(() => {
    if (layer === 'title' || readySent.current) return;
    if (!heroSrc) {
      readySent.current = true;
      onMediaReady?.();
      return;
    }
    if (!heroTex) return;
    readySent.current = true;
    onMediaReady?.();
  }, [layer, heroSrc, heroTex, onMediaReady]);

  useEffect(() => {
    if (layer === 'title') return;
    if (shots.length === 0) {
      onShotsReady?.();
      return;
    }
    if (shotTex.size >= shots.length) onShotsReady?.();
  }, [layer, shots.length, shotTex, onShotsReady]);

  useEffect(() => {
    if (layer === 'title') return;
    // No next thumb, loaded, or failed load — unblock ghosting either way
    if (!nextSrc) {
      onNextReady?.();
      return;
    }
    if (nextTex) onNextReady?.();
  }, [layer, nextSrc, nextTex, onNextReady]);

  useFrame((_, dt) => {
    const m = mouseRef.current;
    m.vw = size.width;
    m.vh = size.height;

    const speed = Math.hypot(m.x - m.px, m.y - m.py) / Math.max(dt, 0.001);
    m.px = m.x;
    m.py = m.y;
    // Same mouse mess curve as About — quiet when still so type doesn’t jitter
    const moving = speed > 28;
    const targetStrength =
      m.inside && !reducedMotion && moving
        ? Math.min(0.1615, 0.0323 + speed * 0.000226)
        : m.inside && !reducedMotion
          ? Math.min(0.05, speed * 0.0001)
          : 0;
    m.strength += (targetStrength - m.strength) * (m.inside ? 0.16 : 0.1);

    const sample = scrollSampleRef.current;
    if (layer !== 'title') {
      const scroller = scrollRef?.current;
      if (scroller) {
        const top = scroller.scrollTop;
        if (sample.top == null) {
          sample.top = top;
          sample.vel = 0;
        } else {
          const instant = (top - sample.top) / Math.max(dt, 0.001);
          sample.top = top;
          const follow = 1 - Math.exp(-Math.max(dt, 0.001) * 12);
          sample.vel += (instant - sample.vel) * follow;
          if (Math.abs(sample.vel) < 6) sample.vel = 0;
        }
        simRef.current.userVelocity = sample.vel;
      }
    }

    const scrollEl = scrollRef?.current;
    const stage = stageRef.current || scrollEl?.closest('.project-open__detail-stage');
    if (!scrollEl || !stage) return;

    // About: idle measures every 2nd frame — cuts subpixel shake when parked
    const busy = Math.abs(sample.vel) > 6 || m.strength > 0.01 || moving;
    measureTick.current += 1;
    if (!busy && measureTick.current % 2 !== 0) return;

    const stageBox = stage.getBoundingClientRect();

    if (layer !== 'title') {
      // Sticky hero fills the viewport in DOM; clip its GL plane to the cream sheet
      // so photos don't paint over body copy (the bug that washed mobile detail).
      const heroEl = scrollEl.querySelector('.project-detail__hero');
      const sheetEl = scrollEl.querySelector('.project-detail__sheet');
      let heroBox = measure(heroEl, stageBox);
      if (heroBox && sheetEl) {
        const sheetTop = sheetEl.getBoundingClientRect().top - stageBox.top;
        if (sheetTop <= heroBox.top + 1) {
          heroBox = null;
        } else if (sheetTop < heroBox.top + heroBox.height) {
          heroBox.clipBottom = sheetTop;
        }
      }
      heroRectRef.current = heroBox;

      if (heroOnly) {
        shotRectRefs.current.forEach((ref) => {
          if (ref) ref.current = null;
        });
        if (nextRectRef) nextRectRef.current = null;
      } else {
        const figs = scrollEl.querySelectorAll('.project-detail__shot');
        figs.forEach((fig, i) => {
          if (!shotRectRefs.current[i]) shotRectRefs.current[i] = { current: null };
          const box = measure(fig, stageBox);
          if (box) {
            const raw = parseFloat(fig.style.getPropertyValue('--gl-reveal'));
            box.reveal = Number.isFinite(raw) ? raw : fig.dataset.reveal ? 0 : 1;
            box.revealSide = fig.dataset.reveal === 'right' ? 'right' : 'left';
          }
          shotRectRefs.current[i].current = box;
        });

        if (nextRectRef) {
          const nextEl = scrollEl.querySelector('.project-detail__next-media');
          const nextHit = scrollEl.querySelector('.project-detail__next-hit');
          let nextBox = measure(nextEl, stageBox);
          const hot =
            nextEl?.matches(':hover') || nextHit?.matches(':hover, :focus-visible');
          if (nextBox && hot) {
            const s = 1.04;
            const cx = nextBox.left + nextBox.width * 0.5;
            const cy = nextBox.top + nextBox.height * 0.5;
            nextBox = {
              ...nextBox,
              width: nextBox.width * s,
              height: nextBox.height * s,
              left: cx - (nextBox.width * s) * 0.5,
              top: cy - (nextBox.height * s) * 0.5,
            };
          }
          nextRectRef.current = nextBox;
        }
      }
    }

    // Mega scales to the live mega box; kind is 1:1 with the live kind box (hero-sized).
    if (measureTitle && (layer === 'title' || layer === 'all')) {
      const megaEl =
        stage.querySelector('.project-detail__title-float .project-detail__mega') ||
        scrollEl.querySelector('.project-detail__title-slot .project-detail__mega');
      const kindEl =
        stage.querySelector('.project-detail__title-float .project-detail__kind') ||
        scrollEl.querySelector('.project-detail__title-slot .project-detail__kind');
      const megaBox = measure(megaEl, stageBox);
      const titleBakeSize = titleBakeSizeRef.current;
      if (megaBox && titleBakeSize?.height > 0) {
        const scale = megaBox.height / titleBakeSize.height;
        const w = titleBakeSize.width * scale;
        const h = titleBakeSize.height * scale;
        titleRectRef.current = {
          left: megaBox.left + (megaBox.width - w) * 0.5,
          top: megaBox.top,
          width: w,
          height: h,
        };
      } else {
        titleRectRef.current = megaBox;
      }

      const kindBox = measure(kindEl, stageBox);
      const kindBakeSize = kindBakeSizeRef.current;
      if (kindBox && kindBakeSize?.width > 0 && kindRectRef) {
        // Keep baked kind at its native CSS px — center on the live kind box
        const w = kindBakeSize.width;
        const h = kindBakeSize.height;
        kindRectRef.current = {
          left: kindBox.left + (kindBox.width - w) * 0.5,
          top: kindBox.top + (kindBox.height - h) * 0.5,
          width: w,
          height: h,
        };
      } else if (kindRectRef) {
        kindRectRef.current = kindBox;
      }
    }

    if (measureCopy && layer !== 'title' && copyRectsRef) {
      const els = bendElsRef.current;
      for (let i = 0; i < els.length; i += 1) {
        const el = els[i];
        const id = el.dataset.bendKey;
        if (!id) continue;
        if (!copyRectsRef.current[id]) copyRectsRef.current[id] = { current: null };
        const box = measure(el, stageBox);
        if (box) box.suppress = el.dataset.glLive === '1';
        copyRectsRef.current[id].current = box;
      }
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
          segments={mediaSegments}
        />
      ) : null}
      {showMedia && !heroOnly
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
                segments={mediaSegments}
              />
            );
          })
        : null}
      {showMedia && !heroOnly && nextTex && nextRectRef ? (
        <DistortSurface
          texture={nextTex}
          rectRef={nextRectRef}
          mouseRef={mouseRef}
          paramsRef={paramsRef}
          simRef={simRef}
          reducedMotion={reducedMotion}
          mode="cover"
          depthWrite={false}
          segments={mediaSegments}
        />
      ) : null}
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
      {showTitle && kindBake?.texture ? (
        <DistortSurface
          texture={kindBake.texture}
          rectRef={kindRectRef}
          mouseRef={mouseRef}
          paramsRef={textParamsRef}
          simRef={simRef}
          reducedMotion={reducedMotion}
          mode="alpha"
          depthWrite={false}
        />
      ) : null}
      {showMedia
        ? (copyBakes || [])
            .filter((item) => item.layer === 'body')
            .map((item) => {
              if (!copyRectsRef.current[item.id]) copyRectsRef.current[item.id] = { current: null };
              return (
                <DistortSurface
                  key={item.id}
                  texture={item.texture}
                  rectRef={copyRectsRef.current[item.id]}
                  mouseRef={mouseRef}
                  paramsRef={copyParamsRef}
                  simRef={simRef}
                  reducedMotion={reducedMotion}
                  mode="alpha"
                  depthWrite={false}
                  segments={[24, 32]}
                />
              );
            })
        : null}
    </>
  );
}

/**
 * WebGL: hero + gallery + next thumb + mega title + body copy scroll bend.
 * `titleFx` / `copyFx` stay off during the yellow % hold so load stays smooth.
 */
function useIsNarrowDetail(max = 720) {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${max}px)`).matches : false
  );
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia(`(max-width: ${max}px)`);
    const onChange = () => setNarrow(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [max]);
  return narrow;
}

export function DetailGlStage({
  scrollRef,
  project,
  heroSrc,
  nextSrc = null,
  active,
  onReady,
  titleFx = true,
  copyFx = true,
}) {
  const reducedMotion = useReducedMotion();
  const narrow = useIsNarrowDetail(720);
  /*
    Media + body copy warp on all sizes (About-style alpha text over cream).
    Title difference canvas stays desktop-only — that path washed iOS type.
  */
  const enabled = Boolean(active) && !reducedMotion;
  const titleFxOn = Boolean(titleFx) && !narrow;
  /* Phones: defer text bakes so scroll/touch work immediately on open */
  const [copyAllowed, setCopyAllowed] = useState(() => !narrow);
  useEffect(() => {
    if (!narrow) {
      setCopyAllowed(true);
      return undefined;
    }
    setCopyAllowed(false);
    if (!enabled || !copyFx) return undefined;
    const t = window.setTimeout(() => setCopyAllowed(true), 1200);
    return () => window.clearTimeout(t);
  }, [narrow, enabled, copyFx, project?.id, project?.name]);
  const copyFxOn = Boolean(copyFx) && copyAllowed;
  /* Phones: hero photo in GL; gallery stays DOM to keep one light context */
  const heroOnly = narrow;
  const [mediaReady, setMediaReady] = useState(false);
  const [shotsReady, setShotsReady] = useState(false);
  const [nextReady, setNextReady] = useState(!nextSrc);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const shotsReadySent = useRef(false);
  const nextReadySent = useRef(false);
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
    edgeWidth: 0.42,
    edgeRefractMul: 72,
    scrollBendVh: 0.12,
  });
  // Mega + kind: same mouse mess + scroll bend as photos; no edge liquid (slices glyphs)
  const textParamsRef = useRef({
    spreadPct: 60,
    strengthPct: 200,
    edgeAxis: 'tb',
    edgeWidth: 0.42,
    edgeRefractMul: 0,
    scrollBendVh: 0.06,
    scrollBendSpeed: 1200,
    scrollBendEase: 0.032,
    scrollBendTop: 1,
  });
  // Body copy — mirror AboutSurfaceWarp params (soft ease kills shake)
  const copyParamsRef = useRef({
    spreadPct: 60,
    strengthPct: 200,
    edgeAxis: 'tb',
    edgeWidth: 0.42,
    edgeRefractMul: 0,
    scrollBendVh: 0.06,
    scrollBendSpeed: 1200,
    scrollBendEase: 0.032,
    scrollBendTop: 1,
  });
  /* Photos can stay a bit livelier; type always uses About soft bend */
  useEffect(() => {
    const edge = narrow ? 52 : 72;
    const photoBend = narrow ? 0.1 : 0.12;
    paramsRef.current.edgeRefractMul = edge;
    paramsRef.current.scrollBendVh = photoBend;
    paramsRef.current.scrollBendEase = narrow ? 0.1 : 0.16;
    textParamsRef.current.scrollBendVh = 0.06;
    textParamsRef.current.scrollBendSpeed = 1200;
    textParamsRef.current.scrollBendEase = 0.032;
    copyParamsRef.current.scrollBendVh = 0.06;
    copyParamsRef.current.scrollBendSpeed = 1200;
    copyParamsRef.current.scrollBendEase = 0.032;
    copyParamsRef.current.edgeRefractMul = 0;
  }, [narrow]);
  const { bakes: copyBakes, rectsRef: copyRectsRef } = useDetailCopyBakes({
    scrollRef,
    enabled: enabled && mediaReady && copyFxOn,
    projectKey: project?.id || project?.name || '',
  });
  const heroRectRef = useRef(null);
  const shotRectRefs = useRef([]);
  const nextRectRef = useRef(null);
  const titleRectRef = useRef(null);
  const kindRectRef = useRef(null);

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

    window.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onMove);
      scrollEl.classList.remove('project-open__scroll--gl');
      detail?.classList.remove('project-detail--gl-ghost');
      stage?.classList.remove('project-open__detail-stage--gl');
    };
  }, [enabled, scrollRef]);

  // Ghost hero as soon as it's in GL; ghost gallery shots only once their textures exist
  useEffect(() => {
    if (!enabled || !mediaReady) return undefined;
    const scrollEl = scrollRef?.current;
    const detail = scrollEl?.querySelector('.project-detail');
    const stage = scrollEl?.closest('.project-open__detail-stage') || scrollEl?.parentElement;
    detail?.classList.add('project-detail--gl-ghost');
    stage?.classList.add('project-open__detail-stage--gl');
    onReadyRef.current?.();
    return () => {
      detail?.classList.remove(
        'project-detail--gl-ghost',
        'project-detail--gl-shots',
        'project-detail--gl-next'
      );
      stage?.classList.remove('project-open__detail-stage--gl', 'project-open__detail-stage--gl-title');
    };
  }, [enabled, mediaReady, scrollRef]);

  useEffect(() => {
    if (!enabled || !mediaReady || !shotsReady || heroOnly) return undefined;
    const detail = scrollRef?.current?.querySelector('.project-detail');
    detail?.classList.add('project-detail--gl-shots');
    return () => detail?.classList.remove('project-detail--gl-shots');
  }, [enabled, mediaReady, shotsReady, heroOnly, scrollRef]);

  useEffect(() => {
    if (!enabled || !mediaReady || !nextReady || heroOnly) return undefined;
    const detail = scrollRef?.current?.querySelector('.project-detail');
    detail?.classList.add('project-detail--gl-next');
    return () => detail?.classList.remove('project-detail--gl-next');
  }, [enabled, mediaReady, nextReady, heroOnly, scrollRef]);

  useEffect(() => {
    if (!enabled || !titleFxOn) return undefined;
    const stage =
      scrollRef?.current?.closest('.project-open__detail-stage') || scrollRef?.current?.parentElement;
    stage?.classList.add('project-open__detail-stage--gl-title');
    return () => stage?.classList.remove('project-open__detail-stage--gl-title');
  }, [enabled, titleFxOn, scrollRef]);

  if (!enabled) return null;

  const mediaSegments = narrow ? [16, 24] : [32, 48];

  const sharedScene = {
    scrollRef,
    project,
    heroSrc,
    nextSrc,
    mouseRef,
    simRef,
    paramsRef,
    heroRectRef,
    shotRectRefs,
    nextRectRef,
    titleRectRef,
    kindRectRef,
    textParamsRef,
    copyParamsRef,
    copyBakes,
    copyRectsRef,
    reducedMotion: Boolean(reducedMotion),
    mediaSegments,
    measureTitle: titleFxOn,
    measureCopy: copyFxOn,
    heroOnly,
  };

  /* Match About: retina DPR + antialias so baked body type stays sharp when warped */
  const mediaCanvasProps = {
    orthographic: true,
    flat: true,
    linear: true,
    dpr: [1, 2],
    camera: { position: [0, 0, 400], near: 0.1, far: 4000 },
    gl: {
      alpha: true,
      antialias: true,
      powerPreference: narrow ? 'default' : 'high-performance',
      premultipliedAlpha: false,
    },
    style: { pointerEvents: 'none', background: 'transparent' },
  };
  const titleCanvasProps = {
    ...mediaCanvasProps,
    dpr: [1, 1.5],
    gl: {
      ...mediaCanvasProps.gl,
      antialias: false,
    },
  };

  return (
    <>
      {/* Photos — warm during yellow load (hero only needed to dismiss %) */}
      <div className="detail-gl-stage" aria-hidden>
        <Canvas className="detail-gl-stage__canvas" {...mediaCanvasProps}>
          <DetailScene
            {...sharedScene}
            layer="media"
            onMediaReady={() => setMediaReady(true)}
            onShotsReady={() => {
              if (shotsReadySent.current) return;
              shotsReadySent.current = true;
              setShotsReady(true);
            }}
            onNextReady={() => {
              if (nextReadySent.current) return;
              nextReadySent.current = true;
              setNextReady(true);
            }}
          />
        </Canvas>
      </div>
      {/* Title difference canvas — desktop only (iOS mix-blend + 2nd context flickers) */}
      {titleFxOn ? (
        <div className="detail-gl-stage detail-gl-stage--title" aria-hidden>
          <Canvas className="detail-gl-stage__canvas" {...titleCanvasProps}>
            <DetailScene {...sharedScene} layer="title" />
          </Canvas>
        </div>
      ) : null}
    </>
  );
}

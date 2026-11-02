import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import * as THREE from 'three';
import { ABOUT_PARAGRAPH } from '../../../lib/slides.js';
import { useSiteAnimationsEnabled } from '../../../context/SiteReadyContext.jsx';
import { Scramble, scrambleFrame } from '../Scramble.jsx';
import { DistortSurface } from './DistortSurface.jsx';
import {
  DISTORT_FRAG,
  DISTORT_VERT,
  DROP_BACKDROP_FRAG,
  DROP_BACKDROP_VERT,
} from './distortShaders.js';
import { dropUniformDefaults, syncDropUniforms } from './dropRipple.js';
import { fitWordFontSize, getAugeStageLayout } from './augeLayout.js';
import { applyBottomHingeSkew, bendFromSkewDeg } from './skewMath.js';
import { createCopyColumnTexture, createTextTexture } from './textTexture.js';
import { createSoundSequence, playHoverSound, playSound } from '../../../lib/siteSound.js';

/** One period + recycle — multi-copy group wraps flashed a seam every lap. */
const LOOP_COPIES = 1;
const SPEED = 160;
/** Opening burst — strip starts fast, eases down to SPEED over BURST_MS */
const SPEED_BURST = 560;
const BURST_MS = 2400;
const SCROLL_SKEW = 12;
/** How long over a card before tip / name show (was 300 — felt sluggish). */
const HOVER_PAUSE_MS = 70;
/** Wheel → velocity (px/s per wheel-px). Soft-cap keeps mouse notches from jumping. */
const WHEEL_GAIN = 48;
const WHEEL_STEP_CAP = 88;
const WHEEL_VEL_MAX = 2100;
/** Coast friction — lower = stops sooner at the end of a flick (applied as pow(k, dt)). */
const SCROLL_COAST = 0.004;
const SCROLL_COAST_HOVER = 0.01;
const SEG_X = 48;
const SEG_Y = 32;

function cardWidthFor(index, vw) {
  const scales = [1, 1.08, 0.96, 1.12, 0.98, 1.04, 1.06];
  const scale = scales[index % scales.length];
  // Mean scale ≈ 1.034 — size so ~3.5 cards fit in the viewport (2.2 on narrow).
  const visible = vw <= 720 ? 1.5 : 3.5;
  const avgScale = 1.034;
  const base = vw / (visible * avgScale);
  return Math.round(base * scale);
}

/**
 * Right edge = tallest. Left edge = shortest.
 * Height drops from the bottom; tops stay locked.
 */
function heightForCenterX(centerX, viewportW, maxH, minH) {
  if (viewportW <= 0) return maxH;
  const t = Math.max(0, Math.min(1, centerX / viewportW));
  const eased = t * t * (3 - 2 * t);
  return minH + (maxH - minH) * eased;
}

function normalizeWheelDelta(event) {
  let raw =
    Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  if (event.deltaMode === 1) raw *= 16;
  if (event.deltaMode === 2) raw *= typeof window !== 'undefined' ? window.innerHeight : 800;
  return raw;
}

/**
 * Recycle cards that have fully left the period train.
 * Partially visible cards stay put — teleporting those caused the loop-seam flash.
 * Offset stays unbounded; float precision is fine for session-length runtimes.
 */
function recycleWorldLeft(worldLeft, width, setW) {
  if (setW <= 0) return worldLeft;
  let x = worldLeft;
  for (let i = 0; i < 16 && x + width < 0; i += 1) x += setW;
  for (let i = 0; i < 16 && x >= setW; i += 1) x -= setW;
  return x;
}

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

const _dropT = new THREE.Matrix4();
const _dropS = new THREE.Matrix4();

/** Full-viewport cream plane so the droplet reads across the whole landing. */
function DropBackdrop({ simRef }) {
  const matRef = useRef(null);
  const meshRef = useRef(null);
  const { size } = useThree();
  const uniforms = useMemo(() => dropUniformDefaults(), []);

  useFrame(() => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;
    const w = Math.max(1, size.width);
    const h = Math.max(1, size.height);
    mesh.matrixAutoUpdate = false;
    mesh.matrix
      .identity()
      .multiply(_dropT.makeTranslation(w * 0.5, -h * 0.5, -40))
      .multiply(_dropS.makeScale(w, h, 1));
    mesh.matrixWorldNeedsUpdate = true;
    syncDropUniforms(mat, simRef.current);
  });

  return (
    <mesh ref={meshRef} matrixAutoUpdate={false} renderOrder={-10} frustumCulled={false}>
      <planeGeometry args={[1, 1, 72, 48]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={DROP_BACKDROP_VERT}
        fragmentShader={DROP_BACKDROP_FRAG}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function DistortCard({
  item,
  texture,
  left,
  width,
  setWidth,
  simRef,
  mouseRef,
  paramsRef,
  reducedMotion,
  onPointer,
  visible = true,
}) {
  const matRef = useRef(null);
  const meshRef = useRef(null);

  const uniforms = useMemo(() => {
    const img = texture?.image;
    return {
      uMap: { value: texture },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uStrength: { value: 0 },
      uImageSize: {
        value: new THREE.Vector2(
          img?.naturalWidth || img?.width || 1,
          img?.naturalHeight || img?.height || 1
        ),
      },
      uPlaneSize: { value: new THREE.Vector2(width, 400) },
      /** Cover fit locked to max height so shorter cards crop bottom, not rescale */
      uCoverHeight: { value: 400 },
      /** Falloff radius in px — 100% of the shorter viewport side around the cursor */
      uSpreadPx: { value: 800 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uEdgeWidth: { value: 0.03 },
      uEdgeRefract: { value: 0 },
      uEdgeRefractTB: { value: 0 },
      uViewport: { value: new THREE.Vector2(1, 1) },
      uScrollBend: { value: 0 },
      uScrollBendTop: { value: 1 },
      uBend: { value: 0 },
      // Mild curve — closer to 1 reads as skew; ~1.35 is a slight flex
      uBendPower: { value: 1.35 },
      uBendSpan: { value: 0 },
      // Shared with detail gallery wipe — landing stays fully revealed
      uReveal: { value: 1 },
      uRevealFrom: { value: 0 },
      uClipBottom: { value: -1 },
      ...dropUniformDefaults(),
    };
  }, [texture, width]);

  useFrame(() => {
    const mat = matRef.current;
    const mesh = meshRef.current;
    const sim = simRef.current;
    const m = mouseRef.current;
    if (!mat || !mesh || !sim) return;

    const vw = mouseRef.current.vw || window.innerWidth;
    const vh = mouseRef.current.vh || window.innerHeight;
    const railH = mouseRef.current.railH || vh || 400;
    const maxH = railH * 0.9;
    // Mobile: gentler left→right taper so cards stay closer in height.
    const minH = maxH * (vw <= 720 ? 0.7 : 0.5);
    // Screen-space recycle — group stays at x=0 so a period wrap never teleports meshes.
    const worldLeft = recycleWorldLeft(left + sim.offset, width, setWidth);
    const centerX = worldLeft + width * 0.5;
    const height = heightForCenterX(centerX, vw, maxH, minH);
    const cx = worldLeft + width * 0.5;
    const skewDeg = reducedMotion ? 0 : sim.skew || 0;
    // Extra overlap + stable draw order kills hairline z-fight flicker on seams.
    const drawW = width + 3;
    // Tiny Z by stack order so overlaps don’t fight (left cards slightly in front).
    const z = (item.projectIndex ?? 0) * -0.05;
    applyBottomHingeSkew(mesh, cx, -height, drawW, height, 0, z);
    mesh.renderOrder = 10 + (item.projectIndex ?? 0);
    mat.uniforms.uBend.value = bendFromSkewDeg(skewDeg, drawW, maxH) * 0.7;
    mat.uniforms.uBendPower.value = 1.35;
    mat.uniforms.uBendSpan.value = maxH;

    mat.uniforms.uPlaneSize.value.set(drawW, height);
    mat.uniforms.uCoverHeight.value = maxH;
    const spread = (paramsRef?.current?.spreadPct ?? 60) / 100;
    mat.uniforms.uSpreadPx.value = Math.min(vw, vh) * spread;
    // Match gl_FragCoord (drawing buffer) — CSS px alone puts the "right edge" at center on retina
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.5);
    mat.uniforms.uResolution.value.set(vw * dpr, vh * dpr);
    mat.uniforms.uViewport.value.set(vw, vh);
    mat.uniforms.uScrollBend.value = 0;
    mat.uniforms.uEdgeWidth.value = 0.03; // 3% of viewport (fraction)
    // Liquid glass only on user scroll/drag — ease in/out, ignore auto cruise
    const userSpeed = Math.abs(sim.userVelocity || 0);
    const userScrolling = Boolean(sim.drag?.active) || userSpeed > 10;
    const edgeTarget = reducedMotion || !userScrolling
      ? 0
      : (sim.drag?.active ? Math.max(0.4, Math.min(1, userSpeed / 520)) : Math.min(1, userSpeed / 520)) * 110 * dpr;
    mat.uniforms.uEdgeRefract.value += (edgeTarget - mat.uniforms.uEdgeRefract.value) * 0.14;
    const img = texture?.image;
    if (img && (img.naturalWidth || img.width)) {
      mat.uniforms.uImageSize.value.set(img.naturalWidth || img.width, img.naturalHeight || img.height);
    }
    mesh.userData.height = height;
    mesh.userData.left = worldLeft;
    mesh.userData.width = width;

    // Stage-space water droplet — same origin on every landing mesh.
    if (syncDropUniforms(mat, sim)) {
      mat.uniforms.uStrength.value += (0 - mat.uniforms.uStrength.value) * 0.28;
      return;
    }

    // Keep cloth dead through open — when the ripple ends, mouse strength
    // used to spring back onto the frozen strip and flash the whole carousel.
    const openingLock =
      sim.frozen ||
      sim.opening ||
      sim.openPending ||
      Boolean(sim.openTimer) ||
      Boolean(sim.clickRipple);
    if (reducedMotion || !m.inside || openingLock) {
      mat.uniforms.uStrength.value += (0 - mat.uniforms.uStrength.value) * (openingLock ? 0.45 : 0.14);
      return;
    }

    // Unclamped card-local UV so 30% viewport radius can reach neighboring cards.
    const ru = (m.x - worldLeft) / Math.max(width, 1);
    const rv = m.railY / Math.max(height, 1);
    mat.uniforms.uMouse.value.set(ru, 1 - rv);
    const strengthMul = (paramsRef?.current?.strengthPct ?? 200) / 100;
    // While the strip translates, cloth on seams opens cream gaps — damp it.
    const translating = Boolean(sim.stripTranslating);
    const target = m.strength * strengthMul * (translating ? 0.2 : 1);
    mat.uniforms.uStrength.value += (target - mat.uniforms.uStrength.value) * 0.22;
  });

  return (
    <mesh
      ref={meshRef}
      visible={visible}
      matrixAutoUpdate={false}
      // Manual matrices — default culling uses stale bounds and flashes on loop wrap
      frustumCulled={false}
      userData={{ item, left, width, height: 400 }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onPointer?.('enter', item);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onPointer?.('leave', item);
      }}
      onClick={(e) => {
        // Strip root owns click-vs-drag; keep R3F from bubbling only.
        e.stopPropagation();
      }}
    >
      <planeGeometry args={[1, 1, SEG_X, SEG_Y]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={DISTORT_VERT}
        fragmentShader={DISTORT_FRAG}
        toneMapped={false}
        depthWrite={false}
        depthTest
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  );
}

function StripScene({
  projects,
  cards,
  setWidth,
  simRef,
  mouseRef,
  paramsRef,
  menuOpen,
  stripPaused,
  reducedMotion,
  hiddenProjectId,
  onPointer,
  onIdleChange,
  onHoverHeld,
  onViewTip,
  onFeaturedChange,
  metaApiRef,
}) {
  const groupRef = useRef(null);
  const { size, gl } = useThree();
  const stageRect = useRef({ left: 0, top: 0 });
  const onFeaturedChangeRef = useRef(onFeaturedChange);
  onFeaturedChangeRef.current = onFeaturedChange;

  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const map = new Map();
    projects.forEach((p) => {
      if (!p.image || map.has(p.image)) return;
      const tex = loader.load(p.image);
      // Match DOM <img> — no sRGB decode/encode (that looked darker + harsher).
      tex.colorSpace = THREE.NoColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      map.set(p.image, tex);
    });
    return map;
  }, [projects]);

  useEffect(
    () => () => {
      textures.forEach((t) => t.dispose());
    },
    [textures]
  );

  useFrame((_, dtRaw) => {
    const dt = Math.min(0.048, dtRaw);
    const sim = simRef.current;
    const group = groupRef.current;
    if (!sim || !group) return;

    mouseRef.current.vw = size.width;
    mouseRef.current.vh = size.height;
    mouseRef.current.railH = getAugeStageLayout(size.width, size.height).railH;

    const ts = performance.now();
    sim.stripTranslating = false;
    // Keep frozen while opening or while the project overlay is up.
    // `opening` / `openPending` bridge ripple → decode → stripPaused.
    if (stripPaused || sim.opening || sim.openPending) sim.frozen = true;
    else if (sim.frozen && !sim.clickRipple && !sim.openTimer && !sim.openPending) {
      sim.frozen = false;
      sim.resumeAutoAt = performance.now() + 700;
    }

    const syncCardMeta = (preferFeatured) => {
      const api = metaApiRef.current;
      const m = mouseRef.current;
      const narrow = size.width <= 720;
      const featuredMode = preferFeatured && narrow && !menuOpen && !sim.opening && !stripPaused;

      let hotMesh = null;
      let featuredItem = null;
      if (featuredMode) {
        let bestVisible = -1;
        group.traverse((obj) => {
          if (!obj.isMesh || !obj.visible || !obj.userData?.item) return;
          const left = obj.userData.left ?? 0;
          const w = obj.userData.width ?? 0;
          const visible = Math.max(0, Math.min(left + w, size.width) - Math.max(left, 0));
          if (visible > bestVisible) {
            bestVisible = visible;
            hotMesh = obj;
            featuredItem = obj.userData.item;
          }
        });
        if (featuredItem && sim.featuredKey !== featuredItem.key) {
          sim.featuredKey = featuredItem.key;
          onFeaturedChangeRef.current?.(featuredItem);
        }
      } else {
        if (sim.hoverKey) {
          group.traverse((obj) => {
            if (obj.isMesh && obj.userData?.item?.key === sim.hoverKey) hotMesh = obj;
          });
        }
        if (sim.featuredKey) {
          sim.featuredKey = null;
          onFeaturedChangeRef.current?.(null);
        }
      }

      const tipShow =
        !featuredMode &&
        Boolean(hotMesh) &&
        sim.hoverHeld &&
        !sim.drag.active &&
        !menuOpen;

      if (tipShow !== sim._tipShown) {
        sim._tipShown = tipShow;
        onViewTip?.(m.clientX || 0, m.clientY || 0, tipShow);
      }

      const overCard = Boolean(sim.hoverKey) && !sim.drag.active;
      if (overCard !== sim._overCard) {
        sim._overCard = overCard;
        onHoverChange?.(overCard ? { key: sim.hoverKey, projectIndex: sim.hoverIndex } : null);
      }

      const showName =
        Boolean(hotMesh) &&
        !menuOpen &&
        !sim.opening &&
        !stripPaused &&
        (featuredMode || (sim.hoverHeld && !sim.drag.active));

      if (api?.el) {
        if (showName && hotMesh) {
          if ((sim._metaRectAt || 0) + 120 < ts) {
            const rect = gl.domElement.getBoundingClientRect();
            stageRect.current.left = rect.left;
            stageRect.current.top = rect.top;
            sim._metaRectAt = ts;
          }
          const left = hotMesh.userData.left ?? 0;
          const height = hotMesh.userData.height ?? 0;
          if (!sim._metaShown) {
            sim._metaShown = true;
            api.el.style.opacity = '1';
          }
          api.el.style.transform = `translate3d(${stageRect.current.left + left}px, ${stageRect.current.top + height + 12}px, 0)`;
        } else if (sim._metaShown) {
          sim._metaShown = false;
          api.el.style.opacity = '0';
        }
      }
    };

    if (sim.frozen || stripPaused || menuOpen || sim.opening || sim.openPending) {
      sim.userVelocity = 0;
      sim.skewArmed = false;
      sim.skewTarget = 0;
      // Hard-upright during open — no tilt under the ripple.
      if (sim.opening || sim.clickRipple) sim.skew = 0;
      else {
        sim.skew += (0 - sim.skew) * (1 - Math.pow(0.00008, dt));
        if (Math.abs(sim.skew) < 0.05) sim.skew = 0;
      }
      group.position.x = 0;
      group.position.y = 0;
      group.rotation.set(0, 0, 0);
      group.scale.set(1, 1, 1);
      // Still update mouse for ripple / idle meta, but never advance the strip.
      const mFreeze = mouseRef.current;
      mFreeze.railX = mFreeze.x;
      mFreeze.railY = mFreeze.y;
      // Keep the most-visible name parked while the strip is frozen (not opening).
      syncCardMeta(true);
      return;
    }

    const hoverLongEnough =
      Boolean(sim.hoverKey) &&
      (sim.hoverSession || ts - sim.hoverSince >= HOVER_PAUSE_MS);
    if (hoverLongEnough !== sim.hoverHeld) {
      sim.hoverHeld = hoverLongEnough;
      onHoverHeld?.(hoverLongEnough);
    }
    if (hoverLongEnough) sim.hoverSession = true;

    const hoveringIdle =
      hoverLongEnough &&
      !sim.drag.active &&
      !sim.skewArmed &&
      Math.abs(sim.userVelocity) <= 6;

    if (hoveringIdle) {
      if (!sim.hoverBrakeStarted) {
        sim.hoverBrakeStarted = true;
        if (Math.abs(sim.userVelocity) < 6) sim.userVelocity = sim.autoDir * SPEED;
      }
      sim.skewArmed = false;
      sim.skewTarget = 0;
      let delta = sim.userVelocity * dt;
      sim.userVelocity *= Math.pow(SCROLL_COAST_HOVER, dt);
      if (Math.abs(sim.userVelocity) < 5) sim.userVelocity = 0;
      if (delta !== 0) {
        sim.offset += delta;
        sim.stripTranslating = true;
      }
    } else if (!sim.drag.active) {
      let delta = sim.userVelocity * dt;
      // Soft coast after wheel/drag — reads as momentum, not stepped ticks.
      sim.userVelocity *= Math.pow(SCROLL_COAST, dt);
      const speed = Math.abs(sim.userVelocity);
      if (speed > 6) {
        if (sim.skewArmed) {
          // Skew fades with speed — no full tilt while the strip is barely moving.
          const skewT = Math.max(0, Math.min(1, (speed - 40) / 380));
          const skewAmt = SCROLL_SKEW * skewT * skewT * (3 - 2 * skewT);
          sim.skewTarget = (sim.userVelocity > 0 ? -1 : 1) * skewAmt;
          if (skewAmt < 0.15) {
            sim.skewArmed = false;
            sim.skewTarget = 0;
          }
        } else {
          sim.skewTarget = 0;
        }
      } else {
        sim.userVelocity = 0;
        sim.skewArmed = false;
        sim.skewTarget = 0;
        // Auto-cruise is desktop-only — mobile is drag/swipe driven.
        if (
          !hoverLongEnough &&
          ts >= sim.resumeAutoAt &&
          !reducedMotion &&
          size.width > 720
        ) {
          // Fast start → ease into cruising speed
          const burstT = Math.max(0, Math.min(1, (sim.burstUntil - ts) / BURST_MS));
          const burstEase = burstT * burstT; // ease-out of the boost
          const cruise = SPEED + (SPEED_BURST - SPEED) * burstEase;
          delta += sim.autoDir * cruise * dt;
        }
      }
      if (delta !== 0) {
        sim.offset += delta;
        sim.stripTranslating = true;
      }
    } else if (sim.drag.active && sim.drag.moved) {
      // Only skew once the pointer actually dragged — a click must stay upright.
      sim.stripTranslating = true;
      sim.skewArmed = true;
      sim.skewTarget = sim.autoDir > 0 ? -SCROLL_SKEW : SCROLL_SKEW;
    }

    // Snap upright fast when coasting out; ease in when engaging.
    const skewEase =
      Math.abs(sim.skewTarget) < 0.2
        ? 1 - Math.pow(1e-10, dt)
        : 1 - Math.pow(0.000015, dt);
    sim.skew += (sim.skewTarget - sim.skew) * skewEase;
    if (Math.abs(sim.skew) < 0.08 && Math.abs(sim.skewTarget) < 0.2) sim.skew = 0;

    // Carousel step tones — one cue per card-width of travel (Auge stepCarousel).
    const projectCount = Math.max(1, projects.length);
    const stepW = setWidth > 0 ? setWidth / projectCount : 0;
    if (stepW > 0) {
      const stepIndex = Math.round(Math.abs(sim.offset) / stepW);
      if (sim.lastStepIndex == null) {
        sim.lastStepIndex = stepIndex;
      } else if (stepIndex !== sim.lastStepIndex) {
        sim.lastStepIndex = stepIndex;
        const now = performance.now();
        if (now - (sim.lastStepAt || 0) >= 80) {
          sim.lastStepAt = now;
          sim.stepSeq?.play();
        }
      }
    }

    const idle =
      !sim.drag.active &&
      Math.abs(sim.userVelocity) < 6 &&
      !sim.skewArmed &&
      Math.abs(sim.skew) < 0.15 &&
      sim.skewTarget === 0;

    // Cards position themselves in screen space; keep the group pinned.
    group.position.x = 0;
    group.position.y = 0;
    group.rotation.set(0, 0, 0);
    group.scale.set(1, 1, 1);

    const m = mouseRef.current;
    const speed = Math.hypot(m.x - m.px, m.y - m.py) / Math.max(dt, 0.001);
    m.px = m.x;
    m.py = m.y;
    m.railX = m.x;
    m.railY = m.y;
    // Light mouse response (−15% strength).
    const targetStrength =
      m.inside && !reducedMotion ? Math.min(0.1615, 0.0323 + speed * 0.000226) : 0;
    m.strength += (targetStrength - m.strength) * (m.inside ? 0.16 : 0.07);

    // Idle hysteresis — used for auto-scroll resume, not for tip/name visibility.
    if (idle) {
      sim._idleFrames = (sim._idleFrames || 0) + 1;
      if (sim._idleFrames >= 2 && !sim.stripIdle) {
        sim.stripIdle = true;
        onIdleChange?.(true);
      }
    } else {
      sim._idleFrames = 0;
      if (sim.stripIdle) {
        sim.stripIdle = false;
        onIdleChange?.(false);
      }
    }

    // Mobile: name under the most-visible card. Desktop: hover-held card.
    syncCardMeta(true);
  });

  return (
    <group ref={groupRef}>
      {cards.map((card) => {
        const tex = textures.get(card.item.project.image);
        if (!tex) return null;
        // Hide in place — unmounting the mesh mid-open flickered neighboring cards.
        const blanked =
          hiddenProjectId != null && card.item.project?.id === hiddenProjectId;
        return (
          <DistortCard
            key={card.item.key}
            item={card.item}
            texture={tex}
            left={card.left}
            width={card.width}
            setWidth={setWidth}
            simRef={simRef}
            mouseRef={mouseRef}
            paramsRef={paramsRef}
            reducedMotion={reducedMotion}
            onPointer={onPointer}
            visible={!blanked}
          />
        );
      })}
    </group>
  );
}

const COPY_LABEL = 'Satyam Tiwari©';

function LowerDistort({
  mouseRef,
  paramsRef,
  simRef,
  reducedMotion,
  labelScrambleKey = 0,
}) {
  const { size } = useThree();
  // Bucket size so sub-pixel R3F jitter doesn't rebuild canvas textures (flash).
  const vw = Math.max(1, Math.round(size.width / 4) * 4);
  const vh = Math.max(1, Math.round(size.height / 4) * 4);
  const [fontsReady, setFontsReady] = useState(0);

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

  const layout = useMemo(() => getAugeStageLayout(vw, vh), [vw, vh]);
  const stageReady = vw >= 80 && vh >= 80 && layout.fontSize >= 12;

  const baked = useMemo(() => {
    if (!stageReady) return null;
    const family =
      typeof window !== 'undefined'
        ? getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim() ||
          'system-ui, sans-serif'
        : 'system-ui, sans-serif';

    const wordFont = Math.max(
      24,
      fitWordFontSize(
        'SATYAM',
        Math.max(32, layout.col1),
        Math.max(24, layout.fontSize),
        family,
        '700',
        -0.055
      )
    );
    const wordH = Math.max(16, Math.round(wordFont * 0.76));

    const wordTex = createTextTexture({
      lines: ['Satyam'],
      width: Math.max(32, layout.col1),
      height: wordH,
      fill: '#000000',
      fontFamily: family,
      fontWeight: '700',
      fontSize: wordFont,
      letterSpacing: -wordFont * 0.055,
      lineHeight: 0.76,
      align: 'left',
      valign: 'bottom',
      uppercase: true,
    });

    const copy = createCopyColumnTexture({
      width: Math.max(40, layout.copyW),
      maxWidth: Math.max(layout.copyW, layout.copyMaxW || layout.copyW),
      height: Math.max(32, layout.copyH),
      label: COPY_LABEL,
      body: ABOUT_PARAGRAPH,
      fontFamily: family,
      fontSize: Math.max(12, layout.copyFont),
      fill: '#000000',
      gap: Math.max(8, layout.copyFont * 0.55),
      labelSlot: layout.labelSlot,
    });

    return {
      wordTex,
      copyTex: copy.texture,
      copyH: copy.height,
      copyW: copy.width,
      wordH,
      setLabel: copy.setLabel,
    };
    // fontsReady: rebuild once webfonts settle (avoids wrong metrics + later flash)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, fontsReady, stageReady]);

  useEffect(
    () => () => {
      baked?.wordTex.dispose();
      baked?.copyTex.dispose();
    },
    [baked]
  );

  // Scramble on the same WebGL texture (in-place) so distortion stays on one label.
  useEffect(() => {
    const setLabel = baked?.setLabel;
    if (!setLabel) return undefined;
    if (!labelScrambleKey || reducedMotion) {
      setLabel(COPY_LABEL);
      return undefined;
    }
    const steps = 20;
    const tick = 45;
    let frame = 0;
    setLabel(scrambleFrame(COPY_LABEL, 0));
    const id = window.setInterval(() => {
      frame += 1;
      if (frame >= steps) {
        setLabel(COPY_LABEL);
        window.clearInterval(id);
        return;
      }
      setLabel(scrambleFrame(COPY_LABEL, frame / steps));
    }, tick);
    return () => {
      window.clearInterval(id);
      setLabel(COPY_LABEL);
    };
  }, [labelScrambleKey, reducedMotion, baked]);

  if (!baked) return null;

  // Keep the copy plane’s bottom locked to SATYAM’s baseline.
  const copyTop = layout.copyTop + layout.copyH - baked.copyH;

  return (
    <group>
      <DistortSurface
        texture={baked.wordTex}
        left={layout.wordLeft}
        top={layout.wordTop + Math.max(0, layout.wordH - baked.wordH)}
        width={Math.max(32, layout.col1)}
        height={baked.wordH}
        mouseRef={mouseRef}
        paramsRef={paramsRef}
        simRef={simRef}
        reducedMotion={reducedMotion}
        mode="alpha"
      />
      <DistortSurface
        texture={baked.copyTex}
        left={layout.copyLeft}
        top={copyTop}
        width={baked.copyW}
        height={baked.copyH}
        mouseRef={mouseRef}
        paramsRef={paramsRef}
        simRef={simRef}
        reducedMotion={reducedMotion}
        mode="alpha"
      />
    </group>
  );
}

export const GlProjectStrip = forwardRef(function GlProjectStrip(
  {
    projects,
    menuOpen = false,
    stripPaused = false,
    reducedMotion = false,
    spreadPct = 60,
    strengthPct = 200,
    onOpenProject,
    onHoverChange,
    onViewTip,
    labelScrambleKey = 0,
  },
  ref
) {
  const wrapRef = useRef(null);
  const siteReady = useSiteAnimationsEnabled();
  const paramsRef = useRef({ spreadPct, strengthPct });
  paramsRef.current.spreadPct = spreadPct;
  paramsRef.current.strengthPct = strengthPct;
  const onOpenProjectRef = useRef(onOpenProject);
  onOpenProjectRef.current = onOpenProject;
  const onViewTipRef = useRef(onViewTip);
  onViewTipRef.current = onViewTip;
  const openCardAtPointerRef = useRef(null);
  const simRef = useRef({
    offset: 0,
    userVelocity: 0,
    autoDir: -1,
    drag: { active: false, x: 0, moved: false },
    resumeAutoAt: 0,
    burstUntil: 0,
    burstArmed: false,
    skew: 0,
    skewTarget: 0,
    skewArmed: false,
    hoverKey: null,
    hoverIndex: null,
    hoverSince: 0,
    hoverHeld: false,
    hoverSession: false,
    hoverBrakeStarted: false,
    hoverLeaveTimer: 0,
    stripIdle: true,
    pendingHot: null,
    clickRipple: null,
    openTimer: 0,
    /** Hard-stop strip motion (click open + while project overlay is up). */
    frozen: false,
    /** True from open click through overlay mount — blocks auto-unfreeze gap. */
    opening: false,
    /** True while image decode runs after the ripple timer — keeps strip frozen. */
    openPending: false,
    /** Most-visible card key on mobile (drives project name under the strip). */
    featuredKey: null,
    stepSeq: createSoundSequence('stepCarousel'),
    lastStepIndex: null,
    lastStepAt: 0,
  });
  const mouseRef = useRef({
    x: 0,
    y: 0,
    px: 0,
    py: 0,
    clientX: 0,
    clientY: 0,
    railX: 0,
    railY: 0,
    inside: false,
    strength: 0,
    vw: 1200,
    vh: 500,
  });
  const metaApiRef = useRef({ el: null });
  const [hoverHeld, setHoverHeld] = useState(false);
  const [stripIdle, setStripIdle] = useState(true);
  const [hot, setHot] = useState(null);
  /** Mobile: name stays on for the most-visible card without hover. */
  const [featuredOn, setFeaturedOn] = useState(false);
  /** React-level blank: unmount all strip copies of this project id. */
  const [hiddenProjectId, setHiddenProjectId] = useState(null);
  const [vw, setVw] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  const loop = useMemo(() => {
    if (!projects.length) return [];
    const out = [];
    for (let copy = 0; copy < LOOP_COPIES; copy += 1) {
      projects.forEach((project, i) => {
        out.push({ project, projectIndex: i, key: `${project.id}-${copy}`, copy });
      });
    }
    return out;
  }, [projects]);

  const { cards, setWidth } = useMemo(() => {
    let x = 0;
    const list = loop.map((item) => {
      const width = cardWidthFor(item.projectIndex, vw);
      const entry = { item, left: x, width };
      x += width;
      return entry;
    });
    // Exact one-period width (sum of project 0..n-1) — must match wrap math or the seam flickers
    let sw = 0;
    if (projects.length > 0) {
      for (let i = 0; i < projects.length; i += 1) sw += cardWidthFor(i, vw);
    }
    return { cards: list, setWidth: sw };
  }, [loop, projects.length, vw]);

  useImperativeHandle(ref, () => ({
    get wrap() {
      return wrapRef.current;
    },
  }));

  // After the loader, open with a fast strip that eases into cruise speed (desktop).
  useEffect(() => {
    if (!siteReady || reducedMotion || vw <= 720) return undefined;
    const sim = simRef.current;
    if (sim.burstArmed) return undefined;
    sim.burstArmed = true;
    sim.burstUntil = performance.now() + BURST_MS;
    return undefined;
  }, [siteReady, reducedMotion, vw]);

  // Overlay open → stay frozen. Close → restore strip cards + re-arm hover
  // (pointerenter won't re-fire if the cursor never left the card).
  useEffect(() => {
    const sim = simRef.current;
    if (stripPaused) {
      sim.frozen = true;
      sim.opening = false;
      sim.openPending = false;
      sim.featuredKey = null;
      setFeaturedOn(false);
      sim._tipShown = false;
      sim._overCard = false;
      // Drop hover so a stale hoverKey can't block resume on the way back.
      if (sim.hoverLeaveTimer) {
        window.clearTimeout(sim.hoverLeaveTimer);
        sim.hoverLeaveTimer = 0;
      }
      sim.hoverKey = null;
      sim.hoverIndex = null;
      sim.pendingHot = null;
      sim.hoverSince = 0;
      sim.hoverBrakeStarted = false;
      sim.hoverHeld = false;
      sim.hoverSession = false;
      setHoverHeld(false);
      setHot(null);
      onHoverChange?.(null);
      onViewTip?.(0, 0, false);
      // Keep last pointer coords fresh while the overlay eats events
      const onWinMove = (e) => {
        mouseRef.current.clientX = e.clientX;
        mouseRef.current.clientY = e.clientY;
      };
      window.addEventListener('pointermove', onWinMove, { passive: true });
      return () => window.removeEventListener('pointermove', onWinMove);
    }
    // Remounting the opened card fires a synthetic pointerout — ignore leaves briefly.
    sim.ignoreLeaveUntil = performance.now() + 480;
    sim.needsHoverResume = true;
    setHiddenProjectId(null);
    sim.opening = false;
    sim.openPending = false;
    sim.frozen = false;
    sim._tipShown = false;
    sim._overCard = false;
    const timers = [];
    const tryResume = () => resumeHoverUnderPointerRef.current?.();
    // Cards remount async; retry a few frames so we catch the pointer still on a card.
    timers.push(window.setTimeout(tryResume, 0));
    timers.push(window.setTimeout(tryResume, 32));
    timers.push(window.setTimeout(tryResume, 80));
    timers.push(window.setTimeout(tryResume, 160));
    timers.push(window.setTimeout(tryResume, 280));
    // Curtain may still be covering the strip — keep coords warm until hover re-arms.
    const onWinMove = (e) => {
      mouseRef.current.clientX = e.clientX;
      mouseRef.current.clientY = e.clientY;
      if (simRef.current.needsHoverResume) tryResume();
    };
    window.addEventListener('pointermove', onWinMove, { passive: true });
    timers.push(
      window.setTimeout(() => {
        simRef.current.needsHoverResume = false;
        window.removeEventListener('pointermove', onWinMove);
      }, 600)
    );
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener('pointermove', onWinMove);
    };
    // Intentionally stripPaused-only — parent tip/hover callbacks are unstable identities.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripPaused]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    // Clear any leftover full-stage CSS skew from earlier iterations.
    el.style.transform = '';
    let last = Math.round(el.clientWidth);
    let debounceId = 0;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      // Ignore compositor/scrollbar jitter — vw updates rebuild the card strip.
      if (w <= 0 || Math.abs(w - last) < 4) return;
      window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        if (Math.abs(w - last) < 4) return;
        last = w;
        setVw(w);
      }, 120);
    });
    ro.observe(el);
    return () => {
      window.clearTimeout(debounceId);
      ro.disconnect();
    };
  }, []);

  const commitHot = (item) => {
    setHot((prev) => (prev?.key === item?.key ? prev : item));
  };

  const endHoverSession = (resumeDelay = 450) => {
    const sim = simRef.current;
    if (sim.hoverLeaveTimer) {
      window.clearTimeout(sim.hoverLeaveTimer);
      sim.hoverLeaveTimer = 0;
    }
    const wasPaused = sim.hoverBrakeStarted || sim.hoverSession;
    sim.hoverKey = null;
    sim.hoverIndex = null;
    sim.pendingHot = null;
    sim.hoverSince = 0;
    sim.hoverBrakeStarted = false;
    sim.hoverHeld = false;
    sim.hoverSession = false;
    setHoverHeld(false);
    setHot(null);
    onHoverChange?.(null);
    if (wasPaused) sim.resumeAutoAt = performance.now() + resumeDelay;
  };

  const enterHover = (item) => {
    const sim = simRef.current;
    if (sim.hoverLeaveTimer) {
      window.clearTimeout(sim.hoverLeaveTimer);
      sim.hoverLeaveTimer = 0;
    }
    const continuing = sim.hoverSession || sim.hoverHeld || sim.hoverBrakeStarted;
    if (!continuing || sim.hoverKey !== item.key) {
      playHoverSound('hoverProject');
    }
    sim.hoverKey = item.key;
    sim.hoverIndex = item.projectIndex;
    sim.pendingHot = item;
    // Cursor/tip use refs; only push React state when the strip is still —
    // cards sliding under the pointer were setState-thrashing the Canvas (flicker).
    onHoverChange?.(item);
    commitHot(item);
    if (continuing) {
      sim.hoverSession = true;
      if (!sim.hoverHeld) {
        sim.hoverHeld = true;
        setHoverHeld(true);
      }
      return;
    }
    sim.hoverSince = performance.now();
    sim.hoverBrakeStarted = false;
    sim.hoverHeld = false;
    sim.hoverSession = false;
    setHoverHeld(false);
  };

  const leaveHover = (item) => {
    const sim = simRef.current;
    // Remount / overlay teardown synthesizes pointerout while the cursor never left.
    if (
      stripPaused ||
      sim.frozen ||
      sim.opening ||
      (sim.ignoreLeaveUntil && performance.now() < sim.ignoreLeaveUntil)
    ) {
      return;
    }
    if (sim.hoverKey !== item.key) return;
    if (sim.hoverLeaveTimer) window.clearTimeout(sim.hoverLeaveTimer);
    // Longer leave debounce — short gaps between cards were flickering the cursor diamond.
    sim.hoverLeaveTimer = window.setTimeout(() => {
      sim.hoverLeaveTimer = 0;
      if (sim.hoverKey !== item.key) return;
      if (sim.ignoreLeaveUntil && performance.now() < sim.ignoreLeaveUntil) return;
      endHoverSession(450);
    }, 140);
  };

  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const resumeHoverUnderPointerRef = useRef(null);

  /** Hit-test strip cards in stage space (shared by open + hover resume). */
  const pickCardAtPointer = (clientX, clientY) => {
    const el = wrapRef.current;
    const sim = simRef.current;
    const list = cardsRef.current;
    if (!el || !list?.length || menuOpen) return null;
    const canvasRect = el.getBoundingClientRect();
    const stageX = clientX - canvasRect.left;
    const localY = clientY - canvasRect.top;
    const vw = mouseRef.current.vw || canvasRect.width || window.innerWidth;
    const vh = mouseRef.current.vh || canvasRect.height || window.innerHeight;
    const railH = mouseRef.current.railH || vh || 400;
    const maxH = railH * 0.9;
    const minH = maxH * (vw <= 720 ? 0.7 : 0.5);

    for (let i = 0; i < list.length; i += 1) {
      const card = list[i];
      const worldLeft = recycleWorldLeft(card.left + sim.offset, card.width, setWidth);
      const centerX = worldLeft + card.width * 0.5;
      const height = heightForCenterX(centerX, vw, maxH, minH);
      if (stageX < worldLeft || stageX >= worldLeft + card.width) continue;
      if (localY < 0 || localY > height) continue;
      return { card, canvasRect, height, worldLeft, localY };
    }
    return null;
  };

  const resumeHoverUnderPointer = (clientX, clientY) => {
    const sim = simRef.current;
    if (sim.opening || sim.openTimer || menuOpen || stripPaused) return;
    const x = clientX ?? mouseRef.current.clientX;
    const y = clientY ?? mouseRef.current.clientY;
    if (!Number.isFinite(x) || !Number.isFinite(y) || (x === 0 && y === 0)) return;
    const hit = pickCardAtPointer(x, y);
    if (!hit) return;
    enterHover(hit.card.item);
    // Cursor never left the card through the detail transition — show tip now
    sim.hoverSession = true;
    sim.hoverHeld = true;
    sim.hoverBrakeStarted = true;
    sim.frozen = false;
    sim.needsHoverResume = false;
    setHoverHeld(true);
    commitHot(hit.card.item);
    onViewTip?.(x, y, true);
    sim._tipShown = true;
    sim._overCard = true;
    onHoverChange?.(hit.card.item);
  };
  resumeHoverUnderPointerRef.current = resumeHoverUnderPointer;

  const openCardAtPointer = (clientX, clientY) => {
    const el = wrapRef.current;
    const sim = simRef.current;
    if (!el || menuOpen) return false;
    if (sim.openTimer) return true; // already opening
    const hit = pickCardAtPointer(clientX, clientY);
    if (!hit) return false;
    const { card, canvasRect, height, worldLeft } = hit;
    const src = card.item.project?.image;
    const projectId = card.item.project?.id;
    // Match the GL draw size (cards use width+3 overlap).
    const fromRect = src
      ? {
          left: canvasRect.left + worldLeft,
          top: canvasRect.top,
          width: card.width + 3,
          height,
          src,
        }
      : null;

    {
      // Freeze → ripple (decode in parallel) → overlay photo covers card → blank GL.
      const RIPPLE_MS = reducedMotion ? 0 : 920;
      const stageX = clientX - canvasRect.left;
      const stageY = -(clientY - canvasRect.top);
      sim.opening = true;
      sim.frozen = true;
      sim.userVelocity = 0;
      sim.skew = 0;
      sim.skewArmed = false;
      sim.skewTarget = 0;
      sim.drag.active = false;
      sim.drag.moved = false;
      sim.resumeAutoAt = Number.POSITIVE_INFINITY;
      mouseRef.current.strength = 0;
      playSound('clickProject');
      onViewTipRef.current?.(0, 0, false);
      endHoverSession(0);
      const vw = mouseRef.current.vw || canvasRect.width || window.innerWidth;
      const vh = mouseRef.current.vh || canvasRect.height || window.innerHeight;
      sim.clickRipple = {
        originX: stageX,
        originY: stageY,
        maxR: Math.hypot(vw, vh) * 0.95,
        duration: Math.max(RIPPLE_MS, 1),
        until: performance.now() + Math.max(RIPPLE_MS, 1),
      };

      // Decode during the ripple so open isn't delayed after it ends (that gap flickered).
      let decoded = Promise.resolve();
      if (src && typeof Image !== 'undefined') {
        const pre = new Image();
        pre.src = src;
        if (pre.decode) decoded = pre.decode().catch(() => {});
      }

      if (sim.openTimer) window.clearTimeout(sim.openTimer);
      sim.openTimer = window.setTimeout(() => {
        sim.openTimer = 0;
        sim.openPending = true;
        const id = projectId ?? card.item.projectIndex;
        const open = () => {
          if (!sim.opening && !sim.openPending) return;
          // Keep GL card until overlay photo has painted over it (onCovered).
          onOpenProjectRef.current?.(card.item.projectIndex, {
            ...fromRect,
            onCovered: () => {
              setHiddenProjectId(id);
              // Drop ripple only after the photo is seated — clearing it at mount
              // left one bare frozen frame that sometimes flashed the strip.
              sim.clickRipple = null;
              mouseRef.current.strength = 0;
            },
          });
          sim.openPending = false;
          // `opening` stays true until stripPaused effect acknowledges the overlay.
        };
        decoded.then(open).catch(open);
      }, RIPPLE_MS);
      return true;
    }
  };
  openCardAtPointerRef.current = openCardAtPointer;

  const onPointer = (type, item) => {
    const sim = simRef.current;
    if (type === 'enter') enterHover(item);
    if (type === 'leave') leaveHover(item);
    // Clicks are handled on pointerup (below) — R3F onClick is unreliable
    // once the strip takes pointer capture for drag.
  };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const sim = simRef.current;
    const DRAG_THRESHOLD = 8;
    const tip = (...args) => onViewTipRef.current?.(...args);

    const inStripBand = (clientY) => {
      const rect = el.getBoundingClientRect();
      const y = clientY - rect.top;
      const railH = mouseRef.current.railH || rect.height * 0.68;
      return y >= 0 && y <= railH;
    };

    const onWheel = (event) => {
      if (menuOpen || sim.frozen || sim.opening || sim.openPending || !inStripBand(event.clientY)) return;
      const raw = normalizeWheelDelta(event);
      if (!raw) return;
      event.preventDefault();
      // Velocity only — no per-tick offset snap (that felt stepped on mouse/trackpad).
      const step = Math.max(-WHEEL_STEP_CAP, Math.min(WHEEL_STEP_CAP, -raw));
      const add = step * WHEEL_GAIN;
      sim.userVelocity = Math.max(
        -WHEEL_VEL_MAX,
        Math.min(WHEEL_VEL_MAX, sim.userVelocity * 0.78 + add)
      );
      if (step !== 0) sim.autoDir = step > 0 ? 1 : -1;
      sim.skewArmed = true;
      sim.skewTarget = step > 0 ? -SCROLL_SKEW : SCROLL_SKEW;
      sim.resumeAutoAt = performance.now() + 1100;
    };

    const onMove = (event) => {
      const rect = el.getBoundingClientRect();
      const m = mouseRef.current;
      m.inside = true;
      m.clientX = event.clientX;
      m.clientY = event.clientY;
      m.x = event.clientX - rect.left;
      m.y = event.clientY - rect.top;
      if (sim._tipShown) {
        tip(event.clientX, event.clientY, true);
      }

      // After detail→home, pointerenter often never re-fires while still on a card.
      // Use the ref — this listener closes over a stale stripPaused otherwise.
      if (
        !sim.drag.active &&
        !sim.opening &&
        !sim.openPending &&
        !sim.openTimer &&
        !menuOpen &&
        (sim.needsHoverResume || !sim.hoverKey)
      ) {
        resumeHoverUnderPointerRef.current?.(event.clientX, event.clientY);
      }

      if (!sim.drag.active) return;
      // Don't drag-scroll while a project open is in flight.
      if (sim.opening || sim.openPending) return;
      const dx = event.clientX - sim.drag.x;
      // Don't treat tiny jitter as a drag — that was swallowing opens + arming skew.
      if (!sim.drag.moved) {
        const dist = Math.hypot(event.clientX - sim.drag.startX, event.clientY - sim.drag.startY);
        if (dist < DRAG_THRESHOLD) return;
        sim.drag.moved = true;
      }
      sim.drag.x = event.clientX;
      sim.offset += dx;
      if (dx !== 0) {
        sim.autoDir = dx > 0 ? 1 : -1;
        sim.userVelocity = Math.max(-720, Math.min(720, dx * 16));
        sim.skewArmed = true;
        sim.skewTarget = dx > 0 ? -SCROLL_SKEW : SCROLL_SKEW;
      }
    };

    const onDown = (event) => {
      if (
        event.button !== 0 ||
        sim.frozen ||
        sim.opening ||
        sim.openPending ||
        !inStripBand(event.clientY)
      ) {
        return;
      }
      sim.drag = {
        active: true,
        x: event.clientX,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
      };
      sim.userVelocity = 0;
      // Don't arm skew on press — only after a real drag.
      sim.skewArmed = false;
      sim.skewTarget = 0;
      sim.resumeAutoAt = Number.POSITIVE_INFINITY;
      el.setPointerCapture?.(event.pointerId);
    };

    const onUp = (event) => {
      if (!sim.drag.active) return;
      const wasDrag = sim.drag.moved;
      sim.drag.active = false;
      try {
        el.releasePointerCapture?.(event.pointerId);
      } catch {
        /* noop */
      }
      if (wasDrag) {
        if (sim.userVelocity !== 0) sim.autoDir = sim.userVelocity > 0 ? 1 : -1;
        sim.resumeAutoAt = performance.now() + 1200;
        return;
      }
      // Pure click — upright, frozen, ripple → detail (no auto-scroll).
      sim.drag.moved = false;
      sim.skew = 0;
      sim.skewArmed = false;
      sim.skewTarget = 0;
      sim.userVelocity = 0;
      openCardAtPointerRef.current?.(event.clientX, event.clientY);
    };

    const onLeave = () => {
      if (sim.needsHoverResume || (sim.ignoreLeaveUntil && performance.now() < sim.ignoreLeaveUntil)) {
        return;
      }
      mouseRef.current.inside = false;
      sim._tipShown = false;
      endHoverSession(400);
      tip(0, 0, false);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('pointerleave', onLeave);
      if (sim.hoverLeaveTimer) window.clearTimeout(sim.hoverLeaveTimer);
      // Never cancel an in-flight open here — this effect rebinds when setWidth /
      // menuOpen change, and clearing opening/openTimer was dropping navigations
      // after the ripple (carousel resumed instead of opening detail).
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen, setWidth, reducedMotion]);

  const showMeta =
    Boolean(hot) && !menuOpen && (hoverHeld || (vw <= 720 && featuredOn));

  return (
    <div className="auge-gl-root" ref={wrapRef}>
      <Canvas
        orthographic
        flat
        linear
        /* Stop the RAF loop while a case/route covers the strip — frees GPU on phones. */
        frameloop={stripPaused ? 'never' : 'always'}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', premultipliedAlpha: false }}
        style={{ width: '100%', height: '100%', display: 'block', background: 'transparent' }}
        onCreated={({ gl }) => {
          // Keep canvas clear — page cream is CSS (#edeee5). An opaque GL clear
          // under `linear` output reads as a darker cream.
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.NoToneMapping;
        }}
      >
        <PixelCamera />
        <DropBackdrop simRef={simRef} />
        <StripScene
          projects={projects}
          cards={cards}
          setWidth={setWidth}
          simRef={simRef}
          mouseRef={mouseRef}
          paramsRef={paramsRef}
          menuOpen={menuOpen}
          stripPaused={stripPaused}
          reducedMotion={reducedMotion}
          hiddenProjectId={hiddenProjectId}
          onPointer={onPointer}
          onIdleChange={(idle) => {
            setStripIdle(idle);
            const sim = simRef.current;
            // Commit the hovered card once motion settles — avoids mid-scroll re-renders.
            if (idle && sim.pendingHot && sim.hoverKey === sim.pendingHot.key) {
              commitHot(sim.pendingHot);
              if (sim.hoverHeld) setHoverHeld(true);
            }
          }}
          onHoverHeld={(held) => {
            setHoverHeld(held);
            const sim = simRef.current;
            if (held && sim.pendingHot && sim.hoverKey === sim.pendingHot.key) {
              commitHot(sim.pendingHot);
            }
          }}
          onViewTip={onViewTip}
          onFeaturedChange={(item) => {
            if (!item) {
              setFeaturedOn(false);
              return;
            }
            commitHot(item);
            setFeaturedOn(true);
          }}
          metaApiRef={metaApiRef}
        />
        <LowerDistort
          mouseRef={mouseRef}
          paramsRef={paramsRef}
          simRef={simRef}
          reducedMotion={reducedMotion}
          labelScrambleKey={labelScrambleKey}
        />
      </Canvas>

      <div
        ref={(node) => {
          metaApiRef.current.el = node;
        }}
        className={`auge-gl-meta${showMeta ? ' is-on' : ''}`}
        aria-hidden={!showMeta}
      >
        {hot ? (
          <>
            <span className="auge-card__name">
              <Scramble text={hot.project.name} active={showMeta} />
            </span>
            <span className="auge-card__kind">
              <Scramble
                text={hot.project.meta?.split('·')[0]?.trim() || hot.project.role || 'Project'}
                active={showMeta}
              />
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
});

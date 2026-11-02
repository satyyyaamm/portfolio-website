import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { DISTORT_FRAG, DISTORT_FRAG_ALPHA, DISTORT_VERT } from './distortShaders.js';
import { dropUniformDefaults, syncDropUniforms } from './dropRipple.js';
import { applyBottomHingeSkew } from './skewMath.js';

const SEG_X = 32;
const SEG_Y = 48;

/**
 * Stage-space distortable plane (pixel coords, y down from top of stage).
 * Used for project cards (cover) and baked text (alpha).
 */
export function DistortSurface({
  texture,
  left = 0,
  top = 0,
  width = 1,
  height = 1,
  /** Optional live rect `{ left, top, width, height }` — detail stage scroll sync */
  rectRef,
  mouseRef,
  paramsRef,
  simRef,
  reducedMotion,
  mode = 'cover', // 'cover' | 'contain' | 'alpha'
  depthWrite: depthWriteProp,
  userData,
  onPointer,
  segments = [SEG_X, SEG_Y],
}) {
  const depthWrite = depthWriteProp ?? mode !== 'alpha';
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
          img?.naturalWidth || img?.width || width || 1,
          img?.naturalHeight || img?.height || height || 1
        ),
      },
      uPlaneSize: { value: new THREE.Vector2(width, height) },
      uCoverHeight: { value: height },
      uFitContain: { value: mode === 'contain' ? 1 : 0 },
      uCornerRadius: { value: 0 },
      uSpreadPx: { value: 800 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uEdgeWidth: { value: 0.03 },
      uEdgeRefract: { value: 0 },
      uEdgeRefractTB: { value: 0 },
      uViewport: { value: new THREE.Vector2(1, 1) },
      uScrollBend: { value: 0 },
      uScrollBendTop: { value: 1 },
      // Text stays on matrix skew — bend stays at 0
      uBend: { value: 0 },
      uBendPower: { value: 1.0 },
      uBendSpan: { value: 0 },
      // Detail gallery L/R wipe — landing leaves these at fully revealed
      uReveal: { value: 1 },
      uRevealFrom: { value: 0 },
      /* Sticky stack clip — unused (-1) unless rect.clipBottom is set */
      uClipBottom: { value: -1 },
      ...dropUniformDefaults(),
    };
  }, [texture, width, height, mode]);

  useFrame(() => {
    const mat = matRef.current;
    const mesh = meshRef.current;
    const m = mouseRef.current;
    if (!mat || !mesh || !m) return;

    const rect = rectRef?.current;
    const L = rect?.left ?? left;
    const T = rect?.top ?? top;
    const w = Math.max(1, rect?.width ?? width);
    const h = Math.max(1, rect?.height ?? height);
    // Live scramble / hover — hide bake so only the DOM node shows
    if (rect?.suppress) {
      mesh.visible = false;
      return;
    }
    // Offstage — park tiny
    if (rect && (w < 2 || h < 2 || T + h < -80 || T > (m.vh || 9999) + 80)) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;

    const reveal =
      typeof rect?.reveal === 'number' && Number.isFinite(rect.reveal) ? rect.reveal : 1;
    if (mat.uniforms.uReveal) mat.uniforms.uReveal.value = reveal;
    if (mat.uniforms.uRevealFrom) {
      mat.uniforms.uRevealFrom.value = rect?.revealSide === 'right' ? 1 : 0;
    }
    if (mat.uniforms.uClipBottom) {
      const clip =
        typeof rect?.clipBottom === 'number' && Number.isFinite(rect.clipBottom)
          ? rect.clipBottom
          : -1;
      mat.uniforms.uClipBottom.value = clip;
    }

    const cx = L + w * 0.5;
    const bottomY = -(T + h);
    // Text skews opposite the cards.
    const skewDeg = reducedMotion ? 0 : -(simRef?.current?.skew || 0);
    applyBottomHingeSkew(mesh, cx, bottomY, w, h, skewDeg);
    mat.uniforms.uPlaneSize.value.set(w, h);
    mat.uniforms.uCoverHeight.value = rect?.coverHeight || h;
    if (mat.uniforms.uCornerRadius) {
      // Soft radius on landscape gallery shots only (match CSS is-landscape)
      const img = texture?.image;
      const iw = img?.naturalWidth || img?.width || 0;
      const ih = img?.naturalHeight || img?.height || 0;
      const isLandscape = mode === 'contain' && iw > 0 && ih > 0 && iw >= ih;
      mat.uniforms.uCornerRadius.value = isLandscape
        ? Math.min(12, Math.min(w, h) * 0.08)
        : 0;
    }

    const vw = m.vw || window.innerWidth;
    const vh = m.vh || window.innerHeight;
    const spread = (paramsRef?.current?.spreadPct ?? 60) / 100;
    mat.uniforms.uSpreadPx.value = Math.min(vw, vh) * spread;
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.5);
    mat.uniforms.uResolution.value.set(vw * dpr, vh * dpr);
    mat.uniforms.uViewport.value.set(vw, vh);
    mat.uniforms.uEdgeWidth.value = paramsRef?.current?.edgeWidth ?? 0.03;
    // Match cards: only on user scroll/drag, smooth ease
    const sim = simRef?.current;
    const vel = sim?.userVelocity || 0;
    const userSpeed = Math.abs(vel);
    const userScrolling = Boolean(sim?.drag?.active) || userSpeed > 24;
    const edgeMul =
      reducedMotion || !userScrolling
        ? 0
        : (sim?.drag?.active
            ? Math.max(0.35, Math.min(1, userSpeed / 1400))
            : Math.min(1, userSpeed / 1400)) * dpr;
    const edgeAxis = paramsRef?.current?.edgeAxis || 'lr';
    const tbMul = paramsRef?.current?.edgeRefractMul ?? 56;
    // edgeRefractMul 0 keeps baked type flat — edge liquid slices glyphs
    const edgeTargetLR = edgeAxis === 'tb' || tbMul === 0 ? 0 : edgeMul * 48;
    const dir = Math.sign(vel) || 0;
    const edgeTargetTB =
      edgeAxis === 'tb' ? dir * edgeMul * tbMul : edgeAxis === 'both' ? edgeMul * 36 : 0;
    mat.uniforms.uEdgeRefract.value += (edgeTargetLR - mat.uniforms.uEdgeRefract.value) * 0.14;
    if (mat.uniforms.uEdgeRefractTB) {
      mat.uniforms.uEdgeRefractTB.value +=
        (edgeTargetTB - mat.uniforms.uEdgeRefractTB.value) * 0.14;
    }
    const bendCap = (paramsRef?.current?.scrollBendVh ?? 0) * vh;
    const bendSpeed = paramsRef?.current?.scrollBendSpeed ?? 1400;
    const bendEase = paramsRef?.current?.scrollBendEase ?? 0.16;
    const bendTarget =
      reducedMotion || edgeAxis !== 'tb'
        ? 0
        : dir * Math.min(1, userSpeed / Math.max(bendSpeed, 1)) * bendCap;
    if (mat.uniforms.uScrollBend) {
      mat.uniforms.uScrollBend.value += (bendTarget - mat.uniforms.uScrollBend.value) * bendEase;
    }
    if (mat.uniforms.uScrollBendTop) {
      const topMul = paramsRef?.current?.scrollBendTop;
      mat.uniforms.uScrollBendTop.value = topMul == null ? 1 : topMul;
    }

    const liveTex = rect?.texture || texture;
    if (liveTex && mat.uniforms.uMap.value !== liveTex) {
      mat.uniforms.uMap.value = liveTex;
    }
    const img = liveTex?.image;
    if (img && (img.naturalWidth || img.width || img.width === 0)) {
      const iw = img.naturalWidth || img.width || w;
      const ih = img.naturalHeight || img.height || h;
      mat.uniforms.uImageSize.value.set(iw, ih);
    }

    const dropping = syncDropUniforms(mat, sim);
    if (dropping) {
      mat.uniforms.uStrength.value += (0 - mat.uniforms.uStrength.value) * 0.28;
      return;
    }

    const openingLock =
      Boolean(sim?.frozen) ||
      Boolean(sim?.opening) ||
      Boolean(sim?.openPending) ||
      Boolean(sim?.openTimer) ||
      Boolean(sim?.clickRipple);
    if (reducedMotion || !m.inside || openingLock) {
      mat.uniforms.uStrength.value += (0 - mat.uniforms.uStrength.value) * (openingLock ? 0.45 : 0.14);
      return;
    }

    const ru = (m.x - L) / w;
    const rv = (m.y - T) / h;
    mat.uniforms.uMouse.value.set(ru, 1 - rv);
    const strengthMul = (paramsRef?.current?.strengthPct ?? 200) / 100;
    const target = m.strength * strengthMul;
    mat.uniforms.uStrength.value += (target - mat.uniforms.uStrength.value) * 0.22;
  });

  return (
    <mesh
      ref={meshRef}
      matrixAutoUpdate={false}
      frustumCulled={false}
      userData={userData}
      onPointerOver={
        onPointer
          ? (e) => {
              e.stopPropagation();
              onPointer('enter');
            }
          : undefined
      }
      onPointerOut={
        onPointer
          ? (e) => {
              e.stopPropagation();
              onPointer('leave');
            }
          : undefined
      }
      onClick={
        onPointer
          ? (e) => {
              e.stopPropagation();
              onPointer('click');
            }
          : undefined
      }
    >
      <planeGeometry args={[1, 1, segments[0], segments[1]]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={DISTORT_VERT}
        fragmentShader={mode === 'alpha' ? DISTORT_FRAG_ALPHA : DISTORT_FRAG}
        transparent={mode === 'alpha' || depthWriteProp === false}
        depthWrite={depthWrite}
        depthTest={depthWriteProp !== false}
        premultipliedAlpha={false}
        toneMapped={false}
      />
    </mesh>
  );
}

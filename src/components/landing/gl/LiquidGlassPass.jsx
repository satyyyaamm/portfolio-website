import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

const CREAM = new THREE.Color('#edeee5');

/**
 * Scene → FBO → fullscreen blit with edge liquid UV warp.
 * Plain MeshBasicMaterial blit first (stable); warp injected after compile succeeds.
 */
export function LiquidGlassPass({ simRef, mouseRef, reducedMotion = false }) {
  const { gl, scene, camera, size, viewport } = useThree();
  const rtRef = useRef(null);
  const materialRef = useRef(null);
  const uniformsRef = useRef(null);
  const curveSmoothed = useRef(0);
  const enableWarpRef = useRef(true);

  const { fsScene, fsCamera } = useMemo(() => {
    const fsScene = new THREE.Scene();
    const fsCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    fsCamera.position.z = 1;

    const material = new THREE.MeshBasicMaterial({
      map: null,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    mesh.frustumCulled = false;
    fsScene.add(mesh);
    return { fsScene, fsCamera };
  }, []);

  // Attach warp after first successful blit frame so a bad compile can't blank the site
  useEffect(() => {
    const mat = materialRef.current;
    if (!mat || !enableWarpRef.current) return undefined;

    const id = window.setTimeout(() => {
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uResolution = { value: new THREE.Vector2(size.width || 1, size.height || 1) };
        shader.uniforms.uPointer = { value: new THREE.Vector2(0, 0) };
        shader.uniforms.uRadius = { value: 520 };
        shader.uniforms.uStrength = { value: 0.12 };
        shader.uniforms.uCurve = { value: 0 };
        shader.uniforms.uCurveX = { value: 0 };
        shader.uniforms.uCurvePower = { value: 1 };
        shader.uniforms.uCurveEdge = { value: 90 };
        shader.uniforms.uEdgeWidth = { value: 180 };
        shader.uniforms.uEdgeRefract = { value: 28 };
        uniformsRef.current = shader.uniforms;

        shader.fragmentShader = shader.fragmentShader.replace(
          'void main() {',
          /* glsl */ `
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uRadius;
uniform float uStrength;
uniform float uCurve;
uniform float uCurveX;
uniform float uCurvePower;
uniform float uCurveEdge;
uniform float uEdgeWidth;
uniform float uEdgeRefract;

vec2 liquidWarpUv(vec2 uv) {
  vec2 vScreen = vec2(uv.x * uResolution.x, (1.0 - uv.y) * uResolution.y);
  vec2 delta = vScreen - uPointer;
  float dist = length(delta) / max(uRadius, 1.0);
  float spot = exp(-dist * dist * 2.0);
  float band = max(uCurveEdge, 0.001);

  float bowY = 0.0;
  if (uCurve != 0.0) {
    float across = max(sin(3.14159265 * vScreen.x / max(uResolution.x, 1.0)), 0.0);
    float edgeY = smoothstep(0.0, band, vScreen.y) * smoothstep(0.0, band, uResolution.y - vScreen.y);
    bowY = uCurve * pow(across, uCurvePower) * edgeY;
  }
  float bowX = 0.0;
  if (uCurveX != 0.0) {
    float down = max(sin(3.14159265 * vScreen.y / max(uResolution.y, 1.0)), 0.0);
    float edgeX = smoothstep(0.0, band, vScreen.x) * smoothstep(0.0, band, uResolution.x - vScreen.x);
    bowX = uCurveX * pow(down, uCurvePower) * edgeX;
  }

  float edgeW = max(uEdgeWidth, 1.0);
  float edgeL = 1.0 - smoothstep(0.0, edgeW, vScreen.x);
  float edgeR = 1.0 - smoothstep(0.0, edgeW, uResolution.x - vScreen.x);
  float edge = max(edgeL, edgeR);
  edge = edge * edge * (3.0 - 2.0 * edge);

  float midY = vScreen.y / max(uResolution.y, 1.0);
  float verticalWave = sin(midY * 3.14159265) * 0.65 + sin(midY * 9.424777) * 0.35;
  vec2 edgeOffsetPx = vec2(
    (edgeL - edgeR) * uEdgeRefract * edge,
    verticalWave * uEdgeRefract * edge * 0.85
  );
  vec2 offsetUv = vec2(
    -(delta.x * spot * uStrength + bowX + edgeOffsetPx.x) / max(uResolution.x, 1.0),
    (delta.y * spot * uStrength + bowY + edgeOffsetPx.y) / max(uResolution.y, 1.0)
  );
  return clamp(uv + offsetUv, 0.0, 1.0);
}

void main() {
`
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>',
          /* glsl */ `
#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, liquidWarpUv( vMapUv ) );
  diffuseColor *= sampledDiffuseColor;
#endif
`
        );
      };
      mat.customProgramCacheKey = () => 'liquid-edge-glass-v3';
      mat.needsUpdate = true;
    }, 120);

    return () => window.clearTimeout(id);
  }, [size.width, size.height]);

  useEffect(() => {
    const dpr = viewport.dpr || 1;
    const w = Math.max(1, Math.floor(size.width * dpr));
    const h = Math.max(1, Math.floor(size.height * dpr));

    const rt = new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: true,
      stencilBuffer: false,
    });
    rt.texture.generateMipmaps = false;
    rt.texture.colorSpace = gl.outputColorSpace;
    rtRef.current = rt;

    if (materialRef.current) {
      materialRef.current.map = rt.texture;
      materialRef.current.needsUpdate = true;
    }

    return () => {
      rt.dispose();
      if (rtRef.current === rt) rtRef.current = null;
    };
  }, [size.width, size.height, viewport.dpr, gl.outputColorSpace]);

  useEffect(
    () => () => {
      materialRef.current?.dispose();
    },
    []
  );

  useFrame(() => {
    const dpr = gl.getPixelRatio();
    const pw = Math.max(1, Math.floor(size.width * dpr));
    const ph = Math.max(1, Math.floor(size.height * dpr));

    const paintScene = () => {
      gl.setRenderTarget(null);
      gl.setViewport(0, 0, pw, ph);
      gl.setClearColor(CREAM, 1);
      gl.clear();
      gl.render(scene, camera);
    };

    const rt = rtRef.current;
    const mat = materialRef.current;

    if (!rt || !mat || reducedMotion) {
      paintScene();
      return;
    }

    if (rt.width !== pw || rt.height !== ph) rt.setSize(pw, ph);
    if (mat.map !== rt.texture) {
      mat.map = rt.texture;
      mat.needsUpdate = true;
    }

    const prevTarget = gl.getRenderTarget();
    const prevAutoClear = gl.autoClear;

    try {
      gl.autoClear = true;

      gl.setRenderTarget(rt);
      gl.setClearColor(CREAM, 1);
      gl.clear();
      gl.render(scene, camera);

      const sim = simRef?.current;
      const mouse = mouseRef?.current;
      const vw = size.width;
      const vh = size.height;
      const u = uniformsRef.current;
      if (u) {
        let velocity = 0;
        if (sim) {
          velocity = Math.abs(sim.userVelocity || 0);
          if (!sim.drag?.active && !sim.hoverHeld) {
            velocity += Math.abs(sim.autoDir || 1) * 160 * 0.35;
          }
        }
        const scrollAmt = Math.min(1, velocity / 720);
        curveSmoothed.current += (scrollAmt - curveSmoothed.current) * 0.12;
        const s = curveSmoothed.current;

        u.uPointer.value.set(mouse?.x ?? vw * 0.5, mouse?.y ?? vh * 0.5);
        u.uRadius.value = Math.max(280, Math.min(vw, vh) * 0.55);
        u.uStrength.value = 0.12;
        u.uCurve.value = 36 * s;
        u.uCurveX.value = 18 * s;
        u.uCurvePower.value = 1;
        u.uCurveEdge.value = 90;
        u.uEdgeWidth.value = Math.max(96, vw * 0.15);
        u.uEdgeRefract.value = 22 + 40 * s;
        u.uResolution.value.set(vw, vh);
      }

      gl.setRenderTarget(null);
      gl.setViewport(0, 0, pw, ph);
      gl.setClearColor(CREAM, 1);
      gl.clear();
      gl.render(fsScene, fsCamera);
    } catch {
      enableWarpRef.current = false;
      paintScene();
    } finally {
      gl.setRenderTarget(prevTarget);
      gl.autoClear = prevAutoClear;
    }
  }, 1);

  return null;
}

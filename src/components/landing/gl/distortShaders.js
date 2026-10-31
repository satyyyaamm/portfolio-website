/** Shared mouse-mesh distortion for project card planes (Auge-style). */

/** Stage-space water droplet — shared by cards, type, and cream backdrop. */
const DROP_WAVE_GLSL = /* glsl */ `
uniform vec2 uDropOrigin;
uniform float uDropMaxR;
uniform float uDropT;
uniform float uDropAmp;

float dropWave(vec2 worldXy) {
  if (uDropAmp < 0.001 || uDropT < 0.001) return 0.0;
  vec2 d = worldXy - uDropOrigin;
  float dist = length(d);
  float maxR = max(uDropMaxR, 1.0);
  float waveR = uDropT * maxR;
  float ring = dist - waveR;
  float crest = exp(-pow(ring / (maxR * 0.028), 2.0));
  float wake = exp(-pow((ring + maxR * 0.055) / (maxR * 0.06), 2.0)) * 0.5;
  float damp = exp(-uDropT * 1.6) * (1.0 - smoothstep(0.82, 1.0, uDropT));
  float splash = exp(-pow(dist / (maxR * 0.07), 2.0)) * exp(-uDropT * 7.0) * 1.5;
  return (crest - wake * 0.7 + splash) * uDropAmp * damp;
}

vec2 dropDir(vec2 worldXy) {
  vec2 d = worldXy - uDropOrigin;
  return d / (length(d) + 0.001);
}
`;

export const DISTORT_VERT = /* glsl */ `
uniform vec2 uMouse;
uniform float uStrength;
uniform vec2 uPlaneSize;
uniform float uSpreadPx;
uniform float uBend;
uniform float uBendPower;
uniform float uBendSpan;
uniform vec2 uViewport;
uniform float uEdgeWidth;
uniform float uScrollBend;
${DROP_WAVE_GLSL}
varying vec2 vUv;
varying vec2 vWorldXy;

void main() {
  vUv = uv;
  vec3 pos = position;

  // Lean by shared world height from the tallest-card floor so neighboring
  // edges shift together (no cream gaps when heights differ).
  float power = max(uBendPower, 1.01);
  float span = uBendSpan;
  float t;
  if (span > 1.0) {
    float worldFromTop = (0.5 - position.y) * uPlaneSize.y;
    float worldFromFloor = span - worldFromTop;
    t = clamp(worldFromFloor / span, 0.0, 1.0);
  } else {
    t = clamp(position.y + 0.5, 0.0, 1.0);
  }
  pos.x += uBend * pow(t, power);

  vec2 dPx = (uv - uMouse) * uPlaneSize;
  float dist = length(dPx);
  float r = max(uSpreadPx, 1.0);
  float falloff = dist / r;
  float influence = exp(-pow(falloff, 1.15)) * uStrength;
  vec2 dir = dPx / (dist + r * 0.12);
  float radial = smoothstep(0.0, 0.45, falloff);
  pos.z += influence * 0.5249;
  pos.xy += dir * influence * radial * 0.2;

  // Water droplet in stage pixels — same origin for every mesh on the landing.
  // Ortho camera ignores Z, so the ring must push XY (plus UV warp in frag).
  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  float wave = dropWave(worldPos.xy);
  worldPos.xy += dropDir(worldPos.xy) * wave * 22.0;
  worldPos.z += wave * 0.85;
  vWorldXy = worldPos.xy;

  // Detail scroll: the sheet arcs down at the top and bottom of the viewport.
  // Sign of uScrollBend is scroll direction; landing leaves it at 0.
  float viewW = max(uViewport.x, 1.0);
  float viewH = max(uViewport.y, 1.0);
  float nx = clamp(worldPos.x / viewW, 0.0, 1.0);
  float ny = clamp(-worldPos.y / viewH, 0.0, 1.0);
  float edgeFrac = clamp(uEdgeWidth, 0.04, 0.48);
  float topW = 1.0 - smoothstep(0.0, edgeFrac, ny);
  float botW = 1.0 - smoothstep(0.0, edgeFrac, 1.0 - ny);
  topW = topW * topW * (3.0 - 2.0 * topW);
  botW = botW * botW * (3.0 - 2.0 * botW);
  float bow = pow(max(sin(nx * 3.14159265), 0.0), 0.65);
  float mag = abs(uScrollBend);
  float lead = sign(uScrollBend);
  float topAmp = mag * (lead < 0.0 ? 1.28 : 0.7);
  float botAmp = mag * (lead > 0.0 ? 1.28 : 0.7);
  worldPos.y -= bow * (topW * topAmp + botW * botAmp);

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

/** Full-viewport cream plane so the droplet reads across the whole page. */
export const DROP_BACKDROP_VERT = /* glsl */ `
${DROP_WAVE_GLSL}
varying float vWave;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  float wave = dropWave(worldPos.xy);
  worldPos.xy += dropDir(worldPos.xy) * wave * 28.0;
  vWave = wave;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const DROP_BACKDROP_FRAG = /* glsl */ `
varying float vWave;

void main() {
  // #edeee5 with liquid shading from the droplet crest
  vec3 cream = vec3(0.929, 0.933, 0.898);
  float shade = 1.0 + vWave * 0.28;
  gl_FragColor = vec4(cream * shade, 1.0);
}
`;

/**
 * Edge liquid glass — L/R (landing strip) + optional T/B (detail stage).
 * uEdgeRefractTB stays 0 on the landing so behavior is unchanged.
 */
const EDGE_LIQUID_GLSL = /* glsl */ `
uniform vec2 uResolution;
uniform float uEdgeWidth;
uniform float uEdgeRefract;
uniform float uEdgeRefractTB;

vec2 edgeLiquidUv(vec2 uv) {
  float w = max(uResolution.x, 1.0);
  float h = max(uResolution.y, 1.0);
  float nx = clamp(gl_FragCoord.x / w, 0.0, 1.0);
  float ny = clamp(gl_FragCoord.y / h, 0.0, 1.0);
  float edgeFrac = clamp(uEdgeWidth, 0.001, 0.5);

  float edgeL = 1.0 - smoothstep(0.0, edgeFrac, nx);
  float edgeR = 1.0 - smoothstep(0.0, edgeFrac, 1.0 - nx);
  float edgeLR = max(edgeL, edgeR);
  edgeLR = edgeLR * edgeLR * (3.0 - 2.0 * edgeLR);
  float verticalWave = sin(ny * 3.14159265) * 0.65 + sin(ny * 9.424777) * 0.35;

  float edgeT = 1.0 - smoothstep(0.0, edgeFrac * 1.35, ny);
  float edgeB = 1.0 - smoothstep(0.0, edgeFrac * 1.35, 1.0 - ny);
  float edgeTB = max(edgeT, edgeB);
  edgeTB = edgeTB * edgeTB * (3.0 - 2.0 * edgeTB);
  float horizontalWave = sin(nx * 3.14159265) * 0.65 + sin(nx * 9.424777) * 0.35;

  vec2 offset = vec2(
    (edgeL - edgeR) * uEdgeRefract * edgeLR / w
      + horizontalWave * uEdgeRefractTB * edgeTB * 1.1 / w,
    verticalWave * uEdgeRefract * edgeLR * 1.15 / h
      + (edgeT - edgeB) * uEdgeRefractTB * edgeTB / h
  );
  return uv + offset;
}
`;

export const DISTORT_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform vec2 uMouse;
uniform float uStrength;
uniform vec2 uImageSize;
uniform vec2 uPlaneSize;
uniform float uCoverHeight;
uniform float uSpreadPx;
uniform float uReveal;
uniform float uRevealFrom;
varying vec2 vUv;
varying vec2 vWorldXy;

${EDGE_LIQUID_GLSL}
${DROP_WAVE_GLSL}

vec2 coverUv(vec2 uv, vec2 imageSize, vec2 planeSize, float coverHeight) {
  float coverH = max(coverHeight, planeSize.y);
  float imgAspect = imageSize.x / max(imageSize.y, 1.0);
  float coverAspect = planeSize.x / max(coverH, 1.0);
  vec2 ratio = vec2(1.0);
  if (imgAspect > coverAspect) {
    ratio.x = coverAspect / imgAspect;
  } else {
    ratio.y = imgAspect / coverAspect;
  }
  float yFull = 1.0 - (1.0 - uv.y) * (planeSize.y / coverH);
  vec2 fullUv = vec2(uv.x, yFull);
  vec2 base = (fullUv - vec2(0.5, 1.0)) * ratio + vec2(0.5, 1.0);
  return clamp(base, 0.0, 1.0);
}

void main() {
  // Scroll-in wipe: 0 = left origin, 1 = right origin (detail gallery)
  float reveal = clamp(uReveal, 0.0, 1.0);
  if (reveal < 0.999) {
    float soft = 0.02;
    float mask = uRevealFrom > 0.5
      ? smoothstep(1.0 - reveal - soft, 1.0 - reveal + soft, vUv.x)
      : (1.0 - smoothstep(reveal - soft, reveal + soft, vUv.x));
    if (mask < 0.02) discard;
  }

  vec2 dUv = vUv - uMouse;
  vec2 dPx = dUv * uPlaneSize;
  float dist = length(dPx);
  float r = max(uSpreadPx, 1.0);
  float t = dist / r;
  float influence = exp(-pow(t, 1.15)) * uStrength;
  float radial = smoothstep(0.0, 0.45, t);
  vec2 dir = dUv / (length(dUv) + 0.08);
  vec2 warped = vUv + dir * influence * radial * 0.00055;

  float wave = dropWave(vWorldXy);
  // Stage-pixel wave → UV so refraction matches the mesh push
  vec2 ddir = dropDir(vWorldXy);
  warped += vec2(
    ddir.x * wave * 28.0 / max(uPlaneSize.x, 1.0),
    ddir.y * wave * 28.0 / max(uPlaneSize.y, 1.0)
  );

  warped = edgeLiquidUv(warped);
  vec2 uv = coverUv(warped, uImageSize, uPlaneSize, uCoverHeight);
  gl_FragColor = texture2D(uMap, uv);
}
`;

/** Same warp, but direct UV sample with alpha (for baked text canvases). */
export const DISTORT_FRAG_ALPHA = /* glsl */ `
uniform sampler2D uMap;
uniform vec2 uMouse;
uniform float uStrength;
uniform vec2 uPlaneSize;
uniform float uSpreadPx;
varying vec2 vUv;
varying vec2 vWorldXy;

${EDGE_LIQUID_GLSL}
${DROP_WAVE_GLSL}

void main() {
  vec2 dUv = vUv - uMouse;
  vec2 dPx = dUv * uPlaneSize;
  float dist = length(dPx);
  float r = max(uSpreadPx, 1.0);
  float t = dist / r;
  float influence = exp(-pow(t, 1.15)) * uStrength;
  float radial = smoothstep(0.0, 0.45, t);
  vec2 dir = dUv / (length(dUv) + 0.08);
  vec2 warped = vUv + dir * influence * radial * 0.00055;

  float wave = dropWave(vWorldXy);
  vec2 ddir = dropDir(vWorldXy);
  warped += vec2(
    ddir.x * wave * 22.0 / max(uPlaneSize.x, 1.0),
    ddir.y * wave * 22.0 / max(uPlaneSize.y, 1.0)
  );

  warped = edgeLiquidUv(warped);
  vec4 color = texture2D(uMap, clamp(warped, 0.0, 1.0));
  if (color.a < 0.02) discard;
  gl_FragColor = color;
}
`;

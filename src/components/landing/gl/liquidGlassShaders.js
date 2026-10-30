/**
 * Raw GLSL3 shaders for LiquidGlassPass (WebGL2).
 * Edge-weighted UV refraction — strongest at left/right carousel edges.
 */

export const LIQUID_VERT_RAW = /* glsl */ `#version 300 es
in vec3 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const LIQUID_FRAG_RAW = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uTexture;
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

in vec2 vUv;
out vec4 outColor;

vec3 sampleScreen(vec2 uv) {
  return texture(uTexture, clamp(uv, 0.0, 1.0)).rgb;
}

void main() {
  // vUv: 0–1 bottom-left. Convert to top-left pixel space for edge/pointer math.
  vec2 vScreen = vec2(vUv.x * uResolution.x, (1.0 - vUv.y) * uResolution.y);

  vec2 delta = vScreen - uPointer;
  float distance = length(delta) / max(uRadius, 1.0);
  float spot = exp(-distance * distance * 2.0);

  float band = max(uCurveEdge, 0.001);
  float bowY = 0.0;
  if (uCurve != 0.0) {
    float across = max(sin(3.14159265 * vScreen.x / uResolution.x), 0.0);
    float edgeY =
      smoothstep(0.0, band, vScreen.y) *
      smoothstep(0.0, band, uResolution.y - vScreen.y);
    bowY = uCurve * pow(across, uCurvePower) * edgeY;
  }

  float bowX = 0.0;
  if (uCurveX != 0.0) {
    float down = max(sin(3.14159265 * vScreen.y / uResolution.y), 0.0);
    float edgeX =
      smoothstep(0.0, band, vScreen.x) *
      smoothstep(0.0, band, uResolution.x - vScreen.x);
    bowX = uCurveX * pow(down, uCurvePower) * edgeX;
  }

  // Edge liquid glass — strongest at left/right (~15vw)
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

  vec2 lensPx = delta * (spot * uStrength);
  vec2 bowPx = vec2(bowX, bowY);

  // Pixel offsets → UV (flip Y for top-left math vs bottom-left UV)
  vec2 offsetUv = vec2(
    -(lensPx.x + bowPx.x + edgeOffsetPx.x) / max(uResolution.x, 1.0),
    (lensPx.y + bowPx.y + edgeOffsetPx.y) / max(uResolution.y, 1.0)
  );

  outColor = vec4(sampleScreen(vUv + offsetUv), 1.0);
}
`;

// Kept for reference / non-raw fallbacks
export const LIQUID_VERT = LIQUID_VERT_RAW;
export const LIQUID_FRAG = LIQUID_FRAG_RAW;

/**
 * Tuning for the cursor-tracking magnetic hover.
 * Every value that changes how the motion *feels* lives here.
 *
 * maxTranslate — px the surface drifts toward the cursor at the far edge
 * maxRotate    — deg of 3D tilt at the far edge (keep small; this is a surface reacting, not a flipping card)
 * hoverScale   — resting scale while hovered
 * perspective  — px; lower = stronger 3D
 * lerp         — catch-up rate while hovered (lower = more lag/inertia)
 * releaseLerp  — catch-up rate while settling back (slower than lerp = physical inertia)
 * parallax     — multiplier applied to inner `.magnetic-layer` elements via CSS vars
 */
export const MAGNETIC_BASE = {
  maxTranslate: 5,
  /** Tilt is off by design — it read as a gimmick. Raise only if you want it back. */
  maxRotate: 0,
  hoverScale: 1.006,
  perspective: 1200,
  lerp: 0.11,
  releaseLerp: 0.075,
  parallax: 0.2,
};

export const MAGNETIC_PRESETS = {
  /** Image/media cards — a slight lean toward the cursor, nothing more. */
  media: {
    ...MAGNETIC_BASE,
    maxTranslate: 6,
    hoverScale: 1.008,
  },
  /** Text rows and list items — drift only, no perceptible scale. */
  row: {
    ...MAGNETIC_BASE,
    maxTranslate: 3.5,
    hoverScale: 1,
    lerp: 0.13,
    parallax: 0.15,
  },
  /** Buttons and pills — snappier, since the cursor is usually already on them. */
  button: {
    ...MAGNETIC_BASE,
    maxTranslate: 4,
    hoverScale: 1.012,
    lerp: 0.16,
    releaseLerp: 0.1,
  },
};

/** Below this delta the settle animation is visually finished. */
export const MAGNETIC_EPSILON = 0.0006;

export function resolveMagneticConfig(preset) {
  if (typeof preset === 'string') return MAGNETIC_PRESETS[preset] ?? MAGNETIC_BASE;
  return { ...MAGNETIC_BASE, ...(preset ?? {}) };
}

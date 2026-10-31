/** Auge WorksCarousel geometry — 12-col desktop, full-bleed mobile. */

export const STACK_SLOTS = 6;
export const DESKTOP_REF_W = 1440;
export const GUTTER_DESKTOP = 48;
export const GAP_DESKTOP = 16;
export const GUTTER_MOBILE = 20;
export const DESKTOP_MIN = 1024;

const DIST_WEIGHTS = [0.35, 0.15, 0.06, 0.02, 0];

export function groupsNeededPerSide(count, visible = STACK_SLOTS) {
  if (count <= 0) return 1;
  return Math.max(1, Math.ceil((visible + 1) / count));
}

export function scaleT(width) {
  return width / DESKTOP_REF_W;
}

function weightAt(distance, fallback) {
  if (distance <= 0) return fallback;
  const i = Math.min(distance - 1, DIST_WEIGHTS.length - 1);
  return DIST_WEIGHTS[i];
}

/** Interpolated falloff used for title/index approach. */
export function distLerp(absSteps, fallback) {
  const n = Math.max(0, absSteps);
  const lo = Math.floor(n);
  const a = weightAt(lo, fallback);
  const b = weightAt(lo + 1, fallback);
  return a + (b - a) * (n - lo);
}

export function worksLayout(width, height, desktop) {
  if (!desktop) {
    return {
      isMobile: true,
      mediaLeft: 0,
      mediaWidth: width,
      mediaHeight: height,
      centerX: width / 2,
      thumbFarLeft: 0,
      thumbFarWidth: 0,
      thumbCenterLeft: 0,
      thumbCenterWidth: 0,
      indexCenterRight: GUTTER_MOBILE,
      titleCenterLeft: width - GUTTER_MOBILE,
      titleNearLeft: width,
    };
  }

  const t = scaleT(width);
  const pad = 60 * t;
  const col = (width - 2 * GUTTER_DESKTOP - 11 * GAP_DESKTOP) / 12;
  const mediaWidth = Math.round(5 * col + 4 * GAP_DESKTOP);
  const mediaLeft = Math.round((width - mediaWidth) / 2);
  const mediaHeight = Math.round(mediaWidth / 1.6);
  const thumbCenterLeft = 40 * t - col;

  return {
    isMobile: false,
    mediaLeft,
    mediaWidth,
    mediaHeight,
    centerX: width / 2,
    thumbFarLeft: thumbCenterLeft + (GUTTER_DESKTOP + col + GAP_DESKTOP / 2 - thumbCenterLeft) * 0.5,
    thumbFarWidth: col + (0.85 * col - col) * 0.5,
    thumbCenterLeft,
    thumbCenterWidth: col,
    indexCenterRight: mediaLeft - pad,
    titleCenterLeft: mediaLeft + mediaWidth + pad,
    titleNearLeft: mediaLeft + mediaWidth,
  };
}

export function stepHeight(vh) {
  return vh / 12;
}

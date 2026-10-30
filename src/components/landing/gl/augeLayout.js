/** Keep WebGL Satyam/about planes in sync with auge-landing.css — viewport-fluid. */

function clamp(min, val, max) {
  return Math.min(max, Math.max(min, val));
}

/**
 * Scale like auge-xp.com: sizes track the viewport so spacing rhythm stays consistent.
 * @param {number} vw stage width px
 * @param {number} vh stage height px
 */
export function getAugeStageLayout(vw, vh) {
  const vmin = Math.min(vw, vh);
  const narrow = vw <= 720;
  const mid = vw <= 1100;
  const short = vh <= 820;

  // Display word — driven by vw, capped by vh so short laptops shrink too.
  let fontSize = Math.min(vw * 0.146, vh * 0.195);
  fontSize = clamp(vmin * 0.072, fontSize, 13.5 * 16);
  if (narrow) fontSize = clamp(vmin * 0.09, vw * 0.19, 7 * 16);
  else if (mid) fontSize = Math.min(fontSize, clamp(vmin * 0.078, vw * 0.12, 9 * 16));

  fontSize = Math.round(fontSize);
  const wordH = Math.round(fontSize * 0.76);
  const copyFont = Math.round(clamp(vmin * 0.015, fontSize * 0.115, fontSize * 0.125));

  const stacked = narrow;
  let padL;
  let padR;
  let lowerTop;
  let lowerBottom;
  let gap;
  let copyIndent;

  if (stacked) {
    padL = vw * 0.075;
    padR = vw * 0.08;
    lowerTop = Math.round(Math.min(vh * 0.46, vh - vmin * 0.3));
    // Leave room above footer / socials
    lowerBottom = Math.round(vh - Math.max(vh * 0.09, vmin * 0.09, 6.5 * 16));
    gap = vmin * 0.022;
    copyIndent = 0;
  } else {
    padL = vw * 0.052;
    // Clear socials + drawer control (closed) so copy never sits under the corner chrome
    padR = Math.max(vw * 0.058, Math.min(vw * 0.2, 12.5 * 16));
    const topFrac = short ? 0.5 : 0.56;
    lowerTop = Math.round(Math.min(vh * topFrac, vh - vmin * 0.24));
    lowerBottom = Math.round(vh - Math.max(vh * 0.08, vmin * 0.08, 5.5 * 16));
    gap = vw * 0.055; // match CSS column-gap: 5.5vw
    copyIndent = 0;
  }

  // DOM label height + gap before WebGL body (must clear “Satyam Tiwari©”)
  const labelSlot = Math.round(copyFont * 1.35 + Math.max(22, vmin * 0.032));
  const minBand = stacked
    ? wordH + labelSlot + copyFont * 5 + gap
    : wordH + 8;
  if (lowerBottom - lowerTop < minBand) {
    lowerTop = Math.max(vh * 0.32, lowerBottom - minBand);
  }
  const lowerH = Math.max(64, Math.round(lowerBottom - lowerTop));

  const inner = Math.max(120, vw - padL - padR);
  let col1;
  let wordLeft = padL;
  let wordTop;
  let copyLeft;
  let copyTop;
  let copyW;
  let copyH;

  let copyMaxW;

  if (stacked) {
    col1 = inner;
    copyMaxW = Math.round(Math.min(inner - vw * 0.04, 40 * 16));
    copyW = Math.round(Math.min(vw * 0.62, 28 * 16, copyMaxW));
    copyH = Math.max(copyFont * 5 + labelSlot, lowerH - wordH - gap);
    wordTop = lowerTop + Math.max(0, lowerH - wordH - copyH - gap);
    copyLeft = padL;
    copyTop = wordTop + wordH + gap;
  } else {
    const available = Math.max(80, inner - gap);
    col1 = Math.round(available * (1.2 / 2.05));
    const col2 = Math.max(vmin * 0.2, available - col1);
    // Wider column so the about copy wraps to ~4 lines (not 5)
    copyMaxW = Math.round(Math.min(col2, 28 * 16));
    copyW = Math.round(Math.min(copyMaxW * 0.95, 26 * 16, Math.max(vmin * 0.24, vw * 0.26)));
    copyH = wordH;
    wordTop = lowerTop + Math.max(0, lowerH - wordH);
    // Same top/bottom band as SATYAM — label at top, body on the shared baseline
    copyLeft = Math.round(padL + col1 + gap);
    copyTop = wordTop;
  }

  const railH = narrow
    ? Math.min(vh * 0.52, vh - vmin * 0.22)
    : Math.min(vh * (short ? 0.56 : 0.66), vh - vmin * 0.14);

  return {
    narrow,
    mid,
    short,
    stacked,
    padL,
    padR,
    lowerTop,
    lowerH,
    col1,
    fontSize,
    wordH,
    copyFont,
    labelSlot,
    wordLeft,
    wordTop,
    copyLeft,
    copyTop,
    copyW,
    copyMaxW,
    copyH,
    railH: Math.max(vh * 0.28, Math.round(railH)),
  };
}

/** Shrink only when SATYAM would overflow — prefer the CSS display size. */
export function fitWordFontSize(text, maxWidth, preferredSize, fontFamily, fontWeight, tracking = -0.055) {
  if (typeof document === 'undefined' || maxWidth <= 1) return preferredSize;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const budget = maxWidth * 0.98;
  let fontSize = preferredSize;
  for (let i = 0; i < 8; i += 1) {
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    if (typeof ctx.letterSpacing !== 'undefined') {
      ctx.letterSpacing = `${fontSize * tracking}px`;
    }
    const w = ctx.measureText(text).width;
    if (w <= budget || fontSize <= 32) break;
    fontSize = Math.max(32, fontSize * (budget / w));
  }
  return Math.round(fontSize);
}

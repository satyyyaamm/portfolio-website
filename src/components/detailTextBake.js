import * as THREE from 'three';

function fontFamily() {
  if (typeof window === 'undefined') return 'system-ui, sans-serif';
  return (
    getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim() ||
    'system-ui, sans-serif'
  );
}

/**
 * Bake mega title only (kind stays live DOM so it doesn’t vanish when docking).
 */
export function bakeDetailTitleTexture({ line1, line2, maxFs }) {
  const family = fontFamily();
  const lines = [line1, line2].filter(Boolean).map((l) => String(l).toUpperCase());
  const fs = Math.max(48, maxFs);
  const letterSpacing = -fs * 0.04;
  const lineH = fs * 0.85;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `700 ${fs}px ${family}`;
  if (typeof ctx.letterSpacing !== 'undefined') ctx.letterSpacing = `${letterSpacing}px`;

  let textW = 0;
  lines.forEach((line) => {
    textW = Math.max(textW, ctx.measureText(line).width);
  });

  const width = Math.ceil(textW + fs * 0.08);
  const height = Math.ceil(lines.length * lineH + fs * 0.12);

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(2, Math.floor(width * dpr));
  canvas.height = Math.max(2, Math.floor(height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  // White — pair with mix-blend difference on the title canvas (Auge / S mark)
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.font = `700 ${fs}px ${family}`;
  if (typeof ctx.letterSpacing !== 'undefined') ctx.letterSpacing = `${letterSpacing}px`;
  lines.forEach((line, i) => {
    ctx.fillText(line, width / 2, fs * 0.78 + i * lineH);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return { texture: tex, width, height };
}

/**
 * Bake intro copy at the live DOM box metrics so the GL plane never stretches.
 */
export function bakeDetailIntroTexture({
  text,
  maxWidth,
  fontSize = 22,
  lineHeight = 1.45,
  letterSpacing = 0,
  fontWeight = '450',
}) {
  const family = fontFamily();
  const fs = Math.max(14, fontSize);
  const lh = lineHeight > 4 ? lineHeight : fs * lineHeight; // px or unitless
  const padX = 0;
  const width = Math.max(120, Math.ceil(maxWidth));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontWeight} ${fs}px ${family}`;
  if (letterSpacing && typeof ctx.letterSpacing !== 'undefined') {
    ctx.letterSpacing = `${letterSpacing}px`;
  }
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  words.forEach((word) => {
    const next = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(next).width <= width - padX * 2 || !cur) cur = next;
    else {
      lines.push(cur);
      cur = word;
    }
  });
  if (cur) lines.push(cur);

  const height = Math.max(fs, Math.ceil(lines.length * lh + fs * 0.2));
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(2, Math.floor(width * dpr));
  canvas.height = Math.max(2, Math.floor(height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#111111';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${fontWeight} ${fs}px ${family}`;
  if (letterSpacing && typeof ctx.letterSpacing !== 'undefined') {
    ctx.letterSpacing = `${letterSpacing}px`;
  }
  lines.forEach((line, i) => {
    ctx.fillText(line, padX, fs * 0.82 + i * lh);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return { texture: tex, width, height };
}

/** Read layout metrics from the live intro node for a 1:1 bake. */
export function introBakeMetricsFromEl(el) {
  if (!el) return null;
  const cs = getComputedStyle(el);
  const padL = parseFloat(cs.paddingLeft) || 0;
  const padR = parseFloat(cs.paddingRight) || 0;
  const width = Math.max(40, el.clientWidth - padL - padR);
  const fontSize = parseFloat(cs.fontSize) || 18;
  let lineHeight = parseFloat(cs.lineHeight);
  if (!Number.isFinite(lineHeight)) lineHeight = fontSize * 1.45;
  const letterSpacing = parseFloat(cs.letterSpacing) || 0;
  const fontWeight = cs.fontWeight || '450';
  return { width, fontSize, lineHeight, letterSpacing, fontWeight };
}

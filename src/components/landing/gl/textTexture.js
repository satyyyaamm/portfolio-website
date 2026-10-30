import * as THREE from 'three';

/**
 * Bake UI text into a canvas texture for WebGL mesh distortion.
 * Transparent background — samples with alpha in the distort shader.
 */
export function createTextTexture({
  lines,
  width,
  height,
  fill = '#000000',
  fontFamily = 'system-ui, sans-serif',
  fontWeight = '700',
  fontSize = 64,
  lineHeight = 1.15,
  letterSpacing = 0,
  align = 'left',
  valign = 'bottom',
  paddingX = 0,
  paddingY = 0,
  uppercase = false,
}) {
  const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(2, Math.floor(width * dpr));
  canvas.height = Math.max(2, Math.floor(height * dpr));
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = fill;
  ctx.textAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

  if (letterSpacing) {
    ctx.letterSpacing = `${letterSpacing}px`;
  }

  const prepared = lines.map((line) => (uppercase ? String(line).toUpperCase() : String(line)));
  const blockH = prepared.length * fontSize * lineHeight;
  let y;
  if (valign === 'top') y = paddingY + fontSize;
  else if (valign === 'middle') y = height / 2 - blockH / 2 + fontSize;
  else y = height - paddingY - (prepared.length - 1) * fontSize * lineHeight;

  const x =
    align === 'center' ? width / 2 : align === 'right' ? width - paddingX : paddingX;

  prepared.forEach((line, i) => {
    ctx.fillText(line, x, y + i * fontSize * lineHeight);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export function wrapLines(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = '';
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function paintCopyColumn(ctx, width, height, {
  label,
  lines,
  fontFamily,
  fontSize,
  fill,
  reservedTop,
  bodyLineH,
  bottomPad,
  blockH,
}) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = fill;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  if (label) {
    ctx.font = `500 ${fontSize}px ${fontFamily}`;
    if (typeof ctx.letterSpacing !== 'undefined') {
      ctx.letterSpacing = `${fontSize * 0.02}px`;
    }
    ctx.fillText(String(label).toUpperCase(), 0, fontSize * 0.95);
  }

  ctx.font = `400 ${fontSize}px ${fontFamily}`;
  if (typeof ctx.letterSpacing !== 'undefined') {
    ctx.letterSpacing = '0px';
  }
  const bodyTop = Math.max(reservedTop, height - blockH - bottomPad);
  lines.forEach((line, i) => {
    ctx.fillText(line, 0, bodyTop + fontSize * 0.85 + i * bodyLineH);
  });
}

/**
 * About-column texture.
 * Body is bottom-aligned to the SATYAM band. Widens (up to maxWidth) so the full
 * paragraph fits under the label slot without overlapping it.
 * Returns `{ texture, height, width, setLabel }` — setLabel repaints in place
 * (scramble-safe: no new Texture, no dispose).
 */
export function createCopyColumnTexture({
  width: minWidth,
  maxWidth = null,
  height: bandH,
  label = '',
  body,
  fontFamily = 'system-ui, sans-serif',
  fontSize = 16,
  fill = '#000000',
  gap = 13.6,
  labelSlot = null,
}) {
  const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = `400 ${fontSize}px ${fontFamily}`;

  const reservedTop =
    labelSlot != null
      ? labelSlot
      : fontSize * 1.2 + gap;
  const bodyLineH = fontSize * 1.35;
  const bottomPad = fontSize * 0.2;
  const band = Math.max(bandH || 0, reservedTop + bodyLineH + bottomPad);
  const maxBodyH = Math.max(bodyLineH, band - reservedTop - bottomPad);
  const widthCap = Math.max(minWidth, maxWidth || minWidth);

  let width = Math.max(40, minWidth);
  let lines = wrapLines(measure, body, width);
  let blockH = Math.max(bodyLineH, lines.length * bodyLineH);

  while (blockH > maxBodyH + 0.5 && width < widthCap) {
    const overflowLines = Math.max(1, Math.ceil(blockH / bodyLineH) - Math.floor(maxBodyH / bodyLineH));
    width = Math.min(widthCap, width + Math.max(28, overflowLines * fontSize * 2.2));
    lines = wrapLines(measure, body, width);
    blockH = Math.max(bodyLineH, lines.length * bodyLineH);
  }

  const height = Math.max(band, Math.ceil(reservedTop + blockH + bottomPad));

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(2, Math.floor(width * dpr));
  canvas.height = Math.max(2, Math.floor(height * dpr));
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const paintArgs = {
    label,
    lines,
    fontFamily,
    fontSize,
    fill,
    reservedTop,
    bodyLineH,
    bottomPad,
    blockH,
  };
  paintCopyColumn(ctx, width, height, paintArgs);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  const setLabel = (nextLabel) => {
    paintArgs.label = nextLabel;
    paintCopyColumn(ctx, width, height, paintArgs);
    texture.needsUpdate = true;
  };

  return { texture, height, width, setLabel };
}

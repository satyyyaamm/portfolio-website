import { useEffect, useRef, useState } from 'react';
import { toCanvas } from 'html-to-image';
import * as THREE from 'three';

/**
 * Body nodes for scroll bend. CTA stays live (clicks).
 */
const BODY_SELECTOR = [
  '.project-detail__section-label',
  '.project-detail__intro',
  '.project-detail__feature-list',
  /* Per-row so black hover can swap back to live DOM */
  '.project-detail__info-row',
  '.project-detail__year',
  /* Next strip: label + full copy column (name + kind) — never split kind off */
  '.project-detail__next-label',
  '.project-detail__next-copy',
].join(', ');

/** Info rows: hide GL bake on hover so CSS black invert works. */
function wireInfoRowLiveHover(el) {
  if (!(el instanceof HTMLElement) || el.dataset.glHoverWired === '1') return;
  el.dataset.glHoverWired = '1';
  el.addEventListener('pointerenter', () => {
    el.dataset.glLive = '1';
    el.classList.remove('is-gl-text');
  });
  el.addEventListener('pointerleave', () => {
    delete el.dataset.glLive;
    if (el.dataset.bendKey) el.classList.add('is-gl-text');
  });
}

function fontFamily() {
  if (typeof window === 'undefined') return 'system-ui, sans-serif';
  return (
    getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim() ||
    'system-ui, sans-serif'
  );
}

function yieldIdle(ms = 120) {
  return new Promise((r) => {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => r(), { timeout: ms });
    } else {
      setTimeout(r, Math.min(32, ms));
    }
  });
}

/**
 * Bake mega title only. Kind is a separate 1:1 plane so mega scale can’t crush it.
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
 * Kind label at the same CSS size as `.project-detail__title-hero-kind`
 * (clamp(0.72rem, 1.1vw, 0.85rem)) — never scaled with the mega title.
 */
export function bakeDetailKindTexture({ kind = '', vw = 1200 }) {
  const family = fontFamily();
  const kindText = String(kind || '')
    .trim()
    .toUpperCase();
  if (!kindText) return null;

  const rem =
    typeof document !== 'undefined'
      ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      : 16;
  const fs = Math.max(0.72 * rem, Math.min(0.85 * rem, vw * 0.011));
  const tracking = fs * 0.14;
  const padX = fs * 0.2;
  const padY = fs * 0.35;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `500 ${fs}px ${family}`;
  if (typeof ctx.letterSpacing !== 'undefined') ctx.letterSpacing = `${tracking}px`;
  const textW = ctx.measureText(kindText).width;
  const width = Math.ceil(textW + padX * 2);
  const height = Math.ceil(fs * 1.35 + padY);

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(2, Math.floor(width * dpr));
  canvas.height = Math.max(2, Math.floor(height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `500 ${fs}px ${family}`;
  if (typeof ctx.letterSpacing !== 'undefined') ctx.letterSpacing = `${tracking}px`;
  ctx.fillText(kindText, width / 2, height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return { texture: tex, width, height };
}

function textureFromCanvas(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.premultiplyAlpha = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

/** DOM → canvas at the live border box. DPR 1 keeps first-enter cheap. */
async function bakeDomTexture(el) {
  const rect = el.getBoundingClientRect();
  const width = Math.max(2, Math.ceil(rect.width));
  const height = Math.max(2, Math.ceil(rect.height));
  const cs = getComputedStyle(el);
  const style = {
    opacity: '1',
    visibility: 'visible',
    transform: 'none',
    animation: 'none',
    transition: 'none',
    filter: 'none',
    margin: '0',
    width: `${width}px`,
    height: `${height}px`,
    boxSizing: 'border-box',
    display: cs.display,
    flexDirection: cs.flexDirection,
    flexWrap: cs.flexWrap,
    justifyContent: cs.justifyContent,
    alignItems: cs.alignItems,
    alignContent: cs.alignContent,
    gap: cs.gap,
    rowGap: cs.rowGap,
    columnGap: cs.columnGap,
    color: cs.color,
    background: 'transparent',
    mixBlendMode: 'normal',
    font: cs.font,
    fontFamily: cs.fontFamily,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    fontStyle: cs.fontStyle,
    letterSpacing: cs.letterSpacing,
    lineHeight: cs.lineHeight,
    textAlign: cs.textAlign || 'left',
    textTransform: cs.textTransform,
    whiteSpace: cs.whiteSpace,
    WebkitFontSmoothing: cs.webkitFontSmoothing || 'auto',
    MozOsxFontSmoothing: cs.mozOsxFontSmoothing || 'auto',
    paddingTop: cs.paddingTop,
    paddingRight: cs.paddingRight,
    paddingBottom: cs.paddingBottom,
    paddingLeft: cs.paddingLeft,
  };
  // Fonts already loaded — skipFonts avoids embedding @font-face into SVG (huge cost)
  const canvas = await toCanvas(el, {
    pixelRatio: Math.min(2, window.devicePixelRatio || 1),
    skipFonts: true,
    cacheBust: false,
    width,
    height,
    style,
  });
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let ink = 0;
  const stride = Math.max(4, Math.floor(pixels.length / 8000 / 4) * 4);
  for (let i = 3; i < pixels.length; i += stride) ink += pixels[i];
  if (ink < 8) throw new Error('empty text bake');
  return { texture: textureFromCanvas(canvas), width, height };
}

function blockNodes(scrollEl) {
  const nodes = [];
  scrollEl?.querySelectorAll(BODY_SELECTOR).forEach((el, i) => {
    const id = `body-${i}`;
    el.dataset.bendKey = id;
    nodes.push({ el, id, layer: 'body' });
  });
  return nodes;
}

function inViewport(el, pad = 80) {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return false;
  return r.bottom > -pad && r.top < (window.innerHeight || 800) + pad;
}

/**
 * Bake detail copy for scroll bend — one node at a time on idle,
 * commit each immediately so enter stays interactive (live DOM until ready).
 */
export function useDetailCopyBakes({ scrollRef, enabled, projectKey }) {
  const [bakes, setBakes] = useState([]);
  const rectsRef = useRef({});
  const bakesRef = useRef([]);
  bakesRef.current = bakes;

  useEffect(() => {
    if (!enabled) return undefined;
    const scrollEl = scrollRef?.current;
    if (!scrollEl) return undefined;

    let dead = false;
    let resizeTimer = 0;
    let gen = 0;
    let baking = false;
    let pendingNear = false;

    const bakeQueue = async (preferNear = false) => {
      if (baking) {
        if (preferNear) pendingNear = true;
        return;
      }
      baking = true;
      // Full rebuilds cancel; near/next top-ups must not abort an in-flight pass
      const token = preferNear ? gen : ++gen;
      try {
        await (document.fonts?.ready || Promise.resolve());
        await yieldIdle(preferNear ? 40 : 200);
        if (dead || token !== gen) return;

        const nodes = blockNodes(scrollEl);
        const isNext = (n) => Boolean(n.el.closest('.project-detail__next'));
        const near = nodes.filter((n) => inViewport(n.el, preferNear ? 280 : 80));
        const nextNodes = nodes.filter(isNext);
        const rest = nodes.filter((n) => !isNext(n));
        // Next strip first (label + name/kind column), then above-fold, then the rest
        const ordered = [
          ...nextNodes,
          ...near.filter((n) => !isNext(n)),
          ...rest.filter((n) => !near.includes(n)),
        ];
        const seen = new Set();
        const queue = ordered.filter((n) => {
          if (seen.has(n.id)) return false;
          seen.add(n.id);
          return true;
        });

        const merged = new Map(bakesRef.current.map((item) => [item.id, item]));

        for (const node of queue) {
          if (dead || token !== gen) break;
          if (merged.has(node.id)) continue;
          if (preferNear && !inViewport(node.el, 320) && !isNext(node)) continue;
          if (node.el.getBoundingClientRect().width < 2) continue;
          let attempts = 0;
          let ok = false;
          while (attempts < 3 && !ok) {
            attempts += 1;
            try {
              const baked = { id: node.id, layer: node.layer, ...(await bakeDomTexture(node.el)) };
              if (dead || token !== gen) {
                baked.texture.dispose();
                return;
              }
              merged.set(node.id, baked);
              node.el.classList.add('is-gl-text');
              if (node.el.classList.contains('project-detail__info-row')) {
                wireInfoRowLiveHover(node.el);
              }
              // Ghost every text child in the next column too (name lines / kind)
              if (isNext(node)) {
                node.el.querySelectorAll('.project-detail__next-name, .project-detail__next-kind, .project-detail__next-name-line').forEach((child) => {
                  child.classList.add('is-gl-text');
                });
              }
              const snapshot = [...merged.values()];
              bakesRef.current = snapshot;
              setBakes(snapshot);
              ok = true;
            } catch (err) {
              if (attempts >= 3) console.warn('Detail text bend skipped', node.id, err);
              else await yieldIdle(80);
            }
          }
          await yieldIdle(preferNear || isNext(node) ? 32 : 160);
        }
      } finally {
        baking = false;
        if (!dead && pendingNear) {
          pendingNear = false;
          bakeQueue(true);
        }
      }
    };

    // Let the detail frame settle before first bake
    const start = window.setTimeout(() => bakeQueue(false), 480);
    let scrollBakeTimer = 0;
    const onScrollBake = () => {
      window.clearTimeout(scrollBakeTimer);
      scrollBakeTimer = window.setTimeout(() => bakeQueue(true), 90);
    };
    scrollEl.addEventListener('scroll', onScrollBake, { passive: true });
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        // Dispose + clear so apply rebuilds
        bakesRef.current.forEach((item) => item.texture.dispose());
        bakesRef.current = [];
        setBakes([]);
        scrollEl.querySelectorAll('.is-gl-text').forEach((el) => {
          el.classList.remove('is-gl-text');
        });
        scrollEl.querySelectorAll('[data-bend-key]').forEach((el) => {
          delete el.dataset.bendKey;
        });
        bakeQueue(false);
      }, 500);
    };
    window.addEventListener('resize', onResize);

    return () => {
      dead = true;
      window.clearTimeout(start);
      window.clearTimeout(resizeTimer);
      window.clearTimeout(scrollBakeTimer);
      scrollEl.removeEventListener('scroll', onScrollBake);
      window.removeEventListener('resize', onResize);
      scrollEl.querySelectorAll('.is-gl-text').forEach((el) => {
        el.classList.remove('is-gl-text');
      });
      scrollEl.querySelectorAll('[data-bend-key]').forEach((el) => {
        delete el.dataset.bendKey;
      });
      bakesRef.current.forEach((item) => item.texture.dispose());
      bakesRef.current = [];
      setBakes([]);
    };
  }, [enabled, scrollRef, projectKey]);

  return { bakes, rectsRef };
}

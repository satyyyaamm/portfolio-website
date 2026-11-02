import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import { DistortSurface } from '../landing/gl/DistortSurface.jsx';

/**
 * Contacts warp — same Auge bake path as About.
 * GIFs stay live DOM (animate through GL alpha holes). Email / Open IG·LI = baked.
 */

const BAKE_SELECTOR = [
  /* One plane for the whole lockup — per-glyph bakes were shredding alignment */
  '.contact-hero__lockup',
  '.contact-panel--hero .contact-kicker',
  '.contact-email',
  '.contact-panel__link',
  '.contact-panel__city',
  '.contact-panel--office .contact-kicker',
  '.contact-panel__lines',
].join(', ');

/* Hover texture swap inside GL (not live-DOM — that jumped). */
const HOVER_LIVE = new Set(['contact-kicker', 'contact-email', 'contact-panel__link']);

function PixelCamera({ stageRef }) {
  const { camera, size, gl } = useThree();
  useLayoutEffect(() => {
    if (!camera.isOrthographicCamera) return;
    const stage = stageRef?.current;
    const br = stage?.getBoundingClientRect?.();
    const w = Math.max(1, Math.round(br?.width || size.width || 1));
    const h = Math.max(1, Math.round(br?.height || size.height || 1));
    camera.left = 0;
    camera.right = w;
    camera.top = 0;
    camera.bottom = -h;
    camera.position.set(0, 0, 400);
    camera.near = 0.1;
    camera.far = 4000;
    camera.updateProjectionMatrix();
    gl.setSize(w, h, false);
    gl.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  }, [camera, gl, size.width, size.height, stageRef]);
  return null;
}

function measure(el, stageBox) {
  if (!el || !stageBox) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  return {
    left: r.left - stageBox.left,
    top: r.top - stageBox.top,
    width: r.width,
    height: r.height,
  };
}

/**
 * Sticky stack: GL sits above the DOM, so later panels can't naturally cover
 * earlier warp planes. Return the stage-Y (from top) of the next panel's top
 * edge so the shader can clip — previous section keeps mess/bend above that line.
 */
function panelStackIndex(panel) {
  const stack = panel?.parentElement;
  if (!stack) return -1;
  const panels = stack.querySelectorAll(':scope > .contact-panel');
  for (let i = 0; i < panels.length; i += 1) {
    if (panels[i] === panel) return i;
  }
  return -1;
}

/** Stage Y of the covering sticky edge, or -1 if nothing covers this panel. */
function stickyCoverClipBottom(panel, stageBox) {
  if (!panel || !stageBox) return -1;
  const stack = panel.parentElement;
  if (!stack) return -1;
  const idx = panelStackIndex(panel);
  if (idx < 0) return -1;
  const pr = panel.getBoundingClientRect();
  const zThis = Number.parseInt(getComputedStyle(panel).zIndex, 10) || 0;
  const panels = stack.querySelectorAll(':scope > .contact-panel');
  let clip = -1;
  for (let i = idx + 1; i < panels.length; i += 1) {
    const next = panels[i];
    const nr = next.getBoundingClientRect();
    const zNext = Number.parseInt(getComputedStyle(next).zIndex, 10) || 0;
    if (zNext < zThis) continue;
    const overlap = Math.min(pr.bottom, nr.bottom) - Math.max(pr.top, nr.top);
    if (overlap <= 1) continue;
    const top = nr.top - stageBox.top;
    if (clip < 0 || top < clip) clip = top;
  }
  return clip;
}

function yieldIdle(ms = 80) {
  return new Promise((r) => {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => r(), { timeout: ms });
    } else {
      setTimeout(r, Math.min(32, ms));
    }
  });
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

function applyTransform(text, transform) {
  if (transform === 'uppercase') return text.toUpperCase();
  if (transform === 'lowercase') return text.toLowerCase();
  if (transform === 'capitalize') {
    return text.replace(/(^|\s)(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
  }
  return text;
}

function collapse(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function lineBoxesForTextNode(node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
  if (rects.length === 0) return [];
  if (rects.length === 1) {
    const t = rects[0];
    return [{ text: node.data, left: t.left, top: t.top, height: t.height }];
  }
  const data = node.data;
  const lines = [];
  let cur = null;
  for (let i = 0; i < data.length; i += 1) {
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    const box = range.getBoundingClientRect();
    if (box.width === 0 && box.height === 0) {
      if (cur) cur.chars.push(data[i]);
      continue;
    }
    if (!cur || Math.abs(box.top - cur.top) > 1) {
      cur = { chars: [data[i]], left: box.left, top: box.top, height: box.height };
      lines.push(cur);
      continue;
    }
    cur.chars.push(data[i]);
    cur.left = Math.min(cur.left, box.left);
    cur.height = Math.max(cur.height, box.height);
  }
  return lines.map((l) => ({
    text: l.chars.join(''),
    left: l.left,
    top: l.top,
    height: l.height,
  }));
}

function parseColor(cssColor) {
  if (!cssColor || cssColor === 'transparent') return null;
  const m = cssColor.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
  if (!m) return cssColor;
  if (m[4] != null && Number(m[4]) === 0) return null;
  return cssColor;
}

/** Hover paint (Auge keeps hover inside GL — no live-DOM swap / no position jump). */
function hoverPaintFor(el) {
  if (
    el.classList.contains('contact-kicker') ||
    el.classList.contains('contact-email') ||
    el.classList.contains('contact-panel__link')
  ) {
    return { color: '#fdf48b' };
  }
  return null;
}

/** Paint fills + borders like Auge `kind:"solid"` so chrome survives ghosting. */
function paintSolids(ctx, el, host, paint = null) {
  const cs = getComputedStyle(el);
  const w = host.width;
  const h = host.height;
  const radius = Math.min(
    parseFloat(cs.borderTopLeftRadius) || 0,
    w / 2,
    h / 2
  );
  const bg = parseColor(paint?.backgroundColor) || parseColor(cs.backgroundColor);
  if (bg) {
    ctx.fillStyle = bg;
    if (radius > 0.5 && typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, radius);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, w, h);
    }
  } else if (paint?.backgroundColor) {
    ctx.fillStyle = paint.backgroundColor;
    if (radius > 0.5 && typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, radius);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, w, h);
    }
  }
  const bw = Math.max(
    parseFloat(cs.borderTopWidth) || 0,
    parseFloat(cs.borderRightWidth) || 0,
    parseFloat(cs.borderBottomWidth) || 0,
    parseFloat(cs.borderLeftWidth) || 0
  );
  const borderColor =
    parseColor(paint?.borderColor) ||
    parseColor(cs.borderTopColor) ||
    parseColor(cs.borderRightColor) ||
    parseColor(cs.borderBottomColor) ||
    parseColor(cs.borderLeftColor) ||
    parseColor(cs.color);
  if (bw >= 0.5 && borderColor) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = bw;
    if (radius > 0.5 && typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(bw / 2, bw / 2, w - bw, h - bw, Math.max(0, radius - bw / 2));
      ctx.stroke();
    } else if (
      parseFloat(cs.borderBottomWidth) > 0 &&
      parseFloat(cs.borderTopWidth) < 0.5 &&
      parseFloat(cs.borderLeftWidth) < 0.5
    ) {
      ctx.fillStyle = borderColor;
      ctx.fillRect(0, h - parseFloat(cs.borderBottomWidth), w, parseFloat(cs.borderBottomWidth));
    } else {
      ctx.strokeRect(bw / 2, bw / 2, w - bw, h - bw);
    }
  }
}

function paintMedia(ctx, el, host) {
  el.querySelectorAll('img, video').forEach((media) => {
    /* Type/copy bakes leave holes — GIFs have their own live planes */
    if (el.classList.contains('contact-hero__lockup') && media.closest('.contact-hero__media')) {
      return;
    }
    const panelMedia = media.closest('.contact-panel__media');
    if (panelMedia && panelMedia !== el) return;
    const ready =
      media instanceof HTMLImageElement
        ? media.complete && media.naturalWidth > 0
        : media instanceof HTMLVideoElement
          ? media.readyState >= 2
          : false;
    if (!ready) return;
    const box = media.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) return;
    try {
      ctx.drawImage(
        media,
        box.left - host.left,
        box.top - host.top,
        box.width,
        box.height
      );
    } catch {
      /* cross-origin / decode */
    }
  });
}

/** Hero ⤷ arrow — SVG never hits the text walker, so stroke it into the bake. */
function paintHeroArrows(ctx, el, host, paint = null) {
  el.querySelectorAll('.contact-hero__arrow svg').forEach((svg) => {
    const box = svg.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) return;
    const color =
      paint?.color ||
      getComputedStyle(svg.parentElement || svg).color ||
      getComputedStyle(svg).color ||
      '#000';
    const vb = svg.viewBox?.baseVal;
    const vw = vb?.width || 64;
    const vh = vb?.height || 72;
    ctx.save();
    ctx.translate(box.left - host.left, box.top - host.top);
    ctx.scale(box.width / vw, box.height / vh);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(new Path2D('M18 6c2 18 4 34 22 46'));
    ctx.stroke(new Path2D('M28 46c8 2 14 4 16 8l-12 2 4-14'));
    ctx.restore();
  });
}

/** Underlines (canvas fillText skips text-decoration). */
function paintUnderlines(ctx, el, host, paint = null) {
  const labels = [
    ...el.querySelectorAll('.contact-email__label'),
    ...(el.classList.contains('contact-panel__link')
      ? [el.querySelector('span:first-child')].filter(Boolean)
      : []),
  ];
  labels.forEach((label) => {
    const box = label.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) return;
    const cs = getComputedStyle(label);
    const color = paint?.color || cs.color;
    const thickness = Math.max(1, box.height * 0.055);
    const offset = box.height * 0.22;
    ctx.fillStyle = color;
    ctx.fillRect(box.left - host.left, box.bottom - host.top + offset - thickness, box.width, thickness);
  });
}

/**
 * Auge-style bake: solids + media + text into one canvas sized to the element.
 * Optional `paint` overrides = hover look without leaving GL.
 */
function bakeElement(el, paint = null, opts = {}) {
  const host = el.getBoundingClientRect();
  const width = Math.max(2, Math.ceil(host.width));
  const height = Math.max(2, Math.ceil(host.height));
  if (width < 2 || height < 2) throw new Error('empty box');

  const runs = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.data?.trim()) continue;
    const parent = node.parentElement;
    if (!parent) continue;
    if (parent.closest('.contact-hero__media')) continue;
    if (parent.closest('.contact-panel__media')) continue;
    /* Scramble A / T bake into the lockup so they share the mesh warp */
    const cs = getComputedStyle(parent);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const lines = lineBoxesForTextNode(node)
      .map((line) => ({
        ...line,
        text: collapse(applyTransform(line.text, cs.textTransform)),
      }))
      .filter((line) => line.text.length > 0);
    if (!lines.length) continue;
    /* Accent fill can be transparent via background-clip — keep bake yellow solid */
    const accent = parent.classList.contains('contact-hero__accent')
      || Boolean(parent.closest('.contact-hero__accent'));
    runs.push({
      font: `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`,
      fontSizePx: parseFloat(cs.fontSize) || 16,
      color: accent ? '#fdf48b' : paint?.color || cs.color,
      accent,
      letterSpacing: cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing,
      lines,
    });
  }

  // Match detail bake — 2x on retina so warped type stays sharp
  const dpr = opts.dpr ?? Math.min(2, window.devicePixelRatio || 1);
  const canvas = opts.canvas || document.createElement('canvas');
  const tw = Math.max(2, Math.ceil(width * dpr));
  const th = Math.max(2, Math.ceil(height * dpr));
  if (canvas.width !== tw || canvas.height !== th) {
    canvas.width = tw;
    canvas.height = th;
  }
  const ctx = opts.ctx || canvas.getContext('2d', { alpha: true, willReadFrequently: false });
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.textBaseline = 'alphabetic';
  ctx.imageSmoothingEnabled = true;
  if (ctx.imageSmoothingQuality) ctx.imageSmoothingQuality = 'high';

  paintSolids(ctx, el, host, paint);
  /* Transparent lockup bake — a full cream fill read as a box outline around the title */
  const lockup = el.classList.contains('contact-hero__lockup');
  paintMedia(ctx, el, host);
  paintHeroArrows(ctx, el, host, paint);

  /* Bake yellow R/Y/? with the lockup so they share the same mesh bend */
  for (const run of runs) {
    ctx.font = run.font;
    if (typeof ctx.letterSpacing !== 'undefined') ctx.letterSpacing = run.letterSpacing;
    const metrics = ctx.measureText('Hg');
    const ascent = metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent || 0;
    const descent = metrics.fontBoundingBoxDescent || metrics.actualBoundingBoxDescent || 0;
    const ratio = ascent + descent > 0 ? ascent / (ascent + descent) : 0.8;
    for (const line of run.lines) {
      // Snap to device pixels — subpixel fillText reads soft on retina
      const x = Math.round((line.left - host.left) * dpr) / dpr;
      const baseline = Math.round((line.top - host.top + line.height * ratio) * dpr) / dpr;
      /* Local cream underpaint for yellow only — kills dark AA fringe without a title box */
      if (run.accent) {
        ctx.fillStyle = '#edeee5';
        ctx.fillText(line.text, x, baseline);
      }
      ctx.fillStyle = run.color;
      ctx.fillText(line.text, x, baseline);
    }
  }

  if (lockup) {
    el.querySelectorAll('.contact-hero__media').forEach((media) => {
      const box = media.getBoundingClientRect();
      if (box.width < 2 || box.height < 2) return;
      ctx.clearRect(box.left - host.left, box.top - host.top, box.width, box.height);
    });
  }

  paintUnderlines(ctx, el, host, paint);

  if (!opts.skipInk) {
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let ink = 0;
    const stride = Math.max(4, Math.floor(pixels.length / 8000 / 4) * 4);
    for (let i = 3; i < pixels.length; i += stride) ink += pixels[i];
    if (ink < 8) throw new Error('empty bake');
  }

  if (opts.texture) {
    opts.texture.needsUpdate = true;
    return { texture: opts.texture, width, height, canvas, ctx, dpr };
  }
  return { texture: textureFromCanvas(canvas), width, height, canvas, ctx, dpr };
}

/** Stay in GL on hover — only flip dataset so the plane swaps to hoverTexture. */
function wireHover(el) {
  if (el.dataset.warpHoverWired === '1') return;
  el.dataset.warpHoverWired = '1';
  el.addEventListener('pointerenter', () => {
    el.dataset.glHover = '1';
  });
  el.addEventListener('pointerleave', () => {
    delete el.dataset.glHover;
  });
}

function inViewport(el, pad = 80) {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return false;
  return r.bottom > -pad && r.top < (window.innerHeight || 800) + pad;
}

function wantsHover(el) {
  return [...el.classList].some((c) => HOVER_LIVE.has(c));
}

function useContactBakes(scrollRef, enabled, contentKey) {
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
      const token = preferNear ? gen : ++gen;
      try {
        await (document.fonts?.ready || Promise.resolve());
        const narrow =
          typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches;
        await yieldIdle(preferNear ? (narrow ? 100 : 40) : narrow ? 320 : 200);
        if (dead || token !== gen) return;

        /* Stable keys — never wipe bendKey mid-frame */
        const candidates = [...scrollEl.querySelectorAll(BAKE_SELECTOR)].filter((el) => {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') return false;
          return el.getBoundingClientRect().width >= 2;
        });
        const nodes = candidates.map((el, i) => {
          if (!el.dataset.bendKey) {
            el.dataset.bendKey = `contact-${i}-${Math.random().toString(36).slice(2, 8)}`;
          }
          return { el, id: el.dataset.bendKey };
        });
        const liveEls = new Set(nodes.map((n) => n.el));
        scrollEl.querySelectorAll('[data-bend-key]').forEach((el) => {
          if (!liveEls.has(el)) {
            delete el.dataset.bendKey;
            delete el.dataset.glHover;
            el.classList.remove('is-gl-text');
          }
        });

        // Hero lockup first; then above-fold; then rest
        const typeNodes = nodes.filter((n) => n.el.classList.contains('contact-hero__lockup'));
        const near = nodes.filter(
          (n) =>
            !n.el.classList.contains('contact-hero__lockup') &&
            inViewport(n.el, preferNear ? 280 : 80)
        );
        const rest = nodes.filter((n) => !typeNodes.includes(n) && !near.includes(n));
        const ordered = [...typeNodes, ...near, ...rest];
        const keepIds = new Set(nodes.map((n) => n.id));
        const merged = new Map();
        bakesRef.current.forEach((item) => {
          if (!keepIds.has(item.id)) {
            item.texture.dispose();
            item.hoverTexture?.dispose();
            return;
          }
          merged.set(item.id, item);
        });

        for (const node of ordered) {
          if (dead || token !== gen) break;
          if (merged.has(node.id)) {
            node.el.classList.add('is-gl-text');
            continue;
          }
          if (
            preferNear &&
            !node.el.classList.contains('contact-hero__lockup') &&
            !inViewport(node.el, 320)
          ) {
            continue;
          }
          if (node.el.getBoundingClientRect().width < 2) continue;
          try {
            const was = node.el.classList.contains('is-gl-text');
            if (was) node.el.classList.remove('is-gl-text');
            const cleared = [];
            node.el.querySelectorAll('.contact-hero__tok-in, .contact-panel__city-in').forEach((n) => {
              cleared.push([n, n.style.transform]);
              n.style.transform = 'none';
            });
            /* Leave GIF hole in lockup bake — live DOM shows through GL alpha */
            const hiddenMedia = [];
            node.el.querySelectorAll('.contact-hero__media, .contact-panel__media').forEach((n) => {
              hiddenMedia.push([n, n.style.visibility]);
              n.style.visibility = 'hidden';
            });
            let bits;
            let hoverTexture = null;
            try {
              bits = bakeElement(node.el);
              const hoverPaint = wantsHover(node.el) ? hoverPaintFor(node.el) : null;
              if (hoverPaint) {
                try {
                  hoverTexture = bakeElement(node.el, hoverPaint).texture;
                } catch {
                  hoverTexture = null;
                }
              }
            } finally {
              cleared.forEach(([n, t]) => {
                n.style.transform = t;
              });
              hiddenMedia.forEach(([n, v]) => {
                n.style.visibility = v;
              });
            }
            if (was) node.el.classList.add('is-gl-text');
            if (dead || token !== gen) {
              bits.texture.dispose();
              hoverTexture?.dispose();
              return;
            }
            merged.set(node.id, { id: node.id, ...bits, hoverTexture });
            node.el.classList.add('is-gl-text');
            if (wantsHover(node.el)) wireHover(node.el);
            bakesRef.current = [...merged.values()];
            if (merged.size <= 2 || merged.size % 3 === 0 || preferNear) {
              setBakes(bakesRef.current);
            }
          } catch (err) {
            console.warn('Contact bake skipped', node.id, err);
          }
          const narrowGap =
            typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches;
          await yieldIdle(preferNear ? (narrowGap ? 64 : 16) : narrowGap ? 140 : 24);
        }
        if (!dead && token === gen) setBakes(bakesRef.current);
      } finally {
        baking = false;
        if (!dead && pendingNear) {
          pendingNear = false;
          bakeQueue(true);
        }
      }
    };

    /* Wait for hero rise + font-fit; phones defer longer so open isn't frozen */
    const narrow =
      typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches;
    const start = window.setTimeout(
      () => bakeQueue(Boolean(narrow)),
      narrow ? 1400 : 400
    );
    let scrollBakeTimer = 0;
    const onScrollBake = () => {
      window.clearTimeout(scrollBakeTimer);
      scrollBakeTimer = window.setTimeout(() => bakeQueue(true), narrow ? 180 : 90);
    };
    scrollEl.addEventListener('scroll', onScrollBake, { passive: true });

    const onMediaReady = () => bakeQueue(true);
    scrollEl.querySelectorAll('img, video').forEach((media) => {
      media.addEventListener('load', onMediaReady, { once: true });
      media.addEventListener('loadeddata', onMediaReady, { once: true });
    });

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        bakesRef.current.forEach((item) => item.texture.dispose());
        bakesRef.current = [];
        setBakes([]);
        scrollEl.querySelectorAll('.is-gl-text').forEach((el) => el.classList.remove('is-gl-text'));
        scrollEl.querySelectorAll('[data-bend-key]').forEach((el) => {
          delete el.dataset.bendKey;
          delete el.dataset.glHover;
          delete el.dataset.glReady;
          delete el.dataset.ctaFlowWired;
          delete el.dataset.ctaBakeReady;
        });
        bakeQueue(false);
      }, 500);
    };
    window.addEventListener('resize', onResize);

    // Re-assert ghosts after React re-renders wipe .is-gl-text from className
    let ghostRaf = 0;
    const reassertGhosts = () => {
      ghostRaf = 0;
      const baked = new Set(bakesRef.current.map((b) => b.id));
      scrollEl.querySelectorAll('[data-bend-key]').forEach((el) => {
        const id = el.dataset.bendKey;
        if (!id || !baked.has(id)) return;
        el.classList.add('is-gl-text');
      });
    };
    const ghostMo = new MutationObserver(() => {
      if (ghostRaf) return;
      ghostRaf = window.requestAnimationFrame(reassertGhosts);
    });
    ghostMo.observe(scrollEl, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      dead = true;
      window.clearTimeout(start);
      window.clearTimeout(resizeTimer);
      window.clearTimeout(scrollBakeTimer);
      if (ghostRaf) window.cancelAnimationFrame(ghostRaf);
      ghostMo.disconnect();
      scrollEl.removeEventListener('scroll', onScrollBake);
      window.removeEventListener('resize', onResize);
      scrollEl.querySelectorAll('.is-gl-text').forEach((el) => el.classList.remove('is-gl-text'));
      scrollEl.querySelectorAll('.contact-panel.is-panel-covered').forEach((el) => {
        el.classList.remove('is-panel-covered');
      });
      scrollEl.querySelectorAll('.is-gl-occluded').forEach((el) => {
        el.classList.remove('is-gl-occluded');
      });
      scrollEl.querySelectorAll('[data-bend-key]').forEach((el) => {
        delete el.dataset.bendKey;
        delete el.dataset.glHover;
        delete el.dataset.glReady;
      });
      bakesRef.current.forEach((item) => {
        item.texture.dispose();
        item.hoverTexture?.dispose();
      });
      bakesRef.current = [];
      setBakes([]);
    };
  }, [enabled, scrollRef, contentKey]);

  return { bakes, rectsRef };
}

function ContactScene({
  scrollRef,
  stageRef,
  bakes,
  rectsRef,
  mouseRef,
  simRef,
  paramsRef,
  reducedMotion,
}) {
  const { size, gl } = useThree();
  const scrollSampleRef = useRef({ top: null, vel: 0 });
  const bakesRef = useRef(bakes);
  const byIdRef = useRef(new Map());
  const bendElsRef = useRef([]);
  const pageRef = useRef(null);
  const measureTick = useRef(0);
  bakesRef.current = bakes;

  useLayoutEffect(() => {
    gl.setClearColor(0x000000, 0);
  }, [gl]);

  useLayoutEffect(() => {
    byIdRef.current = new Map((bakes || []).map((b) => [b.id, b]));
    const page = scrollRef?.current?.closest('.contact-page');
    pageRef.current = page || null;
    bendElsRef.current = page ? [...page.querySelectorAll('[data-bend-key]')] : [];
  }, [bakes, scrollRef]);

  useFrame((_, dt) => {
    const m = mouseRef.current;
    const stage = stageRef?.current;
    const br = stage?.getBoundingClientRect?.();
    m.vw = Math.max(1, Math.round(br?.width || size.width || 1));
    m.vh = Math.max(1, Math.round(br?.height || size.height || 1));
    const speed = Math.hypot(m.x - m.px, m.y - m.py) / Math.max(dt, 0.001);
    m.px = m.x;
    m.py = m.y;
    const moving = speed > 28;
    const target =
      m.inside && !reducedMotion && moving
        ? Math.min(0.1615, 0.0323 + speed * 0.000226)
        : m.inside && !reducedMotion
          ? Math.min(0.05, speed * 0.0001)
          : 0;
    m.strength += (target - m.strength) * (m.inside ? 0.16 : 0.1);

    const scroller = scrollRef?.current;
    const sample = scrollSampleRef.current;
    if (scroller) {
      const top = scroller.scrollTop;
      if (sample.top == null) {
        sample.top = top;
        sample.vel = 0;
      } else {
        const instant = (top - sample.top) / Math.max(dt, 0.001);
        sample.top = top;
        sample.vel += (instant - sample.vel) * (1 - Math.exp(-Math.max(dt, 0.001) * 12));
        if (Math.abs(sample.vel) < 6) sample.vel = 0;
      }
      const sim = simRef.current;
      sim.userVelocity = sample.vel;
      /* No matrix skew — bend is uScrollBend in the shader only */
      sim.skew = 0;
      sim.skewTarget = 0;
    }

    const byId = byIdRef.current;
    const page = pageRef.current;
    if (!page) return;

    // Idle: measure every 2nd frame; scrolling/mouse: every frame
    const busy = Math.abs(sample.vel) > 6 || m.strength > 0.01 || moving;
    measureTick.current += 1;
    if (!busy && measureTick.current % 2 !== 0) return;

    const stageBox = page.getBoundingClientRect();
    const els = bendElsRef.current;
    const clipByPanel = new Map();
    for (let i = 0; i < els.length; i += 1) {
      const el = els[i];
      const id = el.dataset.bendKey;
      if (!id) continue;
      if (!rectsRef.current[id]) rectsRef.current[id] = { current: null };
      /* Never treat is-gl-text ghost opacity as hidden — that killed the hero GIF / copy */
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') {
        rectsRef.current[id].current = { suppress: true };
        continue;
      }
      const panel = el.closest('.contact-panel');
      let clipBottom = -1;
      if (panel) {
        if (clipByPanel.has(panel)) {
          clipBottom = clipByPanel.get(panel);
        } else {
          clipBottom = stickyCoverClipBottom(panel, stageBox);
          clipByPanel.set(panel, clipBottom);
        }
      }
      const box = measure(el, stageBox);
      if (box) {
        const baked = byId.get(id);
        if (el.dataset.glHover === '1' && baked?.hoverTexture) {
          box.texture = baked.hoverTexture;
        } else if (baked?.texture) {
          box.texture = baked.texture;
        }
        /* Keep warp alive above the next sticky edge (Auge); only park if fully under it */
        if (clipBottom >= 0) {
          if (box.top >= clipBottom - 1) {
            box.suppress = true;
          } else {
            box.clipBottom = clipBottom;
          }
        }
      }
      rectsRef.current[id].current = box;
    }
  });

  return (
    <>
      <PixelCamera stageRef={stageRef} />
      {(bakes || []).map((item) => {
        if (!rectsRef.current[item.id]) rectsRef.current[item.id] = { current: null };
        return (
          <DistortSurface
            key={item.id}
            texture={item.texture}
            rectRef={rectsRef.current[item.id]}
            mouseRef={mouseRef}
            paramsRef={paramsRef}
            simRef={simRef}
            reducedMotion={reducedMotion}
            mode="alpha"
            depthWrite={false}
            segments={[32, 40]}
          />
        );
      })}
    </>
  );
}

export function ContactSurfaceWarp({ scrollRef, contentKey = '' }) {
  const reducedMotion = useReducedMotion();
  const enabled = !reducedMotion;
  const stageRef = useRef(null);
  const mouseRef = useRef({
    x: 0,
    y: 0,
    px: 0,
    py: 0,
    clientX: 0,
    clientY: 0,
    inside: false,
    strength: 0,
    vw: 1,
    vh: 1,
  });
  const simRef = useRef({
    userVelocity: 0,
    drag: { active: false },
    skew: 0,
    skewTarget: 0,
    clickRipple: null,
  });
  /* Viewport sheet-bend (uScrollBend) + mouse mess; no skew lean */
  const paramsRef = useRef({
    spreadPct: 56,
    strengthPct: 170,
    edgeAxis: 'tb',
    edgeWidth: 0.48,
    edgeRefractMul: 0,
    scrollBendVh: 0.16,
    scrollBendSpeed: 900,
    scrollBendEase: 0.04,
    scrollBendTop: 1,
  });
  const { bakes, rectsRef } = useContactBakes(scrollRef, enabled, contentKey);

  useEffect(() => {
    const page = scrollRef?.current?.closest('.contact-page');
    if (!page) return undefined;
    page.classList.toggle('is-screen-warp', (bakes || []).length > 0);
    return () => page.classList.remove('is-screen-warp');
  }, [bakes, scrollRef]);

  useEffect(() => {
    if (!enabled) return undefined;
    const scrollEl = scrollRef?.current;
    const page = scrollEl?.closest('.contact-page');
    if (!page) return undefined;
    const onMove = (e) => {
      const rect = page.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      const m = mouseRef.current;
      m.inside = inside;
      if (!inside) return;
      m.x = e.clientX - rect.left;
      m.y = e.clientY - rect.top;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      page.classList.remove('is-screen-warp');
    };
  }, [enabled, scrollRef]);

  if (!enabled) return null;

  return (
    <>
      <div className="contact-gl-stage" ref={stageRef} aria-hidden>
        <Canvas
          className="contact-gl-stage__canvas"
          orthographic
          flat
          linear
          dpr={[1, 2]}
          frameloop="always"
          resize={{ scroll: false, debounce: 0 }}
          camera={{ position: [0, 0, 400], near: 0.1, far: 4000 }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
            premultipliedAlpha: false,
          }}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            pointerEvents: 'none',
            position: 'absolute',
            inset: 0,
          }}
          onCreated={({ gl: threeGl }) => {
            threeGl.setClearColor(0x000000, 0);
            threeGl.toneMapping = THREE.NoToneMapping;
            const stage = stageRef.current;
            if (stage) {
              const r = stage.getBoundingClientRect();
              threeGl.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
            }
          }}
        >
          <ContactScene
            scrollRef={scrollRef}
            stageRef={stageRef}
            bakes={bakes}
            rectsRef={rectsRef}
            mouseRef={mouseRef}
            simRef={simRef}
            paramsRef={paramsRef}
            reducedMotion={Boolean(reducedMotion)}
          />
        </Canvas>
      </div>
      {/* Above GL — animated GIFs (warp canvas was covering live DOM media) */}
      <ContactGifOverlay scrollRef={scrollRef} />
    </>
  );
}

/** Position-synced GIF layer above the GL stage so animations stay visible. */
function ContactGifOverlay({ scrollRef }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let raf = 0;
    const page = () => scrollRef?.current?.closest('.contact-page');

    const sync = () => {
      const root = page();
      if (!root) {
        raf = window.requestAnimationFrame(sync);
        return;
      }
      const stage = root.getBoundingClientRect();
      const next = [];
      root.querySelectorAll('.contact-hero__media, .contact-panel__media').forEach((el, i) => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return;
        const panel = el.closest('.contact-panel');
        const clip = stickyCoverClipBottom(panel, stage);
        const top = r.top - stage.top;
        const left = r.left - stage.left;
        let height = r.height;
        if (clip >= 0) {
          if (top >= clip - 1) return;
          height = Math.min(height, clip - top);
        }
        if (height < 2) return;
        const media = el.querySelector('img, video');
        const src =
          media instanceof HTMLImageElement
            ? media.currentSrc || media.src
            : media instanceof HTMLVideoElement
              ? media.currentSrc || media.src
              : '';
        if (!src) return;
        if (!el.dataset.gifOverlayKey) {
          el.dataset.gifOverlayKey = `gif-${i}-${Math.random().toString(36).slice(2, 7)}`;
        }
        next.push({
          key: el.dataset.gifOverlayKey,
          kind: media instanceof HTMLVideoElement ? 'video' : 'image',
          src,
          left,
          top,
          width: r.width,
          height,
          radius: cs.borderRadius || '0',
        });
      });
      setItems((prev) => {
        if (
          prev.length === next.length &&
          prev.every((p, idx) => {
            const n = next[idx];
            return (
              p.key === n.key &&
              p.src === n.src &&
              Math.abs(p.left - n.left) < 0.5 &&
              Math.abs(p.top - n.top) < 0.5 &&
              Math.abs(p.width - n.width) < 0.5 &&
              Math.abs(p.height - n.height) < 0.5
            );
          })
        ) {
          return prev;
        }
        return next;
      });
      root.classList.toggle('has-gif-overlay', next.length > 0);
      raf = window.requestAnimationFrame(sync);
    };

    raf = window.requestAnimationFrame(sync);
    return () => {
      window.cancelAnimationFrame(raf);
      page()?.classList.remove('has-gif-overlay');
    };
  }, [scrollRef]);

  return (
    <div className="contact-gif-overlay" aria-hidden>
      {items.map((item) => (
        <div
          key={item.key}
          className="contact-gif-overlay__item"
          style={{
            left: item.left,
            top: item.top,
            width: item.width,
            height: item.height,
            borderRadius: item.radius,
          }}
        >
          {item.kind === 'video' ? (
            <video src={item.src} muted loop playsInline autoPlay preload="metadata" />
          ) : (
            <img src={item.src} alt="" draggable={false} />
          )}
        </div>
      ))}
    </div>
  );
}

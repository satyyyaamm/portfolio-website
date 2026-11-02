import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import { DistortSurface } from '../landing/gl/DistortSurface.jsx';

/**
 * About warp — Auge XP path:
 * - Text / solids / media → canvas → DistortSurface (bend + mouse mess)
 * - CTAs stay live DOM (wipe + hover). Baking them caused DOM+GL doubles
 *   after re-scroll when React/Motion reset ghost classes.
 */

const BAKE_SELECTOR = [
  '.about-hero__word',
  '.about-hero__story > .about-kicker:not(.about-reel)',
  '.about-type',
  '.about-reel',
  '.about-us__intro > .about-kicker',
  '.about-us__copy',
  '.about-service',
  '.about-shipped__head',
  '.about-shipped__row',
].join(', ');

/* Hover texture swap inside GL (not live-DOM — that jumped). */
const HOVER_LIVE = new Set([
  'about-shipped__row',
  'about-service',
  'about-kicker',
  'about-shipped__head',
  'about-reel',
]);

function PixelCamera() {
  const { camera, size, gl } = useThree();
  useLayoutEffect(() => {
    if (!camera.isOrthographicCamera) return;
    const w = Math.max(1, Math.round(size.width));
    const h = Math.max(1, Math.round(size.height));
    camera.left = 0;
    camera.right = w;
    camera.top = 0;
    camera.bottom = -h;
    camera.position.set(0, 0, 400);
    camera.near = 0.1;
    camera.far = 4000;
    camera.updateProjectionMatrix();
    if (gl.domElement.width !== w || gl.domElement.height !== h) {
      gl.setSize(w, h, false);
    }
  }, [camera, gl, size.width, size.height]);
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
  if (el.classList.contains('about-shipped__row')) {
    return { backgroundColor: '#000', color: '#fff', borderColor: '#000' };
  }
  if (el.classList.contains('about-reel') || el.classList.contains('about-kicker')) {
    return { color: '#fdf48b' };
  }
  if (el.classList.contains('about-service')) {
    return { color: '#000' };
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
    if (parent.closest('.about-type__media')) continue;
    if (parent.closest('.about-type__scramble')) continue;
    const cs = getComputedStyle(parent);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const lines = lineBoxesForTextNode(node)
      .map((line) => ({
        ...line,
        text: collapse(applyTransform(line.text, cs.textTransform)),
      }))
      .filter((line) => line.text.length > 0);
    if (!lines.length) continue;
    runs.push({
      font: `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`,
      color: paint?.color || cs.color,
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
  paintMedia(ctx, el, host);

  for (const run of runs) {
    ctx.font = run.font;
    ctx.fillStyle = run.color;
    if (typeof ctx.letterSpacing !== 'undefined') ctx.letterSpacing = run.letterSpacing;
    const metrics = ctx.measureText('Hg');
    const ascent = metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent || 0;
    const descent = metrics.fontBoundingBoxDescent || metrics.actualBoundingBoxDescent || 0;
    const ratio = ascent + descent > 0 ? ascent / (ascent + descent) : 0.8;
    for (const line of run.lines) {
      // Snap to device pixels — subpixel fillText reads soft on retina
      const x = Math.round((line.left - host.left) * dpr) / dpr;
      const baseline = Math.round((line.top - host.top + line.height * ratio) * dpr) / dpr;
      ctx.fillText(line.text, x, baseline);
    }
  }

  if (!opts.skipInk) {
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let ink = 0;
    const stride = Math.max(4, Math.floor(pixels.length / 8000 / 4) * 4);
    for (let i = 3; i < pixels.length; i += stride) ink += pixels[i];
    if (ink < 8) throw new Error('empty bake');
  }

  if (opts.texture) {
    opts.texture.needsUpdate = true;
    return { texture: opts.texture, width, height, canvas, ctx };
  }
  return { texture: textureFromCanvas(canvas), width, height, canvas, ctx };
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

function useAboutBakes(scrollRef, enabled, contentKey) {
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
        await yieldIdle(preferNear ? 40 : 200);
        if (dead || token !== gen) return;

        const nodes = [...scrollEl.querySelectorAll(BAKE_SELECTOR)].map((el, i) => {
          const id = `about-${i}`;
          el.dataset.bendKey = id;
          return { el, id };
        });
        // Type lockup first — biggest visual; then above-fold; then rest
        const typeNodes = nodes.filter((n) => n.el.classList.contains('about-type'));
        const near = nodes.filter(
          (n) => !n.el.classList.contains('about-type') && inViewport(n.el, preferNear ? 280 : 80)
        );
        const rest = nodes.filter((n) => !typeNodes.includes(n) && !near.includes(n));
        const ordered = [...typeNodes, ...near, ...rest];
        const merged = new Map(bakesRef.current.map((item) => [item.id, item]));

        for (const node of ordered) {
          if (dead || token !== gen) break;
          if (merged.has(node.id)) {
            node.el.classList.add('is-gl-text');
            continue;
          }
          if (
            preferNear &&
            !node.el.classList.contains('about-type') &&
            !inViewport(node.el, 320)
          ) {
            continue;
          }
          if (node.el.getBoundingClientRect().width < 2) continue;
          try {
            const was = node.el.classList.contains('is-gl-text');
            if (was) node.el.classList.remove('is-gl-text');
            const bits = bakeElement(node.el);
            let hoverTexture = null;
            const hoverPaint = wantsHover(node.el) ? hoverPaintFor(node.el) : null;
            if (hoverPaint) {
              try {
                hoverTexture = bakeElement(node.el, hoverPaint).texture;
              } catch {
                hoverTexture = null;
              }
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
            console.warn('About bake skipped', node.id, err);
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

    // Phones: let Lenis/scroll settle before baking — instant bake froze touch for seconds.
    const narrow =
      typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches;
    const start = window.setTimeout(
      () => bakeQueue(Boolean(narrow)),
      narrow ? 1400 : 500
    );
    let scrollBakeTimer = 0;
    const onScrollBake = () => {
      window.clearTimeout(scrollBakeTimer);
      scrollBakeTimer = window.setTimeout(() => bakeQueue(true), narrow ? 180 : 90);
    };
    scrollEl.addEventListener('scroll', onScrollBake, { passive: true });

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
        scrollEl.querySelectorAll('.about-cta').forEach((el) => {
          el.classList.remove('is-gl-text');
          delete el.dataset.bendKey;
          delete el.dataset.glReady;
        });
        const actions = scrollEl.querySelector('.about-actions');
        if (actions) {
          delete actions.dataset.ctaBakeReady;
          delete actions.dataset.ctaFlowWired;
        }
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

    // Drop leftover GL ghosts on live-DOM controls from earlier builds
    scrollEl.querySelectorAll('.about-cta, .about-us__cta').forEach((el) => {
      el.classList.remove('is-gl-text');
      delete el.dataset.bendKey;
      delete el.dataset.glReady;
      delete el.dataset.glHover;
    });
    const actions = scrollEl.querySelector('.about-actions');
    if (actions) {
      delete actions.dataset.ctaBakeReady;
      delete actions.dataset.ctaFlowWired;
    }

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

function AboutScene({ scrollRef, bakes, rectsRef, mouseRef, simRef, paramsRef, reducedMotion }) {
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
    const page = scrollRef?.current?.closest('.about-page');
    pageRef.current = page || null;
    bendElsRef.current = page ? [...page.querySelectorAll('[data-bend-key]')] : [];
  }, [bakes, scrollRef]);

  useFrame((_, dt) => {
    const m = mouseRef.current;
    m.vw = size.width;
    m.vh = size.height;
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
      simRef.current.userVelocity = sample.vel;
    }

    const page = pageRef.current;
    if (!page) return;

    // Idle: measure every 2nd frame; scrolling/mouse: every frame
    const busy = Math.abs(sample.vel) > 6 || m.strength > 0.01 || moving;
    measureTick.current += 1;
    if (!busy && measureTick.current % 2 !== 0) return;

    const stageBox = page.getBoundingClientRect();
    const byId = byIdRef.current;
    const els = bendElsRef.current;
    for (let i = 0; i < els.length; i += 1) {
      const el = els[i];
      const id = el.dataset.bendKey;
      if (!id) continue;
      if (!rectsRef.current[id]) rectsRef.current[id] = { current: null };
      const box = measure(el, stageBox);
      if (box) {
        const baked = byId.get(id);
        if (el.dataset.glHover === '1' && baked?.hoverTexture) {
          box.texture = baked.hoverTexture;
        } else if (baked?.texture) {
          box.texture = baked.texture;
        }
      }
      rectsRef.current[id].current = box;
    }
  });

  return (
    <>
      <PixelCamera />
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
            segments={[24, 32]}
          />
        );
      })}
    </>
  );
}

export function AboutSurfaceWarp({ scrollRef, contentKey = '' }) {
  const reducedMotion = useReducedMotion();
  const enabled = !reducedMotion;
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
    clickRipple: null,
  });
  // Mild bend; edge liquid off on type (Detail) — mouse mess still on
  const paramsRef = useRef({
    spreadPct: 60,
    strengthPct: 200,
    edgeAxis: 'tb',
    edgeWidth: 0.42,
    edgeRefractMul: 0,
    scrollBendVh: 0.06,
    scrollBendSpeed: 1200,
    scrollBendEase: 0.032,
    scrollBendTop: 1,
  });
  const { bakes, rectsRef } = useAboutBakes(scrollRef, enabled, contentKey);

  useEffect(() => {
    const page = scrollRef?.current?.closest('.about-page');
    if (!page) return undefined;
    page.classList.toggle('is-screen-warp', (bakes || []).length > 0);
    return () => page.classList.remove('is-screen-warp');
  }, [bakes, scrollRef]);

  useEffect(() => {
    if (!enabled) return undefined;
    const scrollEl = scrollRef?.current;
    const page = scrollEl?.closest('.about-page');
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
    <div className="about-gl-stage" aria-hidden>
      <Canvas
        className="about-gl-stage__canvas"
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
        }}
      >
        <AboutScene
          scrollRef={scrollRef}
          bakes={bakes}
          rectsRef={rectsRef}
          mouseRef={mouseRef}
          simRef={simRef}
          paramsRef={paramsRef}
          reducedMotion={Boolean(reducedMotion)}
        />
      </Canvas>
    </div>
  );
}

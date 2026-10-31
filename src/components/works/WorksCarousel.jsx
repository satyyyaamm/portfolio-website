import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from 'framer-motion';
import { scrambleFrame } from '../landing/Scramble.jsx';
import { createSoundSequence, playHoverSound, playSound } from '../../lib/siteSound.js';
import { projectCategory, splitTitleLines } from '../../lib/worksUrl.js';
import {
  DESKTOP_MIN,
  STACK_SLOTS,
  distLerp,
  groupsNeededPerSide,
  scaleT,
  stepHeight,
  worksLayout,
} from './worksLayout.js';

const WHEEL_GAIN = 1.15;
const WHEEL_CAP = 220;
const COAST = 0.03;
const INTRO_LERP = 0.1;
const SNAP_LERP = 0.048;
const SNAP_VEL = 140;

function snapS(S, step, dir = 0) {
  if (step <= 0) return S;
  const pos = S / step;
  if (dir > 0) return Math.round(pos + 0.22) * step;
  if (dir < 0) return Math.round(pos - 0.22) * step;
  return Math.round(pos) * step;
}

function wrap(value, period) {
  if (period <= 0) return value;
  let next = value % period;
  if (next < 0) next += period;
  return next;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export function WorksCarousel({
  projects = [],
  paused = false,
  onOpenProject,
  onViewTip,
  velocityRef,
  dragRef,
  pulseRef,
  glRectsRef,
  children,
}) {
  const reducedMotion = useReducedMotion();
  const rootRef = useRef(null);
  const [namesHost, setNamesHost] = useState(null);
  const fillBlackRef = useRef(null);
  const fillCreamRef = useRef(null);
  const mediaRefs = useRef([]);
  const mediaInnerRefs = useRef([]);
  const mediaZoomRefs = useRef([]);
  const mediaVeilRefs = useRef([]);
  const mediaImgRefs = useRef([]);
  const hitRefs = useRef([]);
  const thumbRefs = useRef([]);
  const indexRefs = useRef([]);
  const titleRefs = useRef([]);
  const titleLineRefs = useRef([]);
  const kindRefs = useRef([]);
  const kindTextRefs = useRef([]);

  const count = projects.length;
  const copies = useMemo(() => {
    const sides = groupsNeededPerSide(count, STACK_SLOTS);
    return 2 * sides + 1;
  }, [count]);
  const virtualCount = copies * Math.max(count, 1);
  const centerCopy = Math.floor(copies / 2);

  const items = useMemo(() => {
    const list = [];
    for (let i = 0; i < virtualCount; i += 1) {
      const project = projects[i % count];
      list.push({
        key: `${Math.floor(i / count)}-${project?.slug || i}`,
        project,
        projectIndex: count ? i % count : 0,
        display: i,
      });
    }
    return list;
  }, [projects, virtualCount, count]);

  const simRef = useRef({
    S: 0,
    target: 0,
    vel: 0,
    period: 1,
    step: 80,
    lastIndex: null,
    lastStepAt: 0,
    dragging: false,
    moved: false,
    startY: 0,
    startS: 0,
    lastY: 0,
    lastT: 0,
    flick: 0,
    hoverDisplay: null,
    hoverProject: null,
    opening: false,
    stepSeq: createSoundSequence('stepCarousel'),
    layout: worksLayout(1440, 900, true),
    vw: 1440,
    vh: 900,
    desktop: true,
    entered: false,
    introDone: false,
    dir: 0,
    lastS: 0,
    displayVel: 0,
    titleMetrics: [],
  });

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !count) return undefined;
    const sim = simRef.current;
    let raf = 0;
    let last = performance.now();

    const measure = () => {
      const rect = el.getBoundingClientRect();
      sim.vw = rect.width;
      sim.vh = rect.height;
      sim.desktop = rect.width >= DESKTOP_MIN;
      sim.layout = worksLayout(rect.width, rect.height, sim.desktop);
      sim.step = stepHeight(rect.height);
      sim.period = count * sim.step;
      if (!sim.entered) {
        sim.S = reducedMotion ? 0 : -10 * sim.step;
        sim.target = 0;
        sim.lastS = sim.S;
        sim.entered = true;
      }
      const t = scaleT(rect.width);
      const titlePx = sim.desktop ? Math.max(30, 60 * t) : 30;
      titleRefs.current.forEach((node, i) => {
        if (!node) return;
        node.style.fontSize = `${titlePx}px`;
        node.style.transform = 'scale(1)';
        sim.titleMetrics[i] = { w: node.offsetWidth, h: node.offsetHeight };
      });
    };

    const applyMedia = (slot, progress, cover, z) => {
      const node = mediaRefs.current[slot];
      if (!node) return;
      const p = clamp(progress, 0, 1);
      node.style.transform = `scaleY(${p})`;
      node.style.opacity = p > 0 ? '1' : '0';
      node.style.zIndex = String(z);
      node.style.pointerEvents = p > 0.55 ? 'auto' : 'none';
      const inner = mediaInnerRefs.current[slot];
      if (inner) inner.style.transform = `scaleY(${1 / Math.max(p, 0.001)})`;
      const zoom = mediaZoomRefs.current[slot];
      if (zoom) zoom.style.transform = `scale(${1.2 - 0.2 * cover})`;
      const veil = mediaVeilRefs.current[slot];
      if (veil) veil.style.opacity = String(0.3 * cover);
    };

    const setMediaSrc = (slot, project) => {
      const img = mediaImgRefs.current[slot];
      if (!img || !project?.image) return;
      if (img.dataset.src === project.image) return;
      img.dataset.src = project.image;
      img.src = project.image;
      img.alt = project.name || '';
    };

    const layoutFrame = () => {
      const { layout, S, period, step, vw, vh, desktop } = sim;
      const wrapped = wrap(S, period);
      const pos = step > 0 ? wrapped / step : 0;
      const active = Math.round(pos) % count;
      const floor = Math.floor(pos);
      const frac = clamp(pos - floor, 0, 1);
      const dir = sim.vel >= 0 ? 1 : -1;
      const coverSlot = frac < 1e-6 || reducedMotion ? -1 : dir > 0 ? 1 : 0;
      const coverAmt = dir > 0 ? frac : 1 - frac;

      if (active !== sim.lastIndex && sim.lastIndex != null) {
        const now = performance.now();
        if (now - sim.lastStepAt > 80) {
          sim.lastStepAt = now;
          sim.stepSeq.play();
        }
      }
      sim.lastIndex = active;

      const loop = period > 0 ? Math.floor(S / period) : 0;
      const dark = ((loop % 2) + 2) % 2 === 0;
      const fillT = clamp(pos / count, 0, 1);
      const a = dark ? fillBlackRef.current : fillCreamRef.current;
      const b = dark ? fillCreamRef.current : fillBlackRef.current;
      if (a) {
        a.style.transform = `scaleY(${fillT})`;
        a.style.zIndex = '1';
      }
      if (b) {
        b.style.transform = 'scaleY(1)';
        b.style.zIndex = '0';
      }

      const mediaTop = vh / 2 - layout.mediaHeight / 2;
      const mediaRects = [];
      const thumbRects = [];
      const typeRects = [];
      const metaPx = Math.max(10.4, Math.min(13.6, vw * 0.0105));
      for (let slot = 0; slot < STACK_SLOTS; slot += 1) {
        const node = mediaRefs.current[slot];
        if (!node) continue;
        node.style.left = `${layout.mediaLeft}px`;
        node.style.top = `${mediaTop}px`;
        node.style.width = `${layout.mediaWidth}px`;
        node.style.height = `${layout.mediaHeight}px`;
        const projI = ((floor + 1 - slot) % count + count) % count;
        const progress = clamp(pos - (floor + 1 - slot) + 1, 0, 1);
        const project = projects[projI];
        setMediaSrc(slot, project);
        applyMedia(slot, progress, slot === coverSlot ? coverAmt : 0, STACK_SLOTS - slot);
        if (progress > 0.02 && project?.image) {
          mediaRects.push({
            src: project.image,
            left: layout.mediaLeft,
            top: mediaTop + layout.mediaHeight * (1 - progress),
            width: layout.mediaWidth,
            height: layout.mediaHeight * progress,
            coverHeight: layout.mediaHeight,
            z: STACK_SLOTS - slot,
          });
        }
      }

      const t = scaleT(vw);
      const rail = 60 * t;
      const indexBox = 110 * t;
      const titleSize = desktop ? Math.max(30, 60 * t) : 30;
      const awaySize = desktop ? Math.max(20, 40 * t) : 20;
      const indexApproach = (layout.centerX - layout.indexCenterRight) / Math.max(layout.centerX - layout.mediaLeft, 1);
      const titleApproach = (layout.titleCenterLeft - layout.centerX) / Math.max(layout.titleNearLeft - layout.centerX, 1);
      const extraY = desktop ? layout.mediaHeight / 2 + 80 * t - step : 180 - step;

      for (let i = 0; i < virtualCount; i += 1) {
        const item = items[i];
        const offset = (i - centerCopy * count) * step - wrapped;
        const v = step > 0 ? offset / step : 0;
        const dist = Math.abs(v);
        if (dist > 6) {
          const hide = (node) => {
            if (node) node.style.opacity = '0';
          };
          hide(hitRefs.current[i]);
          hide(thumbRefs.current[i]);
          hide(indexRefs.current[i]);
          hide(titleRefs.current[i]);
          hide(kindRefs.current[i]);
          continue;
        }
        const y = vh / 2 + offset + Math.sign(offset || 1) * extraY * clamp(dist, 0, 1);

        const hit = hitRefs.current[i];
        if (hit) {
          hit.style.height = `${step}px`;
          hit.style.top = `${y - step / 2}px`;
        }

        const thumb = thumbRefs.current[i];
        if (thumb && desktop) {
          const near = 1 - clamp(Math.abs(v), 0, 1);
          const tw = layout.thumbFarWidth + (layout.thumbCenterWidth - layout.thumbFarWidth) * near;
          const th = tw / 1.6;
          const tx =
            layout.thumbFarLeft +
            (layout.thumbCenterLeft - layout.thumbFarLeft) * near +
            (dist / 6) * rail;
          thumb.style.left = `${tx}px`;
          thumb.style.top = `${y - th / 2}px`;
          thumb.style.width = `${tw}px`;
          thumb.style.height = `${th}px`;
          thumb.style.opacity = dist < 5.4 ? '1' : '0';
          if (dist < 5.4 && item.project?.image) {
            thumbRects.push({
              src: item.project.image,
              left: tx,
              top: y - th / 2,
              width: tw,
              height: th,
            });
          }
        }

        const sizePx = titleSize + (awaySize - titleSize) * Math.min(dist, 1);
        const scale = titleSize > 0 ? sizePx / titleSize : 1;
        const title = titleRefs.current[i];
        const rest = sim.titleMetrics[i] || { w: 180, h: titleSize * 1.7 };
        const titleH = rest.h * scale;
        const titleW = rest.w * scale;
        const indexW = desktop ? indexBox : (indexRefs.current[i]?.offsetWidth || 48);
        const pairW = indexW + 20 + titleW;
        const pairPad = Math.max(0, (layout.titleCenterLeft - layout.indexCenterRight - pairW) / 2);
        const spread = 1 - distLerp(dist, 1);

        const idx = indexRefs.current[i];
        const ixToward = distLerp(dist, indexApproach);
        const k = layout.centerX - (layout.centerX - layout.mediaLeft) * ixToward;
        const ix = desktop ? k - indexBox : layout.indexCenterRight + pairPad * spread;
        if (idx) {
          idx.style.left = `${ix}px`;
          idx.style.top = `${y - 8}px`;
          idx.style.width = desktop ? `${indexBox}px` : 'auto';
          idx.style.transform = 'none';
          idx.style.opacity = dist > 5.5 ? '0' : '1';
        }
        if (dist <= 5.5) {
          typeRects.push({
            role: 'index',
            lines: [`(${String(item.projectIndex + 1).padStart(3, '0')})`],
            x: desktop ? ix + indexBox : ix,
            y: y - 8,
            fontSize: metaPx,
            weight: 500,
            tracking: 0.04,
            lineHeight: 1,
            align: desktop ? 'right' : 'left',
          });
        }

        const titleToward = distLerp(dist, titleApproach);
        const tx = desktop
          ? layout.centerX + (layout.titleNearLeft - layout.centerX) * titleToward
          : layout.titleCenterLeft - pairPad * spread - (desktop ? 0 : titleW);
        if (title) {
          title.style.left = `${tx}px`;
          title.style.top = `${y - titleH / 2}px`;
          title.style.fontSize = `${sizePx}px`;
          title.style.transform = 'none';
          title.style.opacity = dist > 5.5 ? '0' : '1';
        }
        if (dist <= 5.5) {
          const liveLines = title
            ? [...title.querySelectorAll('span')].map((span) => span.textContent || '')
            : splitTitleLines(item.project?.name);
          typeRects.push({
            role: 'title',
            lines: liveLines,
            x: tx,
            y: y - titleH / 2,
            fontSize: sizePx,
            weight: 800,
            tracking: -0.055,
            lineHeight: 0.85,
            align: desktop ? 'left' : 'right',
          });
        }

        const kind = kindRefs.current[i];
        const showKind =
          i === sim.hoverDisplay ||
          (sim.hoverDisplay == null && item.projectIndex === active && dist < 0.45);
        const kx = desktop
          ? layout.centerX + (layout.titleNearLeft - layout.centerX) * titleToward
          : layout.titleCenterLeft - pairPad * spread;
        if (kind && title) {
          kind.style.left = `${kx}px`;
          kind.style.top = `${y - titleH / 2 + titleH + 8}px`;
          kind.style.opacity = showKind ? '1' : '0';
        }
        if (showKind) {
          typeRects.push({
            role: 'kind',
            lines: [kindTextRefs.current[i]?.textContent || projectCategory(item.project)],
            x: kx,
            y: y - titleH / 2 + titleH + 8,
            fontSize: metaPx,
            weight: 500,
            tracking: 0.06,
            lineHeight: 1,
            align: 'left',
          });
        }
      }

      if (dragRef) dragRef.current = sim.dragging;
      if (glRectsRef) {
        glRectsRef.current.media = mediaRects;
        glRectsRef.current.thumbs = thumbRects;
        glRectsRef.current.types = typeRects;
        glRectsRef.current.fill = {
          black: dark ? fillT : 1,
          cream: dark ? 1 : fillT,
          blackOnTop: dark,
        };
      }
    };

    const tick = (now) => {
      const dt = Math.min(0.048, (now - last) / 1000);
      last = now;
      if (!paused) sim.opening = false;
      if (!paused && !sim.opening && !sim.dragging) {
        const step = sim.step || 1;
        if (!sim.introDone) {
          const ease = 1 - (1 - INTRO_LERP) ** (dt * 60);
          sim.S += (sim.target - sim.S) * ease;
          if (Math.abs(sim.target - sim.S) < 0.6) {
            sim.S = sim.target;
            sim.introDone = true;
          }
        } else if (Math.abs(sim.vel) > SNAP_VEL) {
          sim.S += sim.vel * dt;
          sim.vel *= COAST ** dt;
          if (sim.vel) sim.dir = Math.sign(sim.vel);
        } else {
          sim.target = snapS(sim.S, step, sim.dir);
          const ease = 1 - (1 - SNAP_LERP) ** (dt * 60);
          sim.vel *= 0.12 ** dt;
          sim.S += (sim.target - sim.S) * ease + sim.vel * dt * 0.28;
          if (Math.abs(sim.target - sim.S) < step * 0.012 && Math.abs(sim.vel) < 10) {
            sim.S = sim.target;
            sim.vel = 0;
            sim.dir = 0;
          }
        }
      }
      const instant = (sim.S - sim.lastS) / Math.max(dt, 0.001);
      sim.lastS = sim.S;
      const follow = 1 - Math.exp(-Math.max(dt, 0.001) * 3.2);
      sim.displayVel += (instant - sim.displayVel) * follow;
      if (Math.abs(sim.displayVel) < 4) sim.displayVel = 0;
      if (velocityRef) velocityRef.current = sim.displayVel;
      layoutFrame();
      raf = requestAnimationFrame(tick);
    };

    measure();
    layoutFrame();
    raf = requestAnimationFrame(tick);
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    const onWheel = (event) => {
      if (paused || sim.opening) return;
      event.preventDefault();
      const raw = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const add = clamp(raw * WHEEL_GAIN, -WHEEL_CAP, WHEEL_CAP);
      sim.introDone = true;
      sim.vel = clamp(sim.vel * 0.72 + add * 18, -2400, 2400);
      if (add) sim.dir = Math.sign(add);
    };

    const hitDisplay = (target) => {
      const node = target?.closest?.('[data-display-index]');
      if (!node) return null;
      const i = Number(node.dataset.displayIndex);
      return Number.isFinite(i) ? i : null;
    };

    const pickDisplayAt = (x, y) => {
      const stack = document.elementsFromPoint?.(x, y) || [];
      for (const node of stack) {
        if (node.closest?.('[data-works-media]')) {
          return items.findIndex(
            (entry) => entry.projectIndex === sim.lastIndex && entry.display >= centerCopy * count
          );
        }
        const display = hitDisplay(node);
        if (display != null) return display;
      }
      return null;
    };

    const restoreTitle = (display) => {
      const item = items[display];
      const title = titleRefs.current[display];
      if (!item || !title) return;
      const lines = splitTitleLines(item.project?.name);
      title.querySelectorAll('[data-gl-text]').forEach((span, i) => {
        span.textContent = lines[i] || '';
      });
      const kind = kindTextRefs.current[display];
      if (kind) kind.textContent = projectCategory(item.project);
    };

    let scrambleTimer = 0;
    const scrambleItem = (display) => {
      const item = items[display];
      if (!item) return;
      if (scrambleTimer) window.clearInterval(scrambleTimer);
      const title = titleRefs.current[display];
      const kind = kindTextRefs.current[display];
      const lines = splitTitleLines(item.project?.name);
      const spans = title ? [...title.querySelectorAll('[data-gl-text]')] : [];
      let frame = 0;
      scrambleTimer = window.setInterval(() => {
        frame += 1;
        const t = frame / 10;
        spans.forEach((span, i) => {
          span.textContent = scrambleFrame(lines[i] || '', t);
        });
        if (kind) kind.textContent = scrambleFrame(projectCategory(item.project), t);
        if (frame >= 10) {
          window.clearInterval(scrambleTimer);
          scrambleTimer = 0;
        }
      }, 28);
    };

    const syncHover = (event) => {
      const display = pickDisplayAt(event.clientX, event.clientY);
      const projectIndex =
        display != null && display >= 0 ? items[display]?.projectIndex : null;
      if (projectIndex === sim.hoverProject) {
        sim.hoverDisplay = display != null && display >= 0 ? display : null;
        return;
      }
      if (sim.hoverDisplay != null) restoreTitle(sim.hoverDisplay);
      sim.hoverProject = projectIndex ?? null;
      sim.hoverDisplay = display != null && display >= 0 ? display : null;
      if (sim.hoverDisplay != null) {
        playHoverSound('hoverProject');
        scrambleItem(sim.hoverDisplay);
      }
    };

    const onDown = (event) => {
      if (paused || sim.opening || event.button !== 0) return;
      sim.dragging = true;
      sim.moved = false;
      sim.startY = event.clientY;
      sim.startS = sim.S;
      sim.lastY = event.clientY;
      sim.lastT = performance.now();
      sim.flick = 0;
      sim.vel = 0;
      sim.introDone = true;
      el.setPointerCapture?.(event.pointerId);
    };

    const onMove = (event) => {
      if (!sim.dragging) syncHover(event);
      const tipOn = sim.hoverDisplay != null;
      onViewTip?.(event.clientX, event.clientY, tipOn);
      if (!sim.dragging) return;
      const dy = event.clientY - sim.startY;
      if (Math.abs(dy) > 6) sim.moved = true;
      const now = performance.now();
      const dt = now - sim.lastT;
      if (dt > 0) {
        const inst = (event.clientY - sim.lastY) / dt;
        sim.flick = sim.flick * 0.5 + inst * 0.5;
      }
      sim.lastY = event.clientY;
      sim.lastT = now;
      sim.S = sim.startS + dy;
      if (dy) sim.dir = Math.sign(dy);
    };

    const onUp = (event) => {
      if (!sim.dragging) return;
      sim.dragging = false;
      try {
        el.releasePointerCapture?.(event.pointerId);
      } catch {
        /* noop */
      }
      if (sim.moved) {
        const flick = clamp(sim.flick * 1000, -2200, 2200);
        if (Math.abs(flick) > 90) {
          sim.vel = flick;
          sim.dir = Math.sign(flick);
        } else {
          sim.vel = 0;
          sim.target = snapS(sim.S, sim.step, sim.dir);
        }
        return;
      }
      const display = hitDisplay(event.target);
      const projectIndex =
        display != null ? items[display]?.projectIndex : sim.lastIndex;
      const item =
        display != null
          ? items[display]
          : items.find((entry) => entry.projectIndex === projectIndex);
      if (projectIndex == null || !item?.project) return;
      playSound('clickProject');
      sim.opening = true;
      const media = mediaRefs.current[0];
      const rect = media?.getBoundingClientRect?.();
      if (pulseRef) {
        pulseRef.current = { x: event.clientX, y: event.clientY, at: performance.now() };
      }
      onOpenProject?.(projectIndex, rect
        ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height, src: item.project.image }
        : null);
    };

    const onLeave = () => {
      if (sim.hoverDisplay != null) restoreTitle(sim.hoverDisplay);
      sim.hoverDisplay = null;
      sim.hoverProject = null;
      onViewTip?.(0, 0, false);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('pointerleave', onLeave);
      if (scrambleTimer) window.clearInterval(scrambleTimer);
    };
  }, [count, copies, items, paused, projects, onOpenProject, onViewTip, velocityRef, dragRef, pulseRef, glRectsRef, virtualCount, centerCopy, reducedMotion]);

  useLayoutEffect(() => {
    setNamesHost(rootRef.current?.closest('.works-page') || null);
  }, []);

  if (!count) return null;

  const names = (
    <div className="works-names" aria-hidden={false}>
      {items.map((item, i) => {
        const lines = splitTitleLines(item.project?.name);
        const kind = projectCategory(item.project);
        const num = String((item.projectIndex + 1)).padStart(3, '0');
        return (
          <div key={`${item.key}-name`} className="works-name">
            <p
              ref={(node) => {
                indexRefs.current[i] = node;
              }}
              className="works-index"
              data-display-index={i}
            >
              ({num})
            </p>
            <h3
              ref={(node) => {
                titleRefs.current[i] = node;
                titleLineRefs.current[i] = [];
              }}
              className="works-title"
              data-display-index={i}
            >
              {lines.map((line) => (
                <span key={line} data-gl-text="true">
                  {line}
                </span>
              ))}
            </h3>
            <p
              ref={(node) => {
                kindRefs.current[i] = node;
              }}
              className="works-kind"
              data-display-index={i}
            >
              <span
                ref={(node) => {
                  kindTextRefs.current[i] = node;
                }}
                data-gl-text="true"
              >
                {kind}
              </span>
            </p>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
    <div className="works-carousel" ref={rootRef}>
      <div className="works-fills" aria-hidden>
        <div ref={fillBlackRef} className="works-fill works-fill--black" data-gl-solid="true" />
        <div ref={fillCreamRef} className="works-fill works-fill--cream" data-gl-solid="true" />
      </div>

      <div className="works-stack">
        {Array.from({ length: STACK_SLOTS }, (_, slot) => (
          <div
            key={slot}
            ref={(node) => {
              mediaRefs.current[slot] = node;
            }}
            className="works-media"
            data-hover-target="media"
            data-gl-clip="true"
            data-gl-alpha="true"
            data-works-media="true"
          >
            <div
              ref={(node) => {
                mediaInnerRefs.current[slot] = node;
              }}
              className="works-media__inner"
            >
              <div
                ref={(node) => {
                  mediaZoomRefs.current[slot] = node;
                }}
                className="works-media__zoom"
              >
                <img
                  ref={(node) => {
                    mediaImgRefs.current[slot] = node;
                  }}
                  alt=""
                  data-gl-image="true"
                />
                <div
                  ref={(node) => {
                    mediaVeilRefs.current[slot] = node;
                  }}
                  className="works-media__veil"
                  data-gl-solid="true"
                  data-gl-alpha="true"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {children}

      {items.map((item, i) => (
          <div key={item.key} className="works-row">
            <div
              ref={(node) => {
                hitRefs.current[i] = node;
              }}
              className="works-row__hit"
              data-display-index={i}
              aria-hidden
            />
            <div
              ref={(node) => {
                thumbRefs.current[i] = node;
              }}
              className="works-thumb"
              data-display-index={i}
              data-gl-clip="true"
            >
              {item.project?.image ? (
                <img src={item.project.image} alt="" data-gl-image="true" />
              ) : null}
            </div>
          </div>
      ))}
    </div>
    {namesHost ? createPortal(names, namesHost) : names}
    </>
  );
}

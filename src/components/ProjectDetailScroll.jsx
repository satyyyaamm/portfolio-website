import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { createPortal } from 'react-dom';
import Lenis from 'lenis';
import { ScrambleHover } from './landing/Scramble.jsx';
import './project-detail.css';

const EASE = [0.22, 1, 0.36, 1];
const RISE = { hidden: { opacity: 0, y: 36 }, show: { opacity: 1, y: 0 } };

/** Mega → pinned size (keep pinned readable — Auge stays ~mid, not micro) */
const TITLE_FS_MAX_PX = 180;
const TITLE_FS_MIN_PX = 52;
const PIN_TOP_PX = 20;

function splitTitle(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { line1: name.toUpperCase(), line2: '' };
  if (parts.length === 2) {
    return { line1: parts[0].toUpperCase(), line2: parts[1].toUpperCase() };
  }
  const mid = Math.ceil(parts.length / 2);
  return {
    line1: parts.slice(0, mid).join(' ').toUpperCase(),
    line2: parts.slice(mid).join(' ').toUpperCase(),
  };
}

function typeLabel(previewFrame) {
  if (previewFrame === 'mobile') return 'App';
  if (previewFrame === 'web') return 'Website';
  return 'Project';
}

function featureLabel(text = '') {
  return String(text || '').trim();
}

function infoRows(project) {
  const yearMatch = String(project?.meta || '').match(/\b(20\d{2})\b/);
  const year = yearMatch?.[1] || String(new Date().getFullYear());
  const rows = [];
  if (project?.role) rows.push({ year, mid: 'Role', end: project.role });
  const parts = String(project?.meta || '')
    .split(/·|•/)
    .map((p) => p.trim())
    .filter(Boolean);
  parts.forEach((part, i) => {
    const looksLikeDates = /\d{4}|Present|Live|Concept|Pre-production/i.test(part);
    const looksLikeStack = /Flutter|Next\.?js|Firebase|React|Mobile|Web/i.test(part);
    let mid = 'Detail';
    if (i === 0) mid = 'Field';
    else if (looksLikeDates) mid = 'Timeline';
    else if (looksLikeStack) mid = 'Stack';
    else if (/Live|Concept|Pre-production|Production/i.test(part)) mid = 'Status';
    rows.push({ year, mid, end: part });
  });
  return rows.slice(0, 5);
}

function projectYear(project) {
  const match = String(project?.meta || '').match(/\b(20\d{2})\b/);
  return match?.[1] || String(new Date().getFullYear());
}

function galleryItems(project, heroSrc) {
  const list = Array.isArray(project?.gallery) ? project.gallery.filter(Boolean) : [];
  if (list.length) return list;
  return heroSrc ? [heroSrc] : [];
}

/** Split gallery: a few shots → challenge → remaining shots → solution */
function splitGallery(shots) {
  if (!shots.length) return { before: [], after: [] };
  if (shots.length === 1) return { before: shots, after: [] };
  if (shots.length === 2) return { before: [shots[0]], after: [shots[1]] };
  const beforeCount = Math.min(3, Math.ceil(shots.length / 2));
  return {
    before: shots.slice(0, beforeCount),
    after: shots.slice(beforeCount),
  };
}

function clamp01(t) {
  return Math.max(0, Math.min(1, t));
}

function smoothstep(t) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function titleMaxPx(vw) {
  return Math.max(64, Math.min(TITLE_FS_MAX_PX, 0.1 * vw + 100));
}

function titleMinPx(vw) {
  // ~52px desktop, never below ~40px on narrow screens
  return Math.max(40, Math.min(TITLE_FS_MIN_PX, 0.045 * vw + 28));
}

/**
 * Detail scroll:
 * - Entry: 50/50 — top half hero image, bottom half project name
 * - Scroll up: full-bleed hero
 * - Scroll down: title docks + description / gallery
 */
export function ProjectDetailScroll({ project, heroSrc, titleId = 'project-open-title' }) {
  const reducedMotion = useReducedMotion();
  const rootRef = useRef(null);
  const heroMediaRef = useRef(null);
  const slotRef = useRef(null);
  const floatRef = useRef(null);
  const entrySetRef = useRef(false);
  const entryTitleTopRef = useRef(null);
  const lenisRef = useRef(null);
  const [scrollRoot, setScrollRoot] = useState(null);
  const [stageEl, setStageEl] = useState(null);

  const title = useMemo(() => splitTitle(project?.name || ''), [project?.name]);
  const kind = useMemo(() => typeLabel(project?.previewFrame), [project?.previewFrame]);
  const features = useMemo(
    () => (project?.highlights || []).map(featureLabel).filter(Boolean),
    [project?.highlights]
  );
  const rows = useMemo(() => infoRows(project), [project]);
  const shots = useMemo(() => galleryItems(project, heroSrc), [project, heroSrc]);
  const { before: shotsBefore, after: shotsAfter } = useMemo(() => splitGallery(shots), [shots]);
  const body = project?.summary || project?.desc || '';
  const challenge = project?.challenge || '';
  const solution = project?.solution || '';
  // Only real live cases get the © / View project column
  const href = project?.href && project.href !== '#' ? project.href : null;
  const showCaseLink = Boolean(href);
  const year = useMemo(() => projectYear(project), [project]);

  useEffect(() => {
    const root = rootRef.current?.closest('.project-open__scroll') ?? null;
    setScrollRoot(root);
    setStageEl(root?.closest('.project-open__detail-stage') ?? null);
  }, []);

  // Lenis (Auge-like inertia) + scroll-driven hero/title on the detail scroller
  useEffect(() => {
    const root = scrollRoot;
    const stage = stageEl;
    const slot = slotRef.current;
    const float = floatRef.current;
    const media = heroMediaRef.current;
    if (!root || !stage || !slot || !float) return undefined;

    const content = root.firstElementChild;
    let lenis = null;

    if (!reducedMotion && content instanceof HTMLElement) {
      lenis = new Lenis({
        wrapper: root,
        content,
        autoRaf: true,
        lerp: 0.09,
        smoothWheel: true,
        syncTouch: true,
        syncTouchLerp: 0.075,
        touchInertiaExponent: 1.55,
        wheelMultiplier: 0.85,
        touchMultiplier: 1.35,
        overscroll: false,
      });
      lenisRef.current = lenis;
      root.classList.add('project-open__scroll--smooth');
    }

    if (!entrySetRef.current) {
      entrySetRef.current = true;
      const entryY = (root.clientHeight || window.innerHeight) * 0.5;
      if (lenis) lenis.scrollTo(entryY, { immediate: true });
      else root.scrollTop = entryY;
    }

    const update = () => {
      const vh = root.clientHeight || window.innerHeight;
      const vw = root.clientWidth || window.innerWidth;
      const y = lenis?.scroll ?? root.scrollTop;
      const entryY = vh * 0.5;
      const stageBox = stage.getBoundingClientRect();
      const slotBox = slot.getBoundingClientRect();
      const slotTop = slotBox.top - stageBox.top;

      if (media) {
        const heroT = reducedMotion ? 1 : smoothstep(y / Math.max(entryY, 1));
        const scale = lerp(1.2, 1, heroT);
        media.style.transform = `translate(-50%, -50%) scale(${scale})`;
      }

      // Remember title top at the 50/50 entry so scroll-up can rise from there
      if (y >= entryY - 1 || entryTitleTopRef.current == null) {
        if (y <= entryY + 2) entryTitleTopRef.current = slotTop;
      }

      let dockT;
      let top;
      let pinned;

      if (y < entryY) {
        // Full-bleed hero: title rides up to top-center (vertical only)
        const upT = reducedMotion
          ? 1
          : smoothstep((entryY - y) / Math.max(entryY, 1));
        dockT = upT;
        const baseTop = entryTitleTopRef.current ?? slotTop;
        top = lerp(baseTop, PIN_TOP_PX, upT);
        pinned = upT > 0.92;
      } else {
        // Cream sheet: title docks as the slot reaches the pin
        const pinY = stageBox.top + PIN_TOP_PX;
        const rawTop = slotBox.top;
        pinned = rawTop <= pinY + 0.5;
        dockT = reducedMotion
          ? pinned
            ? 1
            : 0
          : smoothstep(1 - clamp01((rawTop - pinY) / Math.max(vh * 0.55, 1)));
        top = lerp(slotTop, PIN_TOP_PX, dockT);
      }

      const shrinkT = dockT * dockT; // bias toward staying larger longer
      const fs = lerp(titleMaxPx(vw), titleMinPx(vw), shrinkT);
      float.style.top = `${Math.max(PIN_TOP_PX, top)}px`;
      float.style.setProperty('--title-dock', String(dockT));
      float.style.setProperty('--title-fs', `${fs}px`);
      float.dataset.pinned = pinned ? 'true' : 'false';
      float.dataset.zone = y < entryY ? 'hero' : 'sheet';
      slot.style.setProperty('--title-fs', `${fs}px`);
    };

    update();
    const id = requestAnimationFrame(update);
    root.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    lenis?.on('scroll', update);

    return () => {
      cancelAnimationFrame(id);
      root.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      lenis?.off('scroll', update);
      root.classList.remove('project-open__scroll--smooth');
      lenis?.destroy();
      lenisRef.current = null;
    };
  }, [scrollRoot, stageEl, reducedMotion, title.line1, title.line2]);

  const viewport = scrollRoot
    ? { root: scrollRoot, once: true, amount: 0.18, margin: '0px 0px -8% 0px' }
    : { once: true, amount: 0.2 };

  const motionProps = reducedMotion
    ? {}
    : {
        initial: 'hidden',
        whileInView: 'show',
        viewport,
        variants: RISE,
        transition: { duration: 0.85, ease: EASE },
      };

  const renderGallery = (list, keyPrefix) =>
    list.length ? (
      <section className="project-detail__gallery" aria-label="Project gallery">
        {list.map((src, i) => (
          <motion.figure
            key={`${keyPrefix}-${src}-${i}`}
            className={`project-detail__shot project-detail__shot--${(i % 4) + 1}`}
            {...motionProps}
            transition={{ duration: 0.9, ease: EASE, delay: reducedMotion ? 0 : (i % 3) * 0.08 }}
          >
            <img src={src} alt="" loading="lazy" decoding="async" />
          </motion.figure>
        ))}
      </section>
    ) : null;

  const renderStory = (label, text) =>
    text ? (
      <motion.section className="project-detail__desc project-detail__story" {...motionProps}>
        <ScrambleHover as="h2" className="project-detail__section-label" text={label} />
        <ScrambleHover as="p" className="project-detail__intro" text={text} steps={14} />
      </motion.section>
    ) : null;

  const titleInner = (
    <>
      <span className="project-detail__mega-line">{title.line1}</span>
      {title.line2 ? <span className="project-detail__mega-line">{title.line2}</span> : null}
    </>
  );

  return (
    <div className="project-detail" ref={rootRef}>
      {/* 100vh sticky hero — scroll up from entry to see it full-bleed */}
      <div className="project-detail__hero-pin">
        <header className="project-detail__hero">
          <div className="project-detail__hero-media" ref={heroMediaRef}>
            <img src={heroSrc} alt="" className="project-detail__hero-img" decoding="async" />
          </div>
        </header>
      </div>

      <div className="project-detail__sheet">
        {/* Lower half at entry: centered project name */}
        <section className="project-detail__band">
          <div className="project-detail__title-slot" ref={slotRef} aria-hidden>
            <div className="project-detail__mega">{titleInner}</div>
            <p className="project-detail__kind">{kind}</p>
          </div>
        </section>

        {body ? (
          <motion.section className="project-detail__desc" {...motionProps}>
            <ScrambleHover
              as="h2"
              className="project-detail__section-label"
              text="Description"
            />
            <ScrambleHover as="p" className="project-detail__intro" text={body} steps={14} />
          </motion.section>
        ) : null}

        <motion.div
          className={`project-detail__meta-grid${showCaseLink ? '' : ' project-detail__meta-grid--no-cta'}`}
          {...motionProps}
          transition={{ duration: 0.9, ease: EASE, delay: reducedMotion ? 0 : 0.06 }}
        >
          {showCaseLink ? (
            <div className="project-detail__meta-lead">
              <ScrambleHover as="p" className="project-detail__year" text={`©${year}`} />
              <ScrambleHover
                as="a"
                className="project-detail__cta"
                text="View project"
                href={href}
                target="_blank"
                rel="noreferrer"
              />
            </div>
          ) : null}

          {features.length ? (
            <div className="project-detail__features">
              <ScrambleHover as="h2" className="project-detail__section-label" text="Features" />
              <ul className="project-detail__feature-list">
                {features.map((f) => (
                  <li key={f}>
                    <ScrambleHover text={f} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {rows.length ? (
            <div className="project-detail__info">
              <ScrambleHover as="h2" className="project-detail__section-label" text="Info" />
              <ul className="project-detail__info-list">
                {rows.map((row) => (
                  <li key={`${row.mid}-${row.end}`} className="project-detail__info-row">
                    <ScrambleHover as="span" className="project-detail__info-year" text={row.year} />
                    <ScrambleHover as="span" className="project-detail__info-mid" text={row.mid} />
                    <ScrambleHover as="span" className="project-detail__info-end" text={row.end} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </motion.div>

        {renderGallery(shotsBefore, 'before')}
        {renderStory('Challenge', challenge)}
        {renderGallery(shotsAfter, 'after')}
        {renderStory('Solution', solution)}

        <div className="project-detail__footer-space" aria-hidden />
      </div>

      {stageEl
        ? createPortal(
            <div ref={floatRef} className="project-detail__title-float">
              <h1 id={titleId} className="project-detail__mega">
                {titleInner}
              </h1>
              <ScrambleHover as="p" className="project-detail__kind" text={kind} />
            </div>,
            stageEl
          )
        : null}
    </div>
  );
}

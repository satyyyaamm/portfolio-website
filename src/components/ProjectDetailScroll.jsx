import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { createPortal } from 'react-dom';
import Lenis from 'lenis';
import { Scramble } from './landing/Scramble.jsx';
import './project-detail.css';

const EASE = [0.22, 1, 0.36, 1];
const RISE = { hidden: { opacity: 0, y: 36 }, show: { opacity: 1, y: 0 } };
/**
 * Alternating L/R wipe on scroll.
 * Lenis breaks Framer whileInView — use IntersectionObserver + rAF, drive GL via --gl-reveal.
 */
function GalleryShot({ src, variant, side, reducedMotion, scrollRoot }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (reducedMotion) {
      el.style.setProperty('--gl-reveal', '1');
      el.classList.add('is-revealed');
      return undefined;
    }

    el.style.setProperty('--gl-reveal', '0');
    el.classList.remove('is-revealed');
    let done = false;
    let raf = 0;

    const play = () => {
      if (done) return;
      done = true;
      el.classList.add('is-revealed');
      const start = performance.now();
      const dur = 1100;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const e = 1 - (1 - t) ** 3;
        el.style.setProperty('--gl-reveal', String(e));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const root = scrollRoot instanceof Element ? scrollRoot : null;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.08) play();
        }
      },
      { root, rootMargin: '0px 0px -12% 0px', threshold: [0, 0.1, 0.2, 0.35] }
    );
    io.observe(el);

    // Lenis sometimes skips IO — also poll on scroll until played
    const onScroll = () => {
      if (done) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      if (r.top < vh * 0.88 && r.bottom > vh * 0.12) play();
    };
    root?.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      done = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      root?.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScroll);
    };
  }, [reducedMotion, scrollRoot, src]);

  return (
    <figure
      ref={ref}
      className={`project-detail__shot project-detail__shot--${variant} project-detail__shot--from-${side}`}
      data-reveal={side}
    >
      <img src={src} alt="" loading="lazy" decoding="async" />
    </figure>
  );
}

/** Mega → pinned size (keep pinned readable — Auge stays ~mid, not micro) */
const TITLE_FS_MAX_PX = 180;
const TITLE_FS_MIN_PX = 52;
const PIN_TOP_PX = 20;

/** Bottom “Next project” strip — label | image | title + kind (Auge-style). */
function NextProjectRow({ project, onOpen }) {
  const title = splitTitle(project?.name || '');
  const kind = typeLabel(project?.previewFrame);
  const img = project?.image || project?.previewImage;
  const tipRef = useRef(null);
  const [tipOn, setTipOn] = useState(false);

  const syncTip = (clientX, clientY, visible) => {
    const tip = tipRef.current;
    if (tip) {
      tip.style.transform = `translate3d(${clientX + 18}px, ${clientY + 14}px, 0)`;
      tip.style.opacity = visible ? '1' : '0';
    }
    setTipOn((prev) => (prev === visible ? prev : visible));
  };

  const onActivate = () => onOpen?.();
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate();
    }
  };

  const tip = (
    <div
      ref={tipRef}
      className={`auge-view-tip project-detail__view-tip${tipOn ? ' is-on' : ''}`}
      aria-hidden={!tipOn}
    >
      <Scramble text="View project" active={tipOn} steps={10} intervalMs={28} />
    </div>
  );

  return (
    <section className="project-detail__next" aria-label="Next project">
      {/* Portal above GL canvas — tip inside scroll is trapped under the image plane */}
      {typeof document !== 'undefined' ? createPortal(tip, document.body) : tip}
      {/* div (not button) so text bakes match other detail copy for bend/mess */}
      <div
        className="project-detail__next-hit"
        role="button"
        tabIndex={0}
        onClick={onActivate}
        onKeyDown={onKeyDown}
      >
        <span className="project-detail__next-label">NEXT PROJECT</span>
        <span
          className="project-detail__next-media"
          onPointerEnter={(e) => syncTip(e.clientX, e.clientY, true)}
          onPointerMove={(e) => syncTip(e.clientX, e.clientY, true)}
          onPointerLeave={() => syncTip(0, 0, false)}
        >
          {img ? <img src={img} alt="" loading="lazy" decoding="async" /> : null}
        </span>
        <span className="project-detail__next-copy">
          <span className="project-detail__next-name">
            <span className="project-detail__next-name-line">{title.line1}</span>
            {title.line2 ? (
              <span className="project-detail__next-name-line">{title.line2}</span>
            ) : null}
          </span>
          <span className="project-detail__next-kind">{kind}</span>
        </span>
      </div>
    </section>
  );
}

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
  // Mobile entry title — keep inside the lower 50vh cream band / screen width.
  if (vw <= 720) return Math.max(44, Math.min(58, vw * 0.14));
  return Math.max(64, Math.min(TITLE_FS_MAX_PX, 0.1 * vw + 100));
}

function titleMinPx(vw) {
  // Docked size — keep readable but tighter on narrow screens
  if (vw <= 720) return Math.max(26, Math.min(34, vw * 0.075));
  return Math.max(40, Math.min(TITLE_FS_MIN_PX, 0.045 * vw + 28));
}

/** Shrink --title-fs so mega lines fit maxW / maxH (avoids clip on 50/50 entry). */
function fitTitleFs(float, slot, fs, minFs, maxW, maxH) {
  float.style.setProperty('--title-fs', `${fs}px`);
  if (slot) slot.style.setProperty('--title-fs', `${fs}px`);
  const mega = float.querySelector('.project-detail__mega');
  if (!mega) return fs;
  const kind = float.querySelector('.project-detail__kind');
  const w = mega.scrollWidth;
  const h = mega.scrollHeight + (kind?.offsetHeight || 0) + 10;
  let next = fs;
  if (maxW > 0 && w > maxW) next = Math.min(next, fs * (maxW / w));
  if (maxH > 0 && h > maxH) next = Math.min(next, fs * (maxH / h));
  next = Math.max(minFs, next);
  if (Math.abs(next - fs) > 0.4) {
    float.style.setProperty('--title-fs', `${next}px`);
    if (slot) slot.style.setProperty('--title-fs', `${next}px`);
  }
  return next;
}

/**
 * Detail scroll:
 * - Entry: 50/50 — top half hero image, bottom half project name
 * - Scroll up: full-bleed hero
 * - Scroll down: title docks + description / gallery
 */
export function ProjectDetailScroll({
  project,
  heroSrc,
  titleId = 'project-open-title',
  nextProject = null,
  onOpenNext,
}) {
  const reducedMotion = useReducedMotion();
  const rootRef = useRef(null);
  const heroMediaRef = useRef(null);
  const slotRef = useRef(null);
  const floatRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroTitleShownRef = useRef(false);
  const entrySetRef = useRef(false);
  const lenisRef = useRef(null);
  const [scrollRoot, setScrollRoot] = useState(null);
  const [stageEl, setStageEl] = useState(null);
  const [heroTitleIn, setHeroTitleIn] = useState(false);

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
      /* Match About Lenis — same touch sync / lerp so GL type doesn’t shake */
      lenis = new Lenis({
        wrapper: root,
        content,
        autoRaf: true,
        lerp: 0.085,
        smoothWheel: true,
        syncTouch: true,
        syncTouchLerp: 0.07,
        touchInertiaExponent: 1.55,
        wheelMultiplier: 0.85,
        touchMultiplier: 1.3,
        overscroll: false,
      });
      lenisRef.current = lenis;
      root.classList.add('project-open__scroll--smooth');
    }

    // Always land on the built entry: top half hero, bottom half project name
    {
      entrySetRef.current = true;
      const entryY = (root.clientHeight || window.innerHeight) * 0.5;
      if (lenis) lenis.scrollTo(entryY, { immediate: true });
      else root.scrollTop = entryY;
    }

    /* Last written values — skip no-op style writes that thrash layout + GL measure */
    const last = { top: NaN, fs: NaN, dock: NaN, pinned: '', zone: '' };
    let entryFitted = false;

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

      let dockT;
      let top;
      let pinned;

      if (y < entryY) {
        // Cream name stays on the cream band — rides with the slot as it leaves
        top = slotTop;
        dockT = 0;
        pinned = false;

        // Separate small name: curtain-style slide down over the full photo
        const upT = reducedMotion
          ? 1
          : smoothstep((entryY - y) / Math.max(entryY, 1));
        const showHeroTitle = upT > 0.32;
        if (showHeroTitle !== heroTitleShownRef.current) {
          heroTitleShownRef.current = showHeroTitle;
          setHeroTitleIn(showHeroTitle);
        }
      } else {
        // Cream sheet: title docks as the slot reaches the pin
        if (heroTitleShownRef.current) {
          heroTitleShownRef.current = false;
          setHeroTitleIn(false);
        }
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
      const minFs = titleMinPx(vw);
      let fs = lerp(titleMaxPx(vw), minFs, shrinkT);
      const maxW = Math.min(vw * 0.88, stageBox.width * 0.88);
      /*
        Fit only on entry / until first dock — measuring scrollWidth every Lenis
        tick while shrinking caused font ↔ layout feedback (desktop flicker).
      */
      if (y < entryY) {
        fs = fitTitleFs(float, slot, fs, minFs, maxW, vh * 0.42);
        entryFitted = true;
      } else {
        if (!entryFitted) {
          fitTitleFs(float, slot, titleMaxPx(vw), minFs, maxW, vh * 0.42);
          entryFitted = true;
        }
        /* Keep slot at entry size so pin math doesn’t jump while the float shrinks */
        fs = Math.max(minFs, fs);
      }
      if (y < entryY) {
        const bandH = vh * 0.5;
        const nameH = float.offsetHeight || 0;
        if (nameH > 0 && nameH > bandH - 16) {
          top = entryY + Math.max(8, (bandH - nameH) * 0.5);
        }
      }

      /* Whole pixels — subpixel top + difference blend + GL measure = flicker */
      top = Math.round(top);
      fs = Math.round(fs * 2) / 2;

      if (top !== last.top) {
        last.top = top;
        float.style.top = `${top}px`;
      }
      if (fs !== last.fs) {
        last.fs = fs;
        float.style.setProperty('--title-fs', `${fs}px`);
      }
      if (dockT !== last.dock) {
        last.dock = dockT;
        float.style.setProperty('--title-dock', String(dockT));
      }
      float.style.opacity = '1';
      const pinnedStr = pinned ? 'true' : 'false';
      const zone = y < entryY ? 'hero' : 'sheet';
      if (pinnedStr !== last.pinned) {
        last.pinned = pinnedStr;
        float.dataset.pinned = pinnedStr;
      }
      if (zone !== last.zone) {
        last.zone = zone;
        float.dataset.zone = zone;
      }
    };

    update();
    const id = requestAnimationFrame(update);
    const onResize = () => {
      entryFitted = false;
      last.top = NaN;
      last.fs = NaN;
      update();
    };
    window.addEventListener('resize', onResize, { passive: true });
    /* Lenis already emits scroll — don’t also bind the native listener (2× writes/frame) */
    if (lenis) lenis.on('scroll', update);
    else root.addEventListener('scroll', update, { passive: true });

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', onResize);
      if (lenis) lenis.off('scroll', update);
      else root.removeEventListener('scroll', update);
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

  const renderGallery = (list, keyPrefix, indexOffset = 0) =>
    list.length ? (
      <section className="project-detail__gallery" aria-label="Project gallery">
        {list.map((src, i) => {
          // First two shots: wipe right→left; the rest: left→right
          const side = indexOffset + i < 2 ? 'right' : 'left';
          return (
            <GalleryShot
              key={`${keyPrefix}-${src}-${i}`}
              src={src}
              variant={(i % 4) + 1}
              side={side}
              reducedMotion={reducedMotion}
              scrollRoot={scrollRoot}
            />
          );
        })}
      </section>
    ) : null;

  const renderStory = (label, text) =>
    text ? (
      <motion.section className="project-detail__desc project-detail__story" {...motionProps}>
        <h2 className="project-detail__section-label">{label}</h2>
        <p className="project-detail__intro">{text}</p>
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
            <h2 className="project-detail__section-label">Description</h2>
            <p className="project-detail__intro">{body}</p>
          </motion.section>
        ) : null}

        <motion.div
          className={`project-detail__meta-grid${showCaseLink ? '' : ' project-detail__meta-grid--no-cta'}`}
          {...motionProps}
          transition={{ duration: 0.9, ease: EASE, delay: reducedMotion ? 0 : 0.06 }}
        >
          {showCaseLink ? (
            <div className="project-detail__meta-lead">
              <p className="project-detail__year">{`©${year}`}</p>
              <a className="project-detail__cta" href={href} target="_blank" rel="noreferrer">
                View project
              </a>
            </div>
          ) : null}

          {features.length ? (
            <div className="project-detail__features">
              <h2 className="project-detail__section-label">Features</h2>
              <ul className="project-detail__feature-list">
                {features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {rows.length ? (
            <div className="project-detail__info">
              <h2 className="project-detail__section-label">Info</h2>
              <ul className="project-detail__info-list">
                {rows.map((row) => (
                  <li key={`${row.mid}-${row.end}`} className="project-detail__info-row">
                    <span className="project-detail__info-year">{row.year}</span>
                    <span className="project-detail__info-mid">{row.mid}</span>
                    <span className="project-detail__info-end">{row.end}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </motion.div>

        {renderGallery(shotsBefore, 'before', 0)}
        {renderStory('Challenge', challenge)}
        {renderGallery(shotsAfter, 'after', shotsBefore.length)}
        {renderStory('Solution', solution)}

        {nextProject ? <NextProjectRow project={nextProject} onOpen={onOpenNext} /> : null}

        <div className="project-detail__footer-space" aria-hidden />
      </div>

      {stageEl
        ? createPortal(
            <>
              {/* Cream / sheet title — above media GL so difference invert works */}
              <div ref={floatRef} className="project-detail__title-float">
                <h1 id={titleId} className="project-detail__mega">
                  {titleInner}
                </h1>
                <p className="project-detail__kind">{kind}</p>
              </div>
              {/*
                Full-photo title — also above media GL (not inside hero).
                Under the canvas it can't invert against the distorted photo.
              */}
              <div
                ref={heroTitleRef}
                className={`project-detail__title-hero${heroTitleIn ? ' is-in' : ''}`}
                aria-hidden={!heroTitleIn}
              >
                <p className="project-detail__title-hero-mega">
                  <Scramble text={title.line1} active={heroTitleIn} steps={12} />
                  {title.line2 ? (
                    <>
                      {' '}
                      <Scramble text={title.line2} active={heroTitleIn} steps={12} />
                    </>
                  ) : null}
                </p>
                <p className="project-detail__title-hero-kind">
                  <Scramble text={kind} active={heroTitleIn} steps={10} />
                </p>
              </div>
            </>,
            stageEl
          )
        : null}
    </div>
  );
}

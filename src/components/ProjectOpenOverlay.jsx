import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { DetailGlStage } from './DetailGlStage.jsx';
import { Scramble, ScrambleHover, scrambleFrame } from './landing/Scramble.jsx';
import { ProjectDetailScroll } from './ProjectDetailScroll.jsx';
import { preloadProjectImages } from '../lib/preloadProjectImages.js';
import './project-open.css';

const EASE_SOFT = [0.22, 1, 0.36, 1];
const FLY_MS = 1600;
const FLY_CSS = `${FLY_MS}ms cubic-bezier(0.33, 1, 0.28, 1)`;
const EXIT_PHOTO_MS = 520;
const EXIT_NAME_MS = 480;
const EXIT_CURTAIN_MS = 2000;
const CURTAIN_IN_MS = 700;
/** Scramble settles, then hold on yellow before wipes. */
const TITLE_HOLD_MS = 2000;
/** Home close: hold “HOME” on yellow before curtain lifts. */
const HOME_HOLD_MS = 1600;
const EXIT_EASE_CSS = 'cubic-bezier(0.22, 1, 0.36, 1)';
const SCRAMBLE_STEPS = 14;
const SCRAMBLE_INTERVAL_MS = 30;

const HOME_PHASES = new Set(['homeIn', 'homeHold', 'homeOut']);

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

/** Alternate italic / roman Didone glyphs — optionally scramble in. */
function EditorialLine({ text, scramble = false }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(() => (scramble && !reduced ? scrambleFrame(text, 0) : text));

  useEffect(() => {
    if (!text) return undefined;
    if (!scramble || reduced) {
      setShown(text);
      return undefined;
    }
    let frame = 0;
    setShown(scrambleFrame(text, 0));
    const id = window.setInterval(() => {
      frame += 1;
      if (frame >= SCRAMBLE_STEPS) {
        setShown(text);
        window.clearInterval(id);
        return;
      }
      setShown(scrambleFrame(text, frame / SCRAMBLE_STEPS));
    }, SCRAMBLE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [text, scramble, reduced]);

  if (!text) return null;
  return (
    <span className="project-open__didone-line" aria-hidden={false}>
      {[...shown].map((ch, i) => (
        <span
          key={`${i}-${ch}`}
          className={
            ch === ' '
              ? 'project-open__didone-space'
              : i % 2 === 0
                ? 'project-open__didone-ital'
                : 'project-open__didone-roman'
          }
        >
          {ch === ' ' ? '\u00a0' : ch}
        </span>
      ))}
    </span>
  );
}

function topCenterRect(fromRect, vw, vh) {
  const aspect = fromRect.width / Math.max(fromRect.height, 1);
  const targetW = Math.min(640, vw * 0.48);
  const h = Math.min(targetW / Math.max(aspect, 0.45), vh * 0.34);
  const w = h * aspect;
  return {
    left: (vw - w) / 2,
    top: Math.max(vh * 0.07, 40),
    width: w,
    height: h,
  };
}

function heroRect(vw, vh) {
  const h = Math.min(vh * 0.52, Math.max(280, vh * 0.5));
  return { left: 0, top: 0, width: vw, height: h };
}

function rectStyle(r) {
  return {
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
  };
}

/**
 * arm → fly → curtain → title scramble + hold →
 * exitPhoto / exitName (clip wipe) → slow exitCurtain → detail.
 * Logo / Esc → homeIn → homeHold (HOME) → homeOut → landing.
 */
export function ProjectOpenOverlay({
  project,
  fromRect,
  socialItems = [],
  emailMailto = 'mailto:satyamt5152@gmail.com',
  onClose,
  onCovered,
  onHomeCovered,
}) {
  const reducedMotion = useReducedMotion();
  const skipIntro = Boolean(reducedMotion) || !fromRect;
  const [phase, setPhase] = useState(() => (skipIntro ? 'detail' : 'arm'));
  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));
  const [vh, setVh] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800));
  const [loadPct, setLoadPct] = useState(0);
  const [imagesReady, setImagesReady] = useState(false);
  const [glReady, setGlReady] = useState(false);
  const [markHover, setMarkHover] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLink, setDrawerLink] = useState(null);
  const photoRef = useRef(null);
  const titleRef = useRef(null);
  const scrollRef = useRef(null);
  const coveredRef = useRef(false);
  const homeClosingRef = useRef(false);
  const onCoveredRef = useRef(onCovered);
  onCoveredRef.current = onCovered;
  const onHomeCoveredRef = useRef(onHomeCovered);
  onHomeCoveredRef.current = onHomeCovered;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const src = fromRect?.src || project?.image;
  const title = splitTitle(project?.name || '');
  const origin = fromRect;
  const float = useMemo(
    () => (fromRect ? topCenterRect(fromRect, vw, vh) : heroRect(vw, vh)),
    [fromRect, vw, vh]
  );
  useEffect(() => {
    document.body.classList.add('project-open-active');
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    return () => {
      document.body.classList.remove('project-open-active');
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const goHome = () => {
    if (homeClosingRef.current) return;
    if (HOME_PHASES.has(phase)) return;
    // Only from detail (or skip-intro deep link)
    if (phase !== 'detail' && !skipIntro) return;
    if (reducedMotion) {
      onHomeCoveredRef.current?.();
      onCloseRef.current?.();
      return;
    }
    homeClosingRef.current = true;
    setPhase('homeIn');
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') goHome();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reducedMotion, skipIntro]);

  // Home close: curtain in → HOME hold → curtain out → unmount
  useEffect(() => {
    if (phase !== 'homeIn') return undefined;
    const id = window.setTimeout(() => setPhase('homeHold'), CURTAIN_IN_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'homeHold') return undefined;
    onHomeCoveredRef.current?.();
    const id = window.setTimeout(() => setPhase('homeOut'), HOME_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'homeOut') return undefined;
    const id = window.setTimeout(() => onCloseRef.current?.(), EXIT_CURTAIN_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  // Cover GL card, then fly.
  useLayoutEffect(() => {
    if (skipIntro || !origin || phase !== 'arm') return undefined;
    const el = photoRef.current;
    if (!el) return undefined;
    el.style.transition = 'none';
    Object.assign(el.style, rectStyle(origin));
    void el.offsetWidth;
    if (!coveredRef.current) {
      coveredRef.current = true;
      onCoveredRef.current?.();
    }
    let raf = 0;
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setPhase('fly'));
    });
    return () => cancelAnimationFrame(raf);
  }, [phase, skipIntro, origin]);

  useLayoutEffect(() => {
    if (phase !== 'fly' || !origin) return undefined;
    const el = photoRef.current;
    if (!el) return undefined;
    el.style.transition = 'none';
    Object.assign(el.style, rectStyle(origin));
    void el.offsetWidth;
    el.style.transition = `left ${FLY_CSS}, top ${FLY_CSS}, width ${FLY_CSS}, height ${FLY_CSS}`;
    Object.assign(el.style, rectStyle(float));
    const id = window.setTimeout(() => setPhase('curtain'), FLY_MS);
    return () => window.clearTimeout(id);
  }, [phase, origin, float]);

  useEffect(() => {
    if (phase !== 'curtain') return undefined;
    const id = window.setTimeout(() => setPhase('title'), CURTAIN_IN_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  // Prefetch hero + gallery while yellow is up (Auge-style curtain load)
  useEffect(() => {
    if (!project) return undefined;
    const urls = [src, ...(Array.isArray(project.gallery) ? project.gallery : [])];
    return preloadProjectImages(urls, (pct) => {
      setLoadPct(pct);
      if (pct >= 100) setImagesReady(true);
    });
  }, [project, src]);

  // Yellow hold — min time + images + GL mesh ready (avoids cream/flicker reveal)
  useEffect(() => {
    if (phase !== 'title') return undefined;
    const started = performance.now();
    const id = window.setInterval(() => {
      const held = performance.now() - started >= TITLE_HOLD_MS;
      const stalled = performance.now() - started >= TITLE_HOLD_MS + 5000;
      if (held && imagesReady && (glReady || stalled)) {
        window.clearInterval(id);
        setPhase('exitPhoto');
      }
    }, 40);
    return () => window.clearInterval(id);
  }, [phase, imagesReady, glReady]);

  // Reduced-motion / no-GL path: don't block the curtain forever
  useEffect(() => {
    if (skipIntro) {
      setGlReady(true);
      setImagesReady(true);
      setLoadPct(100);
    }
  }, [skipIntro]);

  // Photo exit: top stays fixed; clip rises from the bottom until gone.
  useLayoutEffect(() => {
    if (phase !== 'exitPhoto') return undefined;
    const el = photoRef.current;
    if (!el) return undefined;
    el.style.transition = 'none';
    el.style.transform = '';
    el.style.clipPath = 'inset(0 0 0 0)';
    void el.offsetWidth;
    el.style.transition = `clip-path ${EXIT_PHOTO_MS}ms ${EXIT_EASE_CSS}`;
    el.style.clipPath = 'inset(0 0 100% 0)';
    const id = window.setTimeout(() => setPhase('exitName'), EXIT_PHOTO_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  // Title exit: same bottom→top clip wipe (top of type stays put).
  useLayoutEffect(() => {
    if (phase !== 'exitName') return undefined;
    const el = titleRef.current;
    if (!el) return undefined;
    el.style.animation = 'none';
    el.style.transition = 'none';
    el.style.transform = 'none';
    el.style.clipPath = 'inset(0 0 0 0)';
    void el.offsetWidth;
    el.style.transition = `clip-path ${EXIT_NAME_MS}ms ${EXIT_EASE_CSS}`;
    el.style.clipPath = 'inset(0 0 100% 0)';
    const id = window.setTimeout(() => setPhase('exitCurtain'), EXIT_NAME_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'exitCurtain') return undefined;
    const id = window.setTimeout(() => setPhase('detail'), EXIT_CURTAIN_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  if (!project || !src) return null;

  const goingHome = HOME_PHASES.has(phase);
  const inIntro = phase !== 'detail' && !goingHome;
  const curtainVisible =
    phase === 'curtain' ||
    phase === 'title' ||
    phase === 'exitPhoto' ||
    phase === 'exitName' ||
    phase === 'exitCurtain' ||
    phase === 'homeIn' ||
    phase === 'homeHold' ||
    phase === 'homeOut';
  const curtainOut = phase === 'exitCurtain' || phase === 'homeOut';
  const showYellowTitle =
    phase === 'title' || phase === 'exitPhoto' || phase === 'exitName' || phase === 'exitCurtain';
  const showHomeTitle = phase === 'homeHold' || phase === 'homeOut';
  const nameRisingOut = phase === 'exitName' || phase === 'exitCurtain';
  const homeTitleOut = phase === 'homeOut';
  const lifting = phase === 'arm' || phase === 'fly';
  // Keep detail under rising Home curtain; drop it once yellow fully covers
  const showDetailUnder =
    phase === 'homeIn' ||
    (!goingHome &&
      (phase === 'curtain' ||
        phase === 'title' ||
        phase === 'exitPhoto' ||
        phase === 'exitName' ||
        phase === 'exitCurtain' ||
        phase === 'detail'));
  const warmGl = showDetailUnder && phase !== 'homeIn';
  const loadLabel = glReady ? 100 : Math.min(99, Math.max(0, loadPct));
  const photoRect =
    !origin
      ? null
      : phase === 'fly' ||
          phase === 'curtain' ||
          phase === 'title' ||
          phase === 'exitPhoto' ||
          phase === 'exitName' ||
          phase === 'exitCurtain'
        ? float
        : origin;

  const photoExiting =
    phase === 'exitPhoto' || phase === 'exitName' || phase === 'exitCurtain';
  const photoClippedAway = phase === 'exitName' || phase === 'exitCurtain';
  const titleTop = float.top + float.height + Math.max(18, vh * 0.03);
  const titleClippedAway = phase === 'exitCurtain';
  const showCurtain = (inIntro && !skipIntro) || goingHome;

  return (
    <motion.div
      className={`project-open${phase === 'detail' ? ' project-open--detail' : ''}${
        goingHome ? ' project-open--home' : ''
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-open-title"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: goingHome ? 0 : 0.3, ease: EASE_SOFT }}
    >
      {/* Detail sits under the exit stack so the curtain reveals it. */}
      {showDetailUnder ? (
        <div
          className="project-open__detail-stage"
          aria-hidden={inIntro}
          style={inIntro ? { pointerEvents: 'none' } : undefined}
        >
          <div ref={scrollRef} className="project-open__scroll">
            <ProjectDetailScroll project={project} heroSrc={src} titleId="project-open-title" />
          </div>
          {warmGl ? (
            <DetailGlStage
              scrollRef={scrollRef}
              project={project}
              heroSrc={src}
              active
              onReady={() => setGlReady(true)}
            />
          ) : null}
        </div>
      ) : null}

      {showCurtain ? (
        <motion.div
          className="project-open__curtain"
          aria-hidden
          initial={{ y: '118%' }}
          animate={{ y: curtainOut ? '-135%' : curtainVisible ? '0%' : '118%' }}
          transition={{
            duration: curtainOut ? EXIT_CURTAIN_MS / 1000 : CURTAIN_IN_MS / 1000,
            ease: EASE_SOFT,
          }}
        />
      ) : null}

      {showYellowTitle && !skipIntro ? (
        <div className="project-open__load" aria-live="polite">
          {`${loadLabel}%`}
        </div>
      ) : null}

      {inIntro && !skipIntro && photoRect ? (
        <img
          ref={photoRef}
          src={src}
          alt=""
          className={`project-open__photo${lifting ? ' project-open__photo--lifting' : ''}${
            photoExiting ? ' project-open__photo--exiting' : ''
          }`}
          decoding="sync"
          draggable={false}
          style={{
            ...rectStyle(photoRect),
            objectFit: 'cover',
            objectPosition: 'top center',
            ...(photoClippedAway
              ? { clipPath: 'inset(0 0 100% 0)', transition: 'none' }
              : null),
          }}
        />
      ) : null}

      {showYellowTitle && !skipIntro ? (
        <div
          ref={titleRef}
          className={`project-open__yellow-title${
            nameRisingOut ? ' project-open__yellow-title--collapse' : ' project-open__yellow-title--in'
          }`}
          style={{
            top: titleTop,
            ...(titleClippedAway
              ? { clipPath: 'inset(0 0 100% 0)', transition: 'none' }
              : null),
          }}
        >
          <p className="project-open__didone">
            <EditorialLine text={title.line1} scramble />
          </p>
          {title.line2 ? (
            <p className="project-open__didone">
              <EditorialLine text={title.line2} scramble />
            </p>
          ) : null}
        </div>
      ) : null}

      {showHomeTitle ? (
        <div
          className={`project-open__yellow-title project-open__yellow-title--home${
            homeTitleOut ? ' project-open__yellow-title--collapse' : ' project-open__yellow-title--in'
          }`}
          style={
            homeTitleOut
              ? { clipPath: 'inset(0 0 100% 0)', transition: `clip-path ${EXIT_NAME_MS}ms ${EXIT_EASE_CSS}` }
              : undefined
          }
        >
          <p className="project-open__didone">
            <EditorialLine text="HOME" scramble />
          </p>
        </div>
      ) : null}

      {phase === 'detail' ||
      phase === 'exitPhoto' ||
      phase === 'exitName' ||
      phase === 'exitCurtain' ? (
        <button
          type="button"
          className="project-open__mark"
          onClick={goHome}
          aria-label="Home"
          onPointerEnter={() => setMarkHover(true)}
          onPointerLeave={() => setMarkHover(false)}
          onFocus={() => setMarkHover(true)}
          onBlur={() => setMarkHover(false)}
        >
          <Scramble text="S" active={markHover} steps={36} intervalMs={120} />
          <span className="project-open__sr">Home</span>
        </button>
      ) : null}

      {/* Same stacking context as the S mark — required for difference blend */}
      {phase === 'detail' ? (
        <div className="project-open__desk-foot">
          <p className="project-open__desk-copy">
            <ScrambleHover text={`© ${new Date().getFullYear()} Satyam Tiwari`} />
          </p>
          <div className="project-open__desk-corner">
            <div
              className={`auge-drawer project-open__drawer${drawerOpen ? ' is-open' : ''}`}
              onPointerEnter={() => setDrawerOpen(true)}
              onPointerLeave={() => {
                setDrawerOpen(false);
                setDrawerLink(null);
              }}
              onFocus={() => setDrawerOpen(true)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setDrawerOpen(false);
                  setDrawerLink(null);
                }
              }}
            >
              <div className="auge-drawer__panel project-open__drawer-panel" id="project-open-drawer">
                <nav className="auge-drawer__nav" aria-label="Site">
                  <button
                    type="button"
                    className="auge-drawer__link"
                    onPointerEnter={() => setDrawerLink('works')}
                    onPointerLeave={() => setDrawerLink(null)}
                    onFocus={() => setDrawerLink('works')}
                    onClick={() => {
                      setDrawerOpen(false);
                      const gallery = scrollRef.current?.querySelector('.project-detail__gallery');
                      (gallery || scrollRef.current)?.scrollIntoView?.({
                        behavior: 'smooth',
                        block: 'start',
                      });
                    }}
                  >
                    <span className="auge-drawer__label">
                      <Scramble text="Works" active={drawerOpen && drawerLink === 'works'} />
                    </span>
                    <span className="project-open__sr">Works</span>
                  </button>
                  <button
                    type="button"
                    className="auge-drawer__link"
                    onPointerEnter={() => setDrawerLink('home')}
                    onPointerLeave={() => setDrawerLink(null)}
                    onFocus={() => setDrawerLink('home')}
                    onClick={() => {
                      setDrawerOpen(false);
                      goHome();
                    }}
                  >
                    <span className="auge-drawer__label">
                      <Scramble text="Home" active={drawerOpen && drawerLink === 'home'} />
                    </span>
                    <span className="project-open__sr">Home</span>
                  </button>
                  <a
                    className="auge-drawer__link"
                    href={emailMailto}
                    onPointerEnter={() => setDrawerLink('talk')}
                    onPointerLeave={() => setDrawerLink(null)}
                    onFocus={() => setDrawerLink('talk')}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <span className="auge-drawer__label">
                      <Scramble text="Let's talk" active={drawerOpen && drawerLink === 'talk'} />
                    </span>
                    <span className="project-open__sr">Let's talk</span>
                  </a>
                </nav>
                <span className="auge-drawer__bars" aria-hidden>
                  <span />
                  <span />
                </span>
              </div>
            </div>

            {socialItems.length ? (
              <nav className="project-open__desk-socials" aria-label="Social links">
                {socialItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.href.startsWith('mailto:') ? undefined : '_blank'}
                    rel={item.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                  >
                    <ScrambleHover text={item.label} />
                  </a>
                ))}
              </nav>
            ) : null}
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

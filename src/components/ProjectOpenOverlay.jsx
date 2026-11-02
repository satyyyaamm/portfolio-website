import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { DetailGlStage } from './DetailGlStage.jsx';
import { Scramble, ScrambleHover } from './landing/Scramble.jsx';
import { ProjectDetailScroll } from './ProjectDetailScroll.jsx';
import { preloadProjectImages } from '../lib/preloadProjectImages.js';
import { SoundToggle } from './SoundToggle.jsx';
import { playHoverSound, playSound } from '../lib/siteSound.js';
import {
  EASE_SOFT,
  EditorialLine,
  EXIT_EASE_CSS,
  EXIT_NAME_MS,
  HOME_CURTAIN_IN_MS,
  HOME_CURTAIN_OUT_MS,
  HOME_HOLD_MS,
} from './curtainShared.jsx';
import './project-open.css';

const FLY_MS = 1600;
const FLY_CSS = `${FLY_MS}ms cubic-bezier(0.33, 1, 0.28, 1)`;
const EXIT_PHOTO_MS = 520;
const EXIT_CURTAIN_MS = 2000;
const CURTAIN_IN_MS = 700;
/** Scramble settles, then hold on yellow before wipes. */
const TITLE_HOLD_MS = 2000;

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
 * Next project → nextIn (yellow cover) → swap → title/load → exit → detail.
 * Logo / Esc → homeIn → homeHold (HOME) → homeOut → landing.
 */
export function ProjectOpenOverlay({
  project,
  nextProject = null,
  fromRect,
  socialItems = [],
  emailMailto = 'mailto:satyamt5152@gmail.com',
  onClose,
  onCovered,
  homeReady = false,
  onHomeBegin,
  onHomeCovered,
  onOpenNext,
  onOpenWorks,
  onOpenAbout,
  onOpenContact,
}) {
  const reducedMotion = useReducedMotion();
  /** Landing card fly-in; deep links and next-project skip arm/fly. */
  const cardIntro = Boolean(fromRect) && !reducedMotion;
  const [phase, setPhase] = useState(() => (cardIntro ? 'arm' : 'detail'));
  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));
  const [vh, setVh] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800));
  const [loadPct, setLoadPct] = useState(0);
  const [imagesReady, setImagesReady] = useState(false);
  const [glReady, setGlReady] = useState(false);
  const [markHover, setMarkHover] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLink, setDrawerLink] = useState(null);
  /** After next-project curtain cover — run yellow load + exit without card fly. */
  const [nextIntro, setNextIntro] = useState(false);
  const photoRef = useRef(null);
  const titleRef = useRef(null);
  const scrollRef = useRef(null);
  const coveredRef = useRef(false);
  const homeClosingRef = useRef(false);
  const onCoveredRef = useRef(onCovered);
  onCoveredRef.current = onCovered;
  const onHomeCoveredRef = useRef(onHomeCovered);
  onHomeCoveredRef.current = onHomeCovered;
  const onHomeBeginRef = useRef(onHomeBegin);
  onHomeBeginRef.current = onHomeBegin;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onOpenNextRef = useRef(onOpenNext);
  onOpenNextRef.current = onOpenNext;
  const homeHoldStartedRef = useRef(0);

  const src = fromRect?.src || project?.image;
  const title = splitTitle(project?.name || '');
  const origin = fromRect;
  const float = useMemo(
    () => (fromRect ? topCenterRect(fromRect, vw, vh) : heroRect(vw, vh)),
    [fromRect, vw, vh]
  );
  const playingYellowIntro = cardIntro || nextIntro;
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
    if (HOME_PHASES.has(phase) || phase === 'nextIn') return;
    // Only from settled detail
    if (phase !== 'detail') return;
    if (reducedMotion) {
      onHomeCoveredRef.current?.();
      onCloseRef.current?.();
      return;
    }
    homeClosingRef.current = true;
    onHomeBeginRef.current?.();
    setPhase('homeIn');
  };

  const beginNext = () => {
    if (!onOpenNextRef.current || phase !== 'detail') return;
    playSound('clickProject');
    if (reducedMotion) {
      onOpenNextRef.current();
      return;
    }
    setPhase('nextIn');
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') goHome();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reducedMotion]);

  // Home close: curtain in → HOME hold → curtain out → unmount
  useEffect(() => {
    if (phase !== 'homeIn') return undefined;
    playSound('raiseCurtain', { delay: reducedMotion ? 0 : 0.12 });
    const id = window.setTimeout(() => setPhase('homeHold'), HOME_CURTAIN_IN_MS);
    return () => window.clearTimeout(id);
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (phase !== 'homeHold') return undefined;
    onHomeCoveredRef.current?.();
    homeHoldStartedRef.current = performance.now();
    const tryLift = () => {
      const elapsed = performance.now() - homeHoldStartedRef.current;
      if (homeReady && elapsed >= HOME_HOLD_MS) {
        setPhase('homeOut');
        return true;
      }
      return false;
    };
    if (tryLift()) return undefined;
    const id = window.setInterval(() => {
      if (tryLift()) window.clearInterval(id);
    }, 40);
    const max = window.setTimeout(() => setPhase('homeOut'), HOME_HOLD_MS + 8000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(max);
    };
  }, [phase, homeReady]);

  useEffect(() => {
    if (phase !== 'homeOut') return undefined;
    const id = window.setTimeout(() => onCloseRef.current?.(), HOME_CURTAIN_OUT_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  // Next project: yellow covers → swap project → load % → exit → detail
  useEffect(() => {
    if (phase !== 'nextIn') return undefined;
    playSound('raiseCurtain', { delay: reducedMotion ? 0 : 0.12 });
    const id = window.setTimeout(() => {
      setLoadPct(0);
      setImagesReady(false);
      setGlReady(false);
      setNextIntro(true);
      onOpenNextRef.current?.();
      setPhase('title');
    }, CURTAIN_IN_MS);
    return () => window.clearTimeout(id);
  }, [phase, reducedMotion]);

  // Seat photo over the GL card, paint, THEN blank the strip — no cream flash.
  useLayoutEffect(() => {
    if (!cardIntro || !origin || phase !== 'arm') return undefined;
    const el = photoRef.current;
    if (!el) return undefined;
    el.style.transition = 'none';
    el.style.opacity = '1';
    Object.assign(el.style, rectStyle(origin));
    void el.offsetWidth;
    let raf = 0;
    let raf2 = 0;
    raf = requestAnimationFrame(() => {
      // Photo is composited over the live GL card
      if (!coveredRef.current) {
        coveredRef.current = true;
        onCoveredRef.current?.();
      }
      raf2 = requestAnimationFrame(() => setPhase('fly'));
    });
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(raf2);
    };
  }, [phase, cardIntro, origin]);

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
    // Auge: transition whoosh shortly after the yellow cover starts.
    playSound('raiseCurtain', { delay: reducedMotion ? 0 : 0.12 });
    const id = window.setTimeout(() => setPhase('title'), CURTAIN_IN_MS);
    return () => window.clearTimeout(id);
  }, [phase, reducedMotion]);

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

  // Deep-link / reduced-motion: don't wait on GL
  useEffect(() => {
    if (reducedMotion || (!cardIntro && !nextIntro && phase === 'detail')) {
      setGlReady(true);
      setImagesReady(true);
      setLoadPct(100);
    }
  }, [reducedMotion, cardIntro, nextIntro, phase]);

  // Photo exit: top stays fixed; clip rises from the bottom until gone.
  useLayoutEffect(() => {
    if (phase !== 'exitPhoto') return undefined;
    const el = photoRef.current;
    if (!el) {
      const id = window.setTimeout(() => setPhase('exitName'), 0);
      return () => window.clearTimeout(id);
    }
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
    if (!el) {
      const id = window.setTimeout(() => setPhase('exitCurtain'), 0);
      return () => window.clearTimeout(id);
    }
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
    const id = window.setTimeout(() => {
      setNextIntro(false);
      setPhase('detail');
    }, EXIT_CURTAIN_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  // Keep the built 50/50 entry (half hero / half name) when the next project swaps in
  useEffect(() => {
    if (!nextIntro) return;
    if (phase !== 'title' && phase !== 'detail') return;
    const el = scrollRef.current;
    if (!el) return;
    const entryY = (el.clientHeight || window.innerHeight) * 0.5;
    el.scrollTop = entryY;
  }, [project?.id, nextIntro, phase]);

  if (!project || !src) return null;

  const goingHome = HOME_PHASES.has(phase);
  const inIntro = phase !== 'detail' && !goingHome;
  const curtainVisible =
    phase === 'curtain' ||
    phase === 'title' ||
    phase === 'exitPhoto' ||
    phase === 'exitName' ||
    phase === 'exitCurtain' ||
    phase === 'nextIn' ||
    phase === 'homeIn' ||
    phase === 'homeHold' ||
    phase === 'homeOut';
  const curtainOut = phase === 'exitCurtain' || phase === 'homeOut';
  const showYellowTitle =
    playingYellowIntro &&
    (phase === 'title' || phase === 'exitPhoto' || phase === 'exitName' || phase === 'exitCurtain');
  const showHomeTitle = phase === 'homeHold' || phase === 'homeOut';
  const nameRisingOut = phase === 'exitName' || phase === 'exitCurtain';
  const homeTitleOut = phase === 'homeOut';
  const lifting = phase === 'arm' || phase === 'fly';
  /*
    Open: cream detail only after yellow has covered (title+).
    Home (S logo): keep detail mounted through homeIn so landing doesn’t
    pop in before the curtain covers — swap to landing at homeHold.
    nextIn: keep current detail under the rising yellow until title swap.
  */
  const showDetailUnder =
    phase === 'homeIn' ||
    phase === 'nextIn' ||
    (!goingHome &&
      (phase === 'title' ||
        phase === 'exitPhoto' ||
        phase === 'exitName' ||
        phase === 'exitCurtain' ||
        phase === 'detail'));
  const warmGl = showDetailUnder && phase !== 'nextIn' && phase !== 'homeIn';
  const loadLabel = glReady ? 100 : Math.min(99, Math.max(0, loadPct));
  // Next-project path: yellow + title + % only — no floating half-image on the curtain
  const photoRect =
    nextIntro || !origin
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
  const titleTop = nextIntro
    ? Math.max(vh * 0.42, 120)
    : float.top + float.height + Math.max(18, vh * 0.03);
  const titleClippedAway = phase === 'exitCurtain';
  const showCurtain = (inIntro && playingYellowIntro) || goingHome || phase === 'nextIn';
  const showIntroPhoto =
    !nextIntro && playingYellowIntro && inIntro && Boolean(photoRect) && phase !== 'nextIn';

  return (
    <motion.div
      className={`project-open${phase === 'detail' ? ' project-open--detail' : ''}${
        goingHome ? ' project-open--home' : ''
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-open-title"
      initial={false}
      exit={{ opacity: 0 }}
      transition={{ duration: goingHome ? 0 : 0.2, ease: EASE_SOFT }}
    >
      {/* Detail sits under the exit stack so the curtain reveals it. */}
      {showDetailUnder ? (
        <div
          className="project-open__detail-stage"
          aria-hidden={inIntro}
          style={inIntro ? { pointerEvents: 'none' } : undefined}
        >
          <div ref={scrollRef} className="project-open__scroll">
            <ProjectDetailScroll
              key={project?.id ?? project?.name}
              project={project}
              heroSrc={src}
              titleId="project-open-title"
              nextProject={nextProject}
              onOpenNext={beginNext}
            />
          </div>
          {warmGl ? (
            <DetailGlStage
              key={project?.id ?? project?.name}
              scrollRef={scrollRef}
              project={project}
              heroSrc={src}
              nextSrc={nextProject?.image || nextProject?.previewImage || null}
              active
              /* Title canvas during curtain wipe; text bakes only once detail is interactive */
              titleFx={phase === 'detail' || phase === 'exitCurtain'}
              copyFx={phase === 'detail'}
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
            duration: goingHome
              ? (curtainOut ? HOME_CURTAIN_OUT_MS : HOME_CURTAIN_IN_MS) / 1000
              : (curtainOut ? EXIT_CURTAIN_MS : CURTAIN_IN_MS) / 1000,
            ease: EASE_SOFT,
          }}
        />
      ) : null}

      {showYellowTitle ? (
        <div className="project-open__load" aria-live="polite" aria-label={`Loading ${loadLabel}%`}>
          {String(loadLabel).padStart(3, '0')}
        </div>
      ) : null}

      {showIntroPhoto ? (
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

      {showYellowTitle ? (
        <div
          ref={titleRef}
          key={`yellow-${project?.id ?? title.line1}`}
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

      {/* Same stacking context as the S mark — show as soon as the curtain lifts */}
      {phase === 'detail' || phase === 'exitCurtain' ? (
        <div className="project-open__desk-foot">
          <div className="project-open__desk-copy">
            <ScrambleHover text={`© ${new Date().getFullYear()} Satyam Tiwari`} />
            <SoundToggle className="project-open__desk-sound" />
          </div>
          <div className="project-open__desk-corner">
            <div
              id="project-open-drawer"
              className={`auge-drawer project-open__drawer${drawerOpen ? ' is-open' : ''}`}
              onPointerEnter={() => {
                if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                  setDrawerOpen(true);
                }
              }}
              onPointerLeave={() => {
                if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                  setDrawerOpen(false);
                  setDrawerLink(null);
                }
              }}
              onFocus={() => {
                if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                  setDrawerOpen(true);
                }
              }}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setDrawerOpen(false);
                  setDrawerLink(null);
                }
              }}
            >
              <div className="auge-drawer__panel project-open__drawer-panel">
                <button
                  type="button"
                  className="auge-drawer__toggle"
                  aria-expanded={drawerOpen}
                  aria-controls="project-open-drawer"
                  aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
                  onClick={(event) => {
                    event.stopPropagation();
                    playSound('clickMenuItem');
                    if (drawerOpen) {
                      setDrawerLink(null);
                      setDrawerOpen(false);
                      event.currentTarget.blur();
                    } else {
                      setDrawerOpen(true);
                    }
                  }}
                >
                  <span className="auge-drawer__close" aria-hidden>
                    ×
                  </span>
                </button>

                <div className="auge-drawer__body">
                  <nav className="auge-drawer__nav" aria-label="Site">
                    <button
                      type="button"
                      className="auge-drawer__link"
                      onPointerEnter={() => {
                        setDrawerLink('works');
                        playHoverSound('hoverButton');
                      }}
                      onPointerLeave={() => setDrawerLink(null)}
                      onFocus={() => setDrawerLink('works')}
                      onClick={() => {
                        playSound('clickMenuItem');
                        setDrawerOpen(false);
                        if (onOpenWorks) {
                          onOpenWorks();
                          return;
                        }
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
                      onPointerEnter={() => {
                        setDrawerLink('about');
                        playHoverSound('hoverButton');
                      }}
                      onPointerLeave={() => setDrawerLink(null)}
                      onFocus={() => setDrawerLink('about')}
                      onClick={() => {
                        playSound('clickMenuItem');
                        setDrawerOpen(false);
                        if (onOpenAbout) onOpenAbout();
                        else goHome();
                      }}
                    >
                      <span className="auge-drawer__label">
                        <Scramble text="About" active={drawerOpen && drawerLink === 'about'} />
                      </span>
                      <span className="project-open__sr">About</span>
                    </button>
                    <button
                      type="button"
                      className="auge-drawer__link"
                      onPointerEnter={() => {
                        setDrawerLink('talk');
                        playHoverSound('hoverButton');
                      }}
                      onPointerLeave={() => setDrawerLink(null)}
                      onFocus={() => setDrawerLink('talk')}
                      onClick={() => {
                        playSound('clickMenuItem');
                        setDrawerOpen(false);
                        if (onOpenContact) onOpenContact();
                      }}
                    >
                      <span className="auge-drawer__label">
                        <Scramble text="Let's talk" active={drawerOpen && drawerLink === 'talk'} />
                      </span>
                      <span className="project-open__sr">Let's talk</span>
                    </button>
                  </nav>

                  <div className="auge-drawer__meta">
                    <nav className="auge-drawer__socials" aria-label="Social and legal">
                      {socialItems.map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          target={item.href.startsWith('mailto:') ? undefined : '_blank'}
                          rel={item.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                          onPointerEnter={() => playHoverSound('hoverFooterItem')}
                          onClick={() => {
                            playSound('clickMenuItem');
                            setDrawerOpen(false);
                          }}
                        >
                          {item.label}
                        </a>
                      ))}
                      <a
                        href="#privacy"
                        onClick={() => {
                          playSound('clickMenuItem');
                          setDrawerOpen(false);
                        }}
                      >
                        Privacy
                      </a>
                      <a
                        href="#cookies"
                        onClick={() => {
                          playSound('clickMenuItem');
                          setDrawerOpen(false);
                        }}
                      >
                        Cookies
                      </a>
                    </nav>
                    <div className="auge-drawer__legal">
                      <span>© {new Date().getFullYear()}</span>
                      <SoundToggle className="auge-drawer__sound" />
                    </div>
                  </div>
                </div>

                <span className="auge-drawer__bars" aria-hidden>
                  <span />
                  <span />
                </span>
              </div>
            </div>

            <nav className="project-open__desk-socials" aria-label="Social links">
              {socialItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel={item.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                  onPointerEnter={() => playHoverSound('hoverFooterItem')}
                  onClick={() => playSound('clickMenuItem')}
                >
                  <ScrambleHover text={item.label} />
                </a>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

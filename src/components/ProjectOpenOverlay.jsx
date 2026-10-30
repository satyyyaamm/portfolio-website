import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { scrambleFrame } from './landing/Scramble.jsx';
import './project-open.css';

const EASE = [0.16, 1, 0.3, 1];
const EASE_SOFT = [0.22, 1, 0.36, 1];
const FLY_MS = 1600;
const FLY_CSS = `${FLY_MS}ms cubic-bezier(0.33, 1, 0.28, 1)`;

function pad3(n) {
  return String(Math.max(0, Math.min(100, Math.round(n)))).padStart(3, '0');
}

function splitTitle(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { line1: name, line2: '' };
  if (parts.length === 2) return { line1: parts[0], line2: parts[1] };
  const mid = Math.ceil(parts.length / 2);
  return { line1: parts.slice(0, mid).join(' '), line2: parts.slice(mid).join(' ') };
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
  const h = Math.min(vh * 0.42, Math.max(220, vh * 0.38));
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
 * One photo, no flicker:
 * painted at strip rect (CSS, no Framer) → fly to top-center → curtain under it → …
 */
export function ProjectOpenOverlay({ project, fromRect, onClose, onCovered }) {
  const reducedMotion = useReducedMotion();
  const skipIntro = Boolean(reducedMotion) || !fromRect;
  const [phase, setPhase] = useState(() => (skipIntro ? 'detail' : 'arm'));
  const [progress, setProgress] = useState(skipIntro ? 100 : 0);
  const [line1Shown, setLine1Shown] = useState('');
  const [line2Shown, setLine2Shown] = useState('');
  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));
  const [vh, setVh] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800));
  const photoRef = useRef(null);
  const coveredRef = useRef(false);
  const onCoveredRef = useRef(onCovered);
  onCoveredRef.current = onCovered;

  const src = fromRect?.src || project?.image;
  const title = splitTitle(project?.name || '');
  const origin = fromRect;
  const float = useMemo(
    () => (fromRect ? topCenterRect(fromRect, vw, vh) : heroRect(vw, vh)),
    [fromRect, vw, vh]
  );
  const hero = useMemo(() => heroRect(vw, vh), [vw, vh]);

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

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Paint at origin with transitions OFF, tell strip it's covered, then fly.
  useLayoutEffect(() => {
    if (skipIntro || !origin || phase !== 'arm') return undefined;
    const el = photoRef.current;
    if (!el) return undefined;

    el.style.transition = 'none';
    Object.assign(el.style, rectStyle(origin));
    // Force style flush before anyone blanks the GL card underneath.
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

  // CSS fly — enable transition, then set destination (no Framer = no mount flicker).
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

  // Expand to hero with the same element.
  useLayoutEffect(() => {
    if (phase !== 'expand') return undefined;
    const el = photoRef.current;
    if (!el) return undefined;
    el.style.transition = `left 0.95s cubic-bezier(0.16, 1, 0.3, 1), top 0.95s cubic-bezier(0.16, 1, 0.3, 1), width 0.95s cubic-bezier(0.16, 1, 0.3, 1), height 0.95s cubic-bezier(0.16, 1, 0.3, 1)`;
    Object.assign(el.style, rectStyle(hero));
    const id = window.setTimeout(() => setPhase('detail'), 900);
    return () => window.clearTimeout(id);
  }, [phase, hero]);

  useEffect(() => {
    if (phase !== 'curtain') return undefined;
    const id = window.setTimeout(() => setPhase('title'), 900);
    return () => window.clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'title') return undefined;
    const target1 = title.line1 || project?.name || '';
    const target2 = title.line2 || '';
    let frame = 0;
    const steps = 22;
    const tick = 42;
    setLine1Shown(scrambleFrame(target1, 0));
    setLine2Shown(target2 ? scrambleFrame(target2, 0) : '');
    setProgress(0);
    const started = performance.now();
    const TITLE_MS = steps * tick;
    const id = window.setInterval(() => {
      frame += 1;
      const reveal = Math.min(1, frame / steps);
      setLine1Shown(scrambleFrame(target1, reveal));
      if (target2) setLine2Shown(scrambleFrame(target2, reveal));
      setProgress(((performance.now() - started) / (TITLE_MS + 400)) * 100);
      if (frame >= steps) {
        setLine1Shown(target1);
        setLine2Shown(target2);
        window.clearInterval(id);
      }
    }, tick);
    const done = window.setTimeout(() => {
      setProgress(100);
      setPhase('expand');
    }, TITLE_MS + 420);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(done);
    };
  }, [phase, title.line1, title.line2, project?.name]);

  if (!project || !src || !origin) return null;

  const inIntro = phase !== 'detail';
  const curtainUp = phase === 'curtain' || phase === 'title' || phase === 'expand';
  const showBrand = phase === 'title' || phase === 'expand';
  const lifting = phase === 'arm' || phase === 'fly';

  return (
    <motion.div
      className={`project-open${phase === 'detail' ? ' project-open--detail' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-open-title"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: EASE_SOFT }}
    >
      {inIntro && !skipIntro ? (
        <motion.div
          className="project-open__curtain"
          aria-hidden
          initial={{ y: '118%' }}
          animate={{ y: curtainUp ? '0%' : '118%' }}
          transition={{ duration: 1.15, ease: EASE_SOFT }}
        />
      ) : null}

      {inIntro && !skipIntro ? (
        // Plain img + CSS transitions — Framer was flashing a frame before the move.
        <img
          ref={photoRef}
          src={src}
          alt=""
          className={`project-open__photo${lifting ? ' project-open__photo--lifting' : ''}`}
          decoding="sync"
          draggable={false}
          style={{
            ...rectStyle(origin),
            objectFit: 'cover',
            objectPosition: 'top center',
          }}
        />
      ) : null}

      <AnimatePresence>
        {showBrand ? (
          <motion.div
            key="brand"
            className="project-open__brand"
            style={{ top: float.top + float.height + 20 }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="project-open__brand-line">
              <motion.p
                className="project-open__brand-word"
                initial={{ y: '120%', opacity: 0 }}
                animate={
                  phase === 'expand'
                    ? { y: '-20%', opacity: 0.4 }
                    : { y: '0%', opacity: 1 }
                }
                transition={{ duration: 0.78, ease: EASE }}
              >
                {line1Shown || '\u00a0'}
              </motion.p>
            </div>
            {title.line2 ? (
              <div className="project-open__brand-line">
                <motion.p
                  className="project-open__brand-sub"
                  initial={{ y: '140%', opacity: 0 }}
                  animate={
                    phase === 'expand'
                      ? { y: '-30%', opacity: 0.35 }
                      : { y: '0%', opacity: 1 }
                  }
                  transition={{ duration: 0.72, ease: EASE, delay: 0.06 }}
                >
                  {line2Shown || '\u00a0'}
                </motion.p>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {phase === 'title' ? (
        <p className="project-open__counter" aria-hidden>
          {pad3(progress)}
        </p>
      ) : null}

      <AnimatePresence>
        {phase === 'detail' && (
          <motion.div
            key="detail"
            className="project-open__scroll"
            initial={{ opacity: skipIntro ? 1 : 0.9 }}
            animate={{ opacity: 1 }}
            transition={{ duration: skipIntro ? 0 : 0.25, ease: EASE_SOFT }}
          >
            <header className="project-open__hero">
              <img src={src} alt="" className="project-open__hero-img" decoding="async" />
              <button
                type="button"
                className="project-open__close"
                onClick={onClose}
                aria-label="Close project"
              >
                <X className="h-4 w-4" strokeWidth={2} aria-hidden />
              </button>
            </header>

            <section className="project-open__band">
              <h1 id="project-open-title" className="project-open__mega">
                <span className="project-open__mega-line">{title.line1}</span>
                {title.line2 ? (
                  <span className="project-open__mega-line project-open__mega-line--em">{title.line2}</span>
                ) : null}
              </h1>
              {project.meta ? <p className="project-open__meta">{project.meta}</p> : null}
            </section>

            <section className="project-open__stub" aria-hidden>
              <div className="project-open__stub-block" />
              <div className="project-open__stub-block project-open__stub-block--short" />
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

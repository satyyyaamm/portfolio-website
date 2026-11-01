import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Lenis from 'lenis';
import { ScrambleHover } from '../landing/Scramble.jsx';
import { playHoverSound, playSound } from '../../lib/siteSound.js';
import {
  ABOUT_HELLO,
  ABOUT_MANIFESTO,
  ABOUT_REEL_LABEL,
  ABOUT_SERVICES,
  ABOUT_WORD,
  aboutGifsFromProjects,
  aboutMediaFromProjects,
  shippedFromProjects,
} from '../../lib/aboutContent.js';
import { AugeChrome } from '../chrome/AugeChrome.jsx';
import { AboutSurfaceWarp } from './AboutSurfaceWarp.jsx';
import { AboutTypeLine } from './AboutTypeLine.jsx';
import '../landing/auge-landing.css';
import './about.css';

export function AboutPage({
  projects = [],
  socialItems = [],
  emailMailto = 'mailto:satyamt5152@gmail.com',
  onHome,
  onOpenWorks,
  onOpenContact,
  onOpenProject,
}) {
  const scrollRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const [reelOpen, setReelOpen] = useState(false);
  const [ctaSwap, setCtaSwap] = useState(false);
  const [ctaIn, setCtaIn] = useState(Boolean(reducedMotion));
  const actionsRef = useRef(null);
  const media = useMemo(() => aboutMediaFromProjects(projects), [projects]);
  const gifs = useMemo(() => aboutGifsFromProjects(projects), [projects]);
  const shipped = useMemo(() => shippedFromProjects(projects), [projects]);
  const reel = media[0] || null;
  const contentKey = `type-hero-5-live-us-cta-${shipped.length}-${gifs.map((g) => g?.src || '').join('|')}`;
  const ctaEase = [0.16, 1, 0.3, 1];

  useEffect(() => {
    if (!reelOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setReelOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reelOpen]);

  // Same Lenis inertia as project detail
  useEffect(() => {
    const root = scrollRef.current;
    const content = root?.firstElementChild;
    if (!root || !(content instanceof HTMLElement) || reducedMotion) return undefined;

    const lenis = new Lenis({
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
    root.classList.add('about-page__scroll--smooth');

    return () => {
      root.classList.remove('about-page__scroll--smooth');
      lenis.destroy();
    };
  }, [reducedMotion]);

  // Lenis breaks Framer whileInView — IO against the About scroller
  useEffect(() => {
    if (reducedMotion) {
      setCtaIn(true);
      return undefined;
    }
    const root = scrollRef.current;
    const target = actionsRef.current;
    if (!root || !target) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setCtaIn(true);
          io.disconnect();
        }
      },
      { root, threshold: 0.35 }
    );
    io.observe(target);
    return () => io.disconnect();
  }, [reducedMotion]);

  return createPortal(
    <div className="about-page">
      <div className="about-page__scroll" ref={scrollRef}>
        <div className="about-page__scroll-inner">
        <section className="about-hero" aria-label="Introduction">
          <h1 className="about-hero__word">{ABOUT_WORD}</h1>
          <div className="about-hero__story">
            <p className="about-kicker">
              <ScrambleHover text={ABOUT_HELLO} />
            </p>
            <AboutTypeLine media={gifs} />
            <button
              type="button"
              className="about-reel about-kicker"
              onClick={() => {
                playSound('clickMenuItem');
                setReelOpen(true);
              }}
            >
              <ScrambleHover text={ABOUT_REEL_LABEL} />
            </button>
          </div>
        </section>

        <section className="about-band about-band--cream about-us" aria-labelledby="about-us-title">
          <div className="about-us__intro">
            <p className="about-kicker about-kicker--left" id="about-us-title">
              <ScrambleHover text="About us" />
            </p>
            <p className="about-us__copy">{ABOUT_MANIFESTO}</p>
          </div>
          <div className="about-us__aside">
            <div className="about-services">
              {ABOUT_SERVICES.map((group) => (
                <div className="about-service" key={group.title}>
                  <h3>
                    <ScrambleHover text={group.title} />
                  </h3>
                  {group.items.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="about-us__cta"
              onPointerEnter={() => playHoverSound('hoverButton')}
              onClick={() => {
                playSound('clickMenuItem');
                onOpenWorks?.();
              }}
            >
              View all Projects
            </button>
          </div>
        </section>

        <section className="about-band about-band--cream about-shipped" aria-labelledby="about-shipped-title">
          <div className="about-shipped__head">
            <p className="about-kicker about-kicker--left" id="about-shipped-title">
              <ScrambleHover text="Shipped" />
            </p>
            <p className="about-shipped__count">{String(shipped.length).padStart(2, '0')}</p>
          </div>
          <ul className="about-shipped__list">
            {shipped.map((row) => (
              <li key={row.slug || row.name}>
                <button
                  type="button"
                  className="about-shipped__row"
                  onClick={() => {
                    const index = projects.findIndex((project) => project.slug === row.slug);
                    playSound('clickProject');
                    if (index >= 0 && onOpenProject) onOpenProject(index);
                    else onOpenWorks?.();
                  }}
                >
                  <span>{row.year}</span>
                  <span className="about-shipped__name">{row.name}</span>
                  <span className="about-shipped__detail">{row.detail}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section
          ref={actionsRef}
          className={`about-actions${ctaIn ? ' is-cta-in' : ''}${ctaSwap ? ' is-cta-swap' : ''}`}
          aria-label="Next steps"
        >
          <motion.a
            className="about-cta about-cta--primary"
            href={emailMailto}
            initial={false}
            animate={reducedMotion || ctaIn ? { x: 0 } : { x: '-42%' }}
            transition={{ duration: 0.95, ease: ctaEase, delay: ctaIn ? 0.04 : 0 }}
            onPointerEnter={() => playHoverSound('hoverButton')}
            onClick={() => playSound('clickMenuItem')}
          >
            <span className="about-cta__mask about-cta__mask--back" aria-hidden />
            <span className="about-cta__label">
              <ScrambleHover text="Get in Touch" />
            </span>
            <span className="about-cta__arrow" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7 17L17 7M17 7H9M17 7V15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="about-cta__mask about-cta__mask--blend" aria-hidden />
          </motion.a>
          <motion.button
            type="button"
            className="about-cta about-cta--secondary"
            initial={false}
            animate={reducedMotion || ctaIn ? { x: 0 } : { x: '42%' }}
            transition={{ duration: 0.95, ease: ctaEase, delay: ctaIn ? 0.12 : 0 }}
            onPointerEnter={() => {
              playHoverSound('hoverButton');
              setCtaSwap(true);
            }}
            onPointerLeave={() => setCtaSwap(false)}
            onClick={() => {
              playSound('clickMenuItem');
              onOpenWorks?.();
            }}
          >
            <span className="about-cta__mask about-cta__mask--back" aria-hidden />
            <span className="about-cta__label">
              <ScrambleHover text="View all Projects" />
            </span>
            <span className="about-cta__mask about-cta__mask--blend" aria-hidden />
          </motion.button>
        </section>
        </div>
      </div>

      <AboutSurfaceWarp scrollRef={scrollRef} contentKey={contentKey} />

      <AugeChrome
        socialItems={socialItems}
        onHome={onHome}
        navItems={[
          { id: 'works', label: 'Works', onClick: onOpenWorks },
          { id: 'home', label: 'Home', onClick: onHome },
          { id: 'talk', label: "Let's talk", onClick: onOpenContact },
        ]}
      />

      {reelOpen && reel ? (
        <button
          type="button"
          className="about-showreel"
          onClick={() => setReelOpen(false)}
          aria-label="Close showreel"
        >
          {reel.kind === 'video' ? (
            <video src={reel.src} poster={reel.poster} autoPlay muted loop playsInline />
          ) : (
            <img src={reel.src} alt="" />
          )}
          <p className="about-showreel__hint">Close</p>
        </button>
      ) : null}
    </div>,
    document.body
  );
}
